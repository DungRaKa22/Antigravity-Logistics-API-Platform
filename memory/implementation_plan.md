# 📋 Kế hoạch triển khai chi tiết - Logistics API Platform

> Trạng thái dự án: **🟢 HOÀN THÀNH TOÀN DIỆN (100%) - TẤT CẢ CÁC GIAI ĐOẠN**

---

## PHASE 1: Nền tảng & Database [HOÀN THÀNH] ✅
- [x] **Thiết kế 8 Bảng Cốt lõi (Việt hóa)**: `NguoiDung`, `SoDiaChi`, `GoiDichVu`, `DonHang`, `LichSu_TrangThai`, `DoiSoat`, `HoaDonDoiSoat`, `KhoaAPI`.
- [x] **Bổ sung trường CSDL nâng cao**:
  - `GioiHanDonNgay` (Hạn ngạch số đơn hàng Shipper được nhận trong ngày - bảng `NguoiDung`).
  - `GhiChuNhanSu` (Ghi chú về nhân viên/shipper - bảng `NguoiDung`).
  - `MaNhanVienGiao` (Liên kết Shipper phụ trách đơn hàng - bảng `DonHang`).
  - Cấu hình thông tin tài khoản ngân hàng của Shipper (`TenNganHang`, `SoTaiKhoan`, `ChuTaiKhoan` - bảng `NguoiDung`).
- [x] **Cài đặt & Khởi tạo CSDL**: Tích hợp SQL Server 2022 và chạy file khởi tạo `init_database.sql`.
- [x] **Nạp dữ liệu mẫu**: Chạy `seed_data.sql` để thiết lập ban đầu và `seed_clean_data.py` phục vụ thử nghiệm làm sạch dữ liệu.

---

## PHASE 2: Backend API Core [HOÀN THÀNH] ✅
- [x] **Refactor API theo Schema Việt hóa**:
  - **Auth API**: Đăng nhập (`TenDangNhap`, `MatKhau`), phân quyền rõ rệt 3 nhóm vai trò (`KHACHHANG`, `NHANVIEN`, `QUANTRI`), cấp phát token JWT an toàn.
  - **Profile API**: Cập nhật thông tin cá nhân và tài khoản ngân hàng của Shipper.
  - **Order API**: Tính toán khoảng cách qua OSRM, quy đổi trọng lượng thể tích, tính cước phí và phụ phí khối lượng, tự động sinh mã vận đơn `AG-XXXXXX`.
  - **Address Book API**: Hỗ trợ tìm kiếm, phân trang và cờ `LaMacDinh` hoán đổi thông minh.
  - **Finance API**: Tự động sinh giao dịch đối soát khi đơn giao thành công, tính toán số tiền thực nhận (`ThucNhan = COD - CuocPhi - BaoHiem`).
  - **Reconciliation & Invoicing**: Gom nhiều giao dịch đối soát của Shop thành một hóa đơn đối soát (`HoaDonDoiSoat`) để duyệt chi trả đồng loạt.
- [x] **Tích hợp Bản đồ số OSRM & Geocode Nominatim**:
  - Tìm tọa độ từ địa chỉ văn bản, gọi API OSRM tính cước thực tế dựa trên số km đi đường thực tế.
  - Thiết lập cơ chế Fallback (10.5 km) khi API bản đồ công cộng bị quá tải/ngắt kết nối.
- [x] **Cơ chế Bảo mật Phân quyền & B2B API Key**:
  - Viết middleware kiểm tra quyền hạn `@require_auth` và `@require_role`.
  - Cấp phát và xác thực chuỗi B2B API Key qua header `X-API-Key`.

---

## PHASE 3: Web App Toàn Diện (React + Tailwind CSS) [HOÀN THÀNH] ✅
- [x] **Thiết lập & Tối ưu phong cách UI Premium**:
  - Phát triển giao diện theo phong cách **Dark-Neon Glassmorphic** cực kỳ cao cấp, sử dụng backdrop-blur, viền neon phát sáng, và hiệu ứng hover mượt mà.
- [x] **Xây dựng Màn hình Đăng nhập & Đăng ký**:
  - Thiết kế Card kính mờ căn giữa (`rounded-2xl`) trên nền tối sâu radial gradient điểm hạt phát sáng.
  - Tích hợp bộ chọn vai trò động và nút Quay lại (Back button) thuận tiện.
- [x] **Xây dựng Merchant Portal (Phân hệ Khách hàng)**:
  - **Dashboard đơn hàng (`/merchant`)**: Danh sách vận đơn, tìm kiếm, lọc trạng thái, phân trang.
  - **Tra cứu hành trình & Tem vận đơn**: Xem timeline di chuyển chi tiết, in tem vận đơn khổ A6 chuẩn thương mại điện tử tự động vẽ mã vạch Code128 trực quan bằng SVG.
  - **Sổ địa chỉ (`/merchant/addresses`)**: Quản lý danh bạ gửi/nhận, nút đặt mặc định nhanh, tự động điền khi tạo đơn.
  - **Ví đối soát (`/merchant/invoices`)**: Xem thống kê các khoản thu hộ COD, phí ship và số tiền thực nhận.

---

## PHASE 4: Tích hợp & Kiểm thử [HOÀN THÀNH] ✅
- [x] **Kiểm thử liên thông toàn trình**:
  - Đăng ký tài khoản Shop ➡️ Tạo đơn hàng ➡️ Tính cước OSRM tự động ➡️ Phân công Shipper ➡️ Cập nhật trạng thái bưu cục/giao hàng ➡️ Tự động sinh bảng đối soát tài chính ➡️ Gom hóa đơn đối soát ➡️ Duyệt chi trả COD cho chủ shop.
- [x] **Khắc phục lỗi logic**:
  - Sửa NameError và ánh xạ sai tên cột trong API tra cứu hành trình (`tracking_routes.py`).

---

## PHASE 5: Đóng gói, Tối ưu & Nâng cấp Giao diện [HOÀN THÀNH] ✅
- [x] **Xây dựng phân hệ Quản trị viên (Admin Portal)**:
  - **Trang Dashboard Tổng quan (`/admin`)**: Hiển thị bảng điều phối `Active Dispatch Queue` có tìm kiếm, lọc trạng thái, gán Shipper cho đơn hàng nhanh.
  - **Trang Quản lý Nhân sự & Shipper (`/admin/users`)**: Roster chi tiết danh sách tài khoản, thông tin phân vai và quyền hạn.
  - **Trang Kế toán & Đối soát (`/admin/invoices`)**: Sao kê COD và phí ship, hỗ trợ chức năng đối soát thủ công nhanh (`UNPAID` ➡️ `PAID`).
- [x] **Xây dựng phân hệ Nhân viên (Staff Portal)**:
  - **Cổng di động Shipper Portal (`/staff`)**: Giao diện tối ưu di động với thẻ đen nhám glassmorphism, toast thông báo trạng thái nổi bật, sơ đồ chỉ đường hành trình (Timeline Link), và BottomNavBar cố định mép dưới dễ thao tác.
  - **Cập nhật trạng thái giao hàng**: Shipper có thể chuyển đơn sang "Đang giao", "Thành công", hoặc "Thất bại" (kèm theo lý do cụ thể hiển thị về trang quản trị).
  - **Thông tin tài khoản nhận lương**: Shipper tự cập nhật tên ngân hàng, số tài khoản, tên chủ tài khoản trực tiếp trong profile.
- [x] **Thiết lập tính năng Lương Shipper & Hạn ngạch**:
  - **Quản lý hạn ngạch giao hàng**: Admin cấu hình dynamic số đơn tối đa Shipper được ôm trong ngày (`GioiHanDonNgay`), hệ thống tự động kiểm tra và chặn nếu quá tải.
  - **Tính lương Shipper tự động**: Đơn giá **3.000 VNĐ** cho mỗi đơn giao thành công.
  - **Báo cáo lương Excel chuyên sâu (.xlsx)**:
    - Sử dụng **SheetJS (xlsx)** xuất báo cáo lương Shipper theo tháng thực tế.
    - Báo cáo tự động truy vấn dữ liệu tháng trước của tháng hiện tại (ví dụ: tháng 5 thì mặc định xuất tháng 4).
    - Cấu trúc file Excel chi tiết: Mã Shipper, Họ & Tên, các cột ngày trong tháng (số đơn thành công của từng ngày), Số đơn thất bại trong tháng, Tổng số đơn hoàn thành, và Tổng lương thực lĩnh.
- [x] **Giải quyết triệt để sụp đổ CSS & méo SVG**:
  - Sửa lỗi `@theme` custom spacing của Tailwind v4 và loại bỏ `@config` cũ gây sụp đổ chiều rộng.
  - Áp dụng các tỷ lệ khung hình động `aspect-[600/220]` và `aspect-[800/240]` kết hợp thuộc tính `preserveAspectRatio="xMidYMid meet"` để giữ biểu đồ SVG sắc nét dưới mọi tỷ lệ zoom hiển thị.
- [x] **Nâng cấp UX trang Đăng nhập & Đăng ký**:
  - Triển khai component `AppContent` ẩn Navbar toàn cục trên trang `/login` và `/register` để chống đè chữ khi phóng to.
  - Thiết lập thẻ Card nổi bật, căn giữa, bo tròn `rounded-[24px]` trên nền xám điểm chấm radial-gradient sâu.
  - Tích hợp nút **"Quay lại" (Back Button)** với icon `ArrowLeft` thanh lịch cạnh logo thương hiệu để tối ưu hóa điều hướng.
- [x] Đồng bộ hóa các tài liệu lưu trữ dự án trong thư mục `memory/` và tạo file `README.md` hướng dẫn chạy chi tiết.
