import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SuperAdminRoute({ children }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  if (user.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-[#0b0c0e]">
        <h1 className="text-[40px] font-bold text-white tracking-tight mb-4">403 Forbidden</h1>
        <p className="text-white/60 mb-8 max-w-md">
          Bạn không có quyền truy cập vào phân hệ Quản Trị Tối Cao. Vui lòng liên hệ ban quản trị.
        </p>
        <Navigate to="/admin-login" replace />
      </div>
    );
  }

  return children;
}
