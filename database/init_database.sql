-- ============================================================
-- NỀN TẢNG DỊCH VỤ VẬN CHUYỂN (LOGISTICS API PLATFORM)
-- Tệp:     init_database.sql
-- Hệ thống: SQL Server 2022
-- Ngày tạo: 2026-04-09
-- Cập nhật: 2026-04-10
-- Mô tả:   Tạo cơ sở dữ liệu và tất cả các bảng theo thiết kế
-- ============================================================

-- ========================================
-- 1. TẠO CƠ SỞ DỮ LIỆU
-- ========================================
USE master;
GO

-- Xóa cơ sở dữ liệu cũ nếu tồn tại (CHỈ DÙNG KHI PHÁT TRIỂN)
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'LogisticsDB')
BEGIN
    ALTER DATABASE LogisticsDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE LogisticsDB;
END
GO

CREATE DATABASE LogisticsDB
COLLATE Vietnamese_CI_AS;
GO

USE LogisticsDB;
GO

-- ========================================
-- 2. BẢNG NGUOIDUNG (Người dùng)
-- Lưu thông tin tài khoản khách hàng và nhân viên
-- ========================================
CREATE TABLE NguoiDung (
    ma_nguoi_dung   INT PRIMARY KEY IDENTITY(1,1),  -- Mã người dùng (tự tăng)
    ho_ten          NVARCHAR(100)   NOT NULL,        -- Họ và tên
    email           VARCHAR(150)    NOT NULL UNIQUE,  -- Email đăng nhập
    mat_khau_hash   VARCHAR(255)    NOT NULL,         -- Mật khẩu đã mã hóa (bcrypt)
    so_dien_thoai   VARCHAR(20)     NULL,             -- Số điện thoại
    dia_chi         NVARCHAR(500)   NULL,             -- Địa chỉ
    vai_tro         VARCHAR(20)     NOT NULL DEFAULT 'KHACHHANG', -- Vai trò: KHACHHANG, NHANVIEN, QUANTRI
    api_key         VARCHAR(64)     UNIQUE,           -- Khóa API cho xác thực
    trang_thai      BIT             DEFAULT 1,        -- Trạng thái hoạt động (1=Hoạt động, 0=Khóa)
    ngay_tao        DATETIME        DEFAULT GETDATE(),-- Ngày tạo tài khoản
    ngay_cap_nhat   DATETIME        DEFAULT GETDATE(),-- Ngày cập nhật gần nhất

    -- Ràng buộc giá trị vai trò
    CONSTRAINT CK_NguoiDung_VaiTro CHECK (vai_tro IN ('KHACHHANG', 'NHANVIEN', 'QUANTRI'))
);
GO

-- Chỉ mục tìm kiếm theo email, API Key, vai trò
CREATE NONCLUSTERED INDEX IX_NguoiDung_Email ON NguoiDung(email);
CREATE NONCLUSTERED INDEX IX_NguoiDung_ApiKey ON NguoiDung(api_key);
CREATE NONCLUSTERED INDEX IX_NguoiDung_VaiTro ON NguoiDung(vai_tro);
GO

-- ========================================
-- 3. BẢNG DOITAC (Đối tác)
-- Lưu thông tin các hệ thống đối tác (sàn TMĐT) tích hợp API
-- ========================================
CREATE TABLE DoiTac (
    ma_doi_tac      INT PRIMARY KEY IDENTITY(1,1),  -- Mã đối tác (tự tăng)
    ten_cong_ty     NVARCHAR(200)   NOT NULL,        -- Tên công ty / hệ thống
    email_lien_he   VARCHAR(150)    NOT NULL UNIQUE,  -- Email liên hệ
    sdt_lien_he     VARCHAR(20)     NULL,             -- Số điện thoại liên hệ
    api_key         VARCHAR(64)     NOT NULL UNIQUE,  -- Khóa API được cấp
    webhook_url     VARCHAR(500)    NULL,             -- URL callback khi cập nhật trạng thái
    trang_thai      BIT             DEFAULT 1,        -- Trạng thái (1=Hoạt động)
    ngay_dang_ky    DATETIME        DEFAULT GETDATE() -- Ngày đăng ký
);
GO

CREATE NONCLUSTERED INDEX IX_DoiTac_ApiKey ON DoiTac(api_key);
GO

-- ========================================
-- 4. BẢNG KHUVUC (Khu vực)
-- Danh mục khu vực giao hàng, dùng để tính phí cước
-- ========================================
CREATE TABLE KhuVuc (
    ma_khu_vuc      INT PRIMARY KEY IDENTITY(1,1),  -- Mã khu vực (tự tăng)
    ten_khu_vuc     NVARCHAR(100)   NOT NULL,        -- Tên khu vực (VD: Quận Hoàn Kiếm)
    tinh_thanh      NVARCHAR(100)   NOT NULL,        -- Tỉnh / Thành phố
    ma_vung         VARCHAR(10)     UNIQUE,           -- Mã vùng (VD: HN01, HCM02)
    loai_vung       INT             NOT NULL,         -- Loại vùng: 1=Nội thành, 2=Ngoại thành, 3=Liên tỉnh

    -- Ràng buộc giá trị loại vùng
    CONSTRAINT CK_KhuVuc_LoaiVung CHECK (loai_vung IN (1, 2, 3))
);
GO

CREATE NONCLUSTERED INDEX IX_KhuVuc_LoaiVung ON KhuVuc(loai_vung);
CREATE NONCLUSTERED INDEX IX_KhuVuc_TinhThanh ON KhuVuc(tinh_thanh);
GO

-- ========================================
-- 5. BẢNG BANGGIA (Bảng giá cước)
-- Quy tắc tính phí dựa trên vùng gửi - vùng nhận và trọng lượng
-- Công thức: phi_van_chuyen = phi_co_ban + (trong_luong_kg × phi_theo_kg)
-- ========================================
CREATE TABLE BangGia (
    ma_gia_cuoc     INT PRIMARY KEY IDENTITY(1,1),  -- Mã giá cước (tự tăng)
    vung_gui        INT             NOT NULL,        -- Vùng gửi (1, 2 hoặc 3)
    vung_nhan       INT             NOT NULL,        -- Vùng nhận (1, 2 hoặc 3)
    phi_co_ban      DECIMAL(12,2)   NOT NULL,        -- Phí cơ bản (VND)
    phi_theo_kg     DECIMAL(12,2)   NOT NULL,        -- Phí theo kg (VND/kg)
    trong_luong_toi_da DECIMAL(5,2) DEFAULT 30,      -- Trọng lượng tối đa (kg)
    mo_ta           NVARCHAR(200)   NULL,             -- Ghi chú / Mô tả
    trang_thai      BIT             DEFAULT 1,        -- Còn áp dụng (1=Có)

    -- Ràng buộc
    CONSTRAINT CK_BangGia_VungGui CHECK (vung_gui IN (1, 2, 3)),
    CONSTRAINT CK_BangGia_VungNhan CHECK (vung_nhan IN (1, 2, 3)),
    CONSTRAINT CK_BangGia_PhiCoBan CHECK (phi_co_ban >= 0),
    CONSTRAINT CK_BangGia_PhiTheoKg CHECK (phi_theo_kg >= 0),
    CONSTRAINT UQ_BangGia_Vung UNIQUE (vung_gui, vung_nhan)
);
GO

-- ========================================
-- 6. BẢNG DONHANG (Đơn hàng / Vận đơn)
-- Bảng chính lưu thông tin vận đơn
-- ========================================
CREATE TABLE DonHang (
    ma_don_hang     INT PRIMARY KEY IDENTITY(1,1),  -- Mã đơn hàng (tự tăng)
    ma_van_don      VARCHAR(20)     NOT NULL UNIQUE, -- Mã vận đơn (VD: HL20260409001)
    ma_nguoi_dung   INT             NULL,            -- Khách hàng tạo đơn (FK)
    ma_doi_tac      INT             NULL,            -- Đối tác tạo đơn (FK, nếu có)

    -- Thông tin người gửi
    ten_nguoi_gui       NVARCHAR(100)   NOT NULL,    -- Tên người gửi
    sdt_nguoi_gui       VARCHAR(20)     NOT NULL,    -- SĐT người gửi
    diachi_nguoi_gui    NVARCHAR(500)   NOT NULL,    -- Địa chỉ người gửi
    ma_khuvuc_gui       INT             NULL,        -- Khu vực gửi (FK)

    -- Thông tin người nhận
    ten_nguoi_nhan      NVARCHAR(100)   NOT NULL,    -- Tên người nhận
    sdt_nguoi_nhan      VARCHAR(20)     NOT NULL,    -- SĐT người nhận
    diachi_nguoi_nhan   NVARCHAR(500)   NOT NULL,    -- Địa chỉ người nhận
    ma_khuvuc_nhan      INT             NULL,        -- Khu vực nhận (FK)

    -- Thông tin hàng hóa & phí
    trong_luong_kg      DECIMAL(5,2)    NOT NULL,    -- Trọng lượng (kg)
    mo_ta_hang_hoa      NVARCHAR(500)   NULL,        -- Mô tả hàng hóa
    phi_van_chuyen      DECIMAL(12,2)   NOT NULL,    -- Phí vận chuyển (VND)
    tien_thu_ho         DECIMAL(12,2)   DEFAULT 0,   -- Tiền thu hộ COD (VND)
    trang_thai          VARCHAR(20)     NOT NULL DEFAULT 'CHO_LAY_HANG', -- Trạng thái đơn
    ghi_chu             NVARCHAR(500)   NULL,        -- Ghi chú thêm

    -- Thời gian
    ngay_tao            DATETIME        DEFAULT GETDATE(), -- Ngày tạo đơn
    ngay_cap_nhat       DATETIME        DEFAULT GETDATE(), -- Ngày cập nhật gần nhất

    -- Khóa ngoại
    CONSTRAINT FK_DonHang_NguoiDung FOREIGN KEY (ma_nguoi_dung) REFERENCES NguoiDung(ma_nguoi_dung),
    CONSTRAINT FK_DonHang_DoiTac FOREIGN KEY (ma_doi_tac) REFERENCES DoiTac(ma_doi_tac),
    CONSTRAINT FK_DonHang_KhuVucGui FOREIGN KEY (ma_khuvuc_gui) REFERENCES KhuVuc(ma_khu_vuc),
    CONSTRAINT FK_DonHang_KhuVucNhan FOREIGN KEY (ma_khuvuc_nhan) REFERENCES KhuVuc(ma_khu_vuc),

    -- Ràng buộc giá trị
    CONSTRAINT CK_DonHang_TrangThai CHECK (trang_thai IN (
        'CHO_LAY_HANG', 'DA_LAY_HANG', 'DANG_VAN_CHUYEN', 'GIAO_THANH_CONG', 'DA_HUY', 'HOAN_TRA'
    )),
    CONSTRAINT CK_DonHang_TrongLuong CHECK (trong_luong_kg > 0),
    CONSTRAINT CK_DonHang_PhiVanChuyen CHECK (phi_van_chuyen >= 0),
    CONSTRAINT CK_DonHang_TienThuHo CHECK (tien_thu_ho >= 0)
);
GO

-- Chỉ mục cho tìm kiếm và lọc
CREATE NONCLUSTERED INDEX IX_DonHang_MaVanDon ON DonHang(ma_van_don);
CREATE NONCLUSTERED INDEX IX_DonHang_NguoiDung ON DonHang(ma_nguoi_dung);
CREATE NONCLUSTERED INDEX IX_DonHang_DoiTac ON DonHang(ma_doi_tac);
CREATE NONCLUSTERED INDEX IX_DonHang_TrangThai ON DonHang(trang_thai);
CREATE NONCLUSTERED INDEX IX_DonHang_NgayTao ON DonHang(ngay_tao DESC);
GO

-- ========================================
-- 7. BẢNG LICHSU_TRANGTHAI (Lịch sử trạng thái)
-- Ghi lại dòng thời gian thay đổi trạng thái của mỗi đơn hàng
-- ========================================
CREATE TABLE LichSu_TrangThai (
    ma_lich_su      INT PRIMARY KEY IDENTITY(1,1),  -- Mã lịch sử (tự tăng)
    ma_don_hang     INT             NOT NULL,        -- Đơn hàng liên quan (FK)
    trang_thai_cu   VARCHAR(20)     NULL,            -- Trạng thái trước đó
    trang_thai_moi  VARCHAR(20)     NOT NULL,        -- Trạng thái mới
    nguoi_thay_doi  INT             NULL,            -- Người thay đổi (FK → NguoiDung)
    ghi_chu         NVARCHAR(300)   NULL,            -- Ghi chú kèm theo
    thoi_gian       DATETIME        DEFAULT GETDATE(),-- Thời điểm thay đổi

    -- Khóa ngoại
    CONSTRAINT FK_LichSu_DonHang FOREIGN KEY (ma_don_hang) REFERENCES DonHang(ma_don_hang),
    CONSTRAINT FK_LichSu_NguoiDung FOREIGN KEY (nguoi_thay_doi) REFERENCES NguoiDung(ma_nguoi_dung),

    -- Ràng buộc
    CONSTRAINT CK_LichSu_TrangThaiMoi CHECK (trang_thai_moi IN (
        'CHO_LAY_HANG', 'DA_LAY_HANG', 'DANG_VAN_CHUYEN', 'GIAO_THANH_CONG', 'DA_HUY', 'HOAN_TRA'
    ))
);
GO

CREATE NONCLUSTERED INDEX IX_LichSu_DonHang ON LichSu_TrangThai(ma_don_hang);
CREATE NONCLUSTERED INDEX IX_LichSu_ThoiGian ON LichSu_TrangThai(thoi_gian DESC);
GO

-- ========================================
-- 8. TRIGGER: Tự động cập nhật ngày sửa cho bảng DonHang
-- ========================================
CREATE TRIGGER TR_DonHang_CapNhat
ON DonHang
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE DonHang
    SET ngay_cap_nhat = GETDATE()
    FROM DonHang dh
    INNER JOIN inserted i ON dh.ma_don_hang = i.ma_don_hang;
END
GO

-- ========================================
-- 9. TRIGGER: Tự động cập nhật ngày sửa cho bảng NguoiDung
-- ========================================
CREATE TRIGGER TR_NguoiDung_CapNhat
ON NguoiDung
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE NguoiDung
    SET ngay_cap_nhat = GETDATE()
    FROM NguoiDung nd
    INNER JOIN inserted i ON nd.ma_nguoi_dung = i.ma_nguoi_dung;
END
GO

-- ========================================
-- 10. THỦ TỤC: Tạo mã vận đơn tự động
-- Định dạng: HL + YYYYMMDD + 3 chữ số tự tăng (VD: HL20260409001)
-- ========================================
CREATE PROCEDURE SP_TaoMaVanDon
    @ma_van_don VARCHAR(20) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ngay_hom_nay VARCHAR(8) = FORMAT(GETDATE(), 'yyyyMMdd');
    DECLARE @tien_to VARCHAR(10) = 'HL' + @ngay_hom_nay;
    DECLARE @so_thu_tu_lon_nhat INT;
    
    -- Tìm số thứ tự lớn nhất trong ngày
    SELECT @so_thu_tu_lon_nhat = ISNULL(MAX(
        CAST(RIGHT(ma_van_don, 3) AS INT)
    ), 0)
    FROM DonHang
    WHERE ma_van_don LIKE @tien_to + '%';
    
    -- Tạo mã vận đơn mới
    SET @ma_van_don = @tien_to + RIGHT('000' + CAST(@so_thu_tu_lon_nhat + 1 AS VARCHAR), 3);
END
GO

PRINT N'✅ Cơ sở dữ liệu LogisticsDB đã được tạo thành công!';
PRINT N'✅ Tất cả 6 bảng, chỉ mục, trigger và thủ tục lưu trữ đã sẵn sàng.';
GO
