/**
 * Controller mở rộng OperatorController - Quản lý Dự án
 * UC-OPER-02: Quản lý danh sách dự án
 * Bổ sung thêm các methods: danh sách, tạm ngưng, kích hoạt, thống kê
 * (Đã có sẵn: bannedDuAn, xuLyYeuCauMoLai trong OperatorController.js)
 */

const DuAnOperatorModel = require('../models/DuAnOperatorModel');

const ALLOWED_PROJECT_STATUSES = new Set(['HoatDong', 'NgungHoatDong', 'LuuTru']);

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toBooleanFlag = (value) => {
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (typeof value === 'number') {
    return value === 1 ? 1 : 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes'].includes(normalized)) {
      return 1;
    }
  }
  return 0;
};

const normalizeHoaHongPayload = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch (error) {
      throw new Error('BangHoaHong phải là JSON hợp lệ');
    }
  }

  return null;
};

const buildProjectPayload = (body = {}, mode = 'create') => {
  const payload = {};

  if (mode === 'create' || Object.prototype.hasOwnProperty.call(body, 'TenDuAn')) {
    const ten = typeof body.TenDuAn === 'string' ? body.TenDuAn.trim() : '';
    if (!ten) {
      if (mode === 'create') {
        throw new Error('Tên dự án không được để trống');
      }
    } else {
      payload.TenDuAn = ten;
    }
  }

  if (mode === 'create' || Object.prototype.hasOwnProperty.call(body, 'DiaChi')) {
    const diaChi = typeof body.DiaChi === 'string' ? body.DiaChi.trim() : '';
    if (!diaChi) {
      if (mode === 'create') {
        throw new Error('Địa chỉ dự án không được để trống');
      }
    } else {
      payload.DiaChi = diaChi;
    }
  }

  if (mode === 'create' || Object.prototype.hasOwnProperty.call(body, 'ChuDuAnID')) {
    const ownerId = toNumberOrNull(body.ChuDuAnID);
    if (!ownerId) {
      throw new Error('Chủ dự án không hợp lệ');
    }
    payload.ChuDuAnID = ownerId;
  }

  if (mode === 'create' || Object.prototype.hasOwnProperty.call(body, 'TrangThai')) {
    const status = (body.TrangThai || 'HoatDong').trim();
    if (!ALLOWED_PROJECT_STATUSES.has(status)) {
      throw new Error('Trạng thái dự án không hợp lệ');
    }
    payload.TrangThai = status;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'ViDo')) {
    payload.ViDo = toNumberOrNull(body.ViDo);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'KinhDo')) {
    payload.KinhDo = toNumberOrNull(body.KinhDo);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'YeuCauPheDuyetChu')) {
    payload.YeuCauPheDuyetChu = toBooleanFlag(body.YeuCauPheDuyetChu);
  } else if (mode === 'create') {
    payload.YeuCauPheDuyetChu = 0;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'PhuongThucVao')) {
    payload.PhuongThucVao = body.PhuongThucVao ? String(body.PhuongThucVao).trim() : null;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'SoThangCocToiThieu')) {
    const months = toNumberOrNull(body.SoThangCocToiThieu);
    payload.SoThangCocToiThieu = months;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'BangHoaHong')) {
    const hoaHong = normalizeHoaHongPayload(body.BangHoaHong);
    if (hoaHong !== undefined) {
      payload.BangHoaHong = hoaHong;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'LyDoNgungHoatDong')) {
    const reason = body.LyDoNgungHoatDong ? String(body.LyDoNgungHoatDong).trim() : null;
    payload.LyDoNgungHoatDong = reason;
  }

  return payload;
};

class DuAnOperatorController {
  /**
   * GET /api/operator/du-an
   * Lấy danh sách dự án với bộ lọc và phân trang
   * Lọc theo khu vực phụ trách của nhân viên điều hành
   */
  static async danhSachDuAn(req, res) {
    try {
      const {
        keyword,
        trangThai,
        chuDuAnId,
        page,
        limit
      } = req.query;

      // Lấy operatorId từ req.user để lọc theo khu vực phụ trách
      const operatorId = req.user?.NguoiDungID || null;

      const filters = {
        keyword,
        trangThai,
        chuDuAnId: chuDuAnId ? parseInt(chuDuAnId) : null,
        operatorId, // Thêm operatorId để lọc theo khu vực
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20
      };

      const result = await DuAnOperatorModel.layDanhSachDuAn(filters);

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách dự án thành công',
        ...result
      });
    } catch (error) {
      console.error('[DuAnOperatorController] Lỗi danhSachDuAn:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách dự án',
        error: error.message
      });
    }
  }

  /**
   * POST /api/operator/du-an
   * Quản trị viên hệ thống tạo dự án mới
   */
  static async taoMoi(req, res) {
    try {
      const payload = buildProjectPayload(req.body, 'create');

      if (payload.TrangThai === 'NgungHoatDong' && (!payload.LyDoNgungHoatDong || payload.LyDoNgungHoatDong.length < 10)) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập lý do ngưng hoạt động tối thiểu 10 ký tự'
        });
      }

      const duAn = await DuAnOperatorModel.taoDuAnHeThong(payload, req.user.NguoiDungID);

      return res.status(201).json({
        success: true,
        message: 'Tạo dự án thành công',
        data: duAn
      });
    } catch (error) {
      console.error('[DuAnOperatorController] Lỗi taoMoi:', error);

      if (
        error.message.includes('không được') ||
        error.message.includes('không hợp lệ') ||
        error.message.includes('Địa chỉ') ||
        error.message.includes('Không có trường')
      ) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('Chủ dự án không tồn tại')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo dự án',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/operator/du-an/:id/tam-ngung
   * Tạm ngưng dự án (không banned, chỉ tạm ngưng)
   */
  static async tamNgung(req, res) {
    try {
      const duAnId = parseInt(req.params.id);
      const nhanVienId = req.user.NguoiDungID;
      const { LyDo } = req.body;

      if (!duAnId || isNaN(duAnId)) {
        return res.status(400).json({
          success: false,
          message: 'ID dự án không hợp lệ'
        });
      }

      if (!LyDo || LyDo.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Lý do tạm ngưng phải có ít nhất 10 ký tự'
        });
      }

      const duAn = await DuAnOperatorModel.tamNgungDuAn(duAnId, nhanVienId, LyDo);

      return res.status(200).json({
        success: true,
        message: 'Tạm ngưng dự án thành công',
        data: duAn
      });
    } catch (error) {
      console.error('[DuAnOperatorController] Lỗi tamNgung:', error);
      
      if (error.message === 'Dự án không tồn tại') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('không thể') || error.message.includes('đã')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạm ngưng dự án',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/operator/du-an/:id
   * Cập nhật dự án cho quản trị viên hệ thống
   */
  static async capNhat(req, res) {
    try {
      const duAnId = parseInt(req.params.id, 10);

      if (!duAnId || Number.isNaN(duAnId)) {
        return res.status(400).json({
          success: false,
          message: 'ID dự án không hợp lệ'
        });
      }

      const payload = buildProjectPayload(req.body, 'update');

      if (Object.keys(payload).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Không có dữ liệu nào để cập nhật'
        });
      }

      if (payload.TrangThai === 'NgungHoatDong' && (!payload.LyDoNgungHoatDong || payload.LyDoNgungHoatDong.length < 10)) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập lý do ngưng hoạt động tối thiểu 10 ký tự'
        });
      }

      const duAn = await DuAnOperatorModel.capNhatDuAnHeThong(duAnId, payload, req.user.NguoiDungID);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật dự án thành công',
        data: duAn
      });
    } catch (error) {
      console.error('[DuAnOperatorController] Lỗi capNhat:', error);

      if (error.message === 'Dự án không tồn tại' || error.message.includes('Chủ dự án không tồn tại')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('không được') || error.message.includes('không hợp lệ') || error.message.includes('Địa chỉ')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật dự án',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/operator/du-an/:id/kich-hoat
   * Kích hoạt lại dự án (từ LuuTru → HoatDong)
   */
  static async kichHoat(req, res) {
    try {
      const duAnId = parseInt(req.params.id);
      const nhanVienId = req.user.NguoiDungID;

      if (!duAnId || isNaN(duAnId)) {
        return res.status(400).json({
          success: false,
          message: 'ID dự án không hợp lệ'
        });
      }

      const duAn = await DuAnOperatorModel.kichHoatDuAn(duAnId, nhanVienId);

      return res.status(200).json({
        success: true,
        message: 'Kích hoạt dự án thành công',
        data: duAn
      });
    } catch (error) {
      console.error('[DuAnOperatorController] Lỗi kichHoat:', error);
      
      if (error.message === 'Dự án không tồn tại') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('không thể') || error.message.includes('đã') || error.message.includes('banned')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi kích hoạt dự án',
        error: error.message
      });
    }
  }

  /**
   * GET /api/operator/du-an/thong-ke
   * Lấy thống kê dự án theo trạng thái
   */
  static async thongKe(req, res) {
    try {
      const thongKe = await DuAnOperatorModel.layThongKeDuAn();

      return res.status(200).json({
        success: true,
        message: 'Lấy thống kê dự án thành công',
        data: thongKe
      });
    } catch (error) {
      console.error('[DuAnOperatorController] Lỗi thongKe:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thống kê',
        error: error.message
      });
    }
  }

  /**
   * GET /api/operator/du-an/:id
   * Lấy chi tiết dự án
   */
  static async chiTiet(req, res) {
    try {
      const duAnId = parseInt(req.params.id);

      if (!duAnId || isNaN(duAnId)) {
        return res.status(400).json({
          success: false,
          message: 'ID dự án không hợp lệ'
        });
      }

      const duAn = await DuAnOperatorModel.layChiTietDuAn(duAnId);

      return res.status(200).json({
        success: true,
        message: 'Lấy chi tiết dự án thành công',
        data: duAn
      });
    } catch (error) {
      console.error('[DuAnOperatorController] Lỗi chiTiet:', error);
      
      if (error.message === 'Dự án không tồn tại') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy chi tiết dự án',
        error: error.message
      });
    }
  }

  /**
   * POST /api/operator/du-an/:id/duyet-hoa-hong
   * Duyệt hoa hồng dự án
   */
  static async duyetHoaHong(req, res) {
    try {
      const duAnId = parseInt(req.params.id);
      const operatorId = req.user.NguoiDungID;

      if (!duAnId || isNaN(duAnId)) {
        return res.status(400).json({
          success: false,
          message: 'ID dự án không hợp lệ'
        });
      }

      const duAn = await DuAnOperatorModel.duyetHoaHongDuAn(duAnId, operatorId);

      return res.status(200).json({
        success: true,
        message: 'Duyệt hoa hồng dự án thành công',
        data: duAn
      });
    } catch (error) {
      console.error('[DuAnOperatorController] Lỗi duyetHoaHong:', error);
      
      if (error.message === 'Dự án không tồn tại') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('không có') || error.message.includes('đã')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi duyệt hoa hồng',
        error: error.message
      });
    }
  }

  /**
   * POST /api/operator/du-an/:id/tu-choi-hoa-hong
   * Từ chối hoa hồng dự án
   */
  static async tuChoiHoaHong(req, res) {
    try {
      const duAnId = parseInt(req.params.id);
      const operatorId = req.user.NguoiDungID;
      const { lyDo, ghiChu } = req.body;

      if (!duAnId || isNaN(duAnId)) {
        return res.status(400).json({
          success: false,
          message: 'ID dự án không hợp lệ'
        });
      }

      if (!lyDo || lyDo.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Lý do từ chối phải có ít nhất 10 ký tự'
        });
      }

      const duAn = await DuAnOperatorModel.tuChoiHoaHongDuAn(duAnId, operatorId, lyDo, ghiChu);

      return res.status(200).json({
        success: true,
        message: 'Từ chối hoa hồng dự án thành công',
        data: duAn
      });
    } catch (error) {
      console.error('[DuAnOperatorController] Lỗi tuChoiHoaHong:', error);
      
      if (error.message === 'Dự án không tồn tại') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('đã được duyệt') || error.message.includes('phải có ít nhất')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi từ chối hoa hồng',
        error: error.message
      });
    }
  }
}

module.exports = DuAnOperatorController;






