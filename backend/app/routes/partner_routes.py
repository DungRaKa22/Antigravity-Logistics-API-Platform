from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import KhoaAPI, NguoiDung
from app.utils.security import require_auth, require_role
from secrets import token_hex

partner_bp = Blueprint('partner', __name__)

@partner_bp.route('/keys', methods=['POST'])
@require_auth
@require_role(['QUANTRI'])
def create_api_key():
    data = request.json
    partner_id = data.get('partner_id')
    
    partner = NguoiDung.query.filter_by(MaNguoiDung=partner_id, VaiTro='DOITAC').first()
    if not partner:
        return jsonify({'success': False, 'message': 'Không tìm thấy đối tác này!'}), 404

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
