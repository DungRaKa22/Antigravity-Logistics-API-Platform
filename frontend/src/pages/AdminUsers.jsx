import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

const CORE_BRANCHES = [
  { id: 1, name: 'Hub Hà Nội' },
  { id: 2, name: 'Hub Quảng Ngãi' },
  { id: 3, name: 'Hub Cần Thơ' },
  { id: 4, name: 'Hub Sài Gòn' }
];

const CORE_WAREHOUSES = [
  { id: 1, name: 'Kho Miền Bắc (Bắc Ninh)' },
  { id: 2, name: 'Kho Miền Trung (Quảng Ngãi)' },
  { id: 3, name: 'Kho Miền Nam (Bình Dương)' }
];

export default function AdminUsers() {
  const { user } = useAuth();
  const isWarehouse = !!user?.warehouse_id;

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
  const [editingShipper, setEditingShipper] = useState(null); // staff object being edited
  const [tempLimit, setTempLimit] = useState(100);
  const [tempNotes, setTempNotes] = useState('');
  const [tempBranchId, setTempBranchId] = useState('');
  const [tempWarehouseId, setTempWarehouseId] = useState('');
  const [tempBasicSalary, setTempBasicSalary] = useState(0);
  const [tempRole, setTempRole] = useState('NHANVIEN');

  const [viewingHoldingOrders, setViewingHoldingOrders] = useState(null); // shipper object
  const [viewingAttendanceUser, setViewingAttendanceUser] = useState(null); // staff object for attendance view
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  
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

  useEffect(() => {
    if (isWarehouse) {
      setRole('KHO');
    }
  }, [isWarehouse]);

  // Fetch attendance when viewingAttendanceUser is set
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!viewingAttendanceUser) return;
      try {
        setAttendanceLoading(true);
        const res = await AuthService.getAttendance(viewingAttendanceUser.id);
        if (res.success) {
          setAttendanceLogs(res.data);
        }
      } catch (err) {
        console.error(err);
        showToast('Không thể tải lịch sử chấm công.', 'error');
      } finally {
        setAttendanceLoading(false);
      }
    };
    fetchAttendance();
  }, [viewingAttendanceUser]);

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

  // Update staff notes, assignments, salary & role
  const handleUpdateShipperConfig = async (e) => {
    e.preventDefault();
    if (!editingShipper) return;

    try {
      const res = await AuthService.updateShipperConfig(editingShipper.id, {
        daily_limit: tempLimit,
        notes: tempNotes,
        branch_id: tempBranchId ? Number(tempBranchId) : null,
        warehouse_id: tempWarehouseId ? Number(tempWarehouseId) : null,
        basic_salary: Number(tempBasicSalary) || 0,
        role: tempRole
      });
      if (res.success) {
        showToast('Cập nhật cấu hình nhân sự thành công!');
        setEditingShipper(null);
        fetchUsers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi cập nhật cấu hình nhân sự.', 'error');
    }
  };

  // Client-side Excel (.xlsx) export complying with precise column instructions using SheetJS
  const handleExportExcel = () => {
    const staff = users.filter(u => u.role !== 'KHACHHANG' && u.role !== 'DOITAC');
    if (staff.length === 0) {
      showToast('Không có dữ liệu nhân sự để xuất!', 'error');
      return;
    }

    const startIndex = Math.max(1, parseInt(exportStart) || 1) - 1;
    const endIndex = Math.min(staff.length, parseInt(exportEnd) || 100);
    
    if (startIndex >= staff.length || startIndex > endIndex) {
      showToast('Khoảng giới hạn xuất không hợp lệ!', 'error');
      return;
    }
    
    const targetedStaff = staff.slice(startIndex, endIndex);

    // Get number of days in selected month/year
    const getDaysInMonth = (m, y) => new Date(y, m, 0).getDate();
    const numDays = getDaysInMonth(selectedMonth, selectedYear);
    
    // Exact column layout: Mã NV, Tên NV, Vai Trò, Lương Cơ Bản, Ngày 1 ... Ngày N, Số Đơn, Thưởng, Tổng Lương
    const headers = [
      "Mã NV",
      "Tên NV",
      "Vai Trò",
      "Lương Cơ Bản",
      ...Array.from({ length: numDays }, (_, i) => `Ngày ${i + 1}`),
      "Số Đơn",
      "Thưởng",
      "Tổng Lương"
    ];

    const rows = targetedStaff.map(s => {
      const dailyBreakdown = Array.from({ length: numDays }, (_, i) => {
        const dayStr = String(i + 1);
        return s.daily_success?.[dayStr] || 0;
      });

      const basic = Number(s.basic_salary) || 0;
      const success = Number(s.success_orders_count) || 0;
      let bonus = 0;
      if (s.role === 'NHANVIEN' || s.role === 'SHIPPER') {
        bonus = success * 5000;
      } else if (s.role === 'KHO') {
        bonus = success * 2000;
      }
      const total = basic + bonus;

      return [
        s.id,
        s.fullname,
        s.role,
        basic,
        ...dailyBreakdown,
        success,
        bonus,
        total
      ];
    });

    // Create a worksheet from headers and rows
    const data = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Dynamic column widths for neat Excel formatting
    const wscols = [
      { wch: 10 }, // Mã NV
      { wch: 22 }, // Tên NV
      { wch: 12 }, // Vai Trò
      { wch: 14 }, // Lương Cơ Bản
      ...Array.from({ length: numDays }, () => ({ wch: 8 })), // Ngày 1 -> Ngày 30/31
      { wch: 10 }, // Số Đơn
      { wch: 12 }, // Thưởng
      { wch: 16 }  // Tổng Lương
    ];
    worksheet['!cols'] = wscols;

    // Build the workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Luong_NhanSu_T${selectedMonth}`);

    // Generate filename and trigger download
    const filename = `Bao_Cao_Luong_Thang_${String(selectedMonth).padStart(2, '0')}_${selectedYear}_Dong_${exportStart}_den_${exportEnd}.xlsx`;
    XLSX.writeFile(workbook, filename);

    showToast(`Xuất file Excel (.xlsx) thành công cho ${targetedStaff.length} nhân sự!`);
  };

  // Compute stats aggregates inside current selected view
  const shippersList = users.filter(u => u.role === 'NHANVIEN' || u.role === 'SHIPPER');
  const totalHoldingOrders = shippersList.reduce((acc, curr) => acc + (curr.holding_orders_count || 0), 0);
  const totalSuccessOrders = shippersList.reduce((acc, curr) => acc + (curr.success_orders_count || 0), 0);
  const totalFailedOrders = shippersList.reduce((acc, curr) => acc + (curr.failed_orders_count || 0), 0);
  
  const calculateTotalSalary = (s) => {
    const basic = Number(s.basic_salary) || 0;
    const success = Number(s.success_orders_count) || 0;
    if (s.role === 'NHANVIEN' || s.role === 'SHIPPER') {
      return basic + success * 5000;
    } else if (s.role === 'KHO') {
      return basic + success * 2000;
    }
    return basic;
  };

  const totalPayout = users.filter(u => u.role !== 'KHACHHANG' && u.role !== 'DOITAC').reduce((acc, curr) => acc + calculateTotalSalary(curr), 0);

  return (
    <div className="w-full relative">
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

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 mb-8 rounded-r-2xl shadow-sm">
          <div className="text-sm font-semibold text-rose-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
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
          {!isWarehouse && (
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
          )}
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
                      {isWarehouse ? (
                        <>
                          <option value="KHO" className="bg-white text-black">Nhân viên kho trung chuyển (KHO)</option>
                          <option value="KETOAN" className="bg-white text-black">Hành chính Kế toán Tổng Kho (KETOAN)</option>
                          <option value="HR" className="bg-white text-black">Quản lý Nhân sự Tổng Kho (HR)</option>
                          <option value="ADMIN" className="bg-white text-black">Quản lý Tổng Kho (ADMIN)</option>
                        </>
                      ) : (
                        <>
                          <option value="NHANVIEN" className="bg-white text-black">Nhân viên giao nhận / Shipper (NHANVIEN)</option>
                          <option value="KHO" className="bg-white text-black">Nhân viên kho trung chuyển (KHO)</option>
                          <option value="CSKH" className="bg-white text-black">Chăm sóc khách hàng (CSKH)</option>
                          <option value="KETOAN" className="bg-white text-black">Hành chính Kế toán (KETOAN)</option>
                          <option value="HR" className="bg-white text-black">Quản lý Nhân sự (HR)</option>
                          <option value="QUANTRI" className="bg-white text-black">Quản trị viên (QUANTRI)</option>
                        </>
                      )}
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
                        <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider">Nơi Làm Việc</th>
                        <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider">Lương Cơ Bản</th>
                        <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-center">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {users.filter(u => u.role !== 'KHACHHANG' && u.role !== 'DOITAC').map((u) => (
                        <tr key={u.id} className="hover:bg-black/[0.01] transition-colors">
                          <td className="px-6 py-5 whitespace-nowrap text-xs font-bold text-mute">
                            #{u.id}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm font-extrabold text-black">{u.fullname}</div>
                            <div className="text-xs text-mute font-medium mt-0.5">@{u.username}</div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            {u.role === 'QUANTRI' || u.role === 'ADMIN' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-purple/10 text-accent-purple border border-accent-purple/20 shadow-[0_2px_8px_rgba(94,14,215,0.08)]">
                                Admin Core
                              </span>
                            ) : u.role === 'NHANVIEN' || u.role === 'SHIPPER' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-[0_2px_8px_rgba(99,102,241,0.08)]">
                                Courier / Shipper
                              </span>
                            ) : u.role === 'KHO' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Warehouse Staff
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-black/5 text-black/60 border border-black/10">
                                {u.role}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-xs font-semibold text-black/80">
                            {u.branch_id ? (
                              <span className="flex items-center gap-1 text-accent-purple">
                                <span className="material-symbols-outlined text-[14px]">store</span>
                                {CORE_BRANCHES.find(b => b.id === u.branch_id)?.name || 'Chi nhánh con'}
                              </span>
                            ) : u.warehouse_id ? (
                              <span className="flex items-center gap-1 text-cyan-600">
                                <span className="material-symbols-outlined text-[14px]">warehouse</span>
                                {CORE_WAREHOUSES.find(w => w.id === u.warehouse_id)?.name || 'Tổng kho'}
                              </span>
                            ) : (
                              <span className="text-mute italic">Chưa phân bổ</span>
                            )}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-xs font-bold text-amber-600 font-display">
                            {(u.basic_salary || 0).toLocaleString('vi-VN')}đ
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-center flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingShipper(u);
                                setTempLimit(u.daily_limit || 100);
                                setTempNotes(u.notes || '');
                                setTempBranchId(u.branch_id || '');
                                setTempWarehouseId(u.warehouse_id || '');
                                setTempBasicSalary(u.basic_salary || 0);
                                setTempRole(u.role || 'NHANVIEN');
                              }}
                              className="w-8 h-8 rounded-full border border-black/10 hover:border-accent-purple/40 hover:text-accent-purple flex items-center justify-center cursor-pointer transition-all hover:bg-accent-purple/5"
                              title="Cấu hình tài khoản & Phân bổ"
                            >
                              <span className="material-symbols-outlined text-sm">settings</span>
                            </button>
                            <button
                              onClick={() => setViewingAttendanceUser(u)}
                              className="w-8 h-8 rounded-full border border-black/10 hover:border-cyan-500/40 hover:text-cyan-600 flex items-center justify-center cursor-pointer transition-all hover:bg-cyan-50"
                              title="Bảng chấm công điện tử"
                            >
                              <span className="material-symbols-outlined text-sm">event_note</span>
                            </button>
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
                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Tổng Quỹ Lương Nhân Sự</p>
                    <p className="text-2xl font-black text-amber-600 mt-2 font-display">{totalPayout.toLocaleString('vi-VN')}đ</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200">
                    <span className="material-symbols-outlined text-amber-600 text-lg">payments</span>
                  </div>
                </div>
                <p className="text-[9px] text-amber-700 font-bold mt-3 relative z-10">Lương cứng + Thưởng (Shipper: 5K, Kho: 2K / đơn)</p>
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
                              <div className="text-xs text-mute font-medium mt-0.5">@{s.username} • <span className="text-accent-purple font-black text-[9px] uppercase">{s.role}</span></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          {s.role !== 'KHO' ? (
                            s.holding_orders_count > 0 ? (
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
                            )
                          ) : (
                            <span className="text-mute italic">N/A (Kho)</span>
                          )}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center text-sm font-black text-emerald-600">
                          {s.success_orders_count || 0} đơn
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center text-sm font-black text-rose-500">
                          {s.failed_orders_count || 0} đơn
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center text-xs font-black text-black/80">
                          {s.role !== 'KHO' ? `${s.daily_limit || 100} đơn/ngày` : 'N/A'}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-extrabold text-amber-600 font-display">
                          {calculateTotalSalary(s).toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-6 py-5 text-xs text-mute font-semibold max-w-[200px] truncate italic">
                          {s.notes || <span className="opacity-40 font-normal">Chưa có ghi chú...</span>}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          <button
                            onClick={() => {
                              setEditingShipper(s);
                              setTempLimit(s.daily_limit || 100);
                              setTempNotes(s.notes || '');
                              setTempBranchId(s.branch_id || '');
                              setTempWarehouseId(s.warehouse_id || '');
                              setTempBasicSalary(s.basic_salary || 0);
                              setTempRole(s.role || 'NHANVIEN');
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

      {/* MODAL 2: STAFF CONFIGURATION (ROLE, BRANCH, WAREHOUSE, SALARY, LIMIT, NOTES) */}
      {editingShipper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setEditingShipper(null)}></div>
          <div className="bg-white/95 border border-black/10 w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden backdrop-blur-xl animate-scale-in">
            <div className="px-6 py-5 border-b border-black/10 flex items-center justify-between bg-black/[0.01]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-purple text-glow-purple">settings</span>
                <h3 className="text-md font-extrabold uppercase tracking-tight text-black">
                  Cấu hình nhân sự - {editingShipper.fullname}
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
              <div className="p-6 space-y-5 overflow-y-auto max-h-[500px] custom-scrollbar text-black font-sans">
                
                {/* Role selection dropdown */}
                <div>
                  <label className="block text-[10px] font-black text-mute uppercase tracking-widest mb-1.5">
                    Vai Trò Nhân Sự (Role)
                  </label>
                  <select
                    value={tempRole}
                    onChange={(e) => setTempRole(e.target.value)}
                    className="w-full input-neon text-xs font-semibold bg-white text-black py-2 px-3 border border-black/10 rounded-xl focus:border-accent-purple"
                  >
                    <option value="NHANVIEN">Nhân viên giao nhận / Shipper (NHANVIEN)</option>
                    <option value="KHO">Nhân viên kho trung chuyển (KHO)</option>
                    <option value="CSKH">Chăm sóc khách hàng (CSKH)</option>
                    <option value="KETOAN">Hành chính Kế toán (KETOAN)</option>
                    <option value="HR">Quản lý Nhân sự (HR)</option>
                    <option value="QUANTRI">Quản trị viên (QUANTRI)</option>
                  </select>
                </div>

                {/* Branch assignment dropdown */}
                <div>
                  <label className="block text-[10px] font-black text-mute uppercase tracking-widest mb-1.5">
                    Phân Phối Chi Nhánh (Branch Assignment)
                  </label>
                  <select
                    value={tempBranchId}
                    onChange={(e) => {
                      setTempBranchId(e.target.value);
                      if (e.target.value) setTempWarehouseId(''); // Clear warehouse if branch selected
                    }}
                    className="w-full input-neon text-xs font-semibold bg-white text-black py-2 px-3 border border-black/10 rounded-xl focus:border-accent-purple"
                  >
                    <option value="">-- Chưa phân bổ chi nhánh --</option>
                    {CORE_BRANCHES.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Warehouse assignment dropdown */}
                <div>
                  <label className="block text-[10px] font-black text-mute uppercase tracking-widest mb-1.5">
                    Phân Phối Tổng Kho (Warehouse Assignment)
                  </label>
                  <select
                    value={tempWarehouseId}
                    onChange={(e) => {
                      setTempWarehouseId(e.target.value);
                      if (e.target.value) setTempBranchId(''); // Clear branch if warehouse selected
                    }}
                    className="w-full input-neon text-xs font-semibold bg-white text-black py-2 px-3 border border-black/10 rounded-xl focus:border-accent-purple"
                  >
                    <option value="">-- Chưa phân bổ tổng kho --</option>
                    {CORE_WAREHOUSES.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                {/* Basic Salary input */}
                <div>
                  <label className="block text-[10px] font-black text-mute uppercase tracking-widest mb-1.5">
                    Lương Cơ Bản (Basic Salary)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={tempBasicSalary}
                      onChange={(e) => setTempBasicSalary(Number(e.target.value) || 0)}
                      className="w-full input-neon text-xs font-bold py-2 px-3 border border-black/10 rounded-xl focus:border-accent-purple pr-8 text-black"
                      placeholder="Ví dụ: 8000000"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-mute">đ</span>
                  </div>
                </div>

                {/* Daily Order Assign Stepper Block (Shippers only) */}
                {(tempRole === 'NHANVIEN' || tempRole === 'SHIPPER') && (
                  <div>
                    <label className="block text-[10px] font-black text-mute uppercase tracking-widest text-center mb-1.5">
                      Hạn Mức Ôm Đơn Trong Ngày (Daily Limit)
                    </label>
                    
                    {/* Dynamic plus/minus steppers */}
                    <div className="flex items-center gap-3 justify-center my-3">
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
                )}

                {/* Notes Textbox Area */}
                <div>
                  <label className="block text-[10px] font-black text-mute uppercase tracking-widest mb-1.5">
                    Ghi Chú Nhân Sự (Staff Notes)
                  </label>
                  <textarea
                    rows="2.5"
                    value={tempNotes}
                    onChange={(e) => setTempNotes(e.target.value)}
                    placeholder="Ví dụ: Hỗ trợ ca tối, Chuyên tuyến Quận 1..."
                    className="w-full input-neon text-xs font-semibold py-2 px-3 border border-black/10 rounded-xl focus:border-accent-purple"
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

      {/* MODAL 3: VIEW DETAILED ELECTRONIC TIMEKEEPING LOGS (ChamCong) */}
      {viewingAttendanceUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setViewingAttendanceUser(null)}></div>
          <div className="bg-white/95 border border-black/10 w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden backdrop-blur-xl animate-scale-in text-black">
            <div className="px-6 py-5 border-b border-black/10 flex items-center justify-between bg-black/[0.01]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-500">event_note</span>
                <h3 className="text-md font-extrabold uppercase tracking-tight text-black">
                  Bảng Chấm Công Điện Tử - {viewingAttendanceUser.fullname}
                </h3>
              </div>
              <button 
                onClick={() => setViewingAttendanceUser(null)}
                className="w-8 h-8 rounded-full border border-black/10 hover:bg-black/5 active:scale-90 flex items-center justify-center cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[450px] custom-scrollbar space-y-6">
              
              {attendanceLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                </div>
              ) : attendanceLogs.length === 0 ? (
                <div className="text-center py-16 text-mute">
                  <span className="material-symbols-outlined text-4xl text-black/10 mb-2">calendar_today</span>
                  <p className="text-xs font-semibold">Chưa có lịch sử chấm công ghi nhận.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-black/5 rounded-2xl bg-black/[0.01]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-black/2 border-b border-black/5">
                        <th className="px-4 py-3 font-bold text-mute uppercase">Ngày Làm Việc</th>
                        <th className="px-4 py-3 font-bold text-mute uppercase">Giờ Vào Ca</th>
                        <th className="px-4 py-3 font-bold text-mute uppercase">Giờ Tan Ca</th>
                        <th className="px-4 py-3 font-bold text-mute uppercase text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 font-semibold">
                      {attendanceLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-black/2 transition-colors">
                          <td className="px-4 py-3.5 text-black/80 font-semibold">
                            {new Date(log.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' })}
                          </td>
                          <td className="px-4 py-3.5">
                            {log.clock_in ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                                {new Date(log.clock_in).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : (
                              <span className="text-mute font-normal opacity-50">--:--</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            {log.clock_out ? (
                              <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                                {new Date(log.clock_out).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : (
                              <span className="text-mute font-normal opacity-50">--:--</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {log.status === 'TAN_CA' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
                                Đã hoàn thành
                              </span>
                            ) : log.status === 'VAO_CA' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-50 text-cyan-700 border border-cyan-100 animate-pulse">
                                Đang trực
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-100">
                                Nghỉ phép
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-black/[0.02] border-t border-black/10 flex justify-end">
              <button
                onClick={() => setViewingAttendanceUser(null)}
                className="px-5 py-2 border border-black/15 text-black hover:bg-black/5 active:scale-95 cursor-pointer rounded-full text-xs font-bold transition-all"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
