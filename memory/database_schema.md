# 🗄️ Thiết kế Cơ sở dữ liệu - Logistics API Platform

> Hệ quản trị: **SQL Server 2022** | Collation: Vietnamese_CI_AS  
> Cập nhật: 2026-04-10 (Việt hóa toàn bộ)

---

## Sơ đồ quan hệ (ERD tóm tắt)

```
┌────────────┐     ┌──────────────┐     ┌────────────┐
│ NguoiDung  │────<│   DonHang    │>────│   KhuVuc   │
└────────────┘     └──────┬───────┘     └────────────┘
                          │
┌────────────┐     ┌──────┴──────────┐  ┌────────────┐
│  DoiTac    │────<│LichSu_TrangThai│  │  BangGia   │
└────────────┘     └─────────────────┘  └────────────┘
```

---

## Bảng 1: NguoiDung (Người dùng)

> Lưu thông tin tài khoản khách hàng và nhân viên.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `ma_nguoi_dung` | INT | PK, IDENTITY(1,1) | Mã người dùng |
| `ho_ten` | NVARCHAR(100) | NOT NULL | Họ và tên |
| `email` | VARCHAR(150) | NOT NULL, UNIQUE | Email đăng nhập |
| `mat_khau_hash` | VARCHAR(255) | NOT NULL | Mật khẩu đã mã hóa (bcrypt) |
| `so_dien_thoai` | VARCHAR(20) | NULL | Số điện thoại |
| `dia_chi` | NVARCHAR(500) | NULL | Địa chỉ |
| `vai_tro` | VARCHAR(20) | NOT NULL, DEFAULT 'KHACHHANG' | Vai trò: KHACHHANG, NHANVIEN, QUANTRI |
| `api_key` | VARCHAR(64) | UNIQUE | Khóa API cho xác thực |
| `trang_thai` | BIT | DEFAULT 1 | Trạng thái hoạt động (1=Hoạt động) |
| `ngay_tao` | DATETIME | DEFAULT GETDATE() | Ngày tạo tài khoản |
| `ngay_cap_nhat` | DATETIME | DEFAULT GETDATE() | Ngày cập nhật gần nhất |

```sql
CREATE TABLE NguoiDung (
    ma_nguoi_dung   INT PRIMARY KEY IDENTITY(1,1),
    ho_ten          NVARCHAR(100)   NOT NULL,
    email           VARCHAR(150)    NOT NULL UNIQUE,
    mat_khau_hash   VARCHAR(255)    NOT NULL,
    so_dien_thoai   VARCHAR(20)     NULL,
    dia_chi         NVARCHAR(500)   NULL,
    vai_tro         VARCHAR(20)     NOT NULL DEFAULT 'KHACHHANG',
    api_key         VARCHAR(64)     UNIQUE,
    trang_thai      BIT             DEFAULT 1,
    ngay_tao        DATETIME        DEFAULT GETDATE(),
    ngay_cap_nhat   DATETIME        DEFAULT GETDATE(),
    CONSTRAINT CK_NguoiDung_VaiTro CHECK (vai_tro IN ('KHACHHANG', 'NHANVIEN', 'QUANTRI'))
);
```

---

## Bảng 2: DoiTac (Đối tác)

> Lưu thông tin các hệ thống đối tác (sàn TMĐT) tích hợp API.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `ma_doi_tac` | INT | PK, IDENTITY(1,1) | Mã đối tác |
| `ten_cong_ty` | NVARCHAR(200) | NOT NULL | Tên công ty / hệ thống |
| `email_lien_he` | VARCHAR(150) | NOT NULL, UNIQUE | Email liên hệ |
| `sdt_lien_he` | VARCHAR(20) | NULL | SĐT liên hệ |
| `api_key` | VARCHAR(64) | NOT NULL, UNIQUE | Khóa API được cấp |
| `webhook_url` | VARCHAR(500) | NULL | URL callback khi cập nhật trạng thái |
| `trang_thai` | BIT | DEFAULT 1 | Trạng thái hoạt động |
| `ngay_dang_ky` | DATETIME | DEFAULT GETDATE() | Ngày đăng ký |

```sql
CREATE TABLE DoiTac (
    ma_doi_tac      INT PRIMARY KEY IDENTITY(1,1),
    ten_cong_ty     NVARCHAR(200)   NOT NULL,
    email_lien_he   VARCHAR(150)    NOT NULL UNIQUE,
    sdt_lien_he     VARCHAR(20)     NULL,
    api_key         VARCHAR(64)     NOT NULL UNIQUE,
    webhook_url     VARCHAR(500)    NULL,
    trang_thai      BIT             DEFAULT 1,
    ngay_dang_ky    DATETIME        DEFAULT GETDATE()
);
```

---

## Bảng 3: KhuVuc (Khu vực)

> Danh mục khu vực giao hàng, dùng để tính phí cước.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `ma_khu_vuc` | INT | PK, IDENTITY(1,1) | Mã khu vực |
| `ten_khu_vuc` | NVARCHAR(100) | NOT NULL | Tên khu vực (VD: Quận Hoàn Kiếm) |
| `tinh_thanh` | NVARCHAR(100) | NOT NULL | Tỉnh / Thành phố |
| `ma_vung` | VARCHAR(10) | UNIQUE | Mã vùng (VD: HN01, HCM02) |
| `loai_vung` | INT | NOT NULL | Loại vùng: 1=Nội thành, 2=Ngoại thành, 3=Liên tỉnh |

```sql
CREATE TABLE KhuVuc (
    ma_khu_vuc      INT PRIMARY KEY IDENTITY(1,1),
    ten_khu_vuc     NVARCHAR(100)   NOT NULL,
    tinh_thanh      NVARCHAR(100)   NOT NULL,
    ma_vung         VARCHAR(10)     UNIQUE,
    loai_vung       INT             NOT NULL,
    CONSTRAINT CK_KhuVuc_LoaiVung CHECK (loai_vung IN (1, 2, 3))
);
```

---

## Bảng 4: BangGia (Bảng giá cước)

> Quy tắc tính phí dựa trên vùng gửi - vùng nhận và trọng lượng.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `ma_gia_cuoc` | INT | PK, IDENTITY(1,1) | Mã giá cước |
| `vung_gui` | INT | NOT NULL | Vùng gửi (1, 2 hoặc 3) |
| `vung_nhan` | INT | NOT NULL | Vùng nhận (1, 2 hoặc 3) |
| `phi_co_ban` | DECIMAL(12,2) | NOT NULL | Phí cơ bản (VND) |
| `phi_theo_kg` | DECIMAL(12,2) | NOT NULL | Phí theo kg (VND/kg) |
| `trong_luong_toi_da` | DECIMAL(5,2) | DEFAULT 30 | Trọng lượng tối đa (kg) |
| `mo_ta` | NVARCHAR(200) | NULL | Ghi chú / Mô tả |
| `trang_thai` | BIT | DEFAULT 1 | Còn áp dụng (1=Có) |

```sql
CREATE TABLE BangGia (
    ma_gia_cuoc     INT PRIMARY KEY IDENTITY(1,1),
    vung_gui        INT             NOT NULL,
    vung_nhan       INT             NOT NULL,
    phi_co_ban      DECIMAL(12,2)   NOT NULL,
    phi_theo_kg     DECIMAL(12,2)   NOT NULL,
    trong_luong_toi_da DECIMAL(5,2) DEFAULT 30,
    mo_ta           NVARCHAR(200)   NULL,
    trang_thai      BIT             DEFAULT 1,
    CONSTRAINT CK_BangGia_VungGui CHECK (vung_gui IN (1, 2, 3)),
    CONSTRAINT CK_BangGia_VungNhan CHECK (vung_nhan IN (1, 2, 3)),
    CONSTRAINT UQ_BangGia_Vung UNIQUE (vung_gui, vung_nhan)
);
```

---

## Bảng 5: DonHang (Đơn hàng / Vận đơn)

> Bảng chính lưu thông tin vận đơn.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `ma_don_hang` | INT | PK, IDENTITY(1,1) | Mã đơn hàng |
| `ma_van_don` | VARCHAR(20) | NOT NULL, UNIQUE | Mã vận đơn (VD: HL20260407001) |
| `ma_nguoi_dung` | INT | FK → NguoiDung, NULL | Khách hàng tạo đơn |
| `ma_doi_tac` | INT | FK → DoiTac, NULL | Đối tác tạo đơn (nếu có) |
| `ten_nguoi_gui` | NVARCHAR(100) | NOT NULL | Tên người gửi |
| `sdt_nguoi_gui` | VARCHAR(20) | NOT NULL | SĐT người gửi |
| `diachi_nguoi_gui` | NVARCHAR(500) | NOT NULL | Địa chỉ người gửi |
| `ma_khuvuc_gui` | INT | FK → KhuVuc | Khu vực gửi |
| `ten_nguoi_nhan` | NVARCHAR(100) | NOT NULL | Tên người nhận |
| `sdt_nguoi_nhan` | VARCHAR(20) | NOT NULL | SĐT người nhận |
| `diachi_nguoi_nhan` | NVARCHAR(500) | NOT NULL | Địa chỉ người nhận |
| `ma_khuvuc_nhan` | INT | FK → KhuVuc | Khu vực nhận |
| `trong_luong_kg` | DECIMAL(5,2) | NOT NULL | Trọng lượng (kg) |
| `mo_ta_hang_hoa` | NVARCHAR(500) | NULL | Mô tả hàng hóa |
| `phi_van_chuyen` | DECIMAL(12,2) | NOT NULL | Phí vận chuyển (VND) |
| `tien_thu_ho` | DECIMAL(12,2) | DEFAULT 0 | Tiền thu hộ COD (VND) |
| `trang_thai` | VARCHAR(20) | NOT NULL, DEFAULT 'CHO_LAY_HANG' | Trạng thái đơn |
| `ghi_chu` | NVARCHAR(500) | NULL | Ghi chú thêm |
| `ngay_tao` | DATETIME | DEFAULT GETDATE() | Ngày tạo đơn |
| `ngay_cap_nhat` | DATETIME | DEFAULT GETDATE() | Ngày cập nhật |

```sql
CREATE TABLE DonHang (
    ma_don_hang     INT PRIMARY KEY IDENTITY(1,1),
    ma_van_don      VARCHAR(20)     NOT NULL UNIQUE,
    ma_nguoi_dung   INT             NULL REFERENCES NguoiDung(ma_nguoi_dung),
    ma_doi_tac      INT             NULL REFERENCES DoiTac(ma_doi_tac),
    ten_nguoi_gui       NVARCHAR(100)   NOT NULL,
    sdt_nguoi_gui       VARCHAR(20)     NOT NULL,
    diachi_nguoi_gui    NVARCHAR(500)   NOT NULL,
    ma_khuvuc_gui       INT             REFERENCES KhuVuc(ma_khu_vuc),
    ten_nguoi_nhan      NVARCHAR(100)   NOT NULL,
    sdt_nguoi_nhan      VARCHAR(20)     NOT NULL,
    diachi_nguoi_nhan   NVARCHAR(500)   NOT NULL,
    ma_khuvuc_nhan      INT             REFERENCES KhuVuc(ma_khu_vuc),
    trong_luong_kg      DECIMAL(5,2)    NOT NULL,
    mo_ta_hang_hoa      NVARCHAR(500)   NULL,
    phi_van_chuyen      DECIMAL(12,2)   NOT NULL,
    tien_thu_ho         DECIMAL(12,2)   DEFAULT 0,
    trang_thai          VARCHAR(20)     NOT NULL DEFAULT 'CHO_LAY_HANG',
    ghi_chu             NVARCHAR(500)   NULL,
    ngay_tao            DATETIME        DEFAULT GETDATE(),
    ngay_cap_nhat       DATETIME        DEFAULT GETDATE(),
    CONSTRAINT CK_DonHang_TrangThai CHECK (trang_thai IN (
        'CHO_LAY_HANG', 'DA_LAY_HANG', 'DANG_VAN_CHUYEN',
        'GIAO_THANH_CONG', 'DA_HUY', 'HOAN_TRA'
    ))
);
```

---

## Bảng 6: LichSu_TrangThai (Lịch sử trạng thái)

> Ghi lại dòng thời gian thay đổi trạng thái của mỗi đơn hàng.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `ma_lich_su` | INT | PK, IDENTITY(1,1) | Mã lịch sử |
| `ma_don_hang` | INT | FK → DonHang, NOT NULL | Đơn hàng liên quan |
| `trang_thai_cu` | VARCHAR(20) | NULL | Trạng thái trước đó |
| `trang_thai_moi` | VARCHAR(20) | NOT NULL | Trạng thái mới |
| `nguoi_thay_doi` | INT | FK → NguoiDung, NULL | Người thay đổi |
| `ghi_chu` | NVARCHAR(300) | NULL | Ghi chú kèm theo |
| `thoi_gian` | DATETIME | DEFAULT GETDATE() | Thời điểm thay đổi |

```sql
CREATE TABLE LichSu_TrangThai (
    ma_lich_su      INT PRIMARY KEY IDENTITY(1,1),
    ma_don_hang     INT NOT NULL REFERENCES DonHang(ma_don_hang),
    trang_thai_cu   VARCHAR(20)     NULL,
    trang_thai_moi  VARCHAR(20)     NOT NULL,
    nguoi_thay_doi  INT             NULL REFERENCES NguoiDung(ma_nguoi_dung),
    ghi_chu         NVARCHAR(300)   NULL,
    thoi_gian       DATETIME        DEFAULT GETDATE(),
    CONSTRAINT CK_LichSu_TrangThaiMoi CHECK (trang_thai_moi IN (
        'CHO_LAY_HANG', 'DA_LAY_HANG', 'DANG_VAN_CHUYEN',
        'GIAO_THANH_CONG', 'DA_HUY', 'HOAN_TRA'
    ))
);
```

---

## Trạng thái đơn hàng

| Giá trị | Tên tiếng Việt | Mô tả |
|---------|---------------|-------|
| `CHO_LAY_HANG` | Chờ lấy hàng | Đơn mới tạo, chờ shipper đến lấy |
| `DA_LAY_HANG` | Đã lấy hàng | Shipper đã nhận hàng từ người gửi |
| `DANG_VAN_CHUYEN` | Đang vận chuyển | Hàng đang trên đường giao |
| `GIAO_THANH_CONG` | Giao thành công | Đã giao đến người nhận |
| `DA_HUY` | Đã hủy | Đơn bị hủy |
| `HOAN_TRA` | Hoàn trả | Giao không thành công, hoàn về người gửi |

## Vai trò người dùng

| Giá trị | Tên tiếng Việt | Mô tả |
|---------|---------------|-------|
| `KHACHHANG` | Khách hàng | Tạo đơn, tra cứu đơn của mình |
| `NHANVIEN` | Nhân viên | Xem/cập nhật tất cả đơn, quản lý bảng giá |
| `QUANTRI` | Quản trị viên | Toàn quyền + quản lý người dùng/đối tác |

---

## Dữ liệu mẫu (Seed Data)

### KhuVuc
```sql
INSERT INTO KhuVuc (ten_khu_vuc, tinh_thanh, ma_vung, loai_vung) VALUES
(N'Quận Hoàn Kiếm', N'Hà Nội', 'HN01', 1),
(N'Quận Cầu Giấy', N'Hà Nội', 'HN02', 1),
(N'Huyện Đông Anh', N'Hà Nội', 'HN06', 2),
(N'Quận 1', N'TP. Hồ Chí Minh', 'HCM01', 1),
(N'Quận Thủ Đức', N'TP. Hồ Chí Minh', 'HCM04', 2),
(N'TP. Hải Dương', N'Hải Dương', 'HD01', 3),
(N'TP. Đà Nẵng', N'Đà Nẵng', 'DN01', 3);
-- Tổng cộng: 20 khu vực
```

### BangGia
```sql
INSERT INTO BangGia (vung_gui, vung_nhan, phi_co_ban, phi_theo_kg, mo_ta) VALUES
(1, 1, 15000, 3000, N'Nội thành → Nội thành'),
(1, 2, 20000, 4000, N'Nội thành → Ngoại thành'),
(1, 3, 30000, 5000, N'Nội thành → Liên tỉnh'),
(2, 1, 20000, 4000, N'Ngoại thành → Nội thành'),
(2, 2, 22000, 4500, N'Ngoại thành → Ngoại thành'),
(2, 3, 32000, 5500, N'Ngoại thành → Liên tỉnh'),
(3, 1, 30000, 5000, N'Liên tỉnh → Nội thành'),
(3, 2, 32000, 5500, N'Liên tỉnh → Ngoại thành'),
(3, 3, 35000, 6000, N'Liên tỉnh → Liên tỉnh');
```

---

## Công thức tính phí vận chuyển

```
phi_van_chuyen = phi_co_ban + (trong_luong_kg × phi_theo_kg)
```

Ví dụ: Gửi 2.5 kg từ Nội thành → Liên tỉnh:
```
= 30,000 + (2.5 × 5,000) = 30,000 + 12,500 = 42,500 VND
```
