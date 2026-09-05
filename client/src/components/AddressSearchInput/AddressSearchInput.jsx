import React, { useState } from 'react';
import { HiOutlineMapPin, HiOutlineMagnifyingGlass, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';
import './AddressSearchInput.css';
import { buildApiUrl } from '../../config/api';

/**
 * Component tìm kiếm địa chỉ và geocode tự động
 * @param {string} initialAddress - Địa chỉ ban đầu
 * @param {function} onCoordinatesFound - Callback khi tìm thấy tọa độ (lat, lng, displayName)
 */
const GEO_API_URL = buildApiUrl('/api/geocode');

const AddressSearchInput = ({ initialAddress = '', onCoordinatesFound }) => {
  const [address, setAddress] = useState(initialAddress);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!address.trim()) {
      setError('Vui lòng nhập địa chỉ');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(GEO_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ address: address.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi tra cứu địa chỉ');
      }

      if (data.success) {
        setResult(data.data);
        
        // Callback to parent component
        if (onCoordinatesFound) {
          onCoordinatesFound({
            lat: data.data.lat,
            lng: data.data.lng,
            displayName: data.data.displayName,
          });
        }
      } else {
        setError(data.message);
      }

    } catch (err) {
      console.error('Geocoding error:', err);
      setError(err.message || 'Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="address-search-container">
      <label className="address-search-label">
        <HiOutlineMapPin />
        <span>Tìm kiếm tọa độ từ địa chỉ</span>
      </label>

      <div className="address-search-input-group">
        <input
          type="text"
          className="address-search-input"
          placeholder="Nhập địa chỉ (VD: 123 Nguyễn Huệ, Quận 1, TP.HCM)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
        <button
          type="button"
          className="address-search-button"
          onClick={handleSearch}
          disabled={loading || !address.trim()}
        >
          {loading ? (
            <span className="spinner"></span>
          ) : (
            <HiOutlineMagnifyingGlass />
          )}
          <span>{loading ? 'Đang tìm...' : 'Tìm tọa độ'}</span>
        </button>
      </div>

      {/* Success State */}
      {result && (
        <div className="address-search-result success">
          <HiOutlineCheckCircle className="result-icon" />
          <div className="result-content">
            <p className="result-title">✓ Tìm thấy vị trí!</p>
            <p className="result-address">{result.displayName}</p>
            <p className="result-coords">
              <strong>Vĩ độ:</strong> {result.lat.toFixed(6)} | 
              <strong>Kinh độ:</strong> {result.lng.toFixed(6)}
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="address-search-result error">
          <HiOutlineXCircle className="result-icon" />
          <div className="result-content">
            <p className="result-title">Không tìm thấy</p>
            <p className="result-error">{error}</p>
          </div>
        </div>
      )}

      {/* Usage Hint */}
      <p className="address-search-hint">
        💡 Nhập đầy đủ: Số nhà + Đường + Quận/Huyện + Tỉnh/Thành phố
      </p>
    </div>
  );
};

export default AddressSearchInput;
