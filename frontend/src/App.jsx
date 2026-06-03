import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';

import Home from './pages/Home';
import Tracking from './pages/Tracking';
import MerchantOrder from './pages/MerchantOrder';
import IndividualOrder from './pages/IndividualOrder';
import Login from './pages/Login';
import Register from './pages/Register';
import MerchantDashboard from './pages/MerchantDashboard';
import MerchantOrders from './pages/MerchantOrders';
import MerchantAddresses from './pages/MerchantAddresses';
import MerchantInvoices from './pages/MerchantInvoices';
import MerchantApiKeys from './pages/MerchantApiKeys';

// Admin Portals
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminInvoices from './pages/AdminInvoices';
import AdminLayout from './components/AdminLayout';
import MerchantLayout from './components/MerchantLayout';

// Staff Portals
import StaffDashboard from './pages/StaffDashboard';

// Super Admin Portals
import SuperAdminRoute from './components/SuperAdminRoute';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

// Floating Virtual Assistant
import QuantumGuide from './components/QuantumGuide';


function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const getDashboardPath = () => {
    if (!isAuthenticated()) return '/';
    if (user?.role === 'HR') return '/admin/users';
    if (user?.role === 'KETOAN') return '/admin/invoices';
    if (['ADMIN', 'QUANTRI', 'CSKH'].includes(user?.role)) return '/admin';
    if (['SHIPPER', 'KHO', 'NHANVIEN'].includes(user?.role)) return '/staff';
    return '/merchant';
  };

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-7xl z-50 flex justify-between items-center px-6 h-16 bg-white/75 backdrop-blur-xl border border-black/10 rounded-full shadow-[0_8px_32px_rgba(94,14,215,0.05)] hover:border-accent-purple/35 transition-all duration-500">
      <div className="flex items-center gap-8">
        <Link to={getDashboardPath()} className="flex flex-col items-start group transition-all duration-300">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 32 32" className="w-7 h-7 transform group-hover:scale-110 transition-transform duration-300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 3L4 25C4 25 9 22 16 22C23 22 28 25 28 25L16 3Z" fill="url(#navLogoGrad)" />
              <path d="M16 10L10 20H22L16 10Z" fill="white" />
              <circle cx="16" cy="15" r="2.5" fill="#30195C" />
              <defs>
                 <linearGradient id="navLogoGrad" x1="4" y1="3" x2="28" y2="25" gradientUnits="userSpaceOnUse">
                   <stop offset="0%" stop-color="#5E0ED7" />
                   <stop offset="100%" stop-color="#30195C" />
                 </linearGradient>
              </defs>
            </svg>
            <div className="flex items-center font-display">
              <span className="font-medium text-sm md:text-base tracking-[0.5px] text-[#30195C] transition-colors duration-300 uppercase">ANTIGRAVITY</span>
              <span className="bg-[#30195C] text-white font-extrabold text-[11px] md:text-[13px] px-1.5 py-0.5 ml-1 rounded-[1px] tracking-[0.5px] uppercase shadow-[0_2px_8px_rgba(48,25,92,0.2)]">EXPRESS</span>
            </div>
          </div>
          <span className="text-[6px] md:text-[7.5px] font-bold text-[#30195C]/80 tracking-[2px] mt-0.5 ml-9 uppercase font-sans">NHANH VÀ ĐÁNG TIN CẬY</span>
        </Link>
        <nav className="hidden md:flex gap-6 items-center h-full pt-1">
          {/* Hide public pages (Trang chủ & Tra cứu) when authenticated */}
          {!isAuthenticated() && (
            <>
              <Link 
                to="/" 
                className={`font-semibold text-xs tracking-wider uppercase transition-all pb-1 relative group ${
                  isActive('/') ? 'text-black font-extrabold' : 'text-black/60 hover:text-black'
                }`}
              >
                Trang chủ
                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-accent-purple shadow-[0_0_8px_#5E0ED7] transition-transform duration-300 origin-center ${
                  isActive('/') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`} />
              </Link>
              <Link 
                to="/tracking" 
                className={`font-semibold text-xs tracking-wider uppercase transition-all pb-1 relative group ${
                  isActive('/tracking') ? 'text-black font-extrabold' : 'text-black/60 hover:text-black'
                }`}
              >
                Tra cứu
                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-accent-purple shadow-[0_0_8px_#5E0ED7] transition-transform duration-300 origin-center ${
                  isActive('/tracking') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`} />
              </Link>
            </>
          )}

          {/* Merchant Navigation */}
          {isAuthenticated() && ['KHACHHANG', 'DOITAC'].includes(user.role) && (
            <>
              <Link 
                to="/merchant" 
                className={`font-semibold text-xs tracking-wider uppercase transition-all pb-1 relative group ${
                  isActive('/merchant') ? 'text-black font-extrabold' : 'text-black/60 hover:text-black'
                }`}
              >
                Dashboard
                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-accent-purple shadow-[0_0_8px_#5E0ED7] transition-transform duration-300 origin-center ${
                  isActive('/merchant') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`} />
              </Link>
              <Link 
                to="/merchant/order/new" 
                className={`font-semibold text-xs tracking-wider uppercase transition-all pb-1 relative group ${
                  isActive('/merchant/order/new') ? 'text-black font-extrabold' : 'text-black/60 hover:text-black'
                }`}
              >
                Tạo Đơn
                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-accent-purple shadow-[0_0_8px_#5E0ED7] transition-transform duration-300 origin-center ${
                  isActive('/merchant/order/new') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`} />
              </Link>
              <Link 
                to="/merchant/orders" 
                className={`font-semibold text-xs tracking-wider uppercase transition-all pb-1 relative group ${
                  isActive('/merchant/orders') ? 'text-black font-extrabold' : 'text-black/60 hover:text-black'
                }`}
              >
                Đơn hàng
                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-accent-purple shadow-[0_0_8px_#5E0ED7] transition-transform duration-300 origin-center ${
                  isActive('/merchant/orders') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`} />
              </Link>
              <Link 
                to="/merchant/invoices" 
                className={`font-semibold text-xs tracking-wider uppercase transition-all pb-1 relative group ${
                  isActive('/merchant/invoices') ? 'text-black font-extrabold' : 'text-black/60 hover:text-black'
                }`}
              >
                Đối soát
                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-accent-purple shadow-[0_0_8px_#5E0ED7] transition-transform duration-300 origin-center ${
                  isActive('/merchant/invoices') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`} />
              </Link>
              <Link 
                to="/merchant/addresses" 
                className={`font-semibold text-xs tracking-wider uppercase transition-all pb-1 relative group ${
                  isActive('/merchant/addresses') ? 'text-black font-extrabold' : 'text-black/60 hover:text-black'
                }`}
              >
                Sổ địa chỉ
                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-accent-purple shadow-[0_0_8px_#5E0ED7] transition-transform duration-300 origin-center ${
                  isActive('/merchant/addresses') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`} />
              </Link>
            </>
          )}

          {/* Admin Navigation */}
          {isAuthenticated() && ['ADMIN', 'QUANTRI', 'HR', 'KETOAN', 'CSKH'].includes(user.role) && (
            <>
              <Link 
                to="/admin" 
                className={`font-semibold text-xs tracking-wider uppercase transition-all pb-1 relative group ${
                  isActive('/admin') ? 'text-black font-extrabold' : 'text-black/60 hover:text-black'
                }`}
              >
                Operations Dashboard
                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-accent-purple shadow-[0_0_8px_#5E0ED7] transition-transform duration-300 origin-center ${
                  isActive('/admin') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`} />
              </Link>
              <Link 
                to="/admin/users" 
                className={`font-semibold text-xs tracking-wider uppercase transition-all pb-1 relative group ${
                  isActive('/admin/users') ? 'text-black font-extrabold' : 'text-black/60 hover:text-black'
                }`}
              >
                Nhân sự
                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-accent-purple shadow-[0_0_8px_#5E0ED7] transition-transform duration-300 origin-center ${
                  isActive('/admin/users') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`} />
              </Link>
              <Link 
                to="/admin/invoices" 
                className={`font-semibold text-xs tracking-wider uppercase transition-all pb-1 relative group ${
                  isActive('/admin/invoices') ? 'text-black font-extrabold' : 'text-black/60 hover:text-black'
                }`}
              >
                Hóa đơn Đối soát
                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-accent-purple shadow-[0_0_8px_#5E0ED7] transition-transform duration-300 origin-center ${
                  isActive('/admin/invoices') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`} />
              </Link>
            </>
          )}

          {/* Shipper Navigation */}
          {isAuthenticated() && ['SHIPPER', 'KHO', 'NHANVIEN'].includes(user.role) && (
            <>
              <Link 
                to="/staff" 
                className={`font-semibold text-xs tracking-wider uppercase transition-all pb-1 relative group ${
                  isActive('/staff') ? 'text-black font-extrabold' : 'text-black/60 hover:text-black'
                }`}
              >
                {user?.role === 'KHO' ? 'Warehouse Portal' : 'Shipper Portal'}
                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-accent-purple shadow-[0_0_8px_#5E0ED7] transition-transform duration-300 origin-center ${
                  isActive('/staff') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`} />
              </Link>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated() ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-accent-purple text-white flex items-center justify-center font-bold text-xs border border-accent-purple/30 shadow-[0_0_10px_rgba(94,14,215,0.4)]" title={user.fullname}>
                {user.fullname?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="text-xs font-extrabold text-black uppercase tracking-wider hidden sm:inline flex items-center gap-1.5">
                {user.fullname} 
                <span className="text-[9px] font-bold text-accent-purple bg-accent-purple/10 px-2 py-0.5 rounded-full border border-accent-purple/35 shadow-[0_0_8px_rgba(94,14,215,0.15)]">
                  {user.role}
                </span>
              </span>
            </div>
            <button
              onClick={logout}
              className="px-4 py-1.5 text-xs text-black border border-black/10 rounded-full hover:border-accent-purple hover:bg-accent-purple/5 hover:shadow-[0_2px_10px_rgba(94,14,215,0.1)] transition-all font-extrabold cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="btn-secondary px-4 py-2 text-xs font-extrabold border border-black/10 hover:border-accent-purple/35 transition-all text-black bg-transparent">Đăng nhập</Link>
            <Link to="/register" className="btn-primary px-4 py-2 text-xs font-extrabold">Đăng ký</Link>
          </div>
        )}
      </div>
    </header>
  );
}

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isMerchantPage = location.pathname.startsWith('/merchant');
  const isStaffPage = location.pathname.startsWith('/staff');
  const isSuperAdminPage = location.pathname.startsWith('/super-admin') || location.pathname === '/admin-login';

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {!isAuthPage && !isAdminPage && !isMerchantPage && !isStaffPage && !isSuperAdminPage && <Navbar />}
      <main className={`flex-1 bg-canvas ${isAuthPage || isAdminPage || isMerchantPage || isStaffPage || isSuperAdminPage ? '' : 'pt-24 md:pt-28'}`}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicOnlyRoute><Home /></PublicOnlyRoute>} />
          <Route path="/tracking" element={<PublicOnlyRoute><Tracking /></PublicOnlyRoute>} />
          <Route path="/create-order" element={<IndividualOrder />} />
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
          <Route path="/admin-login" element={<PublicOnlyRoute><SuperAdminLogin /></PublicOnlyRoute>} />

          {/* Super Admin Routes */}
          <Route
            path="/super-admin"
            element={
              <SuperAdminRoute>
                <SuperAdminDashboard />
              </SuperAdminRoute>
            }
          />

          {/* Protected Merchant Routes */}
          <Route
            path="/merchant"
            element={
              <ProtectedRoute allowedRoles={['KHACHHANG']}>
                <MerchantLayout>
                  <MerchantDashboard />
                </MerchantLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/order/new"
            element={
              <ProtectedRoute allowedRoles={['KHACHHANG']}>
                <MerchantLayout>
                  <MerchantOrder />
                </MerchantLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/orders"
            element={
              <ProtectedRoute allowedRoles={['KHACHHANG']}>
                <MerchantLayout>
                  <MerchantOrders />
                </MerchantLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/addresses"
            element={
              <ProtectedRoute allowedRoles={['KHACHHANG']}>
                <MerchantLayout>
                  <MerchantAddresses />
                </MerchantLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/invoices"
            element={
              <ProtectedRoute allowedRoles={['KHACHHANG']}>
                <MerchantLayout>
                  <MerchantInvoices />
                </MerchantLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/api-keys"
            element={
              <ProtectedRoute allowedRoles={['KHACHHANG']}>
                <MerchantLayout>
                  <MerchantApiKeys />
                </MerchantLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'QUANTRI', 'HR', 'KETOAN', 'CSKH']}>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'QUANTRI', 'HR', 'KETOAN', 'CSKH']}>
                <AdminLayout>
                  <AdminUsers />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/invoices"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'QUANTRI', 'HR', 'KETOAN', 'CSKH']}>
                <AdminLayout>
                  <AdminInvoices />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Staff/Shipper Routes */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={['SHIPPER', 'KHO', 'NHANVIEN']}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {/* Floating chatbot assistant for public pages when not on specialized layouts */}
      {!isAuthPage && !isAdminPage && !isMerchantPage && !isStaffPage && <QuantumGuide />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
