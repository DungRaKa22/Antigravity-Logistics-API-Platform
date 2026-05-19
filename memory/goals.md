# 🎯 Mục tiêu dự án - Logistics API Platform

> Tài liệu mô tả chi tiết mục tiêu từng giai đoạn và tiêu chí nghiệm thu các nghiệp vụ cốt lõi theo hệ thống 7 bảng Việt hóa.

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

### 3. Phân Hệ Đối Tác B2B (DOITAC) ✅
- [x] **Cấp phát API Key & Xác thực M2M**:
  - Quản trị viên cấp API Key dài 64 ký tự bảo mật (`AG_PARTNER_...`) cho đối tác.
  - Đối tác tích hợp đẩy đơn hàng qua API bằng header `X-API-Key` mà không cần duy trì token JWT.

---

## ⚡ Tiêu chí Kỹ thuật Đạt được

1. **Hiệu năng**: Hệ thống React chạy cực mượt, thời gian build production dưới 1 giây. Backend xử lý song song và có cơ chế fallback khoảng cách an toàn nếu dịch vụ bản đồ OSRM/Nominatim quá tải.
2. **Trải nghiệm người dùng (UX)**: Đạt tiêu chuẩn tối giản sang trọng phong cách Uber (Tone đen/trắng, form input sắc cạnh, nút bấm dạng viên thuốc mềm mại).
3. **Bảo mật**: Cơ chế phân quyền nghiêm ngặt cả ở Client (Route guards `ProtectedRoute`) và Server (Decorators `@require_auth` và `@require_role`).
