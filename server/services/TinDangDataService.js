/**
 * TinDangDataService.js
 * Service xử lý & chuẩn hóa luồng dữ liệu Tin đăng bất động sản chuyên nghiệp (Kiểu Batdongsan.com.vn)
 */

class TinDangDataService {
  /**
   * Tính toán chỉ số đơn giá trên từng m² (Giá / m²)
   * @param {number|string} giaTien - Mức giá tổng (VNĐ)
   * @param {number|string} dienTich - Diện tích đất hoặc diện tích sử dụng (m²)
   * @returns {number|null} Đơn giá VNĐ / m²
   */
  static tinhGiaTrenM2(giaTien, dienTich) {
    const gia = parseFloat(giaTien);
    const dt = parseFloat(dienTich);

    if (isNaN(gia) || isNaN(dt) || gia <= 0 || dt <= 0) {
      return null;
    }

    return Math.round(gia / dt);
  }

  /**
   * Chuẩn hóa & Tự động ghép chuỗi địa chỉ hiển thị đầy đủ chuẩn SEO
   * @param {Object} addressParts
   * @param {string} addressParts.detailAddress - Số nhà, tên tòa nhà/chung cư
   * @param {string} addressParts.streetName - Tên đường/ngõ
   * @param {string} addressParts.wardName - Tên Phường/Xã
   * @param {string} addressParts.districtName - Tên Quận/Huyện
   * @param {string} addressParts.provinceName - Tên Tỉnh/Thành phố
   * @returns {string} Chuỗi địa chỉ đầy đủ
   */
  static ghepDiaChiChuan({ detailAddress = '', streetName = '', wardName = '', districtName = '', provinceName = '' }) {
    const parts = [];

    const detail = String(detailAddress || '').trim();
    const street = String(streetName || '').trim();

    if (detail && street) {
      parts.push(`${detail}, ${street}`);
    } else if (detail) {
      parts.push(detail);
    } else if (street) {
      parts.push(street);
    }

    if (wardName) parts.push(String(wardName).trim());
    if (districtName) parts.push(String(districtName).trim());
    if (provinceName) parts.push(String(provinceName).trim());

    return parts.filter(Boolean).join(', ');
  }

  /**
   * Tính toán ngày hết hạn tin đăng theo gói tin
   * @param {Date|string} ngayBatDau - Ngày bắt đầu xuất bản
   * @param {number} soNgayGoi - Số ngày của gói tin (15, 30, 60 ngày)
   * @returns {string} Ngày hết hạn theo định dạng YYYY-MM-DD
   */
  static tinhNgayHetHan(ngayBatDau = new Date(), soNgayGoi = 15) {
    const startDate = new Date(ngayBatDau);
    const validDays = parseInt(soNgayGoi, 10) || 15;

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + validDays);

    return endDate.toISOString().split('T')[0];
  }

  /**
   * Thuật toán tính Điểm ưu tiên hiển thị (Ranking Score) cho kết quả tìm kiếm
   * @param {string} goiTin - Mã gói tin ('diamond', 'gold', 'silver', 'normal')
   * @param {Date|string} ngayTao - Ngày tạo tin đăng
   * @param {boolean} coAnh - Có hình ảnh hay không
   * @param {boolean} coVideo - Có video hay không
   * @returns {number} Điểm xếp hạng (Score)
   */
  static tinhDiemUuTienSearch(goiTin = 'normal', ngayTao = new Date(), coAnh = false, coVideo = false) {
    let packageWeight = 10;
    const cleanPackage = String(goiTin || '').toLowerCase();

    if (cleanPackage === 'diamond' || cleanPackage === 'vip_kim_cuong') {
      packageWeight = 1000;
    } else if (cleanPackage === 'gold' || cleanPackage === 'vip_vang') {
      packageWeight = 500;
    } else if (cleanPackage === 'silver' || cleanPackage === 'vip_bac') {
      packageWeight = 200;
    }

    // Freshness weight (giảm dần theo số ngày tạo)
    const now = new Date();
    const created = new Date(ngayTao);
    const diffDays = Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
    const freshnessScore = Math.max(0, 100 - diffDays * 2);

    // Media bonus
    const mediaBonus = (coAnh ? 30 : 0) + (coVideo ? 50 : 0);

    return packageWeight + freshnessScore + mediaBonus;
  }

  /**
   * Định dạng khoảng giá thị trường cho thông tin chi tiết
   * @param {number} minPrice - Giá thấp nhất m²
   * @param {number} maxPrice - Giá cao nhất m²
   * @returns {Object} Thông tin khoảng giá formatted
   */
  static dinhdangKhoangGiaThiTruong(minPrice, maxPrice) {
    if (!minPrice || !maxPrice) {
      return {
        formatted: 'Đang cập nhật khoảng giá thị trường',
        minMillionPerM2: null,
        maxMillionPerM2: null
      };
    }

    const minM = (minPrice / 1000000).toFixed(1);
    const maxM = (maxPrice / 1000000).toFixed(1);

    return {
      formatted: `${minM} - ${maxM} triệu/m²`,
      minMillionPerM2: parseFloat(minM),
      maxMillionPerM2: parseFloat(maxM)
    };
  }
}

module.exports = TinDangDataService;
