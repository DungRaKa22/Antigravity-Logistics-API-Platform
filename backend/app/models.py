from .extensions import db
from datetime import datetime
from sqlalchemy.dialects.mssql import NVARCHAR

class NguoiDung(db.Model):
    __tablename__ = 'NguoiDung'

    MaNguoiDung = db.Column(db.Integer, primary_key=True, autoincrement=True)
    TenDangNhap = db.Column(db.String(100), unique=True, nullable=False)
    MatKhau = db.Column(db.String(255), nullable=False)
    HoTen = db.Column(NVARCHAR(255), nullable=False)
    VaiTro = db.Column(db.String(20), nullable=False)
    SoTaiKhoan = db.Column(db.String(50), nullable=True)
    TenNganHang = db.Column(NVARCHAR(100), nullable=True)
    ChuTaiKhoan = db.Column(NVARCHAR(100), nullable=True)
    NgayTao = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    dia_chi = db.relationship('SoDiaChi', backref='nguoi_dung', cascade="all, delete-orphan")
    don_hang_gui = db.relationship('DonHang', foreign_keys='DonHang.MaNguoiGui', backref='nguoi_gui')

class SoDiaChi(db.Model):
    __tablename__ = 'SoDiaChi'

    MaDiaChi = db.Column(db.Integer, primary_key=True, autoincrement=True)
    MaNguoiDung = db.Column(db.Integer, db.ForeignKey('NguoiDung.MaNguoiDung', ondelete='CASCADE'), nullable=False)
    TenLienHe = db.Column(NVARCHAR(255), nullable=False)
    SoDienThoai = db.Column(db.String(20), nullable=False)
    DiaChiChiTiet = db.Column(NVARCHAR(500), nullable=False)
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
    TenNguoiNhan = db.Column(NVARCHAR(255), nullable=False)
    SoDienThoaiNhan = db.Column(db.String(20), nullable=False)
    DiaChiNhan = db.Column(NVARCHAR(500), nullable=False)
    
    TrongLuongGram = db.Column(db.Integer, nullable=False)
    ChieuDaiCM = db.Column(db.Integer, nullable=True)
    ChieuRongCM = db.Column(db.Integer, nullable=True)
    ChieuCaoCM = db.Column(db.Integer, nullable=True)
    TrongLuongQuyDoiGram = db.Column(db.Integer, nullable=True)
    
    MoTaHangHoa = db.Column(NVARCHAR(500), nullable=False)
    GiaTriKhaiBao = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    PhiBaoHiem = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    
    KhoangCachKm = db.Column(db.Numeric(10, 2), nullable=True)
    PhiVanChuyen = db.Column(db.Numeric(18, 2), nullable=False)
    TienThuHoCOD = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    
    QuyenKiemTra = db.Column(db.String(50), nullable=False, default='KHONG_XEM')
    GiaoMotPhan = db.Column(db.Boolean, nullable=False, default=False)
    HinhThucLayHang = db.Column(db.String(50), nullable=False, default='TU_MANG_RA_BUU_CUC')
    
    TrangThaiHienTai = db.Column(db.String(50), nullable=False)
    NgayTao = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    lich_su = db.relationship('LichSu_TrangThai', backref='don_hang', cascade="all, delete-orphan")
    doi_soat = db.relationship('DoiSoat', backref='don_hang', uselist=False)

class LichSu_TrangThai(db.Model):
    __tablename__ = 'LichSu_TrangThai'

    MaLichSu = db.Column(db.Integer, primary_key=True, autoincrement=True)
    MaDonHang = db.Column(db.String(50), db.ForeignKey('DonHang.MaDonHang', ondelete='CASCADE'), nullable=False)
    MaTrangThai = db.Column(db.String(50), nullable=False)
    ThongTinViTri = db.Column(NVARCHAR(500), nullable=True)
    MaNhanVienCapNhat = db.Column(db.Integer, db.ForeignKey('NguoiDung.MaNguoiDung'), nullable=False)
    ThoiGian = db.Column(db.DateTime, default=datetime.utcnow)

    nhan_vien = db.relationship('NguoiDung', foreign_keys=[MaNhanVienCapNhat])

class DoiSoat(db.Model):
    __tablename__ = 'DoiSoat'

    MaDoiSoat = db.Column(db.Integer, primary_key=True, autoincrement=True)
    MaDonHang = db.Column(db.String(50), db.ForeignKey('DonHang.MaDonHang'), unique=True, nullable=False)
    MaKhachHang = db.Column(db.Integer, db.ForeignKey('NguoiDung.MaNguoiDung'), nullable=False)
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

class KhoaAPI(db.Model):
    __tablename__ = 'KhoaAPI'

    MaKhoa = db.Column(db.Integer, primary_key=True, autoincrement=True)
    MaDoiTac = db.Column(db.Integer, db.ForeignKey('NguoiDung.MaNguoiDung', ondelete='CASCADE'), nullable=False)
    ChuoiKhoaAPI = db.Column(db.String(64), unique=True, nullable=False)
    TrangThaiHoatDong = db.Column(db.Boolean, default=True)
    NgayTao = db.Column(db.DateTime, default=datetime.utcnow)

    doi_tac = db.relationship('NguoiDung')
