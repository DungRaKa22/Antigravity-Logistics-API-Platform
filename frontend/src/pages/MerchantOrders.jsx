import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { OrderService, TrackingService, BACKEND_URL } from '../services/api';
import { printWaybill } from '../utils/waybill';
import { Search, Plus, ChevronLeft, ChevronRight, Filter, X, MapPin, Package, Phone, Truck, ShieldCheck, DollarSign, Loader2, Navigation, CheckCircle2, Printer } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchRouteGeometry } from '../utils/routing';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Neon Purple Pulsing DivIcons
const purplePulsingIcon = L.divIcon({
  className: 'custom-leaflet-pulsing-icon',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute w-6 h-6 bg-[#5E0ED7] rounded-full animate-ping opacity-30"></div>
    <div class="relative w-4 h-4 bg-[#5E0ED7] border-2 border-white rounded-full shadow-[0_0_10px_rgba(94,14,215,0.4)]"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const destinationNeonIcon = L.divIcon({
  className: 'custom-leaflet-dest-icon',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute w-8 h-8 bg-purple-500 rounded-full animate-pulse opacity-20"></div>
    <div class="relative w-5 h-5 bg-white border-3 border-[#5E0ED7] rounded-full shadow-[0_0_12px_rgba(94,14,215,0.3)] flex items-center justify-center">
      <div class="w-1.5 h-1.5 bg-[#5E0ED7] rounded-full"></div>
    </div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const hubNeonIcon = L.divIcon({
  className: 'custom-leaflet-hub-icon',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute w-8 h-8 bg-amber-500 rounded-full animate-ping opacity-35"></div>
    <div class="relative w-5 h-5 bg-[#140b27] border-3 border-amber-400 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.8)] flex items-center justify-center">
      <div class="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
    </div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// ChangeView component to dynamically fit bounds of geocoded markers
function ChangeView({ center, zoom, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, bounds, map]);
  return null;
}

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

  // Modal Chi tiết Đơn hàng
  const [selectedOrderCode, setSelectedOrderCode] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [orderDetail, setOrderDetail] = useState(null);
  const [modalSenderCoords, setModalSenderCoords] = useState(null);
  const [modalReceiverCoords, setModalReceiverCoords] = useState(null);
  const [modalRouteGeometry, setModalRouteGeometry] = useState(null); // OSRM real road geometry for modal
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const startEdit = () => {
    setEditFormData({
      receiver_name: orderDetail.receiver_name || '',
      receiver_phone: orderDetail.receiver_phone || '',
      receiver_address: orderDetail.receiver_address || '',
      sender_address: orderDetail.sender_address || '',
      description: orderDetail.description || '',
      weight_gram: orderDetail.weight_gram || 1000,
      length_cm: orderDetail.length_cm || 10,
      width_cm: orderDetail.width_cm || 10,
      height_cm: orderDetail.height_cm || 10,
      cod_amount: orderDetail.cod_amount || 0,
      declared_value: orderDetail.declared_value || 0,
      inspection_policy: orderDetail.inspection_policy || 'KHONG_XEM',
      pickup_type: orderDetail.pickup_type || 'TU_MANG_RA_BUU_CUC',
    });
    setIsEditing(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await OrderService.updateOrder(orderDetail.order_id, editFormData);
      if (res.success) {
        alert('Cập nhật vận đơn thành công!');
        setIsEditing(false);
        // Load lại chi tiết vận đơn
        handleRowClick(orderDetail.order_id);
        // Cập nhật lại danh sách vận đơn chính
        const updatedOrders = await OrderService.getOrders();
        if (updatedOrders.success) {
          setOrders(updatedOrders.data || []);
        }
      } else {
        alert(res.message || 'Lỗi khi cập nhật vận đơn.');
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi kết nối đến máy chủ.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
    setModalLoading(true);
    try {
      const res = await OrderService.cancelOrder(orderDetail.order_id);
      if (res.success) {
        alert('Hủy đơn hàng thành công!');
        setIsModalOpen(false);
        setOrderDetail(null);
        // Cập nhật lại danh sách vận đơn chính
        const updatedOrders = await OrderService.getOrders();
        if (updatedOrders.success) {
          setOrders(updatedOrders.data || []);
        }
      } else {
        alert(res.message || 'Lỗi khi hủy đơn hàng.');
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi kết nối đến máy chủ.');
    } finally {
      setModalLoading(false);
    }
  };

  const handlePaymentRedirect = () => {
    const paymentUrl = `${BACKEND_URL}/api/payment/simulate-checkout/${orderDetail.order_id}`;
    window.open(paymentUrl, '_blank');
  };

  // Trạm trung chuyển tọa độ và cấu hình vùng miền
  const HUBS = {
    BAC: {
      name: 'Kho Trung Chuyển Miền Bắc (Từ Sơn, Bắc Ninh)',
      coords: [21.1155, 105.9964]
    },
    TRUNG: {
      name: 'Kho Trung Chuyển Miền Trung (An Tây, Quảng Ngãi)',
      coords: [15.1205, 108.7925]
    },
    NAM: {
      name: 'Kho Trung Chuyển Miền Nam (Bình Hòa, TP.HCM)',
      coords: [10.9325, 106.7215]
    }
  };

  const getRegion = (coords) => {
    if (!coords) return 'BAC';
    const lat = coords[0];
    if (lat >= 19.5) return 'BAC';
    if (lat >= 14.0) return 'TRUNG';
    return 'NAM';
  };

  const senderRegion = modalSenderCoords ? getRegion(modalSenderCoords) : null;
  const receiverRegion = modalReceiverCoords ? getRegion(modalReceiverCoords) : null;

  const originHub = senderRegion ? HUBS[senderRegion] : null;
  const destHub = receiverRegion ? HUBS[receiverRegion] : null;

  const plannedHubs = [];
  const isDirect = orderDetail && orderDetail.distance_km < 10.0;
  if (!isDirect) {
    if (originHub) {
      plannedHubs.push(originHub);
      if (senderRegion !== receiverRegion && destHub) {
        plannedHubs.push(destHub);
      }
    }
  }

  const geocodeAddress = async (address) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Antigravity-Logistics/1.0' } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      }
    } catch (e) {
      console.error("Geocoding failed for address: " + address, e);
    }
    return null;
  };

  const handleRowClick = async (orderCode) => {
    setSelectedOrderCode(orderCode);
    setIsModalOpen(true);
    setModalLoading(true);
    setModalError('');
    setOrderDetail(null);
    setModalSenderCoords(null);
    setModalReceiverCoords(null);
    setModalRouteGeometry(null);
    setIsEditing(false);

    try {
      const res = await TrackingService.trackOrder(orderCode);
      if (res.success && res.data) {
        setOrderDetail(res.data);
        
        // Prioritize coordinates from database
        if (res.data.sender_lat !== undefined && res.data.sender_lat !== null &&
            res.data.sender_lng !== undefined && res.data.sender_lng !== null) {
          setModalSenderCoords([res.data.sender_lat, res.data.sender_lng]);
        } else {
          geocodeAddress(res.data.sender_address).then(coords => {
            if (coords) setModalSenderCoords(coords);
          });
        }
        
        if (res.data.receiver_lat !== undefined && res.data.receiver_lat !== null &&
            res.data.receiver_lng !== undefined && res.data.receiver_lng !== null) {
          setModalReceiverCoords([res.data.receiver_lat, res.data.receiver_lng]);
        } else {
          // Add a 1200ms delay for geocoding the receiver to satisfy Nominatim's 1 req/sec rate limit
          setTimeout(() => {
            geocodeAddress(res.data.receiver_address).then(coords => {
              if (coords) setModalReceiverCoords(coords);
            });
          }, 1200);
        }
      } else {
        setModalError(res.message || 'Không thể lấy thông tin chi tiết đơn hàng.');
      }
    } catch (err) {
      console.error(err);
      setModalError('Lỗi kết nối đến máy chủ.');
    } finally {
      setModalLoading(false);
    }
  };

  // Fetch OSRM real road geometry for the modal map
  useEffect(() => {
    if (modalSenderCoords && modalReceiverCoords && senderRegion && receiverRegion) {
      setModalRouteGeometry(null);
      const waypoints = [modalSenderCoords];
      plannedHubs.forEach(hub => waypoints.push(hub.coords));
      waypoints.push(modalReceiverCoords);

      fetchRouteGeometry(waypoints).then((geometry) => {
        if (geometry && geometry.length > 0) {
          setModalRouteGeometry(geometry);
        }
      });
    }
  }, [modalSenderCoords, modalReceiverCoords, senderRegion, receiverRegion]);

  const polylineCoords = modalRouteGeometry || (modalSenderCoords && modalReceiverCoords 
    ? [
        modalSenderCoords,
        ...plannedHubs.map(hub => hub.coords),
        modalReceiverCoords
      ]
    : null);

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
    if (activeFilter === 'CHO_THANH_TOAN') return matchesSearch && order.TrangThaiHienTai === 'CHO_THANH_TOAN';
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
        return 'bg-emerald-50 text-emerald-700 text-glow-green border border-emerald-500/20 neon-border-green px-3 py-1 font-black';
      case 'DANG_VAN_CHUYEN':
      case 'DA_LAY_HANG':
        return 'bg-purple-50 text-accent-purple text-glow-purple border border-accent-purple/20 neon-border-purple px-3 py-1 font-black';
      case 'CHO_LAY_HANG':
        return 'bg-amber-50 text-amber-700 text-glow-amber border border-amber-500/20 neon-border-amber px-3 py-1 font-black';
      case 'CHO_THANH_TOAN':
        return 'bg-blue-50 text-blue-700 text-glow-blue border border-blue-500/20 neon-border-blue px-3 py-1 font-black';
      case 'DA_HUY':
        return 'bg-rose-50 text-rose-700 text-glow-rose border border-rose-500/20 neon-border-rose px-3 py-1 font-black';
      default:
        return 'bg-black/5 text-mute border border-black/10 px-3 py-1';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'GIAO_THANH_CONG': return 'Giao thành công';
      case 'DANG_VAN_CHUYEN': return 'Đang vận chuyển';
      case 'DA_LAY_HANG': return 'Đã lấy hàng';
      case 'CHO_LAY_HANG': return 'Chờ lấy hàng';
      case 'CHO_THANH_TOAN': return 'Chờ thanh toán';
      case 'DA_HUY': return 'Đã hủy';
      default: return status || 'Chờ xử lý';
    }
  };

  return (
    <div className="w-full relative animate-fade-in">
      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 mb-8 rounded-r-2xl shadow-sm relative z-10">
          <div className="text-sm font-semibold text-rose-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <section className="mb-8 flex flex-col gap-4 relative z-10">
        {/* Tìm kiếm */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent-purple" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset về trang 1
            }}
            placeholder="Tìm kiếm mã vận đơn, người nhận, số điện thoại..."
            className="w-full h-14 input-neon pl-12 pr-4 text-xs font-bold uppercase tracking-wider rounded-none"
          />
        </div>

        {/* Bộ lọc trạng thái */}
        <div className="flex flex-wrap items-center gap-2.5">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'CHO_THANH_TOAN', label: 'Chờ thanh toán' },
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
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                activeFilter === filter.id
                  ? 'bg-accent-purple text-white shadow-[0_4px_12px_rgba(94,14,215,0.22)] border border-black/10'
                  : 'bg-black/5 text-mute border border-black/10 hover:bg-black/10 hover:text-black'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {/* Data Table */}
      <section className="w-full overflow-x-auto bg-white border border-black/10 rounded-xl relative z-10 shadow-[0_4px_30px_rgba(0,0,0,0.03)] glow-card">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="border-b border-black/10 bg-black/5">
              <th className="py-4 px-6 text-[10px] font-black text-mute uppercase tracking-widest">Mã vận đơn</th>
              <th className="py-4 px-6 text-[10px] font-black text-mute uppercase tracking-widest">Ngày tạo</th>
              <th className="py-4 px-6 text-[10px] font-black text-mute uppercase tracking-widest">Người nhận</th>
              <th className="py-4 px-6 text-[10px] font-black text-mute uppercase tracking-widest">Số điện thoại</th>
              <th className="py-4 px-6 text-[10px] font-black text-mute uppercase tracking-widest">Địa chỉ giao</th>
              <th className="py-4 px-6 text-[10px] font-black text-mute uppercase tracking-widest">Cước phí</th>
              <th className="py-4 px-6 text-[10px] font-black text-mute uppercase tracking-widest">Thu hộ (COD)</th>
              <th className="py-4 px-6 text-[10px] font-black text-mute uppercase tracking-widest">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 text-xs text-black">
            {loading ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-mute font-bold uppercase tracking-widest animate-pulse">
                  Đang tải dữ liệu vận đơn...
                </td>
              </tr>
            ) : currentOrders.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-mute font-bold uppercase tracking-wider">
                  Không tìm thấy vận đơn nào khớp với bộ lọc.
                </td>
              </tr>
            ) : (
              currentOrders.map((order) => (
                <tr
                  key={order.MaDonHang}
                  onClick={() => handleRowClick(order.MaDonHang)}
                  className="hover:bg-black/5 transition-colors cursor-pointer group text-xs"
                >
                  <td className="py-5 px-6 font-black uppercase tracking-wider text-glow">{order.MaDonHang}</td>
                  <td className="py-5 px-6 text-mute font-semibold">
                    {order.NgayTao ? new Date(order.NgayTao).toLocaleDateString('vi-VN') : 'N/A'}
                  </td>
                  <td className="py-5 px-6 font-bold">{order.TenNguoiNhan}</td>
                  <td className="py-5 px-6 text-mute font-semibold">{order.SoDienThoaiNhan}</td>
                  <td className="py-5 px-6 text-mute font-semibold max-w-[200px] truncate" title={order.DiaChiNhan}>
                    {order.DiaChiNhan}
                  </td>
                  <td className="py-5 px-6 font-bold">{(order.PhiVanChuyen || 0).toLocaleString()} đ</td>
                  <td className="py-5 px-6 font-black text-accent-purple text-glow">{(order.TienThuHoCOD || 0).toLocaleString()} đ</td>
                  <td className="py-5 px-6">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusStyle(order.TrangThaiHienTai)}`}>
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
      <footer className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
        <span className="text-mute text-[10px] font-black uppercase tracking-widest">
          Hiển thị {currentOrders.length} trên {filteredOrders.length} vận đơn
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-5 py-2 bg-black/5 border border-black/10 hover:bg-black/10 hover:text-black text-[10px] font-black uppercase tracking-widest rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-black"
          >
            Trước
          </button>
          
          <div className="flex items-center gap-1 px-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-8 h-8 flex items-center justify-center rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-accent-purple text-white shadow-[0_4px_12px_rgba(94,14,215,0.25)] border border-black/10'
                    : 'text-mute hover:bg-black/5 hover:text-black'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-5 py-2 bg-black/5 border border-black/10 hover:bg-black/10 hover:text-black text-[10px] font-black uppercase tracking-widest rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-black"
          >
            Sau
          </button>
        </div>
      </footer>

      {/* Premium Light Studio Order Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-2xl border border-black/10 rounded-[28px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative animate-scaleUp">
            
            {/* Modal Header */}
            <header className="flex justify-between items-center px-8 py-5 border-b border-black/5 bg-black/[0.01]">
              <div>
                <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest block mb-0.5">Order Detail Ledger</span>
                <h2 className="text-xl font-black text-black tracking-widest uppercase font-display flex items-center gap-2 text-glow">
                  Chi tiết vận đơn <span className="text-accent-purple font-black">{selectedOrderCode}</span>
                </h2>
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setOrderDetail(null);
                }}
                className="p-2 hover:bg-black/5 rounded-full text-mute hover:text-black transition-all cursor-pointer border border-black/10"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {modalLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-accent-purple" />
                  <span className="text-xs font-black uppercase tracking-widest text-mute animate-pulse">Đang tải chi tiết vận đơn...</span>
                </div>
              ) : modalError ? (
                <div className="py-20 text-center text-red-600 font-bold uppercase tracking-wider">
                  {modalError}
                </div>
              ) : isEditing ? (
                <form onSubmit={handleUpdateSubmit} className="flex flex-col gap-6 text-xs text-black">
                  <div className="bg-black/5 border border-black/10 p-4 rounded-2xl flex justify-between items-center">
                    <div>
                      <span className="text-[9px] text-mute uppercase font-black tracking-widest">Đang chỉnh sửa vận đơn:</span>
                      <p className="text-sm font-black text-accent-purple uppercase tracking-wider text-glow mt-0.5">
                        {orderDetail.order_id}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-1.5 bg-black/5 border border-black/10 hover:bg-black/10 text-black text-[9px] font-black uppercase tracking-widest rounded-full transition-all cursor-pointer"
                    >
                      Hủy Sửa
                    </button>
                  </div>

                  {/* Form fields grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left side: Receiver & Description */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-accent-purple border-b border-black/5 pb-2">
                        Thông tin người nhận
                      </h4>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Tên người nhận</label>
                        <input
                          type="text"
                          value={editFormData.receiver_name}
                          onChange={(e) => setEditFormData({...editFormData, receiver_name: e.target.value})}
                          className="w-full h-10 border border-black/10 px-3 focus:outline-none focus:border-accent-purple text-xs text-black font-semibold tracking-wider rounded-lg"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Số điện thoại nhận</label>
                        <input
                          type="text"
                          value={editFormData.receiver_phone}
                          onChange={(e) => setEditFormData({...editFormData, receiver_phone: e.target.value})}
                          className="w-full h-10 border border-black/10 px-3 focus:outline-none focus:border-accent-purple text-xs text-black font-semibold tracking-wider rounded-lg"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Địa chỉ nhận hàng</label>
                        <input
                          type="text"
                          value={editFormData.receiver_address}
                          onChange={(e) => setEditFormData({...editFormData, receiver_address: e.target.value})}
                          className="w-full h-10 border border-black/10 px-3 focus:outline-none focus:border-accent-purple text-xs text-black font-semibold tracking-wider rounded-lg"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Mô tả hàng hóa</label>
                        <input
                          type="text"
                          value={editFormData.description}
                          onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                          className="w-full h-10 border border-black/10 px-3 focus:outline-none focus:border-accent-purple text-xs text-black font-semibold tracking-wider rounded-lg"
                          required
                        />
                      </div>
                    </div>

                    {/* Right side: Package Spec & Financials */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-accent-purple border-b border-black/5 pb-2">
                        Thông số hàng hóa & Tài chính
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-bold text-mute uppercase tracking-widest">Dài (cm)</label>
                          <input
                            type="number"
                            value={editFormData.length_cm}
                            onChange={(e) => setEditFormData({...editFormData, length_cm: parseInt(e.target.value) || 0})}
                            className="w-full h-10 border border-black/10 px-3 focus:outline-none focus:border-accent-purple text-xs text-black font-semibold tracking-wider rounded-lg text-center"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-bold text-mute uppercase tracking-widest">Rộng (cm)</label>
                          <input
                            type="number"
                            value={editFormData.width_cm}
                            onChange={(e) => setEditFormData({...editFormData, width_cm: parseInt(e.target.value) || 0})}
                            className="w-full h-10 border border-black/10 px-3 focus:outline-none focus:border-accent-purple text-xs text-black font-semibold tracking-wider rounded-lg text-center"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-bold text-mute uppercase tracking-widest">Cao (cm)</label>
                          <input
                            type="number"
                            value={editFormData.height_cm}
                            onChange={(e) => setEditFormData({...editFormData, height_cm: parseInt(e.target.value) || 0})}
                            className="w-full h-10 border border-black/10 px-3 focus:outline-none focus:border-accent-purple text-xs text-black font-semibold tracking-wider rounded-lg text-center"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Khối lượng (g)</label>
                          <input
                            type="number"
                            value={editFormData.weight_gram}
                            onChange={(e) => setEditFormData({...editFormData, weight_gram: parseInt(e.target.value) || 0})}
                            className="w-full h-10 border border-black/10 px-3 focus:outline-none focus:border-accent-purple text-xs text-black font-semibold tracking-wider rounded-lg"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Hình thức lấy</label>
                          <select
                            value={editFormData.pickup_type}
                            onChange={(e) => setEditFormData({...editFormData, pickup_type: e.target.value})}
                            className="w-full h-10 border border-black/10 px-3 focus:outline-none focus:border-accent-purple text-xs text-black font-bold tracking-wider rounded-lg"
                          >
                            <option value="TU_MANG_RA_BUU_CUC">Mang ra bưu cục</option>
                            <option value="BUU_TA_LAY_HANG">Bưu tá lấy hàng</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-mute uppercase tracking-widest">COD (đ)</label>
                          <input
                            type="number"
                            value={editFormData.cod_amount}
                            onChange={(e) => setEditFormData({...editFormData, cod_amount: parseFloat(e.target.value) || 0})}
                            className="w-full h-10 border border-black/10 px-3 focus:outline-none focus:border-accent-purple text-xs text-black font-semibold tracking-wider rounded-lg"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Khai giá (đ)</label>
                          <input
                            type="number"
                            value={editFormData.declared_value}
                            onChange={(e) => setEditFormData({...editFormData, declared_value: parseFloat(e.target.value) || 0})}
                            className="w-full h-10 border border-black/10 px-3 focus:outline-none focus:border-accent-purple text-xs text-black font-semibold tracking-wider rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Chính sách kiểm hàng</label>
                        <select
                          value={editFormData.inspection_policy}
                          onChange={(e) => setEditFormData({...editFormData, inspection_policy: e.target.value})}
                          className="w-full h-10 border border-black/10 px-3 focus:outline-none focus:border-accent-purple text-xs text-black font-bold tracking-wider rounded-lg"
                        >
                          <option value="KHONG_XEM">Không xem hàng</option>
                          <option value="XEM_KHONG_THU">Xem không thử</option>
                          <option value="CHO_THU_HANG">Cho thử hàng</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-black/5 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-5 py-2.5 bg-black/5 border border-black/10 hover:bg-black/10 text-black text-[10px] font-black uppercase tracking-widest rounded-full transition-all cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="px-6 py-2.5 bg-accent-purple hover:bg-[#701edd] text-white text-[10px] font-black uppercase tracking-widest rounded-full transition-all cursor-pointer shadow-[0_4px_12px_rgba(94,14,215,0.22)]"
                    >
                      {modalLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                    </button>
                  </div>
                </form>
              ) : orderDetail ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Details Grid */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    {/* Status Ribbon */}
                    <div className="bg-black/5 border border-black/10 p-4 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[9px] text-mute uppercase font-black tracking-widest">Trạng thái hiện tại:</span>
                        <p className="text-sm font-black text-accent-purple uppercase tracking-wider text-glow mt-0.5">
                          {getStatusText(orderDetail.current_status)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-mute uppercase font-black tracking-widest">Dịch vụ:</span>
                        <p className="font-bold text-black uppercase mt-0.5">{orderDetail.service_package || 'STANDARD'}</p>
                      </div>
                    </div>

                    {/* Sender & Receiver Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Sender */}
                      <div className="bg-black/[0.02] border border-black/5 p-5 rounded-2xl">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-accent-purple mb-3 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> Người gửi
                        </h4>
                        <div className="space-y-1 text-xs">
                          <p className="font-bold text-black">{orderDetail.sender_name}</p>
                          <p className="text-mute font-semibold">{orderDetail.sender_phone}</p>
                          <p className="text-mute font-semibold leading-relaxed mt-1">{orderDetail.sender_address}</p>
                        </div>
                      </div>
                      
                      {/* Receiver */}
                      <div className="bg-black/[0.02] border border-black/5 p-5 rounded-2xl">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-accent-purple mb-3 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> Người nhận
                        </h4>
                        <div className="space-y-1 text-xs">
                          <p className="font-bold text-black">{orderDetail.receiver_name}</p>
                          <p className="text-mute font-semibold">{orderDetail.receiver_phone}</p>
                          <p className="text-mute font-semibold leading-relaxed mt-1">{orderDetail.receiver_address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Package Specs */}
                    <div className="border border-black/10 rounded-2xl p-6 space-y-4 shadow-sm">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-black flex items-center gap-1.5 border-b border-black/5 pb-2.5">
                        <Package className="w-4 h-4 text-accent-purple" /> Thuộc tính hàng hóa
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                        <div className="col-span-2 md:col-span-3">
                          <span className="text-[9px] text-mute uppercase font-black tracking-widest">Mô tả:</span>
                          <p className="font-semibold text-black mt-0.5">{orderDetail.description || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-mute uppercase font-black tracking-widest">Khối lượng:</span>
                          <p className="font-semibold text-black mt-0.5">{(orderDetail.weight_gram || 0).toLocaleString()} g</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-mute uppercase font-black tracking-widest">Khối lượng quy đổi:</span>
                          <p className="font-semibold text-black mt-0.5">{(orderDetail.volumetric_weight_gram || 0).toLocaleString()} g</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-mute uppercase font-black tracking-widest">Kích thước (DxRxC):</span>
                          <p className="font-semibold text-black mt-0.5">{orderDetail.length_cm} x {orderDetail.width_cm} x {orderDetail.height_cm} cm</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-mute uppercase font-black tracking-widest">Chính sách:</span>
                          <p className="font-semibold text-black mt-0.5 uppercase tracking-wide text-[10px]">{orderDetail.inspection_policy === 'KHONG_XEM' ? 'Không xem hàng' : orderDetail.inspection_policy === 'XEM_KHONG_THU' ? 'Xem không thử' : 'Thử hàng'}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-mute uppercase font-black tracking-widest">Hình thức lấy:</span>
                          <p className="font-semibold text-black mt-0.5 uppercase tracking-wide text-[10px]">{orderDetail.pickup_type === 'TU_MANG_RA_BUU_CUC' ? 'Mang ra bưu cục' : 'Bưu tá lấy hàng'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="border border-black/10 rounded-2xl p-6 bg-accent-purple/[0.01] space-y-4 shadow-sm border-dashed">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-black flex items-center gap-1.5 border-b border-black/5 pb-2.5">
                        <DollarSign className="w-4 h-4 text-accent-purple" /> Bảng kê cước phí
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-[9px] text-mute uppercase font-black tracking-widest">Cước ship:</span>
                          <p className="font-bold text-black mt-0.5">{(orderDetail.shipping_fee || 0).toLocaleString()} đ</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-mute uppercase font-black tracking-widest">Phí bảo hiểm:</span>
                          <p className="font-bold text-black mt-0.5">{(orderDetail.insurance_fee || 0).toLocaleString()} đ</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-mute uppercase font-black tracking-widest">Tiền thu hộ COD:</span>
                          <p className="font-black text-accent-purple text-glow-purple mt-0.5 font-display">{(orderDetail.cod_amount || 0).toLocaleString()} đ</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-mute uppercase font-black tracking-widest">Tổng chi phí:</span>
                          <p className="font-black text-black text-glow mt-0.5">{( (orderDetail.shipping_fee || 0) + (orderDetail.insurance_fee || 0) ).toLocaleString()} đ</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Maps & Timeline */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Holographic 3D Box Visualizer */}
                    <div className="scene3d neon-glow-grid relative w-full h-36 rounded-2xl border border-black/10 overflow-hidden bg-[#090314]/95 flex items-center justify-center shrink-0">
                      <div className="absolute inset-0 bg-[radial-gradient(rgba(139,92,246,0.15)_1.5px,transparent_1.5px)] bg-[size:16px_16px] pointer-events-none" />
                      
                      <div className="cube3d" style={{
                        '--w-3d': `${Math.min(130, Math.max(35, (parseInt(orderDetail.length_cm) || 10) * 2.2))}px`,
                        '--h-3d': `${Math.min(130, Math.max(6, (parseInt(orderDetail.height_cm) || 10) * 2.2))}px`,
                        '--d-3d': `${Math.min(130, Math.max(35, (parseInt(orderDetail.width_cm) || 10) * 2.2))}px`,
                      }}>
                        <div className="face3d face3d-front">
                          <span className="face3d-label" style={{ fontSize: '7px' }}>FRONT</span>
                          <span className="text-[8px] font-extrabold text-purple-300 mt-0.5">{orderDetail.length_cm}cm</span>
                        </div>
                        <div className="face3d face3d-back">
                          <span className="face3d-label" style={{ fontSize: '7px' }}>BACK</span>
                        </div>
                        <div className="face3d face3d-left">
                          <span className="face3d-label" style={{ fontSize: '7px' }}>LEFT</span>
                          <span className="text-[8px] font-extrabold text-purple-300 mt-0.5">{orderDetail.width_cm}cm</span>
                        </div>
                        <div className="face3d face3d-right">
                          <span className="face3d-label" style={{ fontSize: '7px' }}>RIGHT</span>
                        </div>
                        <div className="face3d face3d-top">
                          <span className="face3d-label" style={{ fontSize: '6px' }}>TOP</span>
                          <span className="text-[7px] font-extrabold text-purple-300">{orderDetail.length_cm}x{orderDetail.width_cm}</span>
                        </div>
                        <div className="face3d face3d-bottom">
                          <span className="face3d-label" style={{ fontSize: '7px' }}>BOTTOM</span>
                        </div>
                      </div>

                      <div className="absolute top-3 left-3 flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                        <span className="text-[8px] font-black text-emerald-400 tracking-wider uppercase">Chi tiết bưu phẩm 3D</span>
                      </div>

                      <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-white/95 backdrop-blur-md rounded-full text-[8px] font-black tracking-widest text-black border border-black/5 shadow-md">
                        THỂ TÍCH: {(((parseInt(orderDetail.length_cm) || 10) * (parseInt(orderDetail.width_cm) || 10) * (parseInt(orderDetail.height_cm) || 10)) / 1000).toFixed(1)} Lít
                      </div>
                    </div>

                    {/* Live Routing Map */}
                    <div className="w-full h-48 border border-black/10 rounded-2xl overflow-hidden relative shadow-inner">
                      <MapContainer 
                        center={modalSenderCoords || [21.0285, 105.8542]} 
                        zoom={modalSenderCoords && modalReceiverCoords ? 10 : 6} 
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />

                        <ChangeView 
                          center={modalSenderCoords || [21.0285, 105.8542]} 
                          bounds={polylineCoords} 
                        />
                        
                        {modalSenderCoords && (
                          <Marker position={modalSenderCoords} icon={purplePulsingIcon}>
                            <Popup>
                              <div className="text-black text-xs font-bold uppercase tracking-wider p-1">
                                <p className="text-accent-purple">📍 ĐIỂM GỬI (KHO LẤY HÀNG)</p>
                                <p className="text-[10px] text-mute mt-0.5">{orderDetail.sender_address}</p>
                              </div>
                            </Popup>
                          </Marker>
                        )}

                        {plannedHubs.map((hub, idx) => (
                          <Marker key={idx} position={hub.coords} icon={hubNeonIcon}>
                            <Popup>
                              <div className="text-black text-xs font-bold uppercase tracking-wider p-1">
                                <p className="text-amber-500">🏢 TRẠM TRUNG CHUYỂN KHO {getRegion(hub.coords) === 'BAC' ? 'BẮC' : getRegion(hub.coords) === 'TRUNG' ? 'TRUNG' : 'NAM'}</p>
                                <p className="text-black mt-1 font-semibold">{hub.name}</p>
                              </div>
                            </Popup>
                          </Marker>
                        ))}

                        {modalReceiverCoords && (
                          <Marker position={modalReceiverCoords} icon={destinationNeonIcon}>
                            <Popup>
                              <div className="text-black text-xs font-bold uppercase tracking-wider p-1">
                                <p className="text-accent-purple">📍 ĐIỂM NHẬN (KHÁCH HÀNG)</p>
                                <p className="text-[10px] text-mute mt-0.5">{orderDetail.receiver_address}</p>
                              </div>
                            </Popup>
                          </Marker>
                        )}
                        
                        {polylineCoords && (
                          <>
                            {/* Shadow glow layer */}
                            <Polyline 
                              positions={polylineCoords} 
                              color="#5E0ED7" 
                              weight={8} 
                              opacity={0.12} 
                              lineCap="round" 
                              lineJoin="round"
                            />
                            {/* Main route line */}
                            <Polyline 
                              positions={polylineCoords} 
                              color="#5E0ED7" 
                              weight={4} 
                              opacity={0.85} 
                              lineCap="round" 
                              lineJoin="round"
                            />
                          </>
                        )}
                      </MapContainer>
                      <div className="absolute top-2.5 left-2.5 z-[1000] bg-white/95 border border-black/10 px-2.5 py-1 rounded-lg shadow-sm text-[9px] font-black uppercase tracking-widest text-black flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-accent-purple" /> Sơ đồ định vị
                      </div>
                    </div>

                    {/* Timeline Stepper */}
                    <div className="border border-black/10 rounded-2xl p-6 flex flex-col gap-4 flex-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-black flex items-center gap-1.5 border-b border-black/5 pb-2.5">
                        <Truck className="w-4 h-4 text-accent-purple" /> Hành trình bưu phẩm
                      </h4>
                      <div className="flex flex-col gap-0 relative pl-3">
                        <div className="absolute left-[13.5px] top-2 bottom-2 w-[1.5px] bg-accent-purple/20 rounded-full z-0"></div>
                        
                        {orderDetail.timeline && orderDetail.timeline.length > 0 ? (
                          orderDetail.timeline.map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-start relative z-10 mb-4 last:mb-0">
                              <div className={`w-[9px] h-[9px] rounded-full shrink-0 mt-1.5 shadow-sm border ${idx === 0 ? 'bg-accent-purple border-accent-purple shadow-[0_0_8px_#5E0ED7]' : 'bg-white border-black/20'}`} />
                              <div className="flex-1 text-[11px]">
                                <h5 className={`font-black uppercase tracking-wider ${idx === 0 ? 'text-black text-glow-purple' : 'text-mute'}`}>
                                  {getStatusText(item.status)}
                                </h5>
                                <p className="text-mute font-medium leading-normal mt-0.5">{item.info}</p>
                                <span className="text-[9px] font-bold text-accent-purple/70 tracking-widest block mt-0.5">
                                  {new Date(item.time).toLocaleString('vi-VN')}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-mute font-bold uppercase tracking-widest">Chờ cập nhật...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            
            {/* Modal Footer */}
            <footer className="px-8 py-5 border-t border-black/5 bg-black/[0.01] flex justify-end gap-3 flex-wrap">
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setOrderDetail(null);
                  setIsEditing(false);
                }}
                className="px-5 py-2.5 bg-black/5 border border-black/10 hover:bg-black/10 text-black text-[10px] font-black uppercase tracking-widest rounded-full transition-all cursor-pointer"
              >
                Đóng
              </button>
              {orderDetail && !isEditing && (
                <>
                  {(orderDetail.current_status === 'CHO_THANH_TOAN' || orderDetail.current_status === 'CHO_LAY_HANG') && (
                    <>
                      <button
                        onClick={startEdit}
                        className="px-5 py-2.5 bg-blue-600/10 border border-blue-600/35 text-blue-600 hover:bg-blue-600 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-full transition-all cursor-pointer"
                      >
                        Sửa Đơn Hàng
                      </button>
                      <button
                        onClick={handleCancelOrder}
                        className="px-5 py-2.5 bg-rose-600/10 border border-rose-600/35 text-rose-600 hover:bg-rose-600 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-full transition-all cursor-pointer"
                      >
                        Hủy Đơn Hàng
                      </button>
                    </>
                  )}
                  {orderDetail.current_status === 'CHO_THANH_TOAN' && (
                    <button
                      onClick={handlePaymentRedirect}
                      className="px-6 py-2.5 bg-[#a50064]/10 border border-[#a50064]/35 text-[#a50064] hover:bg-[#a50064] hover:text-white text-[10px] font-black uppercase tracking-widest rounded-full transition-all cursor-pointer shadow-[0_2px_8px_rgba(165,0,100,0.06)]"
                    >
                      Thanh Toán Cước (Ví MoMo)
                    </button>
                  )}
                  <button 
                    onClick={() => printWaybill(orderDetail)}
                    className="px-6 py-2.5 bg-accent-purple/10 border border-[#5E0ED7]/35 text-[#5E0ED7] hover:bg-[#5E0ED7] hover:text-white text-[10px] font-black uppercase tracking-widest rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_2px_8px_rgba(94,14,215,0.06)]"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In Tem Vận Đơn (A6)</span>
                  </button>
                  <button 
                    onClick={() => navigate(`/tracking?code=${orderDetail.order_id}`)}
                    className="btn-primary px-6 py-2.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5 text-white" /> Link tra cứu công khai
                  </button>
                </>
              )}
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
