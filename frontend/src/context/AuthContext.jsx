import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Khởi tạo kiểm tra xem có token sẵn trong localStorage chưa
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const fullname = localStorage.getItem('fullname');

    if (token && role && fullname) {
      setUser({ token, role, fullname });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await AuthService.login(username, password);
      if (res.success && res.data) {
        const { token, role, fullname } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('fullname', fullname);
        setUser({ token, role, fullname });
        return { success: true };
      }
      return { success: false, message: res.message || 'Lỗi không xác định' };
    } catch (err) {
      console.error(err);
      return {
        success: false,
        message: err.response?.data?.message || 'Tài khoản hoặc mật khẩu không chính xác.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('fullname');
    setUser(null);
  };

  const register = async (username, password, fullname) => {
    try {
      const res = await AuthService.register(username, password, fullname);
      return res;
    } catch (err) {
      console.error(err);
      return {
        success: false,
        message: err.response?.data?.message || 'Đăng ký tài khoản thất bại.'
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: () => !!user,
    isMerchant: () => user?.role === 'KHACHHANG',
    isAdmin: () => user?.role === 'QUANTRI',
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
