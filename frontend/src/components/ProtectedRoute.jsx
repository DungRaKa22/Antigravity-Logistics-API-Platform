import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated()) {
    // Chuyển về trang đăng nhập và lưu vị trí hiện tại của user để quay lại sau
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Nếu có phân quyền chi tiết mà role hiện tại không phù hợp
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-canvas">
        <h1 className="text-[40px] font-bold text-ink tracking-tight mb-4">403 Forbidden</h1>
        <p className="text-secondary mb-8 max-w-md">
          Bạn không có quyền truy cập vào phân hệ này. Vui lòng liên hệ quản trị viên hoặc đổi tài khoản thích hợp.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return children;
}
