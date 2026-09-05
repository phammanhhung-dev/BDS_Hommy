/**
 * Controller cho Cuộc hẹn
 * Xử lý các nghiệp vụ liên quan đến quản lý cuộc hẹn xem phòng
 * Tách từ ChuDuAnController.js theo domain-driven design
 */

const CuocHenModel = require('../models/cuocHenModel');
const NhatKyHeThongService = require('../services/NhatKyHeThongService');

class CuocHenController {
  /**
   * UC-CUST-03: Tạo cuộc hẹn mới (Public - dành cho khách hàng)
   * POST /api/cuoc-hen
   */
  static async create(req, res) {
    try {
      const { PhongID, TinDangID, NhanVienBanHangID, ThoiGianHen, GhiChu, PhuongThucVao } = req.body;
      const KhachHangID = req.user?.id;

      if ((!PhongID && !TinDangID) || !KhachHangID || !ThoiGianHen) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc: TinDangID hoặc PhongID, ThoiGianHen'
        });
      }

      // Validate datetime format
      const henDate = new Date(ThoiGianHen);
      if (isNaN(henDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'ThoiGianHen không hợp lệ'
        });
      }

      // Check thời gian hẹn phải trong tương lai
      if (henDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian hẹn phải trong tương lai'
        });
      }

      // Tạo cuộc hẹn
      const result = await CuocHenModel.taoMoi({
        PhongID,
        TinDangID,
        KhachHangID,
        NhanVienBanHangID,
        ThoiGianHen,
        GhiChu, 
        PhuongThucVao
      });

      // Audit log
      await NhatKyHeThongService.ghiNhan(
        KhachHangID,
        'tao_cuoc_hen',
        'CuocHen',
        result.CuocHenID,
        null,
        { PhongID, ThoiGianHen },
        req.ip,
        req.get('User-Agent')
      );

      res.status(201).json({
        success: true,
        message: 'Đặt lịch hẹn thành công',
        data: result
      });
    } catch (error) {
      console.error('[CuocHenController] Lỗi tạo cuộc hẹn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống'
      });
    }
  }

  /**
   * Lấy tất cả cuộc hẹn (Admin only)
   * GET /api/cuoc-hen
   */
  static async getAll(req, res) {
    try {
      const { trangThai } = req.query;
      
      const cuocHenList = await CuocHenModel.layTatCa({ trangThai });

      res.json({
        success: true,
        data: cuocHenList
      });
    } catch (error) {
      console.error('[CuocHenController] Lỗi lấy danh sách cuộc hẹn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống'
      });
    }
  }

  /**
   * Tìm cuộc hẹn theo Khách hàng
   * GET /api/cuoc-hen/search/khach-hang/:khachHangId
   */
  static async findByKhachHang(req, res) {
    try {
      const khachHangId = parseInt(req.params.khachHangId);
      
      if (isNaN(khachHangId)) {
        return res.status(400).json({
          success: false,
          message: 'ID khách hàng không hợp lệ'
        });
      }

      const authUserId = req.user?.id;
      const userRole = req.user?.vaiTro;
      const adminRoles = ['QuanTriVienHeThong', 'NhanVienDieuHanh', 'NhanVienBanHang'];
      if (authUserId !== khachHangId && !adminRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem cuộc hẹn của người khác'
        });
      }

      const cuocHenList = await CuocHenModel.timTheoKhachHang(khachHangId);

      res.json({
        success: true,
        data: cuocHenList
      });
    } catch (error) {
      console.error('[CuocHenController] Lỗi tìm cuộc hẹn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống'
      });
    }
  }

  /**
   * Tìm cuộc hẹn theo Nhân viên
   * GET /api/cuoc-hen/search/nhan-vien/:nhanVienId
   */
  static async findByNhanVien(req, res) {
    try {
      const nhanVienId = parseInt(req.params.nhanVienId);
      
      if (isNaN(nhanVienId)) {
        return res.status(400).json({
          success: false,
          message: 'ID nhân viên không hợp lệ'
        });
      }

      const authUserId = req.user?.id;
      const userRole = req.user?.vaiTro;
      const allowedRoles = ['QuanTriVienHeThong', 'NhanVienDieuHanh', 'ChuDuAn'];
      if (authUserId !== nhanVienId && !allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem cuộc hẹn của nhân viên khác'
        });
      }

      const cuocHenList = await CuocHenModel.timTheoNhanVien(nhanVienId);

      res.json({
        success: true,
        data: cuocHenList
      });
    } catch (error) {
      console.error('[CuocHenController] Lỗi tìm cuộc hẹn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống'
      });
    }
  }

  /**
   * Tìm cuộc hẹn theo Chủ dự án
   * GET /api/cuoc-hen/search/chu-du-an/:chuDuAnId
   */
  static async findByChuDuAn(req, res) {
    try {
      const chuDuAnId = parseInt(req.params.chuDuAnId);
      
      if (isNaN(chuDuAnId)) {
        return res.status(400).json({
          success: false,
          message: 'ID chủ dự án không hợp lệ'
        });
      }

      const authUserId = req.user?.id;
      const userRole = req.user?.vaiTro;
      const adminRoles = ['QuanTriVienHeThong', 'NhanVienDieuHanh'];
      if (authUserId !== chuDuAnId && !adminRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem cuộc hẹn của chủ dự án khác'
        });
      }

      const cuocHenList = await CuocHenModel.timTheoChuDuAn(chuDuAnId);

      res.json({
        success: true,
        data: cuocHenList
      });
    } catch (error) {
      console.error('[CuocHenController] Lỗi tìm cuộc hẹn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống'
      });
    }
  }

  /**
   * Lấy chi tiết cuộc hẹn
   * GET /api/cuoc-hen/:id
   */
  static async getById(req, res) {
    try {
      const cuocHenId = parseInt(req.params.id);
      
      if (isNaN(cuocHenId)) {
        return res.status(400).json({
          success: false,
          message: 'ID cuộc hẹn không hợp lệ'
        });
      }

      const cuocHen = await CuocHenModel.layChiTiet(cuocHenId);

      if (!cuocHen) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy cuộc hẹn'
        });
      }

      res.json({
        success: true,
        data: cuocHen
      });
    } catch (error) {
      console.error('[CuocHenController] Lỗi lấy chi tiết cuộc hẹn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống'
      });
    }
  }

  /**
   * Cập nhật cuộc hẹn
   * PUT /api/cuoc-hen/:id
   */
  static async update(req, res) {
    try {
      const cuocHenId = parseInt(req.params.id);
      return res.status(501).json({
        success: false,
        message: 'Chức năng đang được phát triển'
      });
    } catch (error) {
      console.error('Lỗi cập nhật cuộc hẹn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống'
      });
    }
  }

  /**
   * Xóa cuộc hẹn
   * DELETE /api/cuoc-hen/:id
   */
  static async delete(req, res) {
    try {
      const cuocHenId = parseInt(req.params.id);
      return res.status(501).json({
        success: false,
        message: 'Chức năng đang được phát triển'
      });
    } catch (error) {
      console.error('Lỗi xóa cuộc hẹn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống'
      });
    }
  }

  /**
   * Lấy danh sách cuộc hẹn (Chủ dự án)
   * GET /api/chu-du-an/cuoc-hen
   */
  static async layDanhSachCuocHen(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const filters = {
        trangThai: req.query.trangThai,
        tinDangId: req.query.tinDangId,
        tuNgay: req.query.tuNgay,
        denNgay: req.query.denNgay,
        limit: req.query.limit || 50
      };

      const danhSach = await CuocHenModel.layDanhSachCuocHen(chuDuAnId, filters);

      res.json({
        success: true,
        message: 'Lấy danh sách cuộc hẹn thành công',
        data: {
          cuocHens: danhSach,
          tongSo: danhSach.length
        }
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách cuộc hẹn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống'
      });
    }
  }

  /**
   * UC-PROJ-02: Xác nhận cuộc hẹn
   * PUT /api/chu-du-an/cuoc-hen/:id/xac-nhan
   */
  static async xacNhanCuocHen(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const cuocHenId = parseInt(req.params.id);
      const { ghiChu } = req.body;

      const success = await CuocHenModel.xacNhanCuocHen(cuocHenId, chuDuAnId, ghiChu);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy cuộc hẹn'
        });
      }

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan(
        chuDuAnId,
        'xac_nhan_cuoc_hen',
        'CuocHen',
        cuocHenId,
        { trangThai: 'ChoXacNhan' },
        { trangThai: 'DaXacNhan', ghiChu },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Xác nhận cuộc hẹn thành công'
      });
    } catch (error) {
      console.error('Lỗi xác nhận cuộc hẹn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống'
      });
    }
  }

  /**
   * Lấy metrics cuộc hẹn
   * GET /api/chu-du-an/cuoc-hen/metrics
   */
  static async layMetricsCuocHen(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const metrics = await CuocHenModel.layMetricsCuocHen(chuDuAnId);

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Lỗi lấy metrics cuộc hẹn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống'
      });
    }
  }

  /**
   * UC-PROJ-02: Phê duyệt cuộc hẹn
   * PUT /api/chu-du-an/cuoc-hen/:id/phe-duyet
   */
  static async pheDuyetCuocHen(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const cuocHenId = parseInt(req.params.id);
      const { phuongThucVao, ghiChu } = req.body;

      if (!phuongThucVao) {
        return res.status(400).json({
          success: false,
          message: 'Phương thức vào là bắt buộc'
        });
      }

      const success = await CuocHenModel.pheDuyetCuocHen(cuocHenId, chuDuAnId, phuongThucVao, ghiChu);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy cuộc hẹn'
        });
      }

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan(
        chuDuAnId,
        'phe_duyet_cuoc_hen',
        'CuocHen',
        cuocHenId,
        { pheDuyet: 'ChoPheDuyet' },
        { pheDuyet: 'DaPheDuyet', phuongThucVao },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Phê duyệt cuộc hẹn thành công'
      });
    } catch (error) {
      console.error('Lỗi phê duyệt cuộc hẹn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống'
      });
    }
  }

  /**
   * UC-PROJ-02: Từ chối cuộc hẹn
   * PUT /api/chu-du-an/cuoc-hen/:id/tu-choi
   */
  static async tuChoiCuocHen(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const cuocHenId = parseInt(req.params.id);
      const { lyDoTuChoi } = req.body;

      if (!lyDoTuChoi) {
        return res.status(400).json({
          success: false,
          message: 'Lý do từ chối là bắt buộc'
        });
      }

      const success = await CuocHenModel.tuChoiCuocHen(cuocHenId, chuDuAnId, lyDoTuChoi);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy cuộc hẹn'
        });
      }

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan(
        chuDuAnId,
        'tu_choi_cuoc_hen',
        'CuocHen',
        cuocHenId,
        { pheDuyet: 'ChoPheDuyet' },
        { pheDuyet: 'TuChoi', lyDoTuChoi },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Từ chối cuộc hẹn thành công'
      });
    } catch (error) {
      console.error('Lỗi từ chối cuộc hẹn:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống'
      });
    }
  }
}

module.exports = CuocHenController;























































