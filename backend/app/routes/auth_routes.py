from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import User
from app.utils.security import hash_password, verify_password, generate_jwt

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    if not data or not all(k in data for k in ('username', 'password', 'fullname')):
        return jsonify({"success": False, "message": "Thiếu dữ liệu"}), 400

    if User.query.filter_by(Username=data['username']).first():
        return jsonify({"success": False, "message": "Username đã tồn tại"}), 400

    # Role mặc định là SHOP khi tự đăng ký trên portal
    new_user = User(
        Username=data['username'],
        PasswordHash=hash_password(data['password']),
        FullName=data['fullname'],
        Role='SHOP'
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"success": True, "message": "Đăng ký thành công"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    if not data or not all(k in data for k in ('username', 'password')):
        return jsonify({"success": False, "message": "Thiếu credentials"}), 400

    user = User.query.filter_by(Username=data['username']).first()
    if not user or not verify_password(user.PasswordHash, data['password']):
        return jsonify({"success": False, "message": "Sai tài khoản hoặc mật khẩu"}), 401

    token = generate_jwt(user.UserID, user.Role)
    return jsonify({
        "success": True,
        "message": "Đăng nhập thành công",
        "data": {
            "token": token,
            "role": user.Role,
            "fullname": user.FullName
        }
    }), 200
