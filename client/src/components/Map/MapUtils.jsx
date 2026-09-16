import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Icon ghim đỏ mặc định (như trong MapViTriPhong)
export const redMarkerIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="36" height="52">
      <defs>
        <linearGradient id="redGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="3" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path 
        fill="url(#redGrad)" 
        stroke="#ffffff" 
        stroke-width="2" 
        filter="url(#shadow)"
        d="M12 0C7.029 0 3 4.029 3 9c0 7.5 9 18 9 18s9-10.5 9-18c0-4.971-4.029-9-9-9z"
      />
      <circle cx="12" cy="9" r="4" fill="#ffffff"/>
      <circle cx="12" cy="9" r="2" fill="#dc2626"/>
    </svg>
  `),
  iconSize: [36, 52],
  iconAnchor: [18, 52],
  popupAnchor: [0, -54],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41],
  shadowAnchor: [13, 41]
});

// Component hỗ trợ zoom bằng Ctrl + Cuộn chuột
export const MapCtrlScrollHelper = () => {
  const map = useMap();
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    // Tắt scrollWheelZoom mặc định để tự quản lý
    map.scrollWheelZoom.disable();
    
    const handleWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) {
        // Chặn zoom nếu không giữ Ctrl
        e.stopPropagation();
        e.preventDefault();
        
        setShowOverlay(true);
        if (window.mapOverlayTimeout) clearTimeout(window.mapOverlayTimeout);
        window.mapOverlayTimeout = setTimeout(() => setShowOverlay(false), 2000);
      } else {
        // Cho phép zoom nếu đang giữ Ctrl
        map.scrollWheelZoom.enable();
        setShowOverlay(false);
        
        // Tự động tắt zoom sau khi cuộn xong
        if (window.mapEnableTimeout) clearTimeout(window.mapEnableTimeout);
        window.mapEnableTimeout = setTimeout(() => {
          map.scrollWheelZoom.disable();
        }, 1000);
      }
    };

    const container = map.getContainer();
    container.addEventListener('wheel', handleWheel, { capture: true, passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [map]);

  if (!showOverlay) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      pointerEvents: 'none',
      fontSize: '18px',
      fontWeight: '500',
      textAlign: 'center',
      padding: '20px',
      borderRadius: 'inherit'
    }}>
      Sử dụng ctrl + cuộn chuột để thu phóng bản đồ
    </div>
  );
};

export const GOOGLE_MAPS_TILE_LAYER = {
  url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
  attribution: "&copy; Google Maps",
  maxZoom: 20,
  minZoom: 4
};
