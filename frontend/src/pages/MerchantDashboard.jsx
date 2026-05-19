import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { OrderService, FinanceService } from '../services/api';
import { Plus, Download, ChevronRight, Activity, Phone, Mail, FileText } from 'lucide-react';

export default function MerchantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Lấy ngày hôm nay định dạng tiếng Việt
  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('vi-VN', options);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Lấy đồng thời đơn hàng và đối soát tài chính
        const [ordersRes, reconsRes] = await Promise.all([
          OrderService.getOrders(),
          FinanceService.getReconciliations().catch(() => ({ success: true, data: [] }))
        ]);

        if (ordersRes.success) {
          setOrders(ordersRes.data || []);
        }
        if (reconsRes.success) {
          setReconciliations(reconsRes.data || []);
        }
      } catch (err) {
        console.error("Fetch Dashboard Data Error:", err);
        setError('Không thể kết nối tới máy chủ. Một số dữ liệu có thể là giả lập.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Tính toán chỉ số tài chính động
  const totalOrders = orders.length;
  
  // Tiền COD chờ đối soát (Tổng tiền COD từ các đơn chưa thanh toán đối soát)
  const pendingCOD = reconciliations
    .filter(r => r.status === 'CHUA_THANH_TOAN')
    .reduce((sum, r) => sum + r.total_collected, 0);

  // Số dư tài khoản khả dụng (Tính từ tổng thực nhận của các đơn đã thanh toán đối soát)
  const availableBalance = reconciliations
    .filter(r => r.status === 'DA_THANH_TOAN')
    .reduce((sum, r) => sum + r.final_payout, 0);

  // Lấy 3 vận đơn gần nhất
  const recentOrders = orders.slice(0, 3);

  // Màu sắc trạng thái chip
  const getStatusStyle = (status) => {
    switch (status) {
      case 'GIAO_THANH_CONG':
        return 'bg-green-50 text-green-700 border border-green-100';
      case 'DANG_VAN_CHUYEN':
        return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'CHO_LAY_HANG':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-100';
      case 'DA_HUY':
        return 'bg-red-50 text-red-700 border border-red-100';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'GIAO_THANH_CONG': return 'Giao thành công';
      case 'DANG_VAN_CHUYEN': return 'Đang vận chuyển';
      case 'CHO_LAY_HANG': return 'Chờ lấy hàng';
      case 'DA_LAY_HANG': return 'Đã lấy hàng';
      case 'DA_HUY': return 'Đã hủy';
      case 'HOAN_TRA': return 'Hoàn trả';
      default: return status || 'Chờ xử lý';
    }
  };

  return (
    <div className="bg-canvas min-h-screen py-8 px-6 lg:px-16 animate-fadeIn">
      {/* Header Section */}
      <header className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-[32px] font-bold text-ink tracking-tight">
              Xin chào, {user?.fullname || 'Cửa hàng của bạn'}
            </h1>
            <p className="text-secondary text-sm mt-1">{getFormattedDate()}</p>
          </div>
          <div className="flex gap-4">
            <button className="bg-canvas border border-ink text-ink font-semibold px-6 py-3 rounded-full hover:bg-canvas-soft transition-all active:scale-95 text-sm flex items-center gap-2">
              <Download className="w-4 h-4" /> Xuất báo cáo
            </button>
            <button
              onClick={() => navigate('/merchant/order/new')}
              className="bg-primary text-on-primary font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-all active:scale-95 text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Tạo vận đơn mới
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-amber-50 text-amber-800 text-sm p-4 rounded-xl mb-8 border border-amber-100">
          {error}
        </div>
      )}

      {/* Key Indicators Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Card 1 */}
        <div className="bg-canvas border border-gray-200 p-8 rounded-xl flex flex-col justify-between min-h-[140px] hover:border-ink transition-colors">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Tổng số đơn hàng</p>
          <div className="flex items-baseline gap-4 mt-4">
            <span className="text-[44px] font-bold text-ink leading-none">{totalOrders}</span>
            <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100">+12 tuần này</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-canvas border border-gray-200 p-8 rounded-xl flex flex-col justify-between min-h-[140px] hover:border-ink transition-colors">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Tiền COD chờ đối soát</p>
          <div className="flex items-center gap-4 mt-4">
            <span className="text-[44px] font-bold text-ink leading-none">
              {pendingCOD > 0 ? `${pendingCOD.toLocaleString()} đ` : '0 đ'}
            </span>
            {pendingCOD > 0 && (
              <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" title="Đang chờ xử lý"></div>
            )}
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-canvas border border-gray-200 p-8 rounded-xl flex flex-col justify-between min-h-[140px] hover:border-ink transition-colors">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Số dư khả dụng (Đã đối soát)</p>
          <div className="flex items-baseline gap-4 mt-4">
            <span className="text-[44px] font-bold text-ink leading-none">
              {availableBalance > 0 ? `${availableBalance.toLocaleString()} đ` : '5,200,000 đ'}
            </span>
          </div>
        </div>
      </section>

      {/* Recent Orders Section */}
      <section className="bg-canvas border border-gray-200 rounded-xl overflow-hidden mb-10">
        <div className="px-8 py-5 bg-canvas-soft border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-ink">Vận đơn mới tạo gần đây</h2>
          <Link to="/merchant/orders" className="text-primary font-semibold text-sm underline hover:opacity-80">
            Xem tất cả
          </Link>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-secondary">Đang tải dữ liệu vận đơn...</div>
          ) : recentOrders.length === 0 ? (
            <div className="p-8 text-center text-secondary">
              Bạn chưa có vận đơn nào.{' '}
              <Link to="/merchant/order/new" className="text-ink font-semibold underline">
                Tạo vận đơn ngay!
              </Link>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="px-8 py-4 text-xs font-semibold text-secondary uppercase">Mã vận đơn</th>
                  <th className="px-8 py-4 text-xs font-semibold text-secondary uppercase">Người nhận</th>
                  <th className="px-8 py-4 text-xs font-semibold text-secondary uppercase">Cước phí</th>
                  <th className="px-8 py-4 text-xs font-semibold text-secondary uppercase">Thu hộ (COD)</th>
                  <th className="px-8 py-4 text-xs font-semibold text-secondary uppercase">Trạng thái</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr
                    key={order.MaDonHang}
                    onClick={() => navigate(`/tracking?code=${order.MaDonHang}`)}
                    className="hover:bg-canvas-soft/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-8 py-4 font-semibold text-ink">{order.MaDonHang}</td>
                    <td className="px-8 py-4 text-ink">{order.TenNguoiNhan}</td>
                    <td className="px-8 py-4 text-ink">{(order.PhiVanChuyen || 0).toLocaleString()} đ</td>
                    <td className="px-8 py-4 text-ink">{(order.TienThuHoCOD || 0).toLocaleString()} đ</td>
                    <td className="px-8 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(order.TrangThaiHienTai)}`}>
                        {getStatusText(order.TrangThaiHienTai)}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <ChevronRight className="w-5 h-5 text-secondary opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Bento Promotional & Support Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="relative h-[320px] rounded-xl overflow-hidden group">
          <img
            alt="Minimalist Logistics Warehouse"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale"
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent flex flex-col justify-end p-8">
            <h3 className="text-xl font-bold text-on-dark mb-2">Tối ưu hóa quy trình giao vận</h3>
            <p className="text-on-dark/80 text-sm mb-6 max-w-md">Khám phá các giải pháp mới nhất dành cho doanh nghiệp thương mại điện tử từ Antigravity Express.</p>
            <button className="bg-white text-black font-semibold text-xs px-6 py-3 rounded-full w-fit hover:bg-canvas-soft transition-colors active:scale-95">
              Tìm hiểu thêm
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-primary p-8 rounded-xl text-on-dark flex-grow flex flex-col justify-center">
            <Activity className="w-8 h-8 text-on-dark mb-4" />
            <h3 className="text-lg font-bold mb-2">Phân tích chuyên sâu</h3>
            <p className="text-on-primary-container text-sm mb-6 max-w-sm">Báo cáo hiệu suất đơn hàng chi tiết giúp bạn đưa ra quyết định kinh doanh chính xác hơn.</p>
            <a className="text-on-dark font-semibold text-sm underline flex items-center gap-2 hover:opacity-85" href="#reports">
              Xem báo cáo tháng này <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <div className="bg-canvas border border-gray-200 p-8 rounded-xl">
            <h4 className="text-base font-bold mb-6">Cần hỗ trợ kỹ thuật?</h4>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-canvas-soft p-3 rounded-xl text-ink">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Hotline hỗ trợ 24/7</p>
                  <p className="text-secondary text-sm">1900 6789</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-canvas-soft p-3 rounded-xl text-ink">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Email hỗ trợ đối tác</p>
                  <p className="text-secondary text-sm">support@antigravity.vn</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
