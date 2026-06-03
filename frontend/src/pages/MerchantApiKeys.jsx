import React, { useState, useEffect } from 'react';
import { PartnerService } from '../services/api';
import { Key, Copy, Check, Terminal, RefreshCw, AlertCircle, FileCode } from 'lucide-react';

export default function MerchantApiKeys() {
  const [apiKey, setApiKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('curl'); // curl | node | python

  const fetchKey = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await PartnerService.getMerchantApiKey();
      if (res.success && res.data) {
        setApiKey(res.data);
      } else {
        setApiKey(null);
      }
    } catch (err) {
      console.error(err);
      setError('Không thể tải thông tin API Key. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKey();
  }, []);

  const handleGenerateKey = async () => {
    try {
      setGenerating(true);
      setError('');
      setSuccessMsg('');
      const res = await PartnerService.createMerchantApiKey();
      if (res.success && res.data) {
        setApiKey(res.data);
        setSuccessMsg('Đã cấp API Key thành công! Hãy lưu giữ khóa này bảo mật.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Không thể tạo mới API Key.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCodeSnippet = () => {
    const keyStr = apiKey ? apiKey.api_key : 'AG_PARTNER_YOUR_API_KEY_HERE';
    switch (activeTab) {
      case 'curl':
        return `# 1. Tính toán cước phí & khoảng cách chặng
curl -X POST http://localhost:5000/api/partner/calculate-fee \\
  -H "X-API-Key: ${keyStr}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sender_address": "120 Điện Biên Phủ, Đà Nẵng",
    "receiver_address": "45 Lê Lợi, Hải Châu, Đà Nẵng",
    "weight_gram": 500,
    "length_cm": 15,
    "width_cm": 10,
    "height_cm": 10
  }'

# 2. Tạo đơn vận chuyển tự động
curl -X POST http://localhost:5000/api/partner/create-order \\
  -H "X-API-Key: ${keyStr}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sender_address": "120 Điện Biên Phủ, Đà Nẵng",
    "receiver_address": "45 Lê Lợi, Hải Châu, Đà Nẵng",
    "receiver_name": "Nguyễn Văn A",
    "receiver_phone": "0905123456",
    "weight_gram": 500,
    "length_cm": 15,
    "width_cm": 10,
    "height_cm": 10,
    "cod_amount": 250000,
    "description": "Đơn hàng tích hợp B2B từ Coffee Shop"
  }'`;

      case 'node':
        return `const axios = require('axios');

const API_KEY = '${keyStr}';
const BASE_URL = 'http://localhost:5000/api/partner';

// Tạo đơn vận chuyển sang Antigravity Logistics
async function createShippingOrder() {
  try {
    const response = await axios.post(\`\${BASE_URL}/create-order\`, {
      sender_address: "120 Điện Biên Phủ, Đà Nẵng",
      receiver_address: "45 Lê Lợi, Hải Châu, Đà Nẵng",
      receiver_name: "Nguyễn Văn A",
      receiver_phone: "0905123456",
      weight_gram: 500,
      length_cm: 15,
      width_cm: 10,
      height_cm: 10,
      cod_amount: 250000,
      description: "Đơn hàng cà phê mang đi tích hợp B2B"
    }, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log("Tạo đơn B2B thành công:", response.data);
    return response.data.data.order_id;
  } catch (error) {
    console.error("Lỗi tích hợp API:", error.response?.data || error.message);
  }
}`;

      case 'python':
        return `import requests

API_KEY = "${keyStr}"
BASE_URL = "http://localhost:5000/api/partner"

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

# Tạo đơn vận chuyển tự động
def create_shipping_order():
    payload = {
        "sender_address": "120 Điện Biên Phủ, Đà Nẵng",
        "receiver_address": "45 Lê Lợi, Hải Châu, Đà Nẵng",
        "receiver_name": "Nguyễn Văn A",
        "receiver_phone": "0905123456",
        "weight_gram": 500,
        "length_cm": 15,
        "width_cm": 10,
        "height_cm": 10,
        "cod_amount": 250000,
        "description": "Đơn hàng cafe B2B"
    }
    
    response = requests.post(f"{BASE_URL}/create-order", json=payload, headers=headers)
    if response.status_code == 201:
        data = response.json()
        print(f"Thành công! Mã vận đơn: {data['data']['order_id']}")
    else:
        print(f"Lỗi: {response.text}")

create_shipping_order()`;
      default:
        return '';
    }
  };

  return (
    <div className="w-full relative animate-fade-in text-black font-sans">
      {/* Alert panels */}
      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 mb-6 rounded-r-2xl shadow-sm">
          <div className="text-sm font-semibold text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 mb-6 rounded-r-2xl shadow-sm">
          <div className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </div>
        </div>
      )}

      {/* API Key Management Block */}
      <section className="glow-card p-8 border border-black/5 bg-white/70 backdrop-blur-md rounded-3xl shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-accent-purple" />
              <h2 className="text-base font-extrabold text-black uppercase tracking-wider font-display">QUẢN LÝ B2B API KEY</h2>
            </div>
            <p className="text-[10px] text-mute uppercase font-black tracking-widest leading-relaxed">
              Tích hợp hệ thống cửa hàng của bạn trực tiếp với nền tảng vận chuyển Antigravity
            </p>
          </div>
          <button
            onClick={handleGenerateKey}
            disabled={generating || loading}
            className="px-5 py-3 bg-gradient-to-r from-accent-purple to-purple-600 hover:from-purple-600 hover:to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-purple-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2 self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            {apiKey ? 'CẤP LẠI API KEY MỚI' : 'TẠO API KEY'}
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-mute font-bold uppercase tracking-widest animate-pulse">
            Đang truy vấn API Key...
          </div>
        ) : apiKey ? (
          <div className="space-y-4">
            <div className="bg-black/5 border border-black/5 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <span className="text-[8px] font-black text-mute uppercase tracking-widest">Khóa API hiện tại (Bảo mật)</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-black select-all break-all pr-4 block">
                    {apiKey.api_key}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 rounded-xl border border-black/10 hover:bg-black/5 text-black text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0 bg-transparent"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'ĐÃ SAO CHÉP' : 'SAO CHÉP'}
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-mute uppercase tracking-wider pl-1">
              <span>Được tạo lập vào:</span>
              <span className="text-black">{new Date(apiKey.created_at).toLocaleString('vi-VN')}</span>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-black/10 rounded-2xl text-xs font-bold text-mute uppercase tracking-wider bg-black/[0.01]">
            Bạn chưa khởi tạo API Key nào. Hãy nhấn nút phía trên để bắt đầu tích hợp!
          </div>
        )}
      </section>

      {/* Developer Documentation Block */}
      <section className="glow-card p-8 border border-black/5 bg-white/70 backdrop-blur-md rounded-3xl shadow-sm">
        <div className="space-y-1.5 mb-6 border-b border-black/5 pb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-accent-purple" />
            <h2 className="text-base font-extrabold text-black uppercase tracking-wider font-display">TÀI LIỆU TÍCH HỢP CHO LẬP TRÌNH VIÊN</h2>
          </div>
          <p className="text-[10px] text-mute uppercase font-black tracking-widest">
            Tài liệu hướng dẫn kết nối HTTP RESTful API chi tiết
          </p>
        </div>

        {/* Documentation details */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-black">1. Thông tin cấu hình chính</h3>
              <ul className="space-y-2 text-xs text-mute font-semibold">
                <li className="flex justify-between border-b border-black/5 pb-1">
                  <span>Base API URL:</span>
                  <span className="font-mono text-black font-extrabold">http://localhost:5000/api/partner</span>
                </li>
                <li className="flex justify-between border-b border-black/5 pb-1">
                  <span>Header Authorization:</span>
                  <span className="font-mono text-black font-extrabold">X-API-Key</span>
                </li>
                <li className="flex justify-between border-b border-black/5 pb-1">
                  <span>Content-Type:</span>
                  <span className="font-mono text-black font-extrabold">application/json</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-black">2. Các tài nguyên endpoints khả dụng</h3>
              <ul className="space-y-2 text-xs font-semibold text-mute">
                <li className="flex items-center gap-2 border-b border-black/5 pb-1">
                  <span className="bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded text-[8px] font-black font-mono">POST</span>
                  <span className="font-mono text-black">/calculate-fee</span>
                  <span className="text-[10px] text-mute/70 font-sans ml-auto">Ước tính cước phí</span>
                </li>
                <li className="flex items-center gap-2 border-b border-black/5 pb-1">
                  <span className="bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded text-[8px] font-black font-mono">POST</span>
                  <span className="font-mono text-black">/create-order</span>
                  <span className="text-[10px] text-mute/70 font-sans ml-auto">Đẩy đơn vận chuyển</span>
                </li>
                <li className="flex items-center gap-2 border-b border-black/5 pb-1">
                  <span className="bg-cyan-500/10 text-cyan-600 px-1.5 py-0.5 rounded text-[8px] font-black font-mono">GET</span>
                  <span className="font-mono text-black">/track-order/:id</span>
                  <span className="text-[10px] text-mute/70 font-sans ml-auto">Tra cứu lịch trình</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Interactive Code Snippet Tabs */}
          <div className="space-y-4 pt-4 border-t border-black/5">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-accent-purple" />
                <span>Ví dụ tích hợp code mẫu</span>
              </h3>

              {/* Tab Toggles */}
              <div className="bg-black/5 p-1 rounded-xl flex gap-1 shadow-sm">
                <button
                  onClick={() => setActiveTab('curl')}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    activeTab === 'curl' ? 'bg-accent-purple text-white shadow-sm' : 'text-mute hover:text-black'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setActiveTab('node')}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    activeTab === 'node' ? 'bg-accent-purple text-white shadow-sm' : 'text-mute hover:text-black'
                  }`}
                >
                  Node.js
                </button>
                <button
                  onClick={() => setActiveTab('python')}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    activeTab === 'python' ? 'bg-accent-purple text-white shadow-sm' : 'text-mute hover:text-black'
                  }`}
                >
                  Python
                </button>
              </div>
            </div>

            {/* Code Content display */}
            <div className="relative rounded-2xl overflow-hidden bg-[#0c081f] text-white shadow-inner font-mono text-[11px] p-5 leading-relaxed overflow-x-auto border border-white/5">
              <pre className="whitespace-pre">{getCodeSnippet()}</pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
