"""
Payment Blueprint - Antigravity Logistics API Platform
Simulates Momo Payment Gateway, secure webhook callback, and payment locks
"""
import hashlib
import hmac
import json
from datetime import datetime
from flask import Blueprint, request, jsonify, render_template_string
from app.extensions import db
from app.models import DonHang, LichSu_TrangThai, NguoiDung
from app.services.notification_service import trigger_notifications

payment_bp = Blueprint('payment', __name__)

# Mock Secret Key for HMAC-SHA256 MoMo verification
MOMO_SECRET_KEY = "AG_MOMO_SANDBOX_SECRET_HASH_KEY_2026"

def calculate_momo_signature(order_id, amount):
    """Generates HMAC-SHA256 signature for MoMo payload validation"""
    raw_signature = f"partnerCode=ANTIGRAVITY&orderId={order_id}&amount={amount}&orderInfo=Payment+for+{order_id}"
    signature = hmac.new(
        MOMO_SECRET_KEY.encode('utf-8'),
        raw_signature.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return signature

@payment_bp.route('/create-momo-session', methods=['POST'])
def create_momo_session():
    data = request.json
    order_id = data.get('order_id')
    
    order = DonHang.query.get(order_id)
    if not order:
        return jsonify({"success": False, "message": "Không tìm thấy đơn hàng!"}), 404
        
    amount = int(order.PhiVanChuyen)
    signature = calculate_momo_signature(order_id, amount)
    
    # In sandbox development, redirect to our mock checkout screen
    payment_url = f"/api/payment/simulate-checkout/{order_id}?signature={signature}"
    
    return jsonify({
        "success": True,
        "payment_url": payment_url,
        "amount": amount,
        "order_id": order_id
    })

@payment_bp.route('/webhook', methods=['POST'])
def momo_webhook():
    """Momo secure webhook endpoint verifying payload signatures"""
    data = request.json
    order_id = data.get('orderId')
    amount = data.get('amount')
    signature = data.get('signature')
    status = data.get('status') # 'SUCCESS' or 'FAILED'
    
    if not order_id or not amount or not signature:
        return jsonify({"success": False, "message": "Thiếu thông tin thanh toán"}), 400
        
    # Verify signature to prevent fake webhook attacks
    expected_signature = calculate_momo_signature(order_id, amount)
    if signature != expected_signature:
        return jsonify({"success": False, "message": "Chữ ký bảo mật MoMo không hợp lệ!"}), 400
        
    order = DonHang.query.get(order_id)
    if not order:
        return jsonify({"success": False, "message": "Không tìm thấy đơn hàng tương ứng!"}), 404
        
    if order.TrangThaiThanhToan == 'DA_THANH_TOAN':
        return jsonify({"success": True, "message": "Đơn hàng đã được thanh toán trước đó."})
        
    if status == 'SUCCESS':
        # Update DB order status
        order.TrangThaiThanhToan = 'DA_THANH_TOAN'
        order.TrangThaiHienTai = 'CHO_LAY_HANG'
        order.GiaoDichThanhToanId = f"MOMO_TXN_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        
        # Add history log
        log = LichSu_TrangThai(
            MaDonHang=order_id,
            MaTrangThai='CHO_LAY_HANG',
            ThongTinViTri=f"Thanh toán cước phí thành công qua ví MoMo. Đơn hàng được mở khóa và sẵn sàng bàn giao cho bưu tá.",
            MaNhanVienCapNhat=order.MaNguoiGui
        )
        db.session.add(log)
        db.session.commit()
        
        # ----------------------------------------------------------------------
        # Trigger Multi-Channel Notifications (SSE Web Toast & Web Push API)
        # ----------------------------------------------------------------------
        
        # 1. Customer Notification (Web Toast / Web Push)
        trigger_notifications(
            event_type="order_update",
            recipient_id=order.MaNguoiGui,
            payload={
                "order_id": order_id,
                "status": "CHO_LAY_HANG",
                "message": f"📦 Đơn hàng {order_id} đã thanh toán thành công qua MoMo! Đang chuyển cho bưu tá lấy hàng.",
                "updated_at": datetime.utcnow().isoformat()
            }
        )
        
        # 2. Shipper Notification (VAPID Web Push)
        # Find all shippers in the origin branch to alert them of a new pickup job
        if order.MaChiNhanhGui:
            shippers = NguoiDung.query.filter_by(VaiTro='SHIPPER', MaChiNhanh=order.MaChiNhanhGui).all()
            shipper_ids = [s.MaNguoiDung for s in shippers]
            if shipper_ids:
                trigger_notifications(
                    event_type="new_pickup_job",
                    recipient_id=shipper_ids,
                    payload={
                        "branch_id": order.MaChiNhanhGui,
                        "message": f"⚡ Có đơn hàng lấy mới ({order_id}) cách bạn rất gần! Mở app ôm đơn ngay.",
                        "updated_at": datetime.utcnow().isoformat()
                    }
                )
                
        return jsonify({"success": True, "message": "Xử lý thanh toán thành công!"}), 200
    else:
        return jsonify({"success": False, "message": "Thanh toán thất bại từ phía cổng thanh toán!"}), 400

@payment_bp.route('/simulate-checkout/<order_id>', methods=['GET'])
def simulate_checkout_page(order_id):
    """Renders a beautiful glassmorphic checkout gateway simulation page (MoMo or VietQR)"""
    order = DonHang.query.get(order_id)
    if not order:
        return "<h3>Không tìm thấy đơn hàng!</h3>", 404
        
    amount = int(order.PhiVanChuyen)
    signature = request.args.get('signature', calculate_momo_signature(order_id, amount))
    method = request.args.get('method', 'momo').lower()
    
    # Customize branding based on method
    if method == 'vietqr':
        gateway_title = "VietQR Secure Portal"
        gateway_subtitle = "Cổng Thanh Toán Quốc Gia NAPAS 24/7"
        primary_color = "#0054a5"
        neon_color = "#00d4ff"
        glow_color = "rgba(0, 212, 255, 0.4)"
        space_dark = "#02071a"
        glass_card = "rgba(10, 19, 44, 0.7)"
        border_color = "rgba(0, 212, 255, 0.2)"
        logo_html = """
            <div class="momo-logo" style="background: #0054a5; color: #fff; border-radius: 16px; font-weight: 900; font-size: 20px; box-shadow: 0 0 25px rgba(0, 212, 255, 0.5); width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                <span class="logo-letter" style="color: #00d4ff;">Viet</span>QR
            </div>
        """
        qr_code_html = f"""
            <div style="margin-bottom: 25px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: white; padding: 15px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 2px solid rgba(0, 212, 255, 0.3);">
                <img src="https://img.vietqr.io/image/MB-0329603475-compact.png?amount={amount}&addInfo=Payment%20for%20{order_id}" alt="VietQR" style="width: 220px; height: 220px; border-radius: 8px;" />
                <p style="color: #1a1a1a; font-size: 10px; margin-top: 8px; font-weight: bold; font-family: sans-serif; letter-spacing: 0.5px;">NHÀ TÀI TRỢ: MB BANK | STK: 0329603475</p>
                <p style="color: #666; font-size: 9px; margin-top: 2px; font-family: sans-serif;">Quét mã bằng app ngân hàng bất kỳ để thanh toán</p>
            </div>
        """
        button_text = "Xác Nhận Đã Chuyển Khoản"
        secured_footer = "🔒 Hệ thống bảo mật Napas 247 PCI-DSS"
        success_text = f"Cước vận chuyển của đơn hàng <strong>{order_id}</strong> đã được thanh toán thành công qua cổng VietQR ngân hàng Quân Đội MB."
    else:
        # Default MoMo branding
        gateway_title = "Momo Sandbox"
        gateway_subtitle = "Cổng Thanh Toán Trực Tuyến"
        primary_color = "#a50064"
        neon_color = "#ff007f"
        glow_color = "rgba(255, 0, 127, 0.4)"
        space_dark = "#090314"
        glass_card = "rgba(26, 12, 47, 0.65)"
        border_color = "rgba(255, 0, 127, 0.2)"
        logo_html = """
            <div class="momo-logo">
                <span class="logo-letter">momo</span>
            </div>
        """
        qr_code_html = f"""
            <div style="margin-bottom: 25px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: white; padding: 15px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 2px solid rgba(255, 0, 127, 0.3);">
                <img src="https://img.vietqr.io/image/MB-0329603475-compact.png?amount={amount}&addInfo=Payment%20for%20{order_id}" alt="MoMo Transfer" style="width: 220px; height: 220px; border-radius: 8px;" />
                <p style="color: #1a1a1a; font-size: 10px; margin-top: 8px; font-weight: bold; font-family: sans-serif; letter-spacing: 0.5px; text-transform: uppercase;">Ví MoMo / MB Bank: 0329603475</p>
                <p style="color: #666; font-size: 9px; margin-top: 2px; font-family: sans-serif;">Quét mã bằng app MoMo hoặc app Ngân hàng để chuyển khoản</p>
            </div>
        """
        button_text = "Xác Nhận Thanh Toán"
        secured_footer = "🔒 Kết nối bảo mật SSL 256-bit chuẩn PCI-DSS"
        success_text = f"Cước vận chuyển của đơn hàng <strong>{order_id}</strong> đã được thanh toán qua ví MoMo."

    html_template = """
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <title>{{ gateway_title }} - Antigravity Express</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet">
        <style>
            :root {
                --primary: {{ primary_color }};
                --neon: {{ neon_color }};
                --space-dark: {{ space_dark }};
                --glass-card: {{ glass_card }};
                --glow-color: {{ glow_color }};
            }
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            body {
                background: radial-gradient(circle at 50% 50%, #0e1b3d, var(--space-dark));
                font-family: 'Outfit', sans-serif;
                color: #f1ecf7;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                overflow: hidden;
            }
            .background-decorations {
                position: absolute;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
                z-index: 1;
                pointer-events: none;
            }
            .orb {
                position: absolute;
                border-radius: 50%;
                filter: blur(100px);
            }
            .orb-1 {
                background: rgba(0, 84, 165, 0.25);
                width: 400px;
                height: 400px;
                top: -100px;
                right: -100px;
            }
            .orb-2 {
                background: rgba(147, 51, 234, 0.2);
                width: 500px;
                height: 500px;
                bottom: -150px;
                left: -150px;
            }
            .glass-card {
                background: var(--glass-card);
                border: 1px solid {{ border_color }};
                backdrop-filter: blur(25px);
                -webkit-backdrop-filter: blur(25px);
                border-radius: 32px;
                width: 460px;
                padding: 40px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px var(--glow-color);
                z-index: 10;
                text-align: center;
                position: relative;
                animation: floatCard 6s ease-in-out infinite;
            }
            @keyframes floatCard {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            .momo-logo {
                width: 80px;
                height: 80px;
                background: #fff;
                border-radius: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                font-weight: 700;
                font-size: 28px;
                color: #a50064;
                box-shadow: 0 0 25px rgba(255, 0, 127, 0.5);
                position: relative;
            }
            .logo-letter {
                animation: pulseText 2s infinite;
            }
            @keyframes pulseText {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.08); }
            }
            h2 {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 8px;
                background: linear-gradient(135deg, #fff 40%, var(--neon));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                letter-spacing: 0.5px;
            }
            .gateway-subtitle {
                font-size: 13px;
                color: #a78bfa;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-bottom: 30px;
                font-weight: 600;
            }
            .info-panel {
                background: rgba(9, 3, 20, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 20px;
                padding: 24px;
                margin-bottom: 35px;
                text-align: left;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                font-size: 14px;
            }
            .info-row:last-child {
                margin-bottom: 0;
                padding-top: 12px;
                border-top: 1px dashed rgba(255, 255, 255, 0.1);
            }
            .label {
                color: #9ca3af;
            }
            .value {
                font-weight: 600;
                color: #f3f4f6;
            }
            .amount-value {
                font-family: 'Share Tech Mono', monospace;
                font-size: 20px;
                color: var(--neon);
                text-shadow: 0 0 10px rgba(0, 212, 255, 0.6);
            }
            .btn {
                background: linear-gradient(135deg, var(--primary), #00d4ff);
                border: none;
                border-radius: 16px;
                color: #fff;
                font-family: 'Outfit', sans-serif;
                font-weight: 700;
                font-size: 16px;
                width: 100%;
                padding: 16px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            }
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 30px rgba(0, 212, 255, 0.6);
                background: linear-gradient(135deg, #00458a, var(--neon));
            }
            .btn:active {
                transform: translateY(1px);
            }
            .secured-footer {
                margin-top: 25px;
                font-size: 12px;
                color: #6b7280;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
            }
            .success-screen {
                display: none;
            }
            .checkmark-circle {
                width: 90px;
                height: 90px;
                background: rgba(16, 185, 129, 0.15);
                border: 2px solid #10b981;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 25px;
                box-shadow: 0 0 30px rgba(16, 185, 129, 0.3);
                animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            @keyframes popIn {
                0% { transform: scale(0.5); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
            }
            .checkmark {
                color: #10b981;
                font-size: 45px;
                font-weight: 700;
                text-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
            }
            .status-text {
                font-size: 15px;
                color: #9ca3af;
                margin-bottom: 30px;
                line-height: 1.5;
            }
        </style>
        <script>
            async function confirmPayment() {
                const btn = document.getElementById("pay-btn");
                btn.innerHTML = "Đang xử lý giao dịch...";
                btn.disabled = true;
                
                const payload = {
                    orderId: "{{ order_id }}",
                    amount: {{ amount }},
                    signature: "{{ signature }}",
                    status: "SUCCESS"
                };
                
                try {
                    const response = await fetch("/api/payment/webhook", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(payload)
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        document.getElementById("checkout-screen").style.display = "none";
                        document.getElementById("success-screen").style.display = "block";
                    } else {
                        alert("Thanh toán thất bại: " + result.message);
                        btn.innerHTML = "{{ button_text }}";
                        btn.disabled = false;
                    }
                } catch (err) {
                    alert("Lỗi kết nối cổng thanh toán!");
                    btn.innerHTML = "{{ button_text }}";
                    btn.disabled = false;
                }
            }
        </script>
    </head>
    <body>
        <div class="background-decorations">
            <div class="orb orb-1"></div>
            <div class="orb orb-2"></div>
        </div>

        <!-- Checkout Card -->
        <div class="glass-card" id="checkout-screen">
            {{ logo_html | safe }}
            <h2>{{ gateway_title }}</h2>
            <div class="gateway-subtitle">{{ gateway_subtitle }}</div>
            
            {{ qr_code_html | safe }}
            
            <div class="info-panel">
                <div class="info-row">
                    <span class="label">Mã Vận Đơn</span>
                    <span class="value">{{ order_id }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Dịch vụ vận chuyển</span>
                    <span class="value">Antigravity Express</span>
                </div>
                <div class="info-row">
                    <span class="label">Tổng cước phí</span>
                    <span class="value amount-value">{{ amount | number_format }} đ</span>
                </div>
            </div>
            
            <button class="btn" id="pay-btn" onclick="confirmPayment()">
                {{ button_text }}
            </button>
            
            <div class="secured-footer">
                {{ secured_footer }}
            </div>
        </div>

        <!-- Success Card -->
        <div class="glass-card success-screen" id="success-screen">
            <div class="checkmark-circle">
                <span class="checkmark">✓</span>
            </div>
            <h2 style="background: linear-gradient(135deg, #fff 40%, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                Thanh Toán Thành Công!
            </h2>
            <div class="gateway-subtitle" style="color: #6ee7b7;">Giao dịch hoàn tất</div>
            
            <div class="status-text">
                {{ success_text | safe }}<br><br>
                Hệ thống đã tự động mở khóa vận đơn này và phân bổ cho Shipper để lấy hàng.
            </div>
            
            <button class="btn" style="background: linear-gradient(135deg, #5E0ED7, #00d4ff); box-shadow: 0 4px 20px rgba(94, 14, 215, 0.3); margin-bottom: 12px;" onclick="window.open('/api/payment/print-waybill/{{ order_id }}', '_blank')">
                🖨️ In Tem Vận Đơn A6 (Print Waybill)
            </button>
            
            <button class="btn" style="background: linear-gradient(135deg, #059669, #10b981); box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);" onclick="window.close()">
                Đóng Trang Thanh Toán
            </button>
        </div>
    </body>
    </html>
    """
    
    # Custom simple Jinja-like filter inside render_template_string
    # To format currency as 15.000 instead of 15000
    rendered = html_template.replace("{{ order_id }}", order_id)\
                             .replace("{{ amount }}", str(amount))\
                             .replace("{{ signature }}", signature)\
                             .replace("{{ gateway_title }}", gateway_title)\
                             .replace("{{ gateway_subtitle }}", gateway_subtitle)\
                             .replace("{{ primary_color }}", primary_color)\
                             .replace("{{ neon_color }}", neon_color)\
                             .replace("{{ glow_color }}", glow_color)\
                             .replace("{{ space_dark }}", space_dark)\
                             .replace("{{ glass_card }}", glass_card)\
                             .replace("{{ border_color }}", border_color)\
                             .replace("{{ logo_html | safe }}", logo_html)\
                             .replace("{{ qr_code_html | safe }}", qr_code_html)\
                             .replace("{{ button_text }}", button_text)\
                             .replace("{{ secured_footer }}", secured_footer)\
                             .replace("{{ success_text | safe }}", success_text)\
                             .replace("{{ amount | number_format }}", f"{amount:,.0f}".replace(",", "."))
                             
    return rendered

@payment_bp.route('/print-waybill/<order_id>', methods=['GET'])
def print_waybill_page(order_id):
    """Renders the standard A6 printable waybill page with the 5x QR code and 70px signature area"""
    order = DonHang.query.get(order_id)
    if not order:
        return "<h3>Không tìm thấy đơn hàng!</h3>", 404
        
    receiver_name = (order.TenNguoiNhan or 'N/A').upper()
    receiver_phone = order.SoDienThoaiNhan or 'N/A'
    receiver_address = order.DiaChiNhan or 'N/A'
    
    sender_name = (order.TenNguoiGui or 'Cửa hàng Sneaker').upper()
    sender_phone = order.SoDienThoaiGui or '0987654321'
    sender_address = order.DiaChiGui or 'Địa chỉ kho gửi hàng'
    
    cod = int(order.TienThuHoCOD or 0)
    weight = int(order.TrongLuongGram or 100)
    cargo_desc = order.MoTaHangHoa or 'Hàng hóa ký gửi Antigravity'
    
    package_type = 'STANDARD' if order.MaGoi == 1 else 'EXPRESS'
    inspect_policy = order.QuyenKiemTra or 'KHONG_XEM'
    
    def get_inspect_text(policy):
        if policy == 'CHO_XEM': return '- Cho xem hàng, không đồng kiểm'
        if policy == 'CHO_THU': return '- Cho thử hàng, đồng kiểm'
        return '- Không đồng kiểm'
        
    formatted_cod = f"{cod:,.0f}".replace(",", ".")
    barcode_url = f"https://bwipjs-api.metafloor.com/?bcid=code128&text={order_id}&scale=3&rotate=N&includetext=false"
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={order_id}"
    
    html = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>In Tem Vận Đơn - {order_id}</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page {{
            size: A6 portrait;
            margin: 0;
          }}
          * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }}
          body {{
            font-family: 'Outfit', sans-serif;
            margin: 0;
            padding: 10px;
            background-color: #fff;
            color: #000;
            width: 105mm;
            height: 148mm;
            display: flex;
            justify-content: center;
            align-items: center;
          }}
          .waybill-border {{
            border: 2px solid #000;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }}
          .section-row {{
            display: flex;
            border-bottom: 2px solid #000;
            width: 100%;
          }}
          .section-col {{
            display: flex;
            flex-direction: column;
          }}
          
          /* Header */
          .header-left {{
            width: 50%;
            padding: 8px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            border-right: 2px solid #000;
            background-color: #fff;
          }}
          .header-right {{
            width: 50%;
            padding: 6px 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }}
          .barcode-img {{
            width: 95%;
            height: 42px;
            object-fit: contain;
          }}
          .tracking-code-text {{
            font-size: 11px;
            font-weight: 800;
            margin-top: 4px;
            letter-spacing: 0.5px;
          }}
          .order-code-sub {{
            font-size: 8.5px;
            font-weight: 600;
            opacity: 0.8;
            margin-top: 1px;
          }}

          /* Address block */
          .address-block {{
            width: 50%;
            padding: 6px 8px;
            font-size: 9px;
            min-height: 85px;
            display: flex;
            flex-direction: column;
          }}
          .address-block:first-child {{
            border-right: 2px solid #000;
          }}
          .address-title {{
            font-weight: 800;
            text-transform: uppercase;
            font-size: 10px;
            margin-bottom: 3px;
          }}
          .address-name {{
            font-weight: 900;
            font-size: 11px;
            margin-bottom: 2px;
            text-transform: uppercase;
          }}
          .address-detail {{
            font-weight: 600;
            line-height: 1.25;
            font-size: 9px;
            flex-grow: 1;
            margin-bottom: 4px;
          }}
          .address-phone {{
            font-weight: 800;
            font-size: 10px;
          }}

          /* Route & Goods Content */
          .route-block {{
            width: 35%;
            border-right: 2px solid #000;
            padding: 6px 8px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
          }}
          .route-code {{
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 0.5px;
            text-align: center;
            width: 100%;
            padding: 2px 0;
          }}
          .sorting-label {{
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            margin-bottom: 2px;
            text-align: center;
          }}
          .sorting-box {{
            width: 55px;
            height: 22px;
            border: 1.5px solid #000;
            background-color: #fff;
          }}
          
          .goods-block {{
            width: 65%;
            padding: 6px 8px;
            font-size: 8.5px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }}
          .goods-title {{
            font-weight: 800;
            border-bottom: 1px solid #ddd;
            padding-bottom: 2px;
            margin-bottom: 4px;
            font-size: 9px;
          }}
          .goods-desc {{
            font-weight: 600;
            line-height: 1.25;
            height: 40px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
          }}
          .goods-warning {{
            font-size: 7.5px;
            opacity: 0.65;
            font-style: italic;
          }}

          /* Cash and weights */
          .cod-block {{
            width: 60%;
            border-right: 2px solid #000;
            padding: 6px 8px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background-color: #fff;
          }}
          .cod-title {{
            font-size: 9px;
            font-weight: 700;
            color: #444;
          }}
          .cod-value {{
            font-size: 21px;
            font-weight: 950;
            margin-top: 1px;
            letter-spacing: -0.5px;
          }}
          
          .weight-block {{
            width: 40%;
            padding: 6px 8px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }}
          .weight-title {{
            font-size: 9px;
            font-weight: 700;
            color: #444;
          }}
          .weight-value {{
            font-size: 15px;
            font-weight: 900;
            margin-top: 2px;
          }}

          /* Instructions and Signatures */
          .footer-instruct {{
            width: 60%;
            border-right: 2px solid #000;
            padding: 8px;
            font-size: 8px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }}
          .footer-instruct-title {{
            font-weight: 800;
            text-transform: uppercase;
            font-size: 9px;
            margin-bottom: 4px;
          }}
          .footer-instruct-policy {{
            font-weight: 700;
            line-height: 1.4;
            font-size: 8.5px;
          }}
          
          .footer-sign-box {{
            width: 40%;
            padding: 8px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            text-align: center;
          }}
          .sign-title {{
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
          }}
          .sign-subtitle {{
            font-size: 7px;
            opacity: 0.8;
            line-height: 1.1;
            margin-top: 2px;
          }}
          .sign-area {{
            width: 100%;
            height: 70px;
            border: 1.5px dashed #aaa;
            margin-top: 4px;
            border-radius: 2px;
            background-color: #fafafa;
          }}

          /* Printable instructions */
          @media print {{
            body {{
              padding: 0;
            }}
            .waybill-border {{
              border-width: 2px;
            }}
          }}
        </style>
      </head>
      <body>
        <div class="waybill-border">
          
          <!-- HÀNG 1: HEADER LOGO & BARCODE -->
          <div class="section-row" style="height: 85px;">
            <div class="header-left">
              <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                <div style="display: flex; align-items: center; gap: 3.5px;">
                  <svg viewBox="0 0 32 32" style="height: 18px; width: auto;" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 3L4 25C4 25 9 22 16 22C23 22 28 25 28 25L16 3Z" fill="url(#wayGrad)" />
                    <path d="M16 10L10 20H22L16 10Z" fill="white" />
                    <circle cx="16" cy="15" r="2.5" fill="#30195C" />
                    <defs>
                       <linearGradient id="wayGrad" x1="4" y1="3" x2="28" y2="25" gradientUnits="userSpaceOnUse">
                         <stop offset="0%" stop-color="#5E0ED7" />
                         <stop offset="100%" stop-color="#30195C" />
                       </linearGradient>
                    </defs>
                  </svg>
                  <div style="display: flex; align-items: center; font-family: 'Outfit', sans-serif;">
                    <span style="font-weight: 500; font-size: 12px; color: #30195C; letter-spacing: 0.2px; text-transform: uppercase;">ANTIGRAVITY</span>
                    <span style="background-color: #30195C; color: #fff; font-weight: 800; font-size: 10px; padding: 1.5px 4.5px; margin-left: 2.5px; border-radius: 1px; letter-spacing: 0.2px; text-transform: uppercase;">EXPRESS</span>
                  </div>
                </div>
                <span style="font-size: 6px; font-weight: 800; color: #30195C; letter-spacing: 1.5px; margin-top: 3px; text-transform: uppercase; font-family: 'Outfit', sans-serif;">NHANH VÀ ĐÁNG TIN CẬY</span>
              </div>
            </div>
            <div class="header-right">
              <img class="barcode-img" src="{barcode_url}" alt="Barcode" />
              <div class="tracking-code-text">Mã vận đơn: {order_id}</div>
              <div class="order-code-sub">Mã đơn hàng: {order_id}</div>
            </div>
          </div>

          <!-- HÀNG 2: SENDER & RECEIVER -->
          <div class="section-row">
            <div class="address-block">
              <div class="address-title">Từ</div>
              <div class="address-name">{sender_name}</div>
              <div class="address-detail">{sender_address}</div>
              <div class="address-phone">{sender_phone}</div>
            </div>
            <div class="address-block">
              <div class="address-title">Đến</div>
              <div class="address-name">{receiver_name}</div>
              <div class="address-detail">{receiver_address}</div>
              <div class="address-phone">{receiver_phone}</div>
            </div>
          </div>

          <!-- HÀNG 3: ROUTE & GOODS DESCRIPTION -->
          <div class="section-row" style="height: 95px;">
            <div class="route-block">
              <div class="route-code">04-21-06/22</div>
              <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                <div class="sorting-label">Tuyến giao</div>
                <div class="sorting-box"></div>
              </div>
            </div>
            <div class="goods-block">
              <div>
                <div class="goods-title">Nội dung hàng (Tổng SL sản phẩm: 1)</div>
                <div class="goods-desc">1. {cargo_desc} (SL: 1)</div>
              </div>
              <div class="goods-warning">Một số sản phẩm có thể bị ẩn do danh sách quá dài</div>
            </div>
          </div>

          <!-- HÀNG 4: COD & WEIGHT -->
          <div class="section-row" style="height: 55px;">
            <div class="cod-block">
              <div class="cod-title">Tiền thu Người nhận:</div>
              <div class="cod-value">{formatted_cod + ' VND' if cod > 0 else '0 VND'}</div>
            </div>
            <div class="weight-block">
              <div class="weight-title">Khối lượng tối đa:</div>
              <div class="weight-value">{weight} <span style="font-size: 11px; font-weight: 700;">g</span></div>
            </div>
          </div>

          <!-- HÀNG 5: FOOTER INSTRUCTIONS & SIGN BOX -->
          <div class="section-row" style="border-bottom: none; flex: 1; min-height: 200px;">
            <div class="footer-instruct" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
              <div>
                <div class="footer-instruct-title">Chỉ dẫn giao hàng</div>
                <div class="footer-instruct-policy">{get_inspect_text(inspect_policy)}</div>
                <div class="footer-instruct-policy">- Chuyển hoàn sau 3 lần phát</div>
                <div class="footer-instruct-policy">- Lưu kho tối đa 5 ngày</div>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; margin-top: 6px; border-top: 1px dashed #ccc; padding-top: 6px;">
                <img src="{qr_url}" style="width: 140px; height: 140px;" alt="QR Code" />
                <span style="font-size: 7.5px; font-weight: 800; line-height: 1.2; color: #555; text-align: center; max-width: 185px;">Quét mã hành trình bằng app Shipper để cập nhật trạng thái đơn hàng.</span>
              </div>
            </div>
            <div class="footer-sign-box" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
              <div>
                <div class="sign-title">Chữ ký người nhận</div>
                <div class="sign-subtitle">Xác nhận hàng nguyên vẹn, không móp/méo, bể/vỡ</div>
              </div>
              <div class="sign-area"></div>
            </div>
          </div>

        </div>
      </body>
      <script>
        window.addEventListener('load', () => {{
          setTimeout(() => {{
            window.print();
          }}, 300);
        }});
      </script>
    </html>
    """
    return html

@payment_bp.route('/simulate-callback/<order_id>', methods=['POST'])
def simulate_callback_api(order_id):
    """Programmatic API to easily trigger the webhook from tests"""
    order = DonHang.query.get(order_id)
    if not order:
        return jsonify({"success": False, "message": "Không tìm thấy đơn hàng!"}), 404
        
    amount = int(order.PhiVanChuyen)
    signature = calculate_momo_signature(order_id, amount)
    
    # Trigger webhook programmatically
    payload = {
        "orderId": order_id,
        "amount": amount,
        "signature": signature,
        "status": "SUCCESS"
    }
    
    # We can invoke the callback logic directly
    order.TrangThaiThanhToan = 'DA_THANH_TOAN'
    order.TrangThaiHienTai = 'CHO_LAY_HANG'
    order.GiaoDichThanhToanId = f"MOMO_TXN_TEST_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    
    log = LichSu_TrangThai(
        MaDonHang=order_id,
        MaTrangThai='CHO_LAY_HANG',
        ThongTinViTri=f"Thanh toán cước phí thành công qua ví MoMo. Đơn hàng được mở khóa và sẵn sàng bàn giao cho bưu tá.",
        MaNhanVienCapNhat=order.MaNguoiGui
    )
    db.session.add(log)
    db.session.commit()
    
    # Multi-channel notifications
    trigger_notifications(
        event_type="order_update",
        recipient_id=order.MaNguoiGui,
        payload={
            "order_id": order_id,
            "status": "CHO_LAY_HANG",
            "message": f"📦 Đơn hàng {order_id} đã thanh toán thành công qua MoMo! Đang chuyển cho bưu tá lấy hàng.",
            "updated_at": datetime.utcnow().isoformat()
        }
    )
    
    if order.MaChiNhanhGui:
        shippers = NguoiDung.query.filter_by(VaiTro='SHIPPER', MaChiNhanh=order.MaChiNhanhGui).all()
        shipper_ids = [s.MaNguoiDung for s in shippers]
        if shipper_ids:
            trigger_notifications(
                event_type="new_pickup_job",
                recipient_id=shipper_ids,
                payload={
                    "branch_id": order.MaChiNhanhGui,
                    "message": f"⚡ Có đơn hàng lấy mới ({order_id}) cách bạn rất gần! Mở app ôm đơn ngay.",
                    "updated_at": datetime.utcnow().isoformat()
                }
            )
            
    return jsonify({
        "success": True,
        "message": "Simulated payment callback executed successfully!",
        "order_id": order_id,
        "amount": amount
    })
