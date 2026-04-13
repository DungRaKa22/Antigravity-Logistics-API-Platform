# 📦 Logistics API Platform - Project Memory

> **Nghiên cứu và xây dựng Nền tảng Dịch vụ Vận chuyển theo mô hình API-First**

## 📂 Cấu trúc thư mục Memory

| File | Mô tả |
|---|---|
| [README.md](./README.md) | Tổng quan dự án (file này) |
| [goals.md](./goals.md) | Mục tiêu chi tiết từng giai đoạn |
| [implementation_plan.md](./implementation_plan.md) | Kế hoạch triển khai chi tiết |
| [architecture.md](./architecture.md) | Thiết kế kiến trúc hệ thống |
| [database_schema.md](./database_schema.md) | Thiết kế cơ sở dữ liệu |
| [api_endpoints.md](./api_endpoints.md) | Thiết kế API Endpoints |
| [progress.md](./progress.md) | 📊 Theo dõi tiến độ thực hiện |
| [notes.md](./notes.md) | Ghi chú, vấn đề phát sinh |

## 🎯 Tóm tắt dự án

- **Loại**: Đồ án tốt nghiệp / Dự án thực hành
- **Mô hình**: API-First, Client-Server, 3-Tier Architecture
- **Ngày bắt đầu**: 2026-04-07
- **Trạng thái**: 🟢 Phase 1 hoàn thành — Đang triển khai Phase 2

## 🛠️ Tech Stack

| Layer | Công nghệ |
|---|---|
| Backend API | Python (Flask) |
| Frontend Web | HTML / CSS / JavaScript (Vanilla) + Alpine.js |
| Desktop App | Java Swing |
| Database | SQL Server 2022 |
| Tính cước thông minh | OSRM (tính khoảng cách km) + Nominatim (geocoding) |
| API Testing | Postman |
| Version Control | Git |

## 👥 Đối tượng sử dụng

1. **Khách hàng cá nhân** → Tạo đơn thủ công qua Web Portal
2. **Đối tác (Sàn TMĐT)** → Tích hợp tự động qua RESTful API
3. **Nhân viên điều phối** → Quản lý qua Desktop App (Java Swing)
