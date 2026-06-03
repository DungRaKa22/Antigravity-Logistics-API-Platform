import React from 'react';
import { useAuth } from '../context/AuthContext';
import ShipperDashboard from './ShipperDashboard';
import WarehouseDashboard from './WarehouseDashboard';

export default function StaffDashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d061c] flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  const role = user?.role;

  if (role === 'KHO') {
    return <WarehouseDashboard />;
  }

  // Mặc định trả về Shipper Rider Dashboard
  return <ShipperDashboard />;
}
