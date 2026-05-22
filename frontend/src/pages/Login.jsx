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
  const [selectedRole, setSelectedRole] = useState('KHACHHANG'); // KHACHHANG, NHANVIEN, QUANTRI
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
      
      if (actualRole !== selectedRole) {
        console.warn(`Đăng nhập thành công nhưng vai trò thực tế là ${actualRole} (không trùng khớp với lựa chọn ${selectedRole}).`);
      }

      // Điều hướng tương ứng
      if (actualRole === 'QUANTRI') {
        const adminFrom = location.state?.from?.pathname?.startsWith('/admin') ? location.state.from.pathname : '/admin';
        navigate(adminFrom, { replace: true });
      } else if (actualRole === 'NHANVIEN') {
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-canvas relative overflow-hidden text-black">
      {/* Background neon mesh glow */}
      <div className="neon-aurora-blob bg-accent-purple/5 w-[600px] h-[600px] top-1/4 left-1/4 animate-pulse"></div>
      <div className="neon-aurora-blob bg-cyan-500/5 w-[500px] h-[500px] bottom-1/4 right-1/4 animate-pulse" style={{ animationDuration: '8s' }}></div>

      {/* Centered Login Card */}
      <div className="bg-white/70 backdrop-blur-2xl border border-black/10 shadow-[0_15px_50px_rgba(0,0,0,0.06)] transition-all duration-500 w-full max-w-[1000px] min-h-[600px] flex flex-col md:flex-row overflow-hidden rounded-[24px] z-10">
        
        {/* Left Side: Editorial Illustration Container */}
        <div className="hidden md:block w-1/2 relative bg-black border-r border-black/10">
          <img
            alt="Antigravity Express Editorial Illustration"
            className="w-full h-full object-cover grayscale opacity-45 mix-blend-luminosity filter brightness-75 contrast-125"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYFHaB398EMFNftmcwziG_9I6C_iICJoBngBS8L1uTvJ9P6bBU4wDQXQ-_gun9KzQO2h4RLO91TAo33uy-5LVmtuDHrVfwehSarVBwUM04WLcCNKVnL_sGwT5Tx4KsXEzaWfbjvnU_b6355KkxqUyrma3hVipyaNn6tCzyNnJl48DHmERPKBQh6Dn3ILvS5-slkgcNGqCSm3KT6jKo8GwGEP0onyLOA_qyV85SjKnv1SptSR-oeLfnN0VCjs8mpwnoBw_-VUNCJHVB"
          />
          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
          {/* Pulsing overlay branding mark */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-accent-purple/10 to-black/70">
            <div className="w-16 h-16 rounded-full border-2 border-accent-purple flex items-center justify-center mb-4 neon-pulse-purple">
              <div className="w-4 h-4 bg-accent-purple rounded-full animate-ping"></div>
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest text-white text-glow font-display">Zero Gravity</h2>
            <p className="text-[10px] uppercase text-white/50 tracking-widest font-extrabold mt-1">Autonomous Logistics Core</p>
          </div>
        </div>

        {/* Right Side: Login Form Canvas */}
        <div className="w-full md:w-1/2 flex flex-col justify-between p-8 md:p-12 lg:p-16 bg-white/80 backdrop-blur-xl overflow-y-auto min-h-[600px]">
          {/* Brand Anchor & Back Button */}
          <div className="flex justify-between items-center mb-6 md:mb-0">
            <Link 
              to="/" 
              className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-mute hover:text-black hover:text-glow transition-all duration-300"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-accent-purple" />
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
                       <stop offset="0%" stop-color="#5E0ED7" />
                       <stop offset="100%" stop-color="#30195C" />
                     </linearGradient>
                  </defs>
                </svg>
                <div className="flex items-center font-display">
                  <span className="font-medium text-[11px] tracking-[0.3px] text-[#30195C] uppercase">ANTIGRAVITY</span>
                  <span className="bg-[#30195C] text-white font-extrabold text-[9.5px] px-1 py-0.2 ml-0.8 rounded-[1px] tracking-[0.3px] uppercase">EXPRESS</span>
                </div>
              </div>
              <span className="text-[4.5px] font-bold text-[#30195C]/80 tracking-[1.5px] mt-0.5 uppercase font-sans">NHANH VÀ ĐÁNG TIN CẬY</span>
            </Link>
          </div>

          {/* Form Container */}
          <div className="w-full max-w-md mx-auto my-auto py-6 space-y-6">
            {/* Header */}
            <div className="space-y-1.5">
              <h1 className="text-3xl font-black tracking-tight text-black font-display text-glow-purple uppercase">ĐĂNG NHẬP</h1>
              <p className="text-mute text-xs font-bold uppercase tracking-wider">Vui lòng điền thông tin để kết nối cổng hệ thống.</p>
            </div>

            {/* Role Selection: Segmented Control */}
            <div aria-label="Role selection" className="bg-black/5 border border-black/10 p-[4px] rounded-full flex gap-[4px]" role="group">
              <button
                type="button"
                onClick={() => setSelectedRole('KHACHHANG')}
                className={`flex-1 py-[8.5px] px-[12px] rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  selectedRole === 'KHACHHANG'
                    ? 'bg-accent-purple text-white shadow-[0_4px_12px_rgba(94,14,215,0.25)]'
                    : 'text-mute hover:text-black hover:bg-black/5'
                }`}
              >
                Khách hàng
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('NHANVIEN')}
                className={`flex-1 py-[8.5px] px-[12px] rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  selectedRole === 'NHANVIEN'
                    ? 'bg-accent-purple text-white shadow-[0_4px_12px_rgba(94,14,215,0.25)]'
                    : 'text-mute hover:text-black hover:bg-black/5'
                }`}
              >
                Nhân viên
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('QUANTRI')}
                className={`flex-1 py-[8.5px] px-[12px] rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  selectedRole === 'QUANTRI'
                    ? 'bg-accent-purple text-white shadow-[0_4px_12px_rgba(94,14,215,0.25)]'
                    : 'text-mute hover:text-black hover:bg-black/5'
                }`}
              >
                Quản trị
              </button>
            </div>

            {/* Error Panel */}
            {error && (
              <div className="bg-red-500/10 text-red-700 text-xs p-3 border border-red-500/20 font-bold rounded-lg uppercase tracking-wide">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Input Group: Username / Email */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-mute uppercase tracking-widest" htmlFor="username">
                  Tên đăng nhập hoặc Email
                </label>
                <input
                  className="w-full input-neon py-3.5 placeholder-mute font-semibold"
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
                  <label className="block text-[10px] font-extrabold text-mute uppercase tracking-widest" htmlFor="password">
                    Mật khẩu
                  </label>
                  <a href="#" className="text-[10px] font-bold text-accent-purple hover:underline hover:text-[#7d2ae8] transition-colors uppercase tracking-wider">
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  <input
                    className="w-full input-neon py-3.5 placeholder-mute font-semibold pr-12"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-black transition-colors p-2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3.5 text-xs font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 mt-6 cursor-pointer"
              >
                {loading ? 'Đang xác minh cổng...' : 'Kết nối hệ thống'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Footer Link */}
            <div className="text-center pt-4 border-t border-black/5">
              <span className="text-xs text-mute font-semibold">Chưa có tài khoản? </span>
              <Link to="/register" className="text-xs font-black text-accent-purple hover:underline hover:text-[#7d2ae8] transition-colors uppercase tracking-wider">
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
