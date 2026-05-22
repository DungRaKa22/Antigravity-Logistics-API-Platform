import React, { useEffect, useState } from 'react';
import { OrderService, AuthService, TrackingService } from '../services/api';

export default function StaffDashboard() {
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab control: 'orders' | 'history' | 'account'
  const [activeTab, setActiveTab] = useState('orders');

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
    bank_account: '',
    bank_name: '',
    bank_owner: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();
    const code = scanInput.trim().toUpperCase();
    if (!code) return;

    // Chỉ tìm kiếm trong số những đơn hàng chưa hoàn thành
    const activeOrders = assignedOrders.filter(
      o => o.status !== 'GIAO_THANH_CONG' && o.status !== 'GIAO_THAT_BAI'
    );

    const matched = activeOrders.find(o => o.order_id.toUpperCase() === code);
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
      if (res.success) {
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
    fetchAssigned();
  }, []);

  const handleUpdateStatus = async (orderId) => {
    if (!selectedStatus) {
      showToast('Vui lòng chọn trạng thái mới!', 'error');
      return;
    }

    try {
      setUpdating(true);
      const res = await OrderService.staffUpdateOrder(orderId, {
        status: selectedStatus,
        location_info: locationInfo || 'Cập nhật bởi Shipper giao hàng'
      });

      if (res.success) {
        showToast(res.message);
        setUpdatingOrderId(null);
        setSelectedStatus('');
        setLocationInfo('');
        fetchAssigned();
        
        // Clear cached timeline for this order since it has updated
        if (timelineData[orderId]) {
          const updatedTimeline = { ...timelineData };
          delete updatedTimeline[orderId];
          setTimelineData(updatedTimeline);
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
        fullname: profile.fullname,
        bank_account: profile.bank_account,
        bank_name: profile.bank_name,
        bank_owner: profile.bank_owner
      });
      if (res.success) {
        showToast("Cập nhật tài khoản thành công!", "success");
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
    window.location.href = '/login';
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'account') {
      fetchProfile();
    } else {
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
        return <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-50 text-amber-800 border border-amber-200 shadow-[0_2px_8px_rgba(245,158,11,0.08)]">Chờ lấy hàng</span>;
      case 'DA_LAY_HANG':
        return <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-accent-purple/10 text-accent-purple border border-accent-purple/20 shadow-[0_2px_8px_rgba(94,14,215,0.08)]">Đã lấy hàng</span>;
      case 'DANG_VAN_CHUYEN':
        return <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-accent-purple/10 text-accent-purple border border-accent-purple/20 shadow-[0_2px_8px_rgba(94,14,215,0.08)]">Đang giao</span>;
      case 'GIAO_THANH_CONG':
        return <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-50 text-emerald-850 border border-emerald-200 shadow-[0_2px_8px_rgba(16,185,129,0.08)]">Thành công</span>;
      case 'GIAO_THAT_BAI':
        return <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-50 text-rose-850 border border-rose-200 shadow-[0_2px_8px_rgba(244,63,94,0.08)]">Thất bại</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-black/5 text-black/60 border border-black/10">{status}</span>;
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

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-32 bg-canvas min-h-screen text-black relative border-x border-black/10 custom-scrollbar overflow-x-hidden font-sans">
      {/* Background neon light blob */}
      <div className="neon-aurora-blob bg-accent-purple/10 w-[300px] h-[300px] -top-10 -right-10 animate-pulse"></div>
      <div className="neon-aurora-blob bg-cyan-500/5 w-[250px] h-[250px] bottom-20 -left-10 animate-pulse" style={{ animationDuration: '6s' }}></div>

      {/* Toast Alert */}
      {toast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center p-4 rounded-xl shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-xl border border-black/10 text-black shadow-[0_10px_35px_rgba(0,0,0,0.06)] animate-slide-in w-[90%] max-w-sm">
          <div className="h-2 w-2 rounded-full bg-accent-purple animate-pulse mr-2"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-accent-purple mr-2">{toast.type === 'error' ? 'Lỗi' : 'Thành công'}:</span>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header Title block */}
      <div className="mb-6 border-b border-black/10 pb-5 relative z-10">
        <h1 className="text-2xl font-extrabold tracking-tight text-black font-sans uppercase text-glow-purple">
          {activeTab === 'orders' ? 'SHIPPER PORTAL' : activeTab === 'history' ? 'LỊCH SỬ GIAO NHẬN' : 'TÀI KHOẢN'}
        </h1>
        <p className="mt-1 text-[10px] text-mute font-semibold">
          {activeTab === 'orders' 
            ? 'Bảng điều khiển giao nhận di động chuyên biệt dành cho Nhân viên' 
            : activeTab === 'history' 
            ? 'Thống kê tài chính COD thu hộ và danh sách bưu phẩm đã hoàn tất'
            : 'Quản lý thông tin hồ sơ và tài khoản ngân hàng thụ hưởng nhận lương'}
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-3 mb-5 rounded shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative z-10">
          <div className="text-xs text-rose-800 font-bold">{error}</div>
        </div>
      )}

      {/* TAB 1: ACTIVE ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6 relative z-10 animate-fade-in">
          {/* Stats Summary Card */}
          <div className="bg-gradient-to-br from-white to-canvas-soft border border-accent-purple/30 text-black p-6 rounded-2xl shadow-[0_8px_32px_rgba(94,14,215,0.05)] flex items-center justify-between overflow-hidden relative group">
            <div className="relative z-10">
              <p className="text-[10px] font-bold tracking-widest text-mute uppercase mb-1">ĐƠN ĐANG CHỜ</p>
              <h2 className="text-xl font-extrabold tracking-tight text-glow-purple">Cần xử lý: {activeOrders.length} đơn</h2>
            </div>
            <span className="material-symbols-outlined text-accent-purple opacity-10 text-[64px] absolute -right-3 -bottom-3 select-none group-hover:scale-110 transition-transform duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
          </div>

          {/* Scanner Search Input Console */}
          <div className="bg-white/40 backdrop-blur-md border border-black/10 rounded-2xl p-4 shadow-sm">
            <form onSubmit={handleScanSubmit} className="space-y-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-black tracking-widest text-[#5E0ED7] uppercase flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5E0ED7] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5E0ED7]"></span>
                  </span>
                  <span>QUÉT MÃ VẬN ĐƠN NHẬN DIỆN NHANH</span>
                </label>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined text-[#5E0ED7] absolute left-3 select-none">qr_code_scanner</span>
                <input
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Nhập hoặc quét mã vạch A6..."
                  className="w-full pl-10 pr-20 py-3 bg-white border border-black/10 rounded-xl text-xs font-bold text-black placeholder-mute focus:outline-none focus:border-[#5E0ED7] focus:ring-1 focus:ring-[#5E0ED7] transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 px-3 py-1.5 bg-[#5E0ED7] text-white text-[9px] font-black uppercase tracking-wider rounded-lg hover:bg-[#4f0cb5] transition-all cursor-pointer shadow-[0_2px_8px_rgba(94,14,215,0.2)]"
                >
                  QUÉT MÃ
                </button>
              </div>
            </form>
          </div>

          {/* Delivery List Header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-black text-glow-purple">Đơn hàng đang xử lý</h3>
            <button onClick={fetchAssigned} className="text-xs font-extrabold text-accent-purple hover:text-[#6e19f1] transition-colors flex items-center gap-1 cursor-pointer">
              <span className="material-symbols-outlined text-xs">refresh</span> Tải lại
            </button>
          </div>

          {/* Active Orders List */}
          <div className="space-y-5">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="text-center py-12 bg-white/40 backdrop-blur-md rounded-2xl border border-black/10 text-xs font-semibold text-mute shadow-sm">
                Bạn chưa có đơn hàng nào cần giao lúc này.
              </div>
            ) : (
              activeOrders.map((o) => (
                <div 
                  key={o.order_id} 
                  id={`order-card-${o.order_id}`}
                  className={`glow-card border rounded-2xl p-5 space-y-4 transition-all duration-500 shadow-sm bg-white/50 ${
                    highlightedOrderId === o.order_id 
                      ? 'border-[#5E0ED7] ring-4 ring-[#5E0ED7]/15 shadow-[0_0_25px_rgba(94,14,215,0.25)] scale-[1.02]' 
                      : 'border-black/10 hover:border-accent-purple/30 hover:shadow-[0_10px_25px_rgba(94,14,215,0.08)]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-extrabold text-sm text-black">{o.order_id}</p>
                      <p className="text-[10px] text-accent-purple font-bold uppercase tracking-tight mt-0.5">
                        Cước phí: {o.fee.toLocaleString()} đ
                      </p>
                    </div>
                    {getStatusBadge(o.status)}
                  </div>

                  {/* Delivery Address block */}
                  <div className="flex gap-4 py-3 border-t border-b border-black/5">
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <span className="material-symbols-outlined text-accent-purple text-[20px]">person</span>
                      <div className="w-[3px] h-full bg-accent-purple/20 rounded-full"></div>
                      <span className="material-symbols-outlined text-indigo-800 text-[20px]">location_on</span>
                    </div>
                    <div className="space-y-4 flex-1">
                      <div>
                        <p className="text-sm font-extrabold text-black">{o.receiver_name}</p>
                        <a className="text-xs text-accent-purple hover:text-[#6e19f1] transition-colors flex items-center gap-1 font-semibold mt-1" href={`tel:${o.receiver_phone}`}>
                          <span className="material-symbols-outlined text-[14px]">call</span> {o.receiver_phone}
                        </a>
                      </div>
                      <div>
                        <p className="text-xs text-mute font-semibold leading-relaxed">
                          {o.receiver_address}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {o.cod > 0 && (
                      <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-black font-extrabold flex justify-between items-center text-xs shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                        <span className="text-[10px] uppercase tracking-wider text-mute">CẦN THU COD HỘ:</span>
                        <span className="text-amber-800 font-extrabold">{o.cod.toLocaleString()} đ</span>
                      </div>
                    )}
                    {o.description && (
                      <div className="text-xs font-semibold text-mute">
                        <span className="text-mute/60 mr-1.5 font-bold">Ghi chú:</span>
                        <span className="italic text-black/90">{o.description}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Update panel */}
                  {updatingOrderId === o.order_id ? (
                    <div className="space-y-3.5 bg-black/[0.02] p-4 rounded-xl border border-black/5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                      <div className="text-xs font-extrabold text-accent-purple uppercase tracking-wider text-glow-purple">Cập nhật hành trình</div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-mute uppercase mb-1">Trạng thái mới</label>
                        <div className="relative">
                          <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full text-xs bg-white border border-black/10 rounded-md p-2.5 font-bold focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-all text-black cursor-pointer"
                          >
                            <option value="" className="bg-white text-black">-- Chọn trạng thái --</option>
                            <option value="DA_LAY_HANG" className="bg-white text-black">Đã lấy hàng thành công (DA_LAY_HANG)</option>
                            <option value="DANG_VAN_CHUYEN" className="bg-white text-black">Đang đi giao hàng (DANG_VAN_CHUYEN)</option>
                            <option value="GIAO_THANH_CONG" className="bg-white text-black">Giao hàng Thành Công (GIAO_THANH_CONG)</option>
                            <option value="GIAO_THAT_BAI" className="bg-white text-black">Giao hàng Thất Bại (GIAO_THAT_BAI)</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-mute uppercase mb-1">Thông tin vị trí / Ghi chú</label>
                        <input
                          type="text"
                          placeholder="Ví dụ: Đang ở 120 Điện Biên Phủ, trời mưa..."
                          value={locationInfo}
                          onChange={(e) => setLocationInfo(e.target.value)}
                          className="w-full text-xs bg-white border border-black/10 rounded-md p-2.5 font-semibold focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-all text-black placeholder-mute"
                        />
                      </div>
                      
                      <div className="flex gap-2 pt-1.5">
                        <button
                          onClick={() => handleUpdateStatus(o.order_id)}
                          disabled={updating}
                          className="flex-1 py-2.5 bg-accent-purple text-white text-xs font-extrabold rounded-full hover:bg-[#6e19f1] active:scale-95 shadow-[0_2px_8px_rgba(94,14,215,0.22)] cursor-pointer transition-all uppercase tracking-wider"
                        >
                          {updating ? 'Đang lưu...' : 'Xác nhận'}
                        </button>
                        <button
                          onClick={() => setUpdatingOrderId(null)}
                          className="px-4 py-2.5 bg-transparent border border-black/10 text-black hover:bg-black/5 text-xs font-extrabold rounded-full transition-all cursor-pointer uppercase tracking-wider"
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
                      className="w-full py-3 bg-accent-purple text-white hover:bg-[#6e19f1] active:scale-95 rounded-full text-xs font-extrabold shadow-[0_4px_12px_rgba(94,14,215,0.22)] hover:shadow-[0_6px_20px_rgba(94,14,215,0.38)] cursor-pointer transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-xs">edit_note</span>
                      <span>Cập Nhật Trạng Thái</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DELIVERY HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6 relative z-10 animate-fade-in">
          {/* Reconciliation Stats Card */}
          <div className="bg-gradient-to-br from-white to-canvas-soft border border-emerald-500/20 text-black p-6 rounded-2xl shadow-[0_8px_32px_rgba(16,185,129,0.04)] space-y-4">
            <div className="flex justify-between items-center border-b border-black/5 pb-3">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-mute uppercase mb-0.5">TỔNG THU HỘ (COD)</p>
                <h2 className="text-xl font-black text-emerald-800 tracking-tight">{totalCODCollected.toLocaleString()} VND</h2>
              </div>
              <span className="material-symbols-outlined text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-250/20">payments</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/60 p-2.5 rounded-xl border border-black/5">
                <p className="text-[9px] font-bold text-mute uppercase">THÀNH CÔNG</p>
                <p className="text-sm font-extrabold text-emerald-850">{successCount} đơn</p>
              </div>
              <div className="bg-white/60 p-2.5 rounded-xl border border-black/5">
                <p className="text-[9px] font-bold text-mute uppercase">THẤT BẠI</p>
                <p className="text-sm font-extrabold text-rose-850">{failCount} đơn</p>
              </div>
            </div>
          </div>

          {/* Search bar inside history */}
          <div className="relative flex items-center">
            <span className="material-symbols-outlined text-mute absolute left-3 select-none">search</span>
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Tìm mã đơn, tên hoặc SĐT khách..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/50 backdrop-blur-md border border-black/10 rounded-xl text-xs font-semibold text-black placeholder-mute focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-all"
            />
          </div>

          {/* History Orders List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12 bg-white/40 backdrop-blur-md rounded-2xl border border-black/10 text-xs font-semibold text-mute shadow-sm">
                Không tìm thấy đơn hàng lịch sử nào phù hợp.
              </div>
            ) : (
              filteredHistory.map((o) => (
                <div 
                  key={o.order_id} 
                  className={`border rounded-2xl p-5 space-y-3 bg-white/50 border-black/10 transition-all ${
                    selectedTimelineOrderId === o.order_id ? 'ring-2 ring-accent-purple/20 border-accent-purple/35 shadow-sm' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-extrabold text-xs text-black">{o.order_id}</p>
                      <p className="text-[9px] text-mute font-bold mt-0.5">
                        Ngày tạo: {new Date(o.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    {getStatusBadge(o.status)}
                  </div>

                  <div className="text-xs space-y-1 text-black border-t border-black/5 pt-2">
                    <p className="font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-mute">person</span>
                      <span>Khách hàng: {o.receiver_name}</span>
                    </p>
                    <p className="text-mute/80 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-mute">location_on</span>
                      <span className="truncate">{o.receiver_address}</span>
                    </p>
                    {o.cod > 0 && (
                      <p className="text-amber-800 font-extrabold flex items-center gap-1 text-[11px] mt-1 bg-amber-50/50 p-1.5 rounded-lg border border-amber-100">
                        <span className="material-symbols-outlined text-[14px]">monetization_on</span>
                        <span>Đã thu COD: {o.cod.toLocaleString()} đ</span>
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => toggleTimeline(o.order_id)}
                    className="w-full mt-1.5 py-2 bg-white/80 hover:bg-black/5 border border-black/10 text-black hover:border-black/20 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 uppercase tracking-wider shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[14px]">alt_route</span>
                    <span>{selectedTimelineOrderId === o.order_id ? 'Ẩn Lịch Trình' : 'Xem Chi Tiết Lịch Trình'}</span>
                  </button>

                  {/* Inline Timeline container */}
                  {selectedTimelineOrderId === o.order_id && (
                    <div className="bg-black/[0.02] border border-black/5 rounded-xl p-4 mt-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
                      <div className="text-[10px] font-black uppercase text-accent-purple tracking-widest">Hành Trình Bưu Gửi</div>
                      
                      {timelineLoading && !timelineData[o.order_id] ? (
                        <div className="flex justify-center items-center py-4">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-purple"></div>
                        </div>
                      ) : !timelineData[o.order_id] || timelineData[o.order_id].length === 0 ? (
                        <div className="text-[10px] font-semibold text-mute italic">Không có dữ liệu lịch trình của đơn này.</div>
                      ) : (
                        <div className="relative border-l border-accent-purple/20 pl-4 ml-2 space-y-4 py-1">
                          {timelineData[o.order_id].map((evt, idx) => (
                            <div key={idx} className="relative">
                              {/* Dot status indicator */}
                              <div className={`absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full border-2 bg-white ${
                                idx === 0 
                                  ? 'border-accent-purple shadow-[0_0_8px_rgba(94,14,215,0.4)] animate-pulse scale-110' 
                                  : 'border-accent-purple/40'
                              }`}></div>
                              
                              <div>
                                <div className="flex justify-between items-center">
                                  <span className={`text-[10px] font-extrabold uppercase ${idx === 0 ? 'text-accent-purple' : 'text-black/70'}`}>
                                    {getTimelineStatusText(evt.status)}
                                  </span>
                                  <span className="text-[8px] text-mute font-bold">
                                    {new Date(evt.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(evt.time).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>
                                {evt.info && (
                                  <p className="text-[9.5px] font-semibold text-mute leading-relaxed mt-0.5 italic">
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

      {/* TAB 3: PROFILE & BANK ACCOUNT */}
      {activeTab === 'account' && (
        <div className="space-y-6 relative z-10 animate-fade-in">
          {profileLoading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Profile Avatar Card */}
              <div className="flex flex-col items-center py-5 bg-white/40 border border-black/10 backdrop-blur-md rounded-2xl shadow-sm text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent-purple to-cyan-500"></div>
                
                <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-accent-purple to-pink-500 flex items-center justify-center text-white text-xl font-extrabold shadow-md mb-3 border-2 border-white">
                  {getInitials(profile.fullname)}
                </div>
                
                <h3 className="text-base font-extrabold text-black">{profile.fullname || 'Chưa thiết lập'}</h3>
                <span className="px-2.5 py-0.5 text-[9px] font-extrabold rounded-full bg-accent-purple/10 text-accent-purple border border-accent-purple/20 shadow-[0_2px_8px_rgba(94,14,215,0.05)] uppercase mt-1.5 tracking-wider">
                  Nhân Viên Giao Nhận
                </span>
              </div>

              {/* Personal Info Box */}
              <div className="bg-white/50 border border-black/10 rounded-2xl p-5 space-y-4 shadow-sm">
                <h4 className="text-xs font-black uppercase text-accent-purple tracking-widest mb-1">Thông tin tài khoản</h4>
                
                <div className="grid grid-cols-1 gap-4.5">
                  <div>
                    <label className="block text-[9px] font-bold text-mute uppercase mb-1.5">Tên đăng nhập (Read-Only)</label>
                    <input
                      type="text"
                      disabled
                      value={profile.username}
                      className="w-full bg-black/[0.03] text-black/50 border border-black/5 rounded-xl px-3.5 py-2.5 text-xs font-semibold select-none focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-mute uppercase mb-1.5">Vai trò hệ thống</label>
                    <input
                      type="text"
                      disabled
                      value="NHANVIEN (Shipper)"
                      className="w-full bg-black/[0.03] text-black/50 border border-black/5 rounded-xl px-3.5 py-2.5 text-xs font-semibold select-none focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-mute uppercase mb-1.5">Họ và Tên</label>
                    <input
                      type="text"
                      placeholder="Nhập họ và tên..."
                      value={profile.fullname}
                      onChange={(e) => setProfile({ ...profile, fullname: e.target.value })}
                      className="w-full bg-white border border-black/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-black focus:outline-none focus:border-[#5E0ED7] focus:ring-1 focus:ring-[#5E0ED7] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Account Config Box */}
              <div className="bg-white/50 border border-black/10 rounded-2xl p-5 space-y-4 shadow-sm">
                <h4 className="text-xs font-black uppercase text-accent-purple tracking-widest mb-1">Tài khoản thụ hưởng</h4>
                
                <div className="grid grid-cols-1 gap-4.5">
                  <div>
                    <label className="block text-[9px] font-bold text-mute uppercase mb-1.5">Tên Ngân Hàng</label>
                    <select
                      value={profile.bank_name || ''}
                      onChange={(e) => setProfile({ ...profile, bank_name: e.target.value })}
                      className="w-full bg-white border border-black/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-black focus:outline-none focus:border-[#5E0ED7] focus:ring-1 focus:ring-[#5E0ED7] transition-all cursor-pointer"
                    >
                      <option value="">-- Chọn ngân hàng --</option>
                      <option value="Vietcombank">Vietcombank (VCB)</option>
                      <option value="MB Bank">Ngân hàng Quân đội (MB Bank)</option>
                      <option value="Techcombank">Techcombank (TCB)</option>
                      <option value="ACB">Á Châu Bank (ACB)</option>
                      <option value="BIDV">Ngân hàng Đầu tư (BIDV)</option>
                      <option value="VietinBank">VietinBank</option>
                      <option value="Sacombank">Sacombank</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-mute uppercase mb-1.5">Số Tài Khoản</label>
                    <input
                      type="text"
                      placeholder="Nhập số tài khoản thụ hưởng..."
                      value={profile.bank_account || ''}
                      onChange={(e) => setProfile({ ...profile, bank_account: e.target.value })}
                      className="w-full bg-white border border-black/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-black focus:outline-none focus:border-[#5E0ED7] focus:ring-1 focus:ring-[#5E0ED7] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-mute uppercase mb-1.5">Tên Chủ Tài Khoản (Không dấu)</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: NGUYEN VAN A"
                      value={profile.bank_owner || ''}
                      onChange={(e) => setProfile({ ...profile, bank_owner: e.target.value.toUpperCase() })}
                      className="w-full bg-white border border-black/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-black focus:outline-none focus:border-[#5E0ED7] focus:ring-1 focus:ring-[#5E0ED7] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-3 bg-gradient-to-r from-accent-purple to-indigo-800 text-white text-xs font-extrabold uppercase tracking-wider rounded-full hover:from-[#6e19f1] hover:to-indigo-900 shadow-[0_4px_16px_rgba(94,14,215,0.22)] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {savingProfile ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">save</span>
                      <span>Lưu Thay Đổi</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-3 bg-transparent border border-rose-500/35 hover:bg-rose-50/20 text-rose-500 hover:text-rose-600 text-xs font-extrabold uppercase tracking-wider rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(244,63,94,0.03)]"
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
      <nav className="fixed bottom-4 left-4 right-4 z-50 h-16 bg-white/85 backdrop-blur-md border border-black/10 rounded-full flex justify-around items-center px-4 shadow-[0_10px_35px_rgba(0,0,0,0.06)] max-w-md mx-auto">
        <button 
          onClick={() => handleTabChange('orders')}
          className={`flex flex-col items-center justify-center pt-1 transition-all cursor-pointer outline-none ${
            activeTab === 'orders' 
              ? 'text-accent-purple text-glow-purple font-bold text-xs' 
              : 'text-mute hover:text-black font-semibold text-xs'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === 'orders' ? "'FILL' 1" : "'FILL' 0" }}>local_shipping</span>
          <span className="mt-1">Đơn hàng</span>
        </button>
        
        <button 
          onClick={() => handleTabChange('history')}
          className={`flex flex-col items-center justify-center pt-1 transition-all cursor-pointer outline-none ${
            activeTab === 'history' 
              ? 'text-accent-purple text-glow-purple font-bold text-xs' 
              : 'text-mute hover:text-black font-semibold text-xs'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === 'history' ? "'FILL' 1" : "'FILL' 0" }}>history</span>
          <span className="mt-1">Lịch sử</span>
        </button>
        
        <button 
          onClick={() => handleTabChange('account')}
          className={`flex flex-col items-center justify-center pt-1 transition-all cursor-pointer outline-none ${
            activeTab === 'account' 
              ? 'text-accent-purple text-glow-purple font-bold text-xs' 
              : 'text-mute hover:text-black font-semibold text-xs'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === 'account' ? "'FILL' 1" : "'FILL' 0" }}>person</span>
          <span className="mt-1">Tài khoản</span>
        </button>
      </nav>
    </div>
  );
}
