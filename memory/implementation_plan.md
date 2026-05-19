# 📋 Kế hoạch triển khai chi tiết - Logistics API Platform

> Trạng thái dự án: **🟢 HOÀN THÀNH TOÀN DIỆN (100%)**

---

## PHASE 1: Nền tảng & Database [HOÀN THÀNH] ✅
- [x] Thiết kế 7 Bảng Cốt lõi (Việt hóa): `NguoiDung`, `SoDiaChi`, `GoiDichVu`, `DonHang`, `LichSu_TrangThai`, `DoiSoat`, `KhoaAPI`.
- [x] Cài đặt SQL Server 2022 và khởi tạo tệp tin cơ sở dữ liệu `init_database.sql`.
- [x] Nạp dữ liệu mẫu thực tế qua `seed_data.sql`.
- [x] Đồng bộ hóa SQLAlchemy Models trong `backend/app/models.py`.

---

## PHASE 2: Backend API Core [HOÀN THÀNH] ✅
- [x] **Refactor API theo Schema Việt hóa**:
  - Auth API (`TenDangNhap`, `MatKhau`, cấp token JWT).
  - Order API (Tự động quy đổi khối lượng và tính cước vận chuyển, phí bảo hiểm 0.5%).
  - Address Book API (Hỗ trợ tìm kiếm, phân trang và cờ `LaMacDinh`).
  - Finance API (Tính toán đối soát bù trừ cước phí và COD, duyệt thanh toán).
- [x] **Tích hợp Bản đồ số OSRM & Geocode Nominatim**:
  - Tìm tọa độ từ địa chỉ văn bản, gọi API OSRM tính cước thực tế dựa trên số km đi đường.
  - Thiết lập cơ chế Fallback (10.5 km) khi API bản đồ công cộng bị quá tải/ngắt kết nối.
- [x] **Cơ chế Bảo mật Phân quyền**:
  - Viết middleware kiểm tra quyền hạn `@require_auth` và `@require_role`.
  - Cấp phát và xác thực chuỗi B2B API Key qua header `X-API-Key`.

---

## PHASE 3: Web App Toàn Diện (React + Tailwind CSS) [HOÀN THÀNH] ✅
- [x] **Thiết lập & Tối ưu hóa Design System**:
  - Sử dụng Google Stitch AI thiết kế giao diện tối giản Uber-style.
  - Cập nhật font chữ hiện đại, màu sắc tương phản cao (Đen/Trắng), các nút dạng viên thuốc và ô nhập liệu sắc cạnh không bo góc.
- [x] **Xây dựng Màn hình Đăng nhập & Đăng ký**:
  - Bố cục Split Screen sang trọng (bên trái ảnh logistics đen trắng, bên phải form nhập).
  - Tích hợp bộ chọn vai trò Segmented Control động.
- [x] **Xây dựng Merchant Portal (Phân hệ Khách hàng)**:
  - **Trang Dashboard đơn hàng (`/merchant`)**: Danh sách vận đơn, tìm kiếm, lọc trạng thái, phân trang. Khi click vào đơn hàng tự chuyển sang trang hành trình.
  - **Trang Tạo đơn hàng (`/merchant/order/new`)**: Tích hợp công cụ tính cước động thời gian thực (Real-time Calculator) tự động cập nhật cước phí sau khi nhập thông tin. Tích hợp Combo Box chọn địa chỉ gửi nhanh từ Sổ địa chỉ (ưu tiên địa chỉ mặc định).
  - **Trang Sổ địa chỉ (`/merchant/addresses`)**: Danh sách địa chỉ nhận, nút đặt mặc định, và form thêm địa chỉ có checkbox đặt làm mặc định.

---

## PHASE 4: Tích hợp & Kiểm thử [HOÀN THÀNH] ✅
- [x] **Kiểm thử liên thông toàn trình**:
  - Đăng ký tài khoản ➡️ Lên đơn hàng ➡️ Tính cước OSRM ➡️ Cập nhật trạng thái bưu cục ➡️ Tự sinh bảng đối soát ➡️ Duyệt chi trả COD cho chủ shop.
- [x] **Khắc phục lỗi logic**:
  - Sửa NameError và ánh xạ sai tên cột trong API tra cứu hành trình (`tracking_routes.py`).

---

## PHASE 5: Đóng gói & Báo cáo [HOÀN THÀNH] ✅
- [x] Đồng bộ hóa các tài liệu lưu trữ dự án trong thư mục `memory/`.
- [x] Hoàn thiện tài liệu hướng dẫn vận hành kĩ thuật và cơ chế API.
