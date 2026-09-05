/**
 * @fileoverview Controller quản lý Chat/Messaging
 * @module ChatController
 */

const ChatModel = require('../models/ChatModel');
const NhatKyService = require('../services/NhatKyHeThongService');

class ChatController {
  /**
   * POST /api/chat/conversations
   * Tạo hoặc lấy cuộc hội thoại
   */
  static async taoHoacLayCuocHoiThoai(req, res) {
    try {
      const nguoiDungID = req.user.NguoiDungID || req.user.id;
      const { NguCanhID, NguCanhLoai, ThanhVienIDs, TieuDe } = req.body;

      console.log('[ChatController] 🔍 Creating conversation - User ID:', nguoiDungID, 'ThanhVienIDs:', ThanhVienIDs);

      // Validation
      if (!NguCanhID || !NguCanhLoai) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu NguCanhID hoặc NguCanhLoai'
        });
      }

      // Đảm bảo người tạo cũng là thành viên
      const allThanhVienIDs = Array.from(new Set([nguoiDungID, ...(ThanhVienIDs || [])]));

      const cuocHoiThoaiID = await ChatModel.taoHoacLayCuocHoiThoai({
        NguCanhID,
        NguCanhLoai,
        ThanhVienIDs: allThanhVienIDs,
        TieuDe
      });

      // Audit log
      await NhatKyService.ghiNhan({
        NguoiDungID: nguoiDungID,
        HanhDong: 'tao_cuoc_hoi_thoai',
        DoiTuong: 'cuochoithoai',
        DoiTuongID: cuocHoiThoaiID,
        ChiTiet: JSON.stringify({ NguCanhID, NguCanhLoai, ThanhVienIDs: allThanhVienIDs }),
        DiaChiIP: req.ip || '',
        TrinhDuyet: req.get('User-Agent') || '',
        ChuKy: null
      });

      res.status(201).json({
        success: true,
        data: { CuocHoiThoaiID: cuocHoiThoaiID }
      });

    } catch (error) {
      console.error('[ChatController.taoHoacLayCuocHoiThoai]', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi tạo cuộc hội thoại'
      });
    }
  }

  /**
   * GET /api/chat/conversations
   * Lấy danh sách cuộc hội thoại
   */
  static async layDanhSachCuocHoiThoai(req, res) {
    try {
      const nguoiDungID = req.user?.NguoiDungID || req.user?.id;
      console.log('[ChatController] User ID:', nguoiDungID, 'User object:', req.user);
      
      const { limit, offset } = req.query;

      const danhSach = await ChatModel.layDanhSachCuocHoiThoai(nguoiDungID, {
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0
      });

      res.json({
        success: true,
        data: danhSach
      });

    } catch (error) {
      console.error('[ChatController.layDanhSachCuocHoiThoai]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách cuộc hội thoại'
      });
    }
  }

  /**
   * GET /api/chat/conversations/:id
   * Lấy chi tiết cuộc hội thoại
   */
  static async layChiTietCuocHoiThoai(req, res) {
    try {
      const nguoiDungID = req.user.NguoiDungID || req.user.id;
      const { id } = req.params;

      const cuocHoiThoai = await ChatModel.layChiTietCuocHoiThoai(id, nguoiDungID);

      if (!cuocHoiThoai) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy cuộc hội thoại'
        });
      }

      res.json({
        success: true,
        data: cuocHoiThoai
      });

    } catch (error) {
      console.error('[ChatController.layChiTietCuocHoiThoai]', error);
      res.status(error.message.includes('không có quyền') ? 403 : 500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy chi tiết cuộc hội thoại'
      });
    }
  }

  /**
   * GET /api/chat/conversations/:id/messages
   * Lấy tin nhắn trong cuộc hội thoại
   */
  static async layTinNhan(req, res) {
    try {
      const nguoiDungID = req.user.NguoiDungID || req.user.id;
      const { id } = req.params;
      const { limit, offset, beforeTimestamp } = req.query;

      // Kiểm tra quyền truy cập
      const hasAccess = await ChatModel.kiemTraQuyenTruyCap(id, nguoiDungID);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem tin nhắn trong cuộc hội thoại này'
        });
      }

      const tinNhans = await ChatModel.layTinNhan(id, {
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
        beforeTimestamp
      });

      res.json({
        success: true,
        data: tinNhans
      });

    } catch (error) {
      console.error('[ChatController.layTinNhan]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy tin nhắn'
      });
    }
  }

  /**
   * POST /api/chat/conversations/:id/messages
   * Gửi tin nhắn (REST fallback khi Socket.IO offline)
   */
  static async guiTinNhan(req, res) {
    try {
      const nguoiDungID = req.user.NguoiDungID || req.user.id;
      const { id } = req.params;
      const { NoiDung } = req.body;

      if (!NoiDung || NoiDung.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nội dung tin nhắn không được để trống'
        });
      }

      // XSS Prevention: sanitize NoiDung
      const DOMPurify = require('isomorphic-dompurify');
      const sanitizedNoiDung = DOMPurify.sanitize(NoiDung.trim());

      const tinNhan = await ChatModel.guiTinNhan({
        CuocHoiThoaiID: id,
        NguoiGuiID: nguoiDungID,
        NoiDung: sanitizedNoiDung
      });

      // Audit log
      await NhatKyService.ghiNhan({
        NguoiDungID: nguoiDungID,
        HanhDong: 'gui_tin_nhan',
        DoiTuong: 'tinnhan',
        DoiTuongID: tinNhan.TinNhanID,
        ChiTiet: JSON.stringify({ CuocHoiThoaiID: id })
      });

      res.status(201).json({
        success: true,
        data: tinNhan
      });

    } catch (error) {
      console.error('[ChatController.guiTinNhan]', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi gửi tin nhắn'
      });
    }
  }

  /**
   * PUT /api/chat/conversations/:id/mark-read
   * Đánh dấu đã đọc
   */
  static async danhDauDaDoc(req, res) {
    try {
      const nguoiDungID = req.user.NguoiDungID || req.user.id;
      const { id } = req.params;

      await ChatModel.danhDauDaDoc(id, nguoiDungID);

      res.json({
        success: true,
        message: 'Đã đánh dấu đã đọc'
      });

    } catch (error) {
      console.error('[ChatController.danhDauDaDoc]', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi đánh dấu đã đọc'
      });
    }
  }

  /**
   * DELETE /api/chat/messages/:id
   * Xóa tin nhắn (soft delete)
   */
  static async xoaTinNhan(req, res) {
    try {
      const nguoiDungID = req.user.NguoiDungID || req.user.id;
      const { id } = req.params;

      await ChatModel.xoaTinNhan(id, nguoiDungID);

      // Audit log
      await NhatKyService.ghiNhan({
        NguoiDungID: nguoiDungID,
        HanhDong: 'xoa_tin_nhan',
        DoiTuong: 'tinnhan',
        DoiTuongID: id,
        ChiTiet: JSON.stringify({ action: 'soft_delete' })
      });

      res.json({
        success: true,
        message: 'Đã xóa tin nhắn'
      });

    } catch (error) {
      console.error('[ChatController.xoaTinNhan]', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi xóa tin nhắn'
      });
    }
  }
}

module.exports = ChatController;

