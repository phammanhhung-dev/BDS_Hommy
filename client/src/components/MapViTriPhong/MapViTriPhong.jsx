import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { HiOutlineMapPin } from 'react-icons/hi2';
import 'leaflet/dist/leaflet.css';
import './MapViTriPhong.css';

// Fix Leaflet default marker icon paths
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom Red Marker Icon (Red Pin BĐS Nổi Bật)
const redMarkerIcon = new L.Icon({
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
  shadowUrl: markerShadow,
  shadowSize: [41, 41],
  shadowAnchor: [13, 41]
});

/**
 * Helper Component: Tự động center map về marker position khi mount
 */
function MapCenterHelper({ position }) {
  const map = useMap();
  
  useEffect(() => {
    if (position && position[0] && position[1]) {
      map.setView(position, map.getZoom(), {
        animate: true,
        duration: 0.5
      });
    }
  }, [map, position]);
  
  return null;
}

/**
 * Component: Hiển thị bản đồ vị trí bất động sản/dự án với Ghim Đỏ 📍
 */

const MapViTriPhong = ({ 
  lat, 
  lng, 
  tenDuAn = 'Bất động sản', 
  diaChi = '', 
  zoom = 15,
  height = 400 
}) => {
  const [geocodedCoords, setGeocodedCoords] = useState(null);

  // Auto geocode address if lat & lng are not provided
  useEffect(() => {
    if ((!lat || !lng) && diaChi && diaChi.trim()) {
      const addressToQuery = diaChi.trim();
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressToQuery)}&limit=1`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const latitude = parseFloat(data[0].lat);
            const longitude = parseFloat(data[0].lon);
            if (!isNaN(latitude) && !isNaN(longitude)) {
              setGeocodedCoords([latitude, longitude]);
            }
          }
        })
        .catch((err) => {
          console.error("Geocoding failed:", err);
        });
    }
  }, [lat, lng, diaChi]);

  // Determine final coordinates
  const finalLat = lat ? parseFloat(lat) : (geocodedCoords ? geocodedCoords[0] : null);
  const finalLng = lng ? parseFloat(lng) : (geocodedCoords ? geocodedCoords[1] : null);

  // Validate coordinates
  const isValidCoordinates = 
    finalLat && finalLng && 
    !isNaN(finalLat) && !isNaN(finalLng) &&
    finalLat >= -90 && finalLat <= 90 &&
    finalLng >= -180 && finalLng <= 180;

  // Nếu chưa có tọa độ (kể cả sau geocode) nhưng có chuỗi địa chỉ -> Hiển thị Google Maps Embed + Lớp Ghim Đỏ Phủ Trung Tâm
  if (!isValidCoordinates) {
    const addressToUse = diaChi?.trim();
    if (addressToUse) {
      const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(addressToUse)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      const googleMapsDirectUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressToUse)}`;

      return (
        <div className="map-vi-tri-container">
          <div className="map-vi-tri-header">
            <h3>
              <HiOutlineMapPin style={{ color: '#ef4444' }} />
              <span>Vị trí trên bản đồ (Ghim đỏ 📍)</span>
            </h3>
            <p className="map-vi-tri-address">
              <HiOutlineMapPin style={{ flexShrink: 0, color: '#ef4444' }} />
              <span>{addressToUse}</span>
            </p>
          </div>
          <div 
            className="map-vi-tri-map" 
            style={{ 
              height: `${height}px`, 
              borderRadius: '12px', 
              overflow: 'hidden', 
              border: '1px solid #e2e8f0', 
              background: '#f8fafc',
              position: 'relative'
            }}
          >
            {/* Embedded Google Maps */}
            <iframe
              title={`Bản đồ Google - ${tenDuAn}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={googleMapsEmbedUrl}
            />

            {/* 📍 GHIM ĐỎ NỔI BẬT Ở TRUNG TÂM BẢN ĐỒ */}
            <div 
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -100%)',
                zIndex: 10,
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                filter: 'drop-shadow(0px 6px 12px rgba(220, 38, 38, 0.5))'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="40" height="58">
                <defs>
                  <linearGradient id="redPinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#dc2626', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path 
                  fill="url(#redPinGrad)" 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                  d="M12 0C7.029 0 3 4.029 3 9c0 7.5 9 18 9 18s9-10.5 9-18c0-4.971-4.029-9-9-9z"
                />
                <circle cx="12" cy="9" r="4" fill="#ffffff"/>
                <circle cx="12" cy="9" r="2" fill="#dc2626"/>
              </svg>
              <div 
                style={{
                  background: '#1e293b',
                  color: '#ffffff',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginTop: '-2px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  whiteSpace: 'nowrap',
                  maxWidth: '260px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                📍 {tenDuAn || addressToUse}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '10px', textAlign: 'right' }}>
            <a
              href={googleMapsDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="map-popup-link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#ef4444', fontWeight: 600, textDecoration: 'none' }}
            >
              <HiOutlineMapPin style={{ width: 16, height: 16 }} />
              <span>Xem vị trí ghim đỏ trên Google Maps ↗</span>
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="map-vi-tri-container">
        <div className="map-vi-tri-header">
          <h3>
            <HiOutlineMapPin style={{ color: '#ef4444' }} />
            <span>Vị trí</span>
          </h3>
        </div>
        <div className="map-vi-tri-error">
          <HiOutlineMapPin className="map-error-icon" style={{ color: '#ef4444' }} />
          <p className="map-error-text">Thông tin vị trí chưa có sẵn</p>
          <p className="map-error-subtext">Chưa cập nhật địa chỉ hoặc tọa độ cho địa điểm này</p>
        </div>
      </div>
    );
  }

  const position = [finalLat, finalLng];

  return (
    <div className="map-vi-tri-container">
      {/* Header Section */}
      <div className="map-vi-tri-header">
        <h3>
          <HiOutlineMapPin style={{ color: '#ef4444' }} />
          <span>Vị trí (Ghim đỏ 📍)</span>
        </h3>
        {diaChi && (
          <p className="map-vi-tri-address">
            <HiOutlineMapPin style={{ flexShrink: 0, color: '#ef4444' }} />
            <span>{diaChi}</span>
          </p>
        )}
      </div>

      {/* Map Container */}
      <div className="map-vi-tri-map" style={{ height: `${height}px` }}>
        <MapContainer
          center={position}
          zoom={zoom}
          scrollWheelZoom={false}
          dragging={true}
          zoomControl={true}
          doubleClickZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; Google Maps'
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            maxZoom={20}
            minZoom={4}
          />

          {/* Marker với Custom Red Pin Icon */}
          <Marker position={position} icon={redMarkerIcon}>
            <Popup className="map-custom-popup">
              <div className="map-popup-content">
                <h4 className="map-popup-title">{tenDuAn}</h4>
                {diaChi && <p className="map-popup-address">{diaChi}</p>}
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${finalLat},${finalLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-popup-link"
                  style={{ color: '#ef4444' }}
                >
                  <HiOutlineMapPin style={{ width: 16, height: 16 }} />
                  <span>Xem trên Google Maps</span>
                </a>
              </div>
            </Popup>
          </Marker>

          {/* Helper: Auto center map to marker */}
          <MapCenterHelper position={position} />
        </MapContainer>
      </div>
    </div>
  );
};

export default MapViTriPhong;
