# 📝 Ghi Chú Kỹ Thuật & Vận Hành - Logistics API Platform

> Tài liệu tổng hợp các ghi chú kĩ thuật quan trọng, cơ chế fallback, và kinh nghiệm xử lý lỗi trong toàn bộ vòng đời phát triển dự án.

---

## 🗺️ Tích Hợp Bản Đồ & Geocoding (Nominatim & OSRM)

1. **Giới hạn tốc độ của Nominatim API**:
   - Dịch vụ geocoding công cộng của OpenStreetMap (Nominatim) quy định nghiêm ngặt tốc độ tối đa **1 request/giây** trên mỗi IP và bắt buộc có trường `User-Agent` hợp lệ trong header của HTTP request.
   - Để tuân thủ, backend sử dụng hàm `time.sleep(1)` trước mỗi lần gọi Geocode ở file `osrm_service.py`.
2. **Cơ chế Fallback Quãng đường An toàn**:
   - Khi Nominatim hoặc OSRM rớt kết nối, bị chặn IP, hoặc quá tải băng thông công cộng, hệ thống sẽ tự động sử dụng khoảng cách **Fallback là 10.5 km** làm tham số tính toán.
   - Điều này đảm bảo quy trình tạo đơn hàng của shop không bao giờ bị nghẽn (Zero-blockage) và cước phí ước tính vẫn được đưa ra.

---

## 📘 Logic Hoán Đổi Địa Chỉ Mặc Định (`LaMacDinh`)

Quy trình đồng bộ cờ địa chỉ mặc định trong CSDL được tối ưu hóa như sau:
1. **Khi thêm mới**:
   - Nếu khách hàng tích chọn checkbox "Đặt làm mặc định" ➡️ Hệ thống chạy lệnh `SoDiaChi.query.filter_by(MaNguoiDung=user_id).update({"LaMacDinh": False})` để gỡ mặc định cũ trước khi insert bản ghi mới.
   - Nếu đây là địa chỉ đầu tiên của khách hàng trong hệ thống ➡️ Tự động buộc đặt làm mặc định (`LaMacDinh = True`).
2. **Khi đặt mặc định**:
   - Endpoint `PUT /api/address-book/<id>/set-default` sẽ gỡ bỏ cờ mặc định của tất cả địa chỉ cũ của shop đó, sau đó bật cờ mặc định cho địa chỉ mục tiêu trong cùng một database session.
3. **Khi xóa địa chỉ**:
   - Nếu shop xóa địa chỉ mặc định hiện tại ➡️ Backend tự động tìm kiếm địa chỉ tiếp theo (nếu có) để đặt làm mặc định mới, tránh việc shop không còn địa chỉ mặc định nào.

---

## 🛠️ Khắc Phục Lỗi Lịch Sử Hành Trình (`tracking_routes.py`)

*   **Vấn đề phát sinh**: Trong quá trình review code toàn diện dự án, phát hiện API tra cứu hành trình `/api/tracking/<id>` bị lỗi sập dịch vụ (NameError) do gọi sai tên Model lớp `Order` và `TrackingHistory` không khớp với tên khai báo thực tế bằng tiếng Việt trong tệp tin `models.py` (`DonHang`, `LichSu_TrangThai`).
*   **Giải pháp xử lý**: Thực hiện cập nhật hoàn tất file `tracking_routes.py`. Bản đồ hóa đúng các thuộc tính CSDL thực tế:
    - Ánh xạ `order.MaDonHang` thay thế `order.OrderID`.
    - Ánh xạ `order.TrangThaiHienTai` thay thế `order.CurrentStatus`.
    - Ánh xạ `order.NgayTao` thay thế `order.CreatedAt`.
    - Ánh xạ `h.MaTrangThai` thay thế `h.StatusCode`.
    - Ánh xạ `h.ThongTinViTri` thay thế `h.LocationInfo`.
    - Ánh xạ `h.ThoiGian` thay thế `h.Timestamp`.
*   **Kết quả**: API tra cứu công khai đã hoạt động 100% trơn tru, trả về đầy đủ lịch trình thời gian thực dạng JSON.

---

## 🔑 Quản Lý API Key B2B Cho Đối Tác (`DOITAC`)

- Chuỗi API Key được backend sinh ra ngẫu nhiên có độ dài 64 ký tự bắt đầu bằng tiền tố `AG_PARTNER_...` sử dụng hàm bảo mật `secrets.token_hex`.
- Đối tác tích hợp đẩy đơn hàng qua API sử dụng header `X-API-Key` giúp hệ thống phân biệt được đối tác cụ thể mà không cần duy trì JWT Token hết hạn.
