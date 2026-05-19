# 🎨 Hướng dẫn Thiết kế & Bảo trì Hệ thống Giao diện qua Google Stitch
*(Tài liệu Hướng dẫn dành cho các thành viên phát triển Phân hệ Admin - QUANTRI và Nhân viên - NHANVIEN)*

Hệ thống Logistics API Platform của chúng ta áp dụng ngôn ngữ thiết kế **Uber-Style Minimalist (Tối giản Đen - Trắng đẳng cấp cao)**. Để duy trì tính nhất quán khi thiết kế giao diện thông qua công cụ trí tuệ nhân tạo **Google Stitch**, tài liệu này sẽ hướng dẫn chi tiết cách viết cấu trúc `DESIGN.md`, các Token thiết kế và luồng nghiệp vụ đặc thù cho hai nhóm đối tượng: **Quản trị viên (`QUANTRI`)** và **Nhân viên bưu cục (`NHANVIEN`)**.

---

## 🖤 1. Ngôn ngữ Thiết kế & Hệ thống Token Cốt lõi
Khi viết mô tả màn hình, tuyệt đối không dùng các từ chỉ màu sắc ngẫu nhiên (như đỏ, xanh, vàng tùy tiện) mà phải sử dụng các **Design Tokens** đã được định nghĩa trong `DESIGN.md`:

### 🎨 Bảng màu (Colors)
*   **`colors.primary` (`#000000`) & `colors.ink` (`#000000`)**: Dùng cho văn bản chính, tiêu đề lớn, các nút hành động quan trọng nhất.
*   **`colors.canvas` (`#ffffff`)**: Màu nền của toàn bộ trang hoặc nền thẻ card nổi.
*   **`colors.canvas-soft` (`#efefef`)**: Màu nền phụ, viền mờ hoặc nền cho các ô nhập liệu (Input).
*   **`colors.body` (`#5e5e5e`)**: Màu chữ phụ, mô tả ngắn, nhãn (labels).

### 📐 Bo góc đặc thù (Border Radius)
*   **Không bo góc (`rounded.none` - 0px)**: Áp dụng bắt buộc cho toàn bộ các ô nhập liệu (**Input fields**) để tạo cảm giác sắc cạnh kĩ thuật.
*   **Bo tròn viên thuốc (`rounded.pill` / `rounded.full`)**: Áp dụng cho toàn bộ các nút bấm (**Buttons**), các thanh tab chọn phân đoạn (**Segmented Controls**).

---

## 👨‍💼 2. Yêu cầu Thiết kế Phân hệ Quản Trị (`QUANTRI`)
Phân hệ Admin là trung tâm điều phối tổng và quyết toán tài chính. Yêu cầu giao diện hướng đến **sự tinh gọn, trực quan hóa dữ liệu và xử lý nhanh**.

### A. Màn hình Dashboard Điều phối & Cập nhật Trạng thái Đơn hàng
*   **Trải nghiệm chính**: Bảng biểu đơn hàng bao quát toàn bộ hệ thống.
*   **Tính năng thiết yếu**:
    *   Bộ lọc tìm kiếm đa năng (mã vận đơn, tên shop gửi, tên người nhận).
    *   Trình thả chọn thay đổi nhanh trạng thái vận đơn trực tiếp trên dòng biểu bảng: `CHO_LAY_HANG` ➡️ `DA_LAY_HANG` ➡️ `DANG_VAN_CHUYEN` ➡️ `GIAO_THANH_CONG` / `DA_HUY`.
    *   Khi đổi trạng thái, bắt buộc có ô nhập bổ sung **Thông tin vị trí** (Vd: "Đã tiếp nhận tại bưu cục Cầu Giấy") để tự động ghi log `LichSu_TrangThai`.

### B. Màn hình Quản lý & Duyệt Đối soát Tài chính (`DoiSoat`)
*   **Trải nghiệm chính**: Xem danh sách sao kê COD công nợ của các Shop.
*   **Tính năng thiết yếu**:
    *   Danh sách các khoản thu hộ gồm: Tổng thu COD, Phí vận chuyển trừ, Phí bảo hiểm trừ (0.5%), Số tiền Thực nhận (`ThucNhan`).
    *   Trạng thái đối soát: **Chờ thanh toán (`CHUA_THANH_TOAN`)** và **Đã thanh toán (`DA_THANH_TOAN`)**.
    *   Nút hành động "Duyệt chi tiền" dạng viên thuốc đen tuyền nổi bật: Khi click, chuyển trạng thái sang `DA_THANH_TOAN` và tự ghi nhận ngày giờ chuyển khoản.

### C. Màn hình Cấp phát API Key Đối tác B2B (`DOITAC`)
*   **Trải nghiệm chính**: Nơi Admin cấp khóa bảo mật tích hợp hệ thống ngoại.
*   **Tính năng thiết yếu**:
    *   Form chọn đối tác (Dropdown list) và nút "Cấp khóa API".
    *   Khóa sinh ra có định dạng `AG_PARTNER_[Chuỗi_Hex_64_ký_tự]`, hiển thị kèm nút "Sao chép nhanh" và nút bật/tắt hoạt động (Toggle Switch).

---

## 🚚 3. Yêu cầu Thiết kế Phân hệ Nhân Viên (`NHANVIEN`)
Phân hệ Nhân viên hướng đến **giao diện tối ưu thiết bị di động (Mobile-Responsive)**, thao tác nhanh tay khi đi giao nhận hàng.

### A. Màn hình Tiếp nhận Hàng tại Bưu Cục
*   **Trải nghiệm chính**: Form cập nhật hàng hóa cập bến bưu cục hoặc bưu tá đi nhận.
*   **Tính năng thiết yếu**:
    *   Tính năng quét mã vận đơn (Giả lập quét camera/Barcode scanner).
    *   Form cập nhật vị trí hiện tại của hàng hóa và nút cập nhật trạng thái nhanh lên bưu xe.

### B. Màn hình Danh sách Đơn hàng Phụ trách Giao
*   **Trải nghiệm chính**: Danh sách đơn hàng sắp xếp theo tuyến đường tối ưu.
*   **Tính năng thiết yếu**:
    *   Nút gọi điện nhanh cho người nhận (dùng thẻ `tel:`).
    *   Nút bấm chuyển nhanh trạng thái giao thành công (Yêu cầu nhập số tiền COD thực thu nếu có) hoặc giao thất bại (chuyển sang Hoàn trả kèm lý do).

---

## 📝 4. Hướng dẫn Viết File `DESIGN.md` chuẩn cho Google Stitch
Khi mô tả giao diện mới trong `DESIGN.md`, hãy tuân thủ chính xác cấu trúc mẫu dưới đây để AI Stitch biên dịch ra mã nguồn React sạch đẹp:

```markdown
# [Tên Màn Hình] (Ví dụ: Màn hình đối soát Admin - AdminReconciliation)

## Mô tả Tổng quan
Mô tả ngắn gọn mục đích và đối tượng sử dụng màn hình (Admin Portal, tối giản đen trắng).

## Sơ đồ Bố cục (Layout Guide)
- Áp dụng Split Screen hoặc Dashboard Layout tiêu chuẩn.
- Khung điều hướng bên trái (Sidebar) cố định nền màu trắng tinh, đường kẻ mảnh `hairline-mid`.
- Vùng nội dung chính bên phải có màu nền xám dịu `canvas-soft`.

## Danh sách Linh kiện & Trạng thái (Component Specifications)
- **Hộp tìm kiếm (Search Bar)**: 
  - Nền `#efefef` (`canvas-soft`), không bo góc (`rounded.none`), chữ ghi chú mờ `#afafaf` (`mute`). Viền đen mảnh xuất hiện dưới chân khi nhấp chuột (focus).
- **Bộ lọc trạng thái (Segmented Tabs)**:
  - Nút bấm bo tròn tối đa dạng viên thuốc (`rounded.pill`). 
  - Trạng thái được chọn: Nền đen tuyền, chữ trắng.
  - Trạng thái không được chọn: Nền xám nhạt, chữ đen.
- **Nút "Duyệt thanh toán" (Primary Action Button)**:
  - Nền màu đen `#000000`, chữ màu trắng `#ffffff`, bo tròn dạng viên thuốc (`rounded.pill`). Có hiệu ứng co giãn nhẹ `active:scale-95` khi bấm.

## Các biến trạng thái động (Interactive States)
- `reconciliations` (Danh sách các sao kê đối soát lấy từ API `/api/reconciliations/`).
- `selectedReconciliationId` (ID của dòng đối soát đang thực hiện thao tác duyệt).
- `searchTerm` (Từ khóa lọc danh sách shop hoặc đơn hàng).
```

---

## ⚠️ 5. Những Điều Cực Kỳ Lưu Ý (Tránh Lỗi Phát Sinh)
1. **Tuyệt đối tuân thủ tên Biến cơ sở dữ liệu:** Khi kết xuất các dòng dữ liệu lên bảng (Table), thành viên viết giao diện phải chú ý ánh xạ đúng tên thuộc tính Việt hóa của bảng dữ liệu thực tế (Ví dụ: hiển thị mã là `order.MaDonHang`, số điện thoại là `order.SoDienThoaiNhan`, trạng thái là `order.TrangThaiHienTai`). Ghi nhớ lỗi NameError trước đây để không lặp lại.
2. **Không tự vẽ màu sắc tùy tiện:** Tránh sử dụng các màu thương hiệu khác như xanh dương đậm, tím, hồng trừ khi có chỉ định. Chỉ sử dụng hai tông màu đen và trắng để duy trì phong cách Uber-Style.
3. **Responsive trên thiết bị di động:** Giao diện của nhân viên (`NHANVIEN`) bắt buộc phải bọc trong các lớp CSS Grid/Flex linh hoạt của Tailwind để hiển thị hoàn hảo trên điện thoại của bưu tá đi ngoài đường.
