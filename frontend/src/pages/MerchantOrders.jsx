import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { OrderService } from '../services/api';
import { Search, Plus, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export default function MerchantOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Trạng thái Tìm kiếm, Lọc và Phân trang
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const res = await OrderService.getOrders();
        if (res.success) {
          setOrders(res.data || []);
        } else {
          setError(res.message || 'Không thể lấy danh sách đơn hàng.');
        }
      } catch (err) {
        console.error("Fetch Orders Error:", err);
        setError('Không thể kết nối đến máy chủ.');
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  // Lọc đơn hàng theo tìm kiếm và bộ lọc trạng thái
  const filteredOrders = orders.filter(order => {
    // 1. Tìm kiếm text
    const matchesSearch = 
      order.MaDonHang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.TenNguoiNhan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.SoDienThoaiNhan?.includes(searchTerm);

    // 2. Bộ lọc trạng thái
    if (activeFilter === 'ALL') return matchesSearch;
    if (activeFilter === 'CHO_LAY_HANG') return matchesSearch && order.TrangThaiHienTai === 'CHO_LAY_HANG';
    if (activeFilter === 'DANG_VAN_CHUYEN') return matchesSearch && (order.TrangThaiHienTai === 'DANG_VAN_CHUYEN' || order.TrangThaiHienTai === 'DA_LAY_HANG');
    if (activeFilter === 'GIAO_THANH_CONG') return matchesSearch && order.TrangThaiHienTai === 'GIAO_THANH_CONG';
    if (activeFilter === 'DA_HUY') return matchesSearch && order.TrangThaiHienTai === 'DA_HUY';

    return matchesSearch;
  });

  // Phân trang
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage) || 1;

  // Đổi trang
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Kiểu dáng chip trạng thái
  const getStatusStyle = (status) => {
    switch (status) {
      case 'GIAO_THANH_CONG':
        return 'bg-green-50 text-green-700 border border-green-100';
      case 'DANG_VAN_CHUYEN':
      case 'DA_LAY_HANG':
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
      case 'DA_LAY_HANG': return 'Đã lấy hàng';
      case 'CHO_LAY_HANG': return 'Chờ lấy hàng';
      case 'DA_HUY': return 'Đã hủy';
      default: return status || 'Chờ xử lý';
    }
  };

  return (
    <div className="bg-canvas min-h-screen py-8 px-6 lg:px-16 animate-fadeIn">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-[32px] font-bold text-ink tracking-tight mb-1">Danh sách vận đơn</h1>
          <p className="text-secondary text-sm">Tổng cộng {orders.length} đơn hàng</p>
        </div>
        <button
          onClick={() => navigate('/merchant/order/new')}
          className="bg-primary text-on-primary px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-all active:scale-95 text-sm flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Tạo vận đơn mới
        </button>
      </header>

      {error && (
        <div className="bg-amber-50 text-amber-800 text-sm p-4 rounded-xl mb-8 border border-amber-100">
          {error}
        </div>
      )}

      {/* Search & Filter Bar */}
      <section className="mb-8 flex flex-col gap-4">
        {/* Tìm kiếm */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset về trang 1
            }}
            placeholder="Tìm kiếm mã vận đơn, người nhận, số điện thoại..."
            className="w-full h-14 bg-canvas-soft border-none focus:ring-1 focus:ring-primary pl-12 pr-4 text-sm rounded-none text-ink placeholder-mute"
          />
        </div>

        {/* Bộ lọc trạng thái */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'CHO_LAY_HANG', label: 'Chờ lấy hàng' },
            { id: 'DANG_VAN_CHUYEN', label: 'Đang vận chuyển' },
            { id: 'GIAO_THANH_CONG', label: 'Giao thành công' },
            { id: 'DA_HUY', label: 'Đã hủy' }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                setActiveFilter(filter.id);
                setCurrentPage(1); // Reset về trang 1
              }}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                activeFilter === filter.id
                  ? 'bg-primary text-on-primary'
                  : 'bg-canvas-soft text-ink hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {/* Data Table */}
      <section className="w-full overflow-x-auto bg-canvas border border-gray-200 rounded-xl">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="py-4 px-6 text-xs font-semibold text-secondary uppercase">Mã vận đơn</th>
              <th className="py-4 px-6 text-xs font-semibold text-secondary uppercase">Ngày tạo</th>
              <th className="py-4 px-6 text-xs font-semibold text-secondary uppercase">Người nhận</th>
              <th className="py-4 px-6 text-xs font-semibold text-secondary uppercase">Số điện thoại</th>
              <th className="py-4 px-6 text-xs font-semibold text-secondary uppercase">Địa chỉ giao</th>
              <th className="py-4 px-6 text-xs font-semibold text-secondary uppercase">Cước phí</th>
              <th className="py-4 px-6 text-xs font-semibold text-secondary uppercase">Thu hộ (COD)</th>
              <th className="py-4 px-6 text-xs font-semibold text-secondary uppercase">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-secondary text-sm">
                  Đang tải dữ liệu vận đơn...
                </td>
              </tr>
            ) : currentOrders.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-secondary text-sm">
                  Không tìm thấy vận đơn nào khớp với bộ lọc.
                </td>
              </tr>
            ) : (
              currentOrders.map((order) => (
                <tr
                  key={order.MaDonHang}
                  onClick={() => navigate(`/tracking?code=${order.MaDonHang}`)}
                  className="hover:bg-canvas-soft/50 transition-colors cursor-pointer group"
                >
                  <td className="py-5 px-6 font-semibold text-ink">{order.MaDonHang}</td>
                  <td className="py-5 px-6 text-secondary text-sm">
                    {order.NgayTao ? new Date(order.NgayTao).toLocaleDateString('vi-VN') : 'N/A'}
                  </td>
                  <td className="py-5 px-6 font-semibold text-ink">{order.TenNguoiNhan}</td>
                  <td className="py-5 px-6 text-secondary text-sm">{order.SoDienThoaiNhan}</td>
                  <td className="py-5 px-6 text-secondary text-sm max-w-[200px] truncate" title={order.DiaChiNhan}>
                    {order.DiaChiNhan}
                  </td>
                  <td className="py-5 px-6 text-ink">{(order.PhiVanChuyen || 0).toLocaleString()} đ</td>
                  <td className="py-5 px-6 font-semibold text-ink">{(order.TienThuHoCOD || 0).toLocaleString()} đ</td>
                  <td className="py-5 px-6">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(order.TrangThaiHienTai)}`}>
                      {getStatusText(order.TrangThaiHienTai)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Pagination Controls */}
      <footer className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-secondary text-xs">
          Hiển thị {currentOrders.length} trên {filteredOrders.length} vận đơn
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-6 py-2 border border-gray-200 rounded-full text-xs font-semibold hover:bg-canvas-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Trước
          </button>
          
          <div className="flex items-center gap-1 px-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all ${
                  currentPage === pageNum
                    ? 'bg-primary text-on-primary'
                    : 'text-ink hover:bg-canvas-soft'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-6 py-2 border border-gray-200 rounded-full text-xs font-semibold hover:bg-canvas-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Sau
          </button>
        </div>
      </footer>
    </div>
  );
}
