# ĐỀ XUẤT CẤU TRÚC BÁO CÁO ĐỒ ÁN NGÀNH
## ĐỀ TÀI: NGHIÊN CỨU, XÂY DỰNG HỆ THỐNG QUẢN LÝ VẬN ĐƠN, ĐỊNH TUYẾN THÔNG MINH & ĐỐI SOÁT COD TỰ ĐỘNG - ANTIGRAVITY EXPRESS

---

Chào bạn! Qua phân tích 3 tệp mẫu `.docx` bạn gửi trong thư mục `docs/`, dưới đây là phân tích và nhận diện cấu trúc của tôi để chúng ta thống nhất trước khi viết chi tiết từng phần.

## 1. PHÂN TÍCH CẤU TRÚC CÁC FILE MẪU CỦA TRƯỜNG ĐẠI HỌC SAO ĐỎ

### Mẫu 1: `7. HÀ TIẾN DŨNG DK14-CNTT 1.docx`
*   **Loại tài liệu:** Báo cáo Bài tập lớn môn *Phân tích và Thiết kế hệ thống*.
*   **Đặc trưng cấu trúc:** 
    *   Tập trung 100% vào phân tích thiết kế, bỏ qua phần cơ sở lý thuyết công nghệ.
    *   Chia làm 3 Phần lớn:
        *   **I. Mô tả hệ thống:** Khảo sát thực trạng, mô tả chuỗi, sơ đồ tổ chức, sơ đồ tiến trình, mẫu phiếu và sơ đồ phân cấp chức năng (BFD).
        *   **II. Biểu đồ luồng dữ liệu (DFD):** DFD mức Khung cảnh, DFD mức Đỉnh (Level 0), DFD mức Dưới đỉnh (Level 1) cho tất cả các nhánh nghiệp vụ. Phân tích thực thể dữ liệu (Bảng và quan hệ).
        *   **III. Sơ đồ Usecase:** Mô hình usecase, mô tả chi tiết usecase (luồng cơ bản/thay thế), và đặc tả trình tự (Sequence diagram) hiện thực hóa.
    *   **Nhận xét:** Thích hợp khi làm bài tập lớn chuyên ngành Phân tích thiết kế hệ thống thông tin.

### Mẫu 2 & 3: `7_Nguyễn Thị Thanh Huyền_GVHD PhamVanKien.docx` & `DATN Bui Qui Quyet Cuoi.docx`
*   **Loại tài liệu:** Đồ án tốt nghiệp (Graduation Thesis) / Đồ án ngành (Sector Project).
*   **Đặc trưng cấu trúc:** Đây là cấu trúc chuẩn hóa bắt buộc của **Khoa Công nghệ thông tin - Trường Đại học Sao Đỏ** cho đồ án tốt nghiệp/chuyên ngành. Cấu trúc gồm phần Mở đầu và 3 Chương cốt lõi:
    *   **MỞ ĐẦU:** 
        1. Tính cấp thiết của đề tài (Lý do chọn đề tài).
        2. Mục tiêu nghiên cứu.
        3. Đối tượng nghiên cứu.
        4. Phạm vi nghiên cứu.
        5. Phương pháp nghiên cứu.
        6. Ý nghĩa khoa học và thực tiễn.
        7. Kết cấu của đồ án.
    *   **CHƯƠNG 1: CƠ SỞ LÝ THUYẾT:** 
        *   Nghiên cứu về lý thuyết nghiệp vụ đề tài (Vận chuyển, đối soát, thiện nguyện...).
        *   Tổng quan công nghệ sử dụng (Frontend: ReactJS, VueJS; Backend: Node.JS, ASP.NET; Database: MongoDB, PostgreSQL, SQL Server).
        *   Đánh giá thực trạng / Nghiên cứu các hệ thống tương tự trên thế giới & Việt Nam.
        *   Đề xuất giải pháp hệ thống.
    *   **CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG:**
        *   Khảo sát sơ bộ & mô tả bài toán.
        *   Thiết kế chức năng (Sơ đồ phân cấp chức năng BFD, Sơ đồ Usecase, mô tả đặc tả Usecase).
        *   Thiết kế động (Sơ đồ hoạt động - Activity Diagrams và Sơ đồ trình tự - Sequence Diagrams cho từng Usecase chính).
        *   Thiết kế dữ liệu (Sơ đồ lớp Class Diagram hoặc Sơ đồ quan hệ thực thể ERD, chi tiết cấu trúc các bảng CSDL).
    *   **CHƯƠNG 3: XÂY DỰNG ỨNG DỤNG / KẾT QUẢ THỰC NGHIỆM:**
        *   Kiến trúc hệ thống (Client-Server architecture, cấu trúc thư mục source code).
        *   Công nghệ & thư viện triển khai chi tiết.
        *   Các thuật toán hoặc hàm xử lý cốt lõi (Code snippet và giải thích giải thuật).
        *   Kết quả thực nghiệm (Screenshots giao diện các màn hình chức năng chính và mô tả luồng kiểm thử).
    *   **KẾT LUẬN:** Kết quả đạt được, Hạn chế, và Hướng phát triển.
    *   **TÀI LIỆU THAM KHẢO.**

---

## 2. ĐỀ XUẤT KHUNG CẤU TRÚC CHI TIẾT CHO ĐỒ ÁN "ANTIGRAVITY EXPRESS"

Để đạt chuẩn chất lượng cao nhất cho Hội đồng chấm đồ án ngành của trường, tôi đề xuất áp dụng cấu trúc đồ án tốt nghiệp 3 Chương (giống mẫu của sinh viên Bùi Quí Quyết và Nguyễn Thị Thanh Huyền), chi tiết hóa cho đề tài **Antigravity Express**:

### MỞ ĐẦU
1. **Tính cấp thiết của đề tài:** Sự phát triển thương mại điện tử chặng cuối ở Việt Nam; vai trò của đối soát tài chính COD tự động và tối ưu hóa tuyến đường giao trực tiếp chặng ngắn; lý do xây dựng nền tảng Antigravity Express.
2. **Mục tiêu nghiên cứu:** Phát triển hệ thống e-logistics đa vai trò; tích hợp Leaflet và API OSRM định tuyến; tự động hóa đối soát kế toán; cấp phát B2B API Key M2M.
3. **Đối tượng nghiên cứu:** Quy trình vận hành logistics và dòng tiền COD; các công nghệ ReactJS, Flask (Python), PostgreSQL.
4. **Phạm vi nghiên cứu:** Giới hạn nghiệp vụ bưu cục và dòng tiền, tích hợp chatbot; khu vực khảo sát tại Việt Nam (63 tỉnh thành).
5. **Phương pháp nghiên cứu:** Nghiên cứu lý thuyết; thực nghiệm xây dựng và kiểm thử hệ thống.
6. **Ý nghĩa khoa học và thực tiễn của đồ án.**
7. **Kết cấu của đồ án.**

### CHƯƠNG 1: CƠ SỞ LÝ THUYẾT
1.1. **Tổng quan về nghiệp vụ giao nhận và đối soát COD:**
*   Khái niệm vận đơn, định tuyến chặng gửi - trung chuyển - phát chặng cuối.
*   Nghiệp vụ đối soát dòng tiền thu hộ (COD) và cơ chế khấu trừ cước tự động trong kế toán logistics.
1.2. **Các nền tảng công nghệ áp dụng:**
*   *Frontend:* ReactJS và Tailwind CSS v4.
*   *Backend:* Flask (Python RESTful API), Flask-SocketIO (truyền thông thời gian thực).
*   *Database:* PostgreSQL (Hệ quản trị CSDL quan hệ tối ưu hóa quan hệ khóa ngoại chặt chẽ).
*   *Map & Routing APIs:* Bản đồ Leaflet Maps và công cụ định tuyến Open Source Routing Machine (OSRM) / Nominatim Geocoding.
1.3. **Tổng quan các hệ thống vận chuyển tương tự:**
*   Khảo sát các hệ thống lớn (SPX Express, Giao Hàng Nhanh - GHN, Giao Hàng Tiết Kiệm - GHTK).
*   Ưu điểm và nhược điểm của các hệ thống hiện tại.
1.4. **Đề xuất kiến trúc hệ thống Antigravity Express.**

### CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG
2.1. **Khảo sát nghiệp vụ bưu cục và mô tả bài toán:**
*   Mô tả luồng đi vật lý của bưu gửi.
*   Phân tích 8 nhóm vai trò nghiệp vụ (Super Admin, Admin bưu cục, Kế toán, HR, Thủ kho, Shipper, Shop đối tác, Khách vãng lai).
*   Các mẫu chứng từ sử dụng (Tem nhãn nhiệt A6, hóa đơn đối soát cước âm, sao kê lương Excel).
2.2. **Sơ đồ phân cấp chức năng (BFD).**
2.3. **Mô hình ca sử dụng (Usecase Diagrams & Tables):**
*   Usecase tổng quát.
*   Đặc tả chi tiết 7 Usecase chính (Tạo đơn, Quét kho IN/OUT, Shipper cập nhật giao hàng và chữ ký Canvas/chụp bằng chứng, Đối soát gộp kế toán, Cấp API Key B2B, Chatbot Quantum Guide & Live Chat Socket.io, Điều chỉnh hạn mức Shipper Quota).
2.4. **Thiết kế động của hệ thống (Sơ đồ Hoạt động & Sơ đồ Trình tự):**
*   *Activity Diagrams:* Luồng tạo đơn, Luồng quét kho trung chuyển, Luồng giao hàng chặng cuối và ký tay số, Luồng đối soát COD của kế toán.
*   *Sequence Diagrams:* Trình tự các bước xác thực JWT, Trình tự đẩy đơn tự động B2B API từ TimiFood, Trình tự Handover Live Chat từ Trợ lý ảo sang CSKH.
2.5. **Thiết kế cơ sở dữ liệu (Database Design):**
*   Sơ đồ mối quan hệ thực thể (ERD) đồng bộ hóa khóa ngoại.
*   Đặc tả chi tiết cấu trúc 15 bảng cơ sở dữ liệu PostgreSQL (Tên cột, kiểu dữ liệu, ràng buộc chính/phụ, giải nghĩa thuộc tính).

### CHƯƠNG 3: XÂY DỰNG ỨNG DỤNG VÀ KẾT QUẢ THỰC NGHIỆM
3.1. **Kiến trúc mã nguồn và công nghệ triển khai:**
*   Kiến trúc 3 lớp (3-Tier) phân tách rõ nét.
*   Cấu trúc thư mục dự án (Backend Flask và Frontend React).
3.2. **Hiện thực hóa các thuật toán & hàm xử lý cốt lõi:**
*   *Thuật toán định tuyến & tính cước phí động:* Code tính khoảng cách KM thực tế, quy đổi thể tích cồng kềnh, phân luồng giao trực tiếp `<10km`.
*   *Cơ chế đối soát khấu trừ tự động:* Code truy vấn và khấu trừ dòng tiền, gom hóa đơn gộp.
*   *Đọc số tiền thành chữ tiếng Việt:* Hàm đệ quy chuyển đổi số tiền tệ sang chuỗi ký tự Việt Nam chuẩn.
*   *Bảo mật REST API chặng middleware:* Middleware xác thực khóa API Key 64 ký tự chặng ngầm B2B.
3.3. **Kết quả thực nghiệm hệ thống (Screenshots & Luồng chạy):**
*   Giao diện Trang chủ và co giãn 3D Box.
*   Giao diện Tạo đơn và in nhãn nhiệt A6 SPX.
*   Giao diện Portal Shipper di động (Timeline, Signature Canvas, Proof Photo).
*   Giao diện Kế toán đối soát, quầy QR chuyển khoản, in PDF hóa đơn, kết xuất Excel lương (.xlsx).
*   Giao diện Developer Portal & API key generator.
*   Giao diện chat Quantum Guide & CSKH Desk.

### KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN
1. **Kết quả đạt được:** So sánh kết quả thực tế với mục tiêu đề ra ban đầu.
2. **Hạn chế:** Các giới hạn về hạ tầng API công cộng (Nominatim rate limit).
3. **Hướng phát triển:** Tích hợp IoT GPS tracking trên xe bưu tá, sử dụng AI dự báo lưu lượng tồn kho bưu cục.

---

Bạn hãy xem xét khung đề xuất trên. Nếu bạn đồng ý hoặc muốn thêm bớt mục nào, hãy phản hồi lại cho tôi. Sau khi thống nhất khung sườn này, chúng ta sẽ bắt đầu viết tỉ mỉ, chi tiết từng phần một bắt đầu từ phần **MỞ ĐẦU**.
