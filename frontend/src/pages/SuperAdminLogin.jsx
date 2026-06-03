import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { SuperAdminService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng điền đầy đủ thông tin đăng nhập.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await SuperAdminService.login(username, password);
      setLoading(false);

      if (res.success && res.data) {
        const { token, role, fullname } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('fullname', fullname);
        
        // Force full page reload to `/super-admin` to completely re-init AuthContext
        window.location.href = '/super-admin';
      } else {
        setError(res.message || 'Tài khoản hoặc mật khẩu không chính xác.');
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
      setError(err.response?.data?.message || 'Không thể kết nối đến máy chủ bảo mật.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#0b0c0e] relative overflow-hidden text-white font-sans">
      {/* Cyberpunk dot grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(94,14,215,0.06)_1.5px,transparent_1.5px)] bg-[size:24px_24px] pointer-events-none z-0" />
      
      {/* Outer Neon Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-accent-purple/10 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse"></div>

      {/* Centered Login Card */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(94,14,215,0.15)] w-full max-w-[1000px] min-h-[600px] flex flex-col md:flex-row overflow-hidden rounded-[24px] z-10 relative">
        
        {/* Left Side: Monolithic Secure Graphic */}
        <div className="hidden md:flex w-1/2 relative bg-gradient-to-br from-[#100d16] to-[#0b0c0e] flex-col justify-between p-12 border-r border-white/5 overflow-hidden">
          {/* Futuristic technical lines */}
          <div className="absolute inset-0 opacity-[0.15] pointer-events-none z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-[#5E0ED7] animate-spin" style={{ animationDuration: '30s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full border border-dashed border-[#5E0ED7] animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
          </div>
          
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none z-0" />

          {/* Central Security Shield */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
            <div className="w-24 h-24 rounded-full border border-[#5E0ED7]/50 flex items-center justify-center mb-6 relative shadow-[0_0_30px_rgba(94,14,215,0.3)] bg-black/60">
              <div className="w-12 h-12 rounded-full bg-[#5E0ED7]/20 absolute animate-ping"></div>
              <ShieldAlert className="w-12 h-12 text-[#5E0ED7]" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-[0.2em] text-white text-glow font-display text-center">Super Admin</h2>
            <p className="text-[9px] uppercase text-[#d0bcff] tracking-[0.2em] mt-3 bg-[#5E0ED7]/20 px-4 py-1.5 rounded-full border border-[#5E0ED7]/30 font-extrabold shadow-[0_0_15px_rgba(94,14,215,0.2)]">
              Core Operations Controller
            </p>
          </div>

          <div className="mt-auto relative z-20 text-center w-full">
            <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.25em] font-mono">Quantum Transmission Secure</span>
          </div>
        </div>

        {/* Right Side: Secure Login Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-between p-8 md:p-12 lg:p-16 bg-transparent overflow-y-auto min-h-[600px] relative z-10">
          {/* Back button and corporate brand */}
          <div className="flex justify-between items-center mb-6 md:mb-0">
            <Link 
              to="/" 
              className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all duration-300"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#d0bcff]" />
              <span>Quay lại</span>
            </Link>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center font-display">
                <span className="font-extrabold text-[11px] tracking-[0.3px] text-white uppercase">ANTIGRAVITY</span>
                <span className="bg-[#5e0ed7] text-white font-extrabold text-[9.5px] px-1 py-0.2 ml-0.8 rounded-[1px] tracking-[0.3px] uppercase shadow-[0_0_10px_rgba(94,14,215,0.4)]">CORE</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="w-full max-w-md mx-auto my-auto py-6 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-white font-display uppercase tracking-widest">
                ĐĂNG NHẬP <span className="text-[#d0bcff] text-glow">ADMIN</span>
              </h1>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em]">Cổng xác thực tối cao dành riêng cho Super Admin.</p>
            </div>

            {error && (
              <div className="bg-rose-500/10 text-rose-300 text-xs p-4 border border-rose-500/20 font-bold rounded-lg uppercase tracking-wider">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Input */}
              <div className="space-y-2">
                <label className="block text-[9px] font-extrabold text-white/40 uppercase tracking-[0.2em]" htmlFor="username">
                  Tên Đăng Nhập Bảo Mật
                </label>
                <input
                  className="w-full bg-[#100d16] border border-white/10 text-white placeholder-white/20 rounded-lg px-4 py-3.5 focus:outline-none focus:border-[#5E0ED7] focus:ring-1 focus:ring-[#5E0ED7]/25 transition-all duration-300 font-semibold focus:shadow-[0_0_15px_rgba(94,14,215,0.2)]"
                  id="username"
                  type="text"
                  placeholder="Nhập tên đăng nhập Super Admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-[9px] font-extrabold text-white/40 uppercase tracking-[0.2em]" htmlFor="password">
                  Mật Khẩu Tối Mật
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-[#100d16] border border-white/10 text-white placeholder-white/20 rounded-lg px-4 py-3.5 focus:outline-none focus:border-[#5E0ED7] focus:ring-1 focus:ring-[#5E0ED7]/25 transition-all duration-300 font-semibold focus:shadow-[0_0_15px_rgba(94,14,215,0.2)] pr-12"
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu Super Admin"
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

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5E0ED7] hover:bg-[#6f30e8] text-white text-xs font-black uppercase tracking-[0.2em] rounded-full py-4 flex items-center justify-center gap-2 mt-8 cursor-pointer transition-all duration-300 shadow-[0_0_20px_rgba(94,14,215,0.4)] hover:shadow-[0_0_30px_rgba(94,14,215,0.6)] active:scale-98"
              >
                {loading ? 'ĐANG KẾT NỐI AN NINH...' : 'XÁC THỰC QUYỀN TỐI CAO'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>

          <div className="h-2"></div>
        </div>
      </div>
    </div>
  );
}
