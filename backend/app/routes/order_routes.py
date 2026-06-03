import random
import string
import openpyxl
import queue
import json
import math
from io import BytesIO
from flask import Blueprint, request, jsonify, Response
from app.extensions import db
from app.models import DonHang, LichSu_TrangThai, DoiSoat, KhoaAPI, NguoiDung, ChiNhanh, TongKho
from app.utils.security import require_auth, require_role, require_api_key
from app.services.osrm_service import get_smart_distance, optimize_multistop_path, geocode_address, calculate_osrm_distance
from app.services.finance_service import calculate_shipping_fee, calculate_final_payout, calculate_insurance_fee, calculate_volumetric_weight
from datetime import datetime
import threading
import requests

sse_listeners = []

def broadcast_event(event_type, payload):
    global sse_listeners
    active_listeners = []
    for q in sse_listeners:
        try:
            q.put({"event": event_type, "data": payload})
            active_listeners.append(q)
        except Exception:
            pass
    sse_listeners = active_listeners

order_bp = Blueprint('order', __name__)

def generate_order_id(is_individual=False):
    suffix = ''.join(random.choices(string.digits, k=6))
    if is_individual:
        return f"AG-IND-{suffix}"
    return f"AG-{suffix}"

def calculate_haversine(lat1, lon1, lat2, lon2):
    R = 6371.0 # Bán kính Trái Đất tính bằng km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def find_closest_branch(lat, lon):
    if lat is None or lon is None:
        return ChiNhanh.query.first()
    
    branches = ChiNhanh.query.all()
    if not branches:
        return None
        
    closest_branch = None
    min_dist = float('inf')
    
    for b in branches:
        dist = calculate_haversine(float(lat), float(lon), float(b.ViDo), float(b.KinhDo))
        if dist < min_dist:
            min_dist = dist
            closest_branch = b
            
    return closest_branch

def calculate_5point_distance(lat_s, lon_s, lat_r, lon_r):
    branch_o = find_closest_branch(lat_s, lon_s)
    branch_d = find_closest_branch(lat_r, lon_r)
    
    if not branch_o or not branch_d:
        return 10.5
        
    hub_o = TongKho.query.get(branch_o.MaTongKhoLienKet)
    hub_d = TongKho.query.get(branch_d.MaTongKhoLienKet)
    
    if not hub_o or not hub_d:
        return 10.5
        
    # Đo các chặng đi:
    # 1. Shop -> Chi nhánh gửi
    d1 = calculate_osrm_distance(lat_s, lon_s, float(branch_o.ViDo), float(branch_o.KinhDo)) or 5.0
    # 2. Chi nhánh gửi -> Tổng kho gửi
    d2 = calculate_osrm_distance(float(branch_o.ViDo), float(branch_o.KinhDo), float(hub_o.ViDo), float(hub_o.KinhDo)) or 20.0
    # 3. Tổng kho gửi -> Tổng kho nhận (Nếu khác vùng miền)
    d3 = 0.0
    if hub_o.MaTongKho != hub_d.MaTongKho:
        d3 = calculate_osrm_distance(float(hub_o.ViDo), float(hub_o.KinhDo), float(hub_d.ViDo), float(hub_d.KinhDo)) or 300.0
    # 4. Tổng kho nhận -> Chi nhánh nhận
    d4 = calculate_osrm_distance(float(hub_d.ViDo), float(hub_d.KinhDo), float(branch_d.ViDo), float(branch_d.KinhDo)) or 20.0
    # 5. Chi nhánh nhận -> Khách nhận
    d5 = calculate_osrm_distance(float(branch_d.ViDo), float(branch_d.KinhDo), lat_r, lon_r) or 5.0
    
    total_dist = d1 + d2 + d3 + d4 + d5
    return round(total_dist, 2)

def trigger_webhook_async(url, payload):
    try:
        requests.post(url, json=payload, timeout=5)
    except:
        pass

@order_bp.route('/calculate', methods=['POST'])
def calculate_fee():
    data = request.json or {}
    
    sender_addr = data.get('sender_address', '')
    receiver_addr = data.get('receiver_address', '')
    
    lat_s = data.get('sender_lat')
    lon_s = data.get('sender_lng')
    if lat_s is None or lon_s is None:
        lat_s, lon_s = geocode_address(sender_addr)
    else:
        lat_s = float(lat_s)
        lon_s = float(lon_s)
        
    lat_r = data.get('receiver_lat')
    lon_r = data.get('receiver_lng')
    if lat_r is None or lon_r is None:
        lat_r, lon_r = geocode_address(receiver_addr)
    else:
        lat_r = float(lat_r)
        lon_r = float(lon_r)
    
    is_s_vn = not lat_s or (8.5 <= lat_s <= 23.5 and 102.0 <= lon_s <= 110.0)
    is_r_vn = not lat_r or (8.5 <= lat_r <= 23.5 and 102.0 <= lon_r <= 110.0)
    
    if not is_s_vn or not is_r_vn:
        return jsonify({
            "success": False,
            "message": "Antigravity Express chỉ hỗ trợ giao hàng trong phạm vi lãnh thổ Việt Nam!"
        }), 400

    if lat_s and lon_s and lat_r and lon_r:
        direct_dist = calculate_haversine(lat_s, lon_s, lat_r, lon_r)
        if direct_dist < 10.0:
            dist = direct_dist
        else:
            dist = calculate_5point_distance(lat_s, lon_s, lat_r, lon_r)
    else:
        dist = get_smart_distance(sender_addr, receiver_addr, lat_gui=lat_s, lon_gui=lon_s, lat_nhan=lat_r, lon_nhan=lon_r)
    
    length = int(data.get('length_cm', 0))
    width = int(data.get('width_cm', 0))
    height = int(data.get('height_cm', 0))
    actual_weight = int(data.get('weight_gram', 0))
    
    vol_weight = calculate_volumetric_weight(length, width, height)
    # Apply standard chargeable weight check
    chargeable_weight = max(actual_weight, vol_weight) if (length + width + height) >= 100 else actual_weight
    
    fee = calculate_shipping_fee(dist, actual_weight, length, width, height)
    
    declared_value = float(data.get('declared_value', 0))
    insurance = calculate_insurance_fee(declared_value)
    
    return jsonify({"success": True, "data": {
        "distance_km": dist, 
        "chargeable_weight": chargeable_weight,
        "shipping_fee": fee,
        "insurance_fee": insurance
    }})

@order_bp.route('/', methods=['POST'])
@require_auth
@require_role(['KHACHHANG'])
def create_order():
    data = request.json or {}
    order_id = generate_order_id()
    
    sender_addr = data.get('sender_address', '')
    receiver_addr = data.get('receiver_address', '')
    
    lat_s = data.get('sender_lat')
    lon_s = data.get('sender_lng')
    if lat_s is None or lon_s is None:
        lat_s, lon_s = geocode_address(sender_addr)
    else:
        lat_s = float(lat_s)
        lon_s = float(lon_s)
        
    lat_r = data.get('receiver_lat')
    lon_r = data.get('receiver_lng')
    if lat_r is None or lon_r is None:
        lat_r, lon_r = geocode_address(receiver_addr)
    else:
        lat_r = float(lat_r)
        lon_r = float(lon_r)
    
    is_s_vn = not lat_s or (8.5 <= lat_s <= 23.5 and 102.0 <= lon_s <= 110.0)
    is_r_vn = not lat_r or (8.5 <= lat_r <= 23.5 and 102.0 <= lon_r <= 110.0)
    
    if not is_s_vn or not is_r_vn:
        return jsonify({
            "success": False,
            "message": "Antigravity Express chỉ hỗ trợ giao hàng trong phạm vi lãnh thổ Việt Nam!"
        }), 400

    # Kích thước & Khối lượng
    length = int(data.get('length_cm', 0))
    width = int(data.get('width_cm', 0))
    height = int(data.get('height_cm', 0))
    actual_weight = int(data.get('weight_gram', 0))
    vol_weight = calculate_volumetric_weight(length, width, height)
    chargeable_weight = max(actual_weight, vol_weight) if (length + width + height) >= 100 else actual_weight
    
    # Tính cước & bảo hiểm
    if lat_s and lon_s and lat_r and lon_r:
        direct_dist = calculate_haversine(lat_s, lon_s, lat_r, lon_r)
        if direct_dist < 10.0:
            dist = direct_dist
        else:
            dist = calculate_5point_distance(lat_s, lon_s, lat_r, lon_r)
    else:
        dist = get_smart_distance(sender_addr, receiver_addr, lat_gui=lat_s, lon_gui=lon_s, lat_nhan=lat_r, lon_nhan=lon_r)
        
    fee = calculate_shipping_fee(dist, actual_weight, length, width, height)
    declared_value = float(data.get('declared_value', 0))
    insurance = calculate_insurance_fee(declared_value)

    # 1. Tìm Chi nhánh gửi/nhận gần nhất bằng Haversine
    branch_o = find_closest_branch(lat_s, lon_s)
    branch_d = find_closest_branch(lat_r, lon_r)
    
    # 2. Xác định các Tổng kho tương ứng để vẽ lộ trình
    hub_path = []
    hub_o = TongKho.query.get(branch_o.MaTongKhoLienKet) if branch_o else None
    hub_d = TongKho.query.get(branch_d.MaTongKhoLienKet) if branch_d else None
    
    if dist < 10.0:
        if branch_o:
            hub_path.append(f"Giao trực tiếp (Chi nhánh {branch_o.TenChiNhanh})")
        else:
            hub_path.append("Giao trực tiếp")
    else:
        if branch_o and hub_o:
            hub_path.append(branch_o.TenChiNhanh)
            hub_path.append(hub_o.TenTongKho)
            if branch_d and hub_d:
                if hub_o.MaTongKho != hub_d.MaTongKho:
                    hub_path.append(hub_d.TenTongKho)
                hub_path.append(branch_d.TenChiNhanh)
        else:
            hub_path.append("Kho Trung Chuyển Miền Bắc (Từ Sơn, Bắc Ninh)")

    # Tạo Order
    order = DonHang(
        MaDonHang=order_id,
        MaNguoiGui=request.user_id,
        MaGoi=data.get('service_package_id', 1), # Mặc định 1: Standard
        TenNguoiNhan=data['receiver_name'],
        SoDienThoaiNhan=data['receiver_phone'],
        DiaChiNhan=data['receiver_address'],
        ViDoNhan=lat_r,
        KinhDoNhan=lon_r,
        
        # Lưu thông tin gửi
        DiaChiGui=sender_addr,
        ViDoGui=lat_s,
        KinhDoGui=lon_s,
        
        TrongLuongGram=actual_weight,
        ChieuDaiCM=length,
        ChieuRongCM=width,
        ChieuCaoCM=height,
        TrongLuongQuyDoiGram=vol_weight if (length + width + height) >= 100 else 0,
        MoTaHangHoa=data.get('description', 'Hàng hóa thông thường'),
        GiaTriKhaiBao=declared_value,
        PhiBaoHiem=insurance,
        KhoangCachKm=dist,
        PhiVanChuyen=fee,
        TienThuHoCOD=float(data.get('cod_amount', 0)),
        QuyenKiemTra=data.get('inspection_policy', 'KHONG_XEM'),
        HinhThucLayHang=data.get('pickup_type', 'TU_MANG_RA_BUU_CUC'),
        TrangThaiHienTai='CHO_THANH_TOAN' if float(data.get('cod_amount', 0)) == 0 else 'CHO_LAY_HANG',
        TrangThaiThanhToan='CHUA_THANH_TOAN',
        
        # Lưu chi nhánh gửi/nhận
        MaChiNhanhGui=branch_o.MaChiNhanh if branch_o else None,
        MaChiNhanhNhan=branch_d.MaChiNhanh if branch_d else None
    )
    db.session.add(order)

    # Khởi tạo log TrackingHistory
    is_non_cod = (float(data.get('cod_amount', 0)) == 0)
    initial_status = 'CHO_THANH_TOAN' if is_non_cod else 'CHO_LAY_HANG'
    
    if is_non_cod:
        initial_location = f"Đơn hàng khởi tạo thành công, đang chờ thanh toán trực tuyến qua Momo (Lộ trình định tuyến: Khách gửi ➡️ {' ➡️ '.join(hub_path)} ➡️ Khách nhận)"
    else:
        initial_location = f"Đơn hàng khởi tạo thành công (Lộ trình định tuyến: Khách gửi ➡️ {' ➡️ '.join(hub_path)} ➡️ Khách nhận)"
        
    log = LichSu_TrangThai(
        MaDonHang=order_id,
        MaTrangThai=initial_status,
        ThongTinViTri=initial_location,
        MaNhanVienCapNhat=request.user_id 
    )
    db.session.add(log)
    db.session.commit()

    response_data = {
        "order_id": order_id, 
        "shipping_fee": fee,
        "status": initial_status
    }
    if is_non_cod:
        response_data["payment_url"] = f"/api/payment/simulate-checkout/{order_id}"

    return jsonify({"success": True, "message": "Tạo đơn thành công", "data": response_data}), 201

@order_bp.route('/guest', methods=['POST'])
def create_guest_order():
    data = request.json or {}
    order_id = generate_order_id(is_individual=True)
    
    sender_name = data.get('sender_name', '')
    sender_phone = data.get('sender_phone', '')
    sender_addr = data.get('sender_address', '')
    
    receiver_name = data.get('receiver_name', '')
    receiver_phone = data.get('receiver_phone', '')
    receiver_addr = data.get('receiver_address', '')
    
    lat_s = data.get('sender_lat')
    lon_s = data.get('sender_lng')
    if lat_s is None or lon_s is None:
        lat_s, lon_s = geocode_address(sender_addr)
    else:
        lat_s = float(lat_s)
        lon_s = float(lon_s)
        
    lat_r = data.get('receiver_lat')
    lon_r = data.get('receiver_lng')
    if lat_r is None or lon_r is None:
        lat_r, lon_r = geocode_address(receiver_addr)
    else:
        lat_r = float(lat_r)
        lon_r = float(lon_r)
    
    is_s_vn = not lat_s or (8.5 <= lat_s <= 23.5 and 102.0 <= lon_s <= 110.0)
    is_r_vn = not lat_r or (8.5 <= lat_r <= 23.5 and 102.0 <= lon_r <= 110.0)
    
    if not is_s_vn or not is_r_vn:
        return jsonify({
            "success": False,
            "message": "Antigravity Express chỉ hỗ trợ giao hàng trong phạm vi lãnh thổ Việt Nam!"
        }), 400

    # Kích thước & Khối lượng
    length = int(data.get('length_cm', 10))
    width = int(data.get('width_cm', 10))
    height = int(data.get('height_cm', 10))
    actual_weight = int(data.get('weight_gram', 1000))
    vol_weight = calculate_volumetric_weight(length, width, height)
    chargeable_weight = max(actual_weight, vol_weight) if (length + width + height) >= 100 else actual_weight
    
    # Tính cước & bảo hiểm
    if lat_s and lon_s and lat_r and lon_r:
        direct_dist = calculate_haversine(lat_s, lon_s, lat_r, lon_r)
        if direct_dist < 10.0:
            dist = direct_dist
        else:
            dist = calculate_5point_distance(lat_s, lon_s, lat_r, lon_r)
    else:
        dist = get_smart_distance(sender_addr, receiver_addr, lat_gui=lat_s, lon_gui=lon_s, lat_nhan=lat_r, lon_nhan=lon_r)
        
    fee = calculate_shipping_fee(dist, actual_weight, length, width, height)
    declared_value = float(data.get('declared_value', 0))
    insurance = calculate_insurance_fee(declared_value)

    # 1. Tìm Chi nhánh gửi/nhận gần nhất bằng Haversine
    branch_o = find_closest_branch(lat_s, lon_s)
    branch_d = find_closest_branch(lat_r, lon_r)
    
    # 2. Xác định các Tổng kho tương ứng để vẽ lộ trình
    hub_path = []
    hub_o = TongKho.query.get(branch_o.MaTongKhoLienKet) if branch_o else None
    hub_d = TongKho.query.get(branch_d.MaTongKhoLienKet) if branch_d else None
    
    if dist < 10.0:
        if branch_o:
            hub_path.append(f"Giao trực tiếp (Chi nhánh {branch_o.TenChiNhanh})")
        else:
            hub_path.append("Giao trực tiếp")
    else:
        if branch_o and hub_o:
            hub_path.append(branch_o.TenChiNhanh)
            hub_path.append(hub_o.TenTongKho)
            if branch_d and hub_d:
                if hub_o.MaTongKho != hub_d.MaTongKho:
                    hub_path.append(hub_d.TenTongKho)
                hub_path.append(branch_d.TenChiNhanh)
        else:
            hub_path.append("Kho Trung Chuyển Miền Bắc (Từ Sơn, Bắc Ninh)")

    # Lấy tài khoản khách lẻ mặc định
    guest_user = NguoiDung.query.filter_by(TenDangNhap="khach_le").first()
    guest_user_id = guest_user.MaNguoiDung if guest_user else 1

    # Tạo Order
    order = DonHang(
        MaDonHang=order_id,
        MaNguoiGui=guest_user_id,
        MaGoi=data.get('service_package_id', 1), # Mặc định 1: Standard
        
        # Điền thông tin người gửi lẻ trực tiếp
        TenNguoiGui=sender_name,
        SoDienThoaiGui=sender_phone,
        DiaChiGui=sender_addr,
        ViDoGui=lat_s,
        KinhDoGui=lon_s,
        
        TenNguoiNhan=receiver_name,
        SoDienThoaiNhan=receiver_phone,
        DiaChiNhan=receiver_addr,
        ViDoNhan=lat_r,
        KinhDoNhan=lon_r,
        TrongLuongGram=actual_weight,
        ChieuDaiCM=length,
        ChieuRongCM=width,
        ChieuCaoCM=height,
        TrongLuongQuyDoiGram=vol_weight if (length + width + height) >= 100 else 0,
        MoTaHangHoa=data.get('description', 'Hàng hóa thông thường'),
        GiaTriKhaiBao=declared_value,
        PhiBaoHiem=insurance,
        KhoangCachKm=dist,
        PhiVanChuyen=fee,
        TienThuHoCOD=float(data.get('cod_amount', 0)),
        QuyenKiemTra=data.get('inspection_policy', 'KHONG_XEM'),
        HinhThucLayHang=data.get('pickup_type', 'TU_MANG_RA_BUU_CUC'),
        TrangThaiHienTai='CHO_THANH_TOAN', # Luôn khóa chờ thanh toán trước
        TrangThaiThanhToan='CHUA_THANH_TOAN',
        
        # Lưu chi nhánh gửi/nhận
        MaChiNhanhGui=branch_o.MaChiNhanh if branch_o else None,
        MaChiNhanhNhan=branch_d.MaChiNhanh if branch_d else None
    )
    db.session.add(order)

    # Khởi tạo log TrackingHistory
    initial_location = f"Đơn hàng cá nhân khởi tạo thành công, đang chờ thanh toán trực tuyến (Lộ trình định tuyến: Khách gửi ➡️ {' ➡️ '.join(hub_path)} ➡️ Khách nhận)"
        
    log = LichSu_TrangThai(
        MaDonHang=order_id,
        MaTrangThai='CHO_THANH_TOAN',
        ThongTinViTri=initial_location,
        MaNhanVienCapNhat=guest_user_id 
    )
    db.session.add(log)
    db.session.commit()

    # Xác định loại phương thức thanh toán
    payment_method = data.get('payment_method', 'momo')
    
    response_data = {
        "order_id": order_id, 
        "shipping_fee": fee,
        "status": "CHO_THANH_TOAN",
        "payment_url": f"/api/payment/simulate-checkout/{order_id}?method={payment_method}"
    }

    return jsonify({"success": True, "message": "Tạo đơn khách lẻ thành công", "data": response_data}), 201

@order_bp.route('/', methods=['GET'])
@require_auth
def get_orders():
    if request.user_role == 'KHACHHANG':
        orders = DonHang.query.filter_by(MaNguoiGui=request.user_id).order_by(DonHang.NgayTao.desc()).all()
    elif request.user_role in ['SHIPPER', 'KHO']:
        orders = DonHang.query.filter(DonHang.TrangThaiHienTai != 'CHO_THANH_TOAN').order_by(DonHang.NgayTao.desc()).all()
    else:  # QUANTRI / ADMIN / HR / KETOAN / CSKH
        from app.models import NguoiDung, ChiNhanh
        current_user = NguoiDung.query.get(request.user_id)
        query = DonHang.query
        if current_user:
            if current_user.MaChiNhanh is not None:
                query = query.filter((DonHang.MaChiNhanhGui == current_user.MaChiNhanh) | (DonHang.MaChiNhanhNhan == current_user.MaChiNhanh))
            elif current_user.MaTongKho is not None:
                linked_branches = db.session.query(ChiNhanh.MaChiNhanh).filter(ChiNhanh.MaTongKhoLienKet == current_user.MaTongKho).all()
                linked_branch_ids = [b[0] for b in linked_branches]
                query = query.filter((DonHang.MaChiNhanhGui.in_(linked_branch_ids)) | (DonHang.MaChiNhanhNhan.in_(linked_branch_ids)))
        orders = query.order_by(DonHang.NgayTao.desc()).all()

    data = [{
        "order_id": o.MaDonHang,
        "receiver": o.TenNguoiNhan,
        "fee": float(o.PhiVanChuyen),
        "cod": float(o.TienThuHoCOD),
        "status": o.TrangThaiHienTai,
        "created_at": o.NgayTao.isoformat(),
        
        # Vietnamese keys for MerchantOrders.jsx matching
        "MaDonHang": o.MaDonHang,
        "TenNguoiNhan": o.TenNguoiNhan,
        "SoDienThoaiNhan": o.SoDienThoaiNhan,
        "DiaChiNhan": o.DiaChiNhan,
        "PhiVanChuyen": float(o.PhiVanChuyen),
        "TienThuHoCOD": float(o.TienThuHoCOD),
        "TrangThaiHienTai": o.TrangThaiHienTai,
        "NgayTao": o.NgayTao.isoformat()
    } for o in orders]

    return jsonify({"success": True, "data": data})

@order_bp.route('/<order_id>/status', methods=['PUT'])
@require_auth
@require_role(['ADMIN', 'QUANTRI', 'CSKH', 'HR', 'KETOAN'])
def update_status(order_id):
    data = request.json
    new_status = data.get('status')
    location_info = data.get('location_info', '')

    order = DonHang.query.get(order_id)
    if not order:
        return jsonify({"success": False, "message": "Không tìm thấy Mã Vận Đơn!"}), 404

    order.TrangThaiHienTai = new_status
    
    log = LichSu_TrangThai(
        MaDonHang=order_id,
        MaTrangThai=new_status,
        ThongTinViTri=location_info,
        MaNhanVienCapNhat=request.user_id
    )
    db.session.add(log)

    # Chuyển trạng thái GIAO_THANH_CONG -> tự động gen Reconciliations
    if new_status == 'GIAO_THANH_CONG':
        recon = DoiSoat(
            MaDonHang=order_id,
            MaKhachHang=order.MaNguoiGui,
            TongTienThu=order.TienThuHoCOD,
            PhiVanChuyenTru=order.PhiVanChuyen,
            ThucNhan=calculate_final_payout(order.TienThuHoCOD, order.PhiVanChuyen),
            TrangThaiDoiSoat='CHUA_THANH_TOAN'
        )
        db.session.add(recon)

    db.session.commit()

    # Đoạn mô phỏng Trigger async Webhook (Nếu đơn thuộc về PARTNER)
    # Tạm check bằng role if needed
    # ...

    return jsonify({"success": True, "message": "Cập nhật trạng thái thành công"})

@order_bp.route('/bulk-excel', methods=['POST'])
@require_auth
@require_role(['KHACHHANG', 'DOITAC'])
def upload_excel():
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "Không có file"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "message": "File rỗng"}), 400

    try:
        workbook = openpyxl.load_workbook(file)
        sheet = workbook.active
        inserted_orders = []

        # Giả định Cột: A: Người Nhận, B: SĐT, C: Địa Chỉ, D: Khối Lượng, E: Tiền COD
        for row in sheet.iter_rows(min_row=2, values_only=True): # Bỏ qua header
            receiver, phone, address, weight, cod = row[:5]
            if not receiver:
                break
                
            dist = get_smart_distance("Trụ sở mặc định", address)
            fee = calculate_shipping_fee(dist, int(weight or 0))
            oid = generate_order_id()

            o = DonHang(
                MaDonHang=oid,
                MaNguoiGui=request.user_id,
                TenNguoiNhan=str(receiver),
                SoDienThoaiNhan=str(phone),
                DiaChiNhan=str(address),
                TrongLuongGram=int(weight or 0),
                KhoangCachKm=dist,
                PhiVanChuyen=fee,
                TienThuHoCOD=float(cod or 0),
                TrangThaiHienTai='CHO_LAY_HANG'
            )
            db.session.add(o)
            
            inserted_orders.append(oid)
            
        db.session.commit()
        return jsonify({"success": True, "message": f"Tạo thành công {len(inserted_orders)} đơn hàng", "data": inserted_orders})

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Lỗi parse excel: {str(e)}"}), 500

@order_bp.route('/calculate-multistop', methods=['POST'])
@require_auth
def calculate_multistop_fee():
    data = request.json or {}
    sender_address = data.get('sender_address')
    receivers = data.get('receivers', [])
    
    if not sender_address or not receivers:
        return jsonify({"success": False, "message": "Thiếu thông tin người gửi hoặc danh sách người nhận!"}), 400

    receiver_addresses = [r.get('receiver_address') for r in receivers]
    
    sender_coords = None
    if 'sender_lat' in data and 'sender_lng' in data:
        sender_coords = (float(data['sender_lat']), float(data['sender_lng']))
        
    receiver_coords = []
    for r in receivers:
        r_lat = r.get('receiver_lat')
        r_lng = r.get('receiver_lng')
        if r_lat is not None and r_lng is not None:
            receiver_coords.append((float(r_lat), float(r_lng)))
        else:
            receiver_coords.append(None)
            
    opt_indices, leg_distances = optimize_multistop_path(
        sender_address, 
        receiver_addresses, 
        sender_coords=sender_coords, 
        receiver_coords=receiver_coords
    )
    
    optimized_receivers = []
    total_shipping_fee = 0.0
    total_insurance_fee = 0.0
    
    for leg_idx, opt_idx in enumerate(opt_indices):
        rec_data = receivers[opt_idx]
        leg_dist = leg_distances[leg_idx]
        
        length = int(rec_data.get('length_cm', 0))
        width = int(rec_data.get('width_cm', 0))
        height = int(rec_data.get('height_cm', 0))
        actual_weight = int(rec_data.get('weight_gram', 0))
        vol_weight = calculate_volumetric_weight(length, width, height)
        chargeable_weight = max(actual_weight, vol_weight) if (length + width + height) >= 100 else actual_weight
        
        std_fee = calculate_shipping_fee(leg_dist, actual_weight, length, width, height)
        discounted_fee = std_fee if leg_idx == 0 else round(std_fee * 0.7, 2)
        
        declared_val = float(rec_data.get('declared_value', 0))
        insurance = calculate_insurance_fee(declared_val)
        
        optimized_receivers.append({
            "original_index": opt_idx,
            "receiver_name": rec_data.get('receiver_name'),
            "receiver_phone": rec_data.get('receiver_phone'),
            "receiver_address": rec_data.get('receiver_address'),
            "distance_km": leg_dist,
            "chargeable_weight": chargeable_weight,
            "standard_fee": std_fee,
            "shipping_fee": discounted_fee,
            "insurance_fee": insurance,
            "cod_amount": float(rec_data.get('cod_amount', 0)),
            "description": rec_data.get('description', '')
        })
        
        total_shipping_fee += discounted_fee
        total_insurance_fee += insurance

    return jsonify({
        "success": True,
        "data": {
            "optimized_receivers": optimized_receivers,
            "total_shipping_fee": total_shipping_fee,
            "total_insurance_fee": total_insurance_fee,
            "total_fee": total_shipping_fee + total_insurance_fee
        }
    })

@order_bp.route('/multistop', methods=['POST'])
@require_auth
@require_role(['KHACHHANG'])
def create_multistop_order():
    data = request.json or {}
    sender_address = data.get('sender_address')
    receivers = data.get('receivers', [])
    
    if not sender_address or not receivers:
        return jsonify({"success": False, "message": "Thiếu thông tin người gửi hoặc danh sách người nhận!"}), 400

    receiver_addresses = [r.get('receiver_address') for r in receivers]
    
    sender_coords = None
    if 'sender_lat' in data and 'sender_lng' in data:
        sender_coords = (float(data['sender_lat']), float(data['sender_lng']))
        
    receiver_coords = []
    for r in receivers:
        r_lat = r.get('receiver_lat')
        r_lng = r.get('receiver_lng')
        if r_lat is not None and r_lng is not None:
            receiver_coords.append((float(r_lat), float(r_lng)))
        else:
            receiver_coords.append(None)
            
    opt_indices, leg_distances = optimize_multistop_path(
        sender_address, 
        receiver_addresses, 
        sender_coords=sender_coords, 
        receiver_coords=receiver_coords
    )
    
    created_order_ids = []
    total_fee = 0.0
    
    for leg_idx, opt_idx in enumerate(opt_indices):
        rec_data = receivers[opt_idx]
        leg_dist = leg_distances[leg_idx]
        
        length = int(rec_data.get('length_cm', 0))
        width = int(rec_data.get('width_cm', 0))
        height = int(rec_data.get('height_cm', 0))
        actual_weight = int(rec_data.get('weight_gram', 0))
        vol_weight = calculate_volumetric_weight(length, width, height)
        chargeable_weight = max(actual_weight, vol_weight) if (length + width + height) >= 100 else actual_weight
        
        std_fee = calculate_shipping_fee(leg_dist, actual_weight, length, width, height)
        discounted_fee = std_fee if leg_idx == 0 else round(std_fee * 0.7, 2)
        
        declared_val = float(rec_data.get('declared_value', 0))
        insurance = calculate_insurance_fee(declared_val)
        
        order_id = generate_order_id()
        
        lat_r, lon_r = None, None
        if receiver_coords and opt_idx < len(receiver_coords) and receiver_coords[opt_idx]:
            lat_r, lon_r = receiver_coords[opt_idx]
        if lat_r is None or lon_r is None:
            lat_r, lon_r = geocode_address(rec_data['receiver_address'])
            
        order = DonHang(
            MaDonHang=order_id,
            MaNguoiGui=request.user_id,
            MaGoi=data.get('service_package_id', 1),
            TenNguoiNhan=rec_data['receiver_name'],
            SoDienThoaiNhan=rec_data['receiver_phone'],
            DiaChiNhan=rec_data['receiver_address'],
            ViDoNhan=lat_r,
            KinhDoNhan=lon_r,
            
            # Lưu địa chỉ và tọa độ gửi
            DiaChiGui=sender_address,
            ViDoGui=sender_coords[0] if sender_coords else None,
            KinhDoGui=sender_coords[1] if sender_coords else None,
            
            TrongLuongGram=actual_weight,
            ChieuDaiCM=length,
            ChieuRongCM=width,
            ChieuCaoCM=height,
            TrongLuongQuyDoiGram=vol_weight if (length + width + height) >= 100 else 0,
            MoTaHangHoa=rec_data.get('description', 'Đơn hàng đa điểm'),
            GiaTriKhaiBao=declared_val,
            PhiBaoHiem=insurance,
            KhoangCachKm=leg_dist,
            PhiVanChuyen=discounted_fee,
            TienThuHoCOD=float(rec_data.get('cod_amount', 0)),
            QuyenKiemTra=data.get('inspection_policy', 'KHONG_XEM'),
            HinhThucLayHang=data.get('pickup_type', 'TU_MANG_RA_BUU_CUC'),
            TrangThaiHienTai='CHO_LAY_HANG'
        )
        db.session.add(order)
        
        log = LichSu_TrangThai(
            MaDonHang=order_id,
            MaTrangThai='CHO_LAY_HANG',
            ThongTinViTri=f'Đơn hàng khởi tạo trong chuyến đa điểm (Chặng {leg_idx + 1})',
            MaNhanVienCapNhat=request.user_id
        )
        db.session.add(log)
        
        created_order_ids.append(order_id)
        total_fee += (discounted_fee + insurance)
        
    db.session.commit()
    
    return jsonify({
        "success": True,
        "message": f"Tạo thành công {len(created_order_ids)} vận đơn trong chuyến đi tối ưu!",
        "data": {
            "order_ids": created_order_ids,
            "total_fee": total_fee
        }
    }), 201

@order_bp.route('/<order_id>/assign', methods=['PUT'])
@require_auth
@require_role(['ADMIN', 'QUANTRI', 'HR', 'CSKH'])
def assign_shipper(order_id):
    data = request.json
    shipper_id = data.get('shipper_id')
    
    if not shipper_id:
        return jsonify({"success": False, "message": "Thiếu mã nhân viên shipper!"}), 400
        
    shipper = NguoiDung.query.get(shipper_id)
    if not shipper or shipper.VaiTro not in ['NHANVIEN', 'SHIPPER']:
        return jsonify({"success": False, "message": "Nhân viên không tồn tại hoặc không phải là Shipper!"}), 400
        
    order = DonHang.query.get(order_id)
    if not order:
        return jsonify({"success": False, "message": "Không tìm thấy đơn hàng!"}), 404
        
    # Check dynamic shipper daily limit
    start_of_today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    assigned_today_count = DonHang.query.filter(
        DonHang.MaNhanVienGiao == shipper_id,
        DonHang.NgayTao >= start_of_today
    ).count()
    
    daily_limit = getattr(shipper, 'GioiHanDonNgay', 100)
    if assigned_today_count >= daily_limit:
        return jsonify({
            "success": False, 
            "message": f"Shipper {shipper.HoTen} đã đạt giới hạn tối đa {daily_limit} đơn giao trong ngày hôm nay!"
        }), 400

        
    order.MaNhanVienGiao = shipper_id
    
    # Log state update
    log = LichSu_TrangThai(
        MaDonHang=order_id,
        MaTrangThai=order.TrangThaiHienTai,
        ThongTinViTri=f"Đã phân công vận chuyển cho Shipper: {shipper.HoTen}",
        MaNhanVienCapNhat=request.user_id
    )
    db.session.add(log)
    db.session.commit()
    
    # Broadcast realtime event for order assignment
    broadcast_event("order_update", {
        "order_id": order.MaDonHang,
        "status": order.TrangThaiHienTai,
        "location": f"Đã phân công vận chuyển cho Shipper: {shipper.HoTen}",
        "shipper_name": shipper.HoTen,
        "updated_at": datetime.utcnow().isoformat()
    })
    
    return jsonify({
        "success": True, 
        "message": f"Phân công thành công đơn {order_id} cho Shipper {shipper.HoTen}!"
    })

@order_bp.route('/assigned', methods=['GET'])
@require_auth
@require_role(['NHANVIEN', 'SHIPPER', 'KHO'])
def get_assigned_orders():
    orders = DonHang.query.filter_by(MaNhanVienGiao=request.user_id).order_by(DonHang.NgayTao.desc()).all()
    data = [{
        "order_id": o.MaDonHang,
        "receiver_name": o.TenNguoiNhan,
        "receiver_phone": o.SoDienThoaiNhan,
        "receiver_address": o.DiaChiNhan,
        "receiver_lat": float(o.ViDoNhan) if o.ViDoNhan is not None else None,
        "receiver_lng": float(o.KinhDoNhan) if o.KinhDoNhan is not None else None,
        "sender_lat": float(o.ViDoGui) if o.ViDoGui is not None else None,
        "sender_lng": float(o.KinhDoGui) if o.KinhDoGui is not None else None,
        "fee": float(o.PhiVanChuyen),
        "cod": float(o.TienThuHoCOD),
        "status": o.TrangThaiHienTai,
        "created_at": o.NgayTao.isoformat(),
        "description": o.MoTaHangHoa,
        "distance_km": float(o.KhoangCachKm) if o.KhoangCachKm is not None else 0.0
    } for o in orders]
    return jsonify({"success": True, "data": data})

@order_bp.route('/<order_id>/staff-update', methods=['PUT'])
@require_auth
@require_role(['NHANVIEN', 'SHIPPER', 'KHO'])
def staff_update_order(order_id):
    data = request.json
    new_status = data.get('status')
    location_info = data.get('location_info', '')
    
    if not new_status:
        return jsonify({"success": False, "message": "Thiếu trạng thái cập nhật!"}), 400
        
    order = DonHang.query.get(order_id)
    if not order:
        return jsonify({"success": False, "message": "Không tìm thấy đơn hàng!"}), 404
        
    if order.MaNhanVienGiao != request.user_id:
        return jsonify({"success": False, "message": "Bạn không được phân công giao đơn hàng này!"}), 403
        
    order.TrangThaiHienTai = new_status
    
    log = LichSu_TrangThai(
        MaDonHang=order_id,
        MaTrangThai=new_status,
        ThongTinViTri=location_info,
        MaNhanVienCapNhat=request.user_id
    )
    db.session.add(log)
    
    # Nếu giao thành công, tạo đối soát
    if new_status == 'GIAO_THANH_CONG':
        recon = DoiSoat.query.filter_by(MaDonHang=order_id).first()
        if not recon:
            recon = DoiSoat(
                MaDonHang=order_id,
                MaKhachHang=order.MaNguoiGui,
                TongTienThu=order.TienThuHoCOD,
                PhiVanChuyenTru=order.PhiVanChuyen,
                PhiBaoHiemTru=order.PhiBaoHiem,
                ThucNhan=calculate_final_payout(order.TienThuHoCOD, order.PhiVanChuyen),
                TrangThaiDoiSoat='CHUA_THANH_TOAN'
            )
            db.session.add(recon)
            
    db.session.commit()
    
    # Broadcast realtime event
    broadcast_event("order_update", {
        "order_id": order.MaDonHang,
        "status": new_status,
        "location": location_info,
        "shipper_name": order.nhan_vien_giao.HoTen if order.nhan_vien_giao else "Shipper",
        "updated_at": datetime.utcnow().isoformat()
    })
    
    return jsonify({"success": True, "message": "Cập nhật trạng thái đơn hàng thành công!"})

# API Cổng Trung Chuyển (Xác nhận tới kho trung chuyển)
@order_bp.route('/<order_id>/hub-checkin', methods=['PUT'])
@require_auth
@require_role(['ADMIN', 'QUANTRI', 'NHANVIEN', 'SHIPPER', 'KHO'])
def hub_checkin(order_id):
    order = DonHang.query.get(order_id)
    if not order:
        return jsonify({"success": False, "message": "Không tìm thấy đơn hàng!"}), 404
        
    data = request.json or {}
    hub_name = data.get('hub_name', 'Kho Trung Chuyển Miền Bắc (Từ Sơn, Bắc Ninh)')
        
    order.TrangThaiHienTai = 'DEN_KHO_TRUNG_CHUYEN'
    
    log = LichSu_TrangThai(
        MaDonHang=order_id,
        MaTrangThai='DEN_KHO_TRUNG_CHUYEN',
        ThongTinViTri=f'Đã nhận bưu phẩm tại {hub_name} - Đã xác minh thông tin',
        MaNhanVienCapNhat=request.user_id
    )
    db.session.add(log)
    db.session.commit()
    
    # Broadcast realtime event
    broadcast_event("order_update", {
        "order_id": order_id,
        "status": 'DEN_KHO_TRUNG_CHUYEN',
        "location": f'Đã nhận bưu phẩm tại {hub_name}',
        "updated_at": datetime.utcnow().isoformat()
    })
    
    return jsonify({"success": True, "message": f"Xác nhận tới {hub_name} thành công!"})

# API Cổng Trung Chuyển (Xác nhận rời kho trung chuyển)
@order_bp.route('/<order_id>/hub-checkout', methods=['PUT'])
@require_auth
@require_role(['ADMIN', 'QUANTRI', 'NHANVIEN', 'SHIPPER', 'KHO'])
def hub_checkout(order_id):
    order = DonHang.query.get(order_id)
    if not order:
        return jsonify({"success": False, "message": "Không tìm thấy đơn hàng!"}), 404
        
    data = request.json or {}
    hub_name = data.get('hub_name', 'Kho Trung Chuyển Miền Bắc (Từ Sơn, Bắc Ninh)')
        
    order.TrangThaiHienTai = 'ROI_KHO_TRUNG_CHUYEN'
    
    log = LichSu_TrangThai(
        MaDonHang=order_id,
        MaTrangThai='ROI_KHO_TRUNG_CHUYEN',
        ThongTinViTri=f'Bưu phẩm đã xuất bến rời {hub_name} - Đang trung chuyển chặng chéo',
        MaNhanVienCapNhat=request.user_id
    )
    db.session.add(log)
    db.session.commit()
    
    # Broadcast realtime event
    broadcast_event("order_update", {
        "order_id": order_id,
        "status": 'ROI_KHO_TRUNG_CHUYEN',
        "location": f'Bưu phẩm đã rời {hub_name}',
        "updated_at": datetime.utcnow().isoformat()
    })
    
    return jsonify({"success": True, "message": f"Xác nhận rời {hub_name} thành công!"})

# API Lấy lịch sử Nhập/Xuất của nhân viên kho
@order_bp.route('/warehouse-history', methods=['GET'])
@require_auth
@require_role(['KHO', 'ADMIN', 'QUANTRI'])
def get_warehouse_history():
    logs = LichSu_TrangThai.query.filter_by(MaNhanVienCapNhat=request.user_id).order_by(LichSu_TrangThai.ThoiGian.desc()).all()
    data = []
    for log in logs:
        order = DonHang.query.get(log.MaDonHang)
        if order:
            data.append({
                "log_id": log.MaLichSu,
                "order_id": log.MaDonHang,
                "status": log.MaTrangThai,
                "location_info": log.ThongTinViTri,
                "time": log.ThoiGian.isoformat(),
                "receiver_name": order.TenNguoiNhan,
                "receiver_phone": order.SoDienThoaiNhan,
                "receiver_address": order.DiaChiNhan,
                "service_package": order.MoTaHangHoa or "Gói bưu phẩm",
                "created_at": order.NgayTao.isoformat()
            })
    return jsonify({"success": True, "data": data})

@order_bp.route('/<order_id>', methods=['PUT'])
@require_auth
def update_order(order_id):
    order = DonHang.query.get(order_id)
    if not order:
        return jsonify({"success": False, "message": "Không tìm thấy đơn hàng!"}), 404
        
    # Phân quyền: phải là chủ đơn hàng (Shop) hoặc admin/nhân viên điều phối
    if request.user_role == 'KHACHHANG' and order.MaNguoiGui != request.user_id:
        return jsonify({"success": False, "message": "Bạn không có quyền sửa đơn hàng này!"}), 403
        
    # Chỉ cho phép sửa đơn ở trạng thái chờ xử lý ban đầu
    if order.TrangThaiHienTai not in ['CHO_THANH_TOAN', 'CHO_LAY_HANG']:
        return jsonify({"success": False, "message": "Đơn hàng đã được xử lý hoặc đang vận chuyển, không thể chỉnh sửa!"}), 400

    data = request.json or {}
    
    # Cập nhật các trường thông tin cơ bản
    if 'receiver_name' in data:
        order.TenNguoiNhan = data['receiver_name']
    if 'receiver_phone' in data:
        order.SoDienThoaiNhan = data['receiver_phone']
    if 'description' in data:
        order.MoTaHangHoa = data['description']
    if 'inspection_policy' in data:
        order.QuyenKiemTra = data['inspection_policy']
    if 'pickup_type' in data:
        order.HinhThucLayHang = data['pickup_type']
        
    address_or_dimensions_changed = False
    
    # Địa chỉ nhận thay đổi
    if 'receiver_address' in data and data['receiver_address'] != order.DiaChiNhan:
        order.DiaChiNhan = data['receiver_address']
        lat_r, lon_r = geocode_address(order.DiaChiNhan)
        is_r_vn = not lat_r or (8.5 <= lat_r <= 23.5 and 102.0 <= lon_r <= 110.0)
        if not is_r_vn:
            return jsonify({
                "success": False,
                "message": "Antigravity Express chỉ hỗ trợ giao hàng trong phạm vi lãnh thổ Việt Nam!"
            }), 400
        order.ViDoNhan = lat_r
        order.KinhDoNhan = lon_r
        address_or_dimensions_changed = True
        
    # Địa chỉ gửi thay đổi (nếu có truyền)
    if 'sender_address' in data and data['sender_address'] != (order.DiaChiGui or ''):
        order.DiaChiGui = data['sender_address']
        lat_s, lon_s = geocode_address(order.DiaChiGui)
        is_s_vn = not lat_s or (8.5 <= lat_s <= 23.5 and 102.0 <= lon_s <= 110.0)
        if not is_s_vn:
            return jsonify({
                "success": False,
                "message": "Antigravity Express chỉ hỗ trợ giao hàng trong phạm vi lãnh thổ Việt Nam!"
            }), 400
        order.ViDoGui = lat_s
        order.KinhDoGui = lon_s
        address_or_dimensions_changed = True

    # Trọng lượng & Kích thước thay đổi
    if 'weight_gram' in data and int(data['weight_gram']) != order.TrongLuongGram:
        order.TrongLuongGram = int(data['weight_gram'])
        address_or_dimensions_changed = True
    if 'length_cm' in data and int(data['length_cm']) != order.ChieuDaiCM:
        order.ChieuDaiCM = int(data['length_cm'])
        address_or_dimensions_changed = True
    if 'width_cm' in data and int(data['width_cm']) != order.ChieuRongCM:
        order.ChieuRongCM = int(data['width_cm'])
        address_or_dimensions_changed = True
    if 'height_cm' in data and int(data['height_cm']) != order.ChieuCaoCM:
        order.ChieuCaoCM = int(data['height_cm'])
        address_or_dimensions_changed = True
        
    # Tiền thu hộ COD thay đổi
    if 'cod_amount' in data:
        new_cod = float(data['cod_amount'])
        if new_cod != order.TienThuHoCOD:
            order.TienThuHoCOD = new_cod
            # Tự động mở khóa / khóa chờ thanh toán dựa trên tiền COD mới
            if order.TrangThaiHienTai in ['CHO_THANH_TOAN', 'CHO_LAY_HANG']:
                if new_cod == 0:
                    order.TrangThaiHienTai = 'CHO_THANH_TOAN'
                    order.TrangThaiThanhToan = 'CHUA_THANH_TOAN'
                else:
                    order.TrangThaiHienTai = 'CHO_LAY_HANG'
        
    if 'declared_value' in data and float(data['declared_value']) != order.GiaTriKhaiBao:
        order.GiaTriKhaiBao = float(data['declared_value'])
        address_or_dimensions_changed = True

    # Tính lại cước phí
    if address_or_dimensions_changed:
        length = order.ChieuDaiCM or 0
        width = order.ChieuRongCM or 0
        height = order.ChieuCaoCM or 0
        actual_weight = order.TrongLuongGram or 0
        
        vol_weight = calculate_volumetric_weight(length, width, height)
        order.TrongLuongQuyDoiGram = vol_weight if (length + width + height) >= 100 else 0
        
        lat_s = order.ViDoGui
        lon_s = order.KinhDoGui
        lat_r = order.ViDoNhan
        lon_r = order.KinhDoNhan
        
        branch_o = find_closest_branch(lat_s, lon_s)
        branch_d = find_closest_branch(lat_r, lon_r)
        if branch_o:
            order.MaChiNhanhGui = branch_o.MaChiNhanh
        if branch_d:
            order.MaChiNhanhNhan = branch_d.MaChiNhanh

        if lat_s and lon_s and lat_r and lon_r:
            direct_dist = calculate_haversine(float(lat_s), float(lon_s), float(lat_r), float(lon_r))
            if direct_dist < 10.0:
                dist = direct_dist
            else:
                dist = calculate_5point_distance(float(lat_s), float(lon_s), float(lat_r), float(lon_r))
        else:
            sender_addr = order.DiaChiGui or ''
            receiver_addr = order.DiaChiNhan or ''
            dist = get_smart_distance(sender_addr, receiver_addr, lat_gui=lat_s, lon_gui=lon_s, lat_nhan=lat_r, lon_nhan=lon_r)
            
        order.KhoangCachKm = dist
        order.PhiVanChuyen = calculate_shipping_fee(dist, actual_weight, length, width, height)
        order.PhiBaoHiem = calculate_insurance_fee(order.GiaTriKhaiBao)

    # Thêm log cập nhật
    log = LichSu_TrangThai(
        MaDonHang=order_id,
        MaTrangThai=order.TrangThaiHienTai,
        ThongTinViTri="Đơn hàng được cập nhật thông tin chi tiết bởi người gửi.",
        MaNhanVienCapNhat=request.user_id
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        "success": True, 
        "message": "Cập nhật đơn hàng thành công!",
        "data": {
            "order_id": order.MaDonHang,
            "shipping_fee": float(order.PhiVanChuyen),
            "insurance_fee": float(order.PhiBaoHiem),
            "status": order.TrangThaiHienTai
        }
    })

@order_bp.route('/<order_id>', methods=['DELETE'])
@require_auth
def cancel_order(order_id):
    order = DonHang.query.get(order_id)
    if not order:
        return jsonify({"success": False, "message": "Không tìm thấy đơn hàng!"}), 404
        
    # Phân quyền: phải là chủ đơn hàng (Shop) hoặc admin/nhân viên điều phối
    if request.user_role == 'KHACHHANG' and order.MaNguoiGui != request.user_id:
        return jsonify({"success": False, "message": "Bạn không có quyền hủy đơn hàng này!"}), 403
        
    # Chỉ cho phép hủy khi chưa bàn giao lấy hàng
    if order.TrangThaiHienTai not in ['CHO_THANH_TOAN', 'CHO_LAY_HANG']:
        return jsonify({"success": False, "message": "Đơn hàng đã được bàn giao vận chuyển, không thể hủy!"}), 400
        
    order.TrangThaiHienTai = 'DA_HUY'
    
    log = LichSu_TrangThai(
        MaDonHang=order_id,
        MaTrangThai='DA_HUY',
        ThongTinViTri="Đơn hàng đã được hủy thành công bởi người gửi.",
        MaNhanVienCapNhat=request.user_id
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({"success": True, "message": "Hủy đơn hàng thành công!"})

@order_bp.route('/events', methods=['GET'])
def get_order_events():
    q = queue.Queue()
    sse_listeners.append(q)
    
    def sse_stream(listener_queue):
        try:
            yield f"event: connect\ndata: \"Realtime connection established\"\n\n"
            while True:
                event_data = listener_queue.get()
                event_name = event_data.get("event", "message")
                yield f"event: {event_name}\ndata: {json.dumps(event_data['data'])}\n\n"
        except GeneratorExit:
            if listener_queue in sse_listeners:
                sse_listeners.remove(listener_queue)
                
    return Response(sse_stream(q), mimetype='text/event-stream')
