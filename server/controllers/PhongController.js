/**
 * Controller cho Phòng (Redesign 09/10/2025)
 * Xử lý các request liên quan đến quản lý phòng
 */

const PhongModel = require('../models/PhongModel');

/**
 * Lấy ID chủ dự án từ thông tin user đã xác thực.
 * Throw lỗi rõ ràng nếu middleware auth chưa gắn user.
 */
const getChuDuAnID = (req) => {
  if (!req.user || !req.user.id) {
    throw new Error('Không xác thực được chủ dự án hiện tại');
  }
  return req.user.id;
};

class PhongController {
  /**
   * GET /api/chu-du-an/du-an/:duAnID/phong
   * Lấy danh sách phòng của dự án
   */
  static async layDanhSachPhong(req, res) {
    try {
      const { duAnID } = req.params;
      const chuDuAnID = getChuDuAnID(req);

      const danhSachPhong = await PhongModel.layDanhSachPhongTheoDuAn(
        parseInt(duAnID),
        chuDuAnID
      );

      res.json({
        success: true,
        data: danhSachPhong
      });
    } catch (error) {
      console.error('Lỗi layDanhSachPhong:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/chu-du-an/phong/:phongID
   * Lấy chi tiết phòng
   */
  static async layChiTietPhong(req, res) {
    try {
      const { phongID } = req.params;
      const chuDuAnID = getChuDuAnID(req);

      const phong = await PhongModel.layChiTietPhong(
        parseInt(phongID),
        chuDuAnID
      );

      if (!phong) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phòng'
        });
      }

      res.json({
        success: true,
        data: phong
      });
    } catch (error) {
      console.error('Lỗi layChiTietPhong:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/chu-du-an/du-an/:duAnID/phong
   * Tạo phòng mới
   */
  static async taoPhong(req, res) {
    try {
      const { duAnID } = req.params;
      const chuDuAnID = getChuDuAnID(req);
      const phongData = req.body;

      // Validation
      if (!phongData.TenPhong || phongData.TenPhong.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Tên phòng không được để trống'
        });
      }

      const phongID = await PhongModel.taoPhong(
        parseInt(duAnID),
        chuDuAnID,
        phongData
      );

      res.status(201).json({
        success: true,
        message: 'Tạo phòng thành công',
        data: { PhongID: phongID }
      });
    } catch (error) {
      console.error('Lỗi taoPhong:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PUT /api/chu-du-an/phong/:phongID
   * Cập nhật thông tin phòng
   */
  static async capNhatPhong(req, res) {
    try {
      const { phongID } = req.params;
      const chuDuAnID = getChuDuAnID(req);
      const updateData = req.body;

      await PhongModel.capNhatPhong(
        parseInt(phongID),
        chuDuAnID,
        updateData
      );

      res.json({
        success: true,
        message: 'Cập nhật phòng thành công'
      });
    } catch (error) {
      console.error('Lỗi capNhatPhong:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * DELETE /api/chu-du-an/phong/:phongID
   * Xóa phòng
   */
  static async xoaPhong(req, res) {
    try {
      const { phongID } = req.params;
      const chuDuAnID = getChuDuAnID(req);

      await PhongModel.xoaPhong(
        parseInt(phongID),
        chuDuAnID
      );

      res.json({
        success: true,
        message: 'Xóa phòng thành công'
      });
    } catch (error) {
      console.error('Lỗi xoaPhong:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/chu-du-an/tin-dang/:tinDangID/phong
   * Thêm phòng vào tin đăng
   */
  static async themPhongVaoTinDang(req, res) {
    try {
      const { tinDangID } = req.params;
      const chuDuAnID = getChuDuAnID(req);
      const { danhSachPhong } = req.body;

      // Validation
      if (!Array.isArray(danhSachPhong) || danhSachPhong.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Danh sách phòng không hợp lệ'
        });
      }

      await PhongModel.themPhongVaoTinDang(
        parseInt(tinDangID),
        chuDuAnID,
        danhSachPhong
      );

      res.json({
        success: true,
        message: `Đã thêm ${danhSachPhong.length} phòng vào tin đăng`
      });
    } catch (error) {
      console.error('Lỗi themPhongVaoTinDang:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/chu-du-an/tin-dang/:tinDangID/phong
   * Lấy danh sách phòng của tin đăng
   */
  static async layPhongCuaTinDang(req, res) {
    try {
      const { tinDangID } = req.params;

      const danhSachPhong = await PhongModel.layPhongCuaTinDang(
        parseInt(tinDangID)
      );

      res.json({
        success: true,
        data: danhSachPhong
      });
    } catch (error) {
      console.error('Lỗi layPhongCuaTinDang:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * DELETE /api/chu-du-an/tin-dang/:tinDangID/phong/:phongID
   * Xóa phòng khỏi tin đăng
   */
  static async xoaPhongKhoiTinDang(req, res) {
    try {
      const { tinDangID, phongID } = req.params;
      const chuDuAnID = getChuDuAnID(req);

      await PhongModel.xoaPhongKhoiTinDang(
        parseInt(tinDangID),
        parseInt(phongID),
        chuDuAnID
      );

      res.json({
        success: true,
        message: 'Đã xóa phòng khỏi tin đăng'
      });
    } catch (error) {
      console.error('Lỗi xoaPhongKhoiTinDang:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PATCH /api/chu-du-an/phong/:phongID/trang-thai
   * Cập nhật trạng thái phòng
   */
  static async capNhatTrangThai(req, res) {
    try {
      const { phongID } = req.params;
      const { trangThai } = req.body;
      const chuDuAnID = getChuDuAnID(req);

      // Validation
      const validStates = ['Trong', 'GiuCho', 'DaThue', 'DonDep'];
      if (!validStates.includes(trangThai)) {
        return res.status(400).json({
          success: false,
          message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStates.join(', ')}`
        });
      }

      await PhongModel.capNhatTrangThaiPhong(
        parseInt(phongID),
        trangThai,
        chuDuAnID
      );

      res.json({
        success: true,
        message: `Đã cập nhật trạng thái phòng thành "${trangThai}"`
      });
    } catch (error) {
      console.error('Lỗi capNhatTrangThai:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = PhongController;

