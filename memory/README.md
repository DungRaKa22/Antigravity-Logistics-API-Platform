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
| Database | SQL Server 2022 |
| Tính cước thông minh | OSRM (tính khoảng cách km) + Nominatim (geocoding) |
| API Testing | Postman |
| Version Control | Git + GitHub |

## 👥 Đối tượng sử dụng

1. **Khách hàng cá nhân** → Tạo đơn, tra cứu qua Web
2. **Đối tác (Sàn TMĐT)** → Tích hợp tự động qua RESTful API
3. **Nhân viên điều phối** → Quản lý qua trang Admin (Web)
4. **Quản trị viên** → Toàn quyền + quản lý users/partners (Web)
