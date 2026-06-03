import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { FinanceService, AuthService } from '../services/api';
import { RefreshCw, CreditCard, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

const POPULAR_BANKS = [
  'Vietcombank',
  'MB Bank (Ngân hàng Quân đội)',
  'Techcombank',
  'BIDV',
  'VietinBank',
  'Agribank',
  'ACB',
  'VPBank',
  'Sacombank',
  'VIB',
  'TPBank'
];

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
  const merchantName = invoice.merchant_name || 'Cửa hàng của tôi';
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

export default function MerchantInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Bank account states (Phase 1)
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankOwner, setBankOwner] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Accordion state (Phase 3)
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
  const [printInvoice, setPrintInvoice] = useState(null);

  const handlePrint = (invoice) => {
    setPrintInvoice(invoice);
    setTimeout(() => {
      window.print();
      setPrintInvoice(null);
    }, 150);
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const fetchInvoicesAndProfile = async () => {
    try {
      setLoading(true);
      const [invRes, profileRes] = await Promise.all([
        FinanceService.getInvoices(),
        AuthService.getProfile().catch(() => ({ success: false, data: null }))
      ]);

      if (invRes.success) {
        setInvoices(invRes.data);
      }
      if (profileRes.success && profileRes.data) {
        setBankName(profileRes.data.bank_name || '');
        setBankAccount(profileRes.data.bank_account || '');
        setBankOwner(profileRes.data.bank_owner || '');
      }
    } catch (err) {
      console.error(err);
      setError('Không thể tải thông tin đối soát tài chính.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoicesAndProfile();
  }, []);

  const handleSaveBankInfo = async (e) => {
    e.preventDefault();
    if (!bankName || !bankAccount || !bankOwner) {
      showToast('Vui lòng điền đầy đủ các trường thông tin!', 'error');
      return;
    }

    try {
      setProfileSaving(true);
      const res = await AuthService.updateProfile({
        bank_name: bankName,
        bank_account: bankAccount,
        bank_owner: bankOwner
      });

      if (res.success) {
        showToast('Cập nhật tài khoản thụ hưởng thành công!');
        fetchInvoicesAndProfile();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể lưu cấu hình ngân hàng.', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const toggleInvoiceAccordion = (invoiceId) => {
    setExpandedInvoiceId(expandedInvoiceId === invoiceId ? null : invoiceId);
  };

  return (
    <div className="w-full relative animate-fade-in">
      {/* Toast Alert */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-center p-4 rounded-xl shadow-[0_4px_25px_rgba(0,0,0,0.06)] border backdrop-blur-2xl transition-all duration-300 ${
          toast.type === 'error' 
            ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-[0_2px_15px_rgba(244,63,94,0.1)]' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-[0_2px_15px_rgba(16,185,129,0.1)]'
        }`}>
          <span className="font-extrabold mr-2 uppercase tracking-widest text-xs">{toast.type === 'error' ? 'Lỗi:' : 'Thành công:'}</span>
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 mb-8 rounded-r-2xl shadow-sm relative z-10">
          <div className="text-sm font-semibold text-rose-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        </div>
      )}

      {/* Main Grid Layout for Bank Configuration and Invoice Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Column: Bank Configuration (4 columns) */}
        <div className="lg:col-span-4 bg-white/60 border border-black/10 p-6 rounded-2xl shadow-sm h-fit hover:border-accent-purple/40 hover:shadow-[0_10px_25px_rgba(94,14,215,0.08)] transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="text-accent-purple w-5 h-5" />
            <h2 className="text-sm font-extrabold text-black tracking-wider uppercase font-display text-glow-purple">Cấu hình Thụ hưởng</h2>
          </div>
          
          <p className="text-xs text-mute font-semibold mb-6 leading-relaxed">
            Nhập tài khoản ngân hàng của bạn. Khi nền tảng đối soát và thanh toán tiền COD thu hộ dư cho bạn, tiền sẽ được chuyển khoản trực tiếp vào tài khoản này.
          </p>
          
          <form onSubmit={handleSaveBankInfo} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-mute uppercase tracking-wider mb-2">Tên ngân hàng</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-3 border border-black/10 rounded-md text-xs font-semibold bg-white text-black focus:outline-none focus:border-accent-purple transition-all"
              >
                <option value="">-- Chọn ngân hàng --</option>
                {POPULAR_BANKS.map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-mute uppercase tracking-wider mb-2">Số tài khoản</label>
              <input
                type="text"
                placeholder="Nhập số tài khoản ngân hàng..."
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full px-4 py-3 border border-black/10 rounded-md text-xs font-semibold bg-white text-black focus:outline-none focus:border-accent-purple transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-mute uppercase tracking-wider mb-2">Họ tên chủ tài khoản</label>
              <input
                type="text"
                placeholder="Nhập họ tên không dấu (ví dụ: NGUYEN VAN A)..."
                value={bankOwner}
                onChange={(e) => setBankOwner(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-black/10 rounded-md text-xs font-semibold bg-white text-black focus:outline-none focus:border-accent-purple transition-all uppercase"
              />
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="w-full py-3 bg-accent-purple text-white text-xs font-extrabold rounded-full hover:bg-[#6e19f1] active:scale-95 shadow-[0_4px_12px_rgba(94,14,215,0.22)] hover:shadow-[0_6px_20px_rgba(94,14,215,0.38)] cursor-pointer transition-all disabled:bg-black/10 disabled:text-black/35 mt-2 uppercase tracking-wider"
            >
              {profileSaving ? 'Đang lưu...' : 'Lưu tài khoản'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-dashed border-black/10 flex items-start gap-2 text-[10px] text-mute font-semibold leading-relaxed">
            <ShieldCheck className="text-emerald-500 w-4 h-4 shrink-0 mt-0.5" />
            <span>Thông tin tài khoản được bảo mật và chỉ được dùng cho mục đích đối soát tài chính COD.</span>
          </div>
        </div>

        {/* Right Column: Invoice Lists (8 columns) */}
        <div className="lg:col-span-8 flex flex-col bg-transparent min-w-0">
          {loading ? (
            <div className="flex justify-center items-center py-20 bg-white/40 border border-black/10 rounded-2xl shadow-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-purple"></div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="glow-card p-12 text-center text-mute border border-dashed border-black/10 font-bold uppercase tracking-wider bg-white/40">
              Bạn chưa có hóa đơn đối soát nào được khởi tạo.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {invoices.map((inv) => (
                <div key={inv.invoice_id} className="glow-card p-6 border border-black/10 bg-white/50 hover:border-accent-purple/30 transition-all duration-300">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 pb-4 border-b border-black/5">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-black tracking-widest font-display text-glow-purple">{inv.invoice_id}</span>
                        {inv.status === 'DA_THANH_TOAN' ? (
                          <span className="px-2.5 py-1 text-[9px] font-black tracking-widest rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-[0_2px_8px_rgba(16,185,129,0.08)] uppercase">
                            Đã thanh toán đối soát
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-[9px] font-black tracking-widest rounded-full bg-amber-50 text-amber-800 border border-amber-200 shadow-[0_2px_8px_rgba(245,158,11,0.08)] uppercase animate-pulse">
                            Chờ đối soát thanh toán
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-mute font-bold uppercase tracking-wider mt-2">
                        Khởi tạo: {new Date(inv.created_at).toLocaleString('vi-VN')}
                        {inv.processed_at && ` • Hoàn tất: ${new Date(inv.processed_at).toLocaleString('vi-VN')}`}
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <span className="text-[9px] text-mute uppercase font-black tracking-widest block mb-0.5">Số tiền thực tế thực nhận (sau phí)</span>
                      <span className={`text-2xl font-black font-display ${inv.net_payout >= 0 ? 'text-glow-green text-emerald-700' : 'text-glow-rose text-rose-700'}`}>
                        {inv.net_payout >= 0 ? '+' : ''}{inv.net_payout.toLocaleString()} đ
                      </span>
                    </div>
                  </div>

                  {/* Financial detail cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-black/[0.02] p-4 rounded-xl text-xs border border-black/5 mb-5 text-black">
                    <div>
                      <span className="text-mute font-bold uppercase text-[9px] tracking-wider">Tổng COD thu hộ từ Khách</span>
                      <div className="font-extrabold text-black text-sm mt-1">{inv.total_cod.toLocaleString()} đ</div>
                    </div>
                    <div>
                      <span className="text-mute font-bold uppercase text-[9px] tracking-wider">Tổng phí ship & bảo hiểm khấu trừ</span>
                      <div className="font-extrabold text-black text-sm mt-1">{inv.total_fees.toLocaleString()} đ</div>
                    </div>
                    <div>
                      <span className="text-mute font-bold uppercase text-[9px] tracking-wider">Trạng thái thanh toán</span>
                      <div className="font-extrabold text-sm mt-1 uppercase tracking-wider">
                        {inv.net_payout >= 0 ? (
                          <span className="text-emerald-700 font-extrabold">Nền tảng thanh toán cho bạn</span>
                        ) : (
                          <span className="text-rose-700 font-extrabold">Bạn cần thanh toán cho Nền tảng</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reconcile direction / VietQR billing rendering */}
                  <div className="pt-3 border-t border-dashed border-black/5">
                    {inv.net_payout >= 0 ? (
                      <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/60 text-xs flex flex-col sm:flex-row items-center gap-4">
                        {inv.vietqr_url && (
                          <div className="border border-black/10 p-1.5 bg-white rounded-lg flex-shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.04)] no-print">
                            <img src={inv.vietqr_url} alt="VietQR Pay-Out" className="h-32 w-32 object-contain" />
                          </div>
                        )}
                        <div className="flex-1">
                          <span className="font-black text-emerald-800 uppercase tracking-wider block mb-2 text-[10px]">Thông tin tài khoản nhận tiền của bạn:</span>
                          {inv.merchant_bank_info ? (
                            <div className="font-bold text-black leading-relaxed uppercase tracking-wider text-[10px] space-y-1">
                              <div>Ngân hàng: <span className="text-glow-purple text-black font-black">{inv.merchant_bank_info.bank_name}</span></div>
                              <div>Số tài khoản: <span className="text-glow-purple text-black font-black">{inv.merchant_bank_info.account_no}</span></div>
                              <div>Tên chủ tài khoản: <span className="text-glow-purple text-black font-black">{inv.merchant_bank_info.account_name}</span></div>
                            </div>
                          ) : (
                            <span className="text-amber-700 font-bold uppercase tracking-wider text-[10px] block">Bạn chưa cấu hình tài khoản ngân hàng. Vui lòng cập nhật tài khoản ở cột bên trái để hệ thống chuyển khoản đối soát.</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200/60 flex flex-col md:flex-row items-center gap-6">
                        {inv.vietqr_url && (
                          <div className="border border-black/10 p-2.5 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] shrink-0 flex flex-col items-center">
                            <img src={inv.vietqr_url} alt="VietQR" className="h-36 w-36 object-contain" />
                            <span className="text-[9px] text-mute mt-1.5 font-black uppercase tracking-widest">MB Bank - 0329603475</span>
                          </div>
                        )}
                        <div className="text-xs space-y-2.5 flex-1">
                          <span className="font-black text-rose-800 uppercase text-sm tracking-wider block">Quét mã QR để Thanh toán cước phí còn nợ</span>
                          <p className="text-black font-semibold leading-relaxed">
                            Tổng COD của bạn nhỏ hơn chi phí vận chuyển của các đơn hàng trong đợt này. Bạn cần thanh toán số tiền còn thiếu là <strong className="text-rose-700 font-black">{Math.abs(inv.net_payout).toLocaleString()} đ</strong>.
                          </p>
                          <div className="p-3 bg-black/[0.02] border border-black/5 rounded-lg text-[10px] font-bold text-mute leading-relaxed space-y-1.5 uppercase tracking-wider">
                            <div>Chuyển khoản thủ công:</div>
                            <div>Ngân hàng: <span className="text-black font-black">MB Bank (Military Bank)</span></div>
                            <div>Số tài khoản: <span className="text-black font-black">0329603475</span></div>
                            <div>Nội dung: <span className="text-rose-700 font-black bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded shadow-[0_2px_6px_rgba(244,63,94,0.15)]">AG_PAY_{inv.invoice_id}</span></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Accordion Collapsible order listing detail (Phase 3) */}
                  {inv.orders && inv.orders.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-black/5">
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
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-accent-purple hover:text-[#6e19f1] transition-colors cursor-pointer"
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

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

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
              <p className="font-extrabold text-black">{printInvoice.merchant_name || 'Cửa hàng của tôi'} (ID: {printInvoice.merchant_id})</p>
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
              <p className="font-bold text-gray-700">Bộ Phận Kế Toán</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
