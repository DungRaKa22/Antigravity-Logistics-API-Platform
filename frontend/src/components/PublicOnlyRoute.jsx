import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PublicOnlyRoute({ children }) {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated()) {
    if (['ADMIN', 'QUANTRI', 'HR', 'KETOAN', 'CSKH'].includes(user.role)) {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'SUPER_ADMIN') {
      return <Navigate to="/super-admin" replace />;
    } else if (['SHIPPER', 'KHO', 'NHANVIEN'].includes(user.role)) {
      return <Navigate to="/staff" replace />;
    } else {
      return <Navigate to="/merchant" replace />;
    }
  }

  return children;
}
