import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { OrderService, AuthService, TrackingService, ChatService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [shippers, setShippers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assigningOrderId, setAssigningOrderId] = useState(null);
  const [selectedShipperId, setSelectedShipperId] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // Custom states for interactive widgets
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [trackingData, setTrackingData] = useState({});
  const [trackingLoading, setTrackingLoading] = useState({});
  const [hoveredChartPoint, setHoveredChartPoint] = useState(null);

  // Operational Segmented views: 'dispatcher' | 'complaints'
  const [activeView, setActiveView] = useState(user?.role === 'CSKH' ? 'complaints' : 'dispatcher');

  // CSKH Complaints states
  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [typingStatus, setTypingStatus] = useState(null); // { username, is_typing }
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const isWarehouse = !!user?.warehouse_id;

  // Active view default logic or redirect based on role (security patch)
  useEffect(() => {
    if (user) {
      if (user.role === 'HR') {
        navigate('/admin/users');
      } else if (user.role === 'KETOAN') {
        navigate('/admin/invoices');
      }
    }
  }, [user, navigate]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderRes, shipperRes] = await Promise.all([
        OrderService.getOrders(),
        AuthService.getUsers('NHANVIEN')
      ]);

      if (orderRes.success) {
        setOrders(orderRes.data);
      }
      if (shipperRes.success) {
        setShippers(shipperRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Không thể tải dữ liệu quản trị.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch complaints list
  const fetchComplaints = async () => {
    try {
      setComplaintsLoading(true);
      const res = await ChatService.getComplaints();
      if (res.success) {
        setComplaints(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setComplaintsLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'complaints') {
      fetchComplaints();
    }
  }, [activeView]);

  // Connect Socket.io client
  useEffect(() => {
    const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `${window.location.protocol}//${window.location.hostname}`;
    const socket = io(socketUrl, { autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log("🔌 Connected to Socket.io backend!");
    });

    socket.on('receive_message', (payload) => {
      if (activeTicket && payload.room === activeTicket.order_id) {
        setMessages(prev => {
          if (prev.some(m => m.message_id === payload.message_id)) return prev;
          return [...prev, payload];
        });
      }
    });

    socket.on('typing', (payload) => {
      if (activeTicket && payload.room === activeTicket.order_id) {
        setTypingStatus(payload.is_typing ? { username: payload.username } : null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [activeTicket]);

  // Handle joining room and loading history
  useEffect(() => {
    if (!socketRef.current || !activeTicket) return;

    const room = activeTicket.order_id;
    socketRef.current.emit('join_room', {
      room,
      username: user?.fullname || 'CSKH Staff'
    });

    const loadHistory = async () => {
      try {
        const res = await ChatService.getHistory(room);
        if (res.success) {
          setMessages(res.data);
        }
      } catch (err) {
        console.error("Lỗi khi tải lịch sử chat:", err);
      }
    };
    loadHistory();

    return () => {
      socketRef.current.emit('leave_room', {
        room,
        username: user?.fullname || 'CSKH Staff'
      });
      setMessages([]);
      setTypingStatus(null);
    };
  }, [activeTicket, user]);

  // Auto-scroll messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socketRef.current || !activeTicket) return;

    socketRef.current.emit('typing', {
      room: activeTicket.order_id,
      is_typing: e.target.value.length > 0,
      username: user?.fullname || 'CSKH Staff'
    });
  };

  const handleSendMessage = async (e, fileUrl = null) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !fileUrl) return;
    if (!socketRef.current || !activeTicket) return;

    const messagePayload = {
      room: activeTicket.order_id,
      sender_id: user?.id,
      receiver_id: activeTicket.customer_id,
      content: inputText,
      file_url: fileUrl
    };

    socketRef.current.emit('send_message', messagePayload);
    setInputText('');

    socketRef.current.emit('typing', {
      room: activeTicket.order_id,
      is_typing: false,
      username: user?.fullname || 'CSKH Staff'
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeTicket) return;

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await ChatService.uploadFile(formData);
      if (res.success) {
        showToast("Tải ảnh đính kèm thành công!");
        handleSendMessage(null, res.file_url);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi tải tệp tin lên.", "error");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleUpdateTicketStatus = async (status) => {
    if (!activeTicket) return;
    try {
      const res = await ChatService.updateComplaintStatus(activeTicket.ticket_id, status);
      if (res.success) {
        showToast(res.message);
        setActiveTicket(prev => ({ ...prev, status }));
        fetchComplaints();
      }
    } catch (err) {
      showToast("Không thể cập nhật trạng thái khiếu nại.", "error");
    }
  };

  const handleAssign = async (orderId) => {
    if (!selectedShipperId) {
      showToast('Vui lòng chọn một nhân viên giao hàng!', 'error');
      return;
    }

    try {
      const res = await OrderService.assignShipper(orderId, selectedShipperId);
      if (res.success) {
        showToast(res.message);
        setAssigningOrderId(null);
        setSelectedShipperId('');
        fetchData();
        // Clear cached tracking for this order if any
        if (trackingData[orderId]) {
          const freshTracking = await TrackingService.trackOrder(orderId);
          if (freshTracking.success) {
            setTrackingData(prev => ({ ...prev, [orderId]: freshTracking.data?.timeline || [] }));
          }
        }
      } else {
        showToast(res.message || 'Phân công thất bại.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi phân công.', 'error');
    }
  };

  // Warehouse internal check-in & check-out actions
  const handleHubCheckin = async (orderId) => {
    try {
      const hubName = user?.warehouse_id === 1 ? 'Tổng Kho Miền Bắc (MB)' : 'Tổng Kho Miền Nam (MN)';
      const res = await OrderService.hubCheckin(orderId, { hub_name: hubName });
      if (res.success) {
        showToast(res.message);
        fetchData();
        if (trackingData[orderId]) {
          const freshTracking = await TrackingService.trackOrder(orderId);
          if (freshTracking.success) {
            setTrackingData(prev => ({ ...prev, [orderId]: freshTracking.data?.timeline || [] }));
          }
        }
      } else {
        showToast(res.message || 'Nhập kho thất bại.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi nhập kho.', 'error');
    }
  };

  const handleHubCheckout = async (orderId) => {
    try {
      const hubName = user?.warehouse_id === 1 ? 'Tổng Kho Miền Bắc (MB)' : 'Tổng Kho Miền Nam (MN)';
      const res = await OrderService.hubCheckout(orderId, { hub_name: hubName });
      if (res.success) {
        showToast(res.message);
        fetchData();
        if (trackingData[orderId]) {
          const freshTracking = await TrackingService.trackOrder(orderId);
          if (freshTracking.success) {
            setTrackingData(prev => ({ ...prev, [orderId]: freshTracking.data?.timeline || [] }));
          }
        }
      } else {
        showToast(res.message || 'Xuất kho thất bại.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi xuất kho.', 'error');
    }
  };

  const toggleOrderExpand = async (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    
    if (!trackingData[orderId]) {
      try {
        setTrackingLoading(prev => ({ ...prev, [orderId]: true }));
        const res = await TrackingService.trackOrder(orderId);
        if (res.success) {
          setTrackingData(prev => ({ ...prev, [orderId]: res.data?.timeline || [] }));
        }
      } catch (err) {
        console.error("Lỗi khi tải hành trình:", err);
      } finally {
        setTrackingLoading(prev => ({ ...prev, [orderId]: false }));
      }
    }
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'CHO_LAY_HANG':
        return {
          badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-[0_2px_8px_rgba(245,158,11,0.08)]',
          dot: 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
        };
      case 'DA_LAY_HANG':
      case 'DANG_VAN_CHUYEN':
        return {
          badge: 'bg-purple-500/10 text-purple-600 border-purple-500/20 shadow-[0_2px_8px_rgba(94,14,215,0.08)]',
          dot: 'bg-purple-600 shadow-[0_0_8px_#5E0ED7]'
        };
      case 'DEN_KHO_TRUNG_CHUYEN':
        return {
          badge: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 shadow-[0_2px_8px_rgba(6,182,212,0.08)]',
          dot: 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]'
        };
      case 'ROI_KHO_TRUNG_CHUYEN':
        return {
          badge: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 shadow-[0_2px_8px_rgba(99,102,241,0.08)]',
          dot: 'bg-indigo-500 shadow-[0_0_8px_#6366f1]'
        };
      case 'GIAO_THANH_CONG':
        return {
          badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 shadow-[0_2px_8px_rgba(16,185,129,0.08)]',
          dot: 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
        };
      case 'GIAO_THAT_BAI':
        return {
          badge: 'bg-rose-500/10 text-rose-700 border-rose-500/20 shadow-[0_2px_8px_rgba(244,63,94,0.08)]',
          dot: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
        };
      default:
        return {
          badge: 'bg-black/5 text-black/60 border-black/10',
          dot: 'bg-black/40'
        };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'CHO_LAY_HANG': return 'Chờ lấy hàng';
      case 'DA_LAY_HANG': return 'Đã lấy hàng';
      case 'DANG_VAN_CHUYEN': return 'Đang vận chuyển';
      case 'DEN_KHO_TRUNG_CHUYEN': return 'Đã tới kho TC';
      case 'ROI_KHO_TRUNG_CHUYEN': return 'Rời kho TC';
      case 'GIAO_THANH_CONG': return 'Thành công';
      case 'GIAO_THAT_BAI': return 'Thất bại';
      default: return status;
    }
  };

  const getStatusBadge = (status) => {
    const classes = getStatusColorClass(status);
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border ${classes.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${classes.dot}`}></span>
        {getStatusText(status)}
      </span>
    );
  };

  // Metrics summary for Branch vs Warehouse
  const totalCount = orders.length;
  const pendingCount = orders.filter(o => o.status === 'CHO_LAY_HANG').length;
  const transitCount = orders.filter(o => o.status === 'DANG_VAN_CHUYEN' || o.status === 'DA_LAY_HANG').length;
  const successCount = orders.filter(o => o.status === 'GIAO_THANH_CONG').length;
  const failureCount = orders.filter(o => o.status === 'GIAO_THAT_BAI').length;

  // Warehouse operational specific milestones
  const inboundCount = orders.filter(o => o.status !== 'DEN_KHO_TRUNG_CHUYEN' && o.status !== 'ROI_KHO_TRUNG_CHUYEN' && o.status !== 'GIAO_THANH_CONG' && o.status !== 'GIAO_THAT_BAI').length;
  const inventoryCount = orders.filter(o => o.status === 'DEN_KHO_TRUNG_CHUYEN').length;
  const outboundCount = orders.filter(o => o.status === 'ROI_KHO_TRUNG_CHUYEN' || o.status === 'GIAO_THANH_CONG' || o.status === 'GIAO_THAT_BAI').length;

  // Filter orders based on search and status tabs (dynamic Branch / Warehouse check)
  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      (o.order_id && o.order_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.receiver && o.receiver.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.DiaChiNhan && o.DiaChiNhan.toLowerCase().includes(searchQuery.toLowerCase()));
      
    if (!matchesSearch) return false;

    if (isWarehouse) {
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'INBOUND') return o.status !== 'DEN_KHO_TRUNG_CHUYEN' && o.status !== 'ROI_KHO_TRUNG_CHUYEN' && o.status !== 'GIAO_THANH_CONG' && o.status !== 'GIAO_THAT_BAI';
      if (statusFilter === 'INVENTORY') return o.status === 'DEN_KHO_TRUNG_CHUYEN';
      if (statusFilter === 'OUTBOUND') return o.status === 'ROI_KHO_TRUNG_CHUYEN' || o.status === 'GIAO_THANH_CONG' || o.status === 'GIAO_THAT_BAI';
    } else {
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'PENDING') return o.status === 'CHO_LAY_HANG';
      if (statusFilter === 'TRANSIT') return o.status === 'DANG_VAN_CHUYEN' || o.status === 'DA_LAY_HANG';
      if (statusFilter === 'SUCCESS') return o.status === 'GIAO_THANH_CONG';
    }
    return true;
  });

  // Calculate dynamic active load for each driver (orders currently assigned and not completed)
  const getRiderLoad = (shipperId) => {
    const assigned = orders.filter(o => o.MaNhanVienGiao === shipperId);
    const active = assigned.filter(o => o.status !== 'GIAO_THANH_CONG' && o.status !== 'GIAO_THAT_BAI').length;
    const completed = assigned.filter(o => o.status === 'GIAO_THANH_CONG').length;
    const failed = assigned.filter(o => o.status === 'GIAO_THAT_BAI').length;
    return { active, completed, failed, total: assigned.length };
  };

  // Analytics helper: 7 days Volume Trend Data Simulator/Calculator
  const generateVolumeTrendData = () => {
    const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    const values = [
      Math.max(2, Math.round(totalCount * 0.4)),
      Math.max(4, Math.round(totalCount * 0.6)),
      Math.max(3, Math.round(totalCount * 0.5)),
      Math.max(6, Math.round(totalCount * 0.8)),
      Math.max(8, Math.round(totalCount * 0.9)),
      Math.max(10, totalCount),
      Math.max(5, Math.round(totalCount * 0.7))
    ];
    
    return days.map((day, idx) => ({
      day,
      orders: values[idx],
      delivered: Math.max(1, Math.round(values[idx] * 0.8)),
      revenue: values[idx] * 35000
    }));
  };

  const chartData = generateVolumeTrendData();
  const maxChartVal = Math.max(...chartData.map(d => d.orders), 1);

  // Donut SVG Math helper
  const donutRadius = 55;
  const donutCircumference = 2 * Math.PI * donutRadius; // ~345.57
  const donutSegments = (() => {
    if (totalCount === 0) {
      return [
        { label: 'Không có dữ liệu', value: 1, color: '#e5e7eb', dashArray: `${donutCircumference} ${donutCircumference}`, dashOffset: 0 }
      ];
    }
    
    const stats = [
      { label: 'Thành công', value: successCount, color: '#10b981' }, 
      { label: 'Đang vận chuyển', value: transitCount, color: '#5E0ED7' }, 
      { label: 'Chờ lấy hàng', value: pendingCount, color: '#f59e0b' }, 
      { label: 'Giao thất bại', value: failureCount, color: '#f43f5e' } 
    ].filter(s => s.value > 0);

    let currentOffset = 0;
    return stats.map(s => {
      const percentage = s.value / totalCount;
      const length = percentage * donutCircumference;
      const dashArray = `${length} ${donutCircumference}`;
      const dashOffset = -currentOffset;
      currentOffset += length;
      
      return {
        ...s,
        percentage: Math.round(percentage * 100),
        dashArray,
        dashOffset
      };
    });
  })();

  return (
    <div className="w-full relative">
      {/* Toast Alert */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[150] flex items-center gap-3 p-4 rounded-xl shadow-xl transition-all duration-300 bg-white/95 backdrop-blur-xl border border-black/10 text-black shadow-[0_10px_35px_rgba(0,0,0,0.06)] animate-slide-in">
          <div className="w-8 h-8 rounded-full bg-accent-purple/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-accent-purple text-base">notifications</span>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-accent-purple">{toast.type === 'error' ? 'Thất bại' : 'Thành công'}</p>
            <p className="text-sm font-semibold opacity-90">{toast.message}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 mb-8 rounded-r-2xl shadow-sm">
          <div className="text-sm font-semibold text-rose-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        </div>
      )}

      {/* Tab bar for Admins/QUANTRI to switch between Dispatcher and Complaints Live Chat */}
      {user?.role !== 'CSKH' && (
        <div className="flex p-1 bg-black/[0.03] backdrop-blur-md rounded-xl max-w-lg mb-8 border border-black/10 text-black font-sans">
          <button
            onClick={() => setActiveView('dispatcher')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeView === 'dispatcher'
                ? 'bg-accent-purple text-white shadow-[0_4px_12px_rgba(94,14,215,0.2)]'
                : 'text-mute hover:text-black bg-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-sm">dashboard</span>
            <span>{isWarehouse ? 'Vận Hành Trung Chuyển' : 'Điều Hành Vận Đơn'}</span>
          </button>
          <button
            onClick={() => setActiveView('complaints')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeView === 'complaints'
                ? 'bg-accent-purple text-white shadow-[0_4px_12px_rgba(94,14,215,0.2)]'
                : 'text-mute hover:text-black bg-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-sm">support_agent</span>
            <span>Quầy Live Chat CSKH</span>
          </button>
        </div>
      )}

      {activeView === 'complaints' ? (
        /* DOUBLE-PANE LIVE CHAT & COMPLAINTS WORKSPACE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-black font-sans animate-fade-in min-h-[600px] h-[calc(100vh-220px)]">
          
          {/* LEFT PANE: TICKETS LIST (4 columns) */}
          <div className="lg:col-span-4 bg-white/60 border border-black/10 rounded-3xl p-5 shadow-sm flex flex-col h-full min-w-0">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-purple text-glow-purple">support_agent</span>
                <h3 className="font-extrabold text-xs uppercase tracking-wider font-display">Inbox Khiếu Nại</h3>
              </div>
              <button 
                onClick={fetchComplaints}
                className="p-1.5 bg-black/5 hover:bg-black/10 rounded-full cursor-pointer transition-all flex items-center justify-center border border-black/10 shadow-sm"
                title="Tải lại khiếu nại"
              >
                <span className="material-symbols-outlined text-xs">refresh</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {complaintsLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-purple"></div>
                </div>
              ) : complaints.length === 0 ? (
                <div className="text-center py-16 text-mute italic text-xs">
                  Không có khiếu nại nào cần xử lý.
                </div>
              ) : (
                complaints.map((ticket) => (
                  <div 
                    key={ticket.ticket_id} 
                    onClick={() => setActiveTicket(ticket)}
                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col gap-2 ${
                      activeTicket?.ticket_id === ticket.ticket_id
                        ? 'bg-accent-purple/10 border-accent-purple shadow-[0_4px_12px_rgba(94,14,215,0.06)]'
                        : 'bg-white/50 border-black/5 hover:border-accent-purple/35 hover:bg-white/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-black">{ticket.order_id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        ticket.status === 'DA_XU_LY'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
                          : ticket.status === 'DANG_XU_LY'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
                      }`}>
                        {ticket.status === 'DA_XU_LY' ? 'Đã xử lý' : ticket.status === 'DANG_XU_LY' ? 'Đang xử lý' : 'Chờ tiếp nhận'}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-black truncate">{ticket.title}</h4>
                    <p className="text-[10px] text-mute line-clamp-2 leading-relaxed">{ticket.content}</p>
                    <div className="flex justify-between items-center text-[9px] text-mute font-semibold mt-1 pt-1 border-t border-black/[0.03]">
                      <span>Khách: {ticket.customer_name}</span>
                      <span>{new Date(ticket.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT PANE: LIVE CHAT AREA (8 columns) */}
          {activeTicket ? (
            <div className="lg:col-span-8 bg-white/60 border border-black/10 rounded-3xl p-6 shadow-sm flex flex-col h-full min-w-0">
              {/* Active Ticket Header */}
              <div className="flex items-center justify-between border-b border-black/5 pb-4 mb-4 flex-shrink-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-xs text-black uppercase tracking-wider font-display">Complaints Ticket #{activeTicket.ticket_id}</h3>
                    <span className="text-[10px] text-accent-purple font-black bg-accent-purple/10 border border-accent-purple/20 px-2 py-0.5 rounded font-mono">{activeTicket.order_id}</span>
                  </div>
                  <h4 className="font-bold text-xs text-black truncate mt-1.5">{activeTicket.title}</h4>
                </div>

                {/* Change status actions */}
                <div className="flex items-center gap-2">
                  {activeTicket.status !== 'DA_XU_LY' ? (
                    <button
                      onClick={() => handleUpdateTicketStatus('DA_XU_LY')}
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_2px_8px_rgba(16,185,129,0.18)]"
                    >
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      <span>Đóng Khiếu Nại</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateTicketStatus('DANG_XU_LY')}
                      className="px-3.5 py-2 bg-accent-purple hover:bg-[#6e19f1] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_2px_8px_rgba(94,14,215,0.18)]"
                    >
                      <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                      <span>Mở Lại Ticket</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 overflow-y-auto pr-2 mb-4 space-y-4 custom-scrollbar">
                {/* Original ticket details bubble */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] bg-black/5 rounded-2xl rounded-tl-none p-4 border border-black/5 flex flex-col gap-1.5">
                    <span className="text-[9px] font-black text-accent-purple uppercase tracking-widest">Nội dung khiếu nại gốc</span>
                    <p className="text-xs text-black mt-1 font-semibold leading-relaxed">{activeTicket.content}</p>
                    <span className="text-[8px] text-mute font-bold mt-1 self-end">
                      {new Date(activeTicket.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>

                {messages.map((m) => {
                  const isMe = m.sender_id === user?.id || m.sender_name === user?.fullname;
                  return (
                    <div key={m.message_id || Math.random()} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl p-4 flex flex-col gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${
                        isMe
                          ? 'bg-accent-purple text-white rounded-tr-none'
                          : 'bg-white text-black border border-black/5 rounded-tl-none'
                      }`}>
                        <span className={`text-[8px] font-black uppercase tracking-wider ${isMe ? 'text-purple-200' : 'text-accent-purple'}`}>
                          {isMe ? 'CSKH Staff' : (m.sender_name || 'Khách Hàng')}
                        </span>
                        {m.content && <p className="text-xs font-semibold leading-relaxed">{m.content}</p>}
                        {m.file_url && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-black/10 max-w-xs shadow-sm">
                            <img 
                              src={m.file_url} 
                              alt="Attachment" 
                              className="max-h-48 w-full object-cover cursor-pointer hover:scale-[1.02] transition-transform" 
                              onClick={() => window.open(m.file_url, '_blank')} 
                            />
                          </div>
                        )}
                        <span className={`text-[8px] font-bold mt-1 text-right block ${isMe ? 'text-purple-200/70' : 'text-mute'}`}>
                          {new Date(m.created_at || m.NgayTao || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                
                {typingStatus && (
                  <div className="flex justify-start">
                    <div className="bg-black/5 rounded-2xl rounded-tl-none px-4 py-2.5 text-[10px] text-mute font-bold italic animate-pulse flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-mute animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-mute animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-mute animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      <span>{typingStatus.username} đang nhập...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Message Form */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-3 border-t border-black/5 pt-4 flex-shrink-0">
                <label className="p-3 bg-black/5 hover:bg-black/10 rounded-full cursor-pointer transition-all border border-black/10 flex items-center justify-center flex-shrink-0 shadow-sm" title="Đính kèm hình ảnh">
                  <input type="file" onChange={handleFileUpload} accept="image/*" className="hidden" disabled={uploadingFile || uploadingFile} />
                  <span className="material-symbols-outlined text-black/70 text-base">image</span>
                </label>
                
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="Nhập nội dung tin nhắn hỗ trợ giải quyết sự vụ..."
                  className="flex-1 px-5 py-3 bg-black/[0.015] border border-black/10 rounded-full font-semibold text-xs text-black focus:outline-none focus:ring-1 focus:ring-accent-purple focus:border-accent-purple focus:bg-white transition-all shadow-inner"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-3 bg-accent-purple text-white hover:bg-[#6e19f1] rounded-full transition-all flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(94,14,215,0.18)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="lg:col-span-8 bg-white/40 border border-black/10 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[500px]">
              <span className="material-symbols-outlined text-5xl text-black/15 mb-4 animate-bounce" style={{ animationDuration: '3s' }}>chat_bubble</span>
              <h3 className="font-display font-extrabold text-sm text-black uppercase tracking-wider">CSKH Live Support Console</h3>
              <p className="text-mute text-xs max-w-sm mt-2 leading-relaxed font-semibold">Chọn một khiếu nại từ danh sách hộp thư bên trái để bắt đầu buổi Live Chat trực tiếp 1-1 với khách hàng.</p>
            </div>
          )}
        </div>
      ) : (
        /* STANDARD Logistical Dispatcher / Warehouse Controller WORKSPACE */
        <div className="space-y-12">
          
          {/* Statistical Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glow-card p-6 border border-black/10 bg-white/65 rounded-2xl flex flex-col gap-2 hover:border-accent-purple/50 transition-all hover:shadow-[0_10px_25px_rgba(94,14,215,0.08)] group cursor-default shadow-sm duration-300">
              <span className="text-mute font-bold text-xs uppercase tracking-wider">
                {isWarehouse ? 'Lượng Cargo Chuyển' : 'Vận Đơn Hoạt Động'}
              </span>
              <span className="text-4xl font-extrabold text-black font-display text-glow-purple">{orders.length}</span>
              <div className="mt-4 flex items-center gap-1.5 text-accent-purple font-semibold text-xs">
                <span className="material-symbols-outlined text-[18px]">trending_up</span>
                <span>+12% so với hôm qua</span>
              </div>
            </div>
            
            <div className="glow-card p-6 border border-black/10 bg-white/65 rounded-2xl flex flex-col gap-2 hover:border-accent-purple/50 transition-all hover:shadow-[0_10px_25px_rgba(94,14,215,0.08)] group cursor-default shadow-sm duration-300">
              <span className="text-mute font-bold text-xs uppercase tracking-wider">
                {isWarehouse ? 'Chờ Nhập Trạm' : 'Chờ Gán Shipper'}
              </span>
              <span className="text-4xl font-extrabold text-amber-800 font-display text-glow-amber">
                {isWarehouse ? inboundCount : pendingCount}
              </span>
              <div className="mt-4 flex items-center gap-1.5 text-mute font-semibold text-xs">
                <span className="material-symbols-outlined text-[18px] text-amber-700 animate-pulse">schedule</span>
                <span>{isWarehouse ? inboundCount : pendingCount} bưu gửi chờ xử lý</span>
              </div>
            </div>
            
            <div className="glow-card p-6 border border-black/10 bg-white/65 rounded-2xl flex flex-col gap-2 hover:border-accent-purple/50 transition-all hover:shadow-[0_10px_25px_rgba(94,14,215,0.08)] group cursor-default shadow-sm duration-300">
              <span className="text-mute font-bold text-xs uppercase tracking-wider">
                {isWarehouse ? 'Đang Lưu Kho' : 'Đang Vận Chuyển'}
              </span>
              <span className="text-4xl font-extrabold text-accent-purple font-display text-glow-purple">
                {isWarehouse ? inventoryCount : transitCount}
              </span>
              <div className="mt-4 flex items-center gap-1.5 text-accent-purple font-semibold text-xs">
                <span className="w-2 h-2 rounded-full bg-accent-purple animate-ping"></span>
                <span>{isWarehouse ? 'Vị trí lưu kho an toàn' : 'Hệ thống bưu tá trực tuyến'}</span>
              </div>
            </div>
            
            <div className="glow-card p-6 border border-black/10 bg-white/65 rounded-2xl flex flex-col gap-2 hover:border-accent-purple/50 transition-all hover:shadow-[0_10px_25px_rgba(94,14,215,0.08)] group cursor-default shadow-sm duration-300">
              <span className="text-mute font-bold text-xs uppercase tracking-wider">
                {isWarehouse ? 'Đã Xuất Bến' : 'Đã Giao Hôm Nay'}
              </span>
              <span className="text-4xl font-extrabold text-emerald-850 font-display text-glow-green">
                {isWarehouse ? outboundCount : successCount}
              </span>
              <div className="mt-4 flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>98.6% tỷ lệ thành công SLA</span>
              </div>
            </div>
          </section>

          {/* 12-Column Main Queue Grid */}
          <section className="grid grid-cols-12 gap-8">
            
            {/* LEFT AREA: Active Dispatch Queue / Transit Cargo Table (8 columns) */}
            <div className="col-span-12 lg:col-span-8 flex flex-col min-w-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-extrabold text-black tracking-tight uppercase font-display text-glow-purple">
                  {isWarehouse ? 'Quản Trị Bưu Gửi Transit' : 'Luồng Điều Phối Vận Đơn'}
                </h2>
                
                {/* Search and Filters */}
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <input 
                      type="text"
                      placeholder="Tìm đơn hàng, địa chỉ, người nhận..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white/70 border border-black/10 rounded-full font-medium text-xs w-full sm:w-56 focus:outline-none focus:ring-1 focus:ring-accent-purple focus:border-accent-purple focus:shadow-[0_0_15px_rgba(94,14,215,0.08)] transition-all text-black placeholder-mute"
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-mute text-sm">search</span>
                  </div>
                  
                  <button 
                    onClick={fetchData} 
                    className="flex items-center justify-center p-2 bg-black/5 border border-black/10 hover:bg-black/10 hover:border-black/20 text-black rounded-full transition-all cursor-pointer"
                    title="Tải lại dữ liệu"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                  </button>
                </div>
              </div>

              {/* Segmented Filter Caps */}
              <div className="inline-flex p-1 bg-black/[0.03] backdrop-blur-md rounded-full border border-black/10 mb-6 self-start">
                <button 
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer ${statusFilter === 'ALL' ? 'bg-accent-purple text-white shadow-[0_2px_8px_rgba(94,14,215,0.18)]' : 'text-mute hover:text-black bg-transparent'}`}
                >
                  Tất cả ({totalCount})
                </button>
                
                {isWarehouse ? (
                  <>
                    <button 
                      onClick={() => setStatusFilter('INBOUND')}
                      className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer ${statusFilter === 'INBOUND' ? 'bg-accent-purple text-white shadow-[0_2px_8px_rgba(94,14,215,0.18)]' : 'text-mute hover:text-black bg-transparent'}`}
                    >
                      Chờ Nhập Kho ({inboundCount})
                    </button>
                    <button 
                      onClick={() => setStatusFilter('INVENTORY')}
                      className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer ${statusFilter === 'INVENTORY' ? 'bg-accent-purple text-white shadow-[0_2px_8px_rgba(94,14,215,0.18)]' : 'text-mute hover:text-black bg-transparent'}`}
                    >
                      Đang Lưu Kho ({inventoryCount})
                    </button>
                    <button 
                      onClick={() => setStatusFilter('OUTBOUND')}
                      className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer ${statusFilter === 'OUTBOUND' ? 'bg-accent-purple text-white shadow-[0_2px_8px_rgba(94,14,215,0.18)]' : 'text-mute hover:text-black bg-transparent'}`}
                    >
                      Đã Xuất Kho ({outboundCount})
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setStatusFilter('PENDING')}
                      className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer ${statusFilter === 'PENDING' ? 'bg-accent-purple text-white shadow-[0_2px_8px_rgba(94,14,215,0.18)]' : 'text-mute hover:text-black bg-transparent'}`}
                    >
                      Chờ Shipper ({pendingCount})
                    </button>
                    <button 
                      onClick={() => setStatusFilter('TRANSIT')}
                      className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer ${statusFilter === 'TRANSIT' ? 'bg-accent-purple text-white shadow-[0_2px_8px_rgba(94,14,215,0.18)]' : 'text-mute hover:text-black bg-transparent'}`}
                    >
                      Đang giao ({transitCount})
                    </button>
                    <button 
                      onClick={() => setStatusFilter('SUCCESS')}
                      className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer ${statusFilter === 'SUCCESS' ? 'bg-accent-purple text-white shadow-[0_2px_8px_rgba(94,14,215,0.18)]' : 'text-mute hover:text-black bg-transparent'}`}
                    >
                      Thành công ({successCount})
                    </button>
                  </>
                )}
              </div>

              {/* Table Data Area */}
              {loading ? (
                <div className="flex flex-col justify-center items-center py-24 border border-black/10 rounded-2xl bg-white/50 shadow-sm backdrop-blur-md">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
                  <span className="text-xs text-mute font-semibold mt-4">Đang tải vận đơn...</span>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 text-[#afafaf] border border-black/10 rounded-2xl bg-white/50 shadow-sm backdrop-blur-md">
                  <span className="material-symbols-outlined text-4xl mb-2 text-black/10">drafts</span>
                  <p className="text-sm font-medium text-mute">Không tìm thấy vận đơn nào phù hợp.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-black/10 rounded-2xl shadow-sm bg-white/50 custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black/10 bg-black/[0.02]">
                        <th className="px-6 py-4 font-bold text-[10px] text-mute uppercase tracking-wider w-[15%]">Mã Vận Đơn</th>
                        <th className="px-6 py-4 font-bold text-[10px] text-mute uppercase tracking-wider w-[35%]">Thông Tin Gửi - Nhận</th>
                        <th className="px-6 py-4 font-bold text-[10px] text-mute uppercase tracking-wider w-[20%]">COD & Cước Phí</th>
                        <th className="px-6 py-4 font-bold text-[10px] text-mute uppercase tracking-wider w-[15%]">Trạng Thái</th>
                        <th className="px-6 py-4 font-bold text-[10px] text-mute uppercase tracking-wider w-[15%] text-right">
                          {isWarehouse ? 'Xử Lý Cargo' : 'Điều Phối'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 font-semibold text-xs text-black">
                      {filteredOrders.map((o) => {
                        const isExpanded = expandedOrderId === o.order_id;
                        const rawTracking = trackingData[o.order_id];
                        const trackingEvents = Array.isArray(rawTracking)
                          ? rawTracking
                          : (rawTracking?.timeline || []);
                        const isTrackingLoading = trackingLoading[o.order_id];

                        return (
                          <React.Fragment key={o.order_id}>
                            <tr 
                              onClick={() => toggleOrderExpand(o.order_id)}
                              className={`hover:bg-purple-500/[0.01] transition-colors cursor-pointer ${isExpanded ? 'bg-purple-500/[0.02]' : ''}`}
                            >
                              <td className="px-6 py-5 whitespace-nowrap">
                                <span className="font-extrabold text-black hover:text-accent-purple transition-colors">{o.order_id}</span>
                                <div className="text-[9px] font-black text-mute tracking-wider mt-1 uppercase">Gói: {o.MaGoi === 2 ? 'EXPRESS' : 'STANDARD'}</div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex flex-col">
                                  <span className="text-black font-extrabold flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-xs text-mute">person</span>
                                    {o.receiver}
                                  </span>
                                  <span className="text-mute text-[11px] truncate max-w-xs mt-1" title={o.DiaChiNhan}>
                                    {o.DiaChiNhan}
                                  </span>
                                  {!isWarehouse && o.nhan_vien_giao && (
                                    <div className="text-[10px] font-bold text-accent-purple tracking-wide flex items-center gap-1 mt-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block animate-pulse"></span>
                                      <span>Shipper: {o.nhan_vien_giao.HoTen} (ID: {o.MaNhanVienGiao})</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap">
                                <div className="text-black font-extrabold text-xs">{(o.cod || 0).toLocaleString()} VNĐ (COD)</div>
                                <div className="text-mute font-medium text-[11px] mt-1">Cước: {(o.fee || 0).toLocaleString()} VNĐ</div>
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap">
                                {getStatusBadge(o.status)}
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                                {isWarehouse ? (
                                  /* Warehouse Transit Actions */
                                  o.status !== 'DEN_KHO_TRUNG_CHUYEN' && o.status !== 'ROI_KHO_TRUNG_CHUYEN' && o.status !== 'GIAO_THANH_CONG' && o.status !== 'GIAO_THAT_BAI' ? (
                                    <button
                                      onClick={() => handleHubCheckin(o.order_id)}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase rounded-full transition-all cursor-pointer shadow-[0_2px_8px_rgba(16,185,129,0.2)]"
                                    >
                                      <span className="material-symbols-outlined text-[12px]">login</span>
                                      <span>Nhập Kho</span>
                                    </button>
                                  ) : o.status === 'DEN_KHO_TRUNG_CHUYEN' ? (
                                    <button
                                      onClick={() => handleHubCheckout(o.order_id)}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent-purple hover:bg-[#6e19f1] text-white text-[10px] font-black uppercase rounded-full transition-all cursor-pointer shadow-[0_2px_8px_rgba(94,14,215,0.2)]"
                                    >
                                      <span className="material-symbols-outlined text-[12px]">logout</span>
                                      <span>Xuất Kho</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-mute font-bold flex items-center justify-end gap-1">
                                      <span className="material-symbols-outlined text-xs">done_all</span>
                                      <span>Đã Xuất Kho</span>
                                    </span>
                                  )
                                ) : (
                                  /* Standard Branch Driver Assign Action */
                                  o.status === 'CHO_LAY_HANG' ? (
                                    assigningOrderId === o.order_id ? (
                                      <div className="inline-flex items-center gap-1.5">
                                        <select
                                          value={selectedShipperId}
                                          onChange={(e) => setSelectedShipperId(e.target.value)}
                                          className="text-[11px] border border-black/10 rounded-lg p-1.5 bg-white text-black focus:outline-none focus:border-accent-purple font-semibold"
                                        >
                                          <option value="">Chọn Driver...</option>
                                          {shippers.map((s) => {
                                            const { active } = getRiderLoad(s.id);
                                            const limit = s.GioiHanDonNgay || 20;
                                            return (
                                              <option key={s.id} value={s.id}>
                                                {s.fullname} (ID: {s.id} - Đơn ôm: {active}/{limit})
                                              </option>
                                            );
                                          })}
                                        </select>
                                        <button
                                          onClick={() => handleAssign(o.order_id)}
                                          className="p-1.5 bg-accent-purple text-white rounded-lg text-xs font-bold hover:bg-[#6e19f1] transition-all cursor-pointer flex items-center justify-center"
                                          title="Lưu chỉ định"
                                        >
                                          <span className="material-symbols-outlined text-xs">check</span>
                                        </button>
                                        <button
                                          onClick={() => setAssigningOrderId(null)}
                                          className="p-1.5 border border-black/10 text-black hover:bg-black/5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center bg-transparent"
                                          title="Hủy"
                                        >
                                          <span className="material-symbols-outlined text-xs">close</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setAssigningOrderId(o.order_id);
                                          setSelectedShipperId('');
                                        }}
                                        className="inline-flex items-center px-4 py-2 bg-transparent text-[11px] font-extrabold text-accent-purple border border-accent-purple/30 rounded-full hover:bg-accent-purple hover:text-white transition-all cursor-pointer shadow-sm hover:shadow-[0_2px_8px_rgba(94,14,215,0.15)]"
                                      >
                                        Gán Shipper
                                      </button>
                                    )
                                  ) : (
                                    <span className="text-[11px] text-mute font-bold flex items-center justify-end gap-1">
                                      <span className="material-symbols-outlined text-xs">lock</span>
                                      Khóa gán
                                    </span>
                                  )
                                )}
                              </td>
                            </tr>

                            {/* Collapsible Accordion Row for Timeline details */}
                            {isExpanded && (
                              <tr>
                                <td colSpan="5" className="bg-black/[0.01] px-8 py-5 border-t border-b border-black/5">
                                  <div className="flex flex-col gap-4">
                                    <div className="text-[10px] font-black text-accent-purple uppercase tracking-widest flex items-center gap-1.5">
                                      <span className="material-symbols-outlined text-sm">timeline</span>
                                      <span>HÀNH TRÌNH CHI TIẾT VẬN ĐƠN</span>
                                    </div>

                                    {isTrackingLoading ? (
                                      <div className="flex justify-center items-center py-6">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent-purple"></div>
                                      </div>
                                    ) : trackingEvents.length === 0 ? (
                                      <div className="text-mute text-xs italic py-2">
                                        Chưa ghi nhận hành trình lịch sử nào cho vận đơn này.
                                      </div>
                                    ) : (
                                      <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-black/5 mt-2">
                                        {trackingEvents.map((evt, idx) => (
                                          <div key={idx} className="relative flex flex-col gap-1">
                                            <span className={`
                                              absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border border-white z-10
                                              ${idx === 0 ? 'bg-purple-600 shadow-[0_0_8px_rgba(94,14,215,0.8)]' : 'bg-black/25'}
                                            `}></span>
                                            <div className="flex items-center gap-3">
                                              <span className={`text-xs font-black tracking-wide ${idx === 0 ? 'text-purple-700' : 'text-black/80'}`}>
                                                {getStatusText(evt.status || evt.MaTrangThai)}
                                              </span>
                                              <span className="text-[10px] text-mute font-semibold">
                                                {new Date(evt.time || evt.ThoiGian).toLocaleString('vi-VN')}
                                              </span>
                                            </div>
                                            <p className="text-mute text-[11px] font-medium leading-relaxed">
                                              {evt.info || evt.ThongTinViTri || 'Không có mô tả chi tiết vị trí.'}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* RIGHT AREA: Analytics Charts & Radar/Drivers Widget (4 columns) */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
              
              {/* INTERACTIVE 7-DAY VOLUME TREND CHART */}
              <div className="bg-white/50 backdrop-blur-md border border-black/10 p-6 rounded-[24px] shadow-sm hover:border-accent-purple/40 hover:shadow-[0_10px_25px_rgba(94,14,215,0.08)] transition-all duration-300 relative">
                <h3 className="font-extrabold text-xs text-black uppercase tracking-wider font-display mb-4 text-glow-purple">Biểu Đồ Lưu Lượng 7 Ngày</h3>
                
                {/* SVG Trend Chart */}
                <div className="h-40 w-full flex items-end justify-between gap-1 pt-4 relative">
                  {chartData.map((d, i) => {
                    const ratio = d.orders / maxChartVal;
                    const heightPercent = Math.max(10, Math.round(ratio * 80));
                    const isHovered = hoveredChartPoint === i;

                    return (
                      <div 
                        key={i} 
                        className="flex-1 flex flex-col items-center group cursor-pointer relative"
                        onMouseEnter={() => setHoveredChartPoint(i)}
                        onMouseLeave={() => setHoveredChartPoint(null)}
                      >
                        {/* Bar */}
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-300 ${
                            isHovered 
                              ? 'bg-accent-purple shadow-[0_0_12px_rgba(94,14,215,0.6)]' 
                              : 'bg-accent-purple/40 hover:bg-accent-purple/65'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                        {/* Day label */}
                        <span className="text-[9px] font-bold text-mute uppercase mt-2">{d.day.split(' ')[1] || d.day.slice(0, 3)}</span>

                        {/* Interactive Tooltip inside chart */}
                        {isHovered && (
                          <div className="absolute bottom-full mb-2 z-30 bg-black/90 backdrop-blur-xl border border-white/10 text-white rounded-xl p-2.5 text-[10px] font-bold shadow-xl animate-fade-in pointer-events-none w-28 text-center flex flex-col gap-1">
                            <span className="text-glow-purple uppercase tracking-wider text-[8px] font-black">{d.day}</span>
                            <span className="text-white">Đơn hàng: {d.orders}</span>
                            <span className="text-cyan-300">Cước: {d.revenue.toLocaleString()}đ</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* INTERACTIVE DONUT STATUS BREAKDOWN CHART */}
              <div className="bg-white/50 backdrop-blur-md border border-black/10 p-6 rounded-[24px] shadow-sm hover:border-accent-purple/40 hover:shadow-[0_10px_25px_rgba(94,14,215,0.08)] transition-all duration-300 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-extrabold text-xs text-black uppercase tracking-wider font-display mb-3 text-glow-purple">Cơ Cấu Trạng Thái</h3>
                  <div className="space-y-2">
                    {donutSegments.map((seg, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: seg.color }}></span>
                        <span className="text-[10px] font-bold text-black/80">{seg.label}:</span>
                        <span className="text-[10px] font-black text-mute">{seg.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r={donutRadius} fill="transparent" stroke="rgba(0,0,0,0.03)" strokeWidth="14" />
                    {donutSegments.map((seg, i) => (
                      <circle
                        key={i}
                        cx="70"
                        cy="70"
                        r={donutRadius}
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="14"
                        strokeDasharray={seg.dashArray}
                        strokeDashoffset={seg.dashOffset}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    ))}
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] text-mute font-black tracking-widest uppercase">Total</span>
                    <span className="text-xl font-black text-black leading-none mt-0.5">{totalCount}</span>
                  </div>
                </div>
              </div>

              {/* LOWER WIDGET: Warehouse Radar (Warehouse) or Driver Node Watcher (Branch) */}
              {isWarehouse ? (
                /* WAREHOUSE RADAR SYSTEM */
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-accent-purple text-glow-purple">radar</span>
                    <h2 className="text-md font-extrabold text-black tracking-tight uppercase font-display">Warehouse Radar</h2>
                  </div>

                  <div className="glow-card border border-black/10 bg-white/65 p-6 rounded-[24px] shadow-sm flex flex-col min-h-[350px]">
                    <span className="text-mute font-bold text-[10px] uppercase tracking-wider mb-4 block">
                      Dung Tích & Chặng Long-Haul Trucking
                    </span>

                    {/* Capacity loading bar */}
                    <div className="p-4 bg-black/[0.015] border border-black/5 rounded-2xl flex flex-col gap-3 mb-6 hover:border-accent-purple/35 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-black uppercase">Dung Tích Đang Lưu</span>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md font-mono">
                          68% Đã Sử Dụng
                        </span>
                      </div>
                      
                      <div className="w-full bg-black/5 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-accent-purple to-cyan-500 shadow-[0_0_8px_#5E0ED7] rounded-full transition-all duration-500" 
                          style={{ width: '68%' }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center text-[9px] font-bold text-mute uppercase mt-1">
                        <span>6,800 cu.m / 10,000 cu.m</span>
                        <span>Trống: 3,200 cu.m</span>
                      </div>
                    </div>

                    {/* Active long-haul trucking lanes */}
                    <span className="text-mute font-bold text-[9px] uppercase tracking-wider mb-2 block">
                      Đoàn Xe Trung Chuyển Hoạt Động
                    </span>
                    
                    <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1 custom-scrollbar">
                      <div className="p-3 bg-black/[0.015] border border-black/5 rounded-xl flex flex-col gap-1.5 hover:border-accent-purple/35 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                            Miền Bắc ➔ Miền Trung (Lộ trình chéo)
                          </span>
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                            Chạy xe
                          </span>
                        </div>
                        <p className="text-[10px] text-mute font-semibold">
                          Xe container #29C-12345 (Hàng Express) - Đang di chuyển
                        </p>
                      </div>

                      <div className="p-3 bg-black/[0.015] border border-black/5 rounded-xl flex flex-col gap-1.5 hover:border-accent-purple/35 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
                            Miền Trung ➔ Miền Nam (Trục Nam-Bắc)
                          </span>
                          <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase">
                            Xếp hàng
                          </span>
                        </div>
                        <p className="text-[10px] text-mute font-semibold">
                          Xe tải #51D-98765 - Đang phân loại xếp hàng tại bến
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-black/10 text-center">
                      <Link to="/admin/users" className="w-full py-2.5 bg-black/5 hover:bg-black/10 border border-black/10 text-black text-xs font-extrabold rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                        <span>Quản lý nhân sự tổng kho</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                /* DRIVER NODE WATCHER (Branch) */
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-accent-purple text-glow-purple">two_wheeler</span>
                    <h2 className="text-md font-extrabold text-black tracking-tight uppercase font-display">Driver Node Watcher</h2>
                  </div>

                  <div className="glow-card border border-black/10 bg-white/65 p-6 rounded-[24px] shadow-sm flex flex-col min-h-[350px]">
                    <span className="text-mute font-bold text-[10px] uppercase tracking-wider mb-4 block">Hạn ngạch & Khối lượng tải xế hôm nay</span>
                    
                    {shippers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center flex-1 text-center text-mute text-xs py-10">
                        <span className="material-symbols-outlined text-3xl mb-2 text-black/10">motorcycle</span>
                        <span>Chưa có bưu tá nào online</span>
                      </div>
                    ) : (
                      <div className="space-y-4 overflow-y-auto max-h-[220px] pr-1 custom-scrollbar">
                        {shippers.map((s) => {
                          const load = getRiderLoad(s.id);
                          const limit = s.GioiHanDonNgay || 20;
                          const ratio = Math.min(100, Math.round((load.active / limit) * 100));
                          
                          let barColor = 'bg-accent-purple';
                          if (ratio > 85) barColor = 'bg-rose-500 shadow-[0_0_8px_#f43f5e]';
                          else if (ratio > 60) barColor = 'bg-amber-500 shadow-[0_0_8px_#f59e0b]';

                          return (
                            <div key={s.id} className="p-3 bg-black/[0.015] border border-black/5 rounded-xl flex flex-col gap-2 hover:border-accent-purple/35 transition-colors">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="flex h-2 w-2 relative flex-shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
                                  </span>
                                  <span className="text-[11px] font-extrabold text-black truncate uppercase">{s.fullname}</span>
                                </div>
                                <span className="text-[9px] font-black text-black/85 font-mono bg-white border border-black/5 px-2 py-0.5 rounded-md flex-shrink-0">
                                  {load.active} / {limit} đơn
                                </span>
                              </div>

                              <div className="w-full">
                                <div className="w-full bg-black/5 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                    style={{ width: `${ratio}%` }}
                                  ></div>
                                </div>
                                <div className="flex justify-between items-center mt-1 text-[8px] font-bold text-mute uppercase">
                                  <span>Khối tải: {ratio}%</span>
                                  <span className="text-emerald-700">Xong: {load.completed}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-black/10 text-center">
                      <Link to="/admin/users" className="w-full py-2.5 bg-black/5 hover:bg-black/10 border border-black/10 text-black text-xs font-extrabold rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                        <span>Quản lý danh sách bưu tá</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </section>

        </div>
      )}
    </div>
  );
}
