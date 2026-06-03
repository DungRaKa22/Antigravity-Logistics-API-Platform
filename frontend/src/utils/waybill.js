/**
 * Tiện ích in ấn Tem vận đơn (Waybill Label) tiêu chuẩn A6 cho Antigravity Express
 * Mô phỏng chính xác theo thiết kế tem vận đơn SPX Express / Giao Hàng Nhanh (GHN)
 */

export const printWaybill = (order) => {
  if (!order) return;

  const orderId = order.order_id || order.MaDonHang;
  const receiverName = (order.receiver || order.receiver_name || order.TenNguoiNhan || 'N/A').toUpperCase();
  const receiverPhone = order.receiver_phone || order.SoDienThoaiNhan || 'N/A';
  const receiverAddress = order.receiver_address || order.DiaChiNhan || 'N/A';
  
  // Lấy thông tin người gửi
  const senderName = (order.sender_name || 'Cửa hàng Sneaker').toUpperCase();
  const senderPhone = order.sender_phone || '0987654321';
  const senderAddress = order.sender_address || 'Địa chỉ kho gửi hàng';

  const cod = order.cod !== undefined ? order.cod : (order.cod_amount !== undefined ? order.cod_amount : (order.TienThuHoCOD || 0));
  const fee = order.fee !== undefined ? order.fee : (order.shipping_fee !== undefined ? order.shipping_fee : (order.PhiVanChuyen || 0));
  const weight = order.weight_gram || order.TrongLuongGram || 100;
  const cargoDesc = order.description || order.MoTaHangHoa || 'Hàng hóa ký gửi Antigravity';
  
  const packageType = order.service_package || (order.service_package_id === 2 ? 'EXPRESS' : 'STANDARD');
  const inspectPolicy = order.inspection_policy || order.QuyenKiemTra || 'KHONG_XEM';

  const getInspectText = (policy) => {
    switch (policy) {
      case 'CHO_XEM': return '- Cho xem hàng, không đồng kiểm';
      case 'CHO_THU': return '- Cho thử hàng, đồng kiểm';
      default: return '- Không đồng kiểm';
    }
  };

  const formattedCOD = Number(cod).toLocaleString('vi-VN');
  const formattedFee = Number(fee).toLocaleString('vi-VN');

  // API sinh mã vạch Barcode Code128 trực quan độ phân giải cao
  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${orderId}&scale=3&rotate=N&includetext=false`;
  
  // API sinh mã QR động chứa mã vận đơn để Shipper quét hành trình
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${orderId}`;

  // Mở cửa sổ in ấn độc lập chuyên biệt
  const printWindow = window.open('', '_blank', 'width=800,height=1000');
  if (!printWindow) {
    alert('Không thể mở cửa sổ in. Vui lòng tắt trình chặn Popup trong cài đặt trình duyệt.');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>In Tem Vận Đơn - ${orderId}</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A6 portrait;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
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
          }
          .waybill-border {
            border: 2px solid #000;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .section-row {
            display: flex;
            border-bottom: 2px solid #000;
            width: 100%;
          }
          .section-col {
            display: flex;
            flex-direction: column;
          }
          
          /* Header */
          .header-left {
            width: 50%;
            padding: 8px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            border-right: 2px solid #000;
            background-color: #fff;
          }
          .header-right {
            width: 50%;
            padding: 6px 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .barcode-img {
            width: 95%;
            height: 42px;
            object-fit: contain;
          }
          .tracking-code-text {
            font-size: 11px;
            font-weight: 800;
            margin-top: 4px;
            letter-spacing: 0.5px;
          }
          .order-code-sub {
            font-size: 8.5px;
            font-weight: 600;
            opacity: 0.8;
            margin-top: 1px;
          }

          /* Address block */
          .address-block {
            width: 50%;
            padding: 6px 8px;
            font-size: 9px;
            min-height: 85px;
            display: flex;
            flex-direction: column;
          }
          .address-block:first-child {
            border-right: 2px solid #000;
          }
          .address-title {
            font-weight: 800;
            text-transform: uppercase;
            font-size: 10px;
            margin-bottom: 3px;
          }
          .address-name {
            font-weight: 900;
            font-size: 11px;
            margin-bottom: 2px;
            text-transform: uppercase;
          }
          .address-detail {
            font-weight: 600;
            line-height: 1.25;
            font-size: 9px;
            flex-grow: 1;
            margin-bottom: 4px;
          }
          .address-phone {
            font-weight: 800;
            font-size: 10px;
          }

          /* Route & Goods Content */
          .route-block {
            width: 35%;
            border-right: 2px solid #000;
            padding: 6px 8px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
          }
          .route-code {
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 0.5px;
            text-align: center;
            width: 100%;
            padding: 2px 0;
          }
          .sorting-label {
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            margin-bottom: 2px;
            text-align: center;
          }
          .sorting-box {
            width: 55px;
            height: 22px;
            border: 1.5px solid #000;
            background-color: #fff;
          }
          
          .goods-block {
            width: 65%;
            padding: 6px 8px;
            font-size: 8.5px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .goods-title {
            font-weight: 800;
            border-bottom: 1px solid #ddd;
            padding-bottom: 2px;
            margin-bottom: 4px;
            font-size: 9px;
          }
          .goods-desc {
            font-weight: 600;
            line-height: 1.25;
            height: 40px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
          }
          .goods-warning {
            font-size: 7.5px;
            opacity: 0.65;
            font-style: italic;
          }

          /* Cash and weights */
          .cod-block {
            width: 60%;
            border-right: 2px solid #000;
            padding: 6px 8px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background-color: #fff;
          }
          .cod-title {
            font-size: 9px;
            font-weight: 700;
            color: #444;
          }
          .cod-value {
            font-size: 21px;
            font-weight: 950;
            margin-top: 1px;
            letter-spacing: -0.5px;
          }
          
          .weight-block {
            width: 40%;
            padding: 6px 8px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .weight-title {
            font-size: 9px;
            font-weight: 700;
            color: #444;
          }
          .weight-value {
            font-size: 15px;
            font-weight: 900;
            margin-top: 2px;
          }

          /* Instructions and Signatures */
          .footer-instruct {
            width: 60%;
            border-right: 2px solid #000;
            padding: 8px;
            font-size: 8px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .footer-instruct-title {
            font-weight: 800;
            text-transform: uppercase;
            font-size: 9px;
            margin-bottom: 4px;
          }
          .footer-instruct-policy {
            font-weight: 700;
            line-height: 1.4;
            font-size: 8.5px;
          }
          
          .footer-sign-box {
            width: 40%;
            padding: 8px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            text-align: center;
          }
          .sign-title {
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
          }
          .sign-subtitle {
            font-size: 7px;
            opacity: 0.8;
            line-height: 1.1;
            margin-top: 2px;
          }
          .sign-area {
            width: 100%;
            height: 70px;
            border: 1.5px dashed #aaa;
            margin-top: 4px;
            border-radius: 2px;
            background-color: #fafafa;
          }

          /* Printable instructions */
          @media print {
            body {
              padding: 0;
            }
            .waybill-border {
              border-width: 2px;
            }
          }
        </style>
      </head>
      <body>
        <div class="waybill-border">
          
          <!-- HÀNG 1: HEADER LOGO & BARCODE -->
          <div class="section-row" style="height: 85px;">
            <div class="header-left">
              <!-- Carrier Logo (New Antigravity Express corporate design) -->
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
              <img class="barcode-img" src="${barcodeUrl}" alt="Barcode" />
              <div class="tracking-code-text">Mã vận đơn: ${orderId}</div>
              <div class="order-code-sub">Mã đơn hàng: ${orderId}</div>
            </div>
          </div>

          <!-- HÀNG 2: SENDER & RECEIVER -->
          <div class="section-row">
            <div class="address-block">
              <div class="address-title">Từ</div>
              <div class="address-name">${senderName}</div>
              <div class="address-detail">${senderAddress}</div>
              <div class="address-phone">${senderPhone}</div>
            </div>
            <div class="address-block">
              <div class="address-title">Đến</div>
              <div class="address-name">${receiverName}</div>
              <div class="address-detail">${receiverAddress}</div>
              <div class="address-phone">${receiverPhone}</div>
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
                <div class="goods-desc">1. ${cargoDesc} (SL: 1)</div>
              </div>
              <div class="goods-warning">Một số sản phẩm có thể bị ẩn do danh sách quá dài</div>
            </div>
          </div>

          <!-- HÀNG 4: COD & WEIGHT -->
          <div class="section-row" style="height: 55px;">
            <div class="cod-block">
              <div class="cod-title">Tiền thu Người nhận:</div>
              <div class="cod-value">${cod > 0 ? formattedCOD + ' VND' : '0 VND'}</div>
            </div>
            <div class="weight-block">
              <div class="weight-title">Khối lượng tối đa:</div>
              <div class="weight-value">${weight} <span style="font-size: 11px; font-weight: 700;">g</span></div>
            </div>
          </div>

          <!-- HÀNG 5: FOOTER INSTRUCTIONS & SIGN BOX -->
          <div class="section-row" style="border-bottom: none; flex: 1; min-height: 200px;">
            <div class="footer-instruct" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
              <div>
                <div class="footer-instruct-title">Chỉ dẫn giao hàng</div>
                <div class="footer-instruct-policy">${getInspectText(inspectPolicy)}</div>
                <div class="footer-instruct-policy">- Chuyển hoàn sau 3 lần phát</div>
                <div class="footer-instruct-policy">- Lưu kho tối đa 5 ngày</div>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; margin-top: 6px; border-top: 1px dashed #ccc; padding-top: 6px;">
                <img src="${qrUrl}" style="width: 140px; height: 140px;" alt="QR Code" />
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
        // Chờ toàn bộ ảnh (Barcode/QR) tải xong rồi mới gọi in tự động
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
          }, 300);
        });
      </script>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
