import React, { useRef, useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { HiOutlineXMark } from 'react-icons/hi2';
import { buildApiUrl } from '../../config/api';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapClickHandler({ onMapClick }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const handleClick = (e) => {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    };
    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  return null;
}

function DraggableMarker({ position, onPositionChange, tieuDe }) {
  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          onPositionChange({ lat: newPos.lat, lng: newPos.lng });
        }
      },
    }),
    [onPositionChange]
  );

  return (
    <Marker draggable={true} eventHandlers={eventHandlers} position={position} ref={markerRef}>
      <Popup>
        <strong>{tieuDe || 'Tin đăng mới'}</strong><br />
        📍 {position.lat.toFixed(6)}, {position.lng.toFixed(6)}<br />
        🔄 <em>Kéo thả marker để điều chỉnh vị trí</em>
      </Popup>
    </Marker>
  );
}

function normalizeRegionName(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[\n\r]/g, ' ')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function splitNormalizedWords(value = '') {
  return normalizeRegionName(value).split(/\s+/).filter(Boolean);
}

function stripRegionTypeWords(value = '') {
  return normalizeRegionName(value)
    .replace(/\b(tp|thanh pho|thanhpho|thanh-pho|tinh|quan|quận|huyen|huyện|phuong|phường|xa|xã|ward|commune|district|city|town)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitNameTokens(value = '') {
  const stripped = stripRegionTypeWords(value);
  const tokens = splitNormalizedWords(stripped);
  return tokens.length ? tokens : splitNormalizedWords(value);
}

function buildReverseText(result) {
  if (!result) return '';
  if (typeof result === 'string') {
    return result.toLowerCase();
  }

  const collectText = (value) => {
    if (value == null) return [];
    if (typeof value === 'string' || typeof value === 'number') {
      return [String(value)];
    }
    if (Array.isArray(value)) {
      return value.flatMap((item) => collectText(item));
    }
    if (typeof value === 'object') {
      return Object.values(value).flatMap((item) => collectText(item));
    }
    return [];
  };

  const parts = collectText(result);
  return parts.join(' ').toLowerCase();
}

function ModalChinhSuaToaDo({ isOpen, onClose, initialPosition, onSave, tieuDe, expectedAddress = {} }) {
  const [currentPosition, setCurrentPosition] = useState(initialPosition);
  const [validationError, setValidationError] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [coordinateInput, setCoordinateInput] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    setCurrentPosition(initialPosition);
    setCoordinateInput('');
    setSearchInput('');
    setSearchResults([]);
    setValidationError('');
    setValidationMessage('');
    setIsValidating(false);
    setSearchError('');
  }, [initialPosition, expectedAddress]);

  if (!isOpen) return null;

  const xuLyThayDoiViTri = (newPos) => {
    setValidationError('');
    setValidationMessage('');
    setCurrentPosition(newPos);
    setCoordinateInput(`${newPos.lat.toFixed(6)},${newPos.lng.toFixed(6)}`);
  };

  const parseCoordinates = (str) => {
    const trimmed = str.trim();
    const match = trimmed.match(/^([+-]?\d+\.?\d*)[,\s]+([+-]?\d+\.?\d*)$/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    return null;
  };

  const handleCoordinateInputChange = (value) => {
    setCoordinateInput(value);
    setValidationError('');
  };

  const handleCoordinateSubmit = () => {
    if (!coordinateInput.trim()) {
      setValidationError('Vui lòng nhập tọa độ');
      return;
    }
    const parsed = parseCoordinates(coordinateInput);
    if (!parsed) {
      setValidationError('❌ Tọa độ không hợp lệ. Định dạng: 11.5467944,106.9077348');
      return;
    }
    xuLyThayDoiViTri(parsed);
    setValidationError('');
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      setSearchError('Vui lòng nhập tên vị trí');
      return;
    }
    
    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);
    
    try {
      const response = await fetch(buildApiUrl('/api/geocode/forward'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'mock-token-for-development'}`,
        },
        body: JSON.stringify({ address: searchInput }),
      });
      
      const data = await response.json();
      if (!data.success) {
        setSearchError('Không tìm thấy vị trí này');
        return;
      }
      
      if (Array.isArray(data.data)) {
        setSearchResults(data.data.slice(0, 5));
        if (data.data.length === 0) {
          setSearchError('Không tìm thấy kết quả nào');
        }
      } else {
        setSearchResults([data.data]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Lỗi khi tìm kiếm vị trí');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    const newPos = {
      lat: result.lat || result.latitude,
      lng: result.lng || result.longitude
    };
    xuLyThayDoiViTri(newPos);
    setSearchResults([]);
    setSearchInput('');
  };

  const validateCurrentPosition = async () => {
    const { tinhName, quanName, phuongName } = expectedAddress;
    if (!tinhName || !quanName || !phuongName) {
      setValidationMessage('⚠️ Chưa có đủ thông tin Tỉnh/Quận/Phường để xác thực tọa độ.');
      return true;
    }

    try {
      setIsValidating(true);
      setValidationError('');
      setValidationMessage('Đang xác thực tọa độ với vùng đã chọn...');

      const response = await fetch(buildApiUrl('/api/geocode/reverse'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'mock-token-for-development'}`,
        },
        body: JSON.stringify({ lat: currentPosition.lat, lng: currentPosition.lng }),
      });

      const data = await response.json();
      if (!data.success) {
        setValidationError(data.message || 'Không thể xác thực tọa độ.');
        setValidationMessage('');
        return false;
      }

      const actualText = normalizeRegionName(buildReverseText(data.data));
      const expectedWords = {
        tinh: splitNameTokens(tinhName),
        quan: splitNameTokens(quanName),
        phuong: splitNameTokens(phuongName),
      };
      const actualWords = splitNormalizedWords(actualText);

      const matchesAtLeastOneWord = (expectedTokens = []) => {
        if (!expectedTokens.length) return false;
        return expectedTokens.some((token) => actualWords.includes(token));
      };

      const provinceMatched = expectedWords.tinh.length && matchesAtLeastOneWord(expectedWords.tinh);
      const districtMatched = expectedWords.quan.length && matchesAtLeastOneWord(expectedWords.quan);
      const wardMatched = expectedWords.phuong.length && matchesAtLeastOneWord(expectedWords.phuong);

      // Bắt buộc phải trùng tỉnh/thành để tránh nhận tọa độ ở tỉnh khác
      if (!provinceMatched) {
        setValidationError(`✗ Tọa độ không phù hợp với Tỉnh/Thành phố ${tinhName} đã chọn.`);
        setValidationMessage(`Kết quả reverse geocoding trả về: ${actualText || 'không xác định'}.`);
        return false;
      }

      // Nếu tỉnh hợp lệ nhưng không xác định được quận/phường chính xác thì chỉ cảnh báo
      if (!districtMatched || !wardMatched) {
        const missingParts = [];
        if (!districtMatched) missingParts.push('Quận/Thị xã');
        if (!wardMatched) missingParts.push('Phường/Xã');

        setValidationError(`⚠️ Tọa độ hợp lệ với ${tinhName}, nhưng không thể xác nhận ${missingParts.join(' và ')} chính xác.`);
        setValidationMessage(`Nếu tọa độ nằm gần khu vực đã chọn, bạn có thể tiếp tục lưu. Nếu không, hãy điều chỉnh lại vị trí.`);
        return true;
      }

      setValidationError('');
      setValidationMessage(`✓ Tọa độ hợp lệ với ${phuongName}, ${quanName}, ${tinhName}.`);
      return true;
    } catch (error) {
      console.error('[ModalChinhSuaToaDo] Reverse validation error:', error);
      setValidationError('Lỗi khi xác thực tọa độ. Vui lòng thử lại.');
      setValidationMessage('');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const xuLyLuu = async () => {
    if (expectedAddress.tinhName || expectedAddress.quanName || expectedAddress.phuongName) {
      const isValid = await validateCurrentPosition();
      if (!isValid) {
        alert('❌ Tọa độ không khớp với địa chỉ đã chọn. Vui lòng kiểm tra lại.');
        return;
      }
    }

    onSave(currentPosition);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#252834',
          borderRadius: '12px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #1a1d29 0%, #2d3142 100%)',
          }}
        >
          <h3 style={{ margin: 0, color: '#f9fafb', fontSize: '1.25rem', fontWeight: 600 }}>
            📍 Chỉnh sửa vị trí trên bản đồ
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: '0.5rem',
              borderRadius: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            <HiOutlineXMark size={24} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              marginBottom: '1rem',
              color: '#93c5fd',
              fontSize: '0.875rem',
            }}
          >
            💡 <strong>Hướng dẫn:</strong> Kéo thả marker (📍), nhấn trên bản đồ, nhập tọa độ hoặc tìm kiếm vị trí.
          </div>

          {/* Search location section */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
              🔍 Tìm kiếm vị trí
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="VD: Đại học Quốc gia TPHCM, Tôn Đức Thắng..."
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#f9fafb',
                  fontSize: '0.875rem',
                }}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  color: '#93c5fd',
                  cursor: isSearching ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: isSearching ? 0.7 : 1,
                }}
              >
                🔍 {isSearching ? 'Tìm...' : 'Tìm'}
              </button>
            </div>
            {searchError && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                ❌ {searchError}
              </div>
            )}
            {searchResults.length > 0 && (
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                maxHeight: '200px',
                overflowY: 'auto',
              }}>
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSearchResult(result)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#93c5fd',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      borderBottom: idx < searchResults.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      📍
                      <div>
                        <div>{result.name || result.displayName || result.formatted_address}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {(result.lat || result.latitude)?.toFixed(6)}, {(result.lng || result.longitude)?.toFixed(6)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Coordinate input section */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
              📍 Nhập tọa độ
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={coordinateInput}
                onChange={(e) => handleCoordinateInputChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCoordinateSubmit()}
                placeholder="VD: 11.5467944,106.9077348"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#f9fafb',
                  fontSize: '0.875rem',
                }}
              />
              <button
                onClick={handleCoordinateSubmit}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  color: '#86efac',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
                }}
              >
                Áp dụng
              </button>
            </div>
          </div>

          <div
            style={{
              marginBottom: '1rem',
              padding: '1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Tọa độ hiện tại:
            </div>
            <div style={{ color: '#f9fafb', fontSize: '1rem', fontWeight: 500 }}>
              📍 Vĩ độ: <span style={{ color: '#8b5cf6' }}>{currentPosition.lat.toFixed(6)}</span>
              {' | '}
              Kinh độ: <span style={{ color: '#8b5cf6' }}>{currentPosition.lng.toFixed(6)}</span>
            </div>
          </div>

          <div
            style={{
              height: '500px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              marginBottom: '1rem',
            }}
          >
            <MapContainer center={[currentPosition.lat, currentPosition.lng]} zoom={16} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
                attribution='&copy; <a href="https://www.esri.com">Esri</a> World Street Map'
              />
              <DraggableMarker position={currentPosition} onPositionChange={xuLyThayDoiViTri} tieuDe={tieuDe} />
              <MapClickHandler onMapClick={xuLyThayDoiViTri} />
            </MapContainer>
          </div>

          {(validationMessage || validationError) && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: validationError ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(34, 197, 94, 0.4)',
                backgroundColor: validationError ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                color: validationError ? '#ef4444' : '#22c55e',
                fontSize: '0.925rem',
              }}
            >
              {validationError || validationMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'transparent',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#9ca3af';
              }}
            >
              Hủy
            </button>
            <button
              onClick={xuLyLuu}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.2s',
                opacity: isValidating ? 0.7 : 1,
              }}
              disabled={isValidating}
              onMouseEnter={(e) => {
                if (!isValidating) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isValidating) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                }
              }}
            >
              {isValidating ? 'Đang xác thực...' : '✓ Lưu vị trí'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalChinhSuaToaDo;
