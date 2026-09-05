/**
 * Controller xử lý các nghiệp vụ của Operator/Admin
 * Chức năng: Quản lý banned dự án, duyệt yêu cầu mở lại
 */

const db = require('../config/db');
const NhatKyHeThongService = require('../services/NhatKyHeThongService');
const OperatorService = require('../services/OperatorService');

class OperatorController {
  /**
   * UC-OPR-01: Banned dự án (Operator/Admin ngưng hoạt động dự án do vi phạm)
   * PUT /api/operator/du-an/:id/banned
   * 
   * @param {Object} req.params.id - DuAnID cần banned
   * @param {Object} req.body.LyDoNgungHoatDong - Lý do vi phạm (required, min 10 chars)
   * @param {Object} req.user - Thông tin Operator từ JWT
   * @returns {Object} 200 - Success với thông tin dự án đã banned
   * @returns {Object} 400 - Validation errors
   * @returns {Object} 404 - Dự án không tồn tại
   * @returns {Object} 409 - Dự án đã bị banned trước đó
   */
  static async bannedDuAn(req, res) {
    const connection = await db.getConnection();
    
    try {
      const duAnId = parseInt(req.params.id);
      const { LyDoNgungHoatDong } = req.body;
      const operatorId = req.user.NguoiDungID;
      
      // Validation
      if (!LyDoNgungHoatDong || LyDoNgungHoatDong.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Lý do ngưng hoạt động phải có ít nhất 10 ký tự',
        });
      }

      if (LyDoNgungHoatDong.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Lý do ngưng hoạt động không được vượt quá 1000 ký tự',
        });
      }

      await connection.beginTransaction();

      // Kiểm tra dự án tồn tại
      const [duAnRows] = await connection.execute(
        'SELECT DuAnID, TenDuAn, TrangThai, ChuDuAnID FROM duan WHERE DuAnID = ?',
        [duAnId]
      );

      if (!duAnRows.length) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Dự án không tồn tại',
        });
      }

      const duAn = duAnRows[0];

      // Kiểm tra đã bị banned chưa
      if (duAn.TrangThai === 'NgungHoatDong') {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: 'Dự án đã bị ngưng hoạt động trước đó. Không thể banned lại.',
        });
      }

      // Update dự án: TrangThai = NgungHoatDong
      await connection.execute(
        `UPDATE duan 
         SET TrangThai = 'NgungHoatDong',
             LyDoNgungHoatDong = ?,
             NguoiNgungHoatDongID = ?,
             NgungHoatDongLuc = NOW(),
             YeuCauMoLai = 'ChuaGui',
             CapNhatLuc = NOW()
         WHERE DuAnID = ?`,
        [LyDoNgungHoatDong.trim(), operatorId, duAnId]
      );

      // Tạm ngưng tất cả tin đăng của dự án (optional - tùy nghiệp vụ)
      await connection.execute(
        `UPDATE tindang 
         SET TrangThai = 'TamNgung', 
             CapNhatLuc = NOW()
         WHERE DuAnID = ? 
         AND TrangThai IN ('DaDang', 'DaDuyet', 'ChoDuyet')`,
        [duAnId]
      );

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan({
        TacNhan: 'Operator',
        NguoiDungID: operatorId,
        HanhDong: 'BANNED_DU_AN',
        DoiTuong: 'DuAn',
        DoiTuongID: duAnId,
        ChiTiet: JSON.stringify({
          TenDuAn: duAn.TenDuAn,
          ChuDuAnID: duAn.ChuDuAnID,
          LyDoNgungHoatDong: LyDoNgungHoatDong.trim(),
        }),
      });

      await connection.commit();

      // Lấy thông tin dự án sau khi update
      const [updatedRows] = await connection.execute(
        `SELECT 
          DuAnID, TenDuAn, TrangThai, 
          LyDoNgungHoatDong, NgungHoatDongLuc, YeuCauMoLai,
          nd.TenDayDu AS NguoiNgungHoatDong_TenDayDu
         FROM duan da
         LEFT JOIN nguoidung nd ON da.NguoiNgungHoatDongID = nd.NguoiDungID
         WHERE da.DuAnID = ?`,
        [duAnId]
      );

      return res.status(200).json({
        success: true,
        message: 'Đã ngưng hoạt động dự án thành công',
        data: updatedRows[0],
      });
    } catch (error) {
      await connection.rollback();
      console.error('Lỗi khi banned dự án:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi xử lý yêu cầu banned dự án',
        error: error.message,
      });
    } finally {
      connection.release();
    }
  }

  /**
   * UC-OPR-02: Xử lý yêu cầu mở lại dự án (Operator/Admin duyệt/từ chối)
   * PUT /api/operator/du-an/:id/xu-ly-yeu-cau
   * 
   * @param {Object} req.params.id - DuAnID
   * @param {Object} req.body.KetQua - 'ChapNhan' hoặc 'TuChoi' (required)
   * @param {Object} req.body.LyDoTuChoiMoLai - Lý do từ chối (required nếu KetQua = TuChoi, min 10 chars)
   * @param {Object} req.user - Thông tin Operator từ JWT
   * @returns {Object} 200 - Success
   * @returns {Object} 400 - Validation errors
   * @returns {Object} 404 - Dự án không tồn tại hoặc không có yêu cầu
   * @returns {Object} 409 - Yêu cầu đã được xử lý trước đó
   */
  static async xuLyYeuCauMoLai(req, res) {
    const connection = await db.getConnection();
    
    try {
      const duAnId = parseInt(req.params.id);
      const { KetQua, LyDoTuChoiMoLai } = req.body;
      const operatorId = req.user.NguoiDungID;

      // Validation
      if (!KetQua || !['ChapNhan', 'TuChoi'].includes(KetQua)) {
        return res.status(400).json({
          success: false,
          message: "KetQua phải là 'ChapNhan' hoặc 'TuChoi'",
        });
      }

      if (KetQua === 'TuChoi') {
        if (!LyDoTuChoiMoLai || LyDoTuChoiMoLai.trim().length < 10) {
          return res.status(400).json({
            success: false,
            message: 'Lý do từ chối phải có ít nhất 10 ký tự',
          });
        }
        if (LyDoTuChoiMoLai.length > 1000) {
          return res.status(400).json({
            success: false,
            message: 'Lý do từ chối không được vượt quá 1000 ký tự',
          });
        }
      }

      await connection.beginTransaction();

      // Kiểm tra dự án và yêu cầu
      const [duAnRows] = await connection.execute(
        `SELECT DuAnID, TenDuAn, TrangThai, YeuCauMoLai, NoiDungGiaiTrinh, ChuDuAnID
         FROM duan 
         WHERE DuAnID = ?`,
        [duAnId]
      );

      if (!duAnRows.length) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Dự án không tồn tại',
        });
      }

      const duAn = duAnRows[0];

      // Validate trạng thái yêu cầu
      if (duAn.YeuCauMoLai !== 'DangXuLy') {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: duAn.YeuCauMoLai === 'ChuaGui' 
            ? 'Dự án chưa có yêu cầu mở lại' 
            : 'Yêu cầu đã được xử lý trước đó',
        });
      }

      // Xử lý theo KetQua
      if (KetQua === 'ChapNhan') {
        // Chấp nhận: Mở lại dự án
        await connection.execute(
          `UPDATE duan 
           SET TrangThai = 'HoatDong',
               YeuCauMoLai = 'ChapNhan',
               NguoiXuLyYeuCauID = ?,
               ThoiGianXuLyYeuCau = NOW(),
               LyDoTuChoiMoLai = NULL,
               CapNhatLuc = NOW()
           WHERE DuAnID = ?`,
          [operatorId, duAnId]
        );

        // Kích hoạt lại tin đăng (optional)
        await connection.execute(
          `UPDATE tindang 
           SET TrangThai = 'DaDang',
               CapNhatLuc = NOW()
           WHERE DuAnID = ? 
           AND TrangThai = 'TamNgung'`,
          [duAnId]
        );

        // Ghi audit log
        await NhatKyHeThongService.ghiNhan({
          TacNhan: 'Operator',
          NguoiDungID: operatorId,
          HanhDong: 'CHAP_NHAN_YEU_CAU_MO_LAI',
          DoiTuong: 'DuAn',
          DoiTuongID: duAnId,
          ChiTiet: JSON.stringify({
            TenDuAn: duAn.TenDuAn,
            ChuDuAnID: duAn.ChuDuAnID,
            NoiDungGiaiTrinh: duAn.NoiDungGiaiTrinh,
          }),
        });

      } else {
        // Từ chối: Giữ nguyên TrangThai = NgungHoatDong
        await connection.execute(
          `UPDATE duan 
           SET YeuCauMoLai = 'TuChoi',
               LyDoTuChoiMoLai = ?,
               NguoiXuLyYeuCauID = ?,
               ThoiGianXuLyYeuCau = NOW(),
               CapNhatLuc = NOW()
           WHERE DuAnID = ?`,
          [LyDoTuChoiMoLai.trim(), operatorId, duAnId]
        );

        // Ghi audit log
        await NhatKyHeThongService.ghiNhan({
          TacNhan: 'Operator',
          NguoiDungID: operatorId,
          HanhDong: 'TU_CHOI_YEU_CAU_MO_LAI',
          DoiTuong: 'DuAn',
          DoiTuongID: duAnId,
          ChiTiet: JSON.stringify({
            TenDuAn: duAn.TenDuAn,
            ChuDuAnID: duAn.ChuDuAnID,
            NoiDungGiaiTrinh: duAn.NoiDungGiaiTrinh,
            LyDoTuChoiMoLai: LyDoTuChoiMoLai.trim(),
          }),
        });
      }

      await connection.commit();

      // Lấy thông tin sau khi update
      const [updatedRows] = await connection.execute(
        `SELECT 
          DuAnID, TenDuAn, TrangThai, YeuCauMoLai,
          LyDoNgungHoatDong, NoiDungGiaiTrinh, 
          ThoiGianXuLyYeuCau, LyDoTuChoiMoLai,
          nd_xuly.TenDayDu AS NguoiXuLyYeuCau_TenDayDu
         FROM duan da
         LEFT JOIN nguoidung nd_xuly ON da.NguoiXuLyYeuCauID = nd_xuly.NguoiDungID
         WHERE da.DuAnID = ?`,
        [duAnId]
      );

      return res.status(200).json({
        success: true,
        message: KetQua === 'ChapNhan' 
          ? 'Đã chấp nhận yêu cầu và mở lại dự án' 
          : 'Đã từ chối yêu cầu mở lại',
        data: updatedRows[0],
      });
    } catch (error) {
      await connection.rollback();
      console.error('Lỗi khi xử lý yêu cầu mở lại:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi xử lý yêu cầu',
        error: error.message,
      });
    } finally {
      connection.release();
    }
  }

  /**
   * UC-OPR-03: Lấy danh sách cuộc hẹn (cho Operator calendar view)
   * GET /api/operator/cuoc-hen
   */
  static async layDanhSachCuocHen(req, res) {
    try {
      const filters = {
        nhanVienId: req.query.nhanVienId,
        trangThai: req.query.trangThai,
        tuNgay: req.query.tuNgay,
        denNgay: req.query.denNgay,
        page: req.query.page || 1,
        limit: req.query.limit || 20
      };

      const result = await OperatorService.layDanhSachCuocHen(filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('[OperatorController] layDanhSachCuocHen error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * UC-OPR-03: Lấy cuộc hẹn cần gán NVBH
   * GET /api/operator/cuoc-hen/can-gan
   */
  static async layCuocHenCanGan(req, res) {
    try {
      const data = await OperatorService.layCuocHenCanGan();

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('[OperatorController] layCuocHenCanGan error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * UC-OPR-03: Gán lại cuộc hẹn cho NVBH khác
   * PUT /api/operator/cuoc-hen/:id/gan-lai
   */
  static async ganLaiCuocHen(req, res) {
    try {
      const cuocHenId = parseInt(req.params.id);
      const { nhanVienBanHangId } = req.body;
      const operatorId = req.user.NguoiDungID;

      // Validation
      if (!nhanVienBanHangId) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn nhân viên bán hàng'
        });
      }

      if (!Number.isInteger(parseInt(nhanVienBanHangId))) {
        return res.status(400).json({
          success: false,
          message: 'ID nhân viên bán hàng không hợp lệ'
        });
      }

      const result = await OperatorService.ganLaiCuocHen(
        cuocHenId,
        parseInt(nhanVienBanHangId),
        operatorId
      );

      res.json({
        success: true,
        message: 'Đã gán lại cuộc hẹn thành công',
        data: result
      });
    } catch (error) {
      console.error('[OperatorController] ganLaiCuocHen error:', error);
      
      // Handle specific errors
      if (error.message.includes('không tồn tại')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('không có quyền') || error.message.includes('trạng thái')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * UC-OPR-03: Lấy thống kê cuộc hẹn
   * GET /api/operator/cuoc-hen/thong-ke
   */
  static async layThongKeCuocHen(req, res) {
    try {
      const filters = {
        tuNgay: req.query.tuNgay,
        denNgay: req.query.denNgay
      };

      const stats = await OperatorService.layThongKeCuocHen(filters);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('[OperatorController] layThongKeCuocHen error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * UC-OPR-03: Lấy lịch làm việc NVBH (shifts + appointments)
   * GET /api/operator/lich-lam-viec
   */
  static async layLichLamViec(req, res) {
    try {
      const filters = {
        nhanVienId: req.query.nhanVienId,
        tuNgay: req.query.tuNgay,
        denNgay: req.query.denNgay
      };

      const schedule = await OperatorService.layLichLamViec(filters);

      res.json({
        success: true,
        data: schedule
      });
    } catch (error) {
      console.error('[OperatorController] layLichLamViec error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = OperatorController;
