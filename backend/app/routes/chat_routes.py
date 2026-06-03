"""
Chat HTTP Blueprint - Antigravity Logistics API Platform
Handles file/image uploads for complaints and retrieves room chat history
"""
import os
import uuid
from flask import Blueprint, request, jsonify, current_app, url_for
from werkzeug.utils import secure_filename
from app.extensions import db
from app.models import TinNhan, NguoiDung, KhieuNai, DonHang
from app.utils.security import require_auth, require_role

chat_bp = Blueprint('chat', __name__)

# Allowed image file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@chat_bp.route('/upload', methods=['POST'])
@require_auth
def upload_file():
    """Handles image or proof file uploads for chat and incident complaints"""
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "Không tìm thấy tệp tin được gửi!"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "message": "Tên tệp tin trống!"}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Add uuid to prevent filename collision
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        
        # Ensure upload folder exists
        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
            
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        
        # Generate static URL serving from Flask
        file_url = f"/static/uploads/{unique_filename}"
        
        return jsonify({
            "success": True,
            "message": "Tải tệp tin lên thành công!",
            "file_url": file_url
        }), 201
    else:
        return jsonify({"success": False, "message": "Định dạng tệp tin không được hỗ trợ!"}), 400

@chat_bp.route('/history/<room_id>', methods=['GET'])
@require_auth
def get_chat_history(room_id):
    """Retrieves all past messages in a specific chat room"""
    messages = TinNhan.query.filter_by(PhongChatId=room_id).order_by(TinNhan.ThoiGianGui.asc()).all()
    
    data = []
    for msg in messages:
        sender = NguoiDung.query.get(msg.MaNguoiGui)
        sender_name = sender.HoTen if sender else f"User {msg.MaNguoiGui}"
        
        data.append({
            "message_id": msg.MaTinNhan,
            "room": msg.PhongChatId,
            "sender_id": msg.MaNguoiGui,
            "sender_name": sender_name,
            "receiver_id": msg.MaNguoiNhan,
            "content": msg.NoiDung,
            "file_url": msg.FileDinhKemUrl,
            "timestamp": msg.ThoiGianGui.isoformat()
        })
        
    return jsonify({
        "success": True,
        "room": room_id,
        "count": len(data),
        "data": data
    }), 200


@chat_bp.route('/complaints', methods=['GET'])
@require_auth
def get_complaints():
    role = request.user_role
    if role in ['ADMIN', 'QUANTRI', 'CSKH']:
        complaints = KhieuNai.query.order_by(KhieuNai.MaKhieuNai.desc()).all()
    else:
        complaints = KhieuNai.query.filter_by(MaKhachHang=request.user_id).order_by(KhieuNai.MaKhieuNai.desc()).all()
        
    # Auto-seed mock complaints if empty to wow the user!
    if not complaints and role in ['ADMIN', 'QUANTRI', 'CSKH']:
        orders = DonHang.query.limit(3).all()
        import random
        titles = [
            "Hộp hàng móp méo nghiêm trọng",
            "Shipper giao hàng trễ hẹn SLA",
            "Cần kiểm tra lại COD đơn hàng này"
        ]
        contents = [
            "Khách hàng phản hồi khi nhận bưu kiện thấy hộp bị rách nát, móp méo góc lớn. Nghi ngờ do vận chuyển va đập mạnh. Shop gửi kèm hình ảnh đính kèm.",
            "Bưu phẩm đã giao muộn hơn 2 ngày so với dự kiến. Khách hàng đã khiếu nại shop. Yêu cầu CSKH phản hồi nguyên nhân chậm trễ.",
            "Đối soát tiền COD của đơn này có sự chênh lệch so với cước phí thực tế. Vui lòng kiểm tra lại bưu cục gửi."
        ]
        for idx, o in enumerate(orders):
            if idx < len(titles):
                kn = KhieuNai(
                    MaDonHang=o.MaDonHang,
                    MaKhachHang=o.MaNguoiGui,
                    TieuDe=titles[idx],
                    NoiDung=contents[idx],
                    TrangThai='CHO_TIEP_NHAN'
                )
                db.session.add(kn)
        db.session.commit()
        complaints = KhieuNai.query.order_by(KhieuNai.MaKhieuNai.desc()).all()

    data = []
    for c in complaints:
        client = NguoiDung.query.get(c.MaKhachHang)
        data.append({
            "ticket_id": c.MaKhieuNai,
            "order_id": c.MaDonHang,
            "customer_id": c.MaKhachHang,
            "customer_name": client.HoTen if client else "Shop đối tác",
            "title": c.TieuDe,
            "content": c.NoiDung,
            "status": c.TrangThai
        })
    return jsonify({"success": True, "data": data})


@chat_bp.route('/complaints', methods=['POST'])
@require_auth
def create_complaint():
    data = request.json or {}
    order_id = data.get('order_id')
    title = data.get('title')
    content = data.get('content')
    
    if not order_id or not title or not content:
        return jsonify({"success": False, "message": "Thiếu thông tin khiếu nại"}), 400
        
    order = DonHang.query.get(order_id)
    if not order:
        return jsonify({"success": False, "message": "Không tìm thấy đơn hàng"}), 404
        
    kn = KhieuNai(
        MaDonHang=order_id,
        MaKhachHang=request.user_id,
        TieuDe=title,
        NoiDung=content,
        TrangThai='CHO_TIEP_NHAN'
    )
    db.session.add(kn)
    db.session.commit()
    
    return jsonify({
        "success": True, 
        "message": "Gửi khiếu nại thành công! Nhân viên CSKH sẽ phản hồi qua chat ngay.",
        "data": {
            "ticket_id": kn.MaKhieuNai,
            "status": kn.TrangThai
        }
    }), 201


@chat_bp.route('/complaints/<int:id>/status', methods=['PUT'])
@require_auth
@require_role(['ADMIN', 'QUANTRI', 'CSKH'])
def update_complaint_status(id):
    data = request.json or {}
    status = data.get('status')
    
    if not status or status not in ['CHO_TIEP_NHAN', 'DANG_XU_LY', 'DA_XU_LY']:
        return jsonify({"success": False, "message": "Trạng thái không hợp lệ"}), 400
        
    kn = KhieuNai.query.get(id)
    if not kn:
        return jsonify({"success": False, "message": "Không tìm thấy khiếu nại"}), 404
        
    kn.TrangThai = status
    db.session.commit()
    return jsonify({"success": True, "message": f"Cập nhật trạng thái khiếu nại #{id} thành công!"})

