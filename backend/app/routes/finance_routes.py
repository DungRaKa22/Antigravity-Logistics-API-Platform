from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import DoiSoat, DonHang
from app.utils.security import require_auth, require_role
from datetime import datetime

finance_bp = Blueprint('finance', __name__)

@finance_bp.route('/', methods=['GET'])
@require_auth
def get_reconciliations():
    role = request.user_role
    
    if role == 'KHACHHANG':
        recons = DoiSoat.query.filter_by(MaKhachHang=request.user_id).all()
    elif role == 'QUANTRI':
        recons = DoiSoat.query.all()
    else:
        return jsonify({'success': False, 'message': 'Không có quyền truy cập'}), 403

    data = [{
        "id": r.MaDoiSoat,
        "order_id": r.MaDonHang,
        "total_collected": float(r.TongTienThu),
        "fee_deducted": float(r.PhiVanChuyenTru),
        "final_payout": float(r.ThucNhan),
        "status": r.TrangThaiDoiSoat,
        "created_at": r.NgayTao.isoformat(),
        "processed_at": r.NgayXuLy.isoformat() if r.NgayXuLy else None
    } for r in recons]

    return jsonify({"success": True, "data": data})

@finance_bp.route('/<int:id>/pay', methods=['PUT'])
@require_auth
@require_role(['QUANTRI'])
def pay_reconciliation(id):
    recon = DoiSoat.query.get(id)
    if not recon:
        return jsonify({'success': False, 'message': 'Không tìm thấy mã đối soát'}), 404

    if recon.TrangThaiDoiSoat == 'DA_THANH_TOAN':
        return jsonify({'success': False, 'message': 'Đơn này đã được thanh toán rồi'}), 400

    recon.TrangThaiDoiSoat = 'DA_THANH_TOAN'
    recon.NgayXuLy = datetime.utcnow()
    db.session.commit()

    return jsonify({'success': True, 'message': 'Đối soát thành công (Đã chuyển khoản)'})
