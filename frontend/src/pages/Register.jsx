import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

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

      {/* Right Side: Register Form Canvas */}
      <div className="w-full md:w-1/2 h-screen flex flex-col justify-center px-6 md:px-16 lg:px-24 relative bg-white overflow-y-auto py-12">
        {/* Brand Anchor (Top Left / Right) */}
        <div className="absolute top-6 left-6 md:left-auto md:right-16">
          <Link to="/" className="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
            ANTIGRAVITY EXPRESS
          </Link>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-[36px] font-bold tracking-tight leading-none text-black">Tạo tài khoản</h1>
            <p className="text-[#5e5e5e] text-base font-medium">Trở thành đối tác gửi hàng chuyên nghiệp của Antigravity.</p>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-[#ffdad6] text-[#ba1a1a] text-sm p-4 border border-[#ba1a1a]/10 font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 text-sm p-4 border border-green-200 font-medium">
              {success}
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Group: Fullname */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-black" htmlFor="fullname">
                Họ và tên
              </label>
              <input
                className="w-full bg-[#efefef] border-0 border-b-2 border-transparent px-4 py-3 text-base text-black placeholder-[#afafaf] rounded-none focus:outline-none focus:border-black transition-colors"
                id="fullname"
                type="text"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                required
              />
            </div>

            {/* Input Group: Username */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-black" htmlFor="username">
                Tên đăng nhập
              </label>
              <input
                className="w-full bg-[#efefef] border-0 border-b-2 border-transparent px-4 py-3 text-base text-black placeholder-[#afafaf] rounded-none focus:outline-none focus:border-black transition-colors"
                id="username"
                type="text"
                placeholder="Ví dụ: shop_sneaker"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* Input Group: Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-black" htmlFor="password">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  className="w-full bg-[#efefef] border-0 border-b-2 border-transparent px-4 py-3 text-base text-black placeholder-[#afafaf] rounded-none focus:outline-none focus:border-black transition-colors pr-12"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5e5e5e] hover:text-black transition-colors p-2"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Input Group: Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-black" htmlFor="confirmPassword">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  className="w-full bg-[#efefef] border-0 border-b-2 border-transparent px-4 py-3 text-base text-black placeholder-[#afafaf] rounded-none focus:outline-none focus:border-black transition-colors pr-12"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5e5e5e] hover:text-black transition-colors p-2"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white text-base font-bold py-4 rounded-full hover:bg-[#282828] transition-all active:scale-95 duration-150 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center pt-4 border-t border-[#efefef]">
            <span className="text-sm text-[#5e5e5e]">Đã có tài khoản? </span>
            <Link to="/login" className="text-sm font-bold text-black hover:underline underline-offset-4">
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
