# 📦 Logistics API Platform - Project Memory

> **Nền tảng Dịch vụ Vận chuyển tích hợp Bản đồ và Tính toán Cước phí Thời gian thực theo mô hình API-First**

---

## 📂 Cấu trúc thư mục Memory

| File | Mô tả | Trạng thái |
|---|---|---|
| [README.md](./README.md) | Tổng quan dự án, Tech Stack & Trạng thái | 🟢 Hoàn thành |
| [goals.md](./goals.md) | Mục tiêu chi tiết và trạng thái nghiệm thu tính năng | 🟢 Hoàn thành |
| [implementation_plan.md](./implementation_plan.md) | Kế hoạch và các chặng phát triển thực tế | 🟢 Hoàn thành |
| [architecture.md](./architecture.md) | Kiến trúc 3 lớp, luồng dữ liệu & giải pháp kĩ thuật | 🟢 Hoàn thành |
| [database_schema.md](./database_schema.md) | Schema chi tiết 7 bảng cơ sở dữ liệu đã Việt hóa | 🟢 Hoàn thành |
| [api_endpoints.md](./api_endpoints.md) | Danh mục thiết kế API Endpoints thực tế | 🟢 Hoàn thành |
| [frontend_requirements.md](./frontend_requirements.md) | Yêu cầu nghiệp vụ & Giao diện người dùng Merchant | 🟢 Hoàn thành |
| [progress.md](./progress.md) | 📊 Theo dõi tiến độ chi tiết & Nhật ký phát triển | 🟢 Hoàn thành |
| [notes.md](./notes.md) | Ghi chú kĩ thuật, cơ chế fallback & lưu ý vận hành | 🟢 Hoàn thành |

---

## 🎯 Tóm tắt dự án

- **Loại hình**: Hệ thống quản lý vận đơn và đối soát tài chính
- **Kiến trúc**: API-First, Client-Server, 3-Tier Architecture
- **Quy mô phân hệ**: Hỗ trợ 3 nhóm đối tượng qua cơ chế RBAC (Khách hàng, Nhân viên, Quản trị)
- **Trạng thái**: 🟢 Hoàn thành toàn diện Phase 5 (Hệ thống đã triển khai, kiểm thử và vận hành mượt mà)

---

## 🛠️ Tech Stack thực tế

| Tầng (Layer) | Công nghệ sử dụng | Chi tiết vai trò |
|---|---|---|
| **Frontend Web** | React 18, Vite, Tailwind CSS | Single Page Application (SPA), sử dụng thư viện **Lucide React** cho hệ thống biểu tượng, thiết kế Uber-Style tối giản đen-trắng sang trọng. |
| **Backend API** | Python 3.11+ (Flask) | Cung cấp hệ thống RESTful API an toàn, xử lý nghiệp vụ đối soát, parsing Excel và xử lý background task. |
| **Database** | SQL Server 2022 / SQLite | Cơ sở dữ liệu quan hệ lưu trữ dữ liệu với **7 bảng nghiệp vụ Việt hóa hoàn toàn**. Sử dụng SQLAlchemy làm ORM. |
| **Định vị & Bản đồ** | OSRM API + Nominatim (OSM) | Trích xuất khoảng cách km thực tế từ kinh độ/vĩ độ (Geocoding) để tính toán cước phí tự động. |
| **Bảo mật & Auth** | JWT (JSON Web Tokens) | Cơ chế Bearer Token cho Web Client và API Key (B2B) bảo mật cho Partner. |

---

## 👥 Đối tượng & Phân quyền Sử dụng (RBAC)

1. **Khách hàng (`KHACHHANG`)**:
   - Chủ shop/doanh nghiệp sử dụng Merchant Portal.
   - Quản lý sổ địa chỉ (thiết lập địa chỉ mặc định).
   - Tạo đơn lẻ (tính cước thời gian thực) hoặc tải hàng loạt từ Excel.
   - Xem sao kê đối soát tài chính (`DoiSoat`).
2. **Nhân viên (`NHANVIEN`)**:
   - Cập nhật lịch trình vận đơn, tiếp nhận hàng tại bưu cục.
3. **Quản trị viên (`QUANTRI`)**:
   - Điều phối tổng, duyệt sao kê tài chính COD (`UNPAID` ➡️ `PAID`).
   - Cấp phát API Key cho các Đối tác (`DOITAC`) tích hợp B2B.
