# 🎯 Mục tiêu dự án - Logistics API Platform

> Tài liệu mô tả chi tiết mục tiêu từng giai đoạn và tiêu chí hoàn thành.

---

## Mục tiêu tổng thể

Xây dựng một **hệ sinh thái vận chuyển khép kín** theo mô hình **API-First**, bao gồm:
- Một Backend API trung tâm xử lý toàn bộ nghiệp vụ logistics
- Một Website cho khách hàng cá nhân
- Một ứng dụng Desktop cho nhân viên điều phối nội bộ
- RESTful API mở cho các hệ thống đối tác tích hợp

---

## Giai đoạn 1: Nền tảng & Cơ sở dữ liệu (Tuần 1-2)

### Mục tiêu
- [ ] Thiết kế hoàn chỉnh Database Schema trên SQL Server
- [ ] Tạo các bảng dữ liệu: NguoiDung, DonHang, BangGia, LichSu_TrangThai, DoiTac, KhuVuc
- [ ] Chèn dữ liệu mẫu (seed data) cho bảng khu vực, bảng cước phí
- [ ] Thiết lập môi trường phát triển (Python, Java, SQL Server)

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
- [ ] Xử lý lỗi (Error Handling) và validation đầu vào
- [ ] Viết tài liệu API (Swagger/OpenAPI hoặc Markdown)

### Tiêu chí hoàn thành
- ✅ Tất cả API endpoints hoạt động và test được qua Postman
- ✅ Xác thực API Key hoạt động chính xác
- ✅ OSRM tính khoảng cách chính xác, fallback zone hoạt động khi OSRM lỗi
- ✅ Trả về đúng format JSON với status code phù hợp
- ✅ Có tài liệu API rõ ràng

---

## Giai đoạn 3: Client Web - Khách hàng (Tuần 6-7)

### Mục tiêu
- [ ] Tạo CSS Design System (variables, components, layout responsive)
- [ ] Setup Alpine.js (CDN) + SPA hash-based router
- [ ] Thiết kế giao diện web responsive (HTML/CSS + Alpine.js)
- [ ] Trang đăng ký / đăng nhập (Alpine.js x-data form binding)
- [ ] Trang tính phí vận chuyển (form → gọi API → hiển thị kết quả realtime)
- [ ] Trang tạo đơn hàng mới (form phức tạp + validation)
- [ ] Trang tra cứu vận đơn (nhập mã → timeline trạng thái bằng x-for)
- [ ] Trang lịch sử đơn hàng cá nhân (bảng + bộ lọc + phân trang)
- [ ] Module api.js (Fetch wrapper, auto API Key header, error handling)
- [ ] Module auth.js (Login/Logout, localStorage session, auto-redirect)
- [ ] UX polish: loading spinner, toast notification, error display

### Tiêu chí hoàn thành
- ✅ Giao diện web đẹp, modern (Google Fonts + Font Awesome), responsive trên mobile
- ✅ SPA-like navigation mượt mà, không reload trang
- ✅ Tất cả chức năng hoạt động qua API (không truy cập DB trực tiếp)
- ✅ Alpine.js reactive binding hoạt động chính xác (forms, lists, toggles)
- ✅ Hiển thị thông báo lỗi/thành công rõ ràng (toast notifications)
- ✅ Không yêu cầu Node.js — chỉ cần mở Live Server là chạy

---

## Giai đoạn 4: Desktop App - Nhân viên (Tuần 8-9)

### Mục tiêu
- [ ] Thiết kế giao diện Java Swing
- [ ] Màn hình đăng nhập nhân viên
- [ ] Dashboard tổng quan (thống kê đơn hàng)
- [ ] Danh sách đơn hàng (JTable) với bộ lọc trạng thái
- [ ] Chức năng cập nhật trạng thái đơn hàng
- [ ] Chức năng tìm kiếm đơn hàng
- [ ] Quản lý bảng giá cước
- [ ] Kết nối trực tiếp với SQL Server (JDBC)

### Tiêu chí hoàn thành
- ✅ Ứng dụng desktop chạy ổn định, giao diện thân thiện
- ✅ CRUD đơn hàng hoạt động chính xác
- ✅ Dữ liệu đồng bộ real-time với database

---

## Giai đoạn 5: Tích hợp & Kiểm thử (Tuần 10-11)

### Mục tiêu
- [ ] Kiểm thử tích hợp: Web → API → Database
- [ ] Kiểm thử tích hợp: Desktop → Database
- [ ] Kiểm thử API với kịch bản đối tác gọi vào tự động
- [ ] Mô phỏng kịch bản: Sàn TMĐT tạo đơn hàng hàng loạt qua API
- [ ] Fix bugs và tối ưu hiệu năng
- [ ] Kiểm thử bảo mật cơ bản (SQL Injection, XSS, API Key validation)

### Tiêu chí hoàn thành
- ✅ Toàn bộ luồng nghiệp vụ hoạt động end-to-end
- ✅ Không có lỗi critical/blocker
- ✅ Chạy demo thành công kịch bản tích hợp đối tác

---

## Giai đoạn 6: Hoàn thiện & Báo cáo (Tuần 12)

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
    → Tạo yêu cầu gửi hàng
    → Hệ thống tính phí cước
    → Tạo mã vận đơn (Tracking Code)
    → Trạng thái: "Chờ lấy hàng"
    → Nhân viên xác nhận lấy hàng: "Đang vận chuyển"  
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
