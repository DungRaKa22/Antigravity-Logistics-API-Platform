import random
import string
import openpyxl
from io import BytesIO
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Order, TrackingHistory, Reconciliation, ApiKey
from app.utils.security import require_auth, require_role, require_api_key
from app.services.osrm_service import get_smart_distance
from app.services.finance_service import calculate_shipping_fee, calculate_final_payout
from datetime import datetime
import threading
import requests

order_bp = Blueprint('order', __name__)

def generate_order_id():
    suffix = ''.join(random.choices(string.digits, k=6))
    return f"AG-{suffix}"

def trigger_webhook_async(url, payload):
    try:
        requests.post(url, json=payload, timeout=5)
    except:
        pass

@order_bp.route('/calculate', methods=['POST'])
@require_auth
def calculate_fee():
    data = request.json
    dist = get_smart_distance(data.get('addr_gui'), data.get('addr_nhan'))
    fee = calculate_shipping_fee(dist, int(data.get('weight', 0)))
    return jsonify({"success": True, "data": {"distance_km": dist, "shipping_fee": fee}})

@order_bp.route('/', methods=['POST'])
@require_auth
@require_role(['SHOP'])
def create_order():
    data = request.json
    order_id = generate_order_id()
    
    # Tính cước thông minh
    dist = get_smart_distance(data.get('sender_address'), data.get('receiver_address'))
    fee = calculate_shipping_fee(dist, int(data.get('weight_gram', 0)))

    # Tạo Order
    order = Order(
        OrderID=order_id,
        Sender_UserID=request.user_id,
        ReceiverName=data['receiver_name'],
        ReceiverPhone=data['receiver_phone'],
        ReceiverAddress=data['receiver_address'],
        WeightGram=int(data.get('weight_gram', 0)),
        DistanceKm=dist,
        ShippingFee=fee,
        CodAmount=float(data.get('cod_amount', 0)),
        CurrentStatus='PENDING'
    )
    db.session.add(order)

    # Khởi tạo log TrackingHistory
    # Dùng 1 đại diện ID=1 làm Admin system update ban đầu
    log = TrackingHistory(
        OrderID=order_id,
        StatusCode='PENDING',
        LocationInfo='Đơn hàng khởi tạo thành công',
        UpdatedBy_AdminID=1 
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({"success": True, "message": "Tạo đơn thành công", "data": {"order_id": order_id, "shipping_fee": fee}}), 201

@order_bp.route('/', methods=['GET'])
@require_auth
def get_orders():
    if request.user_role == 'SHOP':
        orders = Order.query.filter_by(Sender_UserID=request.user_id).all()
    else:  # ADMIN
        orders = Order.query.all()

    data = [{
        "order_id": o.OrderID,
        "receiver": o.ReceiverName,
        "fee": float(o.ShippingFee),
        "cod": float(o.CodAmount),
        "status": o.CurrentStatus,
        "created_at": o.CreatedAt.isoformat()
    } for o in orders]

    return jsonify({"success": True, "data": data})

@order_bp.route('/<order_id>/status', methods=['PUT'])
@require_auth
@require_role(['ADMIN'])
def update_status(order_id):
    data = request.json
    new_status = data.get('status')
    location_info = data.get('location_info', '')

    order = Order.query.get(order_id)
    if not order:
        return jsonify({"success": False, "message": "Không tìm thấy Mã Vận Đơn!"}), 404

    order.CurrentStatus = new_status
    
    log = TrackingHistory(
        OrderID=order_id,
        StatusCode=new_status,
        LocationInfo=location_info,
        UpdatedBy_AdminID=request.user_id
    )
    db.session.add(log)

    # Chuyển trạng thái DELIVERED -> tự động gen Reconciliations
    if new_status == 'DELIVERED':
        recon = Reconciliation(
            OrderID=order_id,
            Shop_UserID=order.Sender_UserID,
            TotalCollected=order.CodAmount,
            FeeDeducted=order.ShippingFee,
            FinalPayout=calculate_final_payout(order.CodAmount, order.ShippingFee),
            ReconStatus='UNPAID'
        )
        db.session.add(recon)

    db.session.commit()

    # Đoạn mô phỏng Trigger async Webhook (Nếu đơn thuộc về PARTNER)
    # Tạm check bằng role if needed
    # ...

    return jsonify({"success": True, "message": "Cập nhật trạng thái thành công"})

@order_bp.route('/bulk-excel', methods=['POST'])
@require_auth
@require_role(['SHOP', 'PARTNER'])
def upload_excel():
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "Không có file"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "message": "File rỗng"}), 400

    try:
        workbook = openpyxl.load_workbook(file)
        sheet = workbook.active
        inserted_orders = []

        # Giả định Cột: A: Người Nhận, B: SĐT, C: Địa Chỉ, D: Khối Lượng, E: Tiền COD
        for row in sheet.iter_rows(min_row=2, values_only=True): # Bỏ qua header
            receiver, phone, address, weight, cod = row[:5]
            if not receiver:
                break
                
            dist = get_smart_distance("Trụ sở mặc định", address)
            fee = calculate_shipping_fee(dist, int(weight or 0))
            oid = generate_order_id()

            o = Order(
                OrderID=oid,
                Sender_UserID=request.user_id,
                ReceiverName=str(receiver),
                ReceiverPhone=str(phone),
                ReceiverAddress=str(address),
                WeightGram=int(weight or 0),
                DistanceKm=dist,
                ShippingFee=fee,
                CodAmount=float(cod or 0),
                CurrentStatus='PENDING'
            )
            db.session.add(o)
            
            inserted_orders.append(oid)
            
        db.session.commit()
        return jsonify({"success": True, "message": f"Tạo thành công {len(inserted_orders)} đơn hàng", "data": inserted_orders})

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Lỗi parse excel: {str(e)}"}), 500
