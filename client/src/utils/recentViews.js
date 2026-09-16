/**
 * Utility helper quản lý danh sách ID bất động sản đã xem gần đây (recent_viewed_ids)
 * Lưu trữ trong localStorage nhằm phục vụ thuật toán gợi ý cá nhân hóa cho khách vãng lai
 */

const STORAGE_KEY = 'recent_viewed_ids';
const MAX_RECENT_ITEMS = 20;

/**
 * Lấy danh sách ID đã xem từ localStorage
 * @returns {number[]} Mảng chứa ID các BĐS đã xem
 */
export const getRecentViewedIds = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(Number).filter(id => !isNaN(id) && id > 0);
    }
  } catch (err) {
    console.warn('[recentViews] Lỗi parse recent_viewed_ids:', err);
  }
  return [];
};

/**
 * Thêm một ID bất động sản vào danh sách đã xem
 * - Đưa ID mới nhất lên đầu mảng
 * - Loại bỏ ID trùng lặp
 * - Giới hạn tối đa MAX_RECENT_ITEMS
 * @param {number|string} tinDangId 
 */
export const addRecentViewedId = (tinDangId) => {
  const id = parseInt(tinDangId, 10);
  if (!id || isNaN(id) || id <= 0) return;

  try {
    const current = getRecentViewedIds();
    // Đưa lên đầu và loại trùng
    const updated = [id, ...current.filter(item => item !== id)].slice(0, MAX_RECENT_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[recentViews] Lỗi lưu recent_viewed_ids:', err);
  }
};

/**
 * Xóa danh sách BĐS đã xem
 */
export const clearRecentViewedIds = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[recentViews] Lỗi xóa recent_viewed_ids:', err);
  }
};
