import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { X, Search, MapPin, Loader2, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix default icons issues in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom neon location pin
const pulsingPinIcon = L.divIcon({
  className: 'custom-leaflet-pulsing-icon',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute w-8 h-8 bg-[#5E0ED7] rounded-full animate-ping opacity-45"></div>
    <div class="relative w-5 h-5 bg-[#5E0ED7] border-2 border-white rounded-full shadow-[0_0_15px_#5E0ED7] flex items-center justify-center">
      <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
    </div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Helper component to center map on coordinates change
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 16);
    }
  }, [center, map]);
  return null;
}

// Helper component to capture map clicks
function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function LocationPickerModal({ isOpen, onClose, onConfirm, initialCoords, title = "Chọn vị trí trên bản đồ" }) {
  const [coords, setCoords] = useState(initialCoords || [21.0285, 105.8542]); // Default Hanoi
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  
  const [areaAddress, setAreaAddress] = useState('');
  const [detailedAddress, setDetailedAddress] = useState('');
  const [resolvingAddress, setResolvingAddress] = useState(false);
  
  const markerRef = useRef(null);

  // Set initial coordinates if modal is opened with new values
  useEffect(() => {
    if (isOpen && initialCoords) {
      setCoords(initialCoords);
    }
  }, [isOpen, initialCoords]);

  // Reverse geocode whenever coordinates change
  useEffect(() => {
    if (!coords) return;
    
    let active = true;
    async function lookupAddress() {
      setResolvingAddress(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}&zoom=18&addressdetails=1`, {
          headers: { 'User-Agent': 'Antigravity-Logistics/1.0' }
        });
        if (res.ok && active) {
          const data = await res.json();
          // Extract general readable address
          setAreaAddress(data.display_name || "Vị trí được ghim");
        }
      } catch (err) {
        console.error("Reverse geocoding error", err);
      } finally {
        if (active) setResolvingAddress(false);
      }
    }
    
    // Simple debounce to prevent Nominatim rate-limiting during dragging
    const timeout = setTimeout(lookupAddress, 800);
    
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [coords]);

  // Handle marker dragend
  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const latLng = marker.getLatLng();
        setCoords([latLng.lat, latLng.lng]);
      }
    },
  }), []);

  // Search area handler
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&countrycodes=vn`, {
        headers: { 'User-Agent': 'Antigravity-Logistics/1.0' }
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSuggestion = (sug) => {
    const lat = parseFloat(sug.lat);
    const lon = parseFloat(sug.lon);
    setCoords([lat, lon]);
    setAreaAddress(sug.display_name);
    setSuggestions([]);
    setSearchQuery('');
  };

  const handleConfirm = () => {
    const mergedAddress = detailedAddress.trim() 
      ? `${detailedAddress.trim()}, ${areaAddress}` 
      : areaAddress;
      
    onConfirm({
      lat: coords[0],
      lng: coords[1],
      address: mergedAddress,
      detailed: detailedAddress.trim(),
      area: areaAddress
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in text-black">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="bg-white/95 backdrop-blur-2xl w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col relative z-10 animate-scaleUp border border-black/10 shadow-[0_15px_50px_rgba(0,0,0,0.1)] h-[85vh] max-h-[700px]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/5 flex justify-between items-center bg-black/[0.02]">
          <h2 className="font-black text-sm text-black uppercase tracking-widest font-display text-glow-purple flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-accent-purple" /> {title}
          </h2>
          <button onClick={onClose} className="text-black hover:text-accent-purple transition-all p-2 cursor-pointer border border-black/5 rounded-full hover:bg-black/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar inside Modal */}
        <div className="p-4 border-b border-black/5 bg-white relative z-50">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nhanh khu vực, tên đường ở Việt Nam..."
                className="w-full h-11 border border-black/10 rounded-xl px-4 pr-10 focus:outline-none focus:border-accent-purple text-xs font-semibold"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-accent-purple">
                {searching ? <Loader2 className="w-4 h-4 animate-spin text-accent-purple" /> : <Search className="w-4 h-4" />}
              </button>
            </div>
          </form>

          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute left-4 right-4 top-full mt-1 bg-white border border-black/10 rounded-xl shadow-lg z-[9999] max-h-48 overflow-y-auto divide-y divide-black/5">
              {suggestions.map((sug, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSuggestion(sug)}
                  className="px-4 py-2.5 text-[11px] font-semibold text-black hover:bg-black/5 cursor-pointer transition-colors max-w-full truncate"
                  title={sug.display_name}
                >
                  📍 {sug.display_name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map Canvas */}
        <div className="flex-1 relative bg-black/5">
          <MapContainer center={coords} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <MapUpdater center={coords} />
            <MapClickHandler onClick={setCoords} />
            <Marker position={coords} icon={pulsingPinIcon} draggable={true} eventHandlers={eventHandlers} ref={markerRef} />
          </MapContainer>

          <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-black/10 text-[9px] font-black text-black uppercase tracking-wider flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-accent-purple animate-pulse" /> Kéo ghim hoặc click để di chuyển
          </div>
        </div>

        {/* Address Fields Panel */}
        <div className="p-6 border-t border-black/5 bg-black/[0.01] space-y-4">
          <div className="text-xs">
            <span className="text-[9px] font-black text-mute uppercase tracking-widest block">Khu vực đã ghim:</span>
            <div className="font-semibold text-black mt-1 line-clamp-2 bg-white border border-black/5 p-2 rounded-lg min-h-[40px] flex items-center">
              {resolvingAddress ? (
                <div className="flex items-center gap-2 text-accent-purple animate-pulse font-bold text-[10px]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang định vị địa chỉ...
                </div>
              ) : (
                areaAddress || "Vui lòng chọn vị trí trên bản đồ"
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black text-mute uppercase tracking-widest">Số nhà, ngõ/hẻm chi tiết (Không bắt buộc định vị):</label>
            <input
              type="text"
              value={detailedAddress}
              onChange={(e) => setDetailedAddress(e.target.value)}
              placeholder="VD: Số nhà 15, hẻm 2/4/10, chung cư Alpha"
              className="w-full h-11 border border-black/10 rounded-xl px-4 focus:outline-none focus:border-accent-purple text-xs font-semibold text-black"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-black/5 hover:bg-black/10 text-black text-[10px] font-black uppercase tracking-widest rounded-full transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={resolvingAddress || !areaAddress}
              className="px-6 py-2.5 bg-accent-purple hover:bg-[#701edd] text-white text-[10px] font-black uppercase tracking-widest rounded-full transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(94,14,215,0.22)]"
            >
              Xác Nhận Địa Chỉ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
