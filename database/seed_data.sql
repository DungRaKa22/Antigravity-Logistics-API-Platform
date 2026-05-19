USE LogisticsDB;
GO

PRINT N'Bắt đầu nạp dữ liệu mẫu (Seed Data) - Phiên bản Việt hóa & Nghiệp vụ nâng cao...';

-- 1. Xóa dữ liệu cũ (Xóa tuần tự từ bảng con đến bảng cha)
DELETE FROM KhoaAPI;
DELETE FROM DoiSoat;
DELETE FROM LichSu_TrangThai;
DELETE FROM DonHang;
DELETE FROM GoiDichVu;
DELETE FROM SoDiaChi;
DELETE FROM NguoiDung;
GO

-- ==========================================================
-- 2. Dữ liệu bảng NguoiDung (KHACHHANG, QUANTRI, DOITAC)
-- ==========================================================
INSERT INTO NguoiDung (TenDangNhap, MatKhau, HoTen, VaiTro, SoTaiKhoan, TenNganHang, ChuTaiKhoan) VALUES 
('admin_tong', 'hashed_123456', N'Quản trị viên Hệ thống', 'QUANTRI', NULL, NULL, NULL),
('shop_sneaker', 'hashed_123456', N'Cửa hàng Giày Sneaker X', 'KHACHHANG', '123456789', N'Vietcombank', N'NGUYEN VAN A'),
('shop_quanao', 'hashed_123456', N'Tiệm Quần Áo Thu Đông', 'KHACHHANG', '987654321', N'Techcombank', N'LE THI B'),
('shopee_partner', 'hashed_123456', N'Đối tác Sàn TMĐT Shopee', 'DOITAC', NULL, NULL, NULL);
GO

-- ==========================================================
-- 3. Dữ liệu bảng SoDiaChi
-- ==========================================================
INSERT INTO SoDiaChi (MaNguoiDung, TenLienHe, SoDienThoai, DiaChiChiTiet, ViDo, KinhDo) VALUES 
(2, N'Nguyễn Văn Trọng', '0987654321', N'Số 10, Duy Tân, Cầu Giấy, Hà Nội', 21.031535, 105.782012),
(2, N'Lê Thị Hương', '0912345678', N'Tòa nhà Landmark 81, Bình Thạnh, TP.HCM', 10.794611, 106.721497),
(3, N'Trần Minh Khang', '0933333333', N'Số 5, Lê Lợi, Quận 1, TP.HCM', 10.776632, 106.703273);
GO

-- ==========================================================
-- 4. Dữ liệu bảng GoiDichVu
-- ==========================================================
INSERT INTO GoiDichVu (TenGoi, GiaKhoiDiem, GiaMoiKm) VALUES 
('STANDARD', 15000, 2000),
('EXPRESS', 30000, 5000);
GO

-- ==========================================================
-- 5. Dữ liệu bảng DonHang
-- ==========================================================
-- Giả định MaGoi 1 = STANDARD, 2 = EXPRESS
INSERT INTO DonHang (MaDonHang, MaNguoiGui, MaGoi, TenNguoiNhan, SoDienThoaiNhan, DiaChiNhan, TrongLuongGram, ChieuDaiCM, ChieuRongCM, ChieuCaoCM, TrongLuongQuyDoiGram, MoTaHangHoa, GiaTriKhaiBao, PhiBaoHiem, KhoangCachKm, PhiVanChuyen, TienThuHoCOD, QuyenKiemTra, GiaoMotPhan, HinhThucLayHang, TrangThaiHienTai, NgayTao) VALUES 
('AG-10001', 2, 1, N'Nguyễn Văn Trọng', '0987654321', N'Số 10, Duy Tân, Cầu Giấy, Hà Nội', 1500, 20, 20, 10, 800, N'Giày Sneaker Nam Size 42', 500000, 2500, 5.5, 25000, 550000, 'XEM_KHONG_THU', 0, 'TU_MANG_RA_BUU_CUC', 'GIAO_THANH_CONG', DATEADD(hour, -24, GETDATE())),
('AG-10002', 2, 2, N'Lê Thị Hương', '0912345678', N'Tòa nhà Landmark 81, Bình Thạnh, TP.HCM', 2000, 30, 20, 20, 2400, N'Combo 3 đôi giày cao gót', 1200000, 6000, 1150.0, 45000, 1200000, 'THU_HANG', 1, 'NHAN_VIEN_DEN_LAY', 'DANG_VAN_CHUYEN', DATEADD(hour, -48, GETDATE())),
('AG-10003', 3, 1, N'Trần Minh Khang', '0933333333', N'Số 5, Lê Lợi, Quận 1, TP.HCM', 500, 10, 10, 5, 100, N'Áo khoác gió Thu Đông', 200000, 1000, 3.2, 16000, 200000, 'KHONG_XEM', 0, 'TU_MANG_RA_BUU_CUC', 'CHO_LAY_HANG', GETDATE()),
('AG-10004', 4, 1, N'Phạm Băng Băng', '0999999999', N'KĐT Ecopark, Văn Giang, Hưng Yên', 3000, 40, 30, 20, 4800, N'Thùng hàng đối tác Shopee', 0, 0, 18.5, 30000, 0, 'XEM_KHONG_THU', 0, 'NHAN_VIEN_DEN_LAY', 'DA_LAY_HANG', DATEADD(hour, -5, GETDATE()));
GO

-- ==========================================================
-- 6. Dữ liệu bảng LichSu_TrangThai
-- ==========================================================
INSERT INTO LichSu_TrangThai (MaDonHang, MaTrangThai, ThongTinViTri, MaNhanVienCapNhat, ThoiGian) VALUES 
('AG-10001', 'CHO_LAY_HANG', N'Hệ thống tiếp nhận thông tin khởi tạo', 1, DATEADD(hour, -24, GETDATE())),
('AG-10001', 'DA_LAY_HANG', N'Bưu tá đã lấy hàng tại Cầu Giấy', 1, DATEADD(hour, -20, GETDATE())),
('AG-10001', 'DANG_VAN_CHUYEN', N'Đang giao hàng đến người nhận', 1, DATEADD(hour, -10, GETDATE())),
('AG-10001', 'GIAO_THANH_CONG', N'Khách đã thanh toán và nhận hàng', 1, DATEADD(hour, -2, GETDATE())),

('AG-10002', 'CHO_LAY_HANG', N'Đơn hàng mới tạo qua Web', 1, DATEADD(day, -2, GETDATE())),
('AG-10002', 'DA_LAY_HANG', N'Đã nhập kho HUB tổng miền Bắc', 1, DATEADD(day, -1, GETDATE())),
('AG-10002', 'DANG_VAN_CHUYEN', N'Hàng đang cập bến tuyến bay TP.HCM', 1, GETDATE()),

('AG-10004', 'CHO_LAY_HANG', N'Sàn TMĐT tạo đơn tự động qua API', 1, DATEADD(hour, -5, GETDATE())),
('AG-10004', 'DA_LAY_HANG', N'Nhân viên lấy hàng tại kho đối tác', 1, DATEADD(hour, -1, GETDATE()));
GO

-- ==========================================================
-- 7. Dữ liệu bảng DoiSoat
-- ==========================================================
INSERT INTO DoiSoat (MaDonHang, MaKhachHang, TongTienThu, PhiVanChuyenTru, PhiBaoHiemTru, PhiHoanTraTru, PhiGiaoMotPhanTru, ThucNhan, TrangThaiDoiSoat, NgayTao) VALUES 
('AG-10001', 2, 550000.00, 25000.00, 2500.00, 0, 0, 522500.00, 'CHUA_THANH_TOAN', GETDATE());
GO

-- ==========================================================
-- 8. Dữ liệu bảng KhoaAPI
-- ==========================================================
INSERT INTO KhoaAPI (MaDoiTac, ChuoiKhoaAPI, TrangThaiHoatDong, NgayTao) VALUES 
(4, 'AG_PARTNER_X9F8E7D6C5B4A3920112233445566778899AABBCCDDEEFF', 1, GETDATE());
GO

PRINT N'Hoàn tất nạp dữ liệu mẫu thành công!';
GO
