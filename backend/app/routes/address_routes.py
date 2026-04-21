from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import AddressBook
from app.utils.security import require_auth, require_role

address_bp = Blueprint('address', __name__)

@address_bp.route('/', methods=['GET'])
@require_auth
@require_role(['SHOP'])
def get_addresses():
    user_id = request.user_id
    query_str = request.args.get('q', '').strip()

    books = AddressBook.query.filter_by(UserID=user_id)
    if query_str:
        books = books.filter(
            (AddressBook.ContactName.ilike(f'%{query_str}%')) |
            (AddressBook.ContactPhone.ilike(f'%{query_str}%'))
        )
    
    books = books.all()
    data = [{
        "id": b.AddressID,
        "name": b.ContactName,
        "phone": b.ContactPhone,
        "address": b.FullAddress,
        "lat": float(b.Latitude) if b.Latitude else None,
        "lng": float(b.Longitude) if b.Longitude else None
    } for b in books]

    return jsonify({"success": True, "data": data})

@address_bp.route('/', methods=['POST'])
@require_auth
@require_role(['SHOP'])
def create_address():
    data = request.json
    if not all(k in data for k in ('name', 'phone', 'address')):
        return jsonify({"success": False, "message": "Không đủ thông tin"}), 400

    new_adr = AddressBook(
        UserID=request.user_id,
        ContactName=data['name'],
        ContactPhone=data['phone'],
        FullAddress=data['address'],
        Latitude=data.get('lat'),
        Longitude=data.get('lng')
    )
    db.session.add(new_adr)
    db.session.commit()

    return jsonify({"success": True, "message": "Thêm địa chỉ thành công", "id": new_adr.AddressID}), 201

@address_bp.route('/<int:id>', methods=['DELETE'])
@require_auth
@require_role(['SHOP'])
def delete_address(id):
    adr = AddressBook.query.filter_by(AddressID=id, UserID=request.user_id).first()
    if not adr:
        return jsonify({"success": False, "message": "Không tìm thấy địa chỉ"}), 404
        
    db.session.delete(adr)
    db.session.commit()
    return jsonify({"success": True, "message": "Xóa thành công"})
