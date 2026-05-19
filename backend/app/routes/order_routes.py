import random
import string
import openpyxl
from io import BytesIO
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import DonHang, LichSu_TrangThai, DoiSoat, KhoaAPI
from app.utils.security import require_auth, require_role, require_api_key
from app.services.osrm_service import get_smart_distance
from app.services.finance_service import calculate_shipping_fee, calculate_final_payout, calculate_insurance_fee, calculate_volumetric_weight
from datetime import datetime
import threading
import requests

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
        MaNhanVienCapNhat=1 
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
