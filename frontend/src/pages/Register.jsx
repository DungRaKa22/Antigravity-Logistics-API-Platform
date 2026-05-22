import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password || !fullname) {
      setError('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    const res = await register(username, password, fullname);
    setLoading(false);

    if (res.success) {
      setSuccess('Đăng ký tài khoản thành công! Đang chuyển hướng về trang đăng nhập...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(res.message || 'Tên đăng nhập đã tồn tại hoặc đăng ký thất bại.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-canvas relative overflow-hidden text-black">
      {/* Background neon mesh glow */}
      <div className="neon-aurora-blob bg-accent-purple/5 w-[600px] h-[600px] top-1/4 left-1/4 animate-pulse"></div>
      <div className="neon-aurora-blob bg-cyan-500/5 w-[500px] h-[500px] bottom-1/4 right-1/4 animate-pulse" style={{ animationDuration: '8s' }}></div>

      {/* Centered Register Card */}
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

        {/* Right Side: Register Form Canvas */}
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
                  <path d="M16 3L4 25C4 25 9 22 16 22C23 22 28 25 28 25L16 3Z" fill="url(#regLogoGrad)" />
                  <path d="M16 10L10 20H22L16 10Z" fill="white" />
                  <circle cx="16" cy="15" r="2.5" fill="#30195C" />
                  <defs>
                     <linearGradient id="regLogoGrad" x1="4" y1="3" x2="28" y2="25" gradientUnits="userSpaceOnUse">
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
              <h1 className="text-3xl font-black tracking-tight text-black font-display text-glow-purple uppercase">TẠO TÀI KHOẢN</h1>
              <p className="text-mute text-xs font-bold uppercase tracking-wider">Trở thành đối tác gửi hàng chuyên nghiệp của Antigravity.</p>
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-500/10 text-red-700 text-xs p-3 border border-red-500/20 font-bold rounded-lg uppercase tracking-wide">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 text-green-700 text-xs p-3 border border-green-500/20 font-bold rounded-lg uppercase tracking-wide">
                {success}
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Input Group: Fullname */}
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-mute uppercase tracking-widest" htmlFor="fullname">
                  Họ và tên
                </label>
                <input
                  className="w-full input-neon py-3 placeholder-mute font-semibold"
                  id="fullname"
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  required
                />
              </div>

              {/* Input Group: Username */}
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-mute uppercase tracking-widest" htmlFor="username">
                  Tên đăng nhập
                </label>
                <input
                  className="w-full input-neon py-3 placeholder-mute font-semibold"
                  id="username"
                  type="text"
                  placeholder="Ví dụ: shop_sneaker"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              {/* Input Group: Password */}
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-mute uppercase tracking-widest" htmlFor="password">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    className="w-full input-neon py-3 placeholder-mute font-semibold pr-12"
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu"
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

              {/* Input Group: Confirm Password */}
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-mute uppercase tracking-widest" htmlFor="confirmPassword">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input
                    className="w-full input-neon py-3 placeholder-mute font-semibold pr-12"
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-black transition-colors p-2"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3.5 text-xs font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 mt-6 cursor-pointer"
              >
                {loading ? 'Đang khởi tạo cổng...' : 'Đăng ký tài khoản'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Footer Link */}
            <div className="text-center pt-4 border-t border-black/5">
              <span className="text-xs text-mute font-semibold">Đã có tài khoản? </span>
              <Link to="/login" className="text-xs font-black text-accent-purple hover:underline hover:text-[#7d2ae8] transition-colors uppercase tracking-wider">
                Đăng nhập ngay
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
