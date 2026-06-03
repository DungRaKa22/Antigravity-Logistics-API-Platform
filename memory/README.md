# 📦 Logistics API Platform - Project Memory (Phase 6 Updated)

> **Hệ thống Quản lý Vận đơn, Định tuyến OSRM 5 điểm & Đối soát COD Tự động quy mô Doanh nghiệp - Thiết kế Dark-Neon Glassmorphic**

Chào mừng bạn đến với trung tâm lưu trữ tài liệu bộ nhớ kỹ thuật của dự án **Antigravity Express**. Bộ tài liệu này đã được đồng bộ hóa và cập nhật 100% sau khi hoàn thành xuất sắc **Giai Đoạn 6** (Premium Aesthetics, Quantum Guide Upgrades & Mobile Shipper & Kho).

---

## 📂 Danh Mục Hệ Thống Tài Liệu Memory

| Tài liệu (File Link) | Mô tả chi tiết nội dung | Trạng thái kỹ thuật |
| :--- | :--- | :--- |
| [README.md](./README.md) | Tổng quan cấu trúc thư mục, Tech Stack mới & RBAC tài khoản. | 🟢 Hoàn thành |
| [goals.md](./goals.md) | Các mục tiêu kinh doanh, nghiệp vụ và nghiệm thu kỹ thuật. | 🟢 Hoàn thành |
| [implementation_plan.md](./implementation_plan.md) | Lộ trình thực hiện chi tiết từ Phase 1 đến Phase 6. | 🟢 Hoàn thành |
| [architecture.md](./architecture.md) | Kiến trúc 3 lớp, thiết kế WebSockets, SSE và sơ đồ định tuyến OSRM. | 🟢 Hoàn thành |
| [database_schema.md](./database_schema.md) | Đặc tả 14 bảng cơ sở dữ liệu PostgreSQL Việt hóa tối ưu hóa index. | 🟢 Hoàn thành |
| [api_endpoints.md](./api_endpoints.md) | Danh mục thiết kế API Endpoints thực tế chặng cuối. | 🟢 Hoàn thành |
| [frontend_requirements.md](./frontend_requirements.md) | Yêu cầu thiết kế giao diện Dark-Neon và responsive di động. | 🟢 Hoàn thành |
| [progress.md](./progress.md) | 📊 Bảng theo dõi tiến độ chi tiết & Nhật ký thay đổi (Changelog). | 🟢 Hoàn thành |
| [notes.md](./notes.md) | Ghi chú vận hành local, xử lý Nominatim rate-limit và thông tin tài khoản. | 🟢 Hoàn thành |

---

## 🎯 Tóm Tắt Dự Án Mới Nhất

*   **Tên nền tảng:** Antigravity Express Enterprise Logistics Platform.
*   **Kiến trúc:** API-First, Client-Server, 3-Tier Architecture.
*   **Quy mô phân hệ:** Hỗ trợ phân quyền RBAC chặt chẽ cho **8 nhóm vai trò nghiệp vụ** (Admin, CSKH, Kế toán, HR, Quản lý kho, Shipper, Merchant, Retail).
*   **Trạng thái tổng thể:** 🟢 Hoàn thành xuất sắc Giai Đoạn 6 trên môi trường Local, sẵn sàng vận hành ổn định.

---

## 🛠️ Tech Stack Kỹ Thuật Thực Tế

| Tầng (Layer) | Công nghệ sử dụng | Chi tiết vai trò |
| :--- | :--- | :--- |
| **Frontend Web** | React 19, Vite 8, Tailwind CSS v4 | Thiết kế **Premium Dark-Neon Glassmorphic** lôi cuốn. Tích hợp mô phỏng hộp hàng 3D CSS tương tác co giãn, camera chụp bằng chứng chặng cuối và Signature Canvas cho khách hàng ký nhận trực tiếp. |
| **Backend API** | Python 3.13 (Flask) | Cung cấp hệ thống RESTful API an toàn, tích hợp **Flask-SocketIO** chat realtime, luồng background Server-Sent Events (SSE) đẩy thông báo và openpyxl parser Excel. |
| **Database** | PostgreSQL | Hệ quản trị cơ sở dữ liệu chính thức, lưu trữ dữ liệu thông qua **14 bảng nghiệp vụ Việt hóa hoàn toàn**. Sử dụng SQLAlchemy làm ORM kết nối. |
| **Định vị & Bản đồ** | OSRM API + Nominatim (OSM) | Trích xuất tọa độ địa lý và đo đạc khoảng cách thực tế. Áp dụng cơ chế bảo vệ Nominatim rate-limit trễ `1200ms` giữa các lượt geocoding. |
| **Bảo mật & Auth** | JWT & API Key (B2B) | Cơ chế Bearer Token phân quyền RBAC an toàn và API Key 64 ký tự dành riêng cho Đối tác B2B. |

---

## 👥 Đối tượng & Phân quyền Sử dụng (RBAC)

1.  **Khách hàng (Merchant/Retail):**
    *   Tạo đơn lẻ (tự động tính cước OSRM) hoặc tạo đơn hàng loạt bằng Excel.
    *   Đăng ký Web Push hành trình bưu phẩm. Tra cứu định vị Timeline phát sáng trực tiếp trong chatbot Quantum Guide.
2.  **Nhân viên Bưu Tá (Shipper):**
    *   Nhận đơn được gán tại chi nhánh, ôm đơn giao hàng, cập nhật vị trí thời gian thực.
    *   Cho khách ký xác nhận bằng chữ ký số cảm ứng (Signature Canvas) và chụp ảnh camera thực địa.
3.  **Nhân viên CSKH (Customer Service):**
    *   Giao diện chat hai chiều thời gian thực Double-Pane hỗ trợ giải quyết khiếu nại của khách hàng, đính kèm hình ảnh và liên thông dữ liệu đơn.
4.  **Hành chính Kế toán (Accountant):**
    *   Sao kê đối soát dòng tiền COD bưu tá, tính lương tự động (Cơ bản + thưởng doanh số), xuất tệp Excel bằng SheetJS.
5.  **Quản lý Nhân sự (HR Manager):**
    *   Kiểm soát chấm công điện tử nhân viên bưu cục, điều chỉnh quotas hạn mức ôm đơn Shipper hàng ngày.
6.  **Super Admin (Quản trị tối cao):**
    *   Giám sát doanh thu vùng miền bento grid, bổ nhiệm điều động nhân viên vào các Chi nhánh/Tổng kho liên kết, kiểm soát logs hoạt động toàn hệ thống.

---

Bộ tài liệu memory này đóng vai trò là xương sống thông tin cho toàn bộ vòng đời vận hành và bảo trì của Antigravity Express!