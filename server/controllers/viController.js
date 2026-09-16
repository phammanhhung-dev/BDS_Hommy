const ViModel = require("../models/viModel");

class ViController {
  /**
   * Lấy danh sách ví (Admin only - route đã có requireRole)
   */
  static async danhSach(req, res) {
    try {
      const userRole = req.user?.vaiTro;
      if (userRole !== 'QuanTriVienHeThong') {
        return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
      }
      const data = await ViModel.getAll();
      res.json({ success: true, data });
    } catch (error) {
      console.error('[ViController] danhSach error:', error);
      res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
  }

  /**
   * Lấy ví theo NguoiDungID - chỉ xem ví của chính mình hoặc Admin
   */
  static async layTheoNguoiDungId(req, res) {
    try {
      const nguoiDungId = parseInt(req.params.id, 10);
      if (!nguoiDungId)
        return res
          .status(400)
          .json({ success: false, message: "Thiếu NguoiDungID" });

      const authUserId = req.user?.id;
      const userRole = req.user?.vaiTro;
      if (authUserId !== nguoiDungId && userRole !== 'QuanTriVienHeThong') {
        return res.status(403).json({ success: false, message: 'Bạn chỉ có thể xem ví của chính mình' });
      }

      const data = await ViModel.getByNguoiDungId(nguoiDungId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('[ViController] layTheoNguoiDungId error:', error);
      res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
  }

  /**
   * Thanh toán cọc bằng ví nội bộ
   */
  static async thanhToanCoc(req, res) {
    const db = require('../config/db');
    const connection = await db.getConnection();
    try {
      const khachHangId = req.user?.id;
      const { amount, cuocHoiThoaiId, messageId } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Số tiền cọc không hợp lệ' });
      }

      await connection.beginTransaction();

      // 1. Kiểm tra ví khách hàng
      const [khachViRows] = await connection.query('SELECT * FROM vi WHERE NguoiDungID = ? FOR UPDATE', [khachHangId]);
      if (khachViRows.length === 0) {
        throw new Error('Không tìm thấy ví của bạn');
      }
      const khachVi = khachViRows[0];
      if (Number(khachVi.SoDu) < Number(amount)) {
        throw new Error('Số dư ví không đủ để thanh toán cọc');
      }

      // 2. Tìm người nhận (Chủ dự án) từ cuộc hội thoại
      const [members] = await connection.query(`
        SELECT NguoiDungID FROM thanhviencuochoithoai 
        WHERE CuocHoiThoaiID = ? AND NguoiDungID != ?
        LIMIT 1
      `, [cuocHoiThoaiId, khachHangId]);
      
      if (members.length === 0) {
        throw new Error('Không tìm thấy người nhận (Chủ dự án)');
      }
      const chuDuAnId = members[0].NguoiDungID;

      // 3. Trừ tiền khách, cộng tiền chủ
      await connection.query('UPDATE vi SET SoDu = SoDu - ? WHERE ViID = ?', [amount, khachVi.ViID]);
      await connection.query('UPDATE vi SET SoDu = SoDu + ? WHERE NguoiDungID = ?', [amount, chuDuAnId]);

      // 4. Lấy ví của chủ dự án để ghi log
      const [chuViRows] = await connection.query('SELECT ViID FROM vi WHERE NguoiDungID = ?', [chuDuAnId]);
      const chuViId = chuViRows.length > 0 ? chuViRows[0].ViID : null;

      // 5. Ghi log lịch sử ví
      if (chuViId) {
        // Giao dịch trừ tiền khách
        await connection.query(`
          INSERT INTO lichsuvi (ViID, SoTien, LoaiGiaoDich, MoTa, TrangThai)
          VALUES (?, ?, 'TruTien', 'Thanh toán tiền cọc', 'ThanhCong')
        `, [khachVi.ViID, amount]);
        
        // Giao dịch cộng tiền chủ
        await connection.query(`
          INSERT INTO lichsuvi (ViID, SoTien, LoaiGiaoDich, MoTa, TrangThai)
          VALUES (?, ?, 'CongTien', 'Nhận tiền cọc từ khách hàng', 'ThanhCong')
        `, [chuViId, amount]);
      }

      // 6. Tạo Hợp đồng nháp
      // Note: we might need TinDangID, let's try to get it from CuocHoiThoai NguCanhID if NguCanhLoai='TinDang'
      const [ch] = await connection.query('SELECT NguCanhID, NguCanhLoai FROM cuochoithoai WHERE CuocHoiThoaiID = ?', [cuocHoiThoaiId]);
      let tinDangId = null;
      if (ch.length > 0 && ch[0].NguCanhLoai === 'TinDang') {
        tinDangId = ch[0].NguCanhID;
      }

      const [hdResult] = await connection.query(`
        INSERT INTO hopdong (ChuDuAnID, KhachHangID, TinDangID, SoTienCoc, TrangThaiCoc, TrangThai)
        VALUES (?, ?, ?, ?, 'DaCoc', 'vuatao')
      `, [chuDuAnId, khachHangId, tinDangId, amount]);

      // 7. Cập nhật tin nhắn thành công? (Optional, maybe via Socket)
      
      await connection.commit();
      res.json({ success: true, message: 'Thanh toán cọc thành công', data: { hopDongId: hdResult.insertId } });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('[ViController] thanhToanCoc error:', error);
      res.status(500).json({ success: false, message: error.message || 'Lỗi hệ thống' });
    } finally {
      if (connection) connection.release();
    }
  }
}

module.exports = ViController;
