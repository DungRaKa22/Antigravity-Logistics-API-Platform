# 🏗️ Thiết kế kiến trúc hệ thống - Logistics API Platform

---

## Sơ đồ kiến trúc tổng thể (API-First Single Web)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT / PRESENTATION TIER                   │
│                                                                 │
│  ┌─────────────────────────────┐  ┌────────────────────────────┐│
│  │  🌐 Web App (SPA)          │  │  🔗 Partner Systems        ││
│  │  React + Vite + Tailwind CSS│  │  (Sàn TMĐT, 3rd Party)     ││
│  │  (Giao diện Dark-Neon Glass)│  │                            ││
│  │  👤 Guest: Tra cứu hành trình│  │  Gọi RESTful API           ││
│  │  🏪 Merchant: Quản lý đơn   │  │  M2M tự động.              ││
│  │  👨‍💼 Admin: Điều phối, Nhân  │  │  Nhận Webhook              ││
│  │       sự & Đối soát chuyên sâu│  │                            ││
│  │  🛵 Shipper: Cổng di động   │  │                            ││
│  │       (Lịch sử, Tài khoản,  │  │                            ││
│  │       Thông tin Ngân hàng)  │  │                            ││
│  └──────────┬──────────────────┘  └────────────┬───────────────┘│
│             │                                  │                │
└─────────────┼──────────────────────────────────┼────────────────┘
              │  HTTP/JSON (Axios)               │  HTTP/JSON
              │                                  │
┌─────────────┼──────────────────────────────────┼────────────────┐
│             ▼                                  ▼                │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              🐍 SERVICE TIER - Python API               │     │
│  │                      (Flask Web)                        │     │
│  │                                                         │     │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │     │
│  │  │  Auth   │ │ Address  │ │ Orders & │ │   Recon   │  │     │
│  │  │ Module  │ │ Book CRUD│ │ Tracking │ │ & Finance │  │     │
│  │  └─────────┘ └────┬─────┘ └──────────┘ └───────────┘  │     │
│  │                    │                                    │     │
│  │              ┌─────▼──────────────────────────────┐    │     │
│  │              │   🗺️ Dịch vụ Bản Đồ Số           │    │     │
│  │              │   • OSRM Router API                │    │     │
│  │              │   • Geocoding Nominatim (OSM)      │    │     │
│  │              └────────────────────────────────────┘    │     │
│  │                                                         │     │
│  │  ┌──────────────────────────────────────────────────┐  │     │
│  │  │           Middleware & Service Layer             │  │     │
│  │  │  • API Key Validation (B2B Header check)         │  │     │
│  │  │  • openpyxl & SheetJS Excel Engine               │  │     │
│  │  │  • Webhook Trigger (Khi đổi Status)              │  │     │
│  │  └──────────────────────────────────────────────────┘  │     │
│  └────────────────────────┬────────────────────────────────┘     │
│                           │                                      │
│              SERVICE TIER │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │  SQL Queries (SQLAlchemy ORM / psycopg2-binary)
                            │
                  ┌─────────▼─────────┐
                  │                   │  
                  │   📦 DATA TIER    │
                  │    PostgreSQL     │
                  │  (LogisticsDB)    │
                  │                   │
                  │  ┌─────────────────┐  │
                  │  │14 Tables Schema │  │
                  │  │- TongKho,       │  │
                  │  │  ChiNhanh,      │  │
                  │  │  NguoiDung      │  │
                  │  │- SoDiaChi,      │  │
                  │  │  GoiDichVu,     │  │
                  │  │  DonHang        │  │
                  │  │- LichSu_TrangThai│ │
                  │  │- DoiSoat,       │  │
                  │  │  HoaDonDoiSoat  │  │
                  │  │- KhoaAPI,       │  │
                  │  │  TinNhan,       │  │
                  │  │  ChamCong       │  │
                  │  │- KhieuNai       │  │
                  │  │- DangKyNhan-    │  │
                  │  │  ThongBao       │  │
                  │  └─────────────────┘  │
                  │                   │
                  └───────────────────┘
```

---

## Luồng dữ liệu mới (Nghiệp vụ cốt lõi & Nâng cấp)

### 1. Luồng Chủ Shop lập đơn hàng (Order Creation)
- Người dùng chọn địa chỉ gửi nhanh từ Sổ địa chỉ (hoặc để mặc định).
- Nhập địa chỉ nhận ➡️ Hệ thống gọi API OSRM tính km và ước tính cước phí thời gian thực.
- Nhập trọng lượng và kích thước D-R-C ➡️ Quy đổi trọng lượng quy đổi và tính toán phụ phí.
- Bấm Tạo đơn ➡️ Gửi POST lên `/api/orders/` ➡️ Lưu vào CSDL với mã vận đơn tự sinh (`AG-XXXXXX`). Tự động sinh mã vạch Code128 dạng hình ảnh SVG được nhúng trực tiếp vào Tem Vận đơn A6.

### 2. Luồng Tính cước phí thông minh
- Quy đổi trọng lượng thể tích: `TrongLuongQuyDoiGram = (D x R x C) / 5000`
- Trọng lượng tính cước: `TrongLuongTinhCuoc = max(TrongLuongGram, TrongLuongQuyDoiGram)`
- Dịch vụ: Lấy `GiaKhoiDiem` và `GiaMoiKm` của dịch vụ được chọn (Standard/Express).
- Khoảng cách: Lấy khoảng cách thực tế từ OSRM API (Fallback về 10.5 km nếu lỗi kết nối).
- `PhiVanChuyen = GiaKhoiDiem + (GiaMoiKm * (KhoangCachKm - 3.0)) + PhuPhiKhoiLuong` (2,000đ cho mỗi 1kg vượt mức).
- `PhiBaoHiem = GiaTriKhaiBao * 0.005` (nếu có khai báo giá trị).

### 3. Luồng Quản lý Nhân sự & Phân phối đơn hàng cho Shipper
- **Hạn ngạch đơn hàng**: Admin có quyền nâng/hạ hạn mức số lượng đơn hàng mà Shipper được phép ôm nhận giao trong ngày (`GioiHanDonNgay`).
- **Phân phối / Nhận đơn**: Khi đơn hàng ở trạng thái chờ điều phối, Admin phân công Shipper thực hiện giao hàng hoặc Shipper nhận đơn trên cổng di động. Hệ thống kiểm tra tổng lượng đơn Shipper đang ôm trong ngày hiện tại. Nếu vượt quá `GioiHanDonNgay`, yêu cầu giao sẽ bị chặn để tránh tình trạng quá tải.

### 4. Luồng Lương Shipper & Xuất báo cáo tài chính
- **Tính lương tự động**: Mỗi đơn hàng giao thành công (`GIAO_THANH_CONG`) ghi nhận công của Shipper với đơn giá cố định **3.000 VNĐ / đơn hoàn thành**.
- **Kết xuất Excel (.xlsx) thời gian thực**:
  - Tích hợp thư viện **SheetJS (xlsx)** trên giao diện React.
  - Bộ lọc thống kê động theo tháng thực tế (ví dụ: tháng này là tháng 5 thì hệ thống tự động lọc và báo cáo dữ liệu của tháng 4 trước đó làm mặc định, nhưng vẫn cho phép chọn tháng linh hoạt).
  - Bảng báo cáo chi tiết bao gồm: Mã Shipper, Họ & Tên, các cột ngày trong tháng (thống kê số đơn giao thành công cụ thể của từng ngày), Cột tổng đơn giao thất bại trong tháng, Tổng số đơn hoàn thành, và Tổng lương thực lĩnh (`TongLuong = TongDonThanhCong * 3000`).

### 5. Luồng Đối soát tài chính COD (Reconciliation)
- Đơn hàng giao thành công (`GIAO_THANH_CONG`) ➡️ Tự động kích hoạt tạo dòng đối soát `DoiSoat` ở trạng thái `CHUA_THANH_TOAN` (`UNPAID`).
- Doanh thu thực nhận của Shop: `ThucNhan = TienThuHoCOD - PhiVanChuyen - PhiBaoHiem`.
- Hệ thống hỗ trợ lập hóa đơn đối soát định kỳ (`HoaDonDoiSoat`) gom nhiều giao dịch đối soát của cùng một khách hàng để thanh toán một lượt.
- Quản trị viên (Kế toán) bấm nút "Thanh toán đối soát" trên Admin Dashboard để chuyển trạng thái sang `DA_THANH_TOAN` (`PAID`), ghi nhận ngày giờ xử lý và cập nhật dòng tiền.

---

## Giải pháp kỹ thuật & Cải tiến

- **Ứng dụng Web Single Page App (SPA)**: Xây dựng bằng React + Vite, tối ưu hóa các linh kiện và state giúp giao diện tải siêu tốc.
- **True 3D Volumetric Box Visualizer**: Mô hình hộp hàng 3D lập thể (`transform-style: preserve-3d`) sử dụng 3 thanh trượt Dài - Rộng - Cao co giãn động tại Trang chủ giúp khách hàng dễ hình dung bưu phẩm thực tế và tự tính cước thể tích tức thì.
- **Phong cách thiết kế Premium Dark-Neon Glassmorphism**: Không dùng giao diện trắng đơn điệu, toàn bộ trang web sử dụng tông màu tối sâu, kết hợp các thẻ mờ kính (backdrop-blur), viền neon lam-lục, và hiệu ứng ánh sáng gradient động mang lại trải nghiệm cực kỳ cao cấp.
- **Xác thực & Phân quyền**: Sử dụng token JWT (JSON Web Tokens) cho phiên làm việc của người dùng trên Web với cơ chế phân quyền nghiêm ngặt 8 vai trò.
- **Tương tác Option-based Chatbot & Socket.io CSKH Handover**: Khách hàng trò chuyện với **Quantum Guide Chatbot** lơ lửng tối chàm neon, hỗ trợ cây quyết định đa chặng, xem timeline bưu kiện phát sáng trực tuyến, và bấm kết nối Socket.io để CSKH chat trực tiếp Double-Pane.
- **Chứng nhận thực địa Shipper (Touch Signature & Proof Photo)**: Bưu tá giao đơn hàng thành công có thể cho khách vẽ chữ ký tay trực tiếp lên **Touch Signature Canvas** di động và bật giả lập **Proof Photo Camera** chụp ảnh xác thực bưu phẩm chặng cuối.
- **Tích hợp bản đồ & Chống chặn IP**: Kết hợp dịch vụ địa lý Nominatim Geocoding của OpenStreetMap và dịch vụ OSRM Router để lấy khoảng cách chính xác theo km đường đi thực tế. Áp dụng cơ chế **rate-limit protection ngủ trễ 1200ms** để chống bị Nominatim chặn từ chối dịch vụ. Có cơ chế fallback tự động về 10.5 km để hệ thống không bao giờ bị nghẽn.
- **Tem vận đơn thông minh**: In ấn tem nhãn khổ A6 chuẩn e-commerce tự sinh mã vạch trực quan, hỗ trợ thiết bị in nhiệt ngoại vi của chủ shop.
