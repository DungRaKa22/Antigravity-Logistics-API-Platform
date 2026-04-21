USE LogisticsDB;
GO

PRINT N'Bắt đầu nạp dữ liệu mẫu (Seed Data)...';

-- 1. Xóa dữ liệu cũ (Xóa tuần tự từ bảng con đến bảng cha để tránh lỗi Khóa ngoại)
DELETE FROM ApiKeys;
DELETE FROM Reconciliations;
DELETE FROM TrackingHistory;
DELETE FROM Orders;
DELETE FROM AddressBook;
DELETE FROM Users;
GO

-- ==========================================================
-- 2. Dữ liệu bảng Users (Đa phân quyền: SHOP, ADMIN, PARTNER)
-- ==========================================================
-- Ghi chú: PasswordHash mặc định lấy 'hashed_123456' để mô phỏng.
INSERT INTO Users (Username, PasswordHash, FullName, Role) VALUES 
('admin_tong', 'hashed_123456', N'Quản trị viên Hệ thống', 'ADMIN'),        -- User 1
('shop_sneaker', 'hashed_123456', N'Cửa hàng Giày Sneaker X', 'SHOP'),      -- User 2
('shop_quanao', 'hashed_123456', N'Tiệm Quần Áo Thu Đông', 'SHOP'),         -- User 3
('shopee_partner', 'hashed_123456', N'Đối tác Sàn TMĐT Shopee', 'PARTNER'); -- User 4
GO

-- ==========================================================
-- 3. Dữ liệu bảng AddressBook (Sổ địa chỉ thông minh của Shop)
-- ==========================================================
-- Dành cho Shop 2 và Shop 3
INSERT INTO AddressBook (UserID, ContactName, ContactPhone, FullAddress, Latitude, Longitude) VALUES 
(2, N'Nguyễn Văn Trọng', '0987654321', N'Số 10, Duy Tân, Cầu Giấy, Hà Nội', 21.031535, 105.782012),
(2, N'Lê Thị Hương', '0912345678', N'Tòa nhà Landmark 81, Bình Thạnh, TP.HCM', 10.794611, 106.721497),
(3, N'Trần Minh Khang', '0933333333', N'Số 5, Lê Lợi, Quận 1, TP.HCM', 10.776632, 106.703273);
GO

-- ==========================================================
-- 4. Dữ liệu bảng Orders (Quản lý Vận đơn)
-- ==========================================================
-- OrderID do API tự gen dạng VARCHAR (ví dụ: AG-xxxxxx)
INSERT INTO Orders (OrderID, Sender_UserID, ReceiverName, ReceiverPhone, ReceiverAddress, WeightGram, DistanceKm, ShippingFee, CodAmount, CurrentStatus, CreatedAt) VALUES 
('AG-10001', 2, N'Nguyễn Văn Trọng', '0987654321', N'Số 10, Duy Tân, Cầu Giấy, Hà Nội', 1500, 5.5, 25000, 550000, 'DELIVERED', DATEADD(hour, -24, GETDATE())),
('AG-10002', 2, N'Lê Thị Hương', '0912345678', N'Tòa nhà Landmark 81, Bình Thạnh, TP.HCM', 2000, 1150.0, 45000, 1200000, 'DELIVERING', DATEADD(hour, -48, GETDATE())),
('AG-10003', 3, N'Trần Minh Khang', '0933333333', N'Số 5, Lê Lợi, Quận 1, TP.HCM', 500, 3.2, 16000, 200000, 'PENDING', GETDATE()),
('AG-10004', 4, N'Phạm Băng Băng', '0999999999', N'KĐT Ecopark, Văn Giang, Hưng Yên', 3000, 18.5, 30000, 0, 'PICKED_UP', DATEADD(hour, -5, GETDATE()));
GO

-- ==========================================================
-- 5. Dữ liệu bảng TrackingHistory (Lịch trình Vận đơn)
-- ==========================================================
-- Tracking liên tục được sinh ra khi ADMIN (User 1) đổi trạng thái
INSERT INTO TrackingHistory (OrderID, StatusCode, LocationInfo, UpdatedBy_AdminID, Timestamp) VALUES 
-- Hành trình của đơn AG-10001 (Đã giao thành công)
('AG-10001', 'PENDING', N'Hệ thống tiếp nhận thông tin khởi tạo', 1, DATEADD(hour, -24, GETDATE())),
('AG-10001', 'PICKED_UP', N'Bưu tá đã lấy hàng tại Cầu Giấy', 1, DATEADD(hour, -20, GETDATE())),
('AG-10001', 'DELIVERING', N'Đang giao hàng đến người nhận', 1, DATEADD(hour, -10, GETDATE())),
('AG-10001', 'DELIVERED', N'Khách đã thanh toán và nhận hàng', 1, DATEADD(hour, -2, GETDATE())),

-- Hành trình của đơn AG-10002 (Đang vận chuyển)
('AG-10002', 'PENDING', N'Đơn hàng mới tạo qua Web', 1, DATEADD(day, -2, GETDATE())),
('AG-10002', 'PICKED_UP', N'Đã nhập kho HUB tổng miền Bắc', 1, DATEADD(day, -1, GETDATE())),
('AG-10002', 'DELIVERING', N'Hàng đang cập bến tuyến bay TP.HCM', 1, GETDATE()),

-- Hành trình của đơn AG-10004 (Được tạo bởi Partner)
('AG-10004', 'PENDING', N'Sàn TMĐT tạo đơn tự động qua API', 1, DATEADD(hour, -5, GETDATE())),
('AG-10004', 'PICKED_UP', N'Nhân viên lấy hàng tại kho đối tác', 1, DATEADD(hour, -1, GETDATE()));
GO

-- ==========================================================
-- 6. Dữ liệu bảng Reconciliations (Đối soát Tiền thu hộ COD)
-- ==========================================================
-- Dành cho các đơn DELIVERED (Đơn AG-10001 của Shop_UserID 2)
-- COD thu hộ: 550.000, Cước FeeDeducted: 25.000 -> FinalPayout (Shop nhận) = 525.000
INSERT INTO Reconciliations (OrderID, Shop_UserID, TotalCollected, FeeDeducted, FinalPayout, ReconStatus, CreatedAt) VALUES 
('AG-10001', 2, 550000.00, 25000.00, 525000.00, 'UNPAID', GETDATE());
GO

-- ==========================================================
-- 7. Dữ liệu bảng ApiKeys (Mã bảo mật M2M)
-- ==========================================================
-- Dành riêng cho PARTNER (UserID 4)
INSERT INTO ApiKeys (Partner_UserID, ApiKeyString, IsActive, CreatedAt) VALUES 
(4, 'AG_PARTNER_X9F8E7D6C5B4A3920112233445566778899AABBCCDDEEFF', 1, GETDATE());
GO

PRINT N'Hoàn tất nạp dữ liệu mẫu thành công!';
GO
