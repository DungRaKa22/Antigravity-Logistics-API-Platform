# 🎨 Yêu Cầu Giao Diện (Frontend Requirements) - React SPA

> Phong cách thiết kế: **Premium Dark-Neon Glassmorphism (Nền tối sâu thẳm, thẻ kính mờ translucent backdrop-blur, viền phát quang neon sắc nét, nút bo mềm mại và hiệu ứng hover sinh động)**.

---

## 🧭 Cấu Trúc Tuyến Đường & Phân Hệ (Vite / React Router)

Hệ thống được thiết kế Single Page Application (SPA) với các phân hệ phân quyền rõ rệt:

| Tuyến Đường (Path) | Đối Tượng | Mô Tả & Nghiệp Vụ Đặc Thù |
|:---|:---|:---|
| `/` | Mọi đối tượng | **Trang chủ**: Giới thiệu nền tảng, thanh tra cứu hành trình trực quan, và công cụ ước tính cước phí OSRM nhanh. |
| `/login` | Khách vãng lai | **Đăng nhập**: Card kính mờ bo tròn (`rounded-2xl`) căn giữa trên nền tối sâu, ẩn Navbar toàn cục, tích hợp nút Quay lại (Back button) thanh lịch. |
| `/register` | Khách vãng lai | **Đăng ký**: Thiết lập tài khoản Khách hàng/Doanh nghiệp (`KHACHHANG`) với cấu trúc Card đồng bộ. |
| `/tracking` | Mọi đối tượng | **Hành trình**: Tra cứu Timeline chi tiết và lịch sử di chuyển đơn hàng qua tham số `?code=AG-XXXXXX`. |
| `/merchant` | `KHACHHANG` | **Merchant Dashboard**: Quản lý danh sách đơn hàng, tìm kiếm, lọc trạng thái, in tem vận đơn A6 (có mã vạch Code128 tự sinh), xem hành trình. |
| `/merchant/addresses` | `KHACHHANG` | **Sổ Địa Chỉ**: Quản lý danh bạ gửi/nhận, nút đặt mặc định nhanh, tự động điền khi tạo đơn. |
| `/merchant/invoices` | `KHACHHANG` | **Đối Soát Shop**: Thống kê hóa đơn đối soát COD, số tiền thực nhận sau khi trừ phí vận chuyển và bảo hiểm. |
| `/admin` | `QUANTRI` | **Admin Dashboard**: Quản lý toàn bộ hệ thống, bảng điều phối đơn hàng hoạt động (chỉ định Shipper), bộ đếm trạng thái, quản lý dòng tiền đối soát COD. |
| `/admin/users` | `QUANTRI` | **Quản Lý Nhân Sự & Shipper**: Thiết lập hạn mức ôm đơn trong ngày (`GioiHanDonNgay`), ghi chú nhân viên (`GhiChuNhanSu`), tính lương Shipper 3.000đ/đơn và xuất file báo cáo **Excel (.xlsx)** chuyên nghiệp qua thư viện SheetJS. |
| `/admin/invoices` | `QUANTRI` | **Đối Soát Admin**: Quản lý và phê duyệt thanh toán thủ công các hóa đơn đối soát của các chủ shop. |
| `/staff` | `NHANVIEN` | **Shipper Portal**: Cổng di động tối ưu dọc màn hình. Quản lý danh sách đơn hàng được giao, cập nhật trạng thái đơn hàng (Đang giao, Thành công, Thất bại kèm ghi chú). Thiết lập thông tin cá nhân và tài khoản ngân hàng để nhận lương. |

---

## 🎨 Ngôn Ngữ Thiết Kế & Quy Chuẩn UI/UX Cao Cấp

1. **Bảng màu tối tương phản cao (Dark-Neon Palette)**:
   - Nền canvas chính: Slate tối sâu thẳm `#0b0f19` kết hợp radial gradient để tạo chiều sâu không gian.
   - Hộp Card kính mờ (Glassmorphism): `bg-slate-900/50 backdrop-blur-md border border-white/10` mang lại cảm giác cực kỳ hiện đại, cao cấp.
   - Màu sắc điểm nhấn (Neon Glows): Cyan/Blue (`#3b82f6` phát quang), Emerald/Green (`#10b981` cho thành công) và Rose/Red (`#f43f5e` cho thất bại).
   - Màu chữ: Chữ chính trắng sáng `#ffffff` và chữ phụ xám mute `#94a3b8` để đọc thông tin dễ chịu.
2. **Bo góc tinh tế**:
   - Nút bấm (Buttons) và Tab điều khiển: Thiết kế bo tròn mềm mại (`rounded-xl` hoặc `rounded-full`), có hiệu ứng chuyển màu gradient phát sáng khi hover.
   - Các ô nhập liệu (Inputs): Bo góc nhẹ (`rounded-lg`) trên nền kính tối màu để bảo toàn tính nhất quán của giao diện glassmorphic.
3. **Hiệu ứng Micro-animations**:
   - Mọi nút bấm đều tích hợp `transition-all duration-200` và co giãn nhẹ (`active:scale-97`) khi nhấp chuột.
   - Trạng thái tải dữ liệu được xử lý bằng hiệu ứng pulsing neon mượt mà.

---

## ⚙️ Trải Nghiệm Người Dùng (UX) Nổi Bật & Tinh Chỉnh

### 1. In Ấn Tem Vận Đơn Khổ A6 Chuẩn E-Commerce
- Tích hợp nút in nhanh trên mỗi thẻ đơn hàng tại Merchant Portal.
- Tem in được thiết kế tối ưu kích thước A6 tiêu chuẩn, tự động sinh mã vạch Code128 rõ nét bằng SVG, hiển thị đầy đủ thông tin Người gửi, Người nhận, Trọng lượng, Mã vận đơn, và ghi chú tiền thu hộ COD.
- Sử dụng CSS `@media print` ẩn hoàn toàn các thành phần trang web thừa, chỉ hiển thị duy nhất khung tem nhãn để kết nối trực tiếp với máy in nhiệt.

### 2. Cổng Di Động Cho Nhân Viên Giao Hàng (Shipper Mobile Portal)
- Thiết kế **Bottom Mobile Navigation** cố định ở cạnh dưới màn hình giúp thao tác bằng một ngón tay cực kỳ dễ dàng.
- **Trang Tài khoản & Ngân hàng**: Hỗ trợ Shipper cập nhật nhanh các thông tin cá nhân và số tài khoản ngân hàng (gồm Tên ngân hàng, Số tài khoản, Chủ tài khoản) để kế toán chuyển khoản lương đối soát.
- **Cập nhật trạng thái thông minh**: Shipper có thể cập nhật trạng thái đơn hàng chỉ với một click, nếu giao thất bại sẽ mở ra ô nhập lý do cụ thể gửi về hệ thống quản trị ngay lập tức.

### 3. Xuất Báo Cáo Lương Shipper Chuyên Nghiệp (.xlsx)
- Bảng Excel báo cáo lương được thiết kế cấu trúc khoa học theo chiều ngang:
  - Cột cố định: Mã Shipper, Họ & Tên.
  - Các cột động: Biểu diễn từng ngày trong tháng được lọc (ví dụ: ngày 01, ngày 02... ngày 30). Mỗi ô hiển thị số lượng đơn giao thành công của Shipper trong ngày tương ứng (ví dụ: 5, 12, 8...).
  - Cột tổng hợp: Tổng số đơn thất bại trong tháng, Tổng số đơn giao thành công, và Tổng lương thực lĩnh.
- Sử dụng SheetJS (`xlsx`) giúp tải file cực nhanh, định dạng file chuẩn `.xlsx` tương thích hoàn hảo với Microsoft Excel, Google Sheets mà không bị lỗi font chữ tiếng Việt (UTF-8).
