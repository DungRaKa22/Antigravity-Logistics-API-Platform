import random
import string
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import DoiSoat, DonHang, HoaDonDoiSoat, NguoiDung
from app.utils.security import require_auth, require_role
from datetime import datetime

finance_bp = Blueprint('finance', __name__)

@finance_bp.route('/', methods=['GET'])
@require_auth
def get_reconciliations():
    role = request.user_role
    invoice_id = request.args.get('invoice_id')
    
    query = DoiSoat.query
    if role == 'KHACHHANG':
        query = query.filter_by(MaKhachHang=request.user_id)
    elif role != 'QUANTRI':
        return jsonify({'success': False, 'message': 'Không có quyền truy cập'}), 403
        
    if invoice_id:
        if invoice_id == 'null':
            query = query.filter(DoiSoat.MaHoaDon == None)
        else:
            query = query.filter_by(MaHoaDon=invoice_id)
            
    recons = query.all()

    data = [{
        "id": r.MaDoiSoat,
        "order_id": r.MaDonHang,
        "total_collected": float(r.TongTienThu),
        "fee_deducted": float(r.PhiVanChuyenTru + r.PhiBaoHiemTru + r.PhiHoanTraTru + r.PhiGiaoMotPhanTru),
        "final_payout": float(r.ThucNhan),
        "status": r.TrangThaiDoiSoat,
        "invoice_id": r.MaHoaDon,
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

@finance_bp.route('/invoice', methods=['POST'])
@require_auth
def create_invoice():
    data = request.json
    role = request.user_role
    
    # Nếu là Admin, có thể chọn merchant_id từ request.
    # Nếu là Khách hàng, tự gom đơn của chính mình.
    if role == 'QUANTRI':
        merchant_id = data.get('merchant_id')
        if not merchant_id:
            return jsonify({'success': False, 'message': 'Cần chỉ định merchant_id'}), 400
    elif role == 'KHACHHANG':
        merchant_id = request.user_id
    else:
        return jsonify({'success': False, 'message': 'Quyền truy cập bị từ chối'}), 403

    # Tìm các đơn hàng đã đối soát của Merchant này mà CHƯA được gán vào hóa đơn nào
    recons = DoiSoat.query.filter_by(MaKhachHang=merchant_id, MaHoaDon=None, TrangThaiDoiSoat='CHUA_THANH_TOAN').all()
    if not recons:
        return jsonify({'success': False, 'message': 'Không có đơn hàng đã vận chuyển nào chưa đối soát để gom hóa đơn!'}), 400

    # Tính toán tổng hợp tài chính
    total_cod = sum(float(r.TongTienThu) for r in recons)
    total_fees = sum(float(r.PhiVanChuyenTru + r.PhiBaoHiemTru + r.PhiHoanTraTru + r.PhiGiaoMotPhanTru) for r in recons)
    total_payout = total_cod - total_fees

    # Sinh mã hóa đơn duy nhất
    random_suffix = ''.join(random.choices(string.digits, k=6))
    invoice_id = f"AG-INV-{datetime.utcnow().strftime('%Y%m%d')}-{random_suffix}"

    # Tạo Hóa Đơn mới
    invoice = HoaDonDoiSoat(
        MaHoaDon=invoice_id,
        MaKhachHang=merchant_id,
        TongCOD=total_cod,
        TongPhiVanChuyen=total_fees,
        TongThucNhan=total_payout,
        TrangThaiThanhToan='CHUA_THANH_TOAN'
    )
    db.session.add(invoice)

    # Cập nhật mã hóa đơn cho tất cả các bản ghi đối soát đơn lẻ được gom
    for r in recons:
        r.MaHoaDon = invoice_id

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Gom hóa đơn thành công! Mã hóa đơn: {invoice_id}',
        'data': {
            'invoice_id': invoice_id,
            'total_cod': total_cod,
            'total_fees': total_fees,
            'net_payout': total_payout
        }
    }), 201

@finance_bp.route('/invoices', methods=['GET'])
@require_auth
def get_invoices():
    role = request.user_role
    
    if role == 'KHACHHANG':
        invoices = HoaDonDoiSoat.query.filter_by(MaKhachHang=request.user_id).order_by(HoaDonDoiSoat.NgayTao.desc()).all()
    elif role == 'QUANTRI':
        invoices = HoaDonDoiSoat.query.order_by(HoaDonDoiSoat.NgayTao.desc()).all()
    else:
        return jsonify({'success': False, 'message': 'Quyền truy cập bị từ chối'}), 403

    data = []
    for inv in invoices:
        inv_data = {
            "invoice_id": inv.MaHoaDon,
            "merchant_id": inv.MaKhachHang,
            "merchant_name": inv.khach_hang.HoTen if inv.khach_hang else "N/A",
            "total_cod": float(inv.TongCOD),
            "total_fees": float(inv.TongPhiVanChuyen),
            "net_payout": float(inv.TongThucNhan),
            "status": inv.TrangThaiThanhToan,
            "created_at": inv.NgayTao.isoformat(),
            "processed_at": inv.NgayThanhToan.isoformat() if inv.NgayThanhToan else None,
            "vietqr_url": None,
            "merchant_bank_info": None,
            "orders": [{
                "order_id": r.MaDonHang,
                "cod": float(r.TongTienThu),
                "fee": float(r.PhiVanChuyenTru + r.PhiBaoHiemTru + r.PhiHoanTraTru + r.PhiGiaoMotPhanTru),
                "payout": float(r.ThucNhan),
                "status": r.TrangThaiDoiSoat,
                "created_at": r.NgayTao.isoformat()
            } for r in inv.doi_soat_records]
        }

        # Nếu Net payout < 0: Merchant nợ tiền nền tảng cước phí. Sinh mã VietQR động để Merchant thanh toán.
        # Ngân hàng MB Bank: 0329603475.
        if inv.TongThucNhan < 0:
            amount = abs(float(inv.TongThucNhan))
            # Chuẩn hóa chuỗi URL VietQR
            inv_data["vietqr_url"] = (
                f"https://img.vietqr.io/image/MB-0329603475-compact2.png"
                f"?amount={int(amount)}"
                f"&addInfo=AG_PAY_{inv.MaHoaDon}"
                f"&accountName=CONG%20TY%20ANTIGRAVITY%20EXPRESS"
            )
        # Nếu Net payout > 0: Nền tảng nợ Merchant. Hiển thị thông tin ngân hàng của Merchant để Admin chuyển khoản.
        else:
            m = inv.khach_hang
            if m:
                inv_data["merchant_bank_info"] = {
                    "account_no": m.SoTaiKhoan or "Chưa cấu hình",
                    "bank_name": m.TenNganHang or "Chưa cấu hình",
                    "account_name": m.ChuTaiKhoan or m.HoTen
                }
                
        data.append(inv_data)

    return jsonify({"success": True, "data": data})

@finance_bp.route('/invoices/<invoice_id>/pay', methods=['PUT'])
@require_auth
@require_role(['QUANTRI'])
def pay_invoice(invoice_id):
    invoice = HoaDonDoiSoat.query.get(invoice_id)
    if not invoice:
        return jsonify({'success': False, 'message': 'Không tìm thấy hóa đơn'}), 404

    if invoice.TrangThaiThanhToan == 'DA_THANH_TOAN':
        return jsonify({'success': False, 'message': 'Hóa đơn này đã được thanh toán đối soát rồi'}), 400

    now = datetime.utcnow()
    
    # 1. Cập nhật trạng thái Hóa đơn
    invoice.TrangThaiThanhToan = 'DA_THANH_TOAN'
    invoice.NgayThanhToan = now
    
    # 2. Cập nhật trạng thái tất cả các đơn hàng đối soát thuộc hóa đơn này
    for r in invoice.doi_soat_records:
        r.TrangThaiDoiSoat = 'DA_THANH_TOAN'
        r.NgayXuLy = now

    db.session.commit()

    return jsonify({'success': True, 'message': f'Duyệt thanh toán thành công hóa đơn {invoice_id}!'})
