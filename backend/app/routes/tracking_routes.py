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

    sender_name = order.TenNguoiGui or (sender_addr.TenLienHe if sender_addr else order.nguoi_gui.HoTen)
    sender_phone = order.SoDienThoaiGui or (sender_addr.SoDienThoai if sender_addr else "")
    sender_address_text = order.DiaChiGui or (sender_addr.DiaChiChiTiet if sender_addr else "Kho bưu cục Antigravity")

    return jsonify({
        "success": True, 
        "data": {
            "order_id": order.MaDonHang,
            "current_status": order.TrangThaiHienTai,
            "created_at": order.NgayTao.isoformat(),
            "timeline": timeline,
            
            # Thông tin liên hệ & Tọa độ định vị
            "sender_name": sender_name,
            "sender_phone": sender_phone,
            "sender_address": sender_address_text,
            "sender_lat": float(order.ViDoGui) if order.ViDoGui is not None else (float(sender_addr.ViDo) if (sender_addr and sender_addr.ViDo is not None) else None),
            "sender_lng": float(order.KinhDoGui) if order.KinhDoGui is not None else (float(sender_addr.KinhDo) if (sender_addr and sender_addr.KinhDo is not None) else None),
            "receiver_name": order.TenNguoiNhan,
            "receiver_phone": order.SoDienThoaiNhan,
            "receiver_address": order.DiaChiNhan,
            "receiver_lat": float(order.ViDoNhan) if order.ViDoNhan is not None else None,
            "receiver_lng": float(order.KinhDoNhan) if order.KinhDoNhan is not None else None,
            
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
            "service_package": order.goi_dich_vu.TenGoi if order.goi_dich_vu else "STANDARD",
            "distance_km": float(order.KhoangCachKm) if order.KhoangCachKm is not None else 0.0
        }
    })


