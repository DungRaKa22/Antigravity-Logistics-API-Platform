from .extensions import db
from datetime import datetime

class TongKho(db.Model):
    __tablename__ = 'TongKho'

    MaTongKho = db.Column(db.Integer, primary_key=True, autoincrement=True)
    TenTongKho = db.Column(db.String(150), nullable=False)
    VungMien = db.Column(db.String(20), nullable=False) # 'BAC', 'TRUNG', 'NAM'
    DiaChi = db.Column(db.Text, nullable=False)
    ViDo = db.Column(db.Numeric(10, 6), nullable=False)
    KinhDo = db.Column(db.Numeric(10, 6), nullable=False)
    NgayTao = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    chi_nhanh = db.relationship('ChiNhanh', backref='tong_kho_lien_ket')
    nhan_vien = db.relationship('NguoiDung', foreign_keys='NguoiDung.MaTongKho', backref='tong_kho')

class ChiNhanh(db.Model):
    __tablename__ = 'ChiNhanh'

    MaChiNhanh = db.Column(db.Integer, primary_key=True, autoincrement=True)
    TenChiNhanh = db.Column(db.String(150), nullable=False)
    DiaChi = db.Column(db.Text, nullable=False)
    ViDo = db.Column(db.Numeric(10, 6), nullable=False)
    KinhDo = db.Column(db.Numeric(10, 6), nullable=False)
    MaTongKhoLienKet = db.Column(db.Integer, db.ForeignKey('TongKho.MaTongKho', ondelete='SET NULL'), nullable=True)
    NgayTao = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    nhan_vien = db.relationship('NguoiDung', foreign_keys='NguoiDung.MaChiNhanh', backref='chi_nhanh')
    don_hang_gui = db.relationship('DonHang', foreign_keys='DonHang.MaChiNhanhGui', backref='chi_nhanh_gui')
    don_hang_nhan = db.relationship('DonHang', foreign_keys='DonHang.MaChiNhanhNhan', backref='chi_nhanh_nhan')

class NguoiDung(db.Model):
    __tablename__ = 'NguoiDung'

    MaNguoiDung = db.Column(db.Integer, primary_key=True, autoincrement=True)
    TenDangNhap = db.Column(db.String(100), unique=True, nullable=False)
    MatKhau = db.Column(db.String(255), nullable=False)
    HoTen = db.Column(db.String(255), nullable=False)
    VaiTro = db.Column(db.String(30), nullable=False)
    
    # Financial details
    SoTaiKhoan = db.Column(db.String(50), nullable=True)
    TenNganHang = db.Column(db.String(100), nullable=True)
    ChuTaiKhoan = db.Column(db.String(100), nullable=True)
    LuongCoBan = db.Column(db.Numeric(15, 2), default=0.00)
    
    # HR & limits
    GioiHanDonNgay = db.Column(db.Integer, nullable=False, default=100)
    GhiChuNhanSu = db.Column(db.Text, nullable=True)
    
    # Workplace associations
    MaChiNhanh = db.Column(db.Integer, db.ForeignKey('ChiNhanh.MaChiNhanh', ondelete='SET NULL'), nullable=True)
    MaTongKho = db.Column(db.Integer, db.ForeignKey('TongKho.MaTongKho', ondelete='SET NULL'), nullable=True)
    NgayTao = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    dia_chi = db.relationship('SoDiaChi', backref='nguoi_dung', cascade="all, delete-orphan")
    don_hang_gui = db.relationship('DonHang', foreign_keys='DonHang.MaNguoiGui', backref='nguoi_gui')
    cham_cong = db.relationship('ChamCong', backref='nhan_vien', cascade="all, delete-orphan")

class SoDiaChi(db.Model):
    __tablename__ = 'SoDiaChi'

    MaDiaChi = db.Column(db.Integer, primary_key=True, autoincrement=True)
    MaNguoiDung = db.Column(db.Integer, db.ForeignKey('NguoiDung.MaNguoiDung', ondelete='CASCADE'), nullable=False)
    TenLienHe = db.Column(db.String(255), nullable=False)
    SoDienThoai = db.Column(db.String(20), nullable=False)
    DiaChiChiTiet = db.Column(db.Text, nullable=False)
    ViDo = db.Column(db.Numeric(10, 6), nullable=True)
    KinhDo = db.Column(db.Numeric(10, 6), nullable=True)
    LaMacDinh = db.Column(db.Boolean, nullable=False, default=False)

class GoiDichVu(db.Model):
    __tablename__ = 'GoiDichVu'
    
    MaGoi = db.Column(db.Integer, primary_key=True, autoincrement=True)
    TenGoi = db.Column(db.String(50), nullable=False)
    GiaKhoiDiem = db.Column(db.Numeric(18, 2), nullable=False)
    GiaMoiKm = db.Column(db.Numeric(18, 2), nullable=False)

    don_hang = db.relationship('DonHang', backref='goi_dich_vu')

class DonHang(db.Model):
    __tablename__ = 'DonHang'

    MaDonHang = db.Column(db.String(50), primary_key=True)
    MaNguoiGui = db.Column(db.Integer, db.ForeignKey('NguoiDung.MaNguoiDung'), nullable=False)
    MaGoi = db.Column(db.Integer, db.ForeignKey('GoiDichVu.MaGoi'), nullable=False)
    
    # Custom sender details for B2C individual guest orders
    TenNguoiGui = db.Column(db.String(255), nullable=True)
    SoDienThoaiGui = db.Column(db.String(20), nullable=True)
    DiaChiGui = db.Column(db.Text, nullable=True)
    ViDoGui = db.Column(db.Numeric(10, 6), nullable=True)
    KinhDoGui = db.Column(db.Numeric(10, 6), nullable=True)

    TenNguoiNhan = db.Column(db.String(255), nullable=False)
    SoDienThoaiNhan = db.Column(db.String(20), nullable=False)
    DiaChiNhan = db.Column(db.Text, nullable=False)
    ViDoNhan = db.Column(db.Numeric(10, 6), nullable=True)
    KinhDoNhan = db.Column(db.Numeric(10, 6), nullable=True)
    
    TrongLuongGram = db.Column(db.Integer, nullable=False)
    ChieuDaiCM = db.Column(db.Integer, nullable=True)
    ChieuRongCM = db.Column(db.Integer, nullable=True)
    ChieuCaoCM = db.Column(db.Integer, nullable=True)
    TrongLuongQuyDoiGram = db.Column(db.Integer, nullable=True)
    
    MoTaHangHoa = db.Column(db.Text, nullable=False)
    GiaTriKhaiBao = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    PhiBaoHiem = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    
    KhoangCachKm = db.Column(db.Numeric(10, 2), nullable=True)
    PhiVanChuyen = db.Column(db.Numeric(18, 2), nullable=False)
    TienThuHoCOD = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    
    QuyenKiemTra = db.Column(db.String(50), nullable=False, default='KHONG_XEM')
    GiaoMotPhan = db.Column(db.Boolean, nullable=False, default=False)
    HinhThucLayHang = db.Column(db.String(50), nullable=False, default='TU_MANG_RA_BUU_CUC')
    
    TrangThaiHienTai = db.Column(db.String(50), nullable=False)
    TrangThaiThanhToan = db.Column(db.String(50), nullable=False, default='CHUA_THANH_TOAN') # 'CHUA_THANH_TOAN', 'DA_THANH_TOAN'
    GiaoDichThanhToanId = db.Column(db.String(100), nullable=True)
    
    # Dynamic multibranch allocations
    MaChiNhanhGui = db.Column(db.Integer, db.ForeignKey('ChiNhanh.MaChiNhanh', ondelete='SET NULL'), nullable=True)
    MaChiNhanhNhan = db.Column(db.Integer, db.ForeignKey('ChiNhanh.MaChiNhanh', ondelete='SET NULL'), nullable=True)
    
    MaNhanVienGiao = db.Column(db.Integer, db.ForeignKey('NguoiDung.MaNguoiDung'), nullable=True)
    NgayTao = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    lich_su = db.relationship('LichSu_TrangThai', backref='don_hang', cascade="all, delete-orphan")
    doi_soat = db.relationship('DoiSoat', backref='don_hang', uselist=False)
    nhan_vien_giao = db.relationship('NguoiDung', foreign_keys=[MaNhanVienGiao], backref='don_hang_giao')
    khieu_nai = db.relationship('KhieuNai', backref='don_hang', cascade="all, delete-orphan")

class LichSu_TrangThai(db.Model):
    __tablename__ = 'LichSu_TrangThai'

    MaLichSu = db.Column(db.Integer, primary_key=True, autoincrement=True)
    MaDonHang = db.Column(db.String(50), db.ForeignKey('DonHang.MaDonHang', ondelete='CASCADE'), nullable=False)
    MaTrangThai = db.Column(db.String(50), nullable=False)
    ThongTinViTri = db.Column(db.Text, nullable=True)
    AnhBangChungUrl = db.Column(db.Text, nullable=True)
    GhiChuLyDo = db.Column(db.Text, nullable=True)
    MaNhanVienCapNhat = db.Column(db.Integer, db.ForeignKey('NguoiDung.MaNguoiDung'), nullable=False)
    ThoiGian = db.Column(db.DateTime, default=datetime.utcnow)

    nhan_vien = db.relationship('NguoiDung', foreign_keys=[MaNhanVienCapNhat])

class DoiSoat(db.Model):
    __tablename__ = 'DoiSoat'

    MaDoiSoat = db.Column(db.Integer, primary_key=True, autoincrement=True)
    MaDonHang = db.Column(db.String(50), db.ForeignKey('DonHang.MaDonHang'), unique=True, nullable=False)
    MaKhachHang = db.Column(db.Integer, db.ForeignKey('NguoiDung.MaNguoiDung'), nullable=False)
    MaHoaDon = db.Column(db.String(50), db.ForeignKey('HoaDonDoiSoat.MaHoaDon'), nullable=True)
    TongTienThu = db.Column(db.Numeric(18, 2), nullable=False)
    PhiVanChuyenTru = db.Column(db.Numeric(18, 2), nullable=False)
    PhiBaoHiemTru = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    PhiHoanTraTru = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    PhiGiaoMotPhanTru = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    ThucNhan = db.Column(db.Numeric(18, 2), nullable=False)
    TrangThaiDoiSoat = db.Column(db.String(50), nullable=False)
    NgayTao = db.Column(db.DateTime, default=datetime.utcnow)
    NgayXuLy = db.Column(db.DateTime, nullable=True)

    khach_hang = db.relationship('NguoiDung', foreign_keys=[MaKhachHang])

class HoaDonDoiSoat(db.Model):
    __tablename__ = 'HoaDonDoiSoat'

    MaHoaDon = db.Column(db.String(50), primary_key=True)
    MaKhachHang = db.Column(db.Integer, db.ForeignKey('NguoiDung.MaNguoiDung'), nullable=False)
    TongCOD = db.Column(db.Numeric(18, 2), nullable=False)
    TongPhiVanChuyen = db.Column(db.Numeric(18, 2), nullable=False)
    TongThucNhan = db.Column(db.Numeric(18, 2), nullable=False)
    TrangThaiThanhToan = db.Column(db.String(50), nullable=False, default='CHUA_THANH_TOAN')
    NgayTao = db.Column(db.DateTime, default=datetime.utcnow)
    NgayThanhToan = db.Column(db.DateTime, nullable=True)

    # Relationships
    khach_hang = db.relationship('NguoiDung', foreign_keys=[MaKhachHang], backref='hoa_don_doi_soat')
    doi_soat_records = db.relationship('DoiSoat', foreign_keys='DoiSoat.MaHoaDon', backref='hoa_don')

class KhoaAPI(db.Model):
    __tablename__ = 'KhoaAPI'

    MaKhoa = db.Column(db.Integer, primary_key=True, autoincrement=True)
    MaDoiTac = db.Column(db.Integer, db.ForeignKey('NguoiDung.MaNguoiDung', ondelete='CASCADE'), nullable=False)
    ChuoiKhoaAPI = db.Column(db.String(64), unique=True, nullable=False)
    TrangThaiHoatDong = db.Column(db.Boolean, default=True)
    NgayTao = db.Column(db.DateTime, default=datetime.utcnow)

    doi_tac = db.relationship('NguoiDung')

class TinNhan(db.Model):
    __tablename__ = 'TinNhan'

    MaTinNhan = db.Column(db.Integer, primary_key=True, autoincrement=True)
    PhongChatId = db.Column(db.String(100), nullable=False)
    MaNguoiGui = db.Column(db.Integer, db.ForeignKey('NguoiDung.MaNguoiDung', ondelete='CASCADE'), nullable=False)
    MaNguoiNhan = db.Column(db.Integer, db.ForeignKey('NguoiDung.MaNguoiDung', ondelete='CASCADE'), nullable=True)
    NoiDung = db.Column(db.Text, nullable=False)
    FileDinhKemUrl = db.Column(db.Text, nullable=True)
    ThoiGianGui = db.Column(db.DateTime, default=datetime.utcnow)

    nguoi_gui = db.relationship('NguoiDung', foreign_keys=[MaNguoiGui])
    nguoi_nhan = db.relationship('NguoiDung', foreign_keys=[MaNguoiNhan])

class ChamCong(db.Model):
    __tablename__ = 'ChamCong'

    MaChamCong = db.Column(db.Integer, primary_key=True, autoincrement=True)
    MaNhanVien = db.Column(db.Integer, db.ForeignKey('NguoiDung.MaNguoiDung', ondelete='CASCADE'), nullable=False)
    Ngay = db.Column(db.Date, nullable=False, default=datetime.utcnow().date)
    GioVao = db.Column(db.DateTime, nullable=True)
    GioRa = db.Column(db.DateTime, nullable=True)
    TrangThai = db.Column(db.String(30), default='VAO_CA') # 'VAO_CA', 'TAN_CA', 'NGHI_PHEP'

class KhieuNai(db.Model):
    __tablename__ = 'KhieuNai'

    MaKhieuNai = db.Column(db.Integer, primary_key=True, autoincrement=True)
    MaDonHang = db.Column(db.String(50), db.ForeignKey('DonHang.MaDonHang', ondelete='CASCADE'), nullable=False)
    MaKhachHang = db.Column(db.Integer, db.ForeignKey('NguoiDung.MaNguoiDung', ondelete='CASCADE'), nullable=False)
    TieuDe = db.Column(db.String(255), nullable=False)
    NoiDung = db.Column(db.Text, nullable=False)
    TrangThai = db.Column(db.String(50), default='CHO_TIEP_NHAN') # 'CHO_TIEP_NHAN', 'DANG_XU_LY', 'DA_XU_LY'
    NgayTao = db.Column(db.DateTime, default=datetime.utcnow)

    khach_hang = db.relationship('NguoiDung', foreign_keys=[MaKhachHang])

class DangKyNhanThongBao(db.Model):
    __tablename__ = 'DangKyNhanThongBao'

    MaDangKy = db.Column(db.Integer, primary_key=True, autoincrement=True)
    MaNguoiDung = db.Column(db.Integer, db.ForeignKey('NguoiDung.MaNguoiDung', ondelete='CASCADE'), nullable=False)
    Endpoint = db.Column(db.Text, nullable=False)
    P256dh = db.Column(db.String(255), nullable=False)
    Auth = db.Column(db.String(255), nullable=False)
    NgayTao = db.Column(db.DateTime, default=datetime.utcnow)

    nguoi_dung = db.relationship('NguoiDung', backref=db.backref('dang_ky_thong_bao', cascade="all, delete-orphan"))

class SuperAdmin(db.Model):
    __tablename__ = 'SuperAdmin'

    MaSuperAdmin = db.Column(db.Integer, primary_key=True, autoincrement=True)
    TenDangNhap = db.Column(db.String(100), unique=True, nullable=False)
    MatKhau = db.Column(db.String(255), nullable=False)
    HoTen = db.Column(db.String(255), nullable=False)
    NgayTao = db.Column(db.DateTime, default=datetime.utcnow)


