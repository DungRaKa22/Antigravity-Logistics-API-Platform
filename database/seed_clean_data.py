import sys
import os
from datetime import datetime

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app import create_app
from app.extensions import db
from app.models import NguoiDung, DonHang, DoiSoat, HoaDonDoiSoat, GoiDichVu, LichSu_TrangThai, SoDiaChi, KhoaAPI
from app.utils.security import hash_password

def seed():
    app = create_app('development')
    with app.app_context():
        print("[*] Dropping old tables and recreating clean schema...")
        db.drop_all()
        db.create_all()
        
        print("[*] Seeding service packages...")
        std = GoiDichVu(MaGoi=1, TenGoi="STANDARD", GiaKhoiDiem=15000, GiaMoiKm=2000)
        exp = GoiDichVu(MaGoi=2, TenGoi="EXPRESS", GiaKhoiDiem=30000, GiaMoiKm=5000)
        db.session.add(std)
        db.session.add(exp)
        
        print("[*] Seeding core users...")
        admin = NguoiDung(
            TenDangNhap="admin_tong",
            MatKhau=hash_password("admin_pass"),
            HoTen="Quản trị viên Hệ thống",
            VaiTro="QUANTRI"
        )
        merchant = NguoiDung(
            TenDangNhap="shop_sneaker",
            MatKhau=hash_password("merchant_pass"),
            HoTen="Cửa Hàng Giày Sneaker X",
            VaiTro="KHACHHANG",
            SoTaiKhoan="190333888999",
            TenNganHang="Techcombank",
            ChuTaiKhoan="NGUYEN VAN SNEAKER"
        )
        shipper1 = NguoiDung(
            TenDangNhap="shipper_01",
            MatKhau=hash_password("shipper_pass"),
            HoTen="Bưu Tá Nguyễn Văn C",
            VaiTro="NHANVIEN"
        )
        shipper2 = NguoiDung(
            TenDangNhap="shipper_02",
            MatKhau=hash_password("shipper_pass"),
            HoTen="Bưu Tá Lê Văn D",
            VaiTro="NHANVIEN"
        )
        
        db.session.add(admin)
        db.session.add(merchant)
        db.session.add(shipper1)
        db.session.add(shipper2)
        db.session.commit()
        
        print(f"[+] Seeding completed. User IDs:")
        print(f"    Admin: {admin.MaNguoiDung}")
        print(f"    Merchant: {merchant.MaNguoiDung}")
        print(f"    Shipper 1: {shipper1.MaNguoiDung}")
        print(f"    Shipper 2: {shipper2.MaNguoiDung}")

        # Seed address book for merchant
        addr1 = SoDiaChi(
            MaNguoiDung=merchant.MaNguoiDung,
            TenLienHe="Văn Phòng Cầu Giấy",
            SoDienThoai="0988887777",
            DiaChiChiTiet="1 Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội",
            ViDo=21.0278,
            KinhDo=105.7882,
            LaMacDinh=True
        )
        addr2 = SoDiaChi(
            MaNguoiDung=merchant.MaNguoiDung,
            TenLienHe="Kho Landmark 81",
            SoDienThoai="0911223344",
            DiaChiChiTiet=" Landmark 81, Vinhomes Tân Cảng, Bình Thạnh, TP. Hồ Chí Minh",
            ViDo=10.7947,
            KinhDo=106.7218,
            LaMacDinh=False
        )
        db.session.add(addr1)
        db.session.add(addr2)

        print("[*] Seeding sample orders & routes...")
        # Order 1: Assigned to Shipper 1, in progress
        o1 = DonHang(
            MaDonHang="AG-10001",
            MaNguoiGui=merchant.MaNguoiDung,
            MaGoi=1,
            TenNguoiNhan="Trần Văn A",
            SoDienThoaiNhan="0987654321",
            DiaChiNhan="10 Duy Tân, Cầu Giấy, Hà Nội",
            TrongLuongGram=500,
            KhoangCachKm=1.2,
            PhiVanChuyen=17400,
            TienThuHoCOD=250000,
            MoTaHangHoa="Đôi giày chạy bộ",
            TrangThaiHienTai="CHO_LAY_HANG",
            MaNhanVienGiao=shipper1.MaNguoiDung
        )
        log1 = LichSu_TrangThai(
            MaDonHang="AG-10001",
            MaTrangThai="CHO_LAY_HANG",
            ThongTinViTri="Đơn hàng khởi tạo thành công",
            MaNhanVienCapNhat=admin.MaNguoiDung
        )
        db.session.add(o1)
        db.session.add(log1)

        # Order 2: Assigned, shipping
        o2 = DonHang(
            MaDonHang="AG-10002",
            MaNguoiGui=merchant.MaNguoiDung,
            MaGoi=1,
            TenNguoiNhan="Lê Thị B",
            SoDienThoaiNhan="0987654322",
            DiaChiNhan="88 Cầu Giấy, Hà Nội",
            TrongLuongGram=1000,
            KhoangCachKm=2.8,
            PhiVanChuyen=20600,
            TienThuHoCOD=500000,
            MoTaHangHoa="Hộp giày thể thao",
            TrangThaiHienTai="DANG_VAN_CHUYEN",
            MaNhanVienGiao=shipper1.MaNguoiDung
        )
        log2_1 = LichSu_TrangThai(
            MaDonHang="AG-10002",
            MaTrangThai="CHO_LAY_HANG",
            ThongTinViTri="Đơn hàng khởi tạo thành công",
            MaNhanVienCapNhat=admin.MaNguoiDung
        )
        log2_2 = LichSu_TrangThai(
            MaDonHang="AG-10002",
            MaTrangThai="DA_LAY_HANG",
            ThongTinViTri="Shipper đã lấy hàng từ Shop",
            MaNhanVienCapNhat=shipper1.MaNguoiDung
        )
        log2_3 = LichSu_TrangThai(
            MaDonHang="AG-10002",
            MaTrangThai="DANG_VAN_CHUYEN",
            ThongTinViTri="Đang trung chuyển qua bưu cục Cầu Giấy",
            MaNhanVienCapNhat=shipper1.MaNguoiDung
        )
        db.session.add(o2)
        db.session.add(log2_1)
        db.session.add(log2_2)
        db.session.add(log2_3)

        # Order 3: New, unassigned
        o3 = DonHang(
            MaDonHang="AG-10003",
            MaNguoiGui=merchant.MaNguoiDung,
            MaGoi=2,
            TenNguoiNhan="Phạm Văn D",
            SoDienThoaiNhan="0911223344",
            DiaChiNhan="Hoàn Kiếm, Hà Nội",
            TrongLuongGram=200,
            KhoangCachKm=6.5,
            PhiVanChuyen=62500,
            TienThuHoCOD=0,
            MoTaHangHoa="Phong bì tài liệu gấp",
            TrangThaiHienTai="CHO_LAY_HANG"
        )
        log3 = LichSu_TrangThai(
            MaDonHang="AG-10003",
            MaTrangThai="CHO_LAY_HANG",
            ThongTinViTri="Đơn hàng khởi tạo thành công",
            MaNhanVienCapNhat=merchant.MaNguoiDung
        )
        db.session.add(o3)
        db.session.add(log3)

        # Order 4: Delivered successfully, creates DoiSoat positive
        o4 = DonHang(
            MaDonHang="AG-10004",
            MaNguoiGui=merchant.MaNguoiDung,
            MaGoi=1,
            TenNguoiNhan="Trần Hùng E",
            SoDienThoaiNhan="0988776655",
            DiaChiNhan="Đống Đa, Hà Nội",
            TrongLuongGram=1000,
            KhoangCachKm=4.0,
            PhiVanChuyen=23000,
            TienThuHoCOD=450000,
            MoTaHangHoa="Áo khoác nam hoodie",
            TrangThaiHienTai="GIAO_THANH_CONG",
            MaNhanVienGiao=shipper1.MaNguoiDung
        )
        log4 = LichSu_TrangThai(
            MaDonHang="AG-10004",
            MaTrangThai="GIAO_THANH_CONG",
            ThongTinViTri="Đã phát thành công - Người nhận ký tên",
            MaNhanVienCapNhat=shipper1.MaNguoiDung
        )
        ds4 = DoiSoat(
            MaDonHang="AG-10004",
            MaKhachHang=merchant.MaNguoiDung,
            TongTienThu=450000.00,
            PhiVanChuyenTru=23000.00,
            ThucNhan=427000.00,
            TrangThaiDoiSoat="CHUA_THANH_TOAN"
        )
        db.session.add(o4)
        db.session.add(log4)
        db.session.add(ds4)

        # Order 5: Delivered successfully, creates DoiSoat negative (high cước, low COD)
        o5 = DonHang(
            MaDonHang="AG-10005",
            MaNguoiGui=merchant.MaNguoiDung,
            MaGoi=2,
            TenNguoiNhan="Hoàng Gia F",
            SoDienThoaiNhan="0977665544",
            DiaChiNhan="Bình Dương",
            TrongLuongGram=8000,
            KhoangCachKm=1100.0,
            PhiVanChuyen=220000,
            TienThuHoCOD=50000,
            MoTaHangHoa="Bộ tạ tay tập gym",
            TrangThaiHienTai="GIAO_THANH_CONG",
            MaNhanVienGiao=shipper1.MaNguoiDung
        )
        log5 = LichSu_TrangThai(
            MaDonHang="AG-10005",
            MaTrangThai="GIAO_THANH_CONG",
            ThongTinViTri="Đã phát thành công",
            MaNhanVienCapNhat=shipper1.MaNguoiDung
        )
        ds5 = DoiSoat(
            MaDonHang="AG-10005",
            MaKhachHang=merchant.MaNguoiDung,
            TongTienThu=50000.00,
            PhiVanChuyenTru=220000.00,
            ThucNhan=-170000.00,
            TrangThaiDoiSoat="CHUA_THANH_TOAN"
        )
        db.session.add(o5)
        db.session.add(log5)
        db.session.add(ds5)

        db.session.commit()
        print("[+] All sample orders and data seeded successfully!")

if __name__ == "__main__":
    seed()
