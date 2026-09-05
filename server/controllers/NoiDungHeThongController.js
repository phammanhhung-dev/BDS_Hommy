/**
 * Controller cho Nội dung Hệ thống
 * Quản lý các chính sách, điều khoản, hướng dẫn
 * Chỉ dành cho QuanTriVienHeThong
 */

const NoiDungHeThongModel = require('../models/NoiDungHeThongModel');
const NhatKyHeThongService = require('../services/NhatKyHeThongService');

const ALLOWED_LOAI_NOI_DUNG = new Set([
  'POLICY_PRIVACY',
  'TERMS_USAGE',
  'POLICY_PAYMENT',
  'GUIDE_BOOKING'
]);

/**
 * Lấy danh sách nội dung hệ thống
 * GET /api/operator/noi-dung-he-thong
 */
async function danhSach(req, res) {
  try {
    const { loaiNoiDung, keyword, page = 1, limit = 20 } = req.query;

    const filters = {
      loaiNoiDung: loaiNoiDung || null,
      keyword: keyword || '',
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };

    const result = await NoiDungHeThongModel.layDanhSach(filters);

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit
      }
    });
  } catch (error) {
    console.error('[NoiDungHeThongController] Lỗi danhSach:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách nội dung hệ thống',
      error: error.message
    });
  }
}

/**
 * Lấy nội dung theo ID
 * GET /api/operator/noi-dung-he-thong/:id
 */
async function layTheoID(req, res) {
  try {
    const noiDungID = parseInt(req.params.id, 10);

    if (!noiDungID || isNaN(noiDungID)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ'
      });
    }

    const noiDung = await NoiDungHeThongModel.layTheoID(noiDungID);

    if (!noiDung) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nội dung'
      });
    }

    return res.status(200).json({
      success: true,
      data: noiDung
    });
  } catch (error) {
    console.error('[NoiDungHeThongController] Lỗi layTheoID:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy nội dung',
      error: error.message
    });
  }
}

/**
 * Tạo nội dung mới
 * POST /api/operator/noi-dung-he-thong
 */
async function taoMoi(req, res) {
  try {
    const { LoaiNoiDung, TieuDe, NoiDung, PhienBan } = req.body;

    // Validation
    if (!LoaiNoiDung || !ALLOWED_LOAI_NOI_DUNG.has(LoaiNoiDung)) {
      return res.status(400).json({
        success: false,
        message: `LoaiNoiDung không hợp lệ. Chỉ chấp nhận: ${Array.from(ALLOWED_LOAI_NOI_DUNG).join(', ')}`
      });
    }

    if (!TieuDe || TieuDe.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề không được để trống'
      });
    }

    if (!NoiDung || NoiDung.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung không được để trống'
      });
    }

    if (TieuDe.length > 255) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề không được vượt quá 255 ký tự'
      });
    }

    // Đảm bảo NguoiDungID tồn tại
    const capNhatBoiID = req.user?.NguoiDungID || req.user?.id || req.user?.userId;
    if (!capNhatBoiID) {
      return res.status(401).json({
        success: false,
        message: 'Không xác định được người dùng'
      });
    }

    const noiDung = await NoiDungHeThongModel.taoMoi(
      {
        LoaiNoiDung,
        TieuDe: TieuDe.trim(),
        NoiDung: NoiDung.trim(),
        PhienBan: PhienBan || '1.0'
      },
      capNhatBoiID
    );

    // Audit log
    await NhatKyHeThongService.ghiNhan(
      capNhatBoiID,
      'tao_noi_dung_he_thong',
      'NoiDungHeThong',
      noiDung.NoiDungID,
      null,
      JSON.stringify({ LoaiNoiDung, TieuDe }),
      req.ip,
      req.get('user-agent')
    );

    return res.status(201).json({
      success: true,
      message: 'Tạo nội dung hệ thống thành công',
      data: noiDung
    });
  } catch (error) {
    console.error('[NoiDungHeThongController] Lỗi taoMoi:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo nội dung hệ thống',
      error: error.message
    });
  }
}

/**
 * Cập nhật nội dung
 * PUT /api/operator/noi-dung-he-thong/:id
 */
async function capNhat(req, res) {
  try {
    const noiDungID = parseInt(req.params.id, 10);

    if (!noiDungID || isNaN(noiDungID)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ'
      });
    }

    // Kiểm tra nội dung có tồn tại không
    const existing = await NoiDungHeThongModel.layTheoID(noiDungID);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nội dung'
      });
    }

    const { LoaiNoiDung, TieuDe, NoiDung, PhienBan } = req.body;

    // Validation
    if (LoaiNoiDung && !ALLOWED_LOAI_NOI_DUNG.has(LoaiNoiDung)) {
      return res.status(400).json({
        success: false,
        message: `LoaiNoiDung không hợp lệ. Chỉ chấp nhận: ${Array.from(ALLOWED_LOAI_NOI_DUNG).join(', ')}`
      });
    }

    if (TieuDe !== undefined) {
      if (!TieuDe || TieuDe.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Tiêu đề không được để trống'
        });
      }
      if (TieuDe.length > 255) {
        return res.status(400).json({
          success: false,
          message: 'Tiêu đề không được vượt quá 255 ký tự'
        });
      }
    }

    if (NoiDung !== undefined && (!NoiDung || NoiDung.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung không được để trống'
      });
    }

    const oldValue = JSON.stringify({
      LoaiNoiDung: existing.LoaiNoiDung,
      TieuDe: existing.TieuDe,
      NoiDung: existing.NoiDung,
      PhienBan: existing.PhienBan
    });

    // Đảm bảo NguoiDungID tồn tại
    const capNhatBoiID = req.user?.NguoiDungID || req.user?.id || req.user?.userId;
    if (!capNhatBoiID) {
      return res.status(401).json({
        success: false,
        message: 'Không xác định được người dùng'
      });
    }

    const noiDung = await NoiDungHeThongModel.capNhat(
      noiDungID,
      {
        LoaiNoiDung,
        TieuDe: TieuDe ? TieuDe.trim() : undefined,
        NoiDung: NoiDung ? NoiDung.trim() : undefined,
        PhienBan
      },
      capNhatBoiID
    );

    // Audit log
    await NhatKyHeThongService.ghiNhan(
      capNhatBoiID,
      'cap_nhat_noi_dung_he_thong',
      'NoiDungHeThong',
      noiDungID,
      oldValue,
      JSON.stringify({
        LoaiNoiDung: noiDung.LoaiNoiDung,
        TieuDe: noiDung.TieuDe,
        NoiDung: noiDung.NoiDung,
        PhienBan: noiDung.PhienBan
      }),
      req.ip,
      req.get('user-agent')
    );

    return res.status(200).json({
      success: true,
      message: 'Cập nhật nội dung hệ thống thành công',
      data: noiDung
    });
  } catch (error) {
    console.error('[NoiDungHeThongController] Lỗi capNhat:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật nội dung hệ thống',
      error: error.message
    });
  }
}

/**
 * Xóa nội dung
 * DELETE /api/operator/noi-dung-he-thong/:id
 */
async function xoa(req, res) {
  try {
    const noiDungID = parseInt(req.params.id, 10);

    if (!noiDungID || isNaN(noiDungID)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ'
      });
    }

    // Kiểm tra nội dung có tồn tại không
    const existing = await NoiDungHeThongModel.layTheoID(noiDungID);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nội dung'
      });
    }

    const deleted = await NoiDungHeThongModel.xoa(noiDungID);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Không thể xóa nội dung'
      });
    }

    // Đảm bảo NguoiDungID tồn tại
    const capNhatBoiID = req.user?.NguoiDungID || req.user?.id || req.user?.userId;
    if (!capNhatBoiID) {
      return res.status(401).json({
        success: false,
        message: 'Không xác định được người dùng'
      });
    }

    // Audit log
    await NhatKyHeThongService.ghiNhan(
      capNhatBoiID,
      'xoa_noi_dung_he_thong',
      'NoiDungHeThong',
      noiDungID,
      JSON.stringify({
        LoaiNoiDung: existing.LoaiNoiDung,
        TieuDe: existing.TieuDe
      }),
      null,
      req.ip,
      req.get('user-agent')
    );

    return res.status(200).json({
      success: true,
      message: 'Xóa nội dung hệ thống thành công'
    });
  } catch (error) {
    console.error('[NoiDungHeThongController] Lỗi xoa:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa nội dung hệ thống',
      error: error.message
    });
  }
}

module.exports = {
  danhSach,
  layTheoID,
  taoMoi,
  capNhat,
  xoa
};

