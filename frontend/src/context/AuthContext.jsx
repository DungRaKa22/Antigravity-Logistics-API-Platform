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
    const branch_id = localStorage.getItem('branch_id');
    const warehouse_id = localStorage.getItem('warehouse_id');

    if (token && role && fullname) {
      setUser({ 
        token, 
        role, 
        fullname,
        branch_id: branch_id ? parseInt(branch_id, 10) : null,
        warehouse_id: warehouse_id ? parseInt(warehouse_id, 10) : null
      });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await AuthService.login(username, password);
      if (res.success && res.data) {
        const { token, role, fullname, branch_id, warehouse_id } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('fullname', fullname);
        if (branch_id !== undefined && branch_id !== null) {
          localStorage.setItem('branch_id', branch_id);
        } else {
          localStorage.removeItem('branch_id');
        }
        if (warehouse_id !== undefined && warehouse_id !== null) {
          localStorage.setItem('warehouse_id', warehouse_id);
        } else {
          localStorage.removeItem('warehouse_id');
        }
        setUser({ token, role, fullname, branch_id, warehouse_id });
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
    localStorage.removeItem('branch_id');
    localStorage.removeItem('warehouse_id');
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
