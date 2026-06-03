import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { BACKEND_URL } from '../services/api';

export default function MerchantLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [systemTime, setSystemTime] = useState(new Date());
  
  // Global Realtime SSE Toast State
  const [sseToast, setSseToast] = useState({ show: false, message: '', orderId: '' });

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Global SSE Listener for order updates across all merchant pages!
  useEffect(() => {
    const eventSource = new EventSource(`${BACKEND_URL}/api/orders/events`);
    
    eventSource.addEventListener('connect', (e) => {
      console.log("Global Merchant SSE connected:", e.data);
    });

    eventSource.addEventListener('order_update', (e) => {
      try {
        const payload = JSON.parse(e.data);
        setSseToast({
          show: true,
          message: `ĐƠN HÀNG ${payload.order_id} CẬP NHẬT: Trạng thái [${payload.status}] • Vị trí: "${payload.location}" • Nhân viên: ${payload.shipper_name}`,
          orderId: payload.order_id
        });
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const isActive = (path) => {
    if (path === '/merchant') {
      return location.pathname === '/merchant';
    }
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/merchant',
      icon: 'dashboard',
      desc: 'Tổng quan & Phân tích sản lượng'
    },
    {
      name: 'Tạo Vận Đơn',
      path: '/merchant/order/new',
      icon: 'add_box',
      desc: 'Tạo đơn lẻ, tính cước km'
    },
    {
      name: 'Quản Lý Vận Đơn',
      path: '/merchant/orders',
      icon: 'package_2',
      desc: 'Danh sách đơn & Tải excel'
    },
    {
      name: 'Ví & Đối Soát',
      path: '/merchant/invoices',
      icon: 'payments',
      desc: 'Xem sao kê COD & dòng tiền'
    },
    {
      name: 'Sổ Địa Chỉ',
      path: '/merchant/addresses',
      icon: 'menu_book',
      desc: 'Danh bạ gửi / nhận mặc định'
    },
    {
      name: 'Tích Hợp B2B API',
      path: '/merchant/api-keys',
      icon: 'terminal',
      desc: 'Quản lý API Key & Tài liệu dev'
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    if (location.pathname === '/merchant') return 'Merchant Dashboard';
    if (location.pathname.startsWith('/merchant/order/new')) return 'Lập vận đơn thông minh';
    if (location.pathname.startsWith('/merchant/orders')) return 'Hồ sơ quản lý vận đơn';
    if (location.pathname.startsWith('/merchant/invoices')) return 'Ví đối soát tài chính';
    if (location.pathname.startsWith('/merchant/addresses')) return 'Danh bạ địa chỉ mặc định';
    if (location.pathname.startsWith('/merchant/api-keys')) return 'Cổng tích hợp B2B API';
    return 'Merchant Portal';
  };

  return (
    <div className="bg-canvas min-h-screen text-black flex relative overflow-hidden font-sans">
      {/* Aurora Background blobs */}
      <div className="neon-aurora-blob bg-accent-purple/10 w-[500px] h-[500px] -top-20 -left-20 animate-pulse"></div>
      <div className="neon-aurora-blob bg-cyan-500/5 w-[500px] h-[500px] bottom-10 right-10 animate-pulse" style={{ animationDuration: '6s' }}></div>

      {/* SSE floating toast at the bottom right */}
      {sseToast.show && (
        <div className="fixed bottom-6 right-6 z-[200] max-w-md bg-white/95 backdrop-blur-2xl text-black p-5 rounded-2xl shadow-[0_15px_35px_rgba(94,14,215,0.15)] border border-accent-purple/30 flex items-start gap-4 animate-slide-in">
          <div className="p-2.5 bg-accent-purple/10 border border-accent-purple/20 rounded-xl text-accent-purple shrink-0">
            <span className="material-symbols-outlined text-accent-purple text-glow-purple animate-pulse">notifications_active</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black text-accent-purple uppercase tracking-widest flex justify-between items-center">
              <span>Cập Nhật Đơn Hàng</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-xs font-bold leading-relaxed mt-2 text-black">{sseToast.message}</p>
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => navigate(`/tracking?code=${sseToast.orderId}`)}
                className="px-3.5 py-1.5 bg-accent-purple text-white text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-[#6e19f1] transition-all cursor-pointer"
              >
                Tra cứu đơn
              </button>
              <button
                onClick={() => setSseToast({ show: false, message: '', orderId: '' })}
                className="px-3 py-1.5 border border-black/10 hover:bg-black/5 text-black text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer bg-transparent"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BACKDROP OVERLAY */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
        />
      )}

      {/* SLEEK SIDEBAR PANEL */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-72 bg-gradient-to-b from-[#12082b] to-[#0a0319] text-white flex flex-col z-[100] border-r border-white/5 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Brand Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <Link to="/merchant" className="flex flex-col items-start group">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 32 32" className="w-8 h-8 transform group-hover:scale-110 transition-transform duration-300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 3L4 25C4 25 9 22 16 22C23 22 28 25 28 25L16 3Z" fill="url(#merchantLogoGrad)" />
                <path d="M16 10L10 20H22L16 10Z" fill="white" />
                <circle cx="16" cy="15" r="2.5" fill="#30195C" />
                <defs>
                   <linearGradient id="merchantLogoGrad" x1="4" y1="3" x2="28" y2="25" gradientUnits="userSpaceOnUse">
                     <stop offset="0%" stopColor="#c084fc" />
                     <stop offset="100%" stopColor="#5E0ED7" />
                   </linearGradient>
                </defs>
              </svg>
              <div className="flex items-center font-display">
                <span className="font-extrabold text-sm tracking-[1px] text-white uppercase">ANTIGRAVITY</span>
                <span className="bg-purple-600/30 border border-purple-500/40 text-purple-200 font-extrabold text-[9px] px-1.5 py-0.5 ml-1 rounded-[2px] tracking-[0.5px] uppercase">SHOP</span>
              </div>
            </div>
            <span className="text-[6.5px] font-black text-purple-300/80 tracking-[2px] mt-1 ml-10 uppercase font-sans">MERCHANT CONSOLE v2.4</span>
          </Link>

          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1 rounded-full text-white/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Sidebar Navigation Options */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="px-3 mb-3 text-[10px] font-extrabold text-white/40 uppercase tracking-widest">
            MERCHANT CONSOLE
          </div>
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group cursor-pointer relative
                  ${active 
                    ? 'bg-purple-600 text-white shadow-[0_8px_20px_rgba(168,85,247,0.25)] border-l-4 border-cyan-400 font-extrabold' 
                    : 'text-white/60 hover:text-white hover:bg-white/5 font-semibold'
                  }
                `}
              >
                <span className={`
                  material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-110
                  ${active ? 'text-cyan-300 text-glow-cyan' : 'text-white/50 group-hover:text-white/80'}
                `}>
                  {item.icon}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs tracking-wide">{item.name}</span>
                  <span className={`text-[9px] font-medium leading-none mt-0.5 ${active ? 'text-purple-200' : 'text-white/30 group-hover:text-white/40'}`}>
                    {item.desc}
                  </span>
                </div>
                {active && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Shop profile & logout */}
        <div className="p-4 border-t border-white/5 bg-black/15 flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center font-extrabold text-white text-base shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              {user?.fullname?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black tracking-wide truncate text-white uppercase">{user?.fullname}</span>
              <span className="text-[9px] font-bold text-cyan-400 tracking-wider flex items-center gap-1 mt-0.5 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-pulse"></span>
                Shop Đối Tác
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link 
              to="/" 
              className="py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-white/80 hover:text-white bg-white/5 flex items-center justify-center gap-1.5 text-[10px] font-bold transition-all"
              title="Quay lại Trang chủ"
            >
              <span className="material-symbols-outlined text-xs">home</span>
              <span>Home</span>
            </Link>
            <button
              onClick={handleLogout}
              className="py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/20 flex items-center justify-center gap-1.5 text-[10px] font-bold transition-all cursor-pointer shadow-sm hover:shadow-[0_4px_12px_rgba(244,63,94,0.3)]"
            >
              <span className="material-symbols-outlined text-xs">logout</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT PORT VIEW */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto custom-scrollbar relative z-10">
        
        {/* TOP STATUS BAR */}
        <header className="sticky top-0 bg-white/70 backdrop-blur-xl border-b border-black/5 px-6 md:px-10 py-4 flex items-center justify-between z-50">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Hamburger Menu */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-xl bg-black/5 hover:bg-black/10 border border-black/5 text-black hover:text-black cursor-pointer transition-all flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-base">menu</span>
            </button>
            <div className="hidden sm:block">
              <div className="text-[10px] font-extrabold text-mute uppercase tracking-widest font-sans">PORTAL DECK</div>
              <h2 className="text-base font-extrabold text-black tracking-tight uppercase font-display text-glow-purple">{getPageTitle()}</h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Live real-time clock indicator */}
            <div className="hidden lg:flex items-center gap-2 p-2 bg-black/[0.02] border border-black/5 rounded-xl font-mono text-[11px] font-extrabold text-black/80">
              <span className="material-symbols-outlined text-xs text-accent-purple">schedule</span>
              <span>
                {systemTime.toLocaleDateString('vi-VN')} {systemTime.toLocaleTimeString('vi-VN')}
              </span>
            </div>

            {/* Notification bell widget */}
            <div className="relative group cursor-pointer p-1.5 rounded-full hover:bg-black/5 transition-all">
              <span className="material-symbols-outlined text-[20px] text-black/75">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-600 border border-white shadow-[0_0_8px_rgba(168,85,247,0.6)]"></span>
            </div>

            {/* Profile Avatar indicator */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center font-extrabold text-accent-purple text-xs">
                {user?.fullname?.charAt(0).toUpperCase() || 'M'}
              </div>
              <span className="text-[10px] font-black text-black uppercase tracking-wider hidden md:inline">
                {user?.fullname}
              </span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT CONTEXT RENDER */}
        <main className="flex-1 p-6 md:p-10 max-w-[1440px] w-full mx-auto pb-16">
          {children}
        </main>
      </div>

    </div>
  );
}
