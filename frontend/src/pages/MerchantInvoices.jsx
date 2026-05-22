import React, { useEffect, useState } from 'react';
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
    <div className="bg-canvas min-h-screen py-10 px-6 lg:px-16 relative overflow-hidden">
      {/* Background neon glows */}
      <div className="neon-aurora-blob bg-accent-purple/10 w-[500px] h-[500px] -top-20 -left-20 animate-pulse"></div>
      <div className="neon-aurora-blob bg-cyan-500/5 w-[500px] h-[500px] bottom-10 right-10 animate-pulse" style={{ animationDuration: '6s' }}></div>

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

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 border-b border-black/10 pb-6 relative z-10">
        <div>
          <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest block mb-1">Financial Reconciliation</span>
          <h1 className="text-3xl font-black text-black tracking-widest uppercase font-display text-glow-purple">HÓA ĐƠN ĐỐI SOÁT</h1>
          <p className="mt-2 text-xs text-mute font-bold uppercase tracking-wider">Quản lý các đợt đối soát tài chính cước phí vận chuyển và dòng tiền COD thu hộ</p>
        </div>
        <button 
          onClick={fetchInvoicesAndProfile} 
          className="btn-secondary px-5 py-3 text-xs uppercase tracking-widest font-extrabold flex items-center gap-2 h-12 self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Tải lại danh sách
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-700 text-xs p-4 rounded-xl mb-8 border border-rose-200 font-bold uppercase tracking-wider relative z-10">
          {error}
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
                      <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/60 text-xs">
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
                    ) : (
                      <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200/60 flex flex-col md:flex-row items-center gap-6">
                        {inv.vietqr_url && (
                          <div className="border border-black/10 p-2.5 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] shrink-0 flex flex-col items-center">
                            <img src={inv.vietqr_url} alt="VietQR" className="h-32 w-32 object-contain" />
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
    </div>
  );
}
