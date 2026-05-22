import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FinanceService, AuthService } from '../services/api';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

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

  useEffect(() => {
    fetchData();
  }, []);

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

  const handlePayInvoice = async (invoiceId) => {
    const isConfirmed = window.confirm(`Bạn có chắc chắn muốn xác nhận thanh toán/đối soát cho hóa đơn ${invoiceId} không?`);
    if (!isConfirmed) return;

    try {
      const res = await FinanceService.payInvoice(invoiceId);
      if (res.success) {
        showToast(res.message);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi duyệt thanh toán hóa đơn.', 'error');
    }
  };

  return (
    <div className="bg-canvas min-h-screen text-black relative overflow-hidden font-sans">
      {/* Background neon light blob */}
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
            <h1 className="text-3xl font-extrabold tracking-tight text-black font-display uppercase mb-1 text-glow-purple">Billing & Settlement</h1>
            <p className="text-mute text-sm font-medium">Reconcile merchant disbursements, generate aggregate statements, and process QR receipts.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              to="/admin" 
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-accent-purple/30 rounded-full text-xs font-extrabold text-accent-purple bg-transparent hover:bg-[#6e19f1] hover:text-white shadow-[0_2px_8px_rgba(94,14,215,0.1)] hover:shadow-[0_4px_15px_rgba(94,14,215,0.25)] transition-all cursor-pointer"
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
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-850 border border-emerald-200 shadow-[0_2px_8px_rgba(16,185,129,0.08)]">
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
                            <div className="p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-xl">
                              <span className="font-bold text-emerald-800 uppercase tracking-wider text-[9px] flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">account_balance</span>
                                <span>Tài khoản Merchant thụ hưởng:</span>
                              </span>
                              <div className="mt-2 font-semibold text-black space-y-0.5 text-xs">
                                <div>Ngân hàng: <span className="font-extrabold text-accent-purple">{inv.merchant_bank_info.bank_name}</span></div>
                                <div>STK: <span className="font-extrabold text-accent-purple">{inv.merchant_bank_info.account_no}</span></div>
                                <div>Chủ tài khoản: <span className="font-extrabold text-accent-purple">{inv.merchant_bank_info.account_name}</span></div>
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
                                <img src={inv.vietqr_url} alt="VietQR Pay-In" className="h-16 w-16 object-contain hover:scale-105 transition-all duration-300" />
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
      </main>
    </div>
  );
}
