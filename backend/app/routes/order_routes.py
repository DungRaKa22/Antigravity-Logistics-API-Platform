import random
import string
import openpyxl
import queue
import json
from io import BytesIO
from flask import Blueprint, request, jsonify, Response
from app.extensions import db
from app.models import DonHang, LichSu_TrangThai, DoiSoat, KhoaAPI, NguoiDung
from app.utils.security import require_auth, require_role, require_api_key
from app.services.osrm_service import get_smart_distance, optimize_multistop_path
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

def generate_order_id():
    suffix = ''.join(random.choices(string.digits, k=6))
    return f"AG-{suffix}"

def trigger_webhook_async(url, payload):
    try:
        requests.post(url, json=payload, timeout=5)
    except:
        pass

@order_bp.route('/calculate', methods=['POST'])
def calculate_fee():
    data = request.json
    dist = get_smart_distance(data.get('sender_address', ''), data.get('receiver_address', ''))
    
    length = int(data.get('length_cm', 0))
    width = int(data.get('width_cm', 0))
    height = int(data.get('height_cm', 0))
    actual_weight = int(data.get('weight_gram', 0))
    
    vol_weight = calculate_volumetric_weight(length, width, height)
    chargeable_weight = max(actual_weight, vol_weight)
    
    fee = calculate_shipping_fee(dist, chargeable_weight)
    
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
    data = request.json
    order_id = generate_order_id()
    
    # Kích thước & Khối lượng
    length = int(data.get('length_cm', 0))
    width = int(data.get('width_cm', 0))
    height = int(data.get('height_cm', 0))
    actual_weight = int(data.get('weight_gram', 0))
    vol_weight = calculate_volumetric_weight(length, width, height)
    chargeable_weight = max(actual_weight, vol_weight)
    
    # Tính cước & bảo hiểm
    dist = get_smart_distance(data.get('sender_address'), data.get('receiver_address'))
    fee = calculate_shipping_fee(dist, chargeable_weight)
    declared_value = float(data.get('declared_value', 0))
    insurance = calculate_insurance_fee(declared_value)

    # Tạo Order
    order = DonHang(
        MaDonHang=order_id,
        MaNguoiGui=request.user_id,
        MaGoi=data.get('service_package_id', 1), # Mặc định 1: Standard
        TenNguoiNhan=data['receiver_name'],
        SoDienThoaiNhan=data['receiver_phone'],
        DiaChiNhan=data['receiver_address'],
        TrongLuongGram=actual_weight,
        ChieuDaiCM=length,
        ChieuRongCM=width,
        ChieuCaoCM=height,
        TrongLuongQuyDoiGram=vol_weight,
        MoTaHangHoa=data.get('description', 'Hàng hóa thông thường'),
        GiaTriKhaiBao=declared_value,
        PhiBaoHiem=insurance,
        KhoangCachKm=dist,
        PhiVanChuyen=fee,
        TienThuHoCOD=float(data.get('cod_amount', 0)),
        QuyenKiemTra=data.get('inspection_policy', 'KHONG_XEM'),
        HinhThucLayHang=data.get('pickup_type', 'TU_MANG_RA_BUU_CUC'),
        TrangThaiHienTai='CHO_LAY_HANG'
    )
    db.session.add(order)

    # Khởi tạo log TrackingHistory
    # Dùng 1 đại diện ID=1 làm Admin system update ban đầu
    log = LichSu_TrangThai(
        MaDonHang=order_id,
        MaTrangThai='CHO_LAY_HANG',
        ThongTinViTri='Đơn hàng khởi tạo thành công',
        MaNhanVienCapNhat=request.user_id 
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({"success": True, "message": "Tạo đơn thành công", "data": {"order_id": order_id, "shipping_fee": fee}}), 201

@order_bp.route('/', methods=['GET'])
@require_auth
def get_orders():
    if request.user_role == 'KHACHHANG':
        orders = DonHang.query.filter_by(MaNguoiGui=request.user_id).all()
    else:  # QUANTRI
        orders = DonHang.query.all()

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
@require_role(['QUANTRI'])
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
    data = request.json
    sender_address = data.get('sender_address')
    receivers = data.get('receivers', [])
    
    if not sender_address or not receivers:
        return jsonify({"success": False, "message": "Thiếu thông tin người gửi hoặc danh sách người nhận!"}), 400

    receiver_addresses = [r.get('receiver_address') for r in receivers]
    
    opt_indices, leg_distances = optimize_multistop_path(sender_address, receiver_addresses)
    
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
        chargeable_weight = max(actual_weight, vol_weight)
        
        std_fee = calculate_shipping_fee(leg_dist, chargeable_weight)
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
    data = request.json
    sender_address = data.get('sender_address')
    receivers = data.get('receivers', [])
    
    if not sender_address or not receivers:
        return jsonify({"success": False, "message": "Thiếu thông tin người gửi hoặc danh sách người nhận!"}), 400

    receiver_addresses = [r.get('receiver_address') for r in receivers]
    
    opt_indices, leg_distances = optimize_multistop_path(sender_address, receiver_addresses)
    
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
        chargeable_weight = max(actual_weight, vol_weight)
        
        std_fee = calculate_shipping_fee(leg_dist, chargeable_weight)
        discounted_fee = std_fee if leg_idx == 0 else round(std_fee * 0.7, 2)
        
        declared_val = float(rec_data.get('declared_value', 0))
        insurance = calculate_insurance_fee(declared_val)
        
        order_id = generate_order_id()
        
        order = DonHang(
            MaDonHang=order_id,
            MaNguoiGui=request.user_id,
            MaGoi=data.get('service_package_id', 1),
            TenNguoiNhan=rec_data['receiver_name'],
            SoDienThoaiNhan=rec_data['receiver_phone'],
            DiaChiNhan=rec_data['receiver_address'],
            TrongLuongGram=actual_weight,
            ChieuDaiCM=length,
            ChieuRongCM=width,
            ChieuCaoCM=height,
            TrongLuongQuyDoiGram=vol_weight,
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
@require_role(['QUANTRI'])
def assign_shipper(order_id):
    data = request.json
    shipper_id = data.get('shipper_id')
    
    if not shipper_id:
        return jsonify({"success": False, "message": "Thiếu mã nhân viên shipper!"}), 400
        
    shipper = NguoiDung.query.get(shipper_id)
    if not shipper or shipper.VaiTro != 'NHANVIEN':
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
@require_role(['NHANVIEN'])
def get_assigned_orders():
    orders = DonHang.query.filter_by(MaNhanVienGiao=request.user_id).all()
    data = [{
        "order_id": o.MaDonHang,
        "receiver_name": o.TenNguoiNhan,
        "receiver_phone": o.SoDienThoaiNhan,
        "receiver_address": o.DiaChiNhan,
        "fee": float(o.PhiVanChuyen),
        "cod": float(o.TienThuHoCOD),
        "status": o.TrangThaiHienTai,
        "created_at": o.NgayTao.isoformat(),
        "description": o.MoTaHangHoa
    } for o in orders]
    return jsonify({"success": True, "data": data})

@order_bp.route('/<order_id>/staff-update', methods=['PUT'])
@require_auth
@require_role(['NHANVIEN'])
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
