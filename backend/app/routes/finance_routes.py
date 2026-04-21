from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Reconciliation, Order
from app.utils.security import require_auth, require_role
from datetime import datetime

finance_bp = Blueprint('finance', __name__)

@finance_bp.route('/', methods=['GET'])
@require_auth
def get_reconciliations():
    role = request.user_role
    
    if role == 'SHOP':
        recons = Reconciliation.query.filter_by(Shop_UserID=request.user_id).all()
    elif role == 'ADMIN':
        recons = Reconciliation.query.all()
    else:
        return jsonify({'success': False, 'message': 'Không có quyền truy cập'}), 403

    data = [{
        "id": r.ReconID,
        "order_id": r.OrderID,
        "total_collected": float(r.TotalCollected),
        "fee_deducted": float(r.FeeDeducted),
        "final_payout": float(r.FinalPayout),
        "status": r.ReconStatus,
        "created_at": r.CreatedAt.isoformat(),
        "processed_at": r.ProcessedAt.isoformat() if r.ProcessedAt else None
    } for r in recons]

    return jsonify({"success": True, "data": data})

@finance_bp.route('/<int:id>/pay', methods=['PUT'])
@require_auth
@require_role(['ADMIN'])
def pay_reconciliation(id):
    recon = Reconciliation.query.get(id)
    if not recon:
        return jsonify({'success': False, 'message': 'Không tìm thấy mã đối soát'}), 404

    if recon.ReconStatus == 'PAID':
        return jsonify({'success': False, 'message': 'Đơn này đã được thanh toán rồi'}), 400

    recon.ReconStatus = 'PAID'
    recon.ProcessedAt = datetime.utcnow()
    db.session.commit()

    return jsonify({'success': True, 'message': 'Đối soát thành công (Đã chuyển khoản)'})
