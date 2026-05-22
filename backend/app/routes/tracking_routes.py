from flask import Blueprint, jsonify
from app.models import LichSu_TrangThai, DonHang, SoDiaChi

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

    # Lấy thông tin người gửi từ sổ địa chỉ của họ
    sender_addr = SoDiaChi.query.filter_by(MaNguoiDung=order.MaNguoiGui, LaMacDinh=True).first()
    if not sender_addr:
        sender_addr = SoDiaChi.query.filter_by(MaNguoiDung=order.MaNguoiGui).first()

    sender_name = sender_addr.TenLienHe if sender_addr else order.nguoi_gui.HoTen
    sender_phone = sender_addr.SoDienThoai if sender_addr else ""
    sender_address_text = sender_addr.DiaChiChiTiet if sender_addr else "Kho bưu cục Antigravity"

    return jsonify({
        "success": True, 
        "data": {
            "order_id": order.MaDonHang,
            "current_status": order.TrangThaiHienTai,
            "created_at": order.NgayTao.isoformat(),
            "timeline": timeline,
            
            # Thông tin liên hệ
            "sender_name": sender_name,
            "sender_phone": sender_phone,
            "sender_address": sender_address_text,
            "receiver_name": order.TenNguoiNhan,
            "receiver_phone": order.SoDienThoaiNhan,
            "receiver_address": order.DiaChiNhan,
            
            # Thông số hàng hóa
            "description": order.MoTaHangHoa,
            "weight_gram": order.TrongLuongGram,
            "length_cm": order.ChieuDaiCM or 10,
            "width_cm": order.ChieuRongCM or 10,
            "height_cm": order.ChieuCaoCM or 10,
            "volumetric_weight_gram": order.TrongLuongQuyDoiGram or 0,
            
            # Tài chính & Nghiệp vụ
            "cod_amount": float(order.TienThuHoCOD),
            "shipping_fee": float(order.PhiVanChuyen),
            "insurance_fee": float(order.PhiBaoHiem),
            "inspection_policy": order.QuyenKiemTra,
            "pickup_type": order.HinhThucLayHang,
            "service_package": order.goi_dich_vu.TenGoi if order.goi_dich_vu else "STANDARD"
        }
    })


