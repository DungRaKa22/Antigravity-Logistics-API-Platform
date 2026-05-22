# 🗄️ Cấu trúc Database (8 Bảng Việt Hóa) - Logistics API Platform

> Chi tiết cấu trúc dữ liệu 8 bảng Việt hóa thực tế được ánh xạ qua SQLAlchemy ORM và chạy trên hệ quản trị cơ sở dữ liệu SQL Server 2022.

---

## 1. Bảng `NguoiDung` (Quản lý Tài khoản & Phân quyền)
Lưu trữ thông tin người dùng, mật khẩu đã mã hóa, cấu hình tài khoản ngân hàng phục vụ đối soát tài chính, và các chỉ số quản trị shipper.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaNguoiDung` | INT | PK, Identity(1,1) | Mã định danh duy nhất |
| `TenDangNhap` | VARCHAR(100) | UNIQUE, NOT NULL | Tên đăng nhập (Username) |
| `MatKhau` | VARCHAR(255) | NOT NULL | Mật khẩu mã hóa |
| `HoTen` | NVARCHAR(255) | NOT NULL | Họ và tên / Tên doanh nghiệp |
| `VaiTro` | VARCHAR(20) | CHECK (VaiTro IN ('KHACHHANG', 'QUANTRI', 'DOITAC', 'NHANVIEN')) | Phân quyền vai trò |
| `SoTaiKhoan` | VARCHAR(50) | NULL | Số tài khoản ngân hàng |
| `TenNganHang` | NVARCHAR(100) | NULL | Tên ngân hàng đối soát |
| `ChuTaiKhoan` | NVARCHAR(100) | NULL | Chủ tài khoản ngân hàng |
| `GioiHanDonNgay`| INT | DEFAULT 100 | Hạn mức số đơn gán tối đa trong một ngày của bưu tá |
| `GhiChuNhanSu` | NVARCHAR(1000) | NULL | Ghi chú nhân sự/ Bio của bưu tá |
| `NgayTao` | DATETIME | DEFAULT GETDATE() | Ngày giờ khởi tạo tài khoản |

---

## 2. Bảng `SoDiaChi` (Sổ Địa Chỉ Người Nhận/Gửi)
Danh bạ địa chỉ khách hàng của Shop để chọn nhanh khi tạo đơn hàng.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaDiaChi` | INT | PK, Identity(1,1) | Mã địa chỉ duy nhất |
| `MaNguoiDung` | INT | FK, REFERENCES NguoiDung | Liên kết đến tài khoản sở hữu |
| `TenLienHe` | NVARCHAR(255) | NOT NULL | Tên người nhận/gửi hàng |
| `SoDienThoai` | VARCHAR(20) | NOT NULL | Số điện thoại liên lạc |
| `DiaChiChiTiet` | NVARCHAR(500) | NOT NULL | Địa chỉ chi tiết (số nhà, ngõ, phường...) |
| `ViDo` | DECIMAL(10,6) | NULL | Tọa độ vĩ độ (Latitude) |
| `KinhDo` | DECIMAL(10,6) | NULL | Tọa độ kinh độ (Longitude) |
| `LaMacDinh` | BIT | DEFAULT 0 | Đánh dấu địa chỉ mặc định |

---

## 3. Bảng `GoiDichVu` (Danh Mục Gói Cước)
Lưu trữ cấu hình giá khởi điểm và cước phí trên mỗi km của gói dịch vụ.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaGoi` | INT | PK, Identity(1,1) | Mã gói dịch vụ |
| `TenGoi` | VARCHAR(50) | NOT NULL | Tên gói cước (Ví dụ: STANDARD, EXPRESS) |
| `GiaKhoiDiem` | DECIMAL(18,2) | NOT NULL | Cước khởi điểm (cho 3km đầu) |
| `GiaMoiKm` | DECIMAL(18,2) | NOT NULL | Đơn giá cho mỗi km tiếp theo |

---

## 4. Bảng `DonHang` (Quản Lý Vận Đơn)
Bảng trung tâm của toàn bộ hệ thống, chứa thông tin chi tiết về hàng hóa, chi phí, kích thước, trạng thái và bưu tá giao hàng.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaDonHang` | VARCHAR(50) | PK | Mã vận đơn (Vd: AG-123456) |
| `MaNguoiGui` | INT | FK, REFERENCES NguoiDung | Chủ shop tạo đơn |
| `MaGoi` | INT | FK, REFERENCES GoiDichVu | Gói cước vận chuyển |
| `TenNguoiNhan` | NVARCHAR(255) | NOT NULL | Tên khách nhận hàng |
| `SoDienThoaiNhan` | VARCHAR(20) | NOT NULL | Số điện thoại nhận |
| `DiaChiNhan` | NVARCHAR(500) | NOT NULL | Địa chỉ giao hàng đầy đủ |
| `TrongLuongGram` | INT | NOT NULL | Khối lượng thực tế (gram) |
| `ChieuDaiCM` | INT | NULL | Chiều dài kiện hàng (cm) |
| `ChieuRongCM` | INT | NULL | Chiều rộng kiện hàng (cm) |
| `ChieuCaoCM` | INT | NULL | Chiều cao kiện hàng (cm) |
| `TrongLuongQuyDoiGram` | INT | NULL | Khối lượng quy đổi từ kích thước |
| `MoTaHangHoa` | NVARCHAR(500) | NOT NULL | Mô tả chi tiết loại hàng |
| `GiaTriKhaiBao` | DECIMAL(18,2) | DEFAULT 0 | Giá trị hàng để mua bảo hiểm |
| `PhiBaoHiem` | DECIMAL(18,2) | DEFAULT 0 | Phí bảo hiểm hàng hóa (0.5%) |
| `KhoangCachKm` | DECIMAL(10,2) | NULL | Khoảng cách OSRM ước tính |
| `PhiVanChuyen` | DECIMAL(18,2) | NOT NULL | Cước vận chuyển chính thức |
| `TienThuHoCOD` | DECIMAL(18,2) | DEFAULT 0 | Tiền thu hộ COD |
| `QuyenKiemTra` | VARCHAR(50) | CHECK (QuyenKiemTra IN ('KHONG_XEM', 'XEM_KHONG_THU', 'THU_HANG')) | Cờ kiểm tra hàng |
| `GiaoMotPhan` | BIT | DEFAULT 0 | Cho phép giao một phần |
| `HinhThucLayHang` | VARCHAR(50) | CHECK (HinhThucLayHang IN ('TU_MANG_RA_BUU_CUC', 'NHAN_VIEN_DEN_LAY')) | Cách thức gửi hàng |
| `TrangThaiHienTai` | VARCHAR(50) | - | Trạng thái vận đơn (CHO_LAY_HANG, GIAO_THANH_CONG...) |
| `MaNhanVienGiao` | INT | FK, REFERENCES NguoiDung, NULL | Bưu tá/Nhân viên giao nhận chịu trách nhiệm giao |
| `NgayTao` | DATETIME | DEFAULT GETDATE() | Ngày giờ lên đơn |

---

## 5. Bảng `LichSu_TrangThai` (Nhật Ký Hành Trình Vận Đơn)
Ghi vết chi tiết mọi thay đổi về trạng thái của vận đơn kèm theo vị trí và bưu tá cập nhật.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaLichSu` | INT | PK, Identity(1,1) | Mã bản ghi hành trình |
| `MaDonHang` | VARCHAR(50) | FK, REFERENCES DonHang | Cho vận đơn nào |
| `MaTrangThai` | VARCHAR(50) | NOT NULL | Trạng thái cập nhật |
| `ThongTinViTri` | NVARCHAR(500) | NULL | Mô tả bưu cục, vị trí hiện tại |
| `MaNhanVienCapNhat` | INT | FK, REFERENCES NguoiDung | Người thực hiện cập nhật |
| `ThoiGian` | DATETIME | DEFAULT GETDATE() | Ngày giờ cập nhật |

---

## 6. Bảng `DoiSoat` (Đối Soát Tài Tài Khoản Khách Hàng)
Theo dõi dòng tiền thu hộ COD và khấu trừ cước phí cho khách hàng của từng vận đơn riêng lẻ, được gộp vào Hóa đơn đối soát.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaDoiSoat` | INT | PK, Identity(1,1) | Mã sao kê đối soát |
| `MaDonHang` | VARCHAR(50) | FK, UNIQUE, REFERENCES DonHang | Sao kê cho đơn hàng cụ thể |
| `MaKhachHang` | INT | FK, REFERENCES NguoiDung | Shop nhận thụ hưởng |
| `MaHoaDon` | VARCHAR(50) | FK, REFERENCES HoaDonDoiSoat, NULL | Liên kết với hóa đơn đối soát gộp |
| `TongTienThu` | DECIMAL(18,2) | NOT NULL | Tổng COD thực tế thu được |
| `PhiVanChuyenTru` | DECIMAL(18,2) | NOT NULL | Cước vận chuyển bị trừ |
| `PhiBaoHiemTru` | DECIMAL(18,2) | DEFAULT 0 | Phí bảo hiểm bị trừ |
| `PhiHoanTraTru` | DECIMAL(18,2) | DEFAULT 0 | Phí hoàn trả phát sinh (nếu có) |
| `PhiGiaoMotPhanTru` | DECIMAL(18,2) | DEFAULT 0 | Phí giao một phần (nếu có) |
| `ThucNhan` | DECIMAL(18,2) | NOT NULL | Tiền thực tế chuyển khoản |
| `TrangThaiDoiSoat` | VARCHAR(50) | - | Trạng thái thanh toán |
| `NgayTao` | DATETIME | DEFAULT GETDATE() | Ngày giờ khởi tạo sao kê |
| `NgayXuLy` | DATETIME | NULL | Ngày giờ thực hiện chuyển khoản |

---

## 7. Bảng `HoaDonDoiSoat` (Bảng Hóa Đơn Đối Soát Gom Hàng Loạt)
Lưu trữ hóa đơn gộp đối soát định kỳ của Merchant để chi trả tiền COD và trừ cước hàng loạt.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaHoaDon` | VARCHAR(50) | PK | Mã hóa đơn gộp duy nhất (Ví dụ: INV-12345) |
| `MaKhachHang` | INT | FK, REFERENCES NguoiDung | Khách hàng/Shop nhận đối soát |
| `TongCOD` | DECIMAL(18,2) | NOT NULL | Tổng tiền thu hộ COD gom được từ các đơn hàng |
| `TongPhiVanChuyen`| DECIMAL(18,2) | NOT NULL | Tổng cước phí vận chuyển bị trừ |
| `TongThucNhan` | DECIMAL(18,2) | NOT NULL | Số tiền thực nhận chuyển khoản (`TongCOD - TongPhiVanChuyen`) |
| `TrangThaiThanhToan`| VARCHAR(50)| DEFAULT 'CHUA_THANH_TOAN' | Trạng thái thanh toán (`CHUA_THANH_TOAN` / `DA_THANH_TOAN`) |
| `NgayTao` | DATETIME | DEFAULT GETDATE() | Ngày lập hóa đơn đối soát |
| `NgayThanhToan` | DATETIME | NULL | Ngày giờ chuyển khoản thanh toán |

---

## 8. Bảng `KhoaAPI` (Quản Lý Token Đối Tác B2B)
Lưu trữ các API Key của đối tác ngoại tích hợp qua REST API.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
|:---|:---|:---|:---|
| `MaKhoa` | INT | PK, Identity(1,1) | Mã khóa API |
| `MaDoiTac` | INT | FK, REFERENCES NguoiDung | Đối tác thụ hưởng |
| `ChuoiKhoaAPI` | VARCHAR(64) | UNIQUE, NOT NULL | Chuỗi API Key 64 ký tự bảo mật |
| `TrangThaiHoatDong` | BIT | DEFAULT 1 | Bật/tắt truy cập ngoại |
| `NgayTao` | DATETIME | DEFAULT GETDATE() | Ngày cấp khóa |
