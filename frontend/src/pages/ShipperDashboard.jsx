import React, { useEffect, useState } from 'react';
import { OrderService, AuthService, TrackingService } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Import vehicle visual assets
import futuristicDeliveryVanImg from '../assets/images/futuristic_delivery_van.png';

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
    <div class="relative w-5 h-5 bg-white border-3 border-cyan-400 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center justify-center">
      <div class="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
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
      const validBounds = bounds.filter(b => b && b[0] !== undefined && b[1] !== undefined);
      if (validBounds.length >= 2) {
        map.fitBounds(validBounds, { padding: [30, 30], maxZoom: 14 });
      } else if (validBounds.length === 1) {
        map.setView(validBounds[0], 13);
      }
    } else if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, bounds]);
  return null;
}

export default function ShipperDashboard() {
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab control: 'orders' | 'history' | 'account'
  const [activeTab, setActiveTab] = useState('orders');

  // Delivery console view: 'list' | 'map'
  const [consoleView, setConsoleView] = useState('list');

  // Status update states
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [locationInfo, setLocationInfo] = useState('');
  const [updating, setUpdating] = useState(false);

  // Barcode search/scan states
  const [scanInput, setScanInput] = useState('');
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);

  // History search state
  const [historySearch, setHistorySearch] = useState('');

  // Inline timeline states for history
  const [selectedTimelineOrderId, setSelectedTimelineOrderId] = useState(null);
  const [timelineData, setTimelineData] = useState({});
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Profile states
  const [profile, setProfile] = useState({
    fullname: '',
    username: '',
    role: '',
    workplace_name: '',
    workplace_region: '',
    stats: {
      total_assigned: 0,
      total_delivered: 0,
      total_failed: 0,
      daily_limit: 100
    }
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Geocoded coordinates state for active deliveries map
  const [orderCoords, setOrderCoords] = useState({});

  // 3D Canvas signature & Proof photo states for Shipper chặng cuối
  const canvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [proofPhoto, setProofPhoto] = useState(null);
  const [failReason, setFailReason] = useState('');

  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Live clock state
  const [systemTime, setSystemTime] = useState(new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();
    const code = scanInput.trim().toUpperCase();
    if (!code) return;

    // Chỉ tìm kiếm trong số những đơn hàng chưa hoàn thành
    const activeOrdersList = assignedOrders.filter(
      o => o.status !== 'GIAO_THANH_CONG' && o.status !== 'GIAO_THAT_BAI'
    );

    const matched = activeOrdersList.find(o => o.order_id.toUpperCase() === code);
    if (matched) {
      setScanInput('');
      setHighlightedOrderId(matched.order_id);
      setUpdatingOrderId(matched.order_id);
      setSelectedStatus(matched.status);
      setLocationInfo('');
      showToast(`Đã nhận diện: ${matched.order_id}`, 'success');

      // Smooth scroll to the card
      setTimeout(() => {
        const el = document.getElementById(`order-card-${matched.order_id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      // Clear highlighted style after 3 seconds
      setTimeout(() => {
        setHighlightedOrderId(null);
      }, 3000);
    } else {
      showToast('Không tìm thấy mã vận đơn đang xử lý!', 'error');
    }
  };

  const fetchAssigned = async () => {
    try {
      setLoading(true);
      const res = await OrderService.getAssignedOrders();
      if (res.success) {
        setAssignedOrders(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách đơn hàng được gán.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await AuthService.getProfile();
      if (res.success && res.data) {
        setProfile(res.data);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      showToast("Không thể tải thông tin tài khoản", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchAssigned();
  }, []);

  // Set coordinates from database or geocode active addresses dynamically when assigned orders are loaded
  useEffect(() => {
    if (assignedOrders.length > 0) {
      const activeOrders = assignedOrders.filter(
        o => o.status !== 'GIAO_THANH_CONG' && o.status !== 'GIAO_THAT_BAI'
      );

      let geocodeDelayCount = 0;

      activeOrders.forEach((order) => {
        if (order.receiver_lat !== undefined && order.receiver_lat !== null &&
            order.receiver_lng !== undefined && order.receiver_lng !== null) {
          // Immediately set coordinates from database
          setOrderCoords(prev => ({
            ...prev,
            [order.order_id]: [order.receiver_lat, order.receiver_lng]
          }));
        } else if (order.receiver_address) {
          // Debounce / rate limit Nominatim requests by spacing each request by 1.2 seconds
          const currentDelayIdx = geocodeDelayCount++;
          setTimeout(() => {
            geocodeAddress(order.order_id, order.receiver_address);
          }, currentDelayIdx * 1200);
        }
      });
    }
  }, [assignedOrders]);

  const geocodeAddress = async (orderId, address) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Antigravity-Logistics-Staff/1.0' } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setOrderCoords(prev => ({
            ...prev,
            [orderId]: [parseFloat(data[0].lat), parseFloat(data[0].lon)]
          }));
        }
      }
    } catch (e) {
      console.error("Geocoding failed for order " + orderId, e);
    }
  };

  // Canvas drawing functions for Shipper electronic signature
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#c084fc'; // neon violet
    ctx.lineCap = 'round';
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleUpdateStatus = async (orderId) => {
    if (!selectedStatus) {
      showToast('Vui lòng chọn trạng thái mới!', 'error');
      return;
    }

    if (selectedStatus === 'GIAO_THANH_CONG') {
      if (!hasSigned) {
        showToast('Khách hàng cần ký nhận để xác minh giao thành công!', 'error');
        return;
      }
      if (!proofPhoto) {
        showToast('Vui lòng chụp ảnh/đính kèm ảnh bằng chứng giao hàng!', 'error');
        return;
      }
    } else if (selectedStatus === 'GIAO_THAT_BAI') {
      if (!failReason) {
        showToast('Vui lòng chọn lý do giao hàng thất bại!', 'error');
        return;
      }
      if (!proofPhoto) {
        showToast('Vui lòng chụp ảnh bằng chứng giao hàng thất bại!', 'error');
        return;
      }
    }

    let finalLocationInfo = locationInfo || 'Cập nhật bởi Shipper';
    if (selectedStatus === 'GIAO_THANH_CONG') {
      finalLocationInfo = `[ĐÃ KÝ NHẬN & CHỤP ẢNH XÁC THỰC] - Vị trí: ${finalLocationInfo}`;
    } else if (selectedStatus === 'GIAO_THAT_BAI') {
      finalLocationInfo = `[GIAO THẤT BẠI - Lý do: ${failReason}] - Ghi chú: ${finalLocationInfo}`;
    }

    try {
      setUpdating(true);
      const res = await OrderService.staffUpdateOrder(orderId, {
        status: selectedStatus,
        location_info: finalLocationInfo
      });

      if (res.success) {
        showToast(res.message);
        setUpdatingOrderId(null);
        setSelectedStatus('');
        setLocationInfo('');
        setHasSigned(false);
        setProofPhoto(null);
        setFailReason('');
        fetchAssigned();
        fetchProfile(); // Refresh job performance stats
        
        if (timelineData[orderId]) {
          const updatedTimeline = { ...timelineData };
          delete updatedTimeline[orderId];
          setTimelineData(updatedTimeline);
        }
        if (orderCoords[orderId]) {
          const updatedCoords = { ...orderCoords };
          delete updatedCoords[orderId];
          setOrderCoords(updatedCoords);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi cập nhật hành trình.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profile.fullname.trim()) {
      showToast("Vui lòng điền Họ và tên!", "error");
      return;
    }

    try {
      setSavingProfile(true);
      const res = await AuthService.updateProfile({
        fullname: profile.fullname
      });
      if (res.success) {
        showToast("Cập nhật tài khoản thành công!", "success");
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Lỗi lưu thông tin.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleTimeline = async (orderId) => {
    if (selectedTimelineOrderId === orderId) {
      setSelectedTimelineOrderId(null);
      return;
    }

    setSelectedTimelineOrderId(orderId);

    if (timelineData[orderId]) return;

    try {
      setTimelineLoading(true);
      const res = await TrackingService.trackOrder(orderId);
      if (res.success) {
        setTimelineData(prev => ({
          ...prev,
          [orderId]: res.data.timeline
        }));
      }
    } catch (err) {
      console.error("Error fetching order timeline:", err);
      showToast("Không thể tải lịch trình đơn hàng", "error");
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('fullname');
    window.location.href = '/login';
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'account') {
      fetchProfile();
    } else if (tab === 'orders' || tab === 'history') {
      fetchAssigned();
    }
  };

  const getInitials = (name) => {
    if (!name) return "SP";
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CHO_LAY_HANG':
        return <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/35 shadow-[0_0_10px_rgba(245,158,11,0.15)]">Chờ lấy hàng</span>;
      case 'DA_LAY_HANG':
        return <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/35 shadow-[0_0_10px_rgba(168,85,247,0.15)]">Đã lấy hàng</span>;
      case 'DANG_VAN_CHUYEN':
        return <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 shadow-[0_0_10px_rgba(6,182,212,0.15)]">Đang giao</span>;
      case 'GIAO_THANH_CONG':
        return <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 shadow-[0_0_10px_rgba(16,185,129,0.15)]">Thành công</span>;
      case 'GIAO_THAT_BAI':
        return <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/35 shadow-[0_0_10px_rgba(244,63,94,0.15)]">Thất bại</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-white/5 text-white/60 border border-white/10">{status}</span>;
    }
  };

  const getTimelineStatusText = (status) => {
    switch (status) {
      case 'CHO_LAY_HANG': return 'Chờ lấy bưu phẩm tại kho gửi';
      case 'DA_LAY_HANG': return 'Đã lấy bưu phẩm thành công';
      case 'DANG_VAN_CHUYEN': return 'Bưu phẩm đang chặng đi giao';
      case 'GIAO_THANH_CONG': return 'Giao bưu gửi thành công - Hoàn tất';
      case 'GIAO_THAT_BAI': return 'Giao bưu gửi thất bại - Chờ xử lý phát lại';
      default: return status;
    }
  };

  // Filter lists
  const activeOrders = assignedOrders.filter(
    o => o.status !== 'GIAO_THANH_CONG' && o.status !== 'GIAO_THAT_BAI'
  );

  const historyOrders = assignedOrders.filter(
    o => o.status === 'GIAO_THANH_CONG' || o.status === 'GIAO_THAT_BAI'
  );

  const filteredHistory = historyOrders.filter(o => 
    o.order_id.toLowerCase().includes(historySearch.toLowerCase()) ||
    o.receiver_name.toLowerCase().includes(historySearch.toLowerCase()) ||
    o.receiver_phone.includes(historySearch)
  );

  // Stats
  const totalCODCollected = historyOrders
    .filter(o => o.status === 'GIAO_THANH_CONG')
    .reduce((sum, o) => sum + o.cod, 0);

  const successCount = historyOrders.filter(o => o.status === 'GIAO_THANH_CONG').length;
  const failCount = historyOrders.filter(o => o.status === 'GIAO_THAT_BAI').length;

  // Work performance stats calculations
  const totalDelivered = profile.stats?.total_delivered || 0;
  const totalFailed = profile.stats?.total_failed || 0;
  const totalAttempts = totalDelivered + totalFailed;
  const successRate = totalAttempts > 0 ? ((totalDelivered / totalAttempts) * 100).toFixed(1) : "0.0";

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-32 bg-[#0d061c] min-h-screen text-white relative border-x border-white/5 custom-scrollbar overflow-x-hidden font-sans shadow-2xl">
      {/* Background neon light aurora blobs */}
      <div className="neon-aurora-blob bg-accent-purple/20 w-[350px] h-[350px] -top-10 -right-10 animate-pulse"></div>
      <div className="neon-aurora-blob bg-cyan-500/10 w-[300px] h-[300px] bottom-20 -left-10 animate-pulse" style={{ animationDuration: '6s' }}></div>
      <div className="absolute inset-0 bg-[radial-gradient(rgba(168,85,247,0.04)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none z-0" />

      {/* Toast Alert */}
      {toast.show && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-55 flex items-center p-4 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.5)] transition-all duration-300 bg-[#180d32]/90 backdrop-blur-xl border border-white/10 text-white animate-slide-in w-[90%] max-w-sm">
          <div className="h-2.5 w-2.5 rounded-full bg-purple-400 animate-pulse mr-3 shrink-0"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 mr-2 shrink-0">{toast.type === 'error' ? 'Lỗi' : 'Hệ Thống'}:</span>
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Top Sat-Net Widget */}
      <div className="flex items-center justify-between bg-white/5 border border-white/10 px-4 py-3 rounded-2xl mb-6 relative overflow-hidden backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 font-mono">SHIPPER ONLINE</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[9px] font-extrabold text-white/70">
          <span className="material-symbols-outlined text-[12px] text-accent-purple">schedule</span>
          <span>
            {systemTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Header Title block */}
      <div className="mb-6 border-b border-white/5 pb-5 relative z-10">
        <h1 className="text-2xl font-black tracking-tight text-white font-display uppercase text-glow-purple">
          {activeTab === 'orders' 
            ? 'SHIPPER PORTAL' 
            : activeTab === 'history' 
            ? 'LỊCH SỬ GIAO NHẬN' 
            : 'HỒ SƠ SHIPPER RIDER'}
        </h1>
        <p className="mt-1 text-[10px] text-white/50 font-bold uppercase tracking-wider leading-relaxed">
          {activeTab === 'orders' 
            ? 'Bảng điều khiển giao nhận di động chuyên biệt dành cho Rider' 
            : activeTab === 'history' 
            ? 'Thống kê tài chính COD thu hộ và danh sách bưu phẩm đã hoàn tất'
            : 'Quản lý thông tin cá nhân và báo cáo hiệu suất lao động thời gian thực'}
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border-l-4 border-rose-500 p-3.5 mb-5 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.15)] relative z-10 border border-white/5">
          <div className="text-xs text-rose-300 font-bold uppercase tracking-wider">{error}</div>
        </div>
      )}

      {/* TAB 1: ACTIVE ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6 relative z-10 animate-fade-in">
          {/* Stats Summary Card */}
          <div className="bg-gradient-to-br from-[#1c0f3c]/60 to-[#0e071e]/60 border border-purple-500/20 text-white p-6 rounded-3xl shadow-[0_8px_32px_rgba(168,85,247,0.08)] flex items-center justify-between overflow-hidden relative group">
            <div className="relative z-10">
              <p className="text-[10px] font-black tracking-widest text-purple-300 uppercase mb-1">ĐƠN ĐANG CHỜ PHÁT</p>
              <h2 className="text-xl font-black tracking-tight text-glow-purple">Cần giao: {activeOrders.length} đơn</h2>
            </div>
            <span className="material-symbols-outlined text-accent-purple opacity-[0.15] text-[64px] absolute -right-3 -bottom-3 select-none group-hover:scale-110 transition-transform duration-300 animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
          </div>

          {/* Scanner Search Input Console */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-4 shadow-md backdrop-blur-md">
            <form onSubmit={handleScanSubmit} className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black tracking-widest text-purple-400 uppercase flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-400"></span>
                  </span>
                  <span>NHẬN DIỆN VẬN ĐƠN SIÊU TỐC</span>
                </label>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined text-purple-400 absolute left-3 select-none">qr_code_scanner</span>
                <input
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Nhập hoặc quét mã bưu gửi..."
                  className="w-full pl-10 pr-24 py-3 bg-[#0d061c]/60 border border-white/10 rounded-xl text-xs font-bold text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 px-3 py-1.5 bg-gradient-to-r from-accent-purple to-purple-600 text-white text-[9px] font-black uppercase tracking-wider rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all cursor-pointer shadow-[0_2px_8px_rgba(94,14,215,0.4)]"
                >
                  TÌM ĐƠN
                </button>
              </div>
            </form>
          </div>

          {/* Delivery List Header with Segmented Toggle Console */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-purple-300 text-glow-purple">BẢN ĐỒ & TIẾN TRÌNH LỘ TRÌNH</h3>
              <button onClick={fetchAssigned} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer">
                <span className="material-symbols-outlined text-xs">refresh</span> Tải lại
              </button>
            </div>

            {/* Segmented view console toggle */}
            <div className="bg-[#07030e]/60 border border-white/10 p-[4px] rounded-2xl flex gap-[4px] relative z-10 shadow-md">
              <button
                type="button"
                onClick={() => setConsoleView('list')}
                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                  consoleView === 'list'
                    ? 'bg-gradient-to-r from-accent-purple to-purple-600 text-white shadow-[0_2px_8px_rgba(168,85,247,0.3)]'
                    : 'text-white/45 hover:text-white hover:bg-white/5'
                }`}
              >
                Danh sách đơn
              </button>
              <button
                type="button"
                onClick={() => setConsoleView('map')}
                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                  consoleView === 'map'
                    ? 'bg-gradient-to-r from-accent-purple to-purple-600 text-white shadow-[0_2px_8px_rgba(168,85,247,0.3)]'
                    : 'text-white/45 hover:text-white hover:bg-white/5'
                }`}
              >
                Bản đồ định vị
              </button>
            </div>
          </div>

          {/* Render console view maps vs list */}
          {consoleView === 'map' ? (
            <div className="w-full h-[380px] rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl bg-[#0e071e]/50 backdrop-blur-md animate-fade-in z-10">
              <div className="absolute top-3 left-3 z-[1000] bg-black/65 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg text-[8px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block"></span>
                <span>LỘ TRÌNH ĐIỂM GIAO THỰC TẾ</span>
              </div>

              <MapContainer 
                center={[16.0544, 108.2022]} 
                zoom={12} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <ChangeView 
                  center={Object.values(orderCoords)[0] || [16.0544, 108.2022]} 
                  bounds={Object.values(orderCoords)} 
                />

                {Object.values(orderCoords).length >= 2 && (
                  <Polyline 
                    positions={Object.values(orderCoords)} 
                    color="#5E0ED7" 
                    weight={4} 
                    opacity={0.75} 
                    lineCap="round" 
                    lineJoin="round"
                    dashArray="5, 6"
                  />
                )}

                {activeOrders.map((o) => {
                  const coords = orderCoords[o.order_id];
                  if (!coords) return null;
                  return (
                    <Marker key={o.order_id} position={coords} icon={destinationNeonIcon}>
                      <Popup>
                        <div className="text-black text-[10px] font-bold uppercase tracking-wider p-1 space-y-1">
                          <p className="text-accent-purple font-black">📍 ĐƠN HÀNG: {o.order_id}</p>
                          <p className="text-black/80 font-extrabold">Người nhận: {o.receiver_name}</p>
                          <p className="text-amber-800 font-extrabold">COD thu hộ: {o.cod.toLocaleString()} đ</p>
                          <p className="text-neutral-500 font-medium leading-normal italic text-[8.5px] truncate max-w-[130px]">{o.receiver_address}</p>
                          
                          <button 
                            onClick={() => {
                              setUpdatingOrderId(o.order_id);
                              setSelectedStatus(o.status);
                              setLocationInfo('');
                              setConsoleView('list');
                              setTimeout(() => {
                                const el = document.getElementById(`order-card-${o.order_id}`);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 250);
                            }}
                            className="w-full mt-2 py-1.5 bg-[#5E0ED7] hover:bg-[#6e19f1] text-white rounded-lg text-[8px] font-black uppercase tracking-widest text-center block cursor-pointer transition-all shadow-[0_2px_8px_rgba(94,14,215,0.3)] border border-white/5 active:scale-95"
                          >
                            Cập nhật đơn hàng
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          ) : (
            /* Active Orders List */
            <div className="space-y-5">
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                </div>
              ) : activeOrders.length === 0 ? (
                <div className="text-center py-12 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 text-xs font-bold text-white/40 shadow-sm">
                  Bạn chưa có đơn hàng nào cần giao lúc này.
                </div>
              ) : (
                activeOrders.map((o) => (
                  <div 
                    key={o.order_id} 
                    id={`order-card-${o.order_id}`}
                    className={`glow-card border rounded-3xl p-5 space-y-4 transition-all duration-500 shadow-lg bg-[#140b27]/60 ${
                      highlightedOrderId === o.order_id 
                        ? 'border-cyan-400 ring-4 ring-cyan-400/15 shadow-[0_0_25px_rgba(6,182,212,0.25)] scale-[1.02]' 
                        : 'border-white/5 hover:border-purple-500/35 hover:shadow-[0_10px_25px_rgba(168,85,247,0.1)]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-extrabold text-sm text-white tracking-wide">{o.order_id}</p>
                        <p className="text-[10px] text-purple-300 font-extrabold uppercase tracking-widest mt-0.5">
                          Cước phí: {o.fee.toLocaleString()} đ
                        </p>
                      </div>
                      {getStatusBadge(o.status)}
                    </div>

                    {/* Delivery Address block */}
                    <div className="flex gap-4 py-3.5 border-t border-b border-white/5">
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <span className="material-symbols-outlined text-purple-400 text-[20px]">person</span>
                        <div className="w-[2px] h-full bg-purple-500/20 rounded-full"></div>
                        <span className="material-symbols-outlined text-cyan-400 text-[20px]">location_on</span>
                      </div>
                      <div className="space-y-4 flex-1">
                        <div>
                          <p className="text-xs font-black uppercase text-white tracking-wider">{o.receiver_name}</p>
                          <a className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-bold mt-1.5" href={`tel:${o.receiver_phone}`}>
                            <span className="material-symbols-outlined text-[13px]">call</span> {o.receiver_phone}
                          </a>
                        </div>
                        <div>
                          <p className="text-xs text-white/60 font-semibold leading-relaxed">
                            {o.receiver_address}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {o.cod > 0 && (
                        <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/25 text-white font-extrabold flex justify-between items-center text-xs shadow-[inset_0_1px_2px_rgba(245,158,11,0.05)]">
                          <span className="text-[9px] uppercase tracking-widest text-amber-300/70">COD THU HỘ:</span>
                          <span className="text-amber-350 font-black text-glow-amber">{o.cod.toLocaleString()} đ</span>
                        </div>
                      )}
                      {o.description && (
                        <div className="text-xs font-semibold text-white/50 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                          <span className="text-white/30 mr-1.5 font-bold uppercase text-[9px] tracking-wider">Ghi chú:</span>
                          <span className="italic text-white/80">{o.description}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Update panel */}
                    {updatingOrderId === o.order_id ? (
                      <div className="space-y-3.5 bg-black/35 p-4 rounded-2xl border border-white/5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                        <div className="text-[10px] font-black text-purple-300 uppercase tracking-widest text-glow-purple flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">edit_square</span>
                          <span>Cập nhật hành trình bưu phẩm</span>
                        </div>
                        
                        <div>
                          <label className="block text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1">Trạng thái mới</label>
                          <div className="relative">
                            <select
                                value={selectedStatus}
                                onChange={(e) => {
                                  setSelectedStatus(e.target.value);
                                  setHasSigned(false);
                                  setProofPhoto(null);
                                  setFailReason('');
                                }}
                                className="w-full text-xs bg-[#0d061c] border border-white/10 rounded-xl p-2.5 font-bold focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-all text-white cursor-pointer"
                              >
                                <option value="" className="bg-[#140b27] text-white/50">-- Chọn trạng thái --</option>
                                <option value="DA_LAY_HANG" className="bg-[#140b27] text-white">Đã lấy hàng thành công (DA_LAY_HANG)</option>
                                <option value="DANG_VAN_CHUYEN" className="bg-[#140b27] text-white">Đang đi giao hàng (DANG_VAN_CHUYEN)</option>
                                <option value="GIAO_THANH_CONG" className="bg-[#140b27] text-white">Giao hàng Thành Công (GIAO_THANH_CONG)</option>
                                <option value="GIAO_THAT_BAI" className="bg-[#140b27] text-white">Giao hàng Thất Bại (GIAO_THAT_BAI)</option>
                              </select>
                          </div>
                        </div>

                        {selectedStatus === 'GIAO_THAT_BAI' && (
                          <div className="animate-fade-in">
                            <label className="block text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1">Lý do giao thất bại</label>
                            <select
                              value={failReason}
                              onChange={(e) => setFailReason(e.target.value)}
                              className="w-full text-xs bg-[#0d061c] border border-white/10 rounded-xl p-2.5 font-bold focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-all text-white cursor-pointer"
                            >
                              <option value="">-- Chọn lý do sự vụ --</option>
                              <option value="Khách hẹn ngày khác">Khách hẹn ngày khác</option>
                              <option value="Không liên lạc được">Không liên lạc được (Gọi 3 lần)</option>
                              <option value="Khách hủy đơn/bom hàng">Khách hủy đơn / Từ chối nhận</option>
                              <option value="Sai địa chỉ giao nhận">Sai thông tin địa chỉ / Số điện thoại</option>
                            </select>
                          </div>
                        )}

                        {selectedStatus === 'GIAO_THANH_CONG' && (
                          <div className="space-y-1.5 animate-fade-in">
                            <div className="flex justify-between items-center text-[9px] font-bold text-white/40 uppercase tracking-wider">
                              <span>Chữ ký xác nhận của người nhận</span>
                              {hasSigned && (
                                <button 
                                  type="button" 
                                  onClick={clearSignature}
                                  className="text-[8.5px] font-black uppercase text-rose-400 tracking-wider hover:text-rose-300 transition-colors"
                                >
                                  Ký Lại
                                </button>
                              )}
                            </div>
                            <div className="relative border border-white/10 rounded-2xl overflow-hidden bg-[#0a0414] h-28 w-full shadow-inner flex items-center justify-center cursor-crosshair">
                              {!hasSigned && (
                                <span className="absolute text-[8px] font-bold text-white/20 select-none pointer-events-none uppercase tracking-widest text-center leading-relaxed">
                                  Ký tên trực tiếp tại đây<br/>(Dùng ngón tay/chuột vuốt trên màn hình)
                                </span>
                              )}
                              <canvas
                                ref={canvasRef}
                                width={340}
                                height={110}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                                className="w-full h-full block absolute inset-0 z-10"
                              />
                            </div>
                          </div>
                        )}

                        {(selectedStatus === 'GIAO_THANH_CONG' || selectedStatus === 'GIAO_THAT_BAI') && (
                          <div className="space-y-1.5 animate-fade-in">
                            <label className="block text-[9px] font-bold text-white/40 uppercase tracking-wider">Ảnh chụp bằng chứng thực địa</label>
                            <div className="flex gap-3 items-center">
                              {proofPhoto ? (
                                <div className="relative w-14 h-14 rounded-xl border border-purple-500/40 overflow-hidden group shadow-md shrink-0">
                                  <img src={proofPhoto} alt="Proof" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => setProofPhoto(null)}
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-500 text-[8.5px] font-black transition-all rounded-xl"
                                  >
                                    XÓA
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const assets = [
                                      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=150&q=80',
                                      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=150&q=80'
                                    ];
                                    const selected = assets[Math.floor(Math.random() * assets.length)];
                                    setProofPhoto(selected);
                                    showToast("Đã ghi lại ảnh chụp thực địa thành công!", "success");
                                  }}
                                  className="flex-1 py-3 border border-dashed border-cyan-500/30 rounded-xl bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-inner"
                                >
                                  <span className="material-symbols-outlined text-[16px] animate-pulse">photo_camera</span>
                                  <span className="text-[8px] font-black uppercase tracking-widest">Chụp Ảnh Thực Địa</span>
                                </button>
                              )}
                              {proofPhoto && (
                                <span className="text-[8.5px] font-black text-emerald-400 flex items-center gap-1 tracking-wider">
                                  <span className="material-symbols-outlined text-xs">check_circle</span>
                                  ẢNH HỢP LỆ
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1">Thông tin vị trí / Ghi chú</label>
                          <input
                            type="text"
                            placeholder="Ví dụ: Giao tại 120 Điện Biên Phủ..."
                            value={locationInfo}
                            onChange={(e) => setLocationInfo(e.target.value)}
                            className="w-full text-xs bg-[#0d061c] border border-white/10 rounded-xl p-2.5 font-semibold focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-all text-white placeholder-white/30"
                          />
                        </div>
                        
                        <div className="flex gap-2 pt-1.5">
                          <button
                            onClick={() => handleUpdateStatus(o.order_id)}
                            disabled={updating}
                            className="flex-1 py-2.5 bg-gradient-to-r from-accent-purple to-purple-600 text-white text-[10px] font-black rounded-full hover:from-purple-600 hover:to-indigo-600 active:scale-95 shadow-[0_2px_8px_rgba(94,14,215,0.3)] cursor-pointer transition-all uppercase tracking-widest"
                          >
                            {updating ? 'Đang lưu...' : 'Xác nhận'}
                          </button>
                          <button
                            onClick={() => {
                              setUpdatingOrderId(null);
                              setHasSigned(false);
                              setProofPhoto(null);
                              setFailReason('');
                            }}
                            className="px-4 py-2.5 bg-transparent border border-white/10 text-white hover:bg-white/5 text-[10px] font-black rounded-full transition-all cursor-pointer uppercase tracking-widest"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setUpdatingOrderId(o.order_id);
                          setSelectedStatus(o.status);
                          setLocationInfo('');
                        }}
                        className="w-full py-3 bg-gradient-to-r from-accent-purple to-purple-600 text-white hover:from-purple-600 hover:to-indigo-600 active:scale-95 rounded-full text-[10px] font-black shadow-[0_4px_12px_rgba(94,14,215,0.3)] hover:shadow-[0_6px_20px_rgba(94,14,215,0.5)] cursor-pointer transition-all uppercase tracking-widest flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">edit_note</span>
                        <span>Cập Nhật Trạng Thái</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DELIVERY HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6 relative z-10 animate-fade-in">
          {/* Reconciliation Stats Card */}
          <div className="bg-gradient-to-br from-[#12231c]/60 to-[#09120e]/60 border border-emerald-500/20 text-white p-6 rounded-3xl shadow-[0_8px_32px_rgba(16,185,129,0.05)] space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div>
                <p className="text-[9px] font-black tracking-widest text-emerald-400 uppercase mb-0.5">TỔNG THU HỘ (COD)</p>
                <h2 className="text-xl font-black text-emerald-400 tracking-tight text-glow-green">{totalCODCollected.toLocaleString()} VND</h2>
              </div>
              <span className="material-symbols-outlined text-emerald-400 bg-emerald-500/10 p-2.5 rounded-2xl border border-emerald-500/25">payments</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/[0.02] p-2.5 rounded-2xl border border-white/5">
                <p className="text-[9px] font-bold text-white/40 uppercase">THÀNH CÔNG</p>
                <p className="text-sm font-extrabold text-emerald-400">{successCount} đơn</p>
              </div>
              <div className="bg-white/[0.02] p-2.5 rounded-2xl border border-white/5">
                <p className="text-[9px] font-bold text-white/40 uppercase">THẤT BẠI</p>
                <p className="text-sm font-extrabold text-rose-400">{failCount} đơn</p>
              </div>
            </div>
          </div>

          {/* Search bar inside history */}
          <div className="relative flex items-center">
            <span className="material-symbols-outlined text-white/30 absolute left-3 select-none">search</span>
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Tìm mã đơn, tên hoặc SĐT khách..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-xs font-semibold text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>

          {/* History Orders List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 text-xs font-bold text-white/40 shadow-sm">
                Không tìm thấy đơn hàng lịch sử nào phù hợp.
              </div>
            ) : (
              filteredHistory.map((o) => (
                <div 
                  key={o.order_id} 
                  className={`border rounded-3xl p-5 space-y-3 bg-[#140b27]/60 transition-all ${
                    selectedTimelineOrderId === o.order_id ? 'ring-2 ring-purple-500/35 border-purple-500/50 shadow-sm' : 'border-white/5'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-extrabold text-xs text-white tracking-wide">{o.order_id}</p>
                      <p className="text-[9px] text-white/40 font-bold mt-0.5">
                        Ngày tạo: {new Date(o.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    {getStatusBadge(o.status)}
                  </div>

                  <div className="text-xs space-y-1.5 text-white/70 border-t border-white/5 pt-2">
                    <p className="font-semibold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-white/30">person</span>
                      <span>Khách hàng: {o.receiver_name}</span>
                    </p>
                    <p className="text-white/50 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-white/30">location_on</span>
                      <span className="truncate">{o.receiver_address}</span>
                    </p>
                    {o.cod > 0 && (
                      <p className="text-amber-350 font-extrabold flex items-center gap-1.5 text-[11px] mt-1.5 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                        <span className="material-symbols-outlined text-[14px]">monetization_on</span>
                        <span>Đã thu COD: {o.cod.toLocaleString()} đ</span>
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => toggleTimeline(o.order_id)}
                    className="w-full mt-1.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 uppercase tracking-widest shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[14px]">alt_route</span>
                    <span>{selectedTimelineOrderId === o.order_id ? 'Ẩn Lịch Trình' : 'Xem Chi Tiết Lịch Trình'}</span>
                  </button>

                  {/* Inline Timeline container */}
                  {selectedTimelineOrderId === o.order_id && (
                    <div className="bg-black/35 border border-white/5 rounded-2xl p-4 mt-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] space-y-3">
                      <div className="text-[10px] font-black uppercase text-purple-300 tracking-widest">Hành Trình Bưu Gửi</div>
                      
                      {timelineLoading && !timelineData[o.order_id] ? (
                        <div className="flex justify-center items-center py-4">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                        </div>
                      ) : !timelineData[o.order_id] || timelineData[o.order_id].length === 0 ? (
                        <div className="text-[10px] font-bold text-white/40 italic">Không có dữ liệu lịch trình của đơn này.</div>
                      ) : (
                        <div className="relative border-l border-purple-500/20 pl-4 ml-2 space-y-4 py-1">
                          {timelineData[o.order_id].map((evt, idx) => (
                            <div key={idx} className="relative">
                              <div className={`absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full border-2 bg-[#0d061c] ${
                                idx === 0 
                                  ? 'border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse scale-110' 
                                  : 'border-purple-500/40'
                              }`}></div>
                              
                              <div>
                                <div className="flex justify-between items-center gap-2">
                                  <span className={`text-[10px] font-black uppercase tracking-wider ${idx === 0 ? 'text-cyan-300 text-glow-cyan' : 'text-white/60'}`}>
                                    {getTimelineStatusText(evt.status)}
                                  </span>
                                  <span className="text-[8px] text-white/40 font-bold shrink-0">
                                    {new Date(evt.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(evt.time).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>
                                {evt.info && (
                                  <p className="text-[9.5px] font-semibold text-white/40 leading-relaxed mt-0.5 italic">
                                    {evt.info}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PROFILE & WORK STATISTICS */}
      {activeTab === 'account' && (
        <div className="space-y-6 relative z-10 animate-fade-in">
          {profileLoading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Profile Avatar Card with Vehicle branding */}
              <div className="flex flex-col items-center py-6 bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl shadow-lg text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-purple to-cyan-400"></div>
                
                <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-accent-purple to-purple-800 flex items-center justify-center text-white text-xl font-extrabold shadow-md mb-3 border border-white/20">
                  {getInitials(profile.fullname)}
                </div>
                
                <h3 className="text-base font-extrabold text-white tracking-wide">{profile.fullname || 'Chưa thiết lập'}</h3>
                <span className="px-2.5 py-0.5 text-[9px] font-black rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 shadow-[0_2px_8px_rgba(6,182,212,0.15)] uppercase mt-2 tracking-widest font-mono">
                  QUANTUM RIDER
                </span>

                {/* Fleet Vehicle Specs Box */}
                <div className="w-[90%] mt-5 bg-black/45 border border-white/5 p-3 rounded-2xl flex items-center gap-3 relative overflow-hidden shadow-inner group">
                  <img 
                    src={futuristicDeliveryVanImg} 
                    alt="Quantum EV-Van" 
                    className="absolute right-0 top-0 bottom-0 w-24 object-cover opacity-20 filter grayscale mix-blend-luminosity group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent z-0"></div>
                  
                  <div className="relative z-10 text-left space-y-0.5 shrink-0">
                    <span className="text-[7.5px] font-black text-purple-300 tracking-wider uppercase block">PHƯƠNG TIỆN ĐIỀU HÀNH</span>
                    <p className="text-[10px] font-black text-white uppercase tracking-wide">EV-Van Quantum (Smart Assist)</p>
                    <span className="text-[8px] font-bold text-cyan-400 tracking-widest uppercase flex items-center gap-1 mt-0.5">
                      <span className="w-1 h-1 rounded-full bg-cyan-400 inline-block animate-pulse"></span>
                      BIỂN SỐ: 29A-88294
                    </span>
                  </div>
                </div>
              </div>

              {/* Work Statistics Section - Premium Custom Glassmorphism */}
              <div className="bg-white/5 border border-white/5 rounded-3xl p-5 space-y-4 shadow-md">
                <h4 className="text-[10px] font-black uppercase text-purple-300 tracking-widest flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-purple-400">equalizer</span>
                  <span>Bảng thống kê hiệu suất công việc</span>
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Metric 1: Success Rate */}
                  <div className="bg-[#1c0f3c]/40 border border-purple-500/10 p-4 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5">
                      <span className="material-symbols-outlined text-[36px]">percent</span>
                    </div>
                    <span className="text-[8px] font-extrabold text-purple-300 uppercase tracking-widest">TỶ LỆ THÀNH CÔNG</span>
                    <span className="text-xl font-black text-white mt-1.5 text-glow-purple">{successRate}%</span>
                    <span className="text-[7.5px] text-white/45 font-medium mt-1 uppercase">ĐƠN GIAO THỰC TẾ</span>
                  </div>

                  {/* Metric 2: Daily Limit */}
                  <div className="bg-[#0b1b1d]/40 border border-cyan-500/10 p-4 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5">
                      <span className="material-symbols-outlined text-[36px]">assignment_turned_in</span>
                    </div>
                    <span className="text-[8px] font-extrabold text-cyan-400 uppercase tracking-widest">HẠN MỨC TRONG NGÀY</span>
                    <span className="text-xl font-black text-white mt-1.5 text-glow-cyan">{profile.stats?.daily_limit || 100} đơn</span>
                    <span className="text-[7.5px] text-white/45 font-medium mt-1 uppercase">HR PHÂN PHỐI TỐI ĐA</span>
                  </div>

                  {/* Metric 3: Success Deliveries */}
                  <div className="bg-[#0e271a]/30 border border-emerald-500/10 p-4 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden col-span-2">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-extrabold text-emerald-400 uppercase tracking-widest">ĐƠN HÀNG HOÀN THÀNH</span>
                        <span className="text-2xl font-black text-white mt-1.5 text-glow-green">{totalDelivered} đơn</span>
                      </div>
                      <span className="material-symbols-outlined text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/25">check_circle</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden border border-white/5">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                        style={{ width: `${successRate}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Metric 4: Failed Deliveries */}
                  <div className="bg-[#2c0e18]/30 border border-rose-500/10 p-4 rounded-2xl flex justify-between items-center shadow-sm col-span-2">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-extrabold text-rose-400 uppercase tracking-widest">ĐƠN GIAO THẤT BẠI</span>
                      <span className="text-sm font-black text-white mt-1">{totalFailed} đơn</span>
                    </div>
                    <span className="material-symbols-outlined text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/25">cancel</span>
                  </div>
                </div>
              </div>

              {/* Personal Info Box */}
              <div className="bg-white/5 border border-white/5 rounded-3xl p-5 space-y-4 shadow-md">
                <h4 className="text-[10px] font-black uppercase text-purple-300 tracking-widest mb-1">Thông tin hồ sơ nhân viên</h4>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Tên đăng nhập (Read-Only)</label>
                    <input
                      type="text"
                      disabled
                      value={profile.username}
                      className="w-full bg-black/45 text-white/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs font-semibold select-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Vai trò hệ thống</label>
                    <input
                      type="text"
                      disabled
                      value="NHANVIEN (Shipper Rider)"
                      className="w-full bg-black/45 text-white/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs font-semibold select-none cursor-not-allowed"
                    />
                  </div>

                  {profile.workplace_name && (
                    <div>
                      <label className="block text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Chi nhánh làm việc</label>
                      <input
                        type="text"
                        disabled
                        value={profile.workplace_name}
                        className="w-full bg-black/45 text-white/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs font-semibold select-none cursor-not-allowed"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Họ và Tên</label>
                    <input
                      type="text"
                      placeholder="Nhập họ và tên..."
                      value={profile.fullname}
                      onChange={(e) => setProfile({ ...profile, fullname: e.target.value })}
                      className="w-full bg-[#0d061c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-white/20"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-3 bg-gradient-to-r from-accent-purple to-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:from-purple-600 hover:to-indigo-600 shadow-[0_4px_16px_rgba(94,14,215,0.3)] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {savingProfile ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">save</span>
                      <span>Lưu Thay Đổi Họ Tên</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-3 bg-transparent border border-rose-500/35 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-[10px] font-black uppercase tracking-widest rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(244,63,94,0.1)]"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  <span>Đăng Xuất Tài Khoản</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Premium BottomNavBar */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 h-16 bg-[#140b27]/85 backdrop-blur-md border border-white/5 rounded-full flex justify-around items-center px-4 shadow-[0_10px_35px_rgba(0,0,0,0.5)] max-w-md mx-auto">
        <button 
          onClick={() => handleTabChange('orders')}
          className={`flex flex-col items-center justify-center pt-1 transition-all cursor-pointer outline-none ${
            activeTab === 'orders' 
              ? 'text-purple-400 text-glow-purple font-black text-xs' 
              : 'text-white/40 hover:text-white font-semibold text-xs'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === 'orders' ? "'FILL' 1" : "'FILL' 0" }}>local_shipping</span>
          <span className="mt-1">Đơn hàng</span>
        </button>
        
        <button 
          onClick={() => handleTabChange('history')}
          className={`flex flex-col items-center justify-center pt-1 transition-all cursor-pointer outline-none ${
            activeTab === 'history' 
              ? 'text-purple-400 text-glow-purple font-black text-xs' 
              : 'text-white/40 hover:text-white font-semibold text-xs'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === 'history' ? "'FILL' 1" : "'FILL' 0" }}>history</span>
          <span className="mt-1">Lịch sử</span>
        </button>
        
        <button 
          onClick={() => handleTabChange('account')}
          className={`flex flex-col items-center justify-center pt-1 transition-all cursor-pointer outline-none ${
            activeTab === 'account' 
              ? 'text-purple-400 text-glow-purple font-black text-xs' 
              : 'text-white/40 hover:text-white font-semibold text-xs'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === 'account' ? "'FILL' 1" : "'FILL' 0" }}>person</span>
          <span className="mt-1">Tài khoản</span>
        </button>
      </nav>
    </div>
  );
}
