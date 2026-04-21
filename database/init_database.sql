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

-- 1. Bảng Users (Quản lý Tài khoản Đa phân quyền)
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    FullName NVARCHAR(255) NOT NULL,
    Role VARCHAR(20) NOT NULL CHECK (Role IN ('SHOP', 'ADMIN', 'PARTNER')),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 2. Bảng AddressBook (Sổ địa chỉ thông minh)
CREATE TABLE AddressBook (
    AddressID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    ContactName NVARCHAR(255) NOT NULL,
    ContactPhone VARCHAR(20) NOT NULL,
    FullAddress NVARCHAR(500) NOT NULL,
    Latitude DECIMAL(10, 6),
    Longitude DECIMAL(10, 6),
    CONSTRAINT FK_AddressBook_Users FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);
GO

-- 3. Bảng Orders (Quản lý Vận đơn)
CREATE TABLE Orders (
    OrderID VARCHAR(50) PRIMARY KEY, -- Ví dụ: AG-883921
    Sender_UserID INT NOT NULL,
    ReceiverName NVARCHAR(255) NOT NULL,
    ReceiverPhone VARCHAR(20) NOT NULL,
    ReceiverAddress NVARCHAR(500) NOT NULL,
    WeightGram INT NOT NULL,
    DistanceKm DECIMAL(10, 2),
    ShippingFee DECIMAL(18, 2) NOT NULL,
    CodAmount DECIMAL(18, 2) NOT NULL DEFAULT 0,
    CurrentStatus VARCHAR(50) NOT NULL CHECK (CurrentStatus IN ('PENDING', 'PICKED_UP', 'DELIVERING', 'DELIVERED', 'RETURNED')),
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Orders_Sender FOREIGN KEY (Sender_UserID) REFERENCES Users(UserID)
);
GO

-- 4. Bảng TrackingHistory (Lịch sử Hành trình)
CREATE TABLE TrackingHistory (
    HistoryID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID VARCHAR(50) NOT NULL,
    StatusCode VARCHAR(50) NOT NULL CHECK (StatusCode IN ('PENDING', 'PICKED_UP', 'DELIVERING', 'DELIVERED', 'RETURNED')),
    LocationInfo NVARCHAR(500),
    UpdatedBy_AdminID INT NOT NULL,
    Timestamp DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_TrackingHistory_Orders FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
    CONSTRAINT FK_TrackingHistory_Admin FOREIGN KEY (UpdatedBy_AdminID) REFERENCES Users(UserID)
);
GO

-- 5. Bảng Reconciliations (Đối soát Tài chính COD)
CREATE TABLE Reconciliations (
    ReconID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID VARCHAR(50) NOT NULL UNIQUE,
    Shop_UserID INT NOT NULL,
    TotalCollected DECIMAL(18, 2) NOT NULL,
    FeeDeducted DECIMAL(18, 2) NOT NULL,
    FinalPayout DECIMAL(18, 2) NOT NULL,
    ReconStatus VARCHAR(50) NOT NULL CHECK (ReconStatus IN ('UNPAID', 'PAID')),
    CreatedAt DATETIME DEFAULT GETDATE(),
    ProcessedAt DATETIME,
    CONSTRAINT FK_Recon_Orders FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    CONSTRAINT FK_Recon_Shop FOREIGN KEY (Shop_UserID) REFERENCES Users(UserID)
);
GO

-- 6. Bảng ApiKeys (Quản lý Đối tác B2B)
CREATE TABLE ApiKeys (
    KeyID INT IDENTITY(1,1) PRIMARY KEY,
    Partner_UserID INT NOT NULL,
    ApiKeyString VARCHAR(64) NOT NULL UNIQUE,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_ApiKeys_Partner FOREIGN KEY (Partner_UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);
GO

-- CREATE INDEXES CHO TỐI ƯU HIỆU NĂNG
CREATE INDEX IX_Orders_Sender ON Orders(Sender_UserID);
CREATE INDEX IX_Orders_Status ON Orders(CurrentStatus);
CREATE INDEX IX_TrackingHistory_Order ON TrackingHistory(OrderID);
CREATE INDEX IX_Reconciliations_Status ON Reconciliations(ReconStatus);
GO
