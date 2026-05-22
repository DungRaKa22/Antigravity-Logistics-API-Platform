# 📝 Ghi Chú Kỹ Thuật & Vận Hành - Logistics API Platform

> Tài liệu tổng hợp các ghi chú kĩ thuật quan trọng, cơ chế fallback, kinh nghiệm xử lý lỗi và logic nghiệp vụ cốt lõi trong toàn bộ vòng đời phát triển dự án.

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

## 🛵 Logic Kiểm Tra Hạn Ngạch Ôm Đơn Của Shipper

Để đảm bảo hiệu suất giao hàng và tránh quá tải cho nhân viên:
1. **Kiểm tra thời gian thực**:
   - Khi Admin hoặc hệ thống phân công một đơn hàng cho Shipper, backend sẽ đếm số lượng đơn hàng mà Shipper đó đang đảm nhận trong ngày hiện tại.
   - Nếu `SoDonDaOm >= GioiHanDonNgay`, hệ thống sẽ trả về lỗi `400 Bad Request` cùng thông báo ngăn chặn.
2. **Khởi tạo và cấu hình mặc định**:
   - Trường `GioiHanDonNgay` trong bảng `NguoiDung` mặc định là **20 đơn / ngày** khi đăng ký nhân viên mới. Admin có thể tùy ý điều chỉnh tăng/giảm hạn ngạch này từ màn hình quản trị nhân sự.

---

## 💵 Cơ Chế Tính Lương & Xuất Báo Cáo Excel (.xlsx) Qua SheetJS

1. **Công thức tính lương Shipper**:
   - Chỉ các đơn hàng có trạng thái `GIAO_THANH_CONG` mới được ghi nhận tính lương.
   - Lương của mỗi đơn hoàn thành là **3.000 VNĐ**.
   - Công thức tổng hợp lương tháng: `TongLuong = TongDonThanhCong * 3000`.
2. **Logic xuất Excel thời gian thực bằng SheetJS**:
   - Sử dụng thư viện `xlsx` (SheetJS) trực tiếp tại Client-side để giảm tải cho máy chủ backend.
   - Tự động phát hiện tháng trước đó: Khi mở báo cáo ở tháng hiện tại (Ví dụ: Tháng 5), hệ thống tự động thiết lập mặc định khoảng thời gian lọc dữ liệu là Tháng trước (Tháng 4). Điều này giúp kế toán viên click xuất báo cáo lương tháng trước ngay lập tức mà không cần lọc thủ công.
   - **Xử lý độ rộng cột động (Column Auto-width)**: Thiết lập mảng `cols` chỉ định độ rộng cột rõ ràng trong SheetJS (ví dụ: `wch: 15` cho mã shipper, `wch: 25` cho tên shipper, `wch: 10` cho các cột ngày) để Excel không bao giờ hiển thị lỗi tràn chữ hoặc ký tự `###`.
   - **Tương thích font chữ tiếng Việt**: Sử dụng phương thức ghi file nhị phân của SheetJS giúp bảo toàn định dạng UTF-8, đảm bảo hiển thị đúng 100% các ký tự tiếng Việt có dấu khi mở file bằng Excel trên Windows và macOS.

---

## 🛠️ Khắc Phục Lỗi Lịch Sử Hành Trình & Ánh Xạ CSDL

*   **Vấn đề phát sinh**: Trong quá trình review code toàn diện dự án, phát hiện API tra cứu hành trình `/api/tracking/<id>` bị lỗi sập dịch vụ (NameError) do gọi sai tên Model lớp `Order` và `TrackingHistory` không khớp với tên khai báo thực tế bằng tiếng Việt trong tệp tin `models.py` (`DonHang`, `LichSu_TrangThai`).
*   **Giải pháp xử lý**: Thực hiện cập nhật hoàn tất file `tracking_routes.py`. Bản đồ hóa đúng các thuộc tính CSDL thực tế:
    - Ánh xạ `order.MaDonHang` thay thế `order.OrderID`.
    - Ánh xạ `order.TrangThaiHienTai` thay thế `order.CurrentStatus`.
    - Ánh xạ `order.NgayTao` thay thế `order.CreatedAt`.
    - Ánh xạ `h.MaTrangThai` thay thế `h.StatusCode`.
    - Ánh xạ `h.ThongTinViTri` thay thế `h.LocationInfo`.
    - Ánh xạ `h.ThoiGian` thay thế `h.Timestamp`.
*   **Kết quả**: API tra cứu công khai đã hoạt động 100% trơn tru, trả về đầy đủ lịch trình thời gian thực dạng JSON.
