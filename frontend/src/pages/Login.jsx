import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

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
        // Đưa ra thông báo cảnh báo nhưng vẫn cho phép đăng nhập nếu hợp lệ
        // Hoặc kiểm tra điều hướng chính xác
        console.warn(`Đăng nhập thành công nhưng vai trò thực tế là ${actualRole} (không trùng khớp với lựa chọn ${selectedRole}).`);
      }

      // Điều hướng tương ứng
      if (actualRole === 'KHACHHANG') {
        navigate(from, { replace: true });
      } else {
        // Mặc định về trang chủ hoặc thông báo nếu không có quyền merchant
        navigate('/', { replace: true });
      }
    } else {
      setError(res.message || 'Tài khoản hoặc mật khẩu không chính xác.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white text-black overflow-hidden">
      {/* Left Side: Editorial Illustration Container */}
      <div className="hidden md:block w-1/2 h-screen relative bg-[#efefef] border-r border-[#4b4b4b]/20">
        <img
          alt="Antigravity Express Editorial Illustration"
          className="w-full h-full object-cover grayscale opacity-90 mix-blend-multiply"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYFHaB398EMFNftmcwziG_9I6C_iICJoBngBS8L1uTvJ9P6bBU4wDQXQ-_gun9KzQO2h4RLO91TAo33uy-5LVmtuDHrVfwehSarVBwUM04WLcCNKVnL_sGwT5Tx4KsXEzaWfbjvnU_b6355KkxqUyrma3hVipyaNn6tCzyNnJl48DHmERPKBQh6Dn3ILvS5-slkgcNGqCSm3KT6jKo8GwGEP0onyLOA_qyV85SjKnv1SptSR-oeLfnN0VCjs8mpwnoBw_-VUNCJHVB"
        />
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent"></div>
      </div>

      {/* Right Side: Login Form Canvas */}
      <div className="w-full md:w-1/2 h-screen flex flex-col justify-center px-6 md:px-16 lg:px-24 relative bg-white">
        {/* Brand Anchor (Top Left / Right) */}
        <div className="absolute top-6 left-6 md:left-auto md:right-16">
          <Link to="/" className="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
            ANTIGRAVITY EXPRESS
          </Link>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-md mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-[36px] font-bold tracking-tight leading-none text-black">Chào mừng trở lại</h1>
            <p className="text-[#5e5e5e] text-base font-medium">Vui lòng đăng nhập để tiếp tục.</p>
          </div>

          {/* Role Selection: Segmented Control */}
          <div aria-label="Role selection" className="bg-[#efefef] p-[6px] rounded-full flex gap-[4px]" role="group">
            <button
              type="button"
              onClick={() => setSelectedRole('KHACHHANG')}
              className={`flex-1 py-[8px] px-[12px] rounded-full text-sm font-semibold transition-all duration-200 ${
                selectedRole === 'KHACHHANG'
                  ? 'bg-black text-white'
                  : 'text-[#5e5e5e] hover:text-black hover:bg-[#e2e2e2]'
              }`}
            >
              Khách hàng
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('NHANVIEN')}
              className={`flex-1 py-[8px] px-[12px] rounded-full text-sm font-semibold transition-all duration-200 ${
                selectedRole === 'NHANVIEN'
                  ? 'bg-black text-white'
                  : 'text-[#5e5e5e] hover:text-black hover:bg-[#e2e2e2]'
              }`}
            >
              Nhân viên
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('QUANTRI')}
              className={`flex-1 py-[8px] px-[12px] rounded-full text-sm font-semibold transition-all duration-200 ${
                selectedRole === 'QUANTRI'
                  ? 'bg-black text-white'
                  : 'text-[#5e5e5e] hover:text-black hover:bg-[#e2e2e2]'
              }`}
            >
              Quản trị
            </button>
          </div>

          {/* Error Panel */}
          {error && (
            <div className="bg-[#ffdad6] text-[#ba1a1a] text-sm p-4 border border-[#ba1a1a]/10 font-medium">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Group: Username / Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-black" htmlFor="username">
                Tên đăng nhập hoặc Email
              </label>
              <input
                className="w-full bg-[#efefef] border-0 border-b-2 border-transparent px-4 py-4 text-base text-black placeholder-[#afafaf] rounded-none focus:outline-none focus:border-black transition-colors"
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
                <label className="block text-sm font-bold text-black" htmlFor="password">
                  Mật khẩu
                </label>
                <a href="#" className="text-xs font-bold text-black hover:underline underline-offset-4">
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative">
                <input
                  className="w-full bg-[#efefef] border-0 border-b-2 border-transparent px-4 py-4 text-base text-black placeholder-[#afafaf] rounded-none focus:outline-none focus:border-black transition-colors pr-12"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5e5e5e] hover:text-black transition-colors p-2"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white text-base font-bold py-4 rounded-full hover:bg-[#282828] transition-all active:scale-95 duration-150 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center pt-4 border-t border-[#efefef]">
            <span className="text-sm text-[#5e5e5e]">Chưa có tài khoản? </span>
            <Link to="/register" className="text-sm font-bold text-black hover:underline underline-offset-4">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
