# 🗄️ Cấu trúc Database (14 Bảng PostgreSQL) - Logistics API Platform

> Chi tiết cấu trúc dữ liệu 14 bảng PostgreSQL thực tế được ánh xạ qua SQLAlchemy ORM và chạy trên cơ sở dữ liệu `LogisticsDB`.

---

## 1. Bảng `TongKho` (Quản lý Tổng Kho Vùng Miền)
Lưu trữ thông tin về 3 Tổng kho khu vực chính của Antigravity Express.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaTongKho` | INT | PK, Serial | Mã định danh tổng kho duy nhất |
| `TenTongKho` | VARCHAR(150) | NOT NULL | Tên tổng kho (Vd: Tổng kho miền Bắc) |
| `VungMien` | VARCHAR(20) | NOT NULL | Vùng miền hoạt động ('BAC', 'TRUNG', 'NAM') |
| `DiaChi` | TEXT | NOT NULL | Địa chỉ chi tiết |
| `ViDo` | DECIMAL(10,6) | NOT NULL | Vĩ độ địa lý (Latitude) |
| `KinhDo` | DECIMAL(10,6) | NOT NULL | Kinh độ địa lý (Longitude) |
| `NgayTao` | TIMESTAMP | DEFAULT utcnow | Ngày giờ khởi tạo bản ghi |

---

## 2. Bảng `ChiNhanh` (Quản lý Chi Nhánh Vệ Tinh Vùng)
Quản lý các bưu cục, chi nhánh con trực thuộc các tổng kho khu vực.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaChiNhanh` | INT | PK, Serial | Mã định danh chi nhánh duy nhất |
| `TenChiNhanh` | VARCHAR(150) | NOT NULL | Tên bưu cục / chi nhánh con |
| `DiaChi` | TEXT | NOT NULL | Địa chỉ chi tiết bưu cục |
| `ViDo` | DECIMAL(10,6) | NOT NULL | Vĩ độ địa lý (Latitude) |
| `KinhDo` | DECIMAL(10,6) | NOT NULL | Kinh độ địa lý (Longitude) |
| `MaTongKhoLienKet`| INT | FK, SET NULL | Mã tổng kho quản lý liên thông |
| `NgayTao` | TIMESTAMP | DEFAULT utcnow | Ngày giờ khởi tạo bản ghi |

---

## 3. Bảng `NguoiDung` (Tài Khoản & Phân Quyền 8 Nhóm Vai Trò)
Lưu trữ thông tin người dùng, mật khẩu băm, hạn mức, chấm công và tài khoản ngân hàng thụ hưởng.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaNguoiDung` | INT | PK, Serial | Mã tài khoản duy nhất |
| `TenDangNhap` | VARCHAR(100) | UNIQUE, NOT NULL | Tên đăng nhập (Username) |
| `MatKhau` | VARCHAR(255) | NOT NULL | Mật khẩu băm an toàn |
| `HoTen` | VARCHAR(255) | NOT NULL | Tên hiển thị / Tên doanh nghiệp |
| `VaiTro` | VARCHAR(30) | NOT NULL | Phân quyền 8 vai trò (`ADMIN`, `CSKH`, `KETOAN`, `HR`, `QUANLYKHO`, `SHIPPER`, `MERCHANT`, `RETAIL`) |
| `SoTaiKhoan` | VARCHAR(50) | NULL | Số tài khoản ngân hàng thụ hưởng |
| `TenNganHang` | VARCHAR(100) | NULL | Tên ngân hàng nhận chuyển khoản |
| `ChuTaiKhoan` | VARCHAR(100) | NULL | Tên chủ tài khoản ngân hàng |
| `LuongCoBan` | DECIMAL(15,2) | DEFAULT 0.00 | Mức lương cứng của nhân viên |
| `GioiHanDonNgay`| INT | DEFAULT 100 | Số đơn tối đa bưu tá được gán trong ngày |
| `GhiChuNhanSu` | TEXT | NULL | Thông tin đánh giá, tuyến bưu tá phụ trách |
| `MaChiNhanh` | INT | FK, SET NULL | Chi nhánh làm việc hiện tại |
| `MaTongKho` | INT | FK, SET NULL | Tổng kho quản lý trực tiếp |
| `NgayTao` | TIMESTAMP | DEFAULT utcnow | Ngày giờ tạo tài khoản |

---

## 4. Bảng `SoDiaChi` (Sổ Địa Chỉ Gửi / Nhận Khách Hàng)
Danh bạ địa chỉ quen thuộc của Merchant phục vụ tự động tính cước OSRM và hoán đổi địa chỉ mặc định thông minh.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaDiaChi` | INT | PK, Serial | Mã địa chỉ |
| `MaNguoiDung` | INT | FK, CASCADE | Tài khoản sở hữu địa chỉ này |
| `TenLienHe` | VARCHAR(255) | NOT NULL | Họ tên người liên hệ gửi/nhận |
| `SoDienThoai` | VARCHAR(20) | NOT NULL | Số điện thoại di động |
| `DiaChiChiTiet` | TEXT | NOT NULL | Địa chỉ đầy đủ dạng văn bản |
| `ViDo` | DECIMAL(10,6) | NULL | Vĩ độ địa lý geocoded |
| `KinhDo` | DECIMAL(10,6) | NULL | Kinh độ địa lý geocoded |
| `LaMacDinh` | BOOLEAN | DEFAULT False | Đánh dấu địa chỉ mặc định ưu tiên |

---

## 5. Bảng `GoiDichVu` (Cấu Hình Giá Dịch Vụ)
Cung cấp định mức cước phí cho các gói vận chuyển standard / express.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaGoi` | INT | PK, Serial | Mã gói cước |
| `TenGoi` | VARCHAR(50) | NOT NULL | Tên dịch vụ (STANDARD, EXPRESS) |
| `GiaKhoiDiem` | DECIMAL(18,2) | NOT NULL | Giá mở cửa (áp dụng cho 3km đầu) |
| `GiaMoiKm` | DECIMAL(18,2) | NOT NULL | Giá tăng thêm cho mỗi km tiếp theo |

---

## 6. Bảng `DonHang` (Bản Ghi Vận Đơn Trung Tâm)
Bảng quan trọng nhất lưu trữ thông tin hàng hóa, cước phí OSRM, COD và liên kết bưu tá.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaDonHang` | VARCHAR(50) | PK | Mã bưu gửi tự sinh dạng `AG-XXXXXX` |
| `MaNguoiGui` | INT | FK | Shop gửi / Merchant tạo đơn |
| `MaGoi` | INT | FK | Gói cước dịch vụ sử dụng |
| `TenNguoiNhan` | VARCHAR(255) | NOT NULL | Họ tên người nhận hàng chặng cuối |
| `SoDienThoaiNhan`| VARCHAR(20) | NOT NULL | Số điện thoại người nhận |
| `DiaChiNhan` | TEXT | NOT NULL | Địa chỉ giao hàng chặng cuối |
| `ViDoNhan` | DECIMAL(10,6) | NULL | Vĩ độ đích chặng cuối |
| `KinhDoNhan` | DECIMAL(10,6) | NULL | Kinh độ đích chặng cuối |
| `TrongLuongGram`| INT | NOT NULL | Khối lượng kiện hàng thực tế |
| `ChieuDaiCM` | INT | NULL | Chiều dài kiện hàng |
| `ChieuRongCM` | INT | NULL | Chiều rộng kiện hàng |
| `ChieuCaoCM` | INT | NULL | Chiều cao kiện hàng |
| `TrongLuongQuyDoiGram`| INT | NULL | Quy đổi: `(Dài * Rộng * Cao) / 5000` |
| `MoTaHangHoa` | TEXT | NOT NULL | Mô tả loại bưu gửi |
| `GiaTriKhaiBao` | DECIMAL(18,2) | DEFAULT 0 | Giá trị bảo hiểm khai báo |
| `PhiBaoHiem` | DECIMAL(18,2) | DEFAULT 0 | Phí bảo hiểm tính thêm (0.5% giá trị) |
| `KhoangCachKm` | DECIMAL(10,2) | NULL | Khoảng cách tính toán qua OSRM |
| `PhiVanChuyen` | DECIMAL(18,2) | NOT NULL | Cước vận chuyển chính thức |
| `TienThuHoCOD` | DECIMAL(18,2) | DEFAULT 0 | Tiền thu hộ COD |
| `QuyenKiemTra` | VARCHAR(50) | DEFAULT 'KHONG_XEM' | CHECK: `KHONG_XEM`, `XEM_KHONG_THU`, `THU_HANG` |
| `GiaoMotPhan` | BOOLEAN | DEFAULT False | Cho phép giao một phần bưu kiện |
| `HinhThucLayHang`| VARCHAR(50) | DEFAULT 'TU_MANG_RA_BUU_CUC'| CHECK: `TU_MANG_RA_BUU_CUC`, `NHAN_VIEN_DEN_LAY` |
| `TrangThaiHienTai`| VARCHAR(50) | NOT NULL | Trạng thái (`CHO_LAY_HANG`, `DANG_VAN_CHUYEN`...) |
| `TrangThaiThanhToan`| VARCHAR(50)| DEFAULT 'CHUA_THANH_TOAN'| Trạng thái thanh toán phí đơn |
| `GiaoDichThanhToanId`| VARCHAR(100)| NULL | Mã giao dịch Momo/VNPay đối ứng |
| `MaChiNhanhGui` | INT | FK, SET NULL | Chi nhánh gốc tiếp nhận đơn |
| `MaChiNhanhNhan`| INT | FK, SET NULL | Chi nhánh đích phát chặng cuối |
| `MaNhanVienGiao`| INT | FK | Bưu tá/Shipper nhận giao hàng |
| `NgayTao` | TIMESTAMP | DEFAULT utcnow | Ngày giờ khởi tạo đơn |

---

## 7. Bảng `LichSu_TrangThai` (Hành Trình Vận Đơn & Chữ Ký Cảm Ứng)
Lưu trữ nhật ký hành trình chi tiết, vết vị trí, chứng cứ camera bưu tá và chữ ký nhận tay khách hàng.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaLichSu` | INT | PK, Serial | Mã bản ghi hành trình |
| `MaDonHang` | VARCHAR(50) | FK, CASCADE | Mã vận đơn liên kết |
| `MaTrangThai` | VARCHAR(50) | NOT NULL | Trạng thái ghi nhận mới |
| `ThongTinViTri` | TEXT | NULL | Vết tọa độ địa lý / Địa chỉ bưu tá / Chữ ký text |
| `AnhBangChungUrl`| TEXT | NULL | Link ảnh camera bằng chứng bưu tá chụp |
| `GhiChuLyDo` | TEXT | NULL | Lý do giao thất bại / Mô tả sự cố bưu phẩm |
| `MaNhanVienCapNhat`| INT | FK | Bưu tá hoặc quản trị viên thực hiện cập nhật |
| `ThoiGian` | TIMESTAMP | DEFAULT utcnow | Ngày giờ cập nhật trạng thái |

---

## 8. Bảng `DoiSoat` (Chi Tiết Đối Soát Đơn Hàng)
Quản lý cước phí trừ âm, tiền thu hộ COD và tiền thực tế chuyển khoản của từng bưu gửi giao thành công.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaDoiSoat` | INT | PK, Serial | Mã sao kê đối soát |
| `MaDonHang` | VARCHAR(50) | FK, UNIQUE | Đối soát cho vận đơn duy nhất |
| `MaKhachHang` | INT | FK | Merchant được chi trả tiền |
| `MaHoaDon` | VARCHAR(50) | FK | Hóa đơn đối soát gộp liên kết |
| `TongTienThu` | DECIMAL(18,2) | NOT NULL | Tiền thu hộ COD chặng cuối |
| `PhiVanChuyenTru`| DECIMAL(18,2) | NOT NULL | Cước vận chuyển khấu trừ |
| `PhiBaoHiemTru` | DECIMAL(18,2) | DEFAULT 0 | Phí bảo hiểm khấu trừ |
| `PhiHoanTraTru` | DECIMAL(18,2) | DEFAULT 0 | Phí chuyển hoàn trả phát sinh |
| `PhiGiaoMotPhanTru`| DECIMAL(18,2)| DEFAULT 0 | Phí dịch vụ giao hàng một phần |
| `ThucNhan` | DECIMAL(18,2) | NOT NULL | Tiền thực nhận của shop: `COD - Phi` |
| `TrangThaiDoiSoat`| VARCHAR(50) | NOT NULL | Trạng thái đối soát (`UNPAID`, `PAID`) |
| `NgayTao` | TIMESTAMP | DEFAULT utcnow | Ngày lập bảng đối soát lẻ |
| `NgayXuLy` | TIMESTAMP | NULL | Ngày chuyển khoản tiền |

---

## 9. Bảng `HoaDonDoiSoat` (Hóa Đơn Đối Soát Gom Hàng Loạt)
Hóa đơn gộp chi trả doanh số COD định kỳ cho khách hàng của Antigravity Express.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaHoaDon` | VARCHAR(50) | PK | Mã hóa đơn gộp tự sinh dạng `INV-XXXXXXXX` |
| `MaKhachHang` | INT | FK | Chủ shop / Merchant nhận |
| `TongCOD` | DECIMAL(18,2) | NOT NULL | Tổng tiền COD thu hộ gom lại |
| `TongPhiVanChuyen`| DECIMAL(18,2) | NOT NULL | Tổng cước phí khấu trừ |
| `TongThucNhan` | DECIMAL(18,2) | NOT NULL | Số tiền thực nhận chuyển khoản: `COD - Phí` |
| `TrangThaiThanhToan`| VARCHAR(50)| DEFAULT 'CHUA_THANH_TOAN'| Trạng thái hóa đơn gộp (`CHUA_THANH_TOAN` / `DA_THANH_TOAN`) |
| `NgayTao` | TIMESTAMP | DEFAULT utcnow | Ngày lập hóa đơn gộp |
| `NgayThanhToan` | TIMESTAMP | NULL | Ngày giờ chi trả chuyển khoản |

---

## 10. Bảng `KhoaAPI` (Khóa Tích Hợp B2B Cho Đối Tác Ngoại)
Quản lý API Key dài 64 ký tự gán cho đối tác phục vụ kết nối M2M tự động.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaKhoa` | INT | PK, Serial | Mã khóa |
| `MaDoiTac` | INT | FK, CASCADE | Đối tác sở hữu khóa |
| `ChuoiKhoaAPI` | VARCHAR(64) | UNIQUE, NOT NULL | Chuỗi token API Key an toàn `AG_PARTNER_...` |
| `TrangThaiHoatDong`| BOOLEAN | DEFAULT True | Trạng thái hiệu lực |
| `NgayTao` | TIMESTAMP | DEFAULT utcnow | Ngày giờ cấp phát |

---

## 11. Bảng `TinNhan` (Real-time Socket.io Message Hub)
Lưu giữ toàn bộ lịch sử tin nhắn và tệp đính kèm khi khách hàng chat khiếu nại thời gian thực với CSKH.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaTinNhan` | INT | PK, Serial | Mã tin nhắn |
| `PhongChatId` | VARCHAR(100) | NOT NULL | Mã phòng chat liên kết (thường là `MaDonHang`) |
| `MaNguoiGui` | INT | FK, CASCADE | Người gửi tin nhắn |
| `MaNguoiNhan` | INT | FK, CASCADE, NULL | Người nhận tin nhắn (nếu gán cụ thể) |
| `NoiDung` | TEXT | NOT NULL | Nội dung tin nhắn văn bản |
| `FileDinhKemUrl`| TEXT | NULL | Đường dẫn ảnh/tệp khiếu nại đính kèm |
| `ThoiGianGui` | TIMESTAMP | DEFAULT utcnow | Ngày giờ gửi tin |

---

## 12. Bảng `ChamCong` (Bảng Chấm Công Nhân Viên Bưu Cục)
HR Manager sử dụng bảng này để giám sát điểm danh ca làm việc trực tiếp của bưu tá và nhân viên kho.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaChamCong` | INT | PK, Serial | Mã chấm công |
| `MaNhanVien` | INT | FK, CASCADE | Tài khoản nhân viên/Shipper |
| `Ngay` | DATE | DEFAULT Ngày hiện tại | Ngày điểm danh chấm công |
| `GioVao` | TIMESTAMP | NULL | Giờ đăng nhập vào ca đầu ngày |
| `GioRa` | TIMESTAMP | NULL | Giờ kết thúc tan ca |
| `TrangThai` | VARCHAR(30) | DEFAULT 'VAO_CA' | CHECK: `VAO_CA`, `TAN_CA`, `NGHI_PHEP` |

---

## 13. Bảng `KhieuNai` (Quầy Xử Lý Khiếu Nại Đơn Hàng CSKH)
Hỗ trợ tạo vé ticket khiếu nại liên kết đơn, làm căn cứ chuyển tiếp sang luồng CSKH chat hai chiều.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaKhieuNai` | INT | PK, Serial | Mã vé khiếu nại |
| `MaDonHang` | VARCHAR(50) | FK, CASCADE | Đơn hàng bị khiếu nại |
| `MaKhachHang` | INT | FK, CASCADE | Khách hàng tạo ticket |
| `TieuDe` | VARCHAR(255) | NOT NULL | Tiêu đề tóm tắt |
| `NoiDung` | TEXT | NOT NULL | Nội dung khiếu nại chi tiết |
| `TrangThai` | VARCHAR(50) | DEFAULT 'CHO_TIEP_NHAN'| CHECK: `CHO_TIEP_NHAN`, `DANG_XU_LY`, `DA_XU_LY` |
| `NgayTao` | TIMESTAMP | DEFAULT utcnow | Ngày giờ mở vé ticket |

---

## 14. Bảng `DangKyNhanThongBao` (Thiết Bị Đăng Ký Web Push API)
Lưu trữ thông tin endpoints của trình duyệt khách hàng và bưu tá phục vụ gửi thông báo Push ngay cả khi tắt ứng dụng.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaDangKy` | INT | PK, Serial | Mã đăng ký |
| `MaNguoiDung` | INT | FK, CASCADE | Tài khoản đăng ký thiết bị |
| `Endpoint` | TEXT | NOT NULL | URL máy chủ Push dịch vụ (Google, Mozilla...) |
| `P256dh` | VARCHAR(255) | NOT NULL | Khóa mật mã công khai của client |
| `Auth` | VARCHAR(255) | NOT NULL | Chuỗi xác thực client |
| `NgayTao` | TIMESTAMP | DEFAULT utcnow | Ngày đăng ký |

