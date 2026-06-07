import React, { useEffect, useState, useRef } from 'react';
import { OrderService, AuthService, TrackingService } from '../services/api';
import { printWaybill } from '../utils/waybill';
import { Html5Qrcode } from 'html5-qrcode';

export default function WarehouseDashboard() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // Tab control: 'hub' | 'history' | 'account'
  const [activeTab, setActiveTab] = useState('hub');

  // History sub-tab control: 'in' | 'out'
  const [historySubTab, setHistorySubTab] = useState('in');

  // Chế độ quét: 'inspect' (thủ công) | 'auto_in' (Nhập kho tự động) | 'auto_out' (Xuất kho tự động)
  const [scanMode, setScanMode] = useState('inspect');

  // Refs for HTML5 QR code scanning instance
  const html5QrcodeRef = useRef(null);
  const scannedBufferRef = useRef({});

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraError, setCameraError] = useState('');

  // Stop camera scanning safely
  const stopCamera = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
      } catch (e) {
        console.error("Error stopping camera", e);
      }
      html5QrcodeRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start camera scanning with automatic back camera resolution focus
  const startCamera = async () => {
    setCameraError('');
    setIsCameraActive(true);
    
    // Clear any previous scanner
    if (html5QrcodeRef.current) {
      await stopCamera();
    }

    try {
      const devices = await Html5Qrcode.getCameras();
      setCameraDevices(devices);
      
      if (devices.length === 0) {
        setCameraError('Không tìm thấy thiết bị camera nào!');
        setIsCameraActive(false);
        return;
      }

      // Default to back camera
      const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('sau'));
      const initialCamId = backCam ? backCam.id : devices[0].id;
      setSelectedCameraId(initialCamId);

      // Create instance on viewer element
      const scanner = new Html5Qrcode("camera-reader");
      html5QrcodeRef.current = scanner;

      await scanner.start(
        initialCamId,
        {
          fps: 15,
          disableFlip: false
        },
        (decodedText) => {
          handleCameraDecoded(decodedText);
        },
        (errorMessage) => {}
      );
    } catch (err) {
      console.error("Camera startup error", err);
      setCameraError(err.message || 'Không thể truy cập camera. Vui lòng cấp quyền truy cập trong cài đặt trình duyệt!');
      setIsCameraActive(false);
    }
  };

  // Switch camera on the fly
  const switchCamera = async (camId) => {
    setSelectedCameraId(camId);
    if (!html5QrcodeRef.current) return;

    try {
      if (html5QrcodeRef.current.isScanning) {
        await html5QrcodeRef.current.stop();
      }
      
      await html5QrcodeRef.current.start(
        camId,
        {
          fps: 15,
          disableFlip: false
        },
        (decodedText) => {
          handleCameraDecoded(decodedText);
        },
        (errorMessage) => {}
      );
    } catch (err) {
      console.error("Error switching camera", err);
      setCameraError('Lỗi chuyển đổi thiết bị camera!');
    }
  };

  // Triggered on successful scanning
  const handleCameraDecoded = (code) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    // Debounce: prevent same code scanning within 2.5s
    const now = Date.now();
    const lastScanned = scannedBufferRef.current[cleanCode];
    if (lastScanned && (now - lastScanned < 2500)) {
      return;
    }
    
    scannedBufferRef.current[cleanCode] = now;

    // Trigger physical device vibration feedback (150ms)
    if (navigator.vibrate) {
      navigator.vibrate(150);
    }

    setHubScanInput(cleanCode);

    // Auto-trigger corresponding search or scan logic
    if (scanMode === 'inspect') {
      handleHubSearch(cleanCode);
    } else if (scanMode === 'auto_in') {
      handleAutoCheckin(cleanCode);
    } else if (scanMode === 'auto_out') {
      handleAutoCheckout(cleanCode);
    }
  };

  // Stop camera when active tab changes
  useEffect(() => {
    if (activeTab !== 'hub') {
      stopCamera();
    }
  }, [activeTab]);

  // Stop camera when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Audio synthesizer for sorting hub handheld PDA scanner sound effects
  const playSound = (type = 'success') => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === 'success') {
        // Double pleasant high-pitch beeps (pip-pip)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.08);
        
        setTimeout(() => {
          try {
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(800, audioCtx.currentTime);
            gain2.gain.setValueAtTime(0.06, audioCtx.currentTime);
            osc2.start();
            osc2.stop(audioCtx.currentTime + 0.12);
          } catch (e) {}
        }, 80);
      } else {
        // Low sawtooth buzzer (tèèè)
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.25);
      }
    } catch (e) {
      console.error("Web Audio playback failed", e);
    }
  };

  const handleAutoCheckin = async (code) => {
    setHubActionLoading(true);
    try {
      // 1. Fetch current waybill details to check sequence and prevent conflicts
      const trackRes = await TrackingService.trackOrder(code);
      if (!trackRes.success || !trackRes.data) {
        playSound('error');
        showToast(`Không tìm thấy mã bưu gửi ${code}!`, 'error');
        setHubScanInput('');
        return;
      }
      
      const currentStatus = trackRes.data.current_status;
      
      if (currentStatus === 'DEN_KHO_TRUNG_CHUYEN' || currentStatus === 'ROI_KHO_TRUNG_CHUYEN') {
        playSound('error');
        showToast(`Đơn ${code} đã được xử lý nhập kho trước đó!`, 'error');
        setHubScanInput('');
        return;
      }
      
      if (currentStatus === 'GIAO_THANH_CONG' || currentStatus === 'GIAO_THAT_BAI') {
        playSound('error');
        showToast(`Đơn ${code} đã hoàn thành phát chặng cuối!`, 'error');
        setHubScanInput('');
        return;
      }

      // 2. Perform check-in
      const res = await OrderService.hubCheckin(code, { hub_name: selectedHub });
      if (res.success) {
        playSound('success');
        showToast(`[AUTO-IN] Nhập kho thành công đơn ${code} tại ${selectedHub}!`, 'success');
        setHubScanInput('');
        fetchProfile(); // Refresh statistics
      }
    } catch (err) {
      console.error(err);
      playSound('error');
      showToast(err.response?.data?.message || `Lỗi nhập kho đơn ${code}!`, 'error');
      setHubScanInput('');
    } finally {
      setHubActionLoading(false);
    }
  };

  const handleAutoCheckout = async (code) => {
    setHubActionLoading(true);
    try {
      // 1. Fetch current waybill details to check sequence
      const trackRes = await TrackingService.trackOrder(code);
      if (!trackRes.success || !trackRes.data) {
        playSound('error');
        showToast(`Không tìm thấy mã bưu gửi ${code}!`, 'error');
        setHubScanInput('');
        return;
      }
      
      const currentStatus = trackRes.data.current_status;
      
      if (currentStatus !== 'DEN_KHO_TRUNG_CHUYEN') {
        playSound('error');
        showToast(`Chặn: Đơn ${code} chưa được quét NHẬP KHO (IN) tại trạm này!`, 'error');
        setHubScanInput('');
        return;
      }

      // 2. Perform check-out
      const res = await OrderService.hubCheckout(code, { hub_name: selectedHub });
      if (res.success) {
        playSound('success');
        showToast(`[AUTO-OUT] Xuất bến thành công đơn ${code} khỏi ${selectedHub}!`, 'success');
        setHubScanInput('');
        fetchProfile(); // Refresh statistics
      }
    } catch (err) {
      console.error(err);
      playSound('error');
      showToast(err.response?.data?.message || `Lỗi xuất bến đơn ${code}!`, 'error');
      setHubScanInput('');
    } finally {
      setHubActionLoading(false);
    }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    const code = hubScanInput.trim().toUpperCase();
    if (!code) return;

    if (scanMode === 'inspect') {
      handleHubSearch(code);
    } else if (scanMode === 'auto_in') {
      await handleAutoCheckin(code);
    } else if (scanMode === 'auto_out') {
      await handleAutoCheckout(code);
    }
  };

  // Profile states
  const [profile, setProfile] = useState({
    fullname: '',
    username: '',
    role: '',
    workplace_name: '',
    workplace_region: '',
    stats: {
      total_in: 0,
      total_out: 0
    }
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Warehouse Hub Console States
  const [selectedHub, setSelectedHub] = useState('Kho Trung Chuyển Miền Bắc (Từ Sơn, Bắc Ninh)');
  const [hubScanInput, setHubScanInput] = useState('');
  const [hubOrderData, setHubOrderData] = useState(null);
  const [hubLoading, setHubLoading] = useState(false);
  const [hubActionLoading, setHubActionLoading] = useState(false);
  const [hubPlannedPath, setHubPlannedPath] = useState('');
  const [hubIsInterRegional, setHubIsInterRegional] = useState(false);

  // Warehouse history list state
  const [warehouseHistory, setWarehouseHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Live clock state
  const [systemTime, setSystemTime] = useState(new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await AuthService.getProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        if (res.data.workplace_name) {
          setSelectedHub(res.data.workplace_name);
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      showToast("Không thể tải thông tin tài khoản", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchWarehouseHistoryList = async () => {
    try {
      setHistoryLoading(true);
      const res = await OrderService.getWarehouseHistory();
      if (res.success) {
        setWarehouseHistory(res.data);
      }
    } catch (err) {
      console.error("Error fetching warehouse history:", err);
      showToast("Không thể tải lịch sử kiểm kho", "error");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchWarehouseHistoryList();
    }
  }, [activeTab]);

  // Dynamic geocoding check for transit routing details
  useEffect(() => {
    if (hubOrderData) {
      const latS = hubOrderData.sender_lat;
      const latR = hubOrderData.receiver_lat;

      if (latS !== undefined && latS !== null && latR !== undefined && latR !== null) {
        const getReg = (lat) => {
          const latVal = parseFloat(lat);
          if (isNaN(latVal)) return 'BAC';
          if (latVal >= 19.5) return 'BAC';
          if (latVal >= 14.0) return 'TRUNG';
          return 'NAM';
        };
        
        const getHubName = (reg) => {
          if (reg === 'BAC') return 'Kho Miền Bắc (Từ Sơn)';
          if (reg === 'TRUNG') return 'Kho Miền Trung (An Tây)';
          return 'Kho Miền Nam (Bình Hòa)';
        };
        
        const regS = getReg(latS);
        const regR = getReg(latR);
        
        setHubIsInterRegional(regS !== regR);
        if (regS === regR) {
          setHubPlannedPath(`Nội miền: Khách gửi ➡️ ${getHubName(regS)} ➡️ Khách nhận`);
        } else {
          setHubPlannedPath(`Liên miền: Khách gửi ➡️ ${getHubName(regS)} ➡️ ${getHubName(regR)} ➡️ Khách nhận`);
        }
      } else {
        const checkRoute = async () => {
          try {
            const sRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(hubOrderData.sender_address)}&format=json&limit=1`, { headers: { 'User-Agent': 'Antigravity-Logistics-Staff/1.0' } });
            await new Promise(r => setTimeout(r, 1200)); // Respect OSM rate limits
            const rRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(hubOrderData.receiver_address)}&format=json&limit=1`, { headers: { 'User-Agent': 'Antigravity-Logistics-Staff/1.0' } });
            if (sRes.ok && rRes.ok) {
              const sData = await sRes.json();
              const rData = await rRes.json();
              if (sData[0] && rData[0]) {
                const latS_f = parseFloat(sData[0].lat);
                const latR_f = parseFloat(rData[0].lat);
                
                const getReg = (lat) => {
                  if (lat >= 19.5) return 'BAC';
                  if (lat >= 14.0) return 'TRUNG';
                  return 'NAM';
                };
                
                const getHubName = (reg) => {
                  if (reg === 'BAC') return 'Kho Miền Bắc (Từ Sơn)';
                  if (reg === 'TRUNG') return 'Kho Miền Trung (An Tây)';
                  return 'Kho Miền Nam (Bình Hòa)';
                };
                
                const regS_f = getReg(latS_f);
                const regR_f = getReg(latR_f);
                
                setHubIsInterRegional(regS_f !== regR_f);
                if (regS_f === regR_f) {
                  setHubPlannedPath(`Nội miền: Khách gửi ➡️ ${getHubName(regS_f)} ➡️ Khách nhận`);
                } else {
                  setHubPlannedPath(`Liên miền: Khách gửi ➡️ ${getHubName(regS_f)} ➡️ ${getHubName(regR_f)} ➡️ Khách nhận`);
                }
              }
            }
          } catch (e) {
            console.error(e);
          }
        };
        checkRoute();
      }
    } else {
      setHubPlannedPath('');
      setHubIsInterRegional(false);
    }
  }, [hubOrderData]);

  const handleHubSearch = async (codeToSearch) => {
    const code = codeToSearch.trim().toUpperCase();
    if (!code) return;
    
    setHubLoading(true);
    setHubOrderData(null);
    try {
      const res = await TrackingService.trackOrder(code);
      if (res.success && res.data) {
        setHubOrderData(res.data);
        showToast(`Tìm thấy đơn hàng ${code}`, 'success');
      } else {
        showToast('Không tìm thấy thông tin bưu gửi!', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Không tìm thấy mã vận đơn hoặc bưu gửi!', 'error');
    } finally {
      setHubLoading(false);
    }
  };

  const handleHubCheckin = async (orderId) => {
    setHubActionLoading(true);
    try {
      const res = await OrderService.hubCheckin(orderId, { hub_name: selectedHub });
      if (res.success) {
        showToast(`Xác nhận nhập kho (IN) thành công tại ${selectedHub}!`, 'success');
        handleHubSearch(orderId);
        fetchProfile(); // Refresh stats
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Lỗi xác nhận nhận nhập kho!', 'error');
    } finally {
      setHubActionLoading(false);
    }
  };

  const handleHubCheckout = async (orderId) => {
    setHubActionLoading(true);
    try {
      const res = await OrderService.hubCheckout(orderId, { hub_name: selectedHub });
      if (res.success) {
        showToast(`Xác nhận xuất bến (OUT) thành công rời ${selectedHub}!`, 'success');
        setHubOrderData(null); // Clear checked out waybill from screen
        setHubScanInput('');  // Clear the input
        fetchProfile(); // Refresh stats
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Lỗi xác nhận xuất bến!', 'error');
    } finally {
      setHubActionLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profile.fullname.trim()) {
      showToast("Vui lòng điền Họ và tên!", "error");
      return;
    }

    try {
      setSavingProfile(true);
      const res = await AuthService.updateProfile({
        fullname: profile.fullname
      });
      if (res.success) {
        showToast("Cập nhật tài khoản thành công!", "success");
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Lỗi lưu thông tin.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('fullname');
    window.location.href = '/login';
  };

  const getInitials = (name) => {
    if (!name) return "WH";
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DEN_KHO_TRUNG_CHUYEN':
        return <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/35 shadow-[0_0_10px_rgba(6,182,212,0.15)]">Đã nhập kho (IN)</span>;
      case 'ROI_KHO_TRUNG_CHUYEN':
        return <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 shadow-[0_0_10px_rgba(16,185,129,0.15)]">Đã rời kho (OUT)</span>;
      case 'CHO_LAY_HANG':
        return <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/35 shadow-[0_0_10px_rgba(245,158,11,0.15)]">Chờ lấy hàng</span>;
      case 'GIAO_THANH_CONG':
        return <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 shadow-[0_0_10px_rgba(16,185,129,0.15)]">Giao thành công</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-white/5 text-white/60 border border-white/10">{status}</span>;
    }
  };

  // Filter histories based on IN (DEN_KHO_TRUNG_CHUYEN) and OUT (ROI_KHO_TRUNG_CHUYEN)
  const inHistory = warehouseHistory.filter(h => h.status === 'DEN_KHO_TRUNG_CHUYEN');
  const outHistory = warehouseHistory.filter(h => h.status === 'ROI_KHO_TRUNG_CHUYEN');

  const filteredHistory = (historySubTab === 'in' ? inHistory : outHistory).filter(h =>
    h.order_id.toLowerCase().includes(historySearch.toLowerCase()) ||
    h.receiver_name.toLowerCase().includes(historySearch.toLowerCase()) ||
    h.receiver_phone.includes(historySearch)
  );

  const totalInCount = profile.stats?.total_in || 0;
  const totalOutCount = profile.stats?.total_out || 0;
  const totalStationActions = totalInCount + totalOutCount;

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-32 bg-[#06101c] min-h-screen text-white relative border-x border-white/5 custom-scrollbar overflow-x-hidden font-sans shadow-2xl">
      {/* Background neon light aurora blobs (Teal theme) */}
      <div className="neon-aurora-blob bg-cyan-500/15 w-[350px] h-[350px] -top-10 -right-10 animate-pulse"></div>
      <div className="neon-aurora-blob bg-emerald-500/10 w-[300px] h-[300px] bottom-20 -left-10 animate-pulse" style={{ animationDuration: '6s' }}></div>
      <div className="absolute inset-0 bg-[radial-gradient(rgba(6,182,212,0.04)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none z-0" />

      {/* Toast Alert */}
      {toast.show && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-55 flex items-center p-4 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.5)] transition-all duration-300 bg-[#071626]/90 backdrop-blur-xl border border-cyan-500/20 text-white animate-slide-in w-[90%] max-w-sm">
          <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse mr-3 shrink-0"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mr-2 shrink-0">{toast.type === 'error' ? 'Lỗi' : 'Hệ Thống'}:</span>
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Top Sat-Net Widget */}
      <div className="flex items-center justify-between bg-white/5 border border-white/10 px-4 py-3 rounded-2xl mb-6 relative overflow-hidden backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 font-mono">WAREHOUSE STAFF ONLINE</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[9px] font-extrabold text-white/70">
          <span className="material-symbols-outlined text-[12px] text-cyan-400 animate-pulse">schedule</span>
          <span>
            {systemTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Header Title block */}
      <div className="mb-6 border-b border-white/5 pb-5 relative z-10">
        <h1 className="text-2xl font-black tracking-tight text-white font-display uppercase text-glow-cyan">
          {activeTab === 'hub' 
            ? 'WAREHOUSE CONSOLE' 
            : activeTab === 'history' 
            ? 'LỊCH SỬ NHẬP XUẤT KHO' 
            : 'HỒ SƠ THỦ KHO'}
        </h1>
        <p className="mt-1 text-[10px] text-white/50 font-bold uppercase tracking-wider leading-relaxed">
          {activeTab === 'hub' 
            ? 'Kiểm kho tại chỗ, nhập trạm (IN) & xuất trạm (OUT) bưu phẩm' 
            : activeTab === 'history' 
            ? 'Nhật ký các lượt quét Nhập kho và Xuất kho chi tiết của cá nhân'
            : 'Quản lý thông tin hồ sơ và báo cáo hiệu suất kiểm kho thời gian thực'}
        </p>
      </div>

      {/* TAB: WAREHOUSE HUB CONSOLE */}
      {activeTab === 'hub' && (
        <div className="space-y-6 relative z-10 animate-fade-in">
          {/* Station Selection */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-md backdrop-blur-md space-y-3">
            <label className="block text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              <span>1. Trạm Trung Chuyển Hiện Tại</span>
            </label>
            <div className="w-full text-xs bg-[#030c14]/80 border border-cyan-500/30 rounded-xl p-4.5 font-bold text-white flex items-center justify-between shadow-[0_0_15px_rgba(6,182,212,0.15)] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-cyan-500 to-transparent"></div>
              <div className="space-y-1">
                <p className="text-[9px] text-cyan-400 font-extrabold uppercase tracking-wider">ĐANG LÀM VIỆC TẠI</p>
                <p className="text-white font-black text-sm tracking-wide text-glow-cyan uppercase">{selectedHub}</p>
              </div>
              <span className="material-symbols-outlined text-[24px] text-cyan-400 opacity-80 animate-pulse">warehouse</span>
            </div>
          </div>

          {/* Segmented Scan Mode Controller */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-4 shadow-md backdrop-blur-md space-y-3">
            <label className="block text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <span className="material-symbols-outlined text-[14px]">tune</span>
              <span>Lựa chọn chế độ quét kiểm kho</span>
            </label>
            <div className="bg-[#030c14]/80 border border-white/10 p-[4px] rounded-2xl flex gap-[4px] relative z-10 shadow-sm">
              <button
                type="button"
                onClick={() => { setScanMode('inspect'); setHubOrderData(null); }}
                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                  scanMode === 'inspect'
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-[0_2px_8px_rgba(6,182,212,0.3)]'
                    : 'text-white/45 hover:text-white hover:bg-white/5'
                }`}
              >
                Thủ công 🔍
              </button>
              <button
                type="button"
                onClick={() => { setScanMode('auto_in'); setHubOrderData(null); }}
                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 ${
                  scanMode === 'auto_in'
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-[0_2px_8px_rgba(6,182,212,0.3)]'
                    : 'text-white/45 hover:text-white hover:bg-white/5'
                }`}
              >
                Auto IN 📥
              </button>
              <button
                type="button"
                onClick={() => { setScanMode('auto_out'); setHubOrderData(null); }}
                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 ${
                  scanMode === 'auto_out'
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-[0_2px_8px_rgba(6,182,212,0.3)]'
                    : 'text-white/45 hover:text-white hover:bg-white/5'
                }`}
              >
                Auto OUT 📤
              </button>
            </div>
          </div>

          {/* Scanner / Barcode Input */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-md backdrop-blur-md space-y-3">
            <label className="block text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <span className="material-symbols-outlined text-[14px]">qr_code_scanner</span>
              <span>2. Quét hoặc Nhập Mã Vận Đơn</span>
            </label>
            <form onSubmit={handleScanSubmit} className="relative flex items-center">
              <span className="material-symbols-outlined text-cyan-400 absolute left-3 select-none">search</span>
              <input
                type="text"
                value={hubScanInput}
                onChange={(e) => setHubScanInput(e.target.value)}
                placeholder={scanMode === 'inspect' ? "Nhập mã vận đơn để đối chiếu..." : "Hãy quét tem vận đơn bưu phẩm..."}
                className="w-full pl-10 pr-24 py-3 bg-[#030c14]/60 border border-white/10 rounded-xl text-xs font-bold text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
              />
              <button
                type="submit"
                disabled={hubLoading}
                className="absolute right-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-600 text-white text-[9px] font-black uppercase tracking-wider rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all cursor-pointer shadow-[0_2px_8px_rgba(6,182,212,0.3)]"
              >
                {hubLoading ? 'ĐANG TÌM...' : (scanMode === 'inspect' ? 'XÁC MINH' : 'QUÉT')}
              </button>
            </form>
            
            {/* Camera Scan Trigger Button */}
            <div className="pt-1.5 flex gap-2">
              <button
                type="button"
                onClick={isCameraActive ? stopCamera : startCamera}
                className={`w-full py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-white/5 ${
                  isCameraActive
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-[0_2px_8px_rgba(239,68,68,0.3)] animate-pulse'
                    : 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 hover:from-teal-500 hover:to-cyan-600 text-cyan-300 hover:text-white shadow-md'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{isCameraActive ? 'videocam_off' : 'photo_camera'}</span>
                <span>{isCameraActive ? '🚫 TẮT MÁY QUẾT CAMERA' : '📷 BẬT MÁY QUẾT CAMERA'}</span>
              </button>
            </div>
          </div>

          {/* Active Camera Scanner Viewport */}
          {isCameraActive && (
            <div className="bg-[#05111d] border border-cyan-500/35 rounded-3xl p-5 shadow-[0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-md space-y-4 animate-slide-up-card relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-500"></div>
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                  </span>
                  <span>MÁY QUẾT CAMERA LIVE</span>
                </span>
                
                {/* Camera source switcher if multiple cameras are detected */}
                {cameraDevices.length > 1 && (
                  <div className="flex items-center gap-1.5 font-sans">
                    <span className="material-symbols-outlined text-[12px] text-white/40">flip_camera_ios</span>
                    <select
                      value={selectedCameraId}
                      onChange={(e) => switchCamera(e.target.value)}
                      className="bg-white/5 border border-white/10 text-[9px] font-bold text-white px-2 py-1 rounded-lg focus:outline-none focus:border-cyan-400"
                    >
                      {cameraDevices.map((device, idx) => (
                        <option key={device.id} value={device.id} className="bg-[#06101c] text-white">
                          {device.label || `Camera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Holographic scanner viewport */}
              <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video flex items-center justify-center">
                {/* Camera feed reader element */}
                <div id="camera-reader" className="w-full h-full object-cover"></div>
                
                {/* Target box bracket overlays */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                  <div className="w-[80%] h-[45%] border-2 border-dashed border-cyan-400/40 rounded-xl relative shadow-[0_0_15px_rgba(6,182,212,0.1)] flex items-center justify-center">
                    {/* Glowing corners */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-cyan-400 rounded-tl-md"></div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-cyan-400 rounded-tr-md"></div>
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-cyan-400 rounded-bl-md"></div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-cyan-400 rounded-br-md"></div>
                    
                    {/* Helper text overlay */}
                    <span className="text-[7.5px] font-black text-cyan-300 uppercase tracking-widest text-center px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md shadow-sm border border-cyan-400/10">
                      CĂN CHỈNH MÃ QR / MÃ VẠCH VÀO KHUNG NÀY
                    </span>
                  </div>
                </div>

                {/* Sweeping laser scanner line */}
                <div className="absolute left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_10px_#06b6d4] animate-scanner-line top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
              </div>

              {/* Status information */}
              <p className="text-[8.5px] text-white/50 font-bold uppercase tracking-wider text-center leading-relaxed italic">
                Ứng dụng tự động rung nhẹ khi camera giải mã thành công mã vận đơn bưu phẩm.
              </p>
            </div>
          )}

          {/* Camera initialization error message */}
          {cameraError && (
            <div className="bg-red-500/10 border border-red-500/35 rounded-2xl p-4.5 text-center text-xs font-semibold text-red-300 flex items-center justify-center gap-2 animate-shake">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>{cameraError}</span>
            </div>
          )}

          {/* Radar target for automatic sorting scan */}
          {(scanMode === 'auto_in' || scanMode === 'auto_out') && (
            <div className="bg-white/5 border border-cyan-500/20 rounded-3xl p-6 shadow-md backdrop-blur-md flex flex-col items-center justify-center text-center py-10 relative overflow-hidden animate-fade-in">
              <div className="absolute inset-0 bg-[radial-gradient(rgba(6,182,212,0.06)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />
              
              {/* Spinning target ring */}
              <div className="relative w-28 h-28 flex items-center justify-center mb-4">
                <div className="absolute inset-0 border-3 border-dashed border-cyan-500/20 rounded-full animate-spin" style={{ animationDuration: '15s' }}></div>
                <div className="absolute w-24 h-24 border border-cyan-400/40 rounded-full animate-ping opacity-35" style={{ animationDuration: '3s' }}></div>
                <div className="absolute w-16 h-16 border-2 border-cyan-400 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <span className="material-symbols-outlined text-[32px] text-cyan-400 animate-pulse">qr_code_2</span>
                </div>
                {/* Horizontal scanner laser sweep */}
                <div className="absolute left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_8px_#06b6d4] animate-scanner-line top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
              </div>
              
              <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest text-glow-cyan">
                {scanMode === 'auto_in' ? 'CHẾ ĐỘ NHẬP KHO TỰ ĐỘNG (AUTO-IN)' : 'CHẾ ĐỘ XUẤT KHO TỰ ĐỘNG (AUTO-OUT)'}
              </p>
              <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider mt-1.5 max-w-[280px] leading-relaxed">
                Hệ thống tự động đã sẵn sàng. Hãy bắn đầu đọc mã vạch/QR của đơn hàng để thực hiện kiểm kho siêu tốc.
              </p>
            </div>
          )}

          {/* Search Result Details - Only visible in Inspect Mode */}
          {scanMode === 'inspect' && (
            hubLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              </div>
            ) : hubOrderData ? (
              <div className="glow-card border border-white/5 rounded-3xl p-5 space-y-5 bg-[#061424]/60 shadow-lg animate-slide-up-card">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-extrabold text-sm text-white tracking-wide">{hubOrderData.order_id}</p>
                    <span className="px-2 py-0.5 text-[8.5px] font-extrabold text-cyan-300 bg-cyan-500/10 rounded-full border border-cyan-500/20 uppercase tracking-widest mt-1 inline-block">
                      {hubOrderData.service_package}
                    </span>
                  </div>
                  {getStatusBadge(hubOrderData.current_status)}
                </div>

                {/* Transit Routing Specific Alert */}
                {hubPlannedPath && (
                  <div className={`p-3.5 rounded-2xl border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${
                    hubIsInterRegional 
                      ? 'bg-amber-500/10 border-amber-500/35 text-amber-300 text-glow-amber animate-pulse'
                      : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 text-glow-cyan'
                  }`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {hubIsInterRegional ? 'warning' : 'info'}
                    </span>
                    <span>LỘ TRÌNH QUY ĐỊNH: {hubPlannedPath}</span>
                  </div>
                )}

                {/* Physical details info */}
                <div className="grid grid-cols-2 gap-3 text-[10px] text-white/50 font-bold uppercase tracking-wider bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
                  <div>Người nhận: <span className="text-white block text-[11px] font-black truncate mt-0.5">{hubOrderData.receiver_name}</span></div>
                  <div>SĐT Nhận: <span className="text-cyan-400 block text-[11px] font-black mt-0.5">{hubOrderData.receiver_phone}</span></div>
                  <div className="col-span-2 pt-2 border-t border-white/5 mt-1">Địa chỉ nhận: <span className="text-white block text-[10.5px] font-semibold leading-relaxed mt-0.5 text-normal font-sans italic">{hubOrderData.receiver_address}</span></div>
                </div>

                {/* Actions Console */}
                <div className="space-y-3.5 pt-2 border-t border-white/5">
                  <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1 font-mono">
                    <span className="material-symbols-outlined text-sm">settings_applications</span>
                    <span>BẢNG ĐIỀU KHIỂN TẠI TRẠM</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* BUTTON 1: CHECK-IN */}
                    <button
                      onClick={() => handleHubCheckin(hubOrderData.order_id)}
                      disabled={
                        hubActionLoading || 
                        hubOrderData.current_status === 'DEN_KHO_TRUNG_CHUYEN' || 
                        hubOrderData.current_status === 'ROI_KHO_TRUNG_CHUYEN' || 
                        hubOrderData.current_status === 'GIAO_THANH_CONG'
                      }
                      className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-teal-600 disabled:from-white/5 disabled:to-white/5 disabled:text-white/20 hover:from-teal-600 hover:to-cyan-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-[0_4px_12px_rgba(6,182,212,0.25)] flex items-center justify-center gap-2 active:scale-95 disabled:scale-100 disabled:shadow-none border border-white/5"
                    >
                      {hubActionLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">login</span>
                          <span>Xác Nhận Nhập Kho (IN)</span>
                        </>
                      )}
                    </button>

                    {/* BUTTON 2: CHECK-OUT */}
                    <button
                      onClick={() => handleHubCheckout(hubOrderData.order_id)}
                      disabled={
                        hubActionLoading || 
                        hubOrderData.current_status !== 'DEN_KHO_TRUNG_CHUYEN'
                      }
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 disabled:from-white/5 disabled:to-white/5 disabled:text-white/20 hover:from-teal-600 hover:to-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-[0_4px_12px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2 active:scale-95 disabled:scale-100 disabled:shadow-none border border-white/5"
                    >
                      {hubActionLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">logout</span>
                          <span>Xác Nhận Xuất Bến (OUT)</span>
                        </>
                      )}
                    </button>

                    {/* BUTTON 3: PRINT WAYBILL TEMPLATE */}
                    <button
                      onClick={() => printWaybill(hubOrderData)}
                      className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-indigo-600 hover:to-cyan-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-[0_4px_12px_rgba(6,182,212,0.25)] flex items-center justify-center gap-2 active:scale-95 border border-white/5"
                    >
                      <span className="material-symbols-outlined text-base">print</span>
                      <span>In Tem Vận Đơn A6 (Print Label)</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 text-xs font-bold text-white/40 shadow-sm animate-fade-in">
                <span className="material-symbols-outlined text-[36px] text-white/20 block mb-3 animate-pulse">warehouse</span>
                <span>Chờ quét hoặc nhập mã bưu gửi để đối chiếu thông tin...</span>
              </div>
            )
          )}
        </div>
      )}

      {/* TAB 2: WAREHOUSE LOG HISTORY WITH IN/OUT SUB-TABS */}
      {activeTab === 'history' && (
        <div className="space-y-6 relative z-10 animate-fade-in">
          {/* Custom IN/OUT segmented sub-tab control */}
          <div className="bg-[#030c14]/80 border border-white/10 p-[4px] rounded-full flex gap-[4px] shadow-md z-10 relative">
            <button
              type="button"
              onClick={() => setHistorySubTab('in')}
              className={`flex-1 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-350 cursor-pointer flex items-center justify-center gap-1 ${
                historySubTab === 'in'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-[0_2px_8px_rgba(6,182,212,0.3)]'
                  : 'text-white/45 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">login</span>
              <span>Lịch sử nhập kho (IN)</span>
            </button>
            <button
              type="button"
              onClick={() => setHistorySubTab('out')}
              className={`flex-1 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-350 cursor-pointer flex items-center justify-center gap-1 ${
                historySubTab === 'out'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-[0_2px_8px_rgba(6,182,212,0.3)]'
                  : 'text-white/45 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">logout</span>
              <span>Lịch sử xuất bến (OUT)</span>
            </button>
          </div>

          {/* Search bar inside history */}
          <div className="relative flex items-center">
            <span className="material-symbols-outlined text-white/30 absolute left-3 select-none">search</span>
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Tìm mã vận đơn, tên hoặc số điện thoại khách..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-xs font-semibold text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
            />
          </div>

          {/* History Orders List */}
          <div className="space-y-4">
            {historyLoading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 text-xs font-bold text-white/40 shadow-sm">
                Không tìm thấy dữ liệu quét {historySubTab === 'in' ? 'nhập kho (IN)' : 'xuất bến (OUT)'} phù hợp.
              </div>
            ) : (
              filteredHistory.map((h) => (
                <div 
                  key={h.log_id} 
                  className="border rounded-3xl p-5 space-y-3 bg-[#061424]/60 border-white/5 hover:border-cyan-500/25 transition-all shadow-md animate-slide-up-card"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-extrabold text-xs text-white tracking-wide">{h.order_id}</p>
                      <p className="text-[9px] text-cyan-400 font-extrabold mt-0.5 font-mono">
                        Thời gian quét: {new Date(h.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(h.time).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    {getStatusBadge(h.status)}
                  </div>

                  <div className="text-xs space-y-1.5 text-white/70 border-t border-white/5 pt-3">
                    <p className="font-semibold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-white/30">person</span>
                      <span>Người nhận: {h.receiver_name} - SĐT: {h.receiver_phone}</span>
                    </p>
                    <p className="text-white/50 flex items-center gap-1.5 leading-relaxed">
                      <span className="material-symbols-outlined text-[14px] text-white/30">location_on</span>
                      <span className="truncate italic">{h.receiver_address}</span>
                    </p>
                    <p className="text-[9.5px] font-semibold text-cyan-300 flex items-center gap-1.5 italic bg-cyan-500/5 p-2 rounded-xl border border-cyan-500/20 leading-relaxed">
                      <span className="material-symbols-outlined text-xs">info</span>
                      <span>Thực hiện: {h.location_info}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: WAREHOUSE STAFF PROFILE & STATISTICS */}
      {activeTab === 'account' && (
        <div className="space-y-6 relative z-10 animate-fade-in">
          {profileLoading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Profile Avatar Card */}
              <div className="flex flex-col items-center py-6 bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl shadow-lg text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-400"></div>
                
                <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-800 flex items-center justify-center text-white text-xl font-extrabold shadow-md mb-3 border border-white/20">
                  {getInitials(profile.fullname)}
                </div>
                
                <h3 className="text-base font-extrabold text-white tracking-wide">{profile.fullname || 'Chưa thiết lập'}</h3>
                <span className="px-2.5 py-0.5 text-[9px] font-black rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 shadow-[0_2px_8px_rgba(6,182,212,0.15)] uppercase mt-2 tracking-widest font-mono">
                  FACILITY COMPTROLLER
                </span>
              </div>

              {/* Work Statistics Section - Premium Custom Glassmorphism */}
              <div className="bg-white/5 border border-white/5 rounded-3xl p-5 space-y-4 shadow-md">
                <h4 className="text-[10px] font-black uppercase text-cyan-400 tracking-widest flex items-center gap-1 font-mono">
                  <span className="material-symbols-outlined text-sm text-cyan-400">equalizer</span>
                  <span>Báo cáo hiệu suất công tác trạm</span>
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Metric 1: Check-Ins */}
                  <div className="bg-[#0b1c1d]/40 border border-cyan-500/10 p-4 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5">
                      <span className="material-symbols-outlined text-[36px]">login</span>
                    </div>
                    <span className="text-[8px] font-extrabold text-cyan-400 uppercase tracking-widest">TỔNG LƯỢT NHẬP (IN)</span>
                    <span className="text-xl font-black text-white mt-1.5 text-glow-cyan">{totalInCount} lần</span>
                    <span className="text-[7.5px] text-white/45 font-medium mt-1 uppercase">ĐÃ XÁC NHẬN ĐẾN TRẠM</span>
                  </div>

                  {/* Metric 2: Check-Outs */}
                  <div className="bg-[#0e271a]/30 border border-emerald-500/10 p-4 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5">
                      <span className="material-symbols-outlined text-[36px]">logout</span>
                    </div>
                    <span className="text-[8px] font-extrabold text-emerald-400 uppercase tracking-widest">TỔNG LƯỢT XUẤT (OUT)</span>
                    <span className="text-xl font-black text-white mt-1.5 text-glow-green">{totalOutCount} lần</span>
                    <span className="text-[7.5px] text-white/45 font-medium mt-1 uppercase">ĐÃ XUẤT BẾN RỜI TRẠM</span>
                  </div>

                  {/* Metric 3: Total Actions */}
                  <div className="bg-[#102030]/40 border border-white/10 p-4 rounded-2xl flex justify-between items-center shadow-sm col-span-2">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-extrabold text-white/50 uppercase tracking-widest">TỔNG HOẠT ĐỘNG XỬ LÝ</span>
                      <span className="text-2xl font-black text-white mt-1 text-glow-cyan">{totalStationActions} lượt</span>
                    </div>
                    <span className="material-symbols-outlined text-cyan-400 bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/25">inventory_2</span>
                  </div>
                </div>
              </div>

              {/* Personal Info Box */}
              <div className="bg-white/5 border border-white/5 rounded-3xl p-5 space-y-4 shadow-md">
                <h4 className="text-[10px] font-black uppercase text-cyan-400 tracking-widest mb-1 font-mono">Thông tin hồ sơ nhân sự</h4>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Tên đăng nhập (Read-Only)</label>
                    <input
                      type="text"
                      disabled
                      value={profile.username}
                      className="w-full bg-black/45 text-white/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs font-semibold select-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Vai trò nghiệp vụ</label>
                    <input
                      type="text"
                      disabled
                      value="NHANVIEN (Thủ kho kiểm soát)"
                      className="w-full bg-black/45 text-white/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs font-semibold select-none cursor-not-allowed"
                    />
                  </div>

                  {profile.workplace_name && (
                    <div>
                      <label className="block text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Trạm phân công cứng</label>
                      <input
                        type="text"
                        disabled
                        value={profile.workplace_name}
                        className="w-full bg-black/45 text-white/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs font-semibold select-none cursor-not-allowed text-cyan-400"
                      />
                    </div>
                  )}

                  {profile.workplace_region && (
                    <div>
                      <label className="block text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Phân vùng điều hành</label>
                      <input
                        type="text"
                        disabled
                        value={profile.workplace_region === 'BAC' ? 'Miền Bắc (Từ Sơn, Bắc Ninh)' : profile.workplace_region === 'TRUNG' ? 'Miền Trung (An Tây)' : 'Miền Nam (Bình Hòa)'}
                        className="w-full bg-black/45 text-white/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs font-semibold select-none cursor-not-allowed"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Họ và Tên</label>
                    <input
                      type="text"
                      placeholder="Nhập họ và tên..."
                      value={profile.fullname}
                      onChange={(e) => setProfile({ ...profile, fullname: e.target.value })}
                      className="w-full bg-[#030c14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-white/20"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:from-teal-600 hover:to-cyan-600 shadow-[0_4px_16px_rgba(6,182,212,0.3)] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {savingProfile ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">save</span>
                      <span>Lưu Thay Đổi Họ Tên</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-3 bg-transparent border border-rose-500/35 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-[10px] font-black uppercase tracking-widest rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(244,63,94,0.1)]"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  <span>Đăng Xuất Tài Khoản</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Premium BottomNavBar (Teal theme) */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 h-16 bg-[#04111f]/85 backdrop-blur-md border border-white/5 rounded-full flex justify-around items-center px-4 shadow-[0_10px_35px_rgba(0,0,0,0.5)] max-w-md mx-auto">
        <button 
          onClick={() => setActiveTab('hub')}
          className={`flex flex-col items-center justify-center pt-1 transition-all cursor-pointer outline-none ${
            activeTab === 'hub' 
              ? 'text-cyan-400 text-glow-cyan font-black text-xs' 
              : 'text-white/40 hover:text-white font-semibold text-xs'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === 'hub' ? "'FILL' 1" : "'FILL' 0" }}>warehouse</span>
          <span className="mt-1">Trung chuyển</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center pt-1 transition-all cursor-pointer outline-none ${
            activeTab === 'history' 
              ? 'text-cyan-400 text-glow-cyan font-black text-xs' 
              : 'text-white/40 hover:text-white font-semibold text-xs'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === 'history' ? "'FILL' 1" : "'FILL' 0" }}>history</span>
          <span className="mt-1">Lịch sử</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('account')}
          className={`flex flex-col items-center justify-center pt-1 transition-all cursor-pointer outline-none ${
            activeTab === 'account' 
              ? 'text-cyan-400 text-glow-cyan font-black text-xs' 
              : 'text-white/40 hover:text-white font-semibold text-xs'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === 'account' ? "'FILL' 1" : "'FILL' 0" }}>person</span>
          <span className="mt-1">Tài khoản</span>
        </button>
      </nav>
    </div>
  );
}
