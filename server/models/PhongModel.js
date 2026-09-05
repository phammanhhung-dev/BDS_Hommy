/**
 * Model cho Phòng (Redesign 09/10/2025)
 * Phòng thuộc Dự án, mapping N-N với Tin đăng qua phong_tindang
 */

const db = require('../config/db');

class PhongModel {
  /**
   * Lấy danh sách phòng của dự án
   * @param {number} duAnID - ID dự án
   * @param {number} chuDuAnID - ID chủ dự án (để kiểm tra ownership)
   * @returns {Promise<Array>}
   */
  static async layDanhSachPhongTheoDuAn(duAnID, chuDuAnID) {
    try {
      // Kiểm tra ownership
      const [duAnRows] = await db.execute(
        'SELECT DuAnID FROM duan WHERE DuAnID = ? AND ChuDuAnID = ?',
        [duAnID, chuDuAnID]
      );

      if (duAnRows.length === 0) {
        throw new Error('Không có quyền xem phòng của dự án này');
      }

      const [rows] = await db.execute(`
        SELECT
          p.PhongID,
          p.TenPhong,
          p.TrangThai,
          p.GiaChuan,
          p.DienTichChuan,
          p.MoTaPhong,
          p.HinhAnhPhong,
          p.TaoLuc,
          p.CapNhatLuc,
          COUNT(pt.TinDangID) as SoTinDangDangDung
        FROM phong p
        LEFT JOIN phong_tindang pt ON p.PhongID = pt.PhongID
        LEFT JOIN tindang td ON pt.TinDangID = td.TinDangID
          AND td.TrangThai IN ('Nhap', 'ChoDuyet', 'DaDuyet', 'DaDang')
        WHERE p.DuAnID = ?
        GROUP BY p.PhongID, p.TenPhong, p.TrangThai, p.GiaChuan, p.DienTichChuan,
                 p.MoTaPhong, p.HinhAnhPhong, p.TaoLuc, p.CapNhatLuc
        ORDER BY p.TenPhong
      `, [duAnID]);

      return rows;
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách phòng: ${error.message}`);
    }
  }

  /**
   * Lấy chi tiết phòng
   * @param {number} phongID - ID phòng
   * @param {number} chuDuAnID - ID chủ dự án
   * @returns {Promise<Object|null>}
   */
  static async layChiTietPhong(phongID, chuDuAnID) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          p.*,
          da.TenDuAn,
          da.DiaChi as DiaChiDuAn
        FROM phong p
        JOIN duan da ON p.DuAnID = da.DuAnID
        WHERE p.PhongID = ? AND da.ChuDuAnID = ?
      `, [phongID, chuDuAnID]);

      if (rows.length === 0) {
        return null;
      }

      const phong = rows[0];

      // Lấy danh sách tin đăng đang sử dụng phòng này
      const [tinDangRows] = await db.execute(`
        SELECT 
          td.TinDangID,
          td.TieuDe,
          td.TrangThai,
          pt.GiaTinDang,
          pt.DienTichTinDang,
          pt.MoTaTinDang
        FROM phong_tindang pt
        JOIN tindang td ON pt.TinDangID = td.TinDangID
        WHERE pt.PhongID = ?
          AND td.TrangThai NOT IN ('LuuTru')
        ORDER BY td.CapNhatLuc DESC
      `, [phongID]);

      phong.DanhSachTinDang = tinDangRows;

      return phong;
    } catch (error) {
      throw new Error(`Lỗi khi lấy chi tiết phòng: ${error.message}`);
    }
  }

  /**
   * Tạo phòng mới cho dự án
   * @param {number} duAnID - ID dự án
   * @param {number} chuDuAnID - ID chủ dự án
   * @param {Object} phongData - Dữ liệu phòng
   * @returns {Promise<number>} PhongID vừa tạo
   */
  static async taoPhong(duAnID, chuDuAnID, phongData) {
    try {
      // Kiểm tra ownership
      const [duAnRows] = await db.execute(
        'SELECT DuAnID FROM duan WHERE DuAnID = ? AND ChuDuAnID = ? AND TrangThai = "HoatDong"',
        [duAnID, chuDuAnID]
      );

      if (duAnRows.length === 0) {
        throw new Error('Không có quyền tạo phòng cho dự án này');
      }

      // Chuẩn hóa tên phòng
      const tenPhongChuanHoa = phongData.TenPhong.trim().toUpperCase();

      // Kiểm tra trùng tên
      const [existingRooms] = await db.execute(
        'SELECT PhongID FROM phong WHERE DuAnID = ? AND UPPER(TRIM(TenPhong)) = ?',
        [duAnID, tenPhongChuanHoa]
      );

      if (existingRooms.length > 0) {
        throw new Error(`Phòng "${phongData.TenPhong}" đã tồn tại trong dự án`);
      }

      const [result] = await db.execute(`
        INSERT INTO phong (
          DuAnID, TenPhong, TrangThai, GiaChuan, DienTichChuan, 
          MoTaPhong, HinhAnhPhong
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        duAnID,
        phongData.TenPhong.trim(),
        'Trong',
        phongData.GiaChuan || null,
        phongData.DienTichChuan || null,
        phongData.MoTaPhong || null,
        phongData.HinhAnhPhong || null
      ]);

      return result.insertId;
    } catch (error) {
      throw new Error(`Lỗi khi tạo phòng: ${error.message}`);
    }
  }

  /**
   * Cập nhật thông tin phòng
   * @param {number} phongID - ID phòng
   * @param {number} chuDuAnID - ID chủ dự án
   * @param {Object} updateData - Dữ liệu cập nhật
   * @returns {Promise<boolean>}
   */
  static async capNhatPhong(phongID, chuDuAnID, updateData) {
    try {
      // Kiểm tra ownership
      const phong = await this.layChiTietPhong(phongID, chuDuAnID);
      if (!phong) {
        throw new Error('Không tìm thấy phòng hoặc không có quyền cập nhật');
      }

      const allowedFields = ['TenPhong', 'GiaChuan', 'DienTichChuan', 'MoTaPhong', 'HinhAnhPhong'];
      const updates = [];
      const values = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (updates.length === 0) {
        throw new Error('Không có trường nào được cập nhật');
      }

      values.push(phongID);

      await db.execute(
        `UPDATE phong SET ${updates.join(', ')} WHERE PhongID = ?`,
        values
      );

      return true;
    } catch (error) {
      throw new Error(`Lỗi khi cập nhật phòng: ${error.message}`);
    }
  }

  /**
   * Xóa phòng (chỉ khi chưa có tin đăng nào sử dụng)
   * @param {number} phongID - ID phòng
   * @param {number} chuDuAnID - ID chủ dự án
   * @returns {Promise<boolean>}
   */
  static async xoaPhong(phongID, chuDuAnID) {
    try {
      // Kiểm tra ownership
      const phong = await this.layChiTietPhong(phongID, chuDuAnID);
      if (!phong) {
        throw new Error('Không tìm thấy phòng hoặc không có quyền xóa');
      }

      // Kiểm tra phòng đang được sử dụng
      const [tinDangRows] = await db.execute(`
        SELECT COUNT(*) as SoTinDang
        FROM phong_tindang pt
        JOIN tindang td ON pt.TinDangID = td.TinDangID
        WHERE pt.PhongID = ?
          AND td.TrangThai NOT IN ('LuuTru')
      `, [phongID]);

      if (tinDangRows[0].SoTinDang > 0) {
        throw new Error('Không thể xóa phòng đang được sử dụng trong tin đăng');
      }

      // Kiểm tra phòng có cuộc hẹn/cọc
      const [cuocHenRows] = await db.execute(
        'SELECT COUNT(*) as SoCuocHen FROM cuochen WHERE PhongID = ?',
        [phongID]
      );

      if (cuocHenRows[0].SoCuocHen > 0) {
        throw new Error('Không thể xóa phòng có lịch sử cuộc hẹn');
      }

      await db.execute('DELETE FROM phong WHERE PhongID = ?', [phongID]);

      return true;
    } catch (error) {
      throw new Error(`Lỗi khi xóa phòng: ${error.message}`);
    }
  }

  /**
   * Thêm phòng vào tin đăng (Mapping)
   * @param {number} tinDangID - ID tin đăng
   * @param {number} chuDuAnID - ID chủ dự án
   * @param {Array} danhSachPhong - Array of {PhongID, GiaTinDang, ...}
   * @returns {Promise<boolean>}
   */
  static async themPhongVaoTinDang(tinDangID, chuDuAnID, danhSachPhong) {
    try {
      // Kiểm tra tin đăng
      const [tinDangRows] = await db.execute(`
        SELECT td.TinDangID, td.DuAnID
        FROM tindang td
        JOIN duan da ON td.DuAnID = da.DuAnID
        WHERE td.TinDangID = ? AND da.ChuDuAnID = ?
      `, [tinDangID, chuDuAnID]);

      if (tinDangRows.length === 0) {
        throw new Error('Không tìm thấy tin đăng hoặc không có quyền');
      }

      const duAnID = tinDangRows[0].DuAnID;

      // Kiểm tra tất cả phòng thuộc dự án
      for (const item of danhSachPhong) {
        const [phongRows] = await db.execute(
          'SELECT PhongID FROM phong WHERE PhongID = ? AND DuAnID = ?',
          [item.PhongID, duAnID]
        );

        if (phongRows.length === 0) {
          throw new Error(`Phòng ID ${item.PhongID} không thuộc dự án này`);
        }

        // Insert mapping (hoặc update nếu đã tồn tại)
        await db.execute(`
          INSERT INTO phong_tindang (
            PhongID, TinDangID, GiaTinDang, DienTichTinDang, 
            MoTaTinDang, HinhAnhTinDang, ThuTuHienThi
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            GiaTinDang = VALUES(GiaTinDang),
            DienTichTinDang = VALUES(DienTichTinDang),
            MoTaTinDang = VALUES(MoTaTinDang),
            HinhAnhTinDang = VALUES(HinhAnhTinDang),
            ThuTuHienThi = VALUES(ThuTuHienThi)
        `, [
          item.PhongID,
          tinDangID,
          item.GiaTinDang || null,
          item.DienTichTinDang || null,
          item.MoTaTinDang || null,
          item.HinhAnhTinDang || null,
          item.ThuTuHienThi || 0
        ]);
      }

      return true;
    } catch (error) {
      throw new Error(`Lỗi khi thêm phòng vào tin đăng: ${error.message}`);
    }
  }

  /**
   * Lấy danh sách phòng của tin đăng (với override)
   * @param {number} tinDangID - ID tin đăng
   * @returns {Promise<Array>}
   */
  static async layPhongCuaTinDang(tinDangID) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          p.PhongID,
          p.TenPhong,
          p.TrangThai,
          
          -- Giá hiển thị: Ưu tiên GiaTinDang, fallback GiaChuan
          COALESCE(pt.GiaTinDang, p.GiaChuan) as Gia,
          COALESCE(pt.DienTichTinDang, p.DienTichChuan) as DienTich,
          COALESCE(pt.MoTaTinDang, p.MoTaPhong) as MoTa,
          COALESCE(pt.HinhAnhTinDang, p.HinhAnhPhong) as URL,
          
          -- Thông tin gốc
          p.GiaChuan,
          p.DienTichChuan,
          p.MoTaPhong,
          p.HinhAnhPhong,
          
          -- Metadata
          pt.ThuTuHienThi,
          pt.GiaTinDang as GiaOverride,
          pt.DienTichTinDang as DienTichOverride,
          pt.MoTaTinDang as MoTaOverride,
          pt.HinhAnhTinDang as HinhAnhOverride
          
        FROM phong_tindang pt
        JOIN phong p ON pt.PhongID = p.PhongID
        WHERE pt.TinDangID = ?
        ORDER BY pt.ThuTuHienThi, p.TenPhong
      `, [tinDangID]);

      return rows;
    } catch (error) {
      throw new Error(`Lỗi khi lấy phòng của tin đăng: ${error.message}`);
    }
  }

  /**
   * Xóa phòng khỏi tin đăng
   * @param {number} tinDangID - ID tin đăng
   * @param {number} phongID - ID phòng
   * @param {number} chuDuAnID - ID chủ dự án
   * @returns {Promise<boolean>}
   */
  static async xoaPhongKhoiTinDang(tinDangID, phongID, chuDuAnID) {
    try {
      // Kiểm tra ownership
      const [tinDangRows] = await db.execute(`
        SELECT td.TinDangID
        FROM tindang td
        JOIN duan da ON td.DuAnID = da.DuAnID
        WHERE td.TinDangID = ? AND da.ChuDuAnID = ?
      `, [tinDangID, chuDuAnID]);

      if (tinDangRows.length === 0) {
        throw new Error('Không có quyền xóa phòng khỏi tin đăng này');
      }

      await db.execute(
        'DELETE FROM phong_tindang WHERE TinDangID = ? AND PhongID = ?',
        [tinDangID, phongID]
      );

      return true;
    } catch (error) {
      throw new Error(`Lỗi khi xóa phòng khỏi tin đăng: ${error.message}`);
    }
  }

  /**
   * Cập nhật trạng thái phòng (GiuCho, DaThue, ...)
   * @param {number} phongID - ID phòng
   * @param {string} trangThai - Trạng thái mới
   * @param {number} chuDuAnID - ID chủ dự án
   * @returns {Promise<boolean>}
   */
  static async capNhatTrangThaiPhong(phongID, trangThai, chuDuAnID) {
    try {
      // Kiểm tra ownership
      const phong = await this.layChiTietPhong(phongID, chuDuAnID);
      if (!phong) {
        throw new Error('Không tìm thấy phòng hoặc không có quyền cập nhật');
      }

      // Validate trạng thái
      const validStates = ['Trong', 'GiuCho', 'DaThue', 'DonDep'];
      if (!validStates.includes(trangThai)) {
        throw new Error(`Trạng thái không hợp lệ: ${trangThai}`);
      }

      await db.execute(
        'UPDATE phong SET TrangThai = ? WHERE PhongID = ?',
        [trangThai, phongID]
      );

      return true;
    } catch (error) {
      throw new Error(`Lỗi khi cập nhật trạng thái phòng: ${error.message}`);
    }
  }
}

module.exports = PhongModel;

