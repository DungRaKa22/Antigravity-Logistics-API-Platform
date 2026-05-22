import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PublicOnlyRoute({ children }) {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated()) {
    if (user.role === 'QUANTRI') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'NHANVIEN') {
      return <Navigate to="/staff" replace />;
    } else {
      return <Navigate to="/merchant" replace />;
    }
  }

  return children;
}
