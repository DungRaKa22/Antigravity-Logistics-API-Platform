import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Vị trí quay lại sau khi đăng nhập (hoặc mặc định về merchant portal)
  const from = location.state?.from?.pathname || '/merchant';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setError('');
    setLoading(true);

    const res = await login(username, password);
    setLoading(false);

    if (res.success) {
      // Đọc thông tin role thực tế nhận được từ API
      const actualRole = localStorage.getItem('role');
      
      // Điều hướng tương ứng dựa trên nhóm vai trò thực tế
      if (['ADMIN', 'QUANTRI', 'HR', 'KETOAN', 'CSKH'].includes(actualRole)) {
        let defaultPath = '/admin';
        if (actualRole === 'HR') defaultPath = '/admin/users';
        else if (actualRole === 'KETOAN') defaultPath = '/admin/invoices';
        
        const adminFrom = location.state?.from?.pathname?.startsWith('/admin') ? location.state.from.pathname : defaultPath;
        navigate(adminFrom, { replace: true });
      } else if (['SHIPPER', 'KHO', 'NHANVIEN'].includes(actualRole)) {
        const staffFrom = location.state?.from?.pathname?.startsWith('/staff') ? location.state.from.pathname : '/staff';
        navigate(staffFrom, { replace: true });
      } else {
        const merchantFrom = location.state?.from?.pathname?.startsWith('/merchant') ? location.state.from.pathname : '/merchant';
        navigate(merchantFrom, { replace: true });
      }
    } else {
      setError(res.message || 'Tài khoản hoặc mật khẩu không chính xác.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#0d061c] relative overflow-hidden text-white font-sans">
      {/* Background neon mesh glow */}
      <div className="neon-aurora-blob bg-accent-purple/20 w-[600px] h-[600px] top-1/4 left-1/4 animate-pulse"></div>
      <div className="neon-aurora-blob bg-cyan-500/10 w-[500px] h-[500px] bottom-1/4 right-1/4 animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute inset-0 bg-[radial-gradient(rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0" />

      {/* Centered Login Card */}
      <div className="bg-[#150d2a]/70 backdrop-blur-3xl border border-purple-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all duration-500 w-full max-w-[1000px] min-h-[600px] flex flex-col md:flex-row overflow-hidden rounded-[32px] z-10 relative">
        
        {/* Left Side: Holographic Orbits Container */}
        <div className="hidden md:flex w-1/2 relative bg-gradient-to-br from-[#1c0f3a] to-[#0d061c] flex-col justify-between p-12 border-r border-white/5 overflow-hidden">
          {/* Animated holographic orbits */}
          <div className="absolute inset-0 opacity-[0.12] pointer-events-none z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full border border-purple-500 animate-spin" style={{ animationDuration: '24s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full border border-dashed border-cyan-400 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] rounded-full border border-double border-purple-400 animate-pulse"></div>
          </div>
          
          {/* Dynamic mesh dots */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(6,182,212,0.05)_1.5px,transparent_1.5px)] bg-[size:24px_24px] pointer-events-none z-0" />

          {/* Pulsing overlay branding mark */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-transparent via-black/20 to-black/70 z-10">
            <div className="w-20 h-20 rounded-full border-2 border-accent-purple/50 flex items-center justify-center mb-6 neon-pulse-purple relative">
              <div className="w-6 h-6 bg-accent-purple/30 rounded-full absolute animate-ping"></div>
              <svg viewBox="0 0 32 32" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 3L4 25C4 25 9 22 16 22C23 22 28 25 28 25L16 3Z" fill="url(#panelLogoGrad)" />
                <path d="M16 10L10 20H22L16 10Z" fill="white" />
                <circle cx="16" cy="15" r="2.5" fill="#30195C" />
                <defs>
                   <linearGradient id="panelLogoGrad" x1="4" y1="3" x2="28" y2="25" gradientUnits="userSpaceOnUse">
                     <stop offset="0%" stopColor="#a855f7" />
                     <stop offset="100%" stopColor="#5E0ED7" />
                   </linearGradient>
                </defs>
              </svg>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest text-white text-glow font-display">Zero Gravity</h2>
            <p className="text-[10px] uppercase text-cyan-400 tracking-widest font-black mt-2 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-400/25">
              Logistics Core Portal
            </p>
          </div>

          {/* Footnote lockup inside panel */}
          <div className="mt-auto relative z-20 text-center w-full">
            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest font-mono">Quantum Transmission Secure</span>
          </div>
        </div>

        {/* Right Side: Login Form Canvas */}
        <div className="w-full md:w-1/2 flex flex-col justify-between p-8 md:p-12 lg:p-16 bg-transparent overflow-y-auto min-h-[600px] relative z-10">
          {/* Brand Anchor & Back Button */}
          <div className="flex justify-between items-center mb-6 md:mb-0">
            <Link 
              to="/" 
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white hover:text-glow transition-all duration-300"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>Quay lại</span>
            </Link>
            <Link to="/" className="flex flex-col items-end group transition-all duration-300">
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 32 32" className="w-5.5 h-5.5 transform group-hover:scale-110 transition-transform duration-300" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 3L4 25C4 25 9 22 16 22C23 22 28 25 28 25L16 3Z" fill="url(#loginLogoGrad)" />
                  <path d="M16 10L10 20H22L16 10Z" fill="white" />
                  <circle cx="16" cy="15" r="2.5" fill="#30195C" />
                  <defs>
                     <linearGradient id="loginLogoGrad" x1="4" y1="3" x2="28" y2="25" gradientUnits="userSpaceOnUse">
                       <stop offset="0%" stopColor="#a855f7" />
                       <stop offset="100%" stopColor="#5E0ED7" />
                     </linearGradient>
                  </defs>
                </svg>
                <div className="flex items-center font-display">
                  <span className="font-extrabold text-[11px] tracking-[0.3px] text-white uppercase">ANTIGRAVITY</span>
                  <span className="bg-purple-600 text-white font-extrabold text-[9.5px] px-1 py-0.2 ml-0.8 rounded-[1px] tracking-[0.3px] uppercase shadow-[0_0_10px_rgba(168,85,247,0.4)]">EXPRESS</span>
                </div>
              </div>
              <span className="text-[4.5px] font-black text-purple-300/80 tracking-[1.5px] mt-0.5 uppercase font-sans">NHANH VÀ ĐÁNG TIN CẬY</span>
            </Link>
          </div>

          {/* Form Container */}
          <div className="w-full max-w-md mx-auto my-auto py-6 space-y-6">
            {/* Header */}
            <div className="space-y-1.5">
              <h1 className="text-3xl font-black tracking-tight text-white font-display text-glow-purple uppercase">ĐĂNG NHẬP</h1>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Vui lòng điền thông tin để kết nối cổng hệ thống.</p>
            </div>

            {/* Hệ thống tự động nhận diện vai trò sau khi kết nối */}

            {/* Error Panel */}
            {error && (
              <div className="bg-rose-500/10 text-rose-300 text-xs p-3 border border-rose-500/20 font-bold rounded-xl uppercase tracking-wider">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Input Group: Username / Email */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-white/40 uppercase tracking-widest" htmlFor="username">
                  Tên đăng nhập hoặc Email
                </label>
                <input
                  className="w-full bg-[#07030e]/60 border border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3.5 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/25 transition-all duration-300 font-semibold shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] focus:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  id="username"
                  type="text"
                  placeholder="Nhập tên đăng nhập của bạn"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              {/* Input Group: Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-extrabold text-white/40 uppercase tracking-widest" htmlFor="password">
                    Mật khẩu
                  </label>
                  <a href="#" className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors uppercase tracking-wider">
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  <input
                    className="w-full bg-[#07030e]/60 border border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3.5 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/25 transition-all duration-300 font-semibold shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] pr-12"
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu của bạn"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-2 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-accent-purple to-purple-600 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-full py-3.5 flex items-center justify-center gap-2 mt-6 cursor-pointer transition-all duration-300 shadow-[0_4px_16px_rgba(94,14,215,0.4)] hover:shadow-[0_6px_22px_rgba(94,14,215,0.6)] active:scale-98"
              >
                {loading ? 'Đang xác minh cổng...' : 'Kết nối hệ thống'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Footer Link */}
            <div className="text-center pt-4 border-t border-white/5">
              <span className="text-xs text-white/40 font-semibold">Chưa có tài khoản? </span>
              <Link to="/register" className="text-xs font-black text-cyan-400 hover:text-cyan-300 hover:underline transition-colors uppercase tracking-wider">
                Đăng ký ngay
              </Link>
            </div>
          </div>

          {/* Bottom branding cushion */}
          <div className="h-2"></div>
        </div>
      </div>
    </div>
  );
}
