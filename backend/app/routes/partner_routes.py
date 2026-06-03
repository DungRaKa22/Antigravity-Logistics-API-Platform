from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import KhoaAPI, NguoiDung
from app.utils.security import require_auth, require_role, require_api_key
from secrets import token_hex

partner_bp = Blueprint('partner', __name__)

@partner_bp.route('/keys', methods=['POST'])
@require_auth
@require_role(['ADMIN', 'HR'])
def create_api_key():
    data = request.json
    partner_id = data.get('partner_id')
    
    partner = NguoiDung.query.filter_by(MaNguoiDung=partner_id).first()
    if not partner or partner.VaiTro not in ['DOITAC', 'KHACHHANG']:
        return jsonify({'success': False, 'message': 'Không tìm thấy đối tác/khách hàng hợp lệ!'}), 404

    # Tạo khóa API an toàn 64 kí tự
    new_key = f"AG_PARTNER_{token_hex(32)[:64-11].upper()}"
    
    key_record = KhoaAPI(
        MaDoiTac=partner_id,
        ChuoiKhoaAPI=new_key,
        TrangThaiHoatDong=True
    )
    db.session.add(key_record)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Cấp API Key thành công',
        'data': {
            'api_key': new_key
        }
    })

@partner_bp.route('/keys/merchant', methods=['GET'])
@require_auth
def get_merchant_api_key():
    partner_id = request.user_id
    key_record = KhoaAPI.query.filter_by(MaDoiTac=partner_id, TrangThaiHoatDong=True).first()
    if not key_record:
        return jsonify({
            'success': True,
            'data': None
        })
    return jsonify({
        'success': True,
        'data': {
            'api_key': key_record.ChuoiKhoaAPI,
            'created_at': key_record.NgayTao.isoformat()
        }
    })

@partner_bp.route('/keys/merchant', methods=['POST'])
@require_auth
def create_merchant_api_key():
    partner_id = request.user_id
    
    # Revoke any existing active keys for this partner first
    KhoaAPI.query.filter_by(MaDoiTac=partner_id, TrangThaiHoatDong=True).update({KhoaAPI.TrangThaiHoatDong: False})
    
    # Create a new secure 64-character API Key
    new_key = f"AG_PARTNER_{token_hex(32)[:64-11].upper()}"
    
    key_record = KhoaAPI(
        MaDoiTac=partner_id,
        ChuoiKhoaAPI=new_key,
        TrangThaiHoatDong=True
    )
    db.session.add(key_record)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Cấp API Key mới thành công',
        'data': {
            'api_key': new_key,
            'created_at': key_record.NgayTao.isoformat()
        }
    })

@partner_bp.route('/calculate-fee', methods=['POST'])
@require_api_key
def partner_calculate_fee():
    data = request.json
    
    sender_addr = data.get('sender_address', '')
    receiver_addr = data.get('receiver_address', '')
    
    from app.services.osrm_service import geocode_address
    lat_s, lon_s = geocode_address(sender_addr)
    lat_r, lon_r = geocode_address(receiver_addr)
    
    is_s_vn = not lat_s or (8.5 <= lat_s <= 23.5 and 102.0 <= lon_s <= 110.0)
    is_r_vn = not lat_r or (8.5 <= lat_r <= 23.5 and 102.0 <= lon_r <= 110.0)
    
    if not is_s_vn or not is_r_vn:
        return jsonify({
            "success": False,
            "message": "Vận chuyển chỉ hỗ trợ trong phạm vi lãnh thổ Việt Nam!"
        }), 400

    from app.routes.order_routes import calculate_5point_distance, calculate_haversine
    if lat_s and lon_s and lat_r and lon_r:
        direct_dist = calculate_haversine(lat_s, lon_s, lat_r, lon_r)
        if direct_dist < 10.0:
            dist = direct_dist
        else:
            dist = calculate_5point_distance(lat_s, lon_s, lat_r, lon_r, sender_addr, receiver_addr)
    else:
        from app.services.osrm_service import get_smart_distance
        dist = get_smart_distance(sender_addr, receiver_addr, lat_gui=lat_s, lon_gui=lon_s, lat_nhan=lat_r, lon_nhan=lon_r)
        
    length = int(data.get('length_cm', 10))
    width = int(data.get('width_cm', 10))
    height = int(data.get('height_cm', 10))
    actual_weight = int(data.get('weight_gram', 100))
    
    from app.services.finance_service import calculate_shipping_fee, calculate_insurance_fee, calculate_volumetric_weight
    vol_weight = calculate_volumetric_weight(length, width, height)
    chargeable_weight = max(actual_weight, vol_weight) if (length + width + height) >= 100 else actual_weight
    
    fee = calculate_shipping_fee(dist, actual_weight, length, width, height)
    declared_value = float(data.get('declared_value', 0))
    insurance = calculate_insurance_fee(declared_value)
    
    return jsonify({
        "success": True,
        "data": {
            "distance_km": dist,
            "chargeable_weight": chargeable_weight,
            "shipping_fee": fee,
            "insurance_fee": insurance,
            "total_fee": fee + insurance
        }
    })

@partner_bp.route('/create-order', methods=['POST'])
@require_api_key
def partner_create_order():
    data = request.json
    from app.routes.order_routes import generate_order_id, calculate_5point_distance, find_closest_branch, find_branch_by_address, calculate_haversine
    from app.models import DonHang, LichSu_TrangThai, TongKho
    from app.services.finance_service import calculate_shipping_fee, calculate_insurance_fee, calculate_volumetric_weight
    from app.services.osrm_service import get_smart_distance, geocode_address
    
    order_id = generate_order_id()
    sender_addr = data.get('sender_address', '')
    receiver_addr = data.get('receiver_address', '')
    
    lat_s, lon_s = geocode_address(sender_addr)
    lat_r, lon_r = geocode_address(receiver_addr)
    
    is_s_vn = not lat_s or (8.5 <= lat_s <= 23.5 and 102.0 <= lon_s <= 110.0)
    is_r_vn = not lat_r or (8.5 <= lat_r <= 23.5 and 102.0 <= lon_r <= 110.0)
    
    if not is_s_vn or not is_r_vn:
        return jsonify({
            "success": False,
            "message": "Vận chuyển chỉ hỗ trợ trong phạm vi lãnh thổ Việt Nam!"
        }), 400
 
    length = int(data.get('length_cm', 10))
    width = int(data.get('width_cm', 10))
    height = int(data.get('height_cm', 10))
    actual_weight = int(data.get('weight_gram', 100))
    vol_weight = calculate_volumetric_weight(length, width, height)
    
    if lat_s and lon_s and lat_r and lon_r:
        direct_dist = calculate_haversine(lat_s, lon_s, lat_r, lon_r)
        if direct_dist < 10.0:
            dist = direct_dist
        else:
            dist = calculate_5point_distance(lat_s, lon_s, lat_r, lon_r, sender_addr, receiver_addr)
    else:
        dist = get_smart_distance(sender_addr, receiver_addr, lat_gui=lat_s, lon_gui=lon_s, lat_nhan=lat_r, lon_nhan=lon_r)
        
    fee = calculate_shipping_fee(dist, actual_weight, length, width, height)
    declared_value = float(data.get('declared_value', 0))
    insurance = calculate_insurance_fee(declared_value)
 
    branch_o = find_branch_by_address(sender_addr, lat_s, lon_s)
    branch_d = find_branch_by_address(receiver_addr, lat_r, lon_r)
    
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

    order = DonHang(
        MaDonHang=order_id,
        MaNguoiGui=request.partner_user_id,
        MaGoi=data.get('service_package_id', 1),
        TenNguoiGui=data.get('sender_name', 'Cửa hàng đối tác'),
        SoDienThoaiGui=data.get('sender_phone', ''),
        DiaChiGui=sender_addr,
        ViDoGui=lat_s,
        KinhDoGui=lon_s,
        TenNguoiNhan=data['receiver_name'],
        SoDienThoaiNhan=data['receiver_phone'],
        DiaChiNhan=data['receiver_address'],
        ViDoNhan=lat_r,
        KinhDoNhan=lon_r,
        TrongLuongGram=actual_weight,
        ChieuDaiCM=length,
        ChieuRongCM=width,
        ChieuCaoCM=height,
        TrongLuongQuyDoiGram=vol_weight if (length + width + height) >= 100 else 0,
        MoTaHangHoa=data.get('description', 'Đơn hàng tích hợp B2B API'),
        GiaTriKhaiBao=declared_value,
        PhiBaoHiem=insurance,
        KhoangCachKm=dist,
        PhiVanChuyen=fee,
        TienThuHoCOD=float(data.get('cod_amount', 0)),
        QuyenKiemTra=data.get('inspection_policy', 'KHONG_XEM'),
        HinhThucLayHang=data.get('pickup_type', 'TU_MANG_RA_BUU_CUC'),
        TrangThaiHienTai='CHO_LAY_HANG',
        MaChiNhanhGui=branch_o.MaChiNhanh if branch_o else None,
        MaChiNhanhNhan=branch_d.MaChiNhanh if branch_d else None
    )
    db.session.add(order)

    initial_location = f"Đơn hàng tạo qua B2B API thành công (Lộ trình định tuyến: Khách gửi ➡️ {' ➡️ '.join(hub_path)} ➡️ Khách nhận)"
    log = LichSu_TrangThai(
        MaDonHang=order_id,
        MaTrangThai='CHO_LAY_HANG',
        ThongTinViTri=initial_location,
        MaNhanVienCapNhat=request.partner_user_id
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Tạo đơn hàng B2B thành công",
        "data": {
            "order_id": order_id,
            "shipping_fee": fee,
            "insurance_fee": insurance,
            "total_fee": fee + insurance,
            "routing": hub_path
        }
    }), 201

@partner_bp.route('/track-order/<order_id>', methods=['GET'])
@require_api_key
def partner_track_order(order_id):
    from app.models import DonHang, LichSu_TrangThai
    order = DonHang.query.filter_by(MaDonHang=order_id, MaNguoiGui=request.partner_user_id).first()
    if not order:
        return jsonify({"success": False, "message": "Không tìm thấy đơn hàng này thuộc quyền sở hữu của bạn!"}), 404
        
    history = LichSu_TrangThai.query.filter_by(MaDonHang=order_id).order_by(LichSu_TrangThai.ThoiGian.desc()).all()
    timeline = [{
        "status": h.MaTrangThai,
        "info": h.ThongTinViTri,
        "time": h.ThoiGian.isoformat(),
        "notes": h.GhiChuLyDo,
        "proof_url": h.AnhBangChungUrl
    } for h in history]

    return jsonify({
        "success": True,
        "data": {
            "order_id": order.MaDonHang,
            "status": order.TrangThaiHienTai,
            "receiver_name": order.TenNguoiNhan,
            "receiver_address": order.DiaChiNhan,
            "shipping_fee": float(order.PhiVanChuyen),
            "cod_amount": float(order.TienThuHoCOD),
            "created_at": order.NgayTao.isoformat(),
            "timeline": timeline
        }
    })
