import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [systemTime, setSystemTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const isWarehouse = !!user?.warehouse_id;

  const allMenuItems = [
    {
      name: isWarehouse ? 'Cargo Transit Hub' : 'Dispatch Hub',
      path: '/admin',
      icon: 'dashboard',
      desc: isWarehouse ? 'Vận hành & Trung chuyển' : 'Điều hành & CSKH Chat',
      roles: ['ADMIN', 'QUANTRI', 'CSKH']
    },
    {
      name: isWarehouse ? 'Warehouse Crew' : 'Drivers & Staff',
      path: '/admin/users',
      icon: 'local_shipping',
      desc: isWarehouse ? 'Nhân viên & Chấm công' : 'Nhân sự & Chấm công',
      roles: ['ADMIN', 'QUANTRI', 'HR']
    },
    {
      name: isWarehouse ? 'Operating Ledger' : 'Billing & Settlements',
      path: '/admin/invoices',
      icon: 'payments',
      desc: isWarehouse ? 'Bảng lương & Vận tải' : 'Kế toán & Bảng lương',
      roles: ['ADMIN', 'QUANTRI', 'KETOAN']
    }
  ];

  const menuItems = allMenuItems.filter(item => !item.roles || item.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    if (location.pathname === '/admin') {
      return isWarehouse ? 'Cargo Transit Control' : 'Dispatch Operations Center';
    }
    if (location.pathname.startsWith('/admin/users')) {
      return isWarehouse ? 'Warehouse Crew Directory' : 'Rider Directory & Quota Admin';
    }
    if (location.pathname.startsWith('/admin/invoices')) {
      return isWarehouse ? 'Warehouse Operating Ledger' : 'Financial Settlement Engine';
    }
    return 'Admin Management Control';
  };

  return (
    <div className="bg-canvas min-h-screen text-black flex relative overflow-hidden font-sans">
      {/* Aurora Neon Background Blobs */}
      <div className="neon-aurora-blob bg-accent-purple/10 w-[500px] h-[500px] -top-20 -left-20 animate-pulse"></div>
      <div className="neon-aurora-blob bg-cyan-500/5 w-[500px] h-[500px] bottom-10 right-10 animate-pulse" style={{ animationDuration: '6s' }}></div>

      {/* MOBILE SIDEBAR MOBILE BACKDROP OVERLAY */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity duration-300"
        />
      )}

      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-72 bg-gradient-to-b from-[#180d32] to-[#0d061c] text-white flex flex-col z-[100] border-r border-white/5 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Brand Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <Link to="/" className="flex flex-col items-start group">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 32 32" className="w-8 h-8 transform group-hover:scale-110 transition-transform duration-300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 3L4 25C4 25 9 22 16 22C23 22 28 25 28 25L16 3Z" fill="url(#sidebarLogoGrad)" />
                <path d="M16 10L10 20H22L16 10Z" fill="white" />
                <circle cx="16" cy="15" r="2.5" fill="#30195C" />
                <defs>
                   <linearGradient id="sidebarLogoGrad" x1="4" y1="3" x2="28" y2="25" gradientUnits="userSpaceOnUse">
                     <stop offset="0%" stopColor="#a855f7" />
                     <stop offset="100%" stopColor="#5E0ED7" />
                   </linearGradient>
                </defs>
              </svg>
              <div className="flex items-center font-display">
                <span className="font-extrabold text-sm tracking-[1px] text-white uppercase">ANTIGRAVITY</span>
                <span className="bg-purple-600 text-white font-extrabold text-[10px] px-1.5 py-0.5 ml-1 rounded-[2px] tracking-[0.5px] uppercase shadow-[0_0_12px_rgba(168,85,247,0.4)]">CORE</span>
              </div>
            </div>
            <span className="text-[6.5px] font-black text-purple-300/80 tracking-[2px] mt-1 ml-10 uppercase font-sans">CONTROL PANEL v2.4</span>
          </Link>

          {/* Mobile close button */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1 rounded-full text-white/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Sidebar Menu Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="px-3 mb-3 text-[10px] font-extrabold text-white/40 uppercase tracking-widest">
            LOGISTICS OPERATIONS
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

        {/* Sidebar Footer User Info & Exit */}
        <div className="p-4 border-t border-white/5 bg-black/15 flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center font-extrabold text-white text-base shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              {user?.fullname?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black tracking-wide truncate text-white uppercase">{user?.fullname}</span>
              <span className="text-[9px] font-bold text-cyan-400 tracking-wider flex items-center gap-1 mt-0.5 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-pulse"></span>
                {user?.role === 'QUANTRI' ? 'System Administrator' : user?.role}
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

      {/* MAIN VIEW AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto custom-scrollbar relative z-10">
        
        {/* TOP STATUS BAR */}
        <header className="sticky top-0 bg-white/70 backdrop-blur-xl border-b border-black/5 px-6 md:px-10 py-4 flex items-center justify-between z-50">
          <div className="flex items-center gap-3">
            {/* Hamburger trigger */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-xl bg-black/5 hover:bg-black/10 border border-black/5 text-black hover:text-black cursor-pointer transition-all flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-base">menu</span>
            </button>
            <div className="hidden sm:block">
              <div className="text-[10px] font-extrabold text-mute uppercase tracking-widest">CONTROL OPERATIONS CENTER</div>
              <h2 className="text-base font-extrabold text-black tracking-tight uppercase font-display text-glow-purple">{getPageTitle()}</h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* System Clock & Date Widget */}
            <div className="hidden lg:flex items-center gap-2 p-2 bg-black/[0.02] border border-black/5 rounded-xl font-mono text-[11px] font-extrabold text-black/80">
              <span className="material-symbols-outlined text-xs text-accent-purple">schedule</span>
              <span>
                {systemTime.toLocaleDateString('vi-VN')} {systemTime.toLocaleTimeString('vi-VN')}
              </span>
            </div>

            {/* Notification Indicator */}
            <div className="relative group cursor-pointer p-1.5 rounded-full hover:bg-black/5 transition-all">
              <span className="material-symbols-outlined text-[20px] text-black/75">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-600 border border-white shadow-[0_0_8px_rgba(168,85,247,0.6)]"></span>
            </div>

            {/* Admin Avatar Indicator */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center font-extrabold text-accent-purple text-xs">
                {user?.fullname?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="text-[10px] font-black text-black uppercase tracking-wider hidden md:inline">
                {user?.fullname}
              </span>
            </div>
          </div>
        </header>

        {/* CONTAINER CONTENT VIEW */}
        <main className="flex-1 p-6 md:p-10 max-w-[1440px] w-full mx-auto pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
