# 🎯 Mục tiêu dự án - Logistics API Platform

> Tài liệu mô tả chi tiết mục tiêu từng giai đoạn và tiêu chí hoàn thành.

---

## Mục tiêu tổng thể

Xây dựng một **hệ sinh thái vận chuyển khép kín** theo mô hình **API-First**, bao gồm:
- Một Backend API trung tâm xử lý toàn bộ nghiệp vụ logistics
- Một **Web App toàn diện** phục vụ cả khách hàng, nhân viên và quản trị viên
- RESTful API mở cho các hệ thống đối tác tích hợp
- Tính cước thông minh bằng OSRM (Open Source Routing Machine)

---

## Giai đoạn 1: Nền tảng & Cơ sở dữ liệu (Tuần 1-2) ✅

### Mục tiêu
- [x] Thiết kế hoàn chỉnh Database Schema trên SQL Server
- [x] Tạo các bảng dữ liệu: NguoiDung, DonHang, BangGia, LichSu_TrangThai, DoiTac, KhuVuc
- [x] Chèn dữ liệu mẫu (seed data) cho bảng khu vực, bảng cước phí
- [x] Thiết lập môi trường phát triển (Python, SQL Server)

### Tiêu chí hoàn thành (Definition of Done)
- ✅ Database chạy được trên SQL Server, có đầy đủ bảng và quan hệ
- ✅ Có script khởi tạo DB (`init_database.sql`)
- ✅ Kết nối thành công từ Python đến SQL Server

---

## Giai đoạn 2: Backend API Core (Tuần 3-5)

### Mục tiêu
- [ ] Khởi tạo dự án Python (Flask)
- [ ] Xây dựng module xác thực (Authentication) - API Key
- [ ] Tích hợp OSRM + Nominatim cho tính cước theo khoảng cách
- [ ] API Tính phí vận chuyển (`POST /api/shipping/calculate`) — OSRM + fallback zone
- [ ] API Tạo vận đơn (`POST /api/orders`)
- [ ] API Tra cứu vận đơn (`GET /api/orders/{tracking_code}`)
- [ ] API Cập nhật trạng thái (`PUT /api/orders/{id}/status`)
- [ ] API Danh sách đơn hàng (`GET /api/orders`)
- [ ] API Quản lý tài khoản đối tác (`POST /api/partners/register`)
- [ ] API Quản trị (`GET /api/admin/dashboard`, quản lý users, rates)
- [ ] Xử lý lỗi (Error Handling) và validation đầu vào
- [ ] Viết tài liệu API (Swagger/OpenAPI hoặc Markdown)

### Tiêu chí hoàn thành
- ✅ Tất cả API endpoints hoạt động và test được qua Postman
- ✅ Xác thực API Key hoạt động chính xác
- ✅ Phân quyền API theo vai trò (KHACHHANG/NHANVIEN/QUANTRI)
- ✅ OSRM tính khoảng cách chính xác, fallback zone hoạt động khi OSRM lỗi
- ✅ Trả về đúng format JSON với status code phù hợp
- ✅ Có tài liệu API rõ ràng

---

## Giai đoạn 3: Web App toàn diện (Tuần 6-8)

> Gộp quản lý vào Web — không còn Desktop Java.

### Mục tiêu — Trang khách hàng
- [ ] Tạo CSS Design System (variables, components, layout responsive)
- [ ] Setup Alpine.js (CDN) + SPA hash-based router + route guard
- [ ] Thiết kế giao diện web responsive (HTML/CSS + Alpine.js)
- [ ] Trang đăng ký / đăng nhập (chung cho tất cả vai trò)
- [ ] Trang tính phí vận chuyển (OSRM + fallback zone, realtime)
- [ ] Trang tạo đơn hàng mới (form phức tạp + validation)
- [ ] Trang tra cứu vận đơn (nhập mã → timeline trạng thái)
- [ ] Trang lịch sử đơn hàng cá nhân (bảng + bộ lọc + phân trang)

### Mục tiêu — Trang quản lý (NHANVIEN + QUANTRI)
- [ ] Dashboard thống kê (đếm đơn theo trạng thái, biểu đồ)
- [ ] Quản lý đơn hàng (xem tất cả, lọc, tìm, cập nhật trạng thái)
- [ ] Quản lý bảng giá cước (CRUD)
- [ ] Quản lý người dùng (xem/khóa/sửa — chỉ QUANTRI)
- [ ] Quản lý đối tác (xem/tạo/khóa — chỉ QUANTRI)

### Mục tiêu — Phân quyền & Kỹ thuật
- [ ] Module api.js (Fetch wrapper, auto API Key header, error handling)
- [ ] Module auth.js (Login/Logout, localStorage session, route guard theo vai trò)
- [ ] Phân quyền UI: KHACHHANG / NHANVIEN / QUANTRI
- [ ] UX polish: loading spinner, toast notification, sidebar admin

### Tiêu chí hoàn thành
- ✅ Giao diện web đẹp, modern, responsive trên mobile
- ✅ SPA-like navigation mượt mà, không reload trang
- ✅ Phân quyền theo vai trò hoạt động chính xác (route guard + API)
- ✅ Trang admin có sidebar, dashboard biểu đồ
- ✅ Tất cả chức năng hoạt động qua API
- ✅ Hiển thị thông báo lỗi/thành công rõ ràng

---

## Giai đoạn 4: Tích hợp & Kiểm thử (Tuần 9-10)

### Mục tiêu
- [ ] Kiểm thử tích hợp: Khách tạo đơn → Nhân viên thấy trên admin
- [ ] Kiểm thử phân quyền: KHACHHANG không vào được trang admin
- [ ] Kiểm thử API với kịch bản đối tác gọi vào tự động
- [ ] Mô phỏng kịch bản: Sàn TMĐT tạo đơn hàng hàng loạt qua API
- [ ] Fix bugs và tối ưu hiệu năng
- [ ] Kiểm thử bảo mật cơ bản (SQL Injection, XSS, API Key, phân quyền)

### Tiêu chí hoàn thành
- ✅ Toàn bộ luồng nghiệp vụ hoạt động end-to-end
- ✅ Không có lỗi critical/blocker
- ✅ Phân quyền an toàn cả client và server

---

## Giai đoạn 5: Hoàn thiện & Báo cáo (Tuần 11)

### Mục tiêu
- [ ] Viết báo cáo đồ án đầy đủ
- [ ] Chuẩn bị slide thuyết trình
- [ ] Quay video demo hệ thống
- [ ] Clean code, thêm comment
- [ ] Viết hướng dẫn cài đặt (README)
- [ ] Đóng gói sản phẩm (source code + database script + tài liệu)

### Tiêu chí hoàn thành
- ✅ Bộ sản phẩm hoàn chỉnh sẵn sàng nộp/bảo vệ
- ✅ Tài liệu đầy đủ, rõ ràng

---

## Luồng nghiệp vụ chính (Business Flow)

```
[Khách hàng/Đối tác] 
    → Tạo yêu cầu gửi hàng (Web / API)
    → Hệ thống tính phí cước (OSRM / Zone)
    → Tạo mã vận đơn (Tracking Code)
    → Trạng thái: "Chờ lấy hàng"
    → Nhân viên xác nhận (trang admin): "Đang vận chuyển"  
    → Giao thành công: "Hoàn thành" / Thất bại: "Hủy"
```

## Trạng thái đơn hàng

| Mã | Trạng thái | Mô tả |
|----|-----------|-------|
| 1 | `CHO_LAY_HANG` | Chờ lấy hàng |
| 2 | `DA_LAY_HANG` | Đã lấy hàng |
| 3 | `DANG_VAN_CHUYEN` | Đang vận chuyển |
| 4 | `GIAO_THANH_CONG` | Giao thành công |
| 5 | `DA_HUY` | Đã hủy |
| 6 | `HOAN_TRA` | Hoàn trả |
