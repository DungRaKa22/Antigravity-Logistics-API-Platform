from flask import Blueprint, jsonify
from app.models import LichSu_TrangThai, DonHang

tracking_bp = Blueprint('tracking', __name__)

@tracking_bp.route('/<order_id>', methods=['GET'])
def get_tracking(order_id):
    order = DonHang.query.filter_by(MaDonHang=order_id).first()
    if not order:
        return jsonify({"success": False, "message": "Không tìm thấy mã vận đơn!"}), 404

    history = LichSu_TrangThai.query.filter_by(MaDonHang=order_id).order_by(LichSu_TrangThai.ThoiGian.desc()).all()
    
    timeline = [{
        "status": h.MaTrangThai,
        "info": h.ThongTinViTri,
        "time": h.ThoiGian.isoformat()
    } for h in history]

    return jsonify({
        "success": True, 
        "data": {
            "order_id": order.MaDonHang,
            "current_status": order.TrangThaiHienTai,
            "created_at": order.NgayTao.isoformat(),
            "timeline": timeline
        }
    })

