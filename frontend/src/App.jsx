import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Tracking from './pages/Tracking';
import MerchantOrder from './pages/MerchantOrder';
import Login from './pages/Login';
import Register from './pages/Register';
import MerchantDashboard from './pages/MerchantDashboard';
import MerchantOrders from './pages/MerchantOrders';
import MerchantAddresses from './pages/MerchantAddresses';


function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-canvas">
      <div className="flex items-center gap-6">
        <Link to="/" className="font-bold text-xl tracking-tight">ANTIGRAVITY EXPRESS</Link>
        <div className="flex gap-4">
          <Link to="/" className="font-medium text-sm text-secondary hover:text-ink">Trang chủ</Link>
          <Link to="/tracking" className="font-medium text-sm text-secondary hover:text-ink">Tra cứu</Link>
          {isAuthenticated() && user.role === 'KHACHHANG' && (
            <>
              <Link to="/merchant" className="font-medium text-sm text-secondary hover:text-ink">Dashboard</Link>
              <Link to="/merchant/order/new" className="font-medium text-sm text-secondary hover:text-ink">Tạo Đơn</Link>
              <Link to="/merchant/orders" className="font-medium text-sm text-secondary hover:text-ink">Đơn hàng</Link>
              <Link to="/merchant/addresses" className="font-medium text-sm text-secondary hover:text-ink">Sổ địa chỉ</Link>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated() ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-ink">
              {user.fullname} <span className="text-xs font-normal text-secondary bg-canvas-soft px-2 py-1 rounded-full">{user.role}</span>
            </span>
            <button
              onClick={logout}
              className="btn-subtle px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="btn-subtle px-4 py-2 text-sm">Đăng nhập</Link>
            <Link to="/register" className="btn-primary px-4 py-2 text-sm">Đăng ký</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/tracking" element={<Tracking />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Merchant Routes */}
              <Route
                path="/merchant"
                element={
                  <ProtectedRoute allowedRoles={['KHACHHANG']}>
                    <MerchantDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/merchant/order/new"
                element={
                  <ProtectedRoute allowedRoles={['KHACHHANG']}>
                    <MerchantOrder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/merchant/orders"
                element={
                  <ProtectedRoute allowedRoles={['KHACHHANG']}>
                    <MerchantOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/merchant/addresses"
                element={
                  <ProtectedRoute allowedRoles={['KHACHHANG']}>
                    <MerchantAddresses />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
