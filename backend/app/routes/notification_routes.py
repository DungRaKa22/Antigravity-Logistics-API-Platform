"""
Notification Blueprint - Antigravity Logistics API Platform
Manages browser VAPID push subscription records in PostgreSQL
"""
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import DangKyNhanThongBao
from app.utils.security import require_auth

notification_bp = Blueprint('notification', __name__)

@notification_bp.route('/subscribe', methods=['POST'])
@require_auth
def subscribe_push():
    data = request.json
    endpoint = data.get('endpoint')
    keys = data.get('keys', {})
    p256dh = keys.get('p256dh')
    auth = keys.get('auth')
    
    if not endpoint or not p256dh or not auth:
        return jsonify({"success": False, "message": "Thiếu thông tin đăng ký push token!"}), 400
        
    # Check if subscription already exists to avoid duplicates
    existing = DangKyNhanThongBao.query.filter_by(
        MaNguoiDung=request.user_id,
        Endpoint=endpoint
    ).first()
    
    if existing:
        # Update existing keys
        existing.P256dh = p256dh
        existing.Auth = auth
        db.session.commit()
        return jsonify({"success": True, "message": "Cập nhật đăng ký Web Push thành công!"})
        
    # Create new subscription
    new_sub = DangKyNhanThongBao(
        MaNguoiDung=request.user_id,
        Endpoint=endpoint,
        P256dh=p256dh,
        Auth=auth
    )
    db.session.add(new_sub)
    db.session.commit()
    
    return jsonify({"success": True, "message": "Đăng ký nhận thông báo đẩy nền thành công!"}), 201

@notification_bp.route('/unsubscribe', methods=['POST'])
@require_auth
def unsubscribe_push():
    data = request.json
    endpoint = data.get('endpoint')
    
    if not endpoint:
        return jsonify({"success": False, "message": "Thiếu endpoint cần hủy đăng ký"}), 400
        
    sub = DangKyNhanThongBao.query.filter_by(
        MaNguoiDung=request.user_id,
        Endpoint=endpoint
    ).first()
    
    if not sub:
        return jsonify({"success": False, "message": "Không tìm thấy đăng ký Web Push này!"}), 404
        
    db.session.delete(sub)
    db.session.commit()
    
    return jsonify({"success": True, "message": "Hủy đăng ký nhận thông báo đẩy thành công!"})

@notification_bp.route('/active', methods=['GET'])
@require_auth
def get_active_subscriptions():
    """Lists active push subscriptions for the current user"""
    subs = DangKyNhanThongBao.query.filter_by(MaNguoiDung=request.user_id).all()
    data = [{
        "subscription_id": s.MaDangKy,
        "endpoint": s.Endpoint,
        "created_at": s.NgayTao.isoformat()
    } for s in subs]
    
    return jsonify({"success": True, "data": data})
