import jwt
from functools import wraps
from flask import request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from app.models import User, ApiKey

def hash_password(password: str) -> str:
    return generate_password_hash(password)

def verify_password(hashed_password: str, password: str) -> bool:
    return check_password_hash(hashed_password, password)

def generate_jwt(user_id: int, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role
    }
    # To keep it simple for the project, token valid forever or rely on standard exp
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

def decode_jwt(token: str):
    try:
        return jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
    except Exception:
        return None

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]

        if not token:
            return jsonify({'success': False, 'message': 'Token bị thiếu!'}), 401
            
        data = decode_jwt(token)
        if not data:
            return jsonify({'success': False, 'message': 'Token không hợp lệ!'}), 401

        request.user_id = data.get('user_id')
        request.user_role = data.get('role')
        return f(*args, **kwargs)
    return decorated

def require_role(allowed_roles):
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated_function(*args, **kwargs):
            if request.user_role not in allowed_roles:
                return jsonify({'success': False, 'message': 'Bạn không có quyền truy cập!'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return jsonify({'success': False, 'message': 'Thiếu X-API-Key header'}), 401
            
        key_record = ApiKey.query.filter_by(ApiKeyString=api_key, IsActive=True).first()
        if not key_record:
            return jsonify({'success': False, 'message': 'API Key không hợp lệ hoặc đã bị khóa'}), 401
            
        request.partner_user_id = key_record.Partner_UserID
        return f(*args, **kwargs)
    return decorated
