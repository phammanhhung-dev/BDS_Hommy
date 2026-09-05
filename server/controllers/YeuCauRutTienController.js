const YeuCauRutTienModel = require('../models/YeuCauRutTienModel');

class YeuCauRutTienController {
  // User: Tạo yêu cầu
  static async taoYeuCau(req, res) {
    try {
      const { soTien, nganHang, soTaiKhoan, tenChuTaiKhoan } = req.body;
      const nguoiDungId = req.user.NguoiDungID || req.user.id;

      if (!soTien || soTien <= 0) {
        return res.status(400).json({
          success: false,
          message: "Số tiền không hợp lệ"
        });
      }
      if (!nganHang || !soTaiKhoan || !tenChuTaiKhoan) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng điền đầy đủ thông tin ngân hàng"
        });
      }

      const yeuCauId = await YeuCauRutTienModel.taoYeuCau({
        nguoiDungId,
        soTien,
        nganHang,
        soTaiKhoan,
        tenChuTaiKhoan
      });

      res.status(201).json({
        success: true,
        message: "Gửi yêu cầu rút tiền thành công",
        data: { yeuCauId }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Lỗi server"
      });
    }
  }

  // User: Lấy lịch sử rút tiền của mình
  static async layLichSuCuaToi(req, res) {
    try {
      const nguoiDungId = req.user.NguoiDungID || req.user.id;
      const danhSach = await YeuCauRutTienModel.layDanhSach({ nguoiDungId });
      res.json({
        success: true,
        data: danhSach
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Lỗi server"
      });
    }
  }

  // Admin: Lấy tất cả yêu cầu
  static async layTatCaYeuCau(req, res) {
    try {
      const { trangThai } = req.query;
      const danhSach = await YeuCauRutTienModel.layDanhSach({ trangThai });
      res.json({
        success: true,
        data: danhSach
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Lỗi server"
      });
    }
  }

  // Admin: Duyệt/Từ chối yêu cầu
  static async xuLyYeuCau(req, res) {
    try {
      const { id } = req.params;
      const { trangThai, ghiChu } = req.body; // trangThai: 'DaDuyet' | 'TuChoi'
      const adminId = req.user.NguoiDungID || req.user.id;

      if (!['DaDuyet', 'TuChoi'].includes(trangThai)) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái không hợp lệ"
        });
      }

      await YeuCauRutTienModel.xuLyYeuCau(id, trangThai, ghiChu, adminId);
      res.json({
        success: true,
        message: "Xử lý yêu cầu thành công"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Lỗi server"
      });
    }
  }
}

module.exports = YeuCauRutTienController;