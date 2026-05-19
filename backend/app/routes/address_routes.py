from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import SoDiaChi
from app.utils.security import require_auth, require_role

address_bp = Blueprint('address', __name__)

@address_bp.route('/', methods=['GET'])
@require_auth
@require_role(['KHACHHANG'])
def get_addresses():
    user_id = request.user_id
    query_str = request.args.get('q', '').strip()

    books = SoDiaChi.query.filter_by(MaNguoiDung=user_id)
    if query_str:
        books = books.filter(
            (SoDiaChi.TenLienHe.ilike(f'%{query_str}%')) |
            (SoDiaChi.SoDienThoai.ilike(f'%{query_str}%'))
        )
    
    # Sắp xếp địa chỉ mặc định lên đầu
    books = books.order_by(SoDiaChi.LaMacDinh.desc(), SoDiaChi.MaDiaChi.desc()).all()
    
    data = [{
        "id": b.MaDiaChi,
        "name": b.TenLienHe,
        "phone": b.SoDienThoai,
        "address": b.DiaChiChiTiet,
        "lat": float(b.ViDo) if b.ViDo else None,
        "lng": float(b.KinhDo) if b.KinhDo else None,
        "isDefault": b.LaMacDinh
    } for b in books]

    return jsonify({"success": True, "data": data})

@address_bp.route('/', methods=['POST'])
@require_auth
@require_role(['KHACHHANG'])
def create_address():
    data = request.json
    if not all(k in data for k in ('name', 'phone', 'address')):
        return jsonify({"success": False, "message": "Không đủ thông tin"}), 400

    user_id = request.user_id
    is_default = data.get('isDefault', False)

    # Nếu người dùng chưa có địa chỉ nào, tự động đặt làm mặc định
    existing_count = SoDiaChi.query.filter_by(MaNguoiDung=user_id).count()
    if existing_count == 0:
        is_default = True

    # Nếu đặt làm mặc định, bỏ mặc định của các địa chỉ cũ
    if is_default:
        SoDiaChi.query.filter_by(MaNguoiDung=user_id).update({"LaMacDinh": False})

    new_adr = SoDiaChi(
        MaNguoiDung=user_id,
        TenLienHe=data['name'],
        SoDienThoai=data['phone'],
        DiaChiChiTiet=data['address'],
        ViDo=data.get('lat'),
        KinhDo=data.get('lng'),
        LaMacDinh=is_default
    )
    db.session.add(new_adr)
    db.session.commit()

    return jsonify({"success": True, "message": "Thêm địa chỉ thành công", "id": new_adr.MaDiaChi}), 201

@address_bp.route('/<int:id>/set-default', methods=['PUT'])
@require_auth
@require_role(['KHACHHANG'])
def set_default_address(id):
    user_id = request.user_id
    
    # Kiểm tra xem địa chỉ có thuộc về người dùng không
    target = SoDiaChi.query.filter_by(MaDiaChi=id, MaNguoiDung=user_id).first()
    if not target:
        return jsonify({"success": False, "message": "Không tìm thấy địa chỉ"}), 404

    # Bỏ mặc định tất cả địa chỉ cũ
    SoDiaChi.query.filter_by(MaNguoiDung=user_id).update({"LaMacDinh": False})
    
    # Đặt địa chỉ hiện tại làm mặc định
    target.LaMacDinh = True
    db.session.add(target)
    db.session.commit()

    return jsonify({"success": True, "message": "Đặt địa chỉ mặc định thành công"})

@address_bp.route('/<int:id>', methods=['DELETE'])
@require_auth
@require_role(['KHACHHANG'])
def delete_address(id):
    user_id = request.user_id
    adr = SoDiaChi.query.filter_by(MaDiaChi=id, MaNguoiDung=user_id).first()
    if not adr:
        return jsonify({"success": False, "message": "Không tìm thấy địa chỉ"}), 404
        
    was_default = adr.LaMacDinh
    db.session.delete(adr)
    db.session.commit()

    # Nếu vừa xóa địa chỉ mặc định, đặt địa chỉ khác làm mặc định (nếu có)
    if was_default:
        next_adr = SoDiaChi.query.filter_by(MaNguoiDung=user_id).first()
        if next_adr:
            next_adr.LaMacDinh = True
            db.session.commit()

    return jsonify({"success": True, "message": "Xóa thành công"})
