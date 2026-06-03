import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FinanceService, AuthService } from '../services/api';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

function numberToVietnameseWords(num) {
  if (num === 0) return 'Không đồng';
  const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const unitsTen = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
  const levels = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  
  let words = [];
  let absNum = Math.abs(Math.floor(num));
  
  const readThreeDigits = (n, showZeroHundred) => {
    let hundred = Math.floor(n / 100);
    let ten = Math.floor((n % 100) / 10);
    let unit = n % 10;
    let str = '';
    
    if (hundred > 0 || showZeroHundred) {
      str += units[hundred] + ' trăm ';
    }
    
    if (ten > 0) {
      if (ten === 1) str += 'mười ';
      else str += units[ten] + ' mươi ';
    } else if (hundred > 0 && unit > 0) {
      str += 'lẻ ';
    }
    
    if (unit > 0) {
      if (unit === 1 && ten > 1) str += 'mốt';
      else if (unit === 5 && ten > 0) str += 'lăm';
      else str += units[unit];
    }
    return str.trim();
  };
  
  let levelIndex = 0;
  while (absNum > 0) {
    let chunk = absNum % 1000;
    if (chunk > 0 || levelIndex === 0) {
      let chunkStr = readThreeDigits(chunk, absNum >= 1000);
      if (chunkStr) {
        words.unshift(chunkStr + ' ' + levels[levelIndex]);
      }
    }
    absNum = Math.floor(absNum / 1000);
    levelIndex++;
  }
  
  let result = words.join(' ').trim().replace(/\s+/g, ' ');
  result = result.charAt(0).toUpperCase() + result.slice(1) + ' đồng';
  if (num < 0) result = 'Trừ ' + result.toLowerCase();
  return result;
}

const exportInvoiceToExcel = (invoice) => {
  const merchantName = invoice.merchant_name || 'Cửa hàng';
  const createdDate = new Date(invoice.created_at).toLocaleString('vi-VN');
  const statusStr = invoice.status === 'DA_THANH_TOAN' ? 'Đã đối soát' : 'Chờ thanh toán';
  
  const data = [
    ["BÁO CÁO ĐỐI SOÁT COD & CƯỚC PHÍ ANTIGRAVITY"],
    [],
    ["Mã hóa đơn đối soát", invoice.invoice_id],
    ["Merchant cửa hàng", `${merchantName} (ID: ${invoice.merchant_id})`],
    ["Ngày đối soát lập", createdDate],
    ["Trạng thái thanh toán", statusStr],
    ["Tổng tiền thu hộ (COD)", Number(invoice.total_cod) || 0],
    ["Tổng cước phí trích trừ", Number(invoice.total_fees) || 0],
    ["Thực nhận cuối cùng (Net)", Number(invoice.net_payout) || 0],
    [],
    ["DANH SÁCH CHI TIẾT CÁC BƯU GỬI ĐỐI SOÁT"],
    ["Mã Đơn Hàng", "Loại Đơn", "Tiền COD Thu Hộ", "Cước Phí Khấu Trừ", "Thực Nhận Chặng"]
  ];

  invoice.orders.forEach(o => {
    const type = o.cod > 0 ? "Đơn COD" : "Đơn cước lẻ";
    data.push([
      o.order_id,
      type,
      Number(o.cod) || 0,
      Number(o.fee) || 0,
      Number(o.payout) || 0
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 25 }, // Mã Đơn Hàng / Tiêu đề nhãn
    { wch: 15 }, // Loại Đơn
    { wch: 18 }, // Tiền COD Thu Hộ
    { wch: 18 }, // Cước Phí Khấu Trừ
    { wch: 18 }  // Thực Nhận Chặng
  ];

  // Merge headers
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Title
    { s: { r: 10, c: 0 }, e: { r: 10, c: 4 } } // Details header
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "DoiSoat_COD");

  const filename = `DoiSoat_${invoice.invoice_id}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

export default function AdminInvoices() {
  const { user } = useAuth();
  const isWarehouse = !!user?.warehouse_id;

  const [activeTab, setActiveTab] = useState('merchant');
  const [invoices, setInvoices] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const [shipperCodList, setShipperCodList] = useState([]);
  const [shipperCodLoading, setShipperCodLoading] = useState(false);
  const [settlingShipperId, setSettlingShipperId] = useState(null);

  const [warehouseStaff, setWarehouseStaff] = useState([]);
  const [warehouseStaffLoading, setWarehouseStaffLoading] = useState(false);
  const [payingStaffId, setPayingStaffId] = useState(null);
  const [printInvoice, setPrintInvoice] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  const handlePrint = (invoice) => {
    setPrintInvoice(invoice);
    setTimeout(() => {
      window.print();
      setPrintInvoice(null);
    }, 150);
  };
  
  // Salary period state
  const today = new Date();
  const defaultMonth = today.getMonth() === 0 ? 12 : today.getMonth();
  const defaultYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
  const [selectedMonth] = useState(defaultMonth);
  const [selectedYear] = useState(defaultYear);

  const fetchWarehouseStaff = async () => {
    try {
      setWarehouseStaffLoading(true);
      setError('');
      const res = await AuthService.getUsers('KHO', selectedMonth, selectedYear);
      if (res.success) {
        setWarehouseStaff(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách nhân viên kho.');
    } finally {
      setWarehouseStaffLoading(false);
    }
  };

  const handlePayStaffSalary = (staffId, staffName) => {
    setConfirmModal({
      show: true,
      title: 'Duyệt Chi Lương Nhân Sự',
      message: `Bạn có chắc chắn muốn duyệt chi lương tháng ${selectedMonth}/${selectedYear} cho nhân viên ${staffName} không? Hành động này sẽ chuyển khoản lương cơ bản và tiền thưởng hiệu suất công việc.`,
      onConfirm: async () => {
        try {
          setPayingStaffId(staffId);
          // Simulate payroll approve
          setTimeout(() => {
            showToast(`Đã duyệt chi lương thành công cho nhân sự ${staffName}! Chuyển khoản lương cơ bản và thưởng phân loại bưu gửi thành công.`);
            setPayingStaffId(null);
            fetchWarehouseStaff();
          }, 1000);
        } catch (err) {
          console.error(err);
          showToast('Lỗi khi duyệt chi lương.', 'error');
          setPayingStaffId(null);
        }
      }
    });
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const toggleInvoiceAccordion = (invoiceId) => {
    setExpandedInvoiceId(expandedInvoiceId === invoiceId ? null : invoiceId);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [invoiceRes, merchantRes] = await Promise.all([
        FinanceService.getInvoices(),
        AuthService.getUsers('KHACHHANG')
      ]);

      if (invoiceRes.success) {
        setInvoices(invoiceRes.data);
      }
      if (merchantRes.success) {
        setMerchants(merchantRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Không thể tải dữ liệu hóa đơn đối soát.');
    } finally {
      setLoading(false);
    }
  };

  const fetchShipperCod = async () => {
    try {
      setShipperCodLoading(true);
      setError('');
      const res = await FinanceService.getShipperCod();
      if (res.success) {
        setShipperCodList(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách COD bưu tá.');
    } finally {
      setShipperCodLoading(false);
    }
  };

  useEffect(() => {
    if (isWarehouse) {
      if (activeTab === 'warehouse_salary') {
        fetchWarehouseStaff();
      }
    } else {
      if (activeTab === 'merchant') {
        fetchData();
      } else if (activeTab === 'shipper') {
        fetchShipperCod();
      }
    }
  }, [activeTab, isWarehouse]);

  useEffect(() => {
    if (isWarehouse) {
      setActiveTab('warehouse_salary');
    }
  }, [isWarehouse]);

  const handleCreateInvoice = async () => {
    if (!selectedMerchantId) {
      showToast('Vui lòng chọn một Merchant!', 'error');
      return;
    }

    try {
      setGenerating(true);
      const res = await FinanceService.createInvoice({ merchant_id: parseInt(selectedMerchantId) });
      if (res.success) {
        showToast(res.message);
        setSelectedMerchantId('');
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi tạo hóa đơn.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handlePayInvoice = (invoiceId) => {
    setConfirmModal({
      show: true,
      title: 'Xác Nhận Thanh Toán Đối Soát',
      message: `Bạn có chắc chắn muốn duyệt đối soát và xác nhận thanh toán chuyển khoản cho hóa đơn ${invoiceId} không? Cửa hàng sẽ nhận được thông báo giải ngân ngay lập tức.`,
      onConfirm: async () => {
        try {
          const res = await FinanceService.payInvoice(invoiceId);
          if (res.success) {
            showToast(res.message);
            fetchData();
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Lỗi duyệt thanh toán hóa đơn.', 'error');
        }
      }
    });
  };

  const handleSettleShipperCod = (shipperId) => {
    setConfirmModal({
      show: true,
      title: 'Đối Soát COD Bưu Tá',
      message: "Bạn có chắc chắn muốn xác nhận đã thu đủ số tiền mặt COD bưu tá này đang giữ không? Quỹ ví COD trên app của bưu tá sẽ được reset về 0.",
      onConfirm: async () => {
        try {
          setSettlingShipperId(shipperId);
          const res = await FinanceService.settleShipperCod(shipperId);
          if (res.success) {
            showToast(res.message);
            fetchShipperCod();
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Lỗi đối soát COD bưu tá.', 'error');
        } finally {
          setSettlingShipperId(null);
        }
      }
    });
  };

  return (
    <div className="w-full relative animate-fade-in">
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

      {/* Floating Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in no-print">
          <div className="bg-[#0f111a]/95 backdrop-blur-md border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-zoom-in font-sans">
            {/* Header */}
            <div className="bg-[#151825] px-6 py-4 border-b border-white/5 flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 rounded-full bg-purple-500 animate-ping"></span>
              <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">{confirmModal.title}</h3>
            </div>
            {/* Body */}
            <div className="px-6 py-6">
              <p className="text-white/80 text-sm leading-relaxed">{confirmModal.message}</p>
            </div>
            {/* Footer */}
            <div className="px-6 py-4 bg-[#151825]/50 border-t border-white/5 flex items-center justify-end gap-3">
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                HỦY BỎ
              </button>
              <button 
                onClick={() => {
                  setConfirmModal({ ...confirmModal, show: false });
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.4)] transition-all cursor-pointer"
              >
                ĐỒNG Ý
              </button>
            </div>
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
      <div className="flex p-1 bg-black/[0.03] backdrop-blur-md rounded-xl max-w-lg mb-8 border border-black/10 text-black font-sans no-print">
        {isWarehouse ? (
          <>
            <button
              onClick={() => setActiveTab('warehouse_salary')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'warehouse_salary'
                  ? 'bg-accent-purple text-white shadow-[0_4px_12px_rgba(94,14,215,0.2)]'
                  : 'text-mute hover:text-black bg-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-sm">badge</span>
              <span>Bảng Lương Nhân Sự Kho</span>
            </button>
            <button
              onClick={() => setActiveTab('warehouse_trucking')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'warehouse_trucking'
                  ? 'bg-accent-purple text-white shadow-[0_4px_12px_rgba(94,14,215,0.2)]'
                  : 'text-mute hover:text-black bg-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-sm">local_shipping</span>
              <span>Chi Phí Vận Tải</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('merchant')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'merchant'
                  ? 'bg-accent-purple text-white shadow-[0_4px_12px_rgba(94,14,215,0.2)]'
                  : 'text-mute hover:text-black bg-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-sm">store</span>
              <span>Đối Soát Cửa Hàng</span>
            </button>
            <button
              onClick={() => setActiveTab('shipper')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'shipper'
                  ? 'bg-accent-purple text-white shadow-[0_4px_12px_rgba(94,14,215,0.2)]'
                  : 'text-mute hover:text-black bg-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-sm">payments</span>
              <span>Đối Soát Quỹ COD Bưu Tá</span>
            </button>
          </>
        )}
      </div>

      {isWarehouse ? (
        activeTab === 'warehouse_salary' ? (
          /* WAREHOUSE WORKERS PAYROLL TAB */
          <div className="space-y-8 animate-fade-in text-black font-sans">
            
            {/* Payroll Aggregates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/60 border border-black/10 p-5 rounded-2xl shadow-sm hover:border-[#6366f1]/40 hover:shadow-[0_8px_20px_rgba(99,102,241,0.05)] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-mute uppercase tracking-widest">Tổng Quỹ Lương Dự Chi</p>
                    <p className="text-2xl font-black text-black mt-2 font-display">
                      {(
                        warehouseStaff.reduce((acc, curr) => acc + (Number(curr.basic_salary) || 0), 0) + 
                        warehouseStaff.reduce((acc, curr) => acc + (Number(curr.success_orders_count) || 0) * 2000, 0)
                      ).toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                    <span className="material-symbols-outlined text-indigo-600 text-lg">payments</span>
                  </div>
                </div>
                <p className="text-[10px] text-mute font-medium mt-3">Lương cơ bản + Thưởng hiệu suất phân loại</p>
              </div>

              <div className="bg-white/60 border border-black/10 p-5 rounded-2xl shadow-sm hover:border-accent-purple/40 hover:shadow-[0_8px_20px_rgba(94,14,215,0.05)] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-mute uppercase tracking-widest">Tổng Bưu Kiện Phân Loại</p>
                    <p className="text-2xl font-black text-accent-purple mt-2 font-display">
                      {warehouseStaff.reduce((acc, curr) => acc + (Number(curr.success_orders_count) || 0), 0).toLocaleString('vi-VN')} kiện
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
                    <span className="material-symbols-outlined text-accent-purple text-lg">inventory_2</span>
                  </div>
                </div>
                <p className="text-[10px] text-mute font-medium mt-3">Hiệu suất xử lý hàng hóa tại Tổng Kho</p>
              </div>

              <div className="bg-white/60 border border-black/10 p-5 rounded-2xl shadow-sm hover:border-emerald-500/40 hover:shadow-[0_8px_20px_rgba(16,185,129,0.05)] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-mute uppercase tracking-widest">Nhân Sự Đã Chấm Công</p>
                    <p className="text-2xl font-black text-emerald-600 mt-2 font-display">
                      {warehouseStaff.length} thành viên
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <span className="material-symbols-outlined text-emerald-600 text-lg">badge</span>
                  </div>
                </div>
                <p className="text-[10px] text-mute font-medium mt-3">Đã xác minh bảng chấm công bưu điện</p>
              </div>
            </div>

            {/* Warehouse Staff Table */}
            <div className="bg-transparent">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-extrabold text-black tracking-tight uppercase font-display text-glow-purple">
                  Bảng Kê Chi Lương Nhân Sự Tổng Kho (Tháng {selectedMonth}/{selectedYear})
                </h3>
                
                <button 
                  onClick={fetchWarehouseStaff} 
                  className="flex items-center gap-1.5 px-4 py-2 bg-black/5 border border-black/10 hover:bg-black/10 text-black text-xs font-bold rounded-full transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  <span>Tải lại</span>
                </button>
              </div>

              {warehouseStaffLoading ? (
                <div className="flex justify-center items-center py-20 border border-black/10 rounded-2xl shadow-sm bg-white/40 backdrop-blur-md">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
                </div>
              ) : warehouseStaff.length === 0 ? (
                <div className="text-center py-16 text-mute bg-white/40 backdrop-blur-md border border-black/10 rounded-2xl">
                  <span className="material-symbols-outlined text-4xl text-black/10 mb-2">badge</span>
                  <p className="text-sm font-semibold">Chưa có nhân sự kho nào được xếp ca.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-black/10 rounded-2xl shadow-sm bg-white/50 custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black/10 bg-black/[0.02]">
                        <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider">ID</th>
                        <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider">Nhân Viên Kho</th>
                        <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-right">Lương Cơ Bản</th>
                        <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-center">Bưu Kiện Đã Xử Lý</th>
                        <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-right">Thưởng Hiệu Suất</th>
                        <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-right">Tổng Nhận</th>
                        <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-center">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 font-semibold">
                      {warehouseStaff.map((s) => {
                        const basic = Number(s.basic_salary) || 0;
                        const processedCount = Number(s.success_orders_count) || 0;
                        const bonus = processedCount * 2000;
                        const total = basic + bonus;

                        return (
                          <tr key={s.id} className="hover:bg-black/[0.01] transition-colors">
                            <td className="px-6 py-5 whitespace-nowrap text-xs font-bold text-mute">
                              #{s.id}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm font-extrabold text-black">{s.fullname}</div>
                              <div className="text-xs text-mute font-medium mt-0.5">@{s.username}</div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right text-sm text-black">
                              {basic.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-center text-sm">
                              {processedCount.toLocaleString('vi-VN')} kiện
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right text-sm text-purple-700">
                              {bonus.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right text-sm text-accent-purple font-black font-display">
                              {total.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-center">
                              <button
                                onClick={() => handlePayStaffSalary(s.id, s.fullname)}
                                disabled={payingStaffId === s.id}
                                className="px-4 py-1.5 bg-accent-purple hover:bg-[#6e19f1] text-white text-xs font-extrabold rounded-full transition-all active:scale-95 cursor-pointer shadow-sm disabled:bg-black/10 disabled:text-black/35"
                              >
                                {payingStaffId === s.id ? 'Đang duyệt...' : 'Duyệt Chi Lương'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* WAREHOUSE TRANSIT TRUCKING expense ledgers */
          <div className="space-y-8 animate-fade-in text-black font-sans">
            
            {/* Trucking Aggregates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/60 border border-black/10 p-5 rounded-2xl shadow-sm hover:border-[#6366f1]/40 hover:shadow-[0_8px_20px_rgba(99,102,241,0.05)] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-mute uppercase tracking-widest">Tổng Chi Phí Vận Tải</p>
                    <p className="text-2xl font-black text-black mt-2 font-display">
                      {(15850000).toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                    <span className="material-symbols-outlined text-indigo-600 text-lg">local_shipping</span>
                  </div>
                </div>
                <p className="text-[10px] text-mute font-medium mt-3">Bao gồm cước chạy xe, xăng dầu & trợ cấp tài xế</p>
              </div>

              <div className="bg-white/60 border border-black/10 p-5 rounded-2xl shadow-sm hover:border-amber-500/40 hover:shadow-[0_8px_20px_rgba(245,158,11,0.05)] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-mute uppercase tracking-widest">Phụ Phí Xăng Dầu (MOCK)</p>
                    <p className="text-2xl font-black text-amber-600 mt-2 font-display">
                      {(4250000).toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                    <span className="material-symbols-outlined text-amber-600 text-lg">oil_barrel</span>
                  </div>
                </div>
                <p className="text-[10px] text-mute font-medium mt-3">Định mức nhiên liệu hao phí chặng dài</p>
              </div>

              <div className="bg-white/60 border border-black/10 p-5 rounded-2xl shadow-sm hover:border-emerald-500/40 hover:shadow-[0_8px_20px_rgba(16,185,129,0.05)] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-mute uppercase tracking-widest">Số Chuyến Đã Thanh Toán</p>
                    <p className="text-2xl font-black text-emerald-600 mt-2 font-display">
                      6 chuyến xe
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
                  </div>
                </div>
                <p className="text-[10px] text-mute font-medium mt-3">Đã duyệt quyết toán cước phí tài xế</p>
              </div>
            </div>

            {/* Trucking Lanes Table */}
            <div className="bg-transparent">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-extrabold text-black tracking-tight uppercase font-display text-glow-purple">
                  Nhật Ký Quyết Toán Cước Xe Tải Trung Chuyển Chặng Dài
                </h3>
              </div>

              <div className="overflow-x-auto border border-black/10 rounded-2xl shadow-sm bg-white/50 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/10 bg-black/[0.02]">
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider">Tuyến Trung Chuyển</th>
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-center">Biển Số Xe</th>
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-right">Quãng Đường</th>
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-right">Cước Cơ Bản</th>
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-right">Trợ Cấp Tài Xế</th>
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-right">Tổng Quyết Toán</th>
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 font-semibold text-xs text-black">
                    <tr className="hover:bg-black/[0.01] transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap font-extrabold">Tổng Kho Bắc Ninh ➔ Hub Hà Nội</td>
                      <td className="px-6 py-5 whitespace-nowrap text-center font-mono text-xs">29C-888.66</td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">45 km</td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">1,200,000 đ</td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">250,000 đ</td>
                      <td className="px-6 py-5 whitespace-nowrap text-right font-black text-accent-purple">1,450,000 đ</td>
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                        <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">Đã Quyết Toán</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-black/[0.01] transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap font-extrabold">Tổng Kho Bắc Ninh ➔ Tổng Kho Bình Dương</td>
                      <td className="px-6 py-5 whitespace-nowrap text-center font-mono text-xs">30H-999.88</td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">1,650 km</td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">9,800,000 đ</td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">1,500,000 đ</td>
                      <td className="px-6 py-5 whitespace-nowrap text-right font-black text-accent-purple">11,300,000 đ</td>
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                        <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">Đã Quyết Toán</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-black/[0.01] transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap font-extrabold">Tổng Kho Bắc Ninh ➔ Tổng Kho Quảng Ngãi</td>
                      <td className="px-6 py-5 whitespace-nowrap text-center font-mono text-xs">30F-777.99</td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">860 km</td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">2,800,000 đ</td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">300,000 đ</td>
                      <td className="px-6 py-5 whitespace-nowrap text-right font-black text-accent-purple">3,100,000 đ</td>
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                        <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">Đã Quyết Toán</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      ) : activeTab === 'merchant' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Generate Invoice Panel (4 columns) */}
          <div className="lg:col-span-4 bg-white/60 border border-black/10 p-6 rounded-2xl shadow-sm h-fit hover:border-accent-purple/40 hover:shadow-[0_10px_25px_rgba(94,14,215,0.08)] transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-accent-purple text-glow-purple">receipt_long</span>
              <h2 className="text-lg font-extrabold text-black tracking-tight uppercase font-display text-glow-purple">Batch Invoicing</h2>
            </div>
            
            <p className="text-xs text-mute font-semibold mb-6 leading-relaxed">
              Hệ thống sẽ quét toàn bộ đơn hàng giao thành công chưa đối soát của Merchant được chọn để gom vào một hóa đơn tài chính tổng hợp.
            </p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-mute uppercase tracking-wider mb-2">Chọn cửa hàng (Merchant)</label>
                <div className="relative">
                  <select
                    value={selectedMerchantId}
                    onChange={(e) => setSelectedMerchantId(e.target.value)}
                    className="w-full px-4 py-3 input-neon rounded-md text-xs font-semibold bg-white text-black focus:outline-none focus:border-accent-purple transition-all"
                  >
                    <option value="" className="bg-white text-black">-- Lựa chọn cửa hàng --</option>
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id} className="bg-white text-black">
                        {m.fullname} (ID: {m.id} - @{m.username})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button
                onClick={handleCreateInvoice}
                disabled={generating}
                className="w-full py-3 bg-accent-purple text-white text-xs font-extrabold rounded-full hover:bg-[#6e19f1] active:scale-95 shadow-[0_4px_12px_rgba(94,14,215,0.22)] hover:shadow-[0_6px_20px_rgba(94,14,215,0.38)] cursor-pointer transition-all disabled:bg-black/10 disabled:text-black/35 mt-2 uppercase tracking-wider"
              >
                {generating ? 'Đang gom đối soát...' : 'Gom & Khởi tạo Hóa đơn'}
              </button>
            </div>
          </div>

          {/* Right Column: Invoice Lists (8 columns) */}
          <div className="lg:col-span-8 flex flex-col bg-transparent min-w-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-black tracking-tight uppercase font-display text-glow-purple">Settlement Log</h2>
              
              <button 
                onClick={fetchData} 
                className="flex items-center gap-1.5 px-4 py-2 bg-black/5 border border-black/10 hover:bg-black/10 text-black text-xs font-bold rounded-full transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                <span>Tải lại</span>
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-24 border border-black/10 rounded-2xl shadow-sm bg-white/40 backdrop-blur-md">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-20 text-[#afafaf] bg-white/40 backdrop-blur-md border border-black/10 rounded-2xl shadow-sm">
                <span className="material-symbols-outlined text-4xl mb-2 text-black/10">payments</span>
                <p className="text-sm font-medium text-mute">Không có hóa đơn đối soát nào tồn tại.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {invoices.map((inv) => (
                  <div 
                    key={inv.invoice_id} 
                    className="glow-card border border-black/10 p-6 rounded-[24px] shadow-sm hover:border-accent-purple/30 transition-all duration-300 bg-white/50"
                  >
                    {/* Invoice Summary Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-4 border-b border-black/5">
                      <div>
                        <div className="text-sm font-extrabold text-black flex items-center gap-2.5">
                          <span>{inv.invoice_id}</span>
                          {inv.status === 'DA_THANH_TOAN' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-855 border border-emerald-200 shadow-[0_2px_8px_rgba(16,185,129,0.08)]">
                              Đã đối soát
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-[0_2px_8px_rgba(245,158,11,0.08)]">
                              Chờ thanh toán
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-mute font-medium mt-1">
                          Merchant: <span className="font-bold text-black">{inv.merchant_name}</span> (ID: {inv.merchant_id}) • Tạo ngày: {new Date(inv.created_at).toLocaleString('vi-VN')}
                        </div>
                      </div>
                      
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] font-bold text-mute uppercase tracking-wider">Thực nhận sau phí (Net)</div>
                        <div className={`text-xl font-extrabold font-display ${inv.net_payout >= 0 ? 'text-accent-purple' : 'text-amber-800'}`}>
                          {inv.net_payout >= 0 ? '+' : ''}{inv.net_payout.toLocaleString()} đ
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/[0.02] p-4 rounded-xl text-xs border border-black/5 mb-5 text-black">
                      <div>
                        <div className="text-mute font-semibold">Tổng thu hộ (COD)</div>
                        <div className="font-extrabold text-black text-sm mt-1">{(inv.total_cod || 0).toLocaleString()} đ</div>
                      </div>
                      <div>
                        <div className="text-mute font-semibold">Tổng phí trích trừ</div>
                        <div className="font-extrabold text-black text-sm mt-1">{(inv.total_fees || 0).toLocaleString()} đ</div>
                      </div>
                      <div>
                        <div className="text-mute font-semibold">Trạng thái dòng tiền</div>
                        <div className="font-extrabold text-black text-xs mt-1 uppercase tracking-tight">
                          {inv.net_payout >= 0 ? (
                            <span className="text-accent-purple">Hệ thống gửi Merchant</span>
                          ) : (
                            <span className="text-amber-700">Merchant gửi Hệ thống</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Accordion Collapsible order listing detail (Phase 3) */}
                    {inv.orders && inv.orders.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-black/5">
                        {/* Utility Actions for Print and Excel */}
                        <div className="flex flex-wrap items-center gap-2 mb-4 no-print">
                          <button
                            onClick={() => handlePrint(inv)}
                            className="px-3.5 py-1.5 bg-black/5 hover:bg-black/10 border border-black/10 rounded-full text-xs font-bold text-black flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">print</span>
                            <span>In Hóa Đơn (PDF)</span>
                          </button>
                          <button
                            onClick={() => exportInvoiceToExcel(inv)}
                            className="px-3.5 py-1.5 bg-black/5 hover:bg-black/10 border border-black/10 rounded-full text-xs font-bold text-black flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">download</span>
                            <span>Tải Báo Cáo Excel</span>
                          </button>
                        </div>

                        <button
                          onClick={() => toggleInvoiceAccordion(inv.invoice_id)}
                          className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-accent-purple hover:text-[#6e19f1] transition-colors cursor-pointer"
                        >
                          {expandedInvoiceId === inv.invoice_id ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              <span>Ẩn danh sách đơn hàng đối soát ({inv.orders.length})</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>Xem danh sách đơn hàng đối soát ({inv.orders.length})</span>
                            </>
                          )}
                        </button>

                        {expandedInvoiceId === inv.invoice_id && (
                          <div className="mt-4 pt-2 animate-fade-in text-black">
                            <div className="overflow-x-auto border border-black/5 rounded-xl bg-black/[0.01]">
                              <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                                <thead>
                                  <tr className="bg-black/2 border-b border-black/5">
                                    <th className="px-4 py-3 text-[9px] font-black text-mute uppercase tracking-wider">Mã đơn</th>
                                    <th className="px-4 py-3 text-[9px] font-black text-mute uppercase tracking-wider">Loại đơn</th>
                                    <th className="px-4 py-3 text-[9px] font-black text-mute uppercase tracking-wider">Thu hộ COD</th>
                                    <th className="px-4 py-3 text-[9px] font-black text-mute uppercase tracking-wider">Phí ship trích trừ</th>
                                    <th className="px-4 py-3 text-[9px] font-black text-mute uppercase tracking-wider">Thực nhận</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5 font-semibold">
                                  {inv.orders.map((o) => (
                                    <tr key={o.order_id} className="hover:bg-black/2 transition-colors">
                                      <td className="px-4 py-3 font-black uppercase text-glow-purple text-[11px]">{o.order_id}</td>
                                      <td className="px-4 py-3">
                                        {o.cod > 0 ? (
                                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-purple/10 text-accent-purple border border-accent-purple/20">Đơn COD</span>
                                        ) : (
                                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-850 border border-cyan-200">Đơn 0đ</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3">{o.cod.toLocaleString()} đ</td>
                                      <td className="px-4 py-3 text-rose-700">-{o.fee.toLocaleString()} đ</td>
                                      <td className={`px-4 py-3 font-black text-[12px] ${o.payout >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                        {o.payout >= 0 ? '+' : ''}{o.payout.toLocaleString()} đ
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="mt-3 px-2 flex justify-between items-center text-[9px] text-mute font-black uppercase tracking-widest">
                              <span>* Thực nhận = COD - Phí ship</span>
                              <span>Đơn 0đ trích nợ cước trực tiếp vào ví đối soát</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Settlement Payment Details and confirmation */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 pt-2">
                      <div className="text-xs text-mute flex-1">
                        {inv.net_payout >= 0 ? (
                          inv.merchant_bank_info ? (
                            <div className="p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-xl flex flex-col sm:flex-row items-center gap-4">
                              {inv.vietqr_url && (
                                <div className="border border-black/10 p-1.5 bg-white rounded-lg flex-shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.04)] no-print">
                                  <img src={inv.vietqr_url} alt="VietQR Pay-Out" className="h-32 w-32 object-contain hover:scale-105 transition-all duration-300" />
                                </div>
                              )}
                              <div className="flex-1">
                                <span className="font-bold text-emerald-800 uppercase tracking-wider text-[9px] flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">account_balance</span>
                                  <span>Quét QR Chuyển Tiền cho Merchant:</span>
                                </span>
                                <div className="mt-2 font-semibold text-black space-y-0.5 text-xs">
                                  <div>Ngân hàng: <span className="font-extrabold text-accent-purple">{inv.merchant_bank_info.bank_name}</span></div>
                                  <div>STK: <span className="font-extrabold text-accent-purple">{inv.merchant_bank_info.account_no}</span></div>
                                  <div>Chủ tài khoản: <span className="font-extrabold text-accent-purple">{inv.merchant_bank_info.account_name}</span></div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                              <span className="material-symbols-outlined text-sm">warning</span>
                              <span>Merchant chưa cung cấp cấu hình tài khoản ngân hàng để nhận thanh toán.</span>
                            </div>
                          )
                        ) : (
                          <div className="flex items-center gap-4 p-4 bg-rose-50/50 border border-rose-200/60 rounded-xl">
                            {inv.vietqr_url && (
                              <div className="border border-black/10 p-1.5 bg-white rounded-lg flex-shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
                                <img src={inv.vietqr_url} alt="VietQR Pay-In" className="h-32 w-32 object-contain hover:scale-105 transition-all duration-300" />
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-amber-850 uppercase tracking-wider text-[9px] flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">qr_code_scanner</span>
                                <span>VietQR Thu Phí Tự Động:</span>
                              </span>
                              <p className="mt-1 font-semibold text-mute text-[11px] leading-relaxed">
                                Merchant quét QR để thanh toán cước phí còn nợ (<span className="font-extrabold text-black">{Math.abs(inv.net_payout).toLocaleString()} đ</span>) về ngân hàng hệ thống.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {inv.status === 'CHUA_THANH_TOAN' && (
                        <div className="flex items-end justify-end">
                          <button
                            onClick={() => handlePayInvoice(inv.invoice_id)}
                            className="px-6 py-3 bg-accent-purple text-white hover:bg-[#6e19f1] active:scale-95 shadow-[0_4px_12px_rgba(94,14,215,0.22)] hover:shadow-[0_6px_20px_rgba(94,14,215,0.38)] cursor-pointer text-xs font-extrabold rounded-full transition-all whitespace-nowrap uppercase tracking-wider flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">done_all</span>
                            <span>{inv.net_payout >= 0 ? 'Xác nhận Đã Chuyển Tiền' : 'Duyệt Đã Thu Phí'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      ) : (
        /* TAB 2: SHIPPER COD RECONCILIATION DESK */
        <div className="space-y-8 animate-fade-in text-black font-sans">
          
          {/* Aggregates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/60 border border-black/10 p-5 rounded-2xl shadow-sm hover:border-[#6366f1]/40 hover:shadow-[0_8px_20px_rgba(99,102,241,0.05)] transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-mute uppercase tracking-widest">Tổng COD Bưu Tá Đã Thu</p>
                  <p className="text-2xl font-black text-black mt-2 font-display">
                    {shipperCodList.reduce((acc, curr) => acc + (curr.total_collected || 0), 0).toLocaleString('vi-VN')}đ
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                  <span className="material-symbols-outlined text-indigo-600 text-lg">account_balance_wallet</span>
                </div>
              </div>
              <p className="text-[10px] text-mute font-medium mt-3">Tổng tiền COD thu từ khách hàng thành công</p>
            </div>

            <div className="bg-white/70 border border-amber-300 p-5 rounded-2xl shadow-md hover:border-amber-400 hover:shadow-[0_10px_25px_rgba(245,158,11,0.12)] transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl -mr-4 -mt-4"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-[10px] font-black text-amber-850 uppercase tracking-widest">Quỹ COD Chưa Nộp</p>
                  <p className="text-2xl font-black text-amber-600 mt-2 font-display">
                    {shipperCodList.reduce((acc, curr) => acc + (curr.pending_settlement || 0), 0).toLocaleString('vi-VN')}đ
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200 animate-pulse">
                  <span className="material-symbols-outlined text-amber-600 text-lg">hourglass_empty</span>
                </div>
              </div>
              <p className="text-[10px] text-amber-850 font-bold mt-3 relative z-10">Tiền mặt bưu tá đang cầm giữ chưa bàn giao</p>
            </div>

            <div className="bg-white/60 border border-black/10 p-5 rounded-2xl shadow-sm hover:border-emerald-500/40 hover:shadow-[0_8px_20px_rgba(16,185,129,0.05)] transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-mute uppercase tracking-widest">Tổng Đơn Giao Thành Công</p>
                  <p className="text-2xl font-black text-emerald-600 mt-2 font-display">
                    {shipperCodList.reduce((acc, curr) => acc + (curr.orders_count || 0), 0)} đơn
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                  <span className="material-symbols-outlined text-emerald-600 text-lg">done_all</span>
                </div>
              </div>
              <p className="text-[10px] text-mute font-medium mt-3">Lượt giao hàng COD thành công kỳ này</p>
            </div>
          </div>

          {/* Shipper COD Table */}
          <div className="bg-transparent">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-extrabold text-black tracking-tight uppercase font-display text-glow-purple">
                Bảng Theo Dõi Quỹ Tiền Mặt Bưu Tá
              </h3>
              
              <button 
                onClick={fetchShipperCod} 
                className="flex items-center gap-1.5 px-4 py-2 bg-black/5 border border-black/10 hover:bg-black/10 text-black text-xs font-bold rounded-full transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                <span>Tải lại</span>
              </button>
            </div>

            {shipperCodLoading ? (
              <div className="flex justify-center items-center py-20 border border-black/10 rounded-2xl shadow-sm bg-white/40 backdrop-blur-md">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
              </div>
            ) : shipperCodList.length === 0 ? (
              <div className="text-center py-16 text-mute bg-white/40 backdrop-blur-md border border-black/10 rounded-2xl">
                <span className="material-symbols-outlined text-4xl text-black/10 mb-2">payments</span>
                <p className="text-sm font-semibold">Không tìm thấy dữ liệu bưu tá giao hàng.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-black/10 rounded-2xl shadow-sm bg-white/50 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/10 bg-black/[0.02]">
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider">Bưu Tá (Courier)</th>
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-center">Đơn Đã Giao</th>
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-right">Tổng COD Đã Thu</th>
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-right">Quỹ COD Chưa Nộp</th>
                      <th className="px-6 py-4 font-bold text-xs text-mute uppercase tracking-wider text-center">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 font-semibold">
                    {shipperCodList.map((s) => (
                      <tr key={s.shipper_id} className="hover:bg-black/[0.01] transition-colors">
                        <td className="px-6 py-5 whitespace-nowrap text-xs font-bold text-mute">
                          #{s.shipper_id}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm font-extrabold text-black">{s.shipper_name}</div>
                          <div className="text-xs text-mute font-medium mt-0.5">@{s.username}</div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center text-sm">
                          {s.orders_count} đơn hàng
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm text-black">
                          {s.total_collected.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm text-amber-600 font-bold font-display">
                          {s.pending_settlement.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          {s.pending_settlement > 0 ? (
                            <button
                              onClick={() => handleSettleShipperCod(s.shipper_id)}
                              disabled={settlingShipperId === s.shipper_id}
                              className="px-4 py-1.5 bg-accent-purple hover:bg-[#6e19f1] text-white text-xs font-extrabold rounded-full transition-all active:scale-95 cursor-pointer shadow-sm disabled:bg-black/10 disabled:text-black/35"
                            >
                              {settlingShipperId === s.shipper_id ? 'Đang duyệt...' : 'Duyệt Thu COD'}
                            </button>
                          ) : (
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Đã nộp đủ
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
        </div>
      )}

      {/* A4 PRINT ONLY INVOICE TEMPLATE (HIDDEN ON SCREEN) */}
      {printInvoice && (
        <div id="print-invoice-area" className="hidden-on-screen text-black font-sans p-8 bg-white border border-black rounded-none max-w-2xl mx-auto">
          <style>{`
            @media screen {
              .hidden-on-screen { display: none !important; }
            }
            @media print {
              body * {
                visibility: hidden;
              }
              #print-invoice-area, #print-invoice-area * {
                visibility: visible;
              }
              #print-invoice-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                display: block !important;
                background: white !important;
                color: black !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>
          
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
            <div>
              <h1 className="text-xl font-black tracking-wider text-black">ANTIGRAVITY EXPRESS</h1>
              <p className="text-[10px] text-gray-600 font-semibold mt-1">Hệ Thống Logistics & Chuyển Phát Nhanh Công Nghệ Cao</p>
              <p className="text-[9px] text-gray-500 mt-0.5">Hotline: 1900 8888 • Email: finance@antigravity.vn</p>
              <p className="text-[9px] text-gray-500">Địa chỉ: Tòa nhà Antigravity, Cầu Giấy, Hà Nội</p>
            </div>
            <div className="text-right">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">HÓA ĐƠN ĐỐI SOÁT</h2>
              <p className="text-[10px] font-mono text-gray-900 mt-1">Mã: {printInvoice.invoice_id}</p>
              <p className="text-[9px] text-gray-600 mt-0.5">Ngày lập: {new Date(printInvoice.created_at).toLocaleDateString('vi-VN')}</p>
              <p className="text-[9px] text-gray-600">Trạng thái: <span className="font-bold">{printInvoice.status === 'DA_THANH_TOAN' ? 'ĐÃ ĐỐI SOÁT' : 'CHƯA THANH TOÁN'}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 text-xs mb-6">
            <div className="border border-black p-3 rounded">
              <p className="font-bold uppercase border-b border-black pb-1 mb-2 text-[9px] text-gray-700">ĐƠN VỊ ĐỐI SOÁT (PLATFORM)</p>
              <p className="font-extrabold text-black">CÔNG TY CỔ PHẦN LOGISTICS ANTIGRAVITY</p>
              <p className="text-[10px] text-gray-600 mt-1">STK Thu phí: 0329603475 - MB Bank</p>
              <p className="text-[10px] text-gray-600">Tên TK: CONG TY ANTIGRAVITY EXPRESS</p>
            </div>
            <div className="border border-black p-3 rounded">
              <p className="font-bold uppercase border-b border-black pb-1 mb-2 text-[9px] text-gray-700">KHÁCH HÀNG THỤ HƯỞNG (MERCHANT)</p>
              <p className="font-extrabold text-black">{printInvoice.merchant_name} (ID: {printInvoice.merchant_id})</p>
              {printInvoice.merchant_bank_info ? (
                <div className="text-[10px] text-gray-600 mt-1">
                  <p>Ngân hàng: {printInvoice.merchant_bank_info.bank_name}</p>
                  <p>STK nhận: {printInvoice.merchant_bank_info.account_no}</p>
                  <p>Chủ TK: {printInvoice.merchant_bank_info.account_name}</p>
                </div>
              ) : (
                <p className="text-[10px] text-gray-600 mt-1">Chưa cấu hình tài khoản thụ hưởng.</p>
              )}
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse border border-black mb-6">
            <thead>
              <tr className="bg-gray-100 border-b border-black text-[9px] font-bold uppercase text-gray-700">
                <th className="border-r border-black px-3 py-2 text-center w-8">STT</th>
                <th className="border-r border-black px-3 py-2">Mã Vận Đơn</th>
                <th className="border-r border-black px-3 py-2 text-center">Phân Loại</th>
                <th className="border-r border-black px-3 py-2 text-right">Tiền Thu Hộ COD</th>
                <th className="border-r border-black px-3 py-2 text-right">Phí Ship Khấu Trừ</th>
                <th className="px-3 py-2 text-right">Thực Nhận Chặng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {printInvoice.orders.map((o, idx) => (
                <tr key={o.order_id} className="text-[10px]">
                  <td className="border-r border-black px-3 py-1.5 text-center">{idx + 1}</td>
                  <td className="border-r border-black px-3 py-1.5 font-bold uppercase font-mono">{o.order_id}</td>
                  <td className="border-r border-black px-3 py-1.5 text-center">{o.cod > 0 ? 'Đơn COD' : 'Đơn cước lẻ'}</td>
                  <td className="border-r border-black px-3 py-1.5 text-right">{o.cod.toLocaleString('vi-VN')} đ</td>
                  <td className="border-r border-black px-3 py-1.5 text-right text-gray-600">-{o.fee.toLocaleString('vi-VN')} đ</td>
                  <td className="px-3 py-1.5 text-right font-bold">{o.payout.toLocaleString('vi-VN')} đ</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border border-black p-4 rounded text-xs space-y-2 mb-8 bg-gray-50">
            <div className="flex justify-between items-center font-bold">
              <span>1. Tổng tiền thu hộ (COD gom nhận):</span>
              <span>{printInvoice.total_cod.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between items-center text-gray-600 font-semibold">
              <span>2. Tổng cước vận chuyển & dịch vụ trích trừ:</span>
              <span>-{printInvoice.total_fees.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between items-center border-t border-black pt-2 text-sm font-black">
              <span>3. Thực nhận thanh toán cuối cùng (Net Payout):</span>
              <span>
                {printInvoice.net_payout >= 0 ? '+' : ''}{printInvoice.net_payout.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="text-[10px] text-gray-500 font-bold italic pt-1 border-t border-dashed border-gray-300">
              Bằng chữ: {numberToVietnameseWords(printInvoice.net_payout)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-center text-xs mt-12">
            <div>
              <p className="font-bold">ĐẠI DIỆN CỬA HÀNG (MERCHANT)</p>
              <p className="text-[9px] text-gray-500 italic mt-0.5">(Ký, ghi rõ họ tên)</p>
              <div className="h-20"></div>
              <p className="font-bold text-gray-400">________________________</p>
            </div>
            <div>
              <p className="font-bold">KẾ TOÁN HỆ THỐNG (ANTIGRAVITY)</p>
              <p className="text-[9px] text-gray-500 italic mt-0.5">(Ký, ghi rõ họ tên)</p>
              <div className="h-20"></div>
              <p className="font-bold text-gray-700">{user?.fullname || 'Bộ Phận Kế Toán'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
