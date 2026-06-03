# 🎯 Mục tiêu dự án - Logistics API Platform

> Tài liệu mô tả chi tiết mục tiêu từng giai đoạn và tiêu chí nghiệm thu các nghiệp vụ cốt lõi theo hệ thống 14 bảng PostgreSQL Việt hóa.

---

## 🚀 Nghiệm thu Tính năng Nghiệp vụ Cốt lõi

### 1. Phân Hệ Khách Hàng (KHACHHANG) ✅
- [x] **Ước tính cước phí thời gian thực**:
  - Nhập địa chỉ gửi/nhận ➡️ API Geocode và tính khoảng cách KM thực tế bằng OSRM.
  - Nhập kích thước (Dài - Rộng - Cao) ➡️ Tự động quy đổi khối lượng theo tiêu chuẩn logistics: `TrongLuongQuyDoiGram = (D x R x C) / 5000`.
  - Phụ phí trọng lượng: Lấy `max(TrongLuongGram, TrongLuongQuyDoiGram)` làm trọng lượng tính cước.
- [x] **Quản lý Sổ địa chỉ (Address Book)**:
  - Thêm, sửa, xóa địa chỉ người nhận quen thuộc.
  - Hỗ trợ **cờ địa chỉ mặc định (`LaMacDinh = BIT`)** tự động đẩy lên đầu danh sách.
  - Khi tạo đơn hàng mới, tự động chọn địa chỉ mặc định đầu tiên để tiết kiệm thao tác.
  - Xử lý hoán đổi mặc định: Khi đặt một địa chỉ làm mặc định, các địa chỉ còn lại tự động bỏ mặc định. Khi xóa địa chỉ mặc định, tự chọn địa chỉ kế tiếp làm mặc định.
- [x] **Tạo vận đơn lẻ & tải hàng loạt từ Excel**:
  - Form tạo đơn lẻ chuyên sâu hỗ trợ: COD, Giá trị hàng khai báo (tự tính phí bảo hiểm 0.5%), hình thức lấy hàng, quyền kiểm tra hàng.
  - Parse file Excel (.xlsx) thông qua thư viện `openpyxl` ở backend để tạo hàng loạt hàng chục đơn hàng chỉ trong một cú click.

### 2. Phân Hệ Quản Trị (QUANTRI) ✅
- [x] **Điều phối hành trình**:
  - Quản trị viên cập nhật trạng thái vận đơn (`TrangThaiHienTai`) ➡️ Tự động ghi vết chi tiết vào bảng hành trình `LichSu_TrangThai`.
- [x] **Kế toán & Đối soát tài chính**:
  - Khi đơn hàng cập nhật thành `GIAO_THANH_CONG`, hệ thống tự động kích hoạt tạo sao kê đối soát tài chính (`DoiSoat`).
  - Tự động khấu trừ: `ThucNhan = TienThuHoCOD - PhiVanChuyen - PhiBaoHiem`.
  - Quản trị viên truy cập màn hình đối soát để duyệt và xác nhận thanh toán (`CHUA_THANH_TOAN` ➡️ `DA_THANH_TOAN`), tự động cập nhật ngày giờ thanh toán.
  - Phân tách rõ ràng **Đơn COD** và **Đơn 0đ** (Prepaid) trên bảng đối soát đối chiếu dạng Accordion trơn tru.
- [x] **Trung tâm Quản lý & Giám sát Shipper (Phase 5)**:
  - KPI Indicator Cards: Tổng hợp động chỉ số shipper hoạt động, số đơn đang ôm trên xe thời gian thực, tổng số đơn thành công/thất bại, và Tổng Quỹ Lương Shipper trong kỳ.
  - Cấu hình hạn mức ngày (`GioiHanDonNgay`) và ghi chú nhân sự (`GhiChuNhanSu`) thông qua stepper kính mờ điều chỉnh động.
  - Trực tiếp kiểm tra giới hạn động khi gán đơn hàng, tự động chặn nếu shipper vượt giới hạn gán trong ngày.
  - Xuất báo cáo lương bưu tá dạng bảng tính **Excel `.xlsx` nguyên bản (SheetJS)**, căn chỉnh độ rộng cột tự động, đúng cấu trúc cột yêu cầu kèm lọc khoảng bưu tá.

### 3. Phân Hệ Shipper/Nhân Viên (NHANVIEN) ✅
- [x] **Trang Mobile Dashboard & BottomNavBar**:
  - Tích hợp 3 phân tab chuyển đổi nhanh (`activeTab` state machine): Đơn hàng, Lịch sử, Tài khoản với thiết kế Kính mờ bo cong hiện đại.
- [x] **Quản lý Đơn Giao & Quét Mã Nhanh**:
  - Quét mã vận đơn (Code128/QR) tự động định vị thẻ đơn hàng, nháy sáng tím pulsing neon 3 giây và mở hộp thoại cập nhật trạng thái cực nhanh.
- [x] **Lịch sử Giao Nhận & Inline Timeline**:
  - Xem thống kê tiền COD thu hộ thời gian thực để chốt quỹ nộp về bưu cục.
  - Click xem chi tiết lịch trình tự động dựng cây timeline hành trình động (`/api/tracking/<order_id>`) ngay dưới thẻ đơn hàng.
- [x] **Tài Khoản & Ví Thụ Hưởng Nhận Lương**:
  - Thiết lập hồ sơ cá nhân và tài khoản ngân hàng thụ hưởng nhận lương, lưu trữ đồng bộ vào DB backend thông qua API `/api/auth/profile`.

### 4. Phân Hệ Đối Tác B2B (DOITAC) ✅
- [x] **Cấp phát API Key & Xác thực M2M**:
  - Quản trị viên cấp API Key dài 64 ký tự bảo mật (`AG_PARTNER_...`) cho đối tác.
  - Đối tác tích hợp đẩy đơn hàng qua API bằng header `X-API-Key` mà không cần duy trì token JWT.

### 5. Phân Hệ Triển Khai & Báo Cáo (PHASE 7) ✅
- [x] **Dọn dẹp & Khởi tạo 63 Tỉnh Thành**:
  - Tạo 63 Hub bưu cục vệ tinh tương ứng với 63 tỉnh/thành Việt Nam, tự động liên kết với 3 Tổng kho vùng miền gần nhất.
  - Tạo 315 tài khoản nhân sự tự động phân quyền (ADMIN, KETOAN, HR, SHIPPER, KHO) theo đúng cấu trúc `Quanly-HN`, `Ketoan-HN`, `Hr-HN`, `Shipper-HN`, `Kho-HN` phục vụ hội đồng chấm đồ án.
- [x] **Cấu hình môi trường Cloud Deploy**:
  - Tạo `vercel.json` định tuyến SPA frontend React tránh lỗi 404 reload.
  - Tối ưu `Dockerfile` backend tích hợp đầy đủ thư viện Postgres.
- [x] **Tài liệu Báo Cáo Đồ Án Tốt Nghiệp**:
  - Biên soạn báo cáo hoàn chỉnh `BaoCao_Antigravity_Logistics.md` dựa trên cấu trúc mẫu của giảng viên, chuyển đổi nghiệp vụ logistics thông minh.

---

## ⚡ Tiêu chí Kỹ thuật Đạt được

1. **Hiệu năng & Khả năng Đóng gói**: Hệ thống React được tối ưu hoá và biên dịch thành công 100% bằng Vite (`npm run build`) dưới 1 giây. Backend xử lý song song và có cơ chế fallback bản đồ OSRM/Nominatim an toàn.
2. **Trải nghiệm người dùng (UX/UI)**: Đạt tiêu chuẩn tối giản sang trọng phong cách Uber kết hợp các hiệu ứng Neon Glow, Glassmorphism, Stepper hiện đại và mượt mà.
3. **Bảo mật**: Cơ chế phân quyền nghiêm ngặt cả ở Client (Route guards `ProtectedRoute`) và Server (Decorators `@require_auth` và `@require_role`).
4. **Tương thích Microsoft Excel**: Xuất báo cáo dạng `.xlsx` nguyên bản qua SheetJS, căn chỉnh độ rộng tự động và tương thích 100% tiếng Việt có dấu.
5. **Khả năng phân tỷ lệ (Scalability)**: Cơ sở dữ liệu hỗ trợ 63 bưu cục toàn quốc với hàng trăm tài khoản phân vai trò nghiệp vụ chạy hiệu năng mượt mà.

