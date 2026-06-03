import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  Settings, 
  ClipboardList, 
  Bell, 
  LogOut, 
  Home, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Building2, 
  Activity, 
  TrendingUp, 
  RefreshCw, 
  Lock,
  Warehouse,
  PlusCircle,
  X
} from 'lucide-react';
import { SuperAdminService } from '../services/api';

export default function SuperAdminDashboard() {
  // Navigation tabs: 'overview', 'facilities', 'managers', 'logs'
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState({
    total_revenue: 0,
    total_orders: 0,
    total_warehouses: 0,
    total_branches: 0
  });
  
  const [warehouses, setWarehouses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [managers, setManagers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  
  // Forms state
  const [facForm, setFacForm] = useState({
    id: null,
    type: 'chinhanh', // 'kho' or 'chinhanh'
    name: '',
    address: '',
    lat: 10.7769,
    lng: 106.7009,
    region: 'BAC',
    warehouse_link: ''
  });

  const [manForm, setManForm] = useState({
    id: null,
    username: '',
    password: '',
    fullname: '',
    branch_id: '',
    warehouse_id: ''
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await SuperAdminService.getDashboard();
      if (res.success && res.data) {
        setMetrics(res.data.metrics);
        setWarehouses(res.data.warehouses || []);
        setBranches(res.data.branches || []);
        setManagers(res.data.managers || []);
      } else {
        setError('Không thể lấy thông tin từ hệ thống.');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối CSDL và phân quyền API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/admin-login';
  };

  const triggerNotification = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(''), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  // Facility submit (Create/Update)
  const handleFacSubmit = async (e) => {
    e.preventDefault();
    if (!facForm.name || !facForm.address) {
      triggerNotification('Vui lòng điền tên và địa chỉ cơ sở', true);
      return;
    }

    try {
      const payload = {
        type: facForm.type,
        name: facForm.name,
        address: facForm.address,
        lat: parseFloat(facForm.lat) || 0,
        lng: parseFloat(facForm.lng) || 0
      };

      if (facForm.type === 'kho') {
        payload.region = facForm.region;
      } else {
        payload.warehouse_link = facForm.warehouse_link ? parseInt(facForm.warehouse_link) : null;
      }

      let res;
      if (facForm.id) {
        res = await SuperAdminService.updateFacility(facForm.type, facForm.id, payload);
      } else {
        res = await SuperAdminService.createFacility(payload);
      }

      if (res.success) {
        triggerNotification(facForm.id ? 'Cập nhật cơ sở thành công!' : 'Tạo mới cơ sở thành công!');
        setShowFacilityModal(false);
        setFacForm({
          id: null,
          type: 'chinhanh',
          name: '',
          address: '',
          lat: 10.7769,
          lng: 106.7009,
          region: 'BAC',
          warehouse_link: ''
        });
        loadData();
      } else {
        triggerNotification(res.message || 'Thao tác thất bại.', true);
      }
    } catch (err) {
      console.error(err);
      triggerNotification('Lỗi kết nối máy chủ.', true);
    }
  };

  const handleEditFacility = (type, item) => {
    setFacForm({
      id: type === 'kho' ? item.id : item.id,
      type: type,
      name: item.name,
      address: item.address,
      lat: item.lat,
      lng: item.lng,
      region: item.region || 'BAC',
      warehouse_link: item.warehouse_link || ''
    });
    setShowFacilityModal(true);
  };

  const handleDeleteFacility = async (type, id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cơ sở này không?')) return;
    try {
      const res = await SuperAdminService.deleteFacility(type, id);
      if (res.success) {
        triggerNotification('Xóa cơ sở thành công!');
        loadData();
      } else {
        triggerNotification(res.message, true);
      }
    } catch (err) {
      console.error(err);
      triggerNotification('Lỗi kết nối máy chủ.', true);
    }
  };

  // Manager submit (Create/Update)
  const handleManSubmit = async (e) => {
    e.preventDefault();
    if (!manForm.username || !manForm.fullname || (!manForm.id && !manForm.password)) {
      triggerNotification('Vui lòng điền đầy đủ các trường thông tin bắt buộc', true);
      return;
    }

    try {
      const payload = {
        username: manForm.username,
        fullname: manForm.fullname,
        branch_id: manForm.branch_id ? parseInt(manForm.branch_id) : null,
        warehouse_id: manForm.warehouse_id ? parseInt(manForm.warehouse_id) : null
      };

      if (manForm.password) {
        payload.password = manForm.password;
      }

      let res;
      if (manForm.id) {
        res = await SuperAdminService.updateManager(manForm.id, payload);
      } else {
        res = await SuperAdminService.createManager(payload);
      }

      if (res.success) {
        triggerNotification(manForm.id ? 'Cập nhật quản lý thành công!' : 'Tạo quản lý cơ sở thành công!');
        setShowManagerModal(false);
        setManForm({
          id: null,
          username: '',
          password: '',
          fullname: '',
          branch_id: '',
          warehouse_id: ''
        });
        loadData();
      } else {
        triggerNotification(res.message || 'Thao tác thất bại.', true);
      }
    } catch (err) {
      console.error(err);
      triggerNotification('Lỗi hệ thống hoặc username trùng lặp.', true);
    }
  };

  const handleEditManager = (item) => {
    setManForm({
      id: item.id,
      username: item.username,
      password: '',
      fullname: item.fullname,
      branch_id: item.branch_id || '',
      warehouse_id: item.warehouse_id || ''
    });
    setShowManagerModal(true);
  };

  const handleDeleteManager = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản quản lý này không?')) return;
    try {
      const res = await SuperAdminService.deleteManager(id);
      if (res.success) {
        triggerNotification('Xóa quản lý thành công!');
        loadData();
      } else {
        triggerNotification(res.message, true);
      }
    } catch (err) {
      console.error(err);
      triggerNotification('Lỗi kết nối máy chủ.', true);
    }
  };

  const formatVND = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-white flex overflow-hidden font-sans relative">
      {/* Cyberpunk dot background overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(94,14,215,0.05)_1.5px,transparent_1.5px)] bg-[size:24px_24px] pointer-events-none z-0" />

      {/* 1. Left Navigation Sidebar */}
      <aside className="w-80 bg-black/40 backdrop-blur-md border-r border-white/10 p-8 flex flex-col justify-between z-10 relative">
        <div className="space-y-12">
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border border-[#5E0ED7] flex items-center justify-center relative bg-black/60 shadow-[0_0_15px_rgba(94,14,215,0.3)]">
              <div className="w-4 h-4 bg-[#5E0ED7]/30 rounded-full absolute animate-ping"></div>
              <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 3L4 25C4 25 9 22 16 22C23 22 28 25 28 25L16 3Z" fill="#5E0ED7" />
                <path d="M16 10L10 20H22L16 10Z" fill="white" />
              </svg>
            </div>
            <div>
              <div className="flex items-center font-display leading-none">
                <span className="font-extrabold text-[12px] tracking-[0.5px] text-white uppercase">ANTIGRAVITY</span>
                <span className="bg-[#5e0ed7] text-white font-extrabold text-[9.5px] px-1 py-0.5 ml-1 rounded-[1px] tracking-[0.3px] uppercase">CORE</span>
              </div>
              <span className="text-[5.5px] font-black text-purple-400 tracking-[1.5px] uppercase">Super Admin Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-semibold uppercase tracking-widest text-[10px] transition-all duration-300 cursor-pointer ${activeTab === 'overview' ? 'bg-[#5e0ed7]/25 text-[#d0bcff] border border-[#5E0ED7]/30 shadow-[0_0_15px_rgba(94,14,215,0.1)]' : 'text-white/60 border border-transparent hover:text-white hover:bg-white/5'}`}
            >
              <LayoutDashboard className="w-4.5 h-4.5 text-[#d0bcff]" />
              <span>Tổng quan doanh nghiệp</span>
            </button>
            <button 
              onClick={() => setActiveTab('facilities')}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-semibold uppercase tracking-widest text-[10px] transition-all duration-300 cursor-pointer ${activeTab === 'facilities' ? 'bg-[#5e0ed7]/25 text-[#d0bcff] border border-[#5E0ED7]/30 shadow-[0_0_15px_rgba(94,14,215,0.1)]' : 'text-white/60 border border-transparent hover:text-white hover:bg-white/5'}`}
            >
              <Warehouse className="w-4.5 h-4.5 text-[#d0bcff]" />
              <span>Hệ thống cơ sở</span>
            </button>
            <button 
              onClick={() => setActiveTab('managers')}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-semibold uppercase tracking-widest text-[10px] transition-all duration-300 cursor-pointer ${activeTab === 'managers' ? 'bg-[#5e0ed7]/25 text-[#d0bcff] border border-[#5E0ED7]/30 shadow-[0_0_15px_rgba(94,14,215,0.1)]' : 'text-white/60 border border-transparent hover:text-white hover:bg-white/5'}`}
            >
              <Users className="w-4.5 h-4.5 text-[#d0bcff]" />
              <span>Tài khoản quản lý</span>
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-semibold uppercase tracking-widest text-[10px] transition-all duration-300 cursor-pointer ${activeTab === 'logs' ? 'bg-[#5e0ed7]/25 text-[#d0bcff] border border-[#5E0ED7]/30 shadow-[0_0_15px_rgba(94,14,215,0.1)]' : 'text-white/60 border border-transparent hover:text-white hover:bg-white/5'}`}
            >
              <ClipboardList className="w-4.5 h-4.5 text-[#d0bcff]" />
              <span>Nhật ký hệ thống</span>
            </button>
          </nav>
        </div>

        {/* User profile lockup */}
        <div className="border-t border-white/5 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#5e0ed7]/20 border border-[#5e0ed7]/40 flex items-center justify-center font-bold text-glow text-[#d0bcff]">
              Đ
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-wider text-white">Đặng Tiến Dũng</h4>
              <span className="text-[8px] font-bold uppercase text-[#d0bcff]">Super Admin</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2.5 rounded-full hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-white/40 hover:text-rose-400 transition-all duration-300 cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. Main Content Canvas */}
      <main className="flex-1 overflow-y-auto p-8 md:p-12 relative z-10">
        
        {/* Header bar */}
        <header className="flex justify-between items-center mb-10 pb-6 border-b border-white/5">
          <div>
            <span className="text-[8px] font-black uppercase text-white/40 tracking-[0.2em]">Control Operations Center</span>
            <h1 className="text-2xl font-black uppercase tracking-widest text-white mt-1">
              {activeTab === 'overview' && 'Bảng điều khiển tối cao'}
              {activeTab === 'facilities' && 'Hệ thống cơ sở vận hành'}
              {activeTab === 'managers' && 'Tài khoản quản lý cấp cơ sở'}
              {activeTab === 'logs' && 'Nhật ký vận hành bảo mật'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Success/Error alert bubble */}
            {successMsg && (
              <div className="bg-emerald-500/10 text-emerald-300 text-[10px] font-bold px-4 py-2 border border-emerald-500/20 uppercase tracking-wider rounded-xl animate-pulse">
                {successMsg}
              </div>
            )}
            {error && (
              <div className="bg-rose-500/10 text-rose-300 text-[10px] font-bold px-4 py-2 border border-rose-500/20 uppercase tracking-wider rounded-xl animate-pulse">
                {error}
              </div>
            )}

            <button 
              onClick={loadData}
              disabled={loading}
              className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all duration-300 cursor-pointer"
              title="Tải lại dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {loading && (
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full border-t-2 border-[#5E0ED7] border-r-2 border-transparent animate-spin"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Đang truyền tải luồng dữ liệu...</span>
          </div>
        )}

        {/* 3. Tab contents */}
        {!loading && (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Metrics row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Revenue metric */}
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl relative overflow-hidden group shadow-[0_0_15px_rgba(0,0,0,0.4)]">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#5e0ed7]/5 rounded-bl-[100px] pointer-events-none group-hover:bg-[#5e0ed7]/10 transition-colors duration-500"></div>
                    <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Tổng doanh thu hệ thống</span>
                    <h3 className="text-2xl font-black text-white mt-3 text-glow-purple">{formatVND(metrics.total_revenue)}</h3>
                    <div className="flex items-center gap-2 mt-4 text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Hệ thống hoạt động ổn định</span>
                    </div>
                  </div>

                  {/* Orders metric */}
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl relative overflow-hidden group shadow-[0_0_15px_rgba(0,0,0,0.4)]">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-[100px] pointer-events-none group-hover:bg-cyan-500/10 transition-colors duration-500"></div>
                    <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Tổng vận đơn lưu hành</span>
                    <h3 className="text-2xl font-black text-white mt-3 text-glow-cyan">{metrics.total_orders} ĐƠN</h3>
                    <div className="flex items-center gap-2 mt-4 text-[9px] font-extrabold text-[#d0bcff] uppercase tracking-wider">
                      <Activity className="w-3.5 h-3.5" />
                      <span>Cập nhật liên tục</span>
                    </div>
                  </div>

                  {/* Warehouses metric */}
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl relative overflow-hidden group shadow-[0_0_15px_rgba(0,0,0,0.4)]">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-[100px] pointer-events-none group-hover:bg-purple-500/10 transition-colors duration-500"></div>
                    <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Số lượng Tổng Kho</span>
                    <h3 className="text-2xl font-black text-white mt-3">{metrics.total_warehouses} KHO</h3>
                    <div className="flex items-center gap-2 mt-4 text-[9px] font-extrabold text-white/40 uppercase tracking-wider">
                      <span>Phủ khắp 3 miền Bắc-Trung-Nam</span>
                    </div>
                  </div>

                  {/* Branches metric */}
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl relative overflow-hidden group shadow-[0_0_15px_rgba(0,0,0,0.4)]">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-[100px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-500"></div>
                    <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Số lượng Chi Nhánh</span>
                    <h3 className="text-2xl font-black text-white mt-3">{metrics.total_branches} CHI NHÁNH</h3>
                    <div className="flex items-center gap-2 mt-4 text-[9px] font-extrabold text-white/40 uppercase tracking-wider">
                      <span>Mạng lưới giao vận vệ tinh</span>
                    </div>
                  </div>
                </div>

                {/* Grid Layout: Map and Facilities overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Glowing map mockup */}
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl lg:col-span-2 shadow-[0_0_15px_rgba(0,0,0,0.4)] relative flex flex-col justify-between">
                    <div>
                      <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Bản đồ mạng lưới bưu cục</span>
                      <h3 className="text-base font-black uppercase tracking-wider text-white mt-1">Mô phỏng đường truyền dữ liệu thực địa</h3>
                    </div>
                    {/* Mock map graphic */}
                    <div className="h-64 border border-white/5 rounded-xl bg-[#090314]/80 mt-6 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-[radial-gradient(rgba(94,14,215,0.08)_2px,transparent_2px)] bg-[size:16px_16px]"></div>
                      
                      {/* Interactive nodes */}
                      <div className="absolute top-[20%] left-[30%] text-center">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#5E0ED7] border-2 border-white animate-pulse shadow-[0_0_15px_rgba(94,14,215,0.8)]"></div>
                        <span className="text-[8px] font-black block mt-1 uppercase text-[#d0bcff]">Kho Miền Bắc</span>
                      </div>
                      <div className="absolute top-[50%] left-[45%] text-center">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#5E0ED7] border-2 border-white animate-pulse shadow-[0_0_15px_rgba(94,14,215,0.8)]"></div>
                        <span className="text-[8px] font-black block mt-1 uppercase text-[#d0bcff]">Kho Miền Trung</span>
                      </div>
                      <div className="absolute top-[75%] left-[65%] text-center">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#5E0ED7] border-2 border-white animate-pulse shadow-[0_0_15px_rgba(94,14,215,0.8)]"></div>
                        <span className="text-[8px] font-black block mt-1 uppercase text-[#d0bcff]">Kho Miền Nam</span>
                      </div>
                      
                      {/* Glowing connection lines */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <line x1="30%" y1="20%" x2="45%" y2="50%" stroke="#5E0ED7" strokeWidth="1.5" strokeDasharray="5,5" className="animate-pulse" />
                        <line x1="45%" y1="50%" x2="65%" y2="75%" stroke="#5E0ED7" strokeWidth="1.5" strokeDasharray="5,5" className="animate-pulse" />
                      </svg>
                      
                      <span className="absolute bottom-4 left-4 text-[8px] font-black text-white/30 uppercase tracking-widest font-mono">Bản đồ OSRM - Live Network Sync</span>
                    </div>
                  </div>

                  {/* Active Facility managers summary */}
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.4)] flex flex-col justify-between">
                    <div>
                      <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Tài khoản Quản lý cấp cao</span>
                      <h3 className="text-base font-black uppercase tracking-wider text-white mt-1">Đang trực tuyến</h3>
                    </div>

                    <div className="space-y-4 my-6 flex-1 overflow-y-auto max-h-64 pr-2">
                      {managers.length === 0 ? (
                        <div className="text-center py-8 text-white/30 text-xs font-semibold uppercase tracking-wider">Chưa có quản lý cơ sở</div>
                      ) : (
                        managers.map((m) => (
                          <div key={m.id} className="flex justify-between items-center p-4 border border-white/5 rounded-xl bg-white/2 cursor-pointer hover:bg-white/5 transition-all">
                            <div>
                              <h4 className="text-[10px] font-black uppercase tracking-wider text-white">{m.fullname}</h4>
                              <p className="text-[8px] font-bold text-[#d0bcff] uppercase mt-1">
                                {m.branch_name ? `Hub: ${m.branch_name}` : `Kho: ${m.warehouse_name}`}
                              </p>
                            </div>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <button 
                      onClick={() => setActiveTab('managers')}
                      className="w-full bg-[#5E0ED7]/15 hover:bg-[#5E0ED7]/25 text-[#d0bcff] text-[9px] font-extrabold uppercase py-3.5 tracking-wider rounded-xl transition-all border border-[#5E0ED7]/20"
                    >
                      Quản lý tài khoản quản trị
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* FACILITIES TAB (Thêm Sửa Xóa Chi Nhánh/Kho) */}
            {activeTab === 'facilities' && (
              <div className="space-y-8">
                {/* Header and Add button */}
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-black uppercase tracking-wider text-white">Danh sách Tổng kho & Chi nhánh</h3>
                  <button 
                    onClick={() => {
                      setFacForm({
                        id: null,
                        type: 'chinhanh',
                        name: '',
                        address: '',
                        lat: 10.7769,
                        lng: 106.7009,
                        region: 'BAC',
                        warehouse_link: ''
                      });
                      setShowFacilityModal(true);
                    }}
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#5E0ED7] hover:bg-[#6f30e8] text-white text-[9px] font-black uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(94,14,215,0.4)] hover:scale-102 cursor-pointer active:scale-98"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Cơ Sở</span>
                  </button>
                </div>

                {/* Grid Lists: Warehouses vs Branches */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Warehouses list */}
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center gap-2 mb-6">
                      <Warehouse className="w-5 h-5 text-[#d0bcff]" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">Tổng Kho Trung Chuyển ({warehouses.length})</h4>
                    </div>

                    <div className="space-y-4">
                      {warehouses.length === 0 ? (
                        <div className="text-center py-12 text-white/30 text-xs font-semibold uppercase tracking-wider border border-dashed border-white/10 rounded-xl">Không tìm thấy Tổng kho nào.</div>
                      ) : (
                        warehouses.map((w) => (
                          <div key={w.id} className="p-5 border border-white/5 hover:border-[#5E0ED7]/35 rounded-xl bg-white/2 hover:bg-white/5 transition-all flex flex-col justify-between gap-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="text-[11px] font-black uppercase tracking-wider text-white">{w.name}</h5>
                                <span className="text-[7.5px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 border border-cyan-500/20 rounded mt-1.5 inline-block">
                                  Vùng: {w.region}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleEditFacility('kho', w)}
                                  className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteFacility('kho', w.id)}
                                  className="p-2 rounded-full hover:bg-rose-500/10 text-white/40 hover:text-rose-400 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-[9px] font-semibold text-white/60 leading-relaxed font-sans">{w.address}</p>

                            <div className="border-t border-white/5 pt-3.5 flex justify-between items-center text-[8.5px] font-bold text-white/40 uppercase">
                              <span>Tọa độ: {w.lat}, {w.lng}</span>
                              <span className="text-[#d0bcff]">Nhân sự kho: {w.staff_count}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Branches list */}
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-[0_0_15px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center gap-2 mb-6">
                      <MapPin className="w-5 h-5 text-[#d0bcff]" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">Chi Nhánh Vệ Tinh (Hub Con) ({branches.length})</h4>
                    </div>

                    <div className="space-y-4">
                      {branches.length === 0 ? (
                        <div className="text-center py-12 text-white/30 text-xs font-semibold uppercase tracking-wider border border-dashed border-white/10 rounded-xl">Không tìm thấy Chi nhánh nào.</div>
                      ) : (
                        branches.map((b) => {
                          const linkedKhoName = warehouses.find(w => w.id === b.warehouse_link)?.name || 'Chưa liên kết';
                          return (
                            <div key={b.id} className="p-5 border border-white/5 hover:border-[#5E0ED7]/35 rounded-xl bg-white/2 hover:bg-white/5 transition-all flex flex-col justify-between gap-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="text-[11px] font-black uppercase tracking-wider text-white">{b.name}</h5>
                                  <span className="text-[7.5px] font-bold uppercase tracking-wider text-[#d0bcff] bg-[#5e0ed7]/10 px-2 py-0.5 border border-[#5e0ed7]/20 rounded mt-1.5 inline-block">
                                    Liên kết: {linkedKhoName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => handleEditFacility('chinhanh', b)}
                                    className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all cursor-pointer"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteFacility('chinhanh', b.id)}
                                    className="p-2 rounded-full hover:bg-rose-500/10 text-white/40 hover:text-rose-400 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <p className="text-[9px] font-semibold text-white/60 leading-relaxed font-sans">{b.address}</p>

                              <div className="border-t border-white/5 pt-3.5 flex justify-between items-center text-[8.5px] font-bold text-white/40 uppercase">
                                <span>Tọa độ: {b.lat}, {b.lng}</span>
                                <span className="text-[#d0bcff]">Bưu tá shipper: {b.shipper_count}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* MANAGERS TAB (Cấp & Phân Quyền Quản Lý Cơ Sở) */}
            {activeTab === 'managers' && (
              <div className="space-y-8">
                {/* Header and Add button */}
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-black uppercase tracking-wider text-white">Quản trị viên quản lý cấp cơ sở</h3>
                  <button 
                    onClick={() => {
                      setManForm({
                        id: null,
                        username: '',
                        password: '',
                        fullname: '',
                        branch_id: '',
                        warehouse_id: ''
                      });
                      setShowManagerModal(true);
                    }}
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#5E0ED7] hover:bg-[#6f30e8] text-white text-[9px] font-black uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(94,14,215,0.4)] hover:scale-102 cursor-pointer active:scale-98"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Cấp Quản Lý Mới</span>
                  </button>
                </div>

                {/* Table list */}
                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.4)]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/2 text-[9px] font-black uppercase tracking-wider text-white/40">
                        <th className="p-6">Họ tên & Username</th>
                        <th className="p-6">Vai trò nghiệp vụ</th>
                        <th className="p-6">Cơ sở chịu trách nhiệm</th>
                        <th className="p-6">Thời gian bổ nhiệm</th>
                        <th className="p-6 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs font-semibold">
                      {managers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-12 text-center text-white/30 text-xs font-semibold uppercase tracking-wider">Không tìm thấy quản lý cơ sở nào.</td>
                        </tr>
                      ) : (
                        managers.map((m) => (
                          <tr key={m.id} className="hover:bg-white/2 transition-colors">
                            <td className="p-6">
                              <h5 className="text-[10px] font-black uppercase text-white">{m.fullname}</h5>
                              <p className="text-[8.5px] text-white/40 mt-1 font-mono">{m.username}</p>
                            </td>
                            <td className="p-6">
                              <span className="text-[7.5px] font-black uppercase tracking-wider text-[#d0bcff] bg-[#5e0ed7]/20 border border-[#5e0ed7]/30 px-3 py-1 rounded-full">
                                {m.role}
                              </span>
                            </td>
                            <td className="p-6">
                              {m.branch_id ? (
                                <span className="text-[9px] font-extrabold uppercase text-cyan-300">Hub: {m.branch_name}</span>
                              ) : m.warehouse_id ? (
                                <span className="text-[9px] font-extrabold uppercase text-indigo-300">Kho: {m.warehouse_name}</span>
                              ) : (
                                <span className="text-[8.5px] font-bold uppercase text-rose-400">Chưa được phân bổ cơ sở</span>
                              )}
                            </td>
                            <td className="p-6 text-white/50 text-[10px] font-mono">
                              {new Date(m.created_at).toLocaleString('vi-VN')}
                            </td>
                            <td className="p-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleEditManager(m)}
                                  className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all cursor-pointer"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteManager(m.id)}
                                  className="p-2 rounded-full hover:bg-rose-500/10 text-white/40 hover:text-rose-400 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* LOGS TAB */}
            {activeTab === 'logs' && (
              <div className="space-y-8">
                <h3 className="text-base font-black uppercase tracking-wider text-white">Nhật Ký Bảo Mật Vận Hành</h3>
                <div className="bg-[#090314] border border-white/5 rounded-2xl p-6 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]">
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 font-mono text-[9px] leading-relaxed text-white/70">
                    <p className="text-emerald-400">[01/Jun/2026 14:05:00] [SYSTEM] Core Server Initialized successfully with PostgreSQL adapter.</p>
                    <p className="text-[#d0bcff]">[01/Jun/2026 14:05:12] [AUTH] Super Admin table registered separately into protected memory space.</p>
                    <p className="text-[#d0bcff]">[01/Jun/2026 14:05:33] [DATABASE] Seed postgres completed: 3 warehouses, 4 branches, 1 superadmin, 2 local admins seeded.</p>
                    <p className="text-cyan-400">[01/Jun/2026 14:06:12] [API] Secure session established for SUPER_ADMIN role with TLS handshakes.</p>
                    <p className="text-white/40">[01/Jun/2026 14:06:55] [NETWORK] SSE socket client connected: Sneaker World (Cửa Hàng Đối Tác).</p>
                    <p className="text-white/40">[01/Jun/2026 14:07:22] [SECURITY] Local multi-tenant facility scope check injected into /users and /orders endpoints.</p>
                    <p className="text-amber-400">[01/Jun/2026 14:08:44] [WARN] WebSocket fallback mode triggered due to network handshake transport.</p>
                    <p className="text-emerald-400">[01/Jun/2026 14:10:00] [SYSTEM] All operations active. Zero gravity logistics node watcher: ONLINE.</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* 4. MODALS */}
      {/* 4.1. Facility Modal */}
      {showFacilityModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#150d2a] border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(94,14,215,0.3)] relative">
            <header className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                {facForm.id ? 'Cập Nhật Cơ Sở Vận Hành' : 'Thêm Cơ Sở Vận Hành Mới'}
              </h3>
              <button 
                onClick={() => setShowFacilityModal(false)}
                className="text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <form onSubmit={handleFacSubmit} className="p-6 space-y-5">
              {/* Type Select */}
              <div className="space-y-2">
                <label className="block text-[8.5px] font-extrabold text-white/40 uppercase tracking-wider">Loại Cơ Sở</label>
                <select 
                  value={facForm.type}
                  onChange={(e) => setFacForm({ ...facForm, type: e.target.value })}
                  disabled={!!facForm.id}
                  className="w-full bg-[#0b0c0e] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#5E0ED7] transition-all font-semibold uppercase tracking-wider text-[10px]"
                >
                  <option value="chinhanh">Chi Nhánh Vệ Tinh (Hub Con)</option>
                  <option value="kho">Tổng Kho Trung Chuyển (Miền)</option>
                </select>
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <label className="block text-[8.5px] font-extrabold text-white/40 uppercase tracking-wider">Tên Cơ Sở</label>
                <input 
                  type="text" 
                  value={facForm.name}
                  onChange={(e) => setFacForm({ ...facForm, name: e.target.value })}
                  placeholder="Ví dụ: Hub Hà Nội (Hoàn Kiếm)"
                  className="w-full bg-[#0b0c0e] border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-3 focus:outline-none focus:border-[#5E0ED7] transition-all font-semibold text-xs"
                  required
                />
              </div>

              {/* Address Input */}
              <div className="space-y-2">
                <label className="block text-[8.5px] font-extrabold text-white/40 uppercase tracking-wider">Địa Chỉ Chi Tiết</label>
                <input 
                  type="text" 
                  value={facForm.address}
                  onChange={(e) => setFacForm({ ...facForm, address: e.target.value })}
                  placeholder="Ví dụ: 12 Phố Tràng Tiền, Tràng Tiền, Hoàn Kiếm, Hà Nội"
                  className="w-full bg-[#0b0c0e] border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-3 focus:outline-none focus:border-[#5E0ED7] transition-all font-semibold text-xs"
                  required
                />
              </div>

              {/* Map Coordinates (lat/lng) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[8.5px] font-extrabold text-white/40 uppercase tracking-wider">Vĩ độ (Lat)</label>
                  <input 
                    type="number" 
                    step="0.000001"
                    value={facForm.lat}
                    onChange={(e) => setFacForm({ ...facForm, lat: e.target.value })}
                    className="w-full bg-[#0b0c0e] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#5E0ED7] transition-all font-semibold text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[8.5px] font-extrabold text-white/40 uppercase tracking-wider">Kinh độ (Lng)</label>
                  <input 
                    type="number" 
                    step="0.000001"
                    value={facForm.lng}
                    onChange={(e) => setFacForm({ ...facForm, lng: e.target.value })}
                    className="w-full bg-[#0b0c0e] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#5E0ED7] transition-all font-semibold text-xs"
                  />
                </div>
              </div>

              {/* Warehouse specific: Region */}
              {facForm.type === 'kho' && (
                <div className="space-y-2">
                  <label className="block text-[8.5px] font-extrabold text-white/40 uppercase tracking-wider">Vùng Miền</label>
                  <select 
                    value={facForm.region}
                    onChange={(e) => setFacForm({ ...facForm, region: e.target.value })}
                    className="w-full bg-[#0b0c0e] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#5E0ED7] transition-all font-semibold uppercase tracking-wider text-[10px]"
                  >
                    <option value="BAC">Bắc Bộ (BAC)</option>
                    <option value="TRUNG">Trung Bộ (TRUNG)</option>
                    <option value="NAM">Nam Bộ (NAM)</option>
                  </select>
                </div>
              )}

              {/* Branch specific: Link to Warehouse */}
              {facForm.type === 'chinhanh' && (
                <div className="space-y-2">
                  <label className="block text-[8.5px] font-extrabold text-white/40 uppercase tracking-wider">Tổng Kho Trung Chuyển Liên Kết</label>
                  <select 
                    value={facForm.warehouse_link}
                    onChange={(e) => setFacForm({ ...facForm, warehouse_link: e.target.value })}
                    className="w-full bg-[#0b0c0e] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#5E0ED7] transition-all font-semibold text-xs"
                  >
                    <option value="">-- Lựa chọn Tổng kho liên kết --</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <footer className="pt-4 border-t border-white/5 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowFacilityModal(false)}
                  className="w-1/2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 text-[9px] font-black uppercase py-3.5 tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="w-1/2 bg-[#5E0ED7] hover:bg-[#6f30e8] text-white text-[9px] font-black uppercase py-3.5 tracking-wider rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(94,14,215,0.4)]"
                >
                  {facForm.id ? 'Cập Nhật Cơ Sở' : 'Tạo Mới Cơ Sở'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* 4.2. Manager Modal */}
      {showManagerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#150d2a] border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(94,14,215,0.3)] relative">
            <header className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                {manForm.id ? 'Cập Nhật Tài Khoản Quản Lý' : 'Bổ Nhiệm Quản Lý Cơ Sở Mới'}
              </h3>
              <button 
                onClick={() => setShowManagerModal(false)}
                className="text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <form onSubmit={handleManSubmit} className="p-6 space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-[8.5px] font-extrabold text-white/40 uppercase tracking-wider">Họ và Tên</label>
                <input 
                  type="text" 
                  value={manForm.fullname}
                  onChange={(e) => setManForm({ ...manForm, fullname: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full bg-[#0b0c0e] border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-3 focus:outline-none focus:border-[#5E0ED7] transition-all font-semibold text-xs"
                  required
                />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label className="block text-[8.5px] font-extrabold text-white/40 uppercase tracking-wider">Tên Đăng Nhập</label>
                <input 
                  type="text" 
                  value={manForm.username}
                  onChange={(e) => setManForm({ ...manForm, username: e.target.value })}
                  placeholder="Ví dụ: quanly_hn01"
                  disabled={!!manForm.id}
                  className="w-full bg-[#0b0c0e] border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-3 focus:outline-none focus:border-[#5E0ED7] transition-all font-semibold text-xs"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-[8.5px] font-extrabold text-white/40 uppercase tracking-wider">
                  {manForm.id ? 'Mật Khẩu Mới (Để trống nếu không đổi)' : 'Mật Khẩu Đăng Nhập'}
                </label>
                <input 
                  type="password" 
                  value={manForm.password}
                  onChange={(e) => setManForm({ ...manForm, password: e.target.value })}
                  placeholder="Nhập mật khẩu an toàn"
                  className="w-full bg-[#0b0c0e] border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-3 focus:outline-none focus:border-[#5E0ED7] transition-all font-semibold text-xs"
                  required={!manForm.id}
                />
              </div>

              {/* Assign to Branch or Warehouse */}
              <div className="space-y-4">
                <label className="block text-[8.5px] font-extrabold text-white/40 uppercase tracking-wider">Phân Bổ Vận Hành</label>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Select Branch */}
                  <div className="space-y-2">
                    <label className="block text-[7.5px] font-bold text-white/30 uppercase tracking-wider">Theo Chi Nhánh (Hub)</label>
                    <select 
                      value={manForm.branch_id}
                      onChange={(e) => setManForm({ ...manForm, branch_id: e.target.value, warehouse_id: '' })}
                      className="w-full bg-[#0b0c0e] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#5E0ED7] transition-all font-semibold text-xs"
                    >
                      <option value="">-- Không phân bổ --</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Warehouse */}
                  <div className="space-y-2">
                    <label className="block text-[7.5px] font-bold text-white/30 uppercase tracking-wider">Theo Tổng Kho</label>
                    <select 
                      value={manForm.warehouse_id}
                      onChange={(e) => setManForm({ ...manForm, warehouse_id: e.target.value, branch_id: '' })}
                      className="w-full bg-[#0b0c0e] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#5E0ED7] transition-all font-semibold text-xs"
                    >
                      <option value="">-- Không phân bổ --</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <footer className="pt-4 border-t border-white/5 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowManagerModal(false)}
                  className="w-1/2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 text-[9px] font-black uppercase py-3.5 tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="w-1/2 bg-[#5E0ED7] hover:bg-[#6f30e8] text-white text-[9px] font-black uppercase py-3.5 tracking-wider rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(94,14,215,0.4)]"
                >
                  {manForm.id ? 'Cập Nhật Quản Lý' : 'Bổ Nhiệm Quản Lý'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
