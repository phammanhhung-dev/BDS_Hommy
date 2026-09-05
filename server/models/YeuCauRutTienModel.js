const db = require('../config/db');

class YeuCauRutTienModel {
  /**
   * Tạo yêu cầu rút tiền mới
   * - Kiểm tra số dư
   * - Trừ tiền ví ngay lập tức
   * - Ghi log lịch sử ví (CHO_XU_LY)
   * - Tạo bản ghi yêu cầu
   */
  static async taoYeuCau({ nguoiDungId, soTien, nganHang, soTaiKhoan, tenChuTaiKhoan }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Kiểm tra số dư
      const [viRows] = await connection.query(
        "SELECT SoDu FROM vi WHERE NguoiDungID = ? FOR UPDATE",
        [nguoiDungId]
      );

      if (viRows.length === 0) {
        throw new Error("Người dùng chưa kích hoạt ví");
      }

      const soDuHienTai = parseFloat(viRows[0].SoDu);
      if (soDuHienTai < parseFloat(soTien)) {
        throw new Error("Số dư không đủ để thực hiện giao dịch");
      }

      // 2. Trừ tiền trong ví (Tạm giữ)
      await connection.query(
        "UPDATE vi SET SoDu = SoDu - ? WHERE NguoiDungID = ?",
        [soTien, nguoiDungId]
      );

      // 3. Tạo bản ghi yêu cầu rút tiền
      const [yeuCauResult] = await connection.query(`
        INSERT INTO yeucauruttien (NguoiDungID, SoTien, NganHang, SoTaiKhoan, TenChuTaiKhoan, TrangThai)
        VALUES (?, ?, ?, ?, ?, 'ChoXuLy')
      `, [nguoiDungId, soTien, nganHang, soTaiKhoan, tenChuTaiKhoan]);

      const yeuCauId = yeuCauResult.insertId;
      const maGiaoDich = `RUT_${yeuCauId}_${Date.now()}`;

      // 4. Ghi lịch sử ví (Trạng thái: CHO_XU_LY)
      await connection.query(`
        INSERT INTO lich_su_vi (user_id, so_tien, LoaiGiaoDich, trang_thai, ma_giao_dich)
        VALUES (?, ?, 'rut_tien', 'CHO_XU_LY', ?)
      `, [
        nguoiDungId,
        soTien,
        maGiaoDich
      ]);

      await connection.commit();
      return yeuCauId;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Lấy danh sách yêu cầu rút tiền (Dùng chung cho Admin và User)
   */
  static async layDanhSach(filters = {}) {
    let sql = `
      SELECT yc.*, nd.TenDayDu, nd.Email, nd.SoDienThoai
      FROM yeucauruttien yc
      JOIN nguoidung nd ON yc.NguoiDungID = nd.NguoiDungID
      WHERE 1=1
    `;
    const params = [];

    if (filters.nguoiDungId) {
      sql += " AND yc.NguoiDungID = ?";
      params.push(filters.nguoiDungId);
    }

    if (filters.trangThai) {
      sql += " AND yc.TrangThai = ?";
      params.push(filters.trangThai);
    }

    sql += " ORDER BY yc.TaoLuc DESC";

    const [rows] = await db.query(sql, params);
    return rows;
  }

  /**
   * Xử lý yêu cầu rút tiền (Admin)
   * - status: 'DaDuyet' hoặc 'TuChoi'
   */
  static async xuLyYeuCau(yeuCauId, trangThaiMoi, ghiChu, adminId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Lấy thông tin yêu cầu
      const [rows] = await connection.query(
        "SELECT * FROM yeucauruttien WHERE YeuCauID = ? FOR UPDATE",
        [yeuCauId]
      );

      if (rows.length === 0) throw new Error("Yêu cầu không tồn tại");
      const yeuCau = rows[0];

      if (yeuCau.TrangThai !== 'ChoXuLy') {
        throw new Error("Yêu cầu đã được xử lý trước đó");
      }

      // Cập nhật trạng thái yêu cầu
      await connection.query(`
        UPDATE yeucauruttien
        SET TrangThai = ?, GhiChu = ?
        WHERE YeuCauID = ?
      `, [trangThaiMoi, ghiChu, yeuCauId]);

      // Cập nhật trạng thái lịch sử ví
      // Tìm mã giao dịch tương ứng (hoặc tìm theo user + amount + time gần đúng, ở đây ta query theo mô tả hoặc logic khác nếu cần, 
      // nhưng tốt nhất là nên lưu yeuCauId vào lich_su_vi nếu có thể. 
      // Hiện tại ta sẽ tìm bản ghi lich_su_vi gần nhất của user có trạng thái CHO_XU_LY và loại rut_tien khớp số tiền)
      
      // Update status transaction
      if (trangThaiMoi === 'DaDuyet') {
        // Thành công: Update lịch sử ví -> THANH_CONG
        await connection.query(`
            UPDATE lich_su_vi 
            SET trang_thai = 'THANH_CONG' 
            WHERE user_id = ? AND LoaiGiaoDich = 'rut_tien' AND trang_thai = 'CHO_XU_LY' AND so_tien = ?
            ORDER BY thoi_gian DESC LIMIT 1
        `, [yeuCau.NguoiDungID, yeuCau.SoTien]);
      } else if (trangThaiMoi === 'TuChoi') {
        // Từ chối: Hoàn tiền lại ví
        await connection.query(
            "UPDATE vi SET SoDu = SoDu + ? WHERE NguoiDungID = ?",
            [yeuCau.SoTien, yeuCau.NguoiDungID]
        );

        // Update lịch sử ví -> THAT_BAI (hoặc TU_CHOI)
        await connection.query(`
            UPDATE lich_su_vi 
            SET trang_thai = 'THAT_BAI'
            WHERE user_id = ? AND LoaiGiaoDich = 'rut_tien' AND trang_thai = 'CHO_XU_LY' AND so_tien = ?
            ORDER BY thoi_gian DESC LIMIT 1
        `, [yeuCau.NguoiDungID, yeuCau.SoTien]);
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = YeuCauRutTienModel;
