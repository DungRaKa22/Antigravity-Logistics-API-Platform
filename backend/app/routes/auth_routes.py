from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import NguoiDung, DonHang
from app.utils.security import hash_password, verify_password, generate_jwt, require_auth, require_role
from sqlalchemy import extract
import calendar
from datetime import datetime


auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    if not data or not all(k in data for k in ('username', 'password', 'fullname')):
        return jsonify({"success": False, "message": "Thiếu dữ liệu"}), 400

    if NguoiDung.query.filter_by(TenDangNhap=data['username']).first():
        return jsonify({"success": False, "message": "Username đã tồn tại"}), 400

    # Role mặc định là SHOP khi tự đăng ký trên portal
    new_user = NguoiDung(
        TenDangNhap=data['username'],
        MatKhau=hash_password(data['password']),
        HoTen=data['fullname'],
        VaiTro='KHACHHANG'
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"success": True, "message": "Đăng ký thành công"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    if not data or not all(k in data for k in ('username', 'password')):
        return jsonify({"success": False, "message": "Thiếu credentials"}), 400

    user = NguoiDung.query.filter_by(TenDangNhap=data['username']).first()
    if not user or not verify_password(user.MatKhau, data['password']):
        return jsonify({"success": False, "message": "Sai tài khoản hoặc mật khẩu"}), 401

    token = generate_jwt(user.MaNguoiDung, user.VaiTro)
    return jsonify({
        "success": True,
        "message": "Đăng nhập thành công",
        "data": {
            "token": token,
            "role": user.VaiTro,
            "fullname": user.HoTen
        }
    }), 200

@auth_bp.route('/users', methods=['GET'])
@require_auth
@require_role(['QUANTRI'])
def get_users():
    role_filter = request.args.get('role')
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    
    # Default to previous month if not provided
    if not month or not year:
        today = datetime.utcnow()
        if today.month == 1:
            month = 12
            year = today.year - 1
        else:
            month = today.month - 1
            year = today.year
            
    query = NguoiDung.query
    if role_filter:
        query = query.filter_by(VaiTro=role_filter)
    users = query.all()
    
    data = []
    for u in users:
        user_data = {
            "id": u.MaNguoiDung,
            "username": u.TenDangNhap,
            "fullname": u.HoTen,
            "role": u.VaiTro,
            "bank_account": u.SoTaiKhoan,
            "bank_name": u.TenNganHang,
            "bank_owner": u.ChuTaiKhoan,
            "created_at": u.NgayTao.isoformat(),
            "daily_limit": getattr(u, 'GioiHanDonNgay', 100),
            "notes": getattr(u, 'GhiChuNhanSu', '') or ''
        }
        
        if u.VaiTro == 'NHANVIEN':
            # Count current active holding orders (real-time, not month-dependent)
            holding_count = db.session.query(DonHang).filter(
                DonHang.MaNhanVienGiao == u.MaNguoiDung,
                DonHang.TrangThaiHienTai.notin_(['GIAO_THANH_CONG', 'GIAO_THAT_BAI'])
            ).count()
            
            holding_orders = db.session.query(DonHang).filter(
                DonHang.MaNhanVienGiao == u.MaNguoiDung,
                DonHang.TrangThaiHienTai.notin_(['GIAO_THANH_CONG', 'GIAO_THAT_BAI'])
            ).all()
            
            holding_orders_list = [{
                "order_id": o.MaDonHang,
                "status": o.TrangThaiHienTai,
                "receiver_name": o.TenNguoiNhan,
                "receiver_address": o.DiaChiNhan,
                "cod": float(o.TienThuHoCOD),
                "fee": float(o.PhiVanChuyen)
            } for o in holding_orders]
            
            # Count success and failed orders within the target month and year
            success_query = db.session.query(DonHang).filter(
                DonHang.MaNhanVienGiao == u.MaNguoiDung,
                DonHang.TrangThaiHienTai == 'GIAO_THANH_CONG',
                extract('month', DonHang.NgayTao) == month,
                extract('year', DonHang.NgayTao) == year
            )
            
            failed_query = db.session.query(DonHang).filter(
                DonHang.MaNhanVienGiao == u.MaNguoiDung,
                DonHang.TrangThaiHienTai == 'GIAO_THAT_BAI',
                extract('month', DonHang.NgayTao) == month,
                extract('year', DonHang.NgayTao) == year
            )
            
            success_count = success_query.count()
            failed_count = failed_query.count()
            
            # Build daily successful breakdown
            num_days = calendar.monthrange(year, month)[1]
            daily_success = {str(d): 0 for d in range(1, num_days + 1)}
            
            success_orders_in_month = success_query.all()
            for o in success_orders_in_month:
                day_str = str(o.NgayTao.day)
                if day_str in daily_success:
                    daily_success[day_str] += 1
                    
            user_data.update({
                "holding_orders_count": holding_count,
                "holding_orders": holding_orders_list,
                "success_orders_count": success_count,
                "failed_orders_count": failed_count,
                "daily_success": daily_success
            })
            
        data.append(user_data)
        
    return jsonify({"success": True, "data": data})


@auth_bp.route('/staff', methods=['POST'])
@require_auth
@require_role(['QUANTRI'])
def create_staff():
    data = request.json
    if not data or not all(k in data for k in ('username', 'password', 'fullname', 'role')):
        return jsonify({"success": False, "message": "Thiếu dữ liệu"}), 400

    if data['role'] not in ('NHANVIEN', 'QUANTRI'):
        return jsonify({"success": False, "message": "Vai trò không hợp lệ"}), 400

    if NguoiDung.query.filter_by(TenDangNhap=data['username']).first():
        return jsonify({"success": False, "message": "Username đã tồn tại"}), 400

    new_user = NguoiDung(
        TenDangNhap=data['username'],
        MatKhau=hash_password(data['password']),
        HoTen=data['fullname'],
        VaiTro=data['role']
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"success": True, "message": "Tạo tài khoản nhân viên thành công"}), 201

@auth_bp.route('/profile', methods=['GET'])
@require_auth
def get_profile():
    user = NguoiDung.query.get(request.user_id)
    if not user:
        return jsonify({"success": False, "message": "Không tìm thấy người dùng"}), 404
        
    return jsonify({
        "success": True,
        "data": {
            "fullname": user.HoTen,
            "username": user.TenDangNhap,
            "role": user.VaiTro,
            "bank_account": user.SoTaiKhoan,
            "bank_name": user.TenNganHang,
            "bank_owner": user.ChuTaiKhoan
        }
    })

@auth_bp.route('/profile', methods=['PUT'])
@require_auth
def update_profile():
    data = request.json
    user = NguoiDung.query.get(request.user_id)
    if not user:
        return jsonify({"success": False, "message": "Không tìm thấy người dùng"}), 404

    # Cập nhật thông tin nếu có truyền lên
    if 'fullname' in data:
        user.HoTen = data['fullname']
    if 'bank_account' in data:
        user.SoTaiKhoan = data['bank_account']
    if 'bank_name' in data:
        user.TenNganHang = data['bank_name']
    if 'bank_owner' in data:
        user.ChuTaiKhoan = data['bank_owner']

    db.session.commit()
    return jsonify({"success": True, "message": "Cập nhật thông tin tài khoản thành công"})

@auth_bp.route('/users/<int:shipper_id>/shipper-config', methods=['PUT'])
@require_auth
@require_role(['QUANTRI'])
def update_shipper_config(shipper_id):
    data = request.json
    user = NguoiDung.query.get(shipper_id)
    if not user or user.VaiTro != 'NHANVIEN':
        return jsonify({"success": False, "message": "Không tìm thấy shipper hoặc người dùng không phải shipper"}), 404
        
    if 'daily_limit' in data:
        try:
            limit = int(data['daily_limit'])
            if limit < 0:
                return jsonify({"success": False, "message": "Hạn mức ngày không thể nhỏ hơn 0"}), 400
            user.GioiHanDonNgay = limit
        except ValueError:
            return jsonify({"success": False, "message": "Hạn mức ngày phải là số nguyên hợp lệ"}), 400
            
    if 'notes' in data:
        user.GhiChuNhanSu = data['notes']
        
    db.session.commit()
    return jsonify({"success": True, "message": "Cập nhật cấu hình shipper thành công"})


