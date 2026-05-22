import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthService } from '../services/api';
import * as XLSX from 'xlsx';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  
  // Segmented Main Tab State: 'personnel' | 'shippers'
  const [activeView, setActiveView] = useState('personnel');
  
  // Salary Period State (Defaults to previous month)
  const today = new Date();
  const defaultMonth = today.getMonth() === 0 ? 12 : today.getMonth();
  const defaultYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedYear, setSelectedYear] = useState(defaultYear);

  // Range Export State
  const [exportStart, setExportStart] = useState(1);
  const [exportEnd, setExportEnd] = useState(100);
  
  // Form State (Left Column for creating staff)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [role, setRole] = useState('NHANVIEN');
  
  // Modals & Interaction State
  const [editingShipper, setEditingShipper] = useState(null); // shipper object
  const [tempLimit, setTempLimit] = useState(100);
  const [tempNotes, setTempNotes] = useState('');
  const [viewingHoldingOrders, setViewingHoldingOrders] = useState(null); // shipper object
  
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await AuthService.getUsers(roleFilter, selectedMonth, selectedYear);
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Không thể lấy danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [roleFilter, selectedMonth, selectedYear]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password || !fullname) {
      showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
      return;
    }

    try {
      const res = await AuthService.createStaff({ username, password, fullname, role });
      if (res.success) {
        showToast(res.message);
        setUsername('');
        setPassword('');
        setFullname('');
        setRole('NHANVIEN');
        fetchUsers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi tạo tài khoản.', 'error');
    }
  };

  // Update shipper notes & assignment daily limit
  const handleUpdateShipperConfig = async (e) => {
    e.preventDefault();
    if (!editingShipper) return;

    try {
      const res = await AuthService.updateShipperConfig(editingShipper.id, {
        daily_limit: tempLimit,
        notes: tempNotes
      });
      if (res.success) {
        showToast('Cập nhật cấu hình shipper thành công!');
        setEditingShipper(null);
        fetchUsers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi cập nhật cấu hình bưu tá.', 'error');
    }
  };

  // Client-side Excel (.xlsx) export complying with precise column instructions using SheetJS
  const handleExportExcel = () => {
    const shippers = users.filter(u => u.role === 'NHANVIEN');
    if (shippers.length === 0) {
      showToast('Không có dữ liệu shipper để xuất!', 'error');
      return;
    }

    const startIndex = Math.max(1, parseInt(exportStart) || 1) - 1;
    const endIndex = Math.min(shippers.length, parseInt(exportEnd) || 100);
    
    if (startIndex >= shippers.length || startIndex > endIndex) {
      showToast('Khoảng giới hạn xuất không hợp lệ!', 'error');
      return;
    }
    
    const targetedShippers = shippers.slice(startIndex, endIndex);

    // Get number of days in selected month/year
    const getDaysInMonth = (m, y) => new Date(y, m, 0).getDate();
    const numDays = getDaysInMonth(selectedMonth, selectedYear);
    
    // Exact column layout: Mã Shipper, Tên Shipper, Ngày 1 ... Ngày N, Đơn Thất Bại, Tổng Số, Tổng Lương
    const headers = [
      "Mã Shipper",
      "Tên Shipper",
      ...Array.from({ length: numDays }, (_, i) => `Ngày ${i + 1}`),
      "Đơn Thất Bại",
      "Tổng Số",
      "Tổng Lương"
    ];

    const rows = targetedShippers.map(s => {
      const dailyBreakdown = Array.from({ length: numDays }, (_, i) => {
        const dayStr = String(i + 1);
        return s.daily_success?.[dayStr] || 0;
      });

      return [
        s.id,
        s.fullname,
        ...dailyBreakdown,
        s.failed_orders_count || 0,
        s.success_orders_count || 0,
        s.success_orders_count * 3000
      ];
    });

    // Create a worksheet from headers and rows
    const data = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Dynamic column widths for neat Excel formatting
    const wscols = [
      { wch: 12 }, // Mã Shipper
      { wch: 22 }, // Tên Shipper
      ...Array.from({ length: numDays }, () => ({ wch: 8 })), // Ngày 1 -> Ngày 30/31
      { wch: 14 }, // Đơn Thất Bại
      { wch: 12 }, // Tổng Số
      { wch: 16 }  // Tổng Lương
    ];
    worksheet['!cols'] = wscols;

    // Build the workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Luong_Shipper_T${selectedMonth}`);

    // Generate filename and trigger download
    const filename = `Bao_Cao_Luong_Shipper_Thang_${String(selectedMonth).padStart(2, '0')}_${selectedYear}_Dong_${exportStart}_den_${exportEnd}.xlsx`;
    XLSX.writeFile(workbook, filename);

    showToast(`Xuất file Excel (.xlsx) thành công cho ${targetedShippers.length} Shipper!`);
  };

  // Compute stats aggregates inside current selected view
  const shippersList = users.filter(u => u.role === 'NHANVIEN');
  const totalHoldingOrders = shippersList.reduce((acc, curr) => acc + (curr.holding_orders_count || 0), 0);
  const totalSuccessOrders = shippersList.reduce((acc, curr) => acc + (curr.success_orders_count || 0), 0);
  const totalFailedOrders = shippersList.reduce((acc, curr) => acc + (curr.failed_orders_count || 0), 0);
  const totalPayout = totalSuccessOrders * 3000;

  return (
    <div className="bg-canvas min-h-screen text-black relative overflow-hidden font-sans">
      {/* Advanced Neon Aurora Background Blobs */}
      <div className="neon-aurora-blob bg-accent-purple/10 w-[600px] h-[600px] -top-20 -left-20 animate-pulse"></div>
      <div className="neon-aurora-blob bg-cyan-500/5 w-[500px] h-[500px] bottom-10 right-10 animate-pulse" style={{ animationDuration: '6s' }}></div>

      {/* Toast Alert */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 p-4 rounded-xl shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-xl border border-black/10 text-black shadow-[0_10px_35px_rgba(0,0,0,0.06)] animate-slide-in">
          <div className="w-8 h-8 rounded-full bg-accent-purple/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-accent-purple text-base">notifications</span>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-accent-purple">{toast.type === 'error' ? 'Thất bại' : 'Thành công'}</p>
            <p className="text-sm font-medium opacity-90">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Main Page Layout */}
      <main className="pt-32 pb-16 px-6 md:px-16 max-w-[1440px] mx-auto min-h-screen relative z-10">
        
        {/* Header Block */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-black/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-black font-display uppercase mb-1 text-glow-purple">Personnel Administration</h1>
            <p className="text-mute text-sm font-medium">Manage employees, view shipper payroll, monitor dynamic quotas, and audit performance metrics.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              to="/admin" 
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-accent-purple/30 rounded-full text-xs font-extrabold text-accent-purple bg-transparent hover:bg-[#6e19f1] hover:text-white shadow-[0_2px_8px_rgba(94,14,215,0.1)] hover:shadow-[0_4px_15px_rgba(94,14,215,0.25)] transition-all cursor-pointer font-bold"
            >
              <span className="material-symbols-outlined text-xs">arrow_back</span>
              <span>Back to Dispatch</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-600 p-4 mb-8 rounded-r-md shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="text-sm font-semibold text-rose-800">{error}</div>
          </div>
        )}

        {/* Segmented Main Navigation Tab Bar */}
        <div className="flex p-1 bg-black/[0.03] backdrop-blur-md rounded-xl max-w-lg mb-8 border border-black/10">
          <button
            onClick={() => {
              setActiveView('personnel');
              setRoleFilter('');
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeView === 'personnel'
                ? 'bg-accent-purple text-white shadow-[0_4px_12px_rgba(94,14,215,0.2)]'
                : 'text-mute hover:text-black bg-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-sm">badge</span>
            <span>Database Nhân Sự</span>
          </button>
          <button
            onClick={() => {
              setActiveView('shippers');
              setRoleFilter('NHANVIEN'); // Lock to NHANVIEN (shippers) when in Shipper view
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeView === 'shippers'
                ? 'bg-accent-purple text-white shadow-[0_4px_12px_rgba(94,14,215,0.2)]'
                : 'text-mute hover:text-black bg-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-sm">local_shipping</span>
            <span>Quản Lý & Lương Shipper</span>
          </button>
        </div>

        {/* Conditional Content rendering based on active tab state */}
        {activeView === 'personnel' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            
            {/* Left Column: Create Staff Form (4 columns) */}
            <div className="lg:col-span-4 bg-white/60 border border-black/10 p-6 rounded-2xl shadow-sm hover:border-accent-purple/40 hover:shadow-[0_10px_25px_rgba(94,14,215,0.08)] transition-all duration-300 h-fit">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-accent-purple text-glow-purple">person_add</span>
                <h2 className="text-lg font-extrabold text-black tracking-tight uppercase font-display text-glow-purple">Create Account</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-mute uppercase tracking-wider mb-2">Tên đăng nhập</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: shipper_hanoi01"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full input-neon text-xs font-semibold"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-mute uppercase tracking-wider mb-2">Mật khẩu</label>
                  <input
                    type="password"
                    placeholder="Mật khẩu truy cập"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full input-neon text-xs font-semibold"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-mute uppercase tracking-wider mb-2">Họ và tên</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    className="w-full input-neon text-xs font-semibold"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-mute uppercase tracking-wider mb-2">Vai trò nhân sự</label>
                  <div className="relative">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full input-neon text-xs font-semibold bg-white text-black focus:outline-none focus:border-accent-purple transition-all"
                    >
                      <option value="NHANVIEN" className="bg-white text-black">Nhân viên giao nhận (NHANVIEN)</option>
                      <option value="QUANTRI" className="bg-white text-black">Quản trị viên (QUANTRI)</option>
                    </select>
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full py-3 bg-accent-purple text-white text-xs font-extrabold rounded-full hover:bg-[#6e19f1] active:scale-95 shadow-[0_4px_12px_rgba(94,14,215,0.22)] hover:shadow-[0_6px_20px_rgba(94,14,215,0.38)] cursor-pointer transition-all mt-6 uppercase tracking-wider"
                >
                  Cấp tài khoản
                </button>
              </form>
            </div>

            {/* Right Column: User list (8 columns) */}
            <div className="lg:col-span-8 flex flex-col bg-transparent min-w-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-extrabold text-black tracking-tight uppercase font-display text-glow-purple">Personnel Database</h2>
                
                {/* Segmented Filter Control */}
                <div className="inline-flex p-1 bg-black/[0.03] backdrop-blur-md rounded-full border border-black/10">
                  <button
                    onClick={() => setRoleFilter('')}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                      roleFilter === '' ? 'bg-accent-purple text-white shadow-[0_2px_8px_rgba(94,14,215,0.18)]' : 'text-mute hover:text-black bg-transparent'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setRoleFilter('NHANVIEN')}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                      roleFilter === 'NHANVIEN' ? 'bg-accent-purple text-white shadow-[0_2px_8px_rgba(94,14,215,0.18)]' : 'text-mute hover:text-black bg-transparent'
                    }`}
                  >
                    Shipper / Driver
                  </button>
                  <button
                    onClick={() => setRoleFilter('QUANTRI')}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                      roleFilter === 'QUANTRI' ? 'bg-accent-purple text-white shadow-[0_2px_8px_rgba(94,14,215,0.18)]' : 'text-mute hover:text-black bg-transparent'
                    }`}
                  >
                    Administrator
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-24 border border-black/10 rounded-2xl shadow-sm bg-white/40 backdrop-blur-md">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-20 text-[#afafaf] bg-white/40 backdrop-blur-md border border-black/10 rounded-2xl shadow-sm">
                  <span className="material-symbols-outlined text-4xl mb-2 text-black/10">group_off</span>
                  <p className="text-sm font-medium text-mute">Không tìm thấy tài khoản nhân sự phù hợp.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-black/10 rounded-2xl shadow-sm bg-white/50 custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black/10 bg-black/[0.02]">
                        <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider">ID</th>
                        <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider">Họ Tên / Username</th>
                        <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider">Vai Trò</th>
                        <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider">Ngày Khởi Tạo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-black/[0.01] transition-colors">
                          <td className="px-6 py-5 whitespace-nowrap text-xs font-bold text-mute">
                            #{u.id}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm font-extrabold text-black">{u.fullname}</div>
                            <div className="text-xs text-mute font-medium mt-0.5">@{u.username}</div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            {u.role === 'QUANTRI' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-purple/10 text-accent-purple border border-accent-purple/20 shadow-[0_2px_8px_rgba(94,14,215,0.08)]">
                                Admin Node
                              </span>
                            ) : u.role === 'NHANVIEN' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-[0_2px_8px_rgba(99,102,241,0.08)]">
                                Courier Driver
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-black/5 text-black/60 border border-black/10">
                                {u.role}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-xs text-mute font-semibold">
                            {new Date(u.created_at).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* TAB 2: ADVANCED SHIPPER CENTER & PAYROLL ENGINE */
          <div className="space-y-8 animate-fade-in">
            
            {/* Aggregate KPI Metric Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/60 border border-black/10 p-5 rounded-2xl shadow-sm hover:border-[#6366f1]/40 hover:shadow-[0_8px_20px_rgba(99,102,241,0.05)] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-mute uppercase tracking-widest">Shipper Trực Chiến</p>
                    <p className="text-2xl font-black text-black mt-2 font-display">{shippersList.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                    <span className="material-symbols-outlined text-indigo-600 text-lg">local_shipping</span>
                  </div>
                </div>
                <p className="text-[10px] text-mute font-medium mt-3">Nhân sự bưu tá hoạt động</p>
              </div>

              <div className="bg-white/60 border border-black/10 p-5 rounded-2xl shadow-sm hover:border-accent-purple/40 hover:shadow-[0_8px_20px_rgba(94,14,215,0.05)] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-mute uppercase tracking-widest">Tổng Đơn Đang Ôm</p>
                    <p className="text-2xl font-black text-accent-purple mt-2 font-display">{totalHoldingOrders}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100 animate-pulse">
                    <span className="material-symbols-outlined text-accent-purple text-lg">inventory_2</span>
                  </div>
                </div>
                <p className="text-[10px] text-mute font-medium mt-3">Đơn hàng đang trung chuyển</p>
              </div>

              <div className="bg-white/60 border border-black/10 p-5 rounded-2xl shadow-sm hover:border-emerald-500/40 hover:shadow-[0_8px_20px_rgba(16,185,129,0.05)] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-mute uppercase tracking-widest">Đã Giao / Thất Bại</p>
                    <p className="text-xl font-black text-emerald-600 mt-2.5 font-display flex items-center gap-1.5">
                      {totalSuccessOrders} <span className="text-xs font-medium text-mute">/</span> <span className="text-rose-500">{totalFailedOrders}</span>
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <span className="material-symbols-outlined text-emerald-600 text-lg">analytics</span>
                  </div>
                </div>
                <p className="text-[10px] text-mute font-medium mt-3">Thống kê kỳ: {selectedMonth}/{selectedYear}</p>
              </div>

              {/* Glowing Neon Payout Indicator Card */}
              <div className="bg-white/70 border border-amber-300 p-5 rounded-2xl shadow-md hover:border-amber-400 hover:shadow-[0_10px_25px_rgba(245,158,11,0.12)] transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl -mr-4 -mt-4"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Tổng Quỹ Lương Shipper</p>
                    <p className="text-2xl font-black text-amber-600 mt-2 font-display">{totalPayout.toLocaleString('vi-VN')}đ</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200">
                    <span className="material-symbols-outlined text-amber-600 text-lg">payments</span>
                  </div>
                </div>
                <p className="text-[10px] text-amber-700 font-bold mt-3 relative z-10">Đơn giá: 3.000đ / đơn hoàn thành</p>
              </div>
            </div>

            {/* Custom Control and Filtering Toolbar */}
            <div className="bg-white/50 border border-black/10 p-5 rounded-2xl flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shadow-sm">
              
              {/* Left Side: Real-time Period Filter */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-mute uppercase mb-1">Chọn Kỳ Lương (Tháng)</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="input-neon text-xs font-extrabold bg-white pr-8 py-2 border border-black/10 rounded-xl focus:border-accent-purple"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-mute uppercase mb-1">Năm</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="input-neon text-xs font-extrabold bg-white pr-8 py-2 border border-black/10 rounded-xl focus:border-accent-purple"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>

                <div className="h-8 w-[1px] bg-black/10 self-end mb-1 hidden sm:block"></div>
                
                <span className="text-xs text-mute font-medium self-end mb-2.5 italic">
                  * Hệ thống mặc định tải dữ liệu **tháng trước** ({selectedMonth}/{selectedYear}) theo thời gian thực.
                </span>
              </div>

              {/* Right Side: Range Segment Export & Trigger Button */}
              <div className="flex flex-wrap items-end gap-3 w-full xl:w-auto xl:justify-end">
                <div className="flex flex-col w-[80px]">
                  <span className="text-[9px] font-bold text-mute uppercase mb-1">Từ dòng</span>
                  <input
                    type="number"
                    min="1"
                    value={exportStart}
                    onChange={(e) => setExportStart(Math.max(1, parseInt(e.target.value) || 1))}
                    className="input-neon text-xs font-extrabold text-center py-2"
                  />
                </div>

                <div className="flex flex-col w-[80px]">
                  <span className="text-[9px] font-bold text-mute uppercase mb-1">Đến dòng</span>
                  <input
                    type="number"
                    min="1"
                    value={exportEnd}
                    onChange={(e) => setExportEnd(Math.max(1, parseInt(e.target.value) || 1))}
                    className="input-neon text-xs font-extrabold text-center py-2"
                  />
                </div>

                <button
                  onClick={handleExportExcel}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 hover:shadow-[0_4px_12px_rgba(16,185,129,0.22)] active:scale-95 cursor-pointer transition-all flex items-center gap-2 h-[38px]"
                >
                  <span className="material-symbols-outlined text-sm">file_download</span>
                  <span>Xuất Excel Báo Cáo</span>
                </button>
              </div>
            </div>

            {/* Shipper Center detail grid table */}
            {loading ? (
              <div className="flex justify-center items-center py-24 border border-black/10 rounded-2xl shadow-sm bg-white/40 backdrop-blur-md">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
              </div>
            ) : shippersList.length === 0 ? (
              <div className="text-center py-20 text-[#afafaf] bg-white/40 backdrop-blur-md border border-black/10 rounded-2xl shadow-sm">
                <span className="material-symbols-outlined text-4xl mb-2 text-black/10">local_shipping</span>
                <p className="text-sm font-medium text-mute">Không tìm thấy tài khoản bưu tá shipper nào.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-black/10 rounded-2xl shadow-sm bg-white/50 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/10 bg-black/[0.02]">
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider">Shipper</th>
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-center">Đơn Đang Ôm</th>
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-center">Thành Công</th>
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-center">Giao Thất Bại</th>
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-center">Hạn Mức Ngày</th>
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-right">Lương Tạm Tính</th>
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider">Ghi Chú Nhân Sự</th>
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-center">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {shippersList.map((s) => (
                      <tr key={s.id} className="hover:bg-black/[0.01] transition-colors">
                        <td className="px-6 py-5 whitespace-nowrap text-xs font-bold text-mute">
                          #{s.id}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-accent-purple/10 flex items-center justify-center border border-accent-purple/20 text-accent-purple text-xs font-black shadow-[0_2px_8px_rgba(94,14,215,0.06)]">
                              {s.fullname ? s.fullname.split(' ').pop().substring(0, 2).toUpperCase() : 'SP'}
                            </div>
                            <div>
                              <div className="text-sm font-extrabold text-black">{s.fullname}</div>
                              <div className="text-xs text-mute font-medium mt-0.5">@{s.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          {s.holding_orders_count > 0 ? (
                            <button
                              onClick={() => setViewingHoldingOrders(s)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-accent-purple/10 text-accent-purple border border-accent-purple/20 cursor-pointer shadow-sm hover:bg-[#6e19f1] hover:text-white hover:border-[#6e19f1] active:scale-95 transition-all animate-pulse"
                            >
                              <span className="material-symbols-outlined text-xs">inventory_2</span>
                              <span>{s.holding_orders_count} đơn đang ôm</span>
                            </button>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-black/5 text-mute">
                              Trống xe
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center text-sm font-black text-emerald-600">
                          {s.success_orders_count || 0} đơn
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center text-sm font-black text-rose-500">
                          {s.failed_orders_count || 0} đơn
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center text-xs font-black text-black/80">
                          {s.daily_limit || 100} đơn/ngày
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-extrabold text-amber-600 font-display">
                          {((s.success_orders_count || 0) * 3000).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-6 py-5 text-xs text-mute font-semibold max-w-[200px] truncate italic">
                          {s.notes || <span className="opacity-40 font-normal">Chưa có ghi chú nhân sự...</span>}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          <button
                            onClick={() => {
                              setEditingShipper(s);
                              setTempLimit(s.daily_limit || 100);
                              setTempNotes(s.notes || '');
                            }}
                            className="w-8 h-8 rounded-full border border-black/10 hover:border-accent-purple/40 hover:text-accent-purple flex items-center justify-center cursor-pointer transition-all hover:bg-accent-purple/5"
                            title="Cấu hình shipper"
                          >
                            <span className="material-symbols-outlined text-sm">settings</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

      </main>

      {/* MODAL 1: VIEW DETAILS OF ACTIVE ORDERS CURRENTLY HELD BY SHIPPER */}
      {viewingHoldingOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setViewingHoldingOrders(null)}></div>
          <div className="bg-white/95 border border-black/10 w-full max-w-3xl rounded-3xl shadow-2xl relative z-10 overflow-hidden backdrop-blur-xl animate-scale-in">
            <div className="px-6 py-5 border-b border-black/10 flex items-center justify-between bg-black/[0.01]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-purple">inventory_2</span>
                <h3 className="text-md font-extrabold uppercase tracking-tight text-black">
                  Đơn Hàng Đang Ôm - {viewingHoldingOrders.fullname}
                </h3>
              </div>
              <button 
                onClick={() => setViewingHoldingOrders(null)}
                className="w-8 h-8 rounded-full border border-black/10 hover:bg-black/5 active:scale-90 flex items-center justify-center cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[450px] custom-scrollbar">
              {viewingHoldingOrders.holding_orders && viewingHoldingOrders.holding_orders.length === 0 ? (
                <div className="text-center py-10 text-mute">
                  Không tìm thấy đơn hàng đang ôm nào.
                </div>
              ) : (
                <div className="space-y-4">
                  {viewingHoldingOrders.holding_orders.map((o) => (
                    <div 
                      key={o.order_id} 
                      className="p-4 bg-white border border-black/5 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.01)] hover:border-accent-purple/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-black">Mã đơn: {o.order_id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-accent-purple/10 text-accent-purple border border-accent-purple/20">
                            {o.status}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-black/70">
                          Người nhận: {o.receiver_name}
                        </p>
                        <p className="text-[10px] text-mute font-medium">
                          Địa chỉ: {o.receiver_address}
                        </p>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-black/5">
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-mute uppercase">Tiền thu hộ COD</p>
                          <p className="text-xs font-extrabold text-black font-display">{(o.cod || 0).toLocaleString('vi-VN')}đ</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-mute uppercase">Phí vận chuyển</p>
                          <p className="text-xs font-bold text-mute">{(o.fee || 0).toLocaleString('vi-VN')}đ</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-black/[0.02] border-t border-black/10 flex justify-end">
              <button
                onClick={() => setViewingHoldingOrders(null)}
                className="px-5 py-2 border border-black/15 text-black hover:bg-black/5 active:scale-95 cursor-pointer rounded-full text-xs font-bold transition-all"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SHIPPER CONFIGURATION (LIMIT ADJUSTMENT & NOTE DIALOG) */}
      {editingShipper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setEditingShipper(null)}></div>
          <div className="bg-white/95 border border-black/10 w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden backdrop-blur-xl animate-scale-in">
            <div className="px-6 py-5 border-b border-black/10 flex items-center justify-between bg-black/[0.01]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-purple text-glow-purple">settings</span>
                <h3 className="text-md font-extrabold uppercase tracking-tight text-black">
                  Cấu hình bưu tá - {editingShipper.fullname}
                </h3>
              </div>
              <button 
                onClick={() => setEditingShipper(null)}
                className="w-8 h-8 rounded-full border border-black/10 hover:bg-black/5 active:scale-90 flex items-center justify-center cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdateShipperConfig}>
              <div className="p-6 space-y-6">
                
                {/* Daily Order Assign Stepper Block */}
                <div>
                  <label className="block text-[10px] font-black text-mute uppercase tracking-widest text-center mb-2">
                    Hạn Mức Ôm Đơn Trong Ngày (Daily Limit)
                  </label>
                  <p className="text-[10px] text-mute text-center font-medium italic mb-4">
                    Số lượng đơn tối đa shipper này được phép nhận trong 1 ngày.
                  </p>
                  
                  {/* Dynamic plus/minus steppers */}
                  <div className="flex items-center gap-3 justify-center my-4">
                    <button
                      type="button"
                      onClick={() => setTempLimit(Math.max(0, tempLimit - 5))}
                      className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center text-lg font-bold hover:bg-black/5 active:scale-95 cursor-pointer select-none text-black"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={tempLimit}
                      onChange={(e) => setTempLimit(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-24 text-center input-neon font-black text-base py-2"
                    />
                    <button
                      type="button"
                      onClick={() => setTempLimit(tempLimit + 5)}
                      className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center text-lg font-bold hover:bg-black/5 active:scale-95 cursor-pointer select-none text-black"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Notes Textbox Area */}
                <div>
                  <label className="block text-[10px] font-black text-mute uppercase tracking-widest mb-2">
                    Ghi Chú Nhân Sự (Staff Notes)
                  </label>
                  <textarea
                    rows="3"
                    value={tempNotes}
                    onChange={(e) => setTempNotes(e.target.value)}
                    placeholder="Ví dụ: Chuyên tuyến Cầu Giấy, Hỗ trợ tăng ca tối, v.v."
                    className="w-full input-neon text-xs font-semibold py-2.5 px-3.5 focus:outline-none focus:border-accent-purple"
                  ></textarea>
                </div>

              </div>

              <div className="px-6 py-4 bg-black/[0.02] border-t border-black/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingShipper(null)}
                  className="px-5 py-2 border border-black/15 text-black hover:bg-black/5 active:scale-95 cursor-pointer rounded-full text-xs font-bold transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent-purple hover:bg-[#6e19f1] text-white active:scale-95 cursor-pointer rounded-full text-xs font-extrabold uppercase tracking-wide transition-all shadow-[0_4px_12px_rgba(94,14,215,0.18)]"
                >
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
