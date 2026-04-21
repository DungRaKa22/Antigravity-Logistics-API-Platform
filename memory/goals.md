# 🎯 Mục tiêu dự án - Logistics API Platform

> Tài liệu mô tả chi tiết mục tiêu từng giai đoạn và tiêu chí hoàn thành theo cấu trúc 6 bảng cốt lõi (Table Schema mới).

---

## Mục tiêu tổng thể

Xây dựng một **hệ sinh thái vận chuyển khép kín** theo mô hình **API-First**, bao gồm:
1. **Phân Hệ Khách Hàng (Web Portal / Merchant Portal)**: Giao diện trực quan, tinh gọn dành cho các chủ shop.
2. **Phân Hệ Quản Trị Vận Hành (Admin Web Dashboard)**: Dành cho bộ phận điều phối và kế toán (Back-office).
3. **Phân Hệ Mở (API Giao Tiếp Đồng Bộ)**: Cho các hệ thống đối tác B2B giao tiếp.

Tính cước thông minh bằng API OSRM/Google Maps. Quản lý linh hoạt nhiều chiều với chỉ 6 bảng Database.

---

## 1. Phân Hệ Khách Hàng (Web / Merchant Portal)

### Nhóm 1: Khách truy cập (Guest)
- [ ] **Hero Tracking**: Thanh tra cứu vận đơn ở trang chủ (chưa cần đăng nhập). Trả về chuỗi mốc thời gian rõ ràng (VD: 10:00 - Đã nhận hàng, 14:00 - Đang giao).
- [ ] **Ước tính cước phí thông minh**: Form nhập Đi/Đến, trọng lượng -> API OSRM quét khoảng cách km -> tính cước (ShippingFee = Km * Đơn giá).

### Nhóm 2: Chức năng Quản lý (Logged In = SHOP Role)
- [ ] **Sổ địa chỉ thông minh (Smart Address Book)**: Lưu danh sách khách hàng quen (Bảng `AddressBook`). Autocomplete khi tạo đơn.
- [ ] **Tạo đơn lẻ (Order Creation)**: Mã vận đơn (OrderID).
- [ ] **Tạo đơn hàng loạt qua Excel**: Tải xuống file mẫu -> Ghi chục đơn -> Upload tạo hàng loạt trực tiếp trên WEB.
- [ ] **Quản lý & Theo dõi vận đơn**: Bảng hiển thị các đơn phân nhóm trực quan (Chờ lấy, Đang giao, Thành công, Chuyển hoàn).
- [ ] **Bảng điều khiển Đối soát (Reconciliation Dashboard)**: Minh bạch dòng tiền: *Tiền shop nhận = Tiền COD - Phí giao dịch* (thông qua Bảng `Reconciliations`).

---

## 2. Phân Hệ Quản Trị Vận Hành (Admin Dashboard)

### Nhóm 3: Chức năng Điều phối & Kế toán (Logged In = ADMIN Role)
- [ ] **Bảng Điều Phối Trung Tâm (Dispatch Board)**: Hiển thị TOÀN BỘ vận đơn (từ Khách web và API bạn bè/Đối tác). Công cụ lọc theo ngày, trạng thái (CurrentStatus).
- [ ] **State Management**: Nút chuyển trạng thái đơn (PENDING -> PICKED_UP -> DELIVERING). Lưu vết vào `TrackingHistory`.
- [ ] **Cơ chế Webhook**: Cập nhật DB xong sẽ trigger đẩy dữ liệu sang Webhook Của Đối Tác (Bảng ApiKeys / DoiTac).
- [ ] **Quản lý Đối soát & Tài Chính**: Kế toán duyệt các đơn DELIVERED có CodAmount dư. Bấm Xác nhận -> Ghi vào bảng `Reconciliations` trạng thái PAID (Đã thanh toán).
- [ ] **Quản lý Đối tác B2B (Partner Management)**: Duyệt cấp `ApiKeyString` vào nhóm PARTNER. Bật/tắt IsActive bảng `ApiKeys`.

---

## Giai đoạn 1: Nền tảng & Cơ sở dữ liệu (Tuần 1-2) ✅

### Mục tiêu
- [x] Thiết kế hoàn chỉnh Database Schema 6 Bảng Cốt Lõi trên SQL Server.
- [x] Script `init_database.sql` bao gồm `Users`, `AddressBook`, `Orders`, `TrackingHistory`, `Reconciliations`, `ApiKeys`.

---

## Giai đoạn 2: Backend API Core (Tuần 3-5)

### Trọng Tâm API
- [ ] Khởi tạo dự án Python Flask/FastAPI.
- [ ] Module Xác thực (JWT / Login).
- [ ] Tích hợp OSRM / Google Maps tính Km cước phí.
- [ ] API Đọc/Ghi file Excel cho Order Creation Bulk.
- [ ] API cập nhật trạng thái (State Management) kèm hook Webhook bắn ngược Partner.
- [ ] API Đối soát kế toán (Reconciliation logic).

---

## Giai đoạn 3: Web App Cốt Lõi (Tuần 6-8)

### Trọng Tâm Giao Diện (Alpine.js)
- [ ] Giao diện Merchant Portal: Dashboad, AutoComplete `AddressBook`, Drag&Drop Upload Excel.
- [ ] Giao diện Admin Portal: Bảng điều phối, Tool lọc, Nút duyệt đối soát.

---

## Giai đoạn 4: Tích hợp & Kiểm thử (Tuần 9-10)
- End-to-End toàn trình (Hero Tracking -> Order Khách -> Admin Duyệt -> Paid Đối soát).
- API Partner Bulk Tạo Đơn -> Admin xem trên Dispatch Board.

---

## Giai đoạn 5: Hoàn thiện & Báo cáo (Tuần 11)
- Dọn dẹp Code. Trình chiếu. Đóng gói sản phẩm.
