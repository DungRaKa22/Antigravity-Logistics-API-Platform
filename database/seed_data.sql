-- ============================================================
-- LOGISTICS API PLATFORM - Seed Data Script
-- Ngày tạo: 2026-04-09
-- Mô tả: Chèn dữ liệu mẫu để phát triển và kiểm thử
-- Lưu ý: Chạy sau init_database.sql
-- ============================================================

USE LogisticsDB;
GO

-- ========================================
-- 1. DỮ LIỆU KHU VỰC (Areas)
-- ========================================
PRINT N'📍 Đang chèn dữ liệu khu vực...';

INSERT INTO Areas (area_name, province, area_code, zone) VALUES
-- Hà Nội - Nội thành (zone 1)
(N'Quận Hoàn Kiếm',    N'Hà Nội',              'HN01', 1),
(N'Quận Cầu Giấy',     N'Hà Nội',              'HN02', 1),
(N'Quận Ba Đình',       N'Hà Nội',             'HN03', 1),
(N'Quận Đống Đa',       N'Hà Nội',             'HN04', 1),
(N'Quận Hai Bà Trưng',  N'Hà Nội',             'HN05', 1),

-- Hà Nội - Ngoại thành (zone 2)
(N'Huyện Đông Anh',     N'Hà Nội',             'HN06', 2),
(N'Huyện Gia Lâm',      N'Hà Nội',             'HN07', 2),
(N'Huyện Thanh Trì',    N'Hà Nội',             'HN08', 2),

-- TP. Hồ Chí Minh - Nội thành (zone 1)
(N'Quận 1',             N'TP. Hồ Chí Minh',    'HCM01', 1),
(N'Quận 3',             N'TP. Hồ Chí Minh',    'HCM02', 1),
(N'Quận Bình Thạnh',    N'TP. Hồ Chí Minh',    'HCM03', 1),

-- TP. Hồ Chí Minh - Ngoại thành (zone 2)
(N'Quận Thủ Đức',       N'TP. Hồ Chí Minh',    'HCM04', 2),
(N'Huyện Bình Chánh',   N'TP. Hồ Chí Minh',    'HCM05', 2),

-- Liên tỉnh (zone 3)
(N'TP. Hải Dương',      N'Hải Dương',           'HD01', 3),
(N'TP. Chí Linh',       N'Hải Dương',           'HD02', 3),
(N'TP. Đà Nẵng',        N'Đà Nẵng',            'DN01', 3),
(N'TP. Huế',            N'Thừa Thiên Huế',     'HUE01', 3),
(N'TP. Nha Trang',      N'Khánh Hòa',          'KH01', 3),
(N'TP. Cần Thơ',        N'Cần Thơ',            'CT01', 3),
(N'TP. Hải Phòng',      N'Hải Phòng',          'HP01', 3);

PRINT N'✅ Đã chèn ' + CAST(@@ROWCOUNT AS NVARCHAR) + N' khu vực';
GO

-- ========================================
-- 2. DỮ LIỆU BẢNG GIÁ CƯỚC (ShippingRates)
-- ========================================
PRINT N'💰 Đang chèn bảng giá cước...';

INSERT INTO ShippingRates (from_zone, to_zone, base_fee, weight_fee_per_kg, max_weight_kg, description) VALUES
-- Nội thành → ...
(1, 1, 15000, 3000,  30, N'Nội thành → Nội thành'),
(1, 2, 20000, 4000,  30, N'Nội thành → Ngoại thành'),
(1, 3, 30000, 5000,  30, N'Nội thành → Liên tỉnh'),
-- Ngoại thành → ...
(2, 1, 20000, 4000,  30, N'Ngoại thành → Nội thành'),
(2, 2, 22000, 4500,  30, N'Ngoại thành → Ngoại thành'),
(2, 3, 32000, 5500,  30, N'Ngoại thành → Liên tỉnh'),
-- Liên tỉnh → ...
(3, 1, 30000, 5000,  30, N'Liên tỉnh → Nội thành'),
(3, 2, 32000, 5500,  30, N'Liên tỉnh → Ngoại thành'),
(3, 3, 35000, 6000,  30, N'Liên tỉnh → Liên tỉnh');

PRINT N'✅ Đã chèn ' + CAST(@@ROWCOUNT AS NVARCHAR) + N' mức giá cước';
GO

-- ========================================
-- 3. TÀI KHOẢN HỆ THỐNG (Users)
-- ========================================
-- Mật khẩu mặc định: "admin123" và "staff123" (đã hash bằng bcrypt)
-- Trong thực tế, hash sẽ được tạo bởi backend Python
PRINT N'👤 Đang tạo tài khoản hệ thống...';

INSERT INTO Users (full_name, email, password_hash, phone, address, role, api_key) VALUES
-- Admin
(N'Quản trị viên',
 'admin@logistics.local',
 '$2b$12$PLACEHOLDER_ADMIN_HASH_WILL_BE_UPDATED_BY_BACKEND',
 '0900000001',
 N'Trụ sở chính - Hà Nội',
 'ADMIN',
 'adm_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5'),

-- Staff 1
(N'Nguyễn Văn Điều Phối',
 'staff1@logistics.local',
 '$2b$12$PLACEHOLDER_STAFF_HASH_WILL_BE_UPDATED_BY_BACKEND',
 '0900000002',
 N'Chi nhánh Hà Nội',
 'STAFF',
 'stf_p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0'),

-- Staff 2
(N'Trần Thị Giao Hàng',
 'staff2@logistics.local',
 '$2b$12$PLACEHOLDER_STAFF_HASH_WILL_BE_UPDATED_BY_BACKEND',
 '0900000003',
 N'Chi nhánh TP.HCM',
 'STAFF',
 'stf_e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5'),

-- Demo Customer
(N'Nguyễn Văn Khách Hàng',
 'customer@demo.local',
 '$2b$12$PLACEHOLDER_CUSTOMER_HASH_WILL_BE_UPDATED_BY_BACKEND',
 '0912345678',
 N'Số 1, Hoàn Kiếm, Hà Nội',
 'CUSTOMER',
 'usr_t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0');

PRINT N'✅ Đã tạo ' + CAST(@@ROWCOUNT AS NVARCHAR) + N' tài khoản';
GO

-- ========================================
-- 4. ĐỐI TÁC MẪU (Partners)
-- ========================================
PRINT N'🤝 Đang tạo đối tác mẫu...';

INSERT INTO Partners (company_name, contact_email, contact_phone, api_key, webhook_url) VALUES
(N'Shop ABC - Sàn TMĐT',
 'api@shopabc.com',
 '0901234567',
 'ptn_x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5',
 'https://shopabc.com/webhook/shipping'),

(N'TechStore Online',
 'api@techstore.vn',
 '0908765432',
 'ptn_m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0',
 'https://techstore.vn/api/webhook');

PRINT N'✅ Đã tạo ' + CAST(@@ROWCOUNT AS NVARCHAR) + N' đối tác';
GO

-- ========================================
-- 5. ĐƠN HÀNG MẪU (Orders) + LỊCH SỬ TRẠNG THÁI
-- ========================================
PRINT N'📦 Đang tạo đơn hàng mẫu...';

-- Đơn 1: Khách hàng tạo, đã giao thành công
INSERT INTO Orders (tracking_code, user_id, sender_name, sender_phone, sender_address, sender_area_id,
    receiver_name, receiver_phone, receiver_address, receiver_area_id,
    weight_kg, item_description, shipping_fee, cod_amount, status, created_at)
VALUES
('HL20260407001', 4,
 N'Nguyễn Văn Khách Hàng', '0912345678', N'Số 1, Hoàn Kiếm, Hà Nội', 1,
 N'Trần Thị Bình', '0987654321', N'Số 50, TP Hải Dương', 14,
 2.5, N'Sách giáo khoa', 42500, 150000, 'DELIVERED', '2026-04-07 08:30:00');

-- Đơn 2: Đối tác tạo, đang vận chuyển
INSERT INTO Orders (tracking_code, partner_id, sender_name, sender_phone, sender_address, sender_area_id,
    receiver_name, receiver_phone, receiver_address, receiver_area_id,
    weight_kg, item_description, shipping_fee, cod_amount, status, created_at)
VALUES
('HL20260408001', 1,
 N'Kho Shop ABC', '0901234567', N'Kho hàng ABC, Cầu Giấy, HN', 2,
 N'Lê Văn Cường', '0933333333', N'Số 20, Quận 1, TP.HCM', 9,
 1.0, N'Áo thun size L', 35000, 250000, 'IN_TRANSIT', '2026-04-08 10:00:00');

-- Đơn 3: Khách tạo, chờ lấy hàng
INSERT INTO Orders (tracking_code, user_id, sender_name, sender_phone, sender_address, sender_area_id,
    receiver_name, receiver_phone, receiver_address, receiver_area_id,
    weight_kg, item_description, shipping_fee, cod_amount, status, notes, created_at)
VALUES
('HL20260409001', 4,
 N'Nguyễn Văn Khách Hàng', '0912345678', N'Số 1, Hoàn Kiếm, Hà Nội', 1,
 N'Phạm Thị Dung', '0945678901', N'Số 10, TP Đà Nẵng', 16,
 5.0, N'Đồ điện tử', 55000, 0, 'PENDING', N'Gọi trước khi giao', '2026-04-09 07:00:00');

-- Đơn 4: Đã hủy
INSERT INTO Orders (tracking_code, user_id, sender_name, sender_phone, sender_address, sender_area_id,
    receiver_name, receiver_phone, receiver_address, receiver_area_id,
    weight_kg, item_description, shipping_fee, cod_amount, status, created_at)
VALUES
('HL20260408002', 4,
 N'Nguyễn Văn Khách Hàng', '0912345678', N'Số 1, Hoàn Kiếm, Hà Nội', 1,
 N'Hoàng Văn Em', '0956789012', N'Huyện Đông Anh, Hà Nội', 6,
 0.5, N'Tài liệu hợp đồng', 17000, 0, 'CANCELLED', '2026-04-08 14:00:00');

PRINT N'✅ Đã tạo 4 đơn hàng mẫu';
GO

-- Lịch sử trạng thái cho Đơn 1 (PENDING → PICKED_UP → IN_TRANSIT → DELIVERED)
INSERT INTO OrderStatusHistory (order_id, old_status, new_status, changed_by, note, changed_at) VALUES
(1, NULL,          'PENDING',     NULL, N'Đơn hàng mới tạo',                    '2026-04-07 08:30:00'),
(1, 'PENDING',     'PICKED_UP',   2,   N'Đã lấy hàng tại Hoàn Kiếm',           '2026-04-07 10:00:00'),
(1, 'PICKED_UP',   'IN_TRANSIT',  2,   N'Đang vận chuyển đến Hải Dương',        '2026-04-07 14:00:00'),
(1, 'IN_TRANSIT',  'DELIVERED',   2,   N'Giao thành công, người nhận đã ký',    '2026-04-08 09:30:00');

-- Lịch sử trạng thái cho Đơn 2 (PENDING → PICKED_UP → IN_TRANSIT)
INSERT INTO OrderStatusHistory (order_id, old_status, new_status, changed_by, note, changed_at) VALUES
(2, NULL,          'PENDING',     NULL, N'Đơn từ đối tác Shop ABC',             '2026-04-08 10:00:00'),
(2, 'PENDING',     'PICKED_UP',   2,   N'Đã lấy hàng tại kho Cầu Giấy',       '2026-04-08 12:00:00'),
(2, 'PICKED_UP',   'IN_TRANSIT',  3,   N'Chuyển từ HN vào HCM, dự kiến 2 ngày','2026-04-08 16:00:00');

-- Lịch sử Đơn 3 (PENDING)
INSERT INTO OrderStatusHistory (order_id, old_status, new_status, changed_by, note, changed_at) VALUES
(3, NULL,          'PENDING',     NULL, N'Đơn hàng mới tạo, chờ lấy hàng',     '2026-04-09 07:00:00');

-- Lịch sử Đơn 4 (PENDING → CANCELLED)
INSERT INTO OrderStatusHistory (order_id, old_status, new_status, changed_by, note, changed_at) VALUES
(4, NULL,          'PENDING',     NULL, N'Đơn hàng mới tạo',                    '2026-04-08 14:00:00'),
(4, 'PENDING',     'CANCELLED',   2,   N'Khách yêu cầu hủy đơn',              '2026-04-08 15:00:00');

PRINT N'✅ Đã tạo lịch sử trạng thái cho tất cả đơn hàng';
GO

-- ========================================
-- 6. KIỂM TRA DỮ LIỆU
-- ========================================
PRINT N'';
PRINT N'========================================';
PRINT N'📊 THỐNG KÊ DỮ LIỆU SAU SEED:';
PRINT N'========================================';

SELECT 'Users' AS [Bảng], COUNT(*) AS [Số bản ghi] FROM Users
UNION ALL
SELECT 'Partners', COUNT(*) FROM Partners
UNION ALL
SELECT 'Areas', COUNT(*) FROM Areas
UNION ALL
SELECT 'ShippingRates', COUNT(*) FROM ShippingRates
UNION ALL
SELECT 'Orders', COUNT(*) FROM Orders
UNION ALL
SELECT 'OrderStatusHistory', COUNT(*) FROM OrderStatusHistory;

PRINT N'';
PRINT N'✅ Seed data hoàn tất! Database sẵn sàng cho phát triển.';
GO
