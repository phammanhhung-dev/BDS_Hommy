/**
 * Controller: ChinhSachCocController
 * Mô tả: Xử lý HTTP requests cho Chính sách Cọc
 * Tác giả: GitHub Copilot
 * Ngày tạo: 2025-10-16
 */

const ChinhSachCocModel = require('../models/ChinhSachCocModel');
const NhatKyHeThongService = require('../services/NhatKyHeThongService');

const getChuDuAnIdFromRequest = (req) => req.user?.NguoiDungID ?? req.user?.id ?? null;

class ChinhSachCocController {
  /**
   * GET /api/chu-du-an/chinh-sach-coc
   * Lấy danh sách chính sách cọc của Chủ dự án
   */
  static async layDanhSach(req, res) {
    try {
      const chuDuAnID = getChuDuAnIdFromRequest(req); // Từ middleware auth
      if (!chuDuAnID) {
        return res.status(401).json({
          success: false,
          message: 'Không xác định được chủ dự án'
        });
      }
      const chiLayHieuLuc = req.query.chiLayHieuLuc !== 'false'; // Default: true

      const danhSach = await ChinhSachCocModel.layDanhSach(chuDuAnID, chiLayHieuLuc);

      return res.status(200).json({
        success: true,
        data: danhSach,
        message: `Lấy danh sách ${danhSach.length} chính sách cọc thành công`
      });
    } catch (error) {
      console.error('❌ ChinhSachCocController.layDanhSach() error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách chính sách cọc',
        error: error.message
      });
    }
  }

  /**
   * GET /api/chu-du-an/chinh-sach-coc/:id
   * Lấy chi tiết một chính sách cọc
   */
  static async layChiTiet(req, res) {
    try {
      const chinhSachCocID = parseInt(req.params.id);
      const chuDuAnID = getChuDuAnIdFromRequest(req);

      if (isNaN(chinhSachCocID)) {
        return res.status(400).json({
          success: false,
          message: 'ID chính sách cọc không hợp lệ'
        });
      }

      // Kiểm tra quyền sở hữu (trừ chính sách mặc định)
      if (chinhSachCocID !== 1) {
        const coQuyen = await ChinhSachCocModel.kiemTraQuyenSoHuu(chinhSachCocID, chuDuAnID);
        if (!coQuyen) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xem chính sách cọc này'
          });
        }
      }

      const chiTiet = await ChinhSachCocModel.layChiTiet(chinhSachCocID);

      if (!chiTiet) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chính sách cọc'
        });
      }

      return res.status(200).json({
        success: true,
        data: chiTiet
      });
    } catch (error) {
      console.error('❌ ChinhSachCocController.layChiTiet() error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy chi tiết chính sách cọc',
        error: error.message
      });
    }
  }

  /**
   * POST /api/chu-du-an/chinh-sach-coc
   * Tạo chính sách cọc mới
   */
  static async taoMoi(req, res) {
    try {
      const chuDuAnID = getChuDuAnIdFromRequest(req);
      if (!chuDuAnID) {
        return res.status(401).json({
          success: false,
          message: 'Không xác định được chủ dự án'
        });
      }
      const {
        TenChinhSach,
        MoTa,
        ChoPhepCocGiuCho,
        TTL_CocGiuCho_Gio,
        TyLePhat_CocGiuCho,
        ChoPhepCocAnNinh,
        SoTienCocAnNinhMacDinh,
        QuyTacGiaiToa,
        HieuLuc
      } = req.body;

      // Validation
      const errors = [];

      if (!TenChinhSach || TenChinhSach.trim().length === 0) {
        errors.push('Tên chính sách không được để trống');
      } else if (TenChinhSach.length > 255) {
        errors.push('Tên chính sách không được vượt quá 255 ký tự');
      }

      if (TTL_CocGiuCho_Gio !== undefined) {
        const ttl = parseInt(TTL_CocGiuCho_Gio);
        if (isNaN(ttl) || ttl < 1) {
          errors.push('TTL cọc giữ chỗ phải lớn hơn 0 giờ');
        } else if (ttl > 168) { // 7 ngày
          errors.push('TTL cọc giữ chỗ không được vượt quá 168 giờ (7 ngày)');
        }
      }

      if (TyLePhat_CocGiuCho !== undefined) {
        const tyLe = parseFloat(TyLePhat_CocGiuCho);
        if (isNaN(tyLe) || tyLe < 0 || tyLe > 100) {
          errors.push('Tỷ lệ phạt phải từ 0 đến 100%');
        }
      }

      if (QuyTacGiaiToa && !['BanGiao', 'TheoNgay', 'Khac'].includes(QuyTacGiaiToa)) {
        errors.push('Quy tắc giải tỏa không hợp lệ (BanGiao/TheoNgay/Khac)');
      }

      if (SoTienCocAnNinhMacDinh !== undefined && SoTienCocAnNinhMacDinh !== null) {
        const soTienGiuCho = parseFloat(SoTienCocAnNinhMacDinh);
        if (isNaN(soTienGiuCho) || soTienGiuCho < 0) {
          errors.push('Số tiền cọc giữ chỗ phải lớn hơn hoặc bằng 0');
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors
        });
      }

      // Tạo chính sách mới
      const chinhSachCocID = await ChinhSachCocModel.taoMoi(chuDuAnID, {
        TenChinhSach: TenChinhSach.trim(),
        MoTa: MoTa?.trim() || null,
        ChoPhepCocGiuCho,
        TTL_CocGiuCho_Gio,
        TyLePhat_CocGiuCho,
        ChoPhepCocAnNinh,
        SoTienCocAnNinhMacDinh,
        QuyTacGiaiToa,
        HieuLuc
      });

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan({
        NguoiDungID: chuDuAnID,
        HanhDong: 'TAO_CHINH_SACH_COC',
        DoiTuongID: chinhSachCocID,
        DoiTuongLoai: 'ChinhSachCoc',
        ChiTiet: `Tạo chính sách cọc mới: ${TenChinhSach}`
      });

      // Lấy chi tiết chính sách vừa tạo
      const chiTiet = await ChinhSachCocModel.layChiTiet(chinhSachCocID);

      return res.status(201).json({
        success: true,
        data: chiTiet,
        message: 'Tạo chính sách cọc thành công'
      });
    } catch (error) {
      console.error('❌ ChinhSachCocController.taoMoi() error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo chính sách cọc',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/chu-du-an/chinh-sach-coc/:id
   * Cập nhật chính sách cọc
   */
  static async capNhat(req, res) {
    try {
      const chinhSachCocID = parseInt(req.params.id);
      const chuDuAnID = getChuDuAnIdFromRequest(req);

      if (isNaN(chinhSachCocID)) {
        return res.status(400).json({
          success: false,
          message: 'ID chính sách cọc không hợp lệ'
        });
      }

      // Không cho phép cập nhật chính sách mặc định
      if (chinhSachCocID === 1) {
        return res.status(403).json({
          success: false,
          message: 'Không thể cập nhật chính sách cọc mặc định của hệ thống'
        });
      }

      // Kiểm tra quyền sở hữu
      const coQuyen = await ChinhSachCocModel.kiemTraQuyenSoHuu(chinhSachCocID, chuDuAnID);
      if (!coQuyen) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền cập nhật chính sách cọc này'
        });
      }

      const {
        TenChinhSach,
        MoTa,
        ChoPhepCocGiuCho,
        TTL_CocGiuCho_Gio,
        TyLePhat_CocGiuCho,
        ChoPhepCocAnNinh,
        SoTienCocAnNinhMacDinh,
        QuyTacGiaiToa,
        HieuLuc
      } = req.body;

      // Validation (chỉ validate các fields có trong request)
      const errors = [];

      if (TenChinhSach !== undefined) {
        if (!TenChinhSach || TenChinhSach.trim().length === 0) {
          errors.push('Tên chính sách không được để trống');
        } else if (TenChinhSach.length > 255) {
          errors.push('Tên chính sách không được vượt quá 255 ký tự');
        }
      }

      if (TTL_CocGiuCho_Gio !== undefined) {
        const ttl = parseInt(TTL_CocGiuCho_Gio);
        if (isNaN(ttl) || ttl < 1) {
          errors.push('TTL cọc giữ chỗ phải lớn hơn 0 giờ');
        } else if (ttl > 168) {
          errors.push('TTL cọc giữ chỗ không được vượt quá 168 giờ (7 ngày)');
        }
      }

      if (TyLePhat_CocGiuCho !== undefined) {
        const tyLe = parseFloat(TyLePhat_CocGiuCho);
        if (isNaN(tyLe) || tyLe < 0 || tyLe > 100) {
          errors.push('Tỷ lệ phạt phải từ 0 đến 100%');
        }
      }

      if (QuyTacGiaiToa !== undefined && !['BanGiao', 'TheoNgay', 'Khac'].includes(QuyTacGiaiToa)) {
        errors.push('Quy tắc giải tỏa không hợp lệ (BanGiao/TheoNgay/Khac)');
      }

      if (SoTienCocAnNinhMacDinh !== undefined && SoTienCocAnNinhMacDinh !== null) {
        const soTienGiuCho = parseFloat(SoTienCocAnNinhMacDinh);
        if (isNaN(soTienGiuCho) || soTienGiuCho < 0) {
          errors.push('Số tiền cọc giữ chỗ phải lớn hơn hoặc bằng 0');
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors
        });
      }

      // Cập nhật
      const dataUpdate = {};
      if (TenChinhSach !== undefined) dataUpdate.TenChinhSach = TenChinhSach.trim();
      if (MoTa !== undefined) dataUpdate.MoTa = MoTa?.trim() || null;
      if (ChoPhepCocGiuCho !== undefined) dataUpdate.ChoPhepCocGiuCho = ChoPhepCocGiuCho;
      if (TTL_CocGiuCho_Gio !== undefined) dataUpdate.TTL_CocGiuCho_Gio = TTL_CocGiuCho_Gio;
      if (TyLePhat_CocGiuCho !== undefined) dataUpdate.TyLePhat_CocGiuCho = TyLePhat_CocGiuCho;
      if (ChoPhepCocAnNinh !== undefined) dataUpdate.ChoPhepCocAnNinh = ChoPhepCocAnNinh;
      if (SoTienCocAnNinhMacDinh !== undefined) dataUpdate.SoTienCocAnNinhMacDinh = SoTienCocAnNinhMacDinh;
      if (QuyTacGiaiToa !== undefined) dataUpdate.QuyTacGiaiToa = QuyTacGiaiToa;
      if (HieuLuc !== undefined) dataUpdate.HieuLuc = HieuLuc;

      await ChinhSachCocModel.capNhat(chinhSachCocID, dataUpdate);

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan({
        NguoiDungID: chuDuAnID,
        HanhDong: 'CAP_NHAT_CHINH_SACH_COC',
        DoiTuongID: chinhSachCocID,
        DoiTuongLoai: 'ChinhSachCoc',
        ChiTiet: `Cập nhật chính sách cọc ID ${chinhSachCocID}`
      });

      // Lấy chi tiết sau khi cập nhật
      const chiTiet = await ChinhSachCocModel.layChiTiet(chinhSachCocID);

      return res.status(200).json({
        success: true,
        data: chiTiet,
        message: 'Cập nhật chính sách cọc thành công'
      });
    } catch (error) {
      console.error('❌ ChinhSachCocController.capNhat() error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật chính sách cọc',
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/chu-du-an/chinh-sach-coc/:id
   * Vô hiệu hóa chính sách cọc (soft delete)
   */
  static async voHieuHoa(req, res) {
    try {
      const chinhSachCocID = parseInt(req.params.id);
      const chuDuAnID = getChuDuAnIdFromRequest(req);

      if (isNaN(chinhSachCocID)) {
        return res.status(400).json({
          success: false,
          message: 'ID chính sách cọc không hợp lệ'
        });
      }

      // Không cho phép xóa chính sách mặc định
      if (chinhSachCocID === 1) {
        return res.status(403).json({
          success: false,
          message: 'Không thể xóa chính sách cọc mặc định của hệ thống'
        });
      }

      // Kiểm tra quyền sở hữu
      const coQuyen = await ChinhSachCocModel.kiemTraQuyenSoHuu(chinhSachCocID, chuDuAnID);
      if (!coQuyen) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xóa chính sách cọc này'
        });
      }

      await ChinhSachCocModel.voHieuHoa(chinhSachCocID);

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan({
        NguoiDungID: chuDuAnID,
        HanhDong: 'VO_HIEU_HOA_CHINH_SACH_COC',
        DoiTuongID: chinhSachCocID,
        DoiTuongLoai: 'ChinhSachCoc',
        ChiTiet: `Vô hiệu hóa chính sách cọc ID ${chinhSachCocID}`
      });

      return res.status(200).json({
        success: true,
        message: 'Vô hiệu hóa chính sách cọc thành công'
      });
    } catch (error) {
      console.error('❌ ChinhSachCocController.voHieuHoa() error:', error);
      
      // Xử lý error đặc biệt từ model
      if (error.message.includes('đang được sử dụng')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi vô hiệu hóa chính sách cọc',
        error: error.message
      });
    }
  }
}

module.exports = ChinhSachCocController;
