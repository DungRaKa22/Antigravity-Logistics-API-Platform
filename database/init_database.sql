-- ============================================================
-- LOGISTICS API PLATFORM - Database Initialization Script
-- Hệ thống: SQL Server
-- Ngày tạo: 2026-04-09
-- Mô tả: Tạo database và tất cả các bảng theo thiết kế schema
-- ============================================================

-- ========================================
-- 1. TẠO DATABASE
-- ========================================
USE master;
GO

-- Xóa database cũ nếu tồn tại (CHỈ DÙNG KHI PHÁT TRIỂN)
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
-- 2. BẢNG USERS (Người dùng)
-- ========================================
-- Lưu thông tin tài khoản khách hàng và nhân viên
CREATE TABLE Users (
    id              INT PRIMARY KEY IDENTITY(1,1),
    full_name       NVARCHAR(100)   NOT NULL,
    email           VARCHAR(150)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    phone           VARCHAR(20)     NULL,
    address         NVARCHAR(500)   NULL,
    role            VARCHAR(20)     NOT NULL DEFAULT 'CUSTOMER',
    api_key         VARCHAR(64)     UNIQUE,
    is_active       BIT             DEFAULT 1,
    created_at      DATETIME        DEFAULT GETDATE(),
    updated_at      DATETIME        DEFAULT GETDATE(),

    -- Ràng buộc giá trị role
    CONSTRAINT CK_Users_Role CHECK (role IN ('CUSTOMER', 'STAFF', 'ADMIN'))
);
GO

-- Index tìm kiếm theo email và API Key
CREATE NONCLUSTERED INDEX IX_Users_Email ON Users(email);
CREATE NONCLUSTERED INDEX IX_Users_ApiKey ON Users(api_key) WHERE api_key IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_Users_Role ON Users(role);
GO

-- ========================================
-- 3. BẢNG PARTNERS (Đối tác)
-- ========================================
-- Lưu thông tin các hệ thống đối tác (sàn TMĐT) tích hợp API
CREATE TABLE Partners (
    id              INT PRIMARY KEY IDENTITY(1,1),
    company_name    NVARCHAR(200)   NOT NULL,
    contact_email   VARCHAR(150)    NOT NULL UNIQUE,
    contact_phone   VARCHAR(20)     NULL,
    api_key         VARCHAR(64)     NOT NULL UNIQUE,
    webhook_url     VARCHAR(500)    NULL,
    is_active       BIT             DEFAULT 1,
    created_at      DATETIME        DEFAULT GETDATE()
);
GO

CREATE NONCLUSTERED INDEX IX_Partners_ApiKey ON Partners(api_key);
GO

-- ========================================
-- 4. BẢNG AREAS (Khu vực)
-- ========================================
-- Danh mục khu vực giao hàng, dùng để tính phí cước
CREATE TABLE Areas (
    id          INT PRIMARY KEY IDENTITY(1,1),
    area_name   NVARCHAR(100)   NOT NULL,
    province    NVARCHAR(100)   NOT NULL,
    area_code   VARCHAR(10)     UNIQUE,
    zone        INT             NOT NULL,

    -- Zone: 1 = Nội thành, 2 = Ngoại thành, 3 = Liên tỉnh
    CONSTRAINT CK_Areas_Zone CHECK (zone IN (1, 2, 3))
);
GO

CREATE NONCLUSTERED INDEX IX_Areas_Zone ON Areas(zone);
CREATE NONCLUSTERED INDEX IX_Areas_Province ON Areas(province);
GO

-- ========================================
-- 5. BẢNG SHIPPING RATES (Bảng giá cước)
-- ========================================
-- Quy tắc tính phí dựa trên vùng gửi - vùng nhận và trọng lượng
CREATE TABLE ShippingRates (
    id                  INT PRIMARY KEY IDENTITY(1,1),
    from_zone           INT             NOT NULL,
    to_zone             INT             NOT NULL,
    base_fee            DECIMAL(12,2)   NOT NULL,
    weight_fee_per_kg   DECIMAL(12,2)   NOT NULL,
    max_weight_kg       DECIMAL(5,2)    DEFAULT 30,
    description         NVARCHAR(200)   NULL,
    is_active           BIT             DEFAULT 1,

    CONSTRAINT CK_ShippingRates_FromZone CHECK (from_zone IN (1, 2, 3)),
    CONSTRAINT CK_ShippingRates_ToZone CHECK (to_zone IN (1, 2, 3)),
    CONSTRAINT CK_ShippingRates_BaseFee CHECK (base_fee >= 0),
    CONSTRAINT CK_ShippingRates_WeightFee CHECK (weight_fee_per_kg >= 0),
    CONSTRAINT UQ_ShippingRates_Zone UNIQUE (from_zone, to_zone)
);
GO

-- ========================================
-- 6. BẢNG ORDERS (Đơn hàng / Vận đơn)
-- ========================================
-- Bảng chính lưu thông tin vận đơn
CREATE TABLE Orders (
    id                  INT PRIMARY KEY IDENTITY(1,1),
    tracking_code       VARCHAR(20)     NOT NULL UNIQUE,
    user_id             INT             NULL,
    partner_id          INT             NULL,
    sender_name         NVARCHAR(100)   NOT NULL,
    sender_phone        VARCHAR(20)     NOT NULL,
    sender_address      NVARCHAR(500)   NOT NULL,
    sender_area_id      INT             NULL,
    receiver_name       NVARCHAR(100)   NOT NULL,
    receiver_phone      VARCHAR(20)     NOT NULL,
    receiver_address    NVARCHAR(500)   NOT NULL,
    receiver_area_id    INT             NULL,
    weight_kg           DECIMAL(5,2)    NOT NULL,
    item_description    NVARCHAR(500)   NULL,
    shipping_fee        DECIMAL(12,2)   NOT NULL,
    cod_amount          DECIMAL(12,2)   DEFAULT 0,
    status              VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
    notes               NVARCHAR(500)   NULL,
    created_at          DATETIME        DEFAULT GETDATE(),
    updated_at          DATETIME        DEFAULT GETDATE(),

    -- Foreign Keys
    CONSTRAINT FK_Orders_User FOREIGN KEY (user_id) REFERENCES Users(id),
    CONSTRAINT FK_Orders_Partner FOREIGN KEY (partner_id) REFERENCES Partners(id),
    CONSTRAINT FK_Orders_SenderArea FOREIGN KEY (sender_area_id) REFERENCES Areas(id),
    CONSTRAINT FK_Orders_ReceiverArea FOREIGN KEY (receiver_area_id) REFERENCES Areas(id),

    -- Ràng buộc
    CONSTRAINT CK_Orders_Status CHECK (status IN (
        'PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'RETURNED'
    )),
    CONSTRAINT CK_Orders_Weight CHECK (weight_kg > 0),
    CONSTRAINT CK_Orders_ShippingFee CHECK (shipping_fee >= 0),
    CONSTRAINT CK_Orders_CodAmount CHECK (cod_amount >= 0)
);
GO

-- Indexes cho tìm kiếm và lọc
CREATE NONCLUSTERED INDEX IX_Orders_TrackingCode ON Orders(tracking_code);
CREATE NONCLUSTERED INDEX IX_Orders_UserId ON Orders(user_id) WHERE user_id IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_Orders_PartnerId ON Orders(partner_id) WHERE partner_id IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_Orders_Status ON Orders(status);
CREATE NONCLUSTERED INDEX IX_Orders_CreatedAt ON Orders(created_at DESC);
GO

-- ========================================
-- 7. BẢNG ORDER STATUS HISTORY (Lịch sử trạng thái)
-- ========================================
-- Ghi lại timeline thay đổi trạng thái của mỗi đơn hàng
CREATE TABLE OrderStatusHistory (
    id              INT PRIMARY KEY IDENTITY(1,1),
    order_id        INT             NOT NULL,
    old_status      VARCHAR(20)     NULL,
    new_status      VARCHAR(20)     NOT NULL,
    changed_by      INT             NULL,
    note            NVARCHAR(300)   NULL,
    changed_at      DATETIME        DEFAULT GETDATE(),

    -- Foreign Keys
    CONSTRAINT FK_OrderHistory_Order FOREIGN KEY (order_id) REFERENCES Orders(id),
    CONSTRAINT FK_OrderHistory_User FOREIGN KEY (changed_by) REFERENCES Users(id),

    -- Ràng buộc
    CONSTRAINT CK_OrderHistory_NewStatus CHECK (new_status IN (
        'PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'RETURNED'
    ))
);
GO

CREATE NONCLUSTERED INDEX IX_OrderHistory_OrderId ON OrderStatusHistory(order_id);
CREATE NONCLUSTERED INDEX IX_OrderHistory_ChangedAt ON OrderStatusHistory(changed_at DESC);
GO

-- ========================================
-- 8. TRIGGER: Tự động cập nhật updated_at cho Orders
-- ========================================
CREATE TRIGGER TR_Orders_UpdatedAt
ON Orders
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Orders
    SET updated_at = GETDATE()
    FROM Orders o
    INNER JOIN inserted i ON o.id = i.id;
END
GO

-- ========================================
-- 9. TRIGGER: Tự động cập nhật updated_at cho Users
-- ========================================
CREATE TRIGGER TR_Users_UpdatedAt
ON Users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Users
    SET updated_at = GETDATE()
    FROM Users u
    INNER JOIN inserted i ON u.id = i.id;
END
GO

-- ========================================
-- 10. STORED PROCEDURE: Tạo mã tracking code
-- ========================================
-- Format: HL + YYYYMMDD + 3 chữ số tự tăng (VD: HL20260409001)
CREATE PROCEDURE SP_GenerateTrackingCode
    @tracking_code VARCHAR(20) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @today VARCHAR(8) = FORMAT(GETDATE(), 'yyyyMMdd');
    DECLARE @prefix VARCHAR(10) = 'HL' + @today;
    DECLARE @max_seq INT;
    
    -- Tìm số thứ tự lớn nhất trong ngày
    SELECT @max_seq = ISNULL(MAX(
        CAST(RIGHT(tracking_code, 3) AS INT)
    ), 0)
    FROM Orders
    WHERE tracking_code LIKE @prefix + '%';
    
    -- Tạo tracking code mới
    SET @tracking_code = @prefix + RIGHT('000' + CAST(@max_seq + 1 AS VARCHAR), 3);
END
GO

PRINT N'✅ Database LogisticsDB đã được tạo thành công!';
PRINT N'✅ Tất cả 6 bảng, indexes, triggers và stored procedures đã sẵn sàng.';
GO
