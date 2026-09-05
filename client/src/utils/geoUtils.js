/**
 * Tính khoảng cách giữa 2 điểm GPS (Haversine formula)
 * @param {number} lat1 - Vĩ độ điểm 1
 * @param {number} lon1 - Kinh độ điểm 1
 * @param {number} lat2 - Vĩ độ điểm 2
 * @param {number} lon2 - Kinh độ điểm 2
 * @returns {number} Khoảng cách tính bằng mét
 */
export function tinhKhoangCachGPS(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Bán kính Trái Đất (mét)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance; // Mét
}

/**
 * Chuyển độ sang radian
 */
function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Format khoảng cách thành chuỗi dễ đọc
 * @param {number} meters - Khoảng cách tính bằng mét
 * @returns {string} Chuỗi format (VD: "1.5 km" hoặc "250 m")
 */
export function formatKhoangCach(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Kiểm tra xem vị trí mới có nằm trong bán kính cho phép không
 * @param {Object} originalPos - Vị trí gốc {lat, lng}
 * @param {Object} newPos - Vị trí mới {lat, lng}
 * @param {number} maxDistanceMeters - Khoảng cách tối đa cho phép (mét)
 * @returns {Object} { valid: boolean, distance: number, message: string }
 */
export function kiemTraKhoangCachChoPhep(originalPos, newPos, maxDistanceMeters = 1000) {
  const distance = tinhKhoangCachGPS(
    originalPos.lat,
    originalPos.lng,
    newPos.lat,
    newPos.lng
  );
  
  const valid = distance <= maxDistanceMeters;
  
  return {
    valid,
    distance,
    distanceFormatted: formatKhoangCach(distance),
    maxDistanceFormatted: formatKhoangCach(maxDistanceMeters),
    message: valid
      ? `✓ Vị trí hợp lệ (cách ${formatKhoangCach(distance)} so với vị trí gốc)`
      : `✗ Vị trí quá xa! Chỉ cho phép di chuyển tối đa ${formatKhoangCach(maxDistanceMeters)} (hiện tại: ${formatKhoangCach(distance)})`
  };
}
