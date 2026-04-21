from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import ApiKey, User
from app.utils.security import require_auth, require_role
from secrets import token_hex

partner_bp = Blueprint('partner', __name__)

@partner_bp.route('/keys', methods=['POST'])
@require_auth
@require_role(['ADMIN'])
def create_api_key():
    data = request.json
    partner_id = data.get('partner_id')
    
    partner = User.query.filter_by(UserID=partner_id, Role='PARTNER').first()
    if not partner:
        return jsonify({'success': False, 'message': 'Không tìm thấy đối tác này!'}), 404

    # Generate a secure 64 chars API Key
    new_key = f"AG_PARTNER_{token_hex(32)[:64-11].upper()}"
    
    key_record = ApiKey(
        Partner_UserID=partner_id,
        ApiKeyString=new_key,
        IsActive=True
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
