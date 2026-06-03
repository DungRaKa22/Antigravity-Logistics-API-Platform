from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import SuperAdmin, TongKho, ChiNhanh, NguoiDung, DonHang
from app.utils.security import require_auth, require_role, hash_password
from datetime import datetime

super_admin_bp = Blueprint('super_admin', __name__)

@super_admin_bp.route('/dashboard', methods=['GET'])
@require_role(['SUPER_ADMIN'])
def get_dashboard():
    # 1. Calculate global revenue (sum of PhiVanChuyen)
    total_revenue_db = db.session.query(db.func.sum(DonHang.PhiVanChuyen)).scalar()
    total_revenue = float(total_revenue_db) if total_revenue_db else 0.0

    # 2. Total orders count
    total_orders = DonHang.query.count()

    # 3. Facilities count
    total_warehouses = TongKho.query.count()
    total_branches = ChiNhanh.query.count()

    # 4. Fetch list of warehouses and branches
    warehouses = [{
        "id": k.MaTongKho,
        "name": k.TenTongKho,
        "region": k.VungMien,
        "address": k.DiaChi,
        "lat": float(k.ViDo),
        "lng": float(k.KinhDo),
        "staff_count": NguoiDung.query.filter_by(MaTongKho=k.MaTongKho, VaiTro='KHO').count()
    } for k in TongKho.query.all()]

    branches = [{
        "id": c.MaChiNhanh,
        "name": c.TenChiNhanh,
        "address": c.DiaChi,
        "lat": float(c.ViDo),
        "lng": float(c.KinhDo),
        "warehouse_link": c.MaTongKhoLienKet,
        "shipper_count": NguoiDung.query.filter_by(MaChiNhanh=c.MaChiNhanh, VaiTro='SHIPPER').count()
    } for c in ChiNhanh.query.all()]

    # 5. Fetch all managers (ADMIN in NguoiDung)
    managers = [{
        "id": m.MaNguoiDung,
        "username": m.TenDangNhap,
        "fullname": m.HoTen,
        "role": m.VaiTro,
        "branch_id": m.MaChiNhanh,
        "branch_name": m.chi_nhanh.TenChiNhanh if m.chi_nhanh else None,
        "warehouse_id": m.MaTongKho,
        "warehouse_name": m.tong_kho.TenTongKho if m.tong_kho else None,
        "created_at": m.NgayTao.isoformat()
    } for m in NguoiDung.query.filter_by(VaiTro='ADMIN').all()]

    return jsonify({
        "success": True,
        "data": {
            "metrics": {
                "total_revenue": total_revenue,
                "total_orders": total_orders,
                "total_warehouses": total_warehouses,
                "total_branches": total_branches
            },
            "warehouses": warehouses,
            "branches": branches,
            "managers": managers
        }
    }), 200

# FACILITIES CRUD
@super_admin_bp.route('/facilities', methods=['POST'])
@require_role(['SUPER_ADMIN'])
def create_facility():
    data = request.json
    if not data or not all(k in data for k in ('type', 'name', 'address', 'lat', 'lng')):
        return jsonify({"success": False, "message": "Thiếu dữ liệu bắt buộc"}), 400

    facility_type = data['type'].lower()
    if facility_type == 'kho':
        new_fac = TongKho(
            TenTongKho=data['name'],
            VungMien=data.get('region', 'BAC'),
            DiaChi=data['address'],
            ViDo=data['lat'],
            KinhDo=data['lng']
        )
    elif facility_type == 'chinhanh':
        new_fac = ChiNhanh(
            TenChiNhanh=data['name'],
            DiaChi=data['address'],
            ViDo=data['lat'],
            KinhDo=data['lng'],
            MaTongKhoLienKet=data.get('warehouse_link')
        )
    else:
        return jsonify({"success": False, "message": "Loại cơ sở không hợp lệ"}), 400

    db.session.add(new_fac)
    db.session.commit()
    return jsonify({"success": True, "message": "Tạo cơ sở thành công"}), 201

@super_admin_bp.route('/facilities/<string:facility_type>/<int:facility_id>', methods=['PUT'])
@require_role(['SUPER_ADMIN'])
def update_facility(facility_type, facility_id):
    data = request.json
    facility_type = facility_type.lower()

    if facility_type == 'kho':
        fac = TongKho.query.get(facility_id)
        if not fac:
            return jsonify({"success": False, "message": "Không tìm thấy Tổng kho"}), 404
        if 'name' in data: fac.TenTongKho = data['name']
        if 'region' in data: fac.VungMien = data['region']
        if 'address' in data: fac.DiaChi = data['address']
        if 'lat' in data: fac.ViDo = data['lat']
        if 'lng' in data: fac.KinhDo = data['lng']
    elif facility_type == 'chinhanh':
        fac = ChiNhanh.query.get(facility_id)
        if not fac:
            return jsonify({"success": False, "message": "Không tìm thấy Chi nhánh"}), 404
        if 'name' in data: fac.TenChiNhanh = data['name']
        if 'address' in data: fac.DiaChi = data['address']
        if 'lat' in data: fac.ViDo = data['lat']
        if 'lng' in data: fac.KinhDo = data['lng']
        if 'warehouse_link' in data: fac.MaTongKhoLienKet = data['warehouse_link']
    else:
        return jsonify({"success": False, "message": "Loại cơ sở không hợp lệ"}), 400

    db.session.commit()
    return jsonify({"success": True, "message": "Cập nhật cơ sở thành công"}), 200

@super_admin_bp.route('/facilities/<string:facility_type>/<int:facility_id>', methods=['DELETE'])
@require_role(['SUPER_ADMIN'])
def delete_facility(facility_type, facility_id):
    facility_type = facility_type.lower()
    if facility_type == 'kho':
        fac = TongKho.query.get(facility_id)
        if not fac:
            return jsonify({"success": False, "message": "Không tìm thấy Tổng kho"}), 404
        db.session.delete(fac)
    elif facility_type == 'chinhanh':
        fac = ChiNhanh.query.get(facility_id)
        if not fac:
            return jsonify({"success": False, "message": "Không tìm thấy Chi nhánh"}), 404
        db.session.delete(fac)
    else:
        return jsonify({"success": False, "message": "Loại cơ sở không hợp lệ"}), 400

    db.session.commit()
    return jsonify({"success": True, "message": "Xóa cơ sở thành công"}), 200

# FACILITY MANAGERS CRUD
@super_admin_bp.route('/facility-managers', methods=['POST'])
@require_role(['SUPER_ADMIN'])
def create_facility_manager():
    data = request.json
    if not data or not all(k in data for k in ('username', 'password', 'fullname')):
        return jsonify({"success": False, "message": "Thiếu dữ liệu bắt buộc"}), 400

    if NguoiDung.query.filter_by(TenDangNhap=data['username']).first():
        return jsonify({"success": False, "message": "Username đã tồn tại"}), 400

    # Create facility manager user (VaiTro always 'ADMIN' for facility desk operations)
    new_manager = NguoiDung(
        TenDangNhap=data['username'],
        MatKhau=hash_password(data['password']),
        HoTen=data['fullname'],
        VaiTro='ADMIN',
        MaChiNhanh=data.get('branch_id'),
        MaTongKho=data.get('warehouse_id')
    )

    db.session.add(new_manager)
    db.session.commit()
    return jsonify({"success": True, "message": "Tạo quản lý cơ sở thành công"}), 201

@super_admin_bp.route('/facility-managers/<int:manager_id>', methods=['PUT'])
@require_role(['SUPER_ADMIN'])
def update_facility_manager(manager_id):
    data = request.json
    manager = NguoiDung.query.get(manager_id)
    if not manager or manager.VaiTro != 'ADMIN':
        return jsonify({"success": False, "message": "Không tìm thấy quản lý cơ sở"}), 404

    if 'fullname' in data: manager.HoTen = data['fullname']
    if 'password' in data and data['password']:
        manager.MatKhau = hash_password(data['password'])
    
    # Assign facility (only one can be active, clear the other)
    if 'branch_id' in data:
        manager.MaChiNhanh = data['branch_id']
        if data['branch_id'] is not None:
            manager.MaTongKho = None
    if 'warehouse_id' in data:
        manager.MaTongKho = data['warehouse_id']
        if data['warehouse_id'] is not None:
            manager.MaChiNhanh = None

    db.session.commit()
    return jsonify({"success": True, "message": "Cập nhật quản lý cơ sở thành công"}), 200

@super_admin_bp.route('/facility-managers/<int:manager_id>', methods=['DELETE'])
@require_role(['SUPER_ADMIN'])
def delete_facility_manager(manager_id):
    manager = NguoiDung.query.get(manager_id)
    if not manager or manager.VaiTro != 'ADMIN':
        return jsonify({"success": False, "message": "Không tìm thấy quản lý cơ sở"}), 404

    db.session.delete(manager)
    db.session.commit()
    return jsonify({"success": True, "message": "Xóa quản lý cơ sở thành công"}), 200
