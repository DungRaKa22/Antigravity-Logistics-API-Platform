USE master;
GO

IF DB_ID('LogisticsDB') IS NOT NULL
BEGIN
    ALTER DATABASE LogisticsDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE LogisticsDB;
END
GO

CREATE DATABASE LogisticsDB;
GO

USE LogisticsDB;
GO

-- 1. Bảng NguoiDung (Quản lý Tài khoản Đa phân quyền)
CREATE TABLE NguoiDung (
    MaNguoiDung INT IDENTITY(1,1) PRIMARY KEY,
    TenDangNhap VARCHAR(100) NOT NULL UNIQUE,
    MatKhau VARCHAR(255) NOT NULL,
    HoTen NVARCHAR(255) NOT NULL,
    VaiTro VARCHAR(20) NOT NULL CHECK (VaiTro IN ('KHACHHANG', 'QUANTRI', 'DOITAC')),
    SoTaiKhoan VARCHAR(50) NULL,
    TenNganHang NVARCHAR(100) NULL,
    ChuTaiKhoan NVARCHAR(100) NULL,
    NgayTao DATETIME DEFAULT GETDATE()
);
GO

-- 2. Bảng SoDiaChi (Sổ địa chỉ thông minh)
CREATE TABLE SoDiaChi (
    MaDiaChi INT IDENTITY(1,1) PRIMARY KEY,
    MaNguoiDung INT NOT NULL,
    TenLienHe NVARCHAR(255) NOT NULL,
    SoDienThoai VARCHAR(20) NOT NULL,
    DiaChiChiTiet NVARCHAR(500) NOT NULL,
    ViDo DECIMAL(10, 6),
    KinhDo DECIMAL(10, 6),
    CONSTRAINT FK_SoDiaChi_NguoiDung FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung) ON DELETE CASCADE
);
GO

-- 3. Bảng GoiDichVu (Danh mục các gói dịch vụ giao hàng)
CREATE TABLE GoiDichVu (
    MaGoi INT IDENTITY(1,1) PRIMARY KEY,
    TenGoi VARCHAR(50) NOT NULL, -- Ví dụ: STANDARD, EXPRESS
    GiaKhoiDiem DECIMAL(18, 2) NOT NULL,
    GiaMoiKm DECIMAL(18, 2) NOT NULL
);
GO

-- 4. Bảng DonHang (Quản lý Vận đơn)
CREATE TABLE DonHang (
    MaDonHang VARCHAR(50) PRIMARY KEY, -- Ví dụ: AG-883921
    MaNguoiGui INT NOT NULL,
    MaGoi INT NOT NULL,
    TenNguoiNhan NVARCHAR(255) NOT NULL,
    SoDienThoaiNhan VARCHAR(20) NOT NULL,
    DiaChiNhan NVARCHAR(500) NOT NULL,
    
    -- Kích thước & Khối lượng
    TrongLuongGram INT NOT NULL,
    ChieuDaiCM INT NULL,
    ChieuRongCM INT NULL,
    ChieuCaoCM INT NULL,
    TrongLuongQuyDoiGram INT NULL,
    
    -- Hàng hóa & Bảo hiểm
    MoTaHangHoa NVARCHAR(500) NOT NULL,
    GiaTriKhaiBao DECIMAL(18, 2) NOT NULL DEFAULT 0,
    PhiBaoHiem DECIMAL(18, 2) NOT NULL DEFAULT 0,
    
    -- Phí vận chuyển
    KhoangCachKm DECIMAL(10, 2),
    PhiVanChuyen DECIMAL(18, 2) NOT NULL,
    TienThuHoCOD DECIMAL(18, 2) NOT NULL DEFAULT 0,
    
    -- Cờ nghiệp vụ
    QuyenKiemTra VARCHAR(50) NOT NULL DEFAULT 'KHONG_XEM' CHECK (QuyenKiemTra IN ('KHONG_XEM', 'XEM_KHONG_THU', 'THU_HANG')),
    GiaoMotPhan BIT NOT NULL DEFAULT 0,
    HinhThucLayHang VARCHAR(50) NOT NULL DEFAULT 'TU_MANG_RA_BUU_CUC' CHECK (HinhThucLayHang IN ('TU_MANG_RA_BUU_CUC', 'NHAN_VIEN_DEN_LAY')),
    
    TrangThaiHienTai VARCHAR(50) NOT NULL CHECK (TrangThaiHienTai IN ('CHO_LAY_HANG', 'DA_LAY_HANG', 'DANG_VAN_CHUYEN', 'GIAO_THANH_CONG', 'DA_HUY', 'HOAN_TRA')),
    NgayTao DATETIME DEFAULT GETDATE(),
    
    CONSTRAINT FK_DonHang_NguoiGui FOREIGN KEY (MaNguoiGui) REFERENCES NguoiDung(MaNguoiDung),
    CONSTRAINT FK_DonHang_GoiDichVu FOREIGN KEY (MaGoi) REFERENCES GoiDichVu(MaGoi)
);
GO

-- 5. Bảng LichSu_TrangThai (Lịch sử Hành trình)
CREATE TABLE LichSu_TrangThai (
    MaLichSu INT IDENTITY(1,1) PRIMARY KEY,
    MaDonHang VARCHAR(50) NOT NULL,
    MaTrangThai VARCHAR(50) NOT NULL CHECK (MaTrangThai IN ('CHO_LAY_HANG', 'DA_LAY_HANG', 'DANG_VAN_CHUYEN', 'GIAO_THANH_CONG', 'DA_HUY', 'HOAN_TRA')),
    ThongTinViTri NVARCHAR(500),
    MaNhanVienCapNhat INT NOT NULL,
    ThoiGian DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_LichSu_DonHang FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang) ON DELETE CASCADE,
    CONSTRAINT FK_LichSu_NhanVien FOREIGN KEY (MaNhanVienCapNhat) REFERENCES NguoiDung(MaNguoiDung)
);
GO

-- 6. Bảng DoiSoat (Đối soát Tài chính COD)
CREATE TABLE DoiSoat (
    MaDoiSoat INT IDENTITY(1,1) PRIMARY KEY,
    MaDonHang VARCHAR(50) NOT NULL UNIQUE,
    MaKhachHang INT NOT NULL,
    TongTienThu DECIMAL(18, 2) NOT NULL,
    PhiVanChuyenTru DECIMAL(18, 2) NOT NULL,
    PhiBaoHiemTru DECIMAL(18, 2) NOT NULL DEFAULT 0,
    PhiHoanTraTru DECIMAL(18, 2) NOT NULL DEFAULT 0,
    PhiGiaoMotPhanTru DECIMAL(18, 2) NOT NULL DEFAULT 0,
    ThucNhan DECIMAL(18, 2) NOT NULL,
    TrangThaiDoiSoat VARCHAR(50) NOT NULL CHECK (TrangThaiDoiSoat IN ('CHUA_THANH_TOAN', 'DA_THANH_TOAN')),
    NgayTao DATETIME DEFAULT GETDATE(),
    NgayXuLy DATETIME,
    CONSTRAINT FK_DoiSoat_DonHang FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang),
    CONSTRAINT FK_DoiSoat_KhachHang FOREIGN KEY (MaKhachHang) REFERENCES NguoiDung(MaNguoiDung)
);
GO

-- 7. Bảng KhoaAPI (Quản lý Đối tác B2B)
CREATE TABLE KhoaAPI (
    MaKhoa INT IDENTITY(1,1) PRIMARY KEY,
    MaDoiTac INT NOT NULL,
    ChuoiKhoaAPI VARCHAR(64) NOT NULL UNIQUE,
    TrangThaiHoatDong BIT DEFAULT 1,
    NgayTao DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_KhoaAPI_DoiTac FOREIGN KEY (MaDoiTac) REFERENCES NguoiDung(MaNguoiDung) ON DELETE CASCADE
);
GO

-- CREATE INDEXES CHO TỐI ƯU HIỆU NĂNG
CREATE INDEX IX_DonHang_NguoiGui ON DonHang(MaNguoiGui);
CREATE INDEX IX_DonHang_TrangThai ON DonHang(TrangThaiHienTai);
CREATE INDEX IX_LichSu_DonHang ON LichSu_TrangThai(MaDonHang);
CREATE INDEX IX_DoiSoat_TrangThai ON DoiSoat(TrangThaiDoiSoat);
GO
