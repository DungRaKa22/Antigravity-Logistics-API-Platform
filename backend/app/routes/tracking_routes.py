from flask import Blueprint, jsonify
from app.models import TrackingHistory, Order

tracking_bp = Blueprint('tracking', __name__)

@tracking_bp.route('/<order_id>', methods=['GET'])
def get_tracking(order_id):
    order = Order.query.filter_by(OrderID=order_id).first()
    if not order:
        return jsonify({"success": False, "message": "Không tìm thấy mã vận đơn!"}), 404

    history = TrackingHistory.query.filter_by(OrderID=order_id).order_by(TrackingHistory.Timestamp.desc()).all()
    
    timeline = [{
        "status": h.StatusCode,
        "info": h.LocationInfo,
        "time": h.Timestamp.isoformat()
    } for h in history]

    return jsonify({
        "success": True, 
        "data": {
            "order_id": order.OrderID,
            "current_status": order.CurrentStatus,
            "created_at": order.CreatedAt.isoformat(),
            "timeline": timeline
        }
    })
