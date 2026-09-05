/**
 * @fileoverview Model quản lý Hợp đồng
 * @module HopDongModel
 * @requires config/db
 */

const db = require('../config/db');

class HopDongModel {
  /**
   * Tạo hợp đồng mới (báo cáo hợp đồng đã ký)
   * @param {Object} data - Thông tin hợp đồng
   * @param {number} data.TinDangID
   * @param {number} data.KhachHangID
   * @param {number} data.PhongID - Phòng được thuê
   * @param {string} data.NgayBatDau - YYYY-MM-DD
   * @param {string} data.NgayKetThuc - YYYY-MM-DD
   * @param {number} data.GiaThueCuoiCung
   * @param {string} data.NoiDungSnapshot - Optional: Snapshot nội dung HĐ
   * @param {string} data.FileScanPath - Optional: Đường dẫn file scan
   * @param {boolean} data.DoiTruCocVaoTienThue - Đối trừ cọc vào tiền thuê
   * @param {number} chuDuAnId - ID Chủ dự án (for validation)
   * @returns {Promise<number>} HopDongID
   */
  static async baoCaoHopDong(data, chuDuAnId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // 1. VALIDATE: Kiểm tra Phòng thuộc sở hữu Chủ dự án
      const [phongCheck] = await connection.query(`
        SELECT p.PhongID, p.TrangThai, p.DuAnID, da.ChuDuAnID
        FROM phong p
        JOIN duan da ON p.DuAnID = da.DuAnID
        WHERE p.PhongID = ? AND da.ChuDuAnID = ?
      `, [data.PhongID, chuDuAnId]);

      if (phongCheck.length === 0) {
        throw new Error('Phòng không tồn tại hoặc không thuộc quyền sở hữu của bạn');
      }

      if (phongCheck[0].TrangThai !== 'GiuCho') {
        throw new Error(`Phòng phải ở trạng thái "GiuCho" (hiện tại: ${phongCheck[0].TrangThai})`);
      }

      // 2. VALIDATE: Kiểm tra có Cọc hợp lệ
      const [cocCheck] = await connection.query(`
        SELECT 
          c.CocID, c.Loai, c.SoTien, c.TrangThai,
          c.ChinhSachCocID, c.QuyTacGiaiToaSnapshot
        FROM coc c
        WHERE c.PhongID = ? AND c.TrangThai = 'HieuLuc'
        ORDER BY c.TaoLuc DESC
        LIMIT 1
      `, [data.PhongID]);

      if (cocCheck.length === 0) {
        throw new Error('Không tìm thấy cọc hợp lệ cho phòng này');
      }

      const cocInfo = cocCheck[0];

      // 3. INSERT Hợp đồng
      const [hopDongResult] = await connection.query(`
        INSERT INTO hopdong (
          TinDangID, KhachHangID, NgayBatDau, NgayKetThuc,
          GiaThueCuoiCung, BaoCaoLuc, NoiDungSnapshot, FileScanPath, TrangThai
        ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, 'xacthuc')
      `, [
        data.TinDangID,
        data.KhachHangID,
        data.NgayBatDau,
        data.NgayKetThuc,
        data.GiaThueCuoiCung,
        data.NoiDungSnapshot || null,
        data.FileScanPath || null
      ]);

      const hopDongId = hopDongResult.insertId;

      // 4. UPDATE Phòng → DaThue
      await connection.query(`
        UPDATE phong
        SET TrangThai = 'DaThue', CapNhatLuc = NOW()
        WHERE PhongID = ?
      `, [data.PhongID]);

      // 5. XỬ LÝ CỌC theo quy tắc
      if (data.DoiTruCocVaoTienThue) {
        // Trường hợp: Đối trừ cọc vào tiền thuê tháng đầu
        await connection.query(`
          UPDATE coc
          SET 
            TrangThai = 'DaDoiTru',
            HopDongID = ?,
            LyDoKhauTru = 'Đối trừ vào tiền thuê tháng đầu',
            CapNhatLuc = NOW()
          WHERE CocID = ?
        `, [hopDongId, cocInfo.CocID]);

      } else {
        // Trường hợp: Giải tỏa cọc (hoàn lại khách)
        await connection.query(`
          UPDATE coc
          SET 
            TrangThai = 'DaGiaiToa',
            HopDongID = ?,
            LyDoGiaiToa = 'Hợp đồng đã được ký, giải tỏa cọc theo quy tắc',
            CapNhatLuc = NOW()
          WHERE CocID = ?
        `, [hopDongId, cocInfo.CocID]);

        // TODO: Tạo GiaoDich hoàn cọc (nếu có luồng thanh toán online)
        // await GiaoDichModel.taoGiaoDichHoanCoc({
        //   CocID: cocInfo.CocID,
        //   SoTien: cocInfo.SoTien,
        //   KhachHangID: data.KhachHangID
        // });
      }

      await connection.commit();
      return hopDongId;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Lấy danh sách hợp đồng của Chủ dự án
   * @param {number} chuDuAnId - ID Chủ dự án
   * @param {Object} filters - Filters: {tuNgay, denNgay}
   * @returns {Promise<Array>}
   */
  static async layDanhSach(chuDuAnId, filters = {}) {
    let query = `
      SELECT 
        hd.HopDongID,
        hd.TinDangID,
        td.TieuDe as TenTinDang,
        hd.KhachHangID,
        nd.TenDayDu as TenKhachHang,
        nd.SoDienThoai,
        p.TenPhong,
        hd.PhongID,
        hd.NgayBatDau,
        hd.NgayKetThuc,
        hd.GiaThueCuoiCung,
        hd.BaoCaoLuc,
        hd.FileScanPath,
        COALESCE(hd.noidunghopdong, hd.NoiDungSnapshot, '') as noidunghopdong,
        COALESCE(hd.SoTienCoc, c.SoTien, 0) as SoTienCoc,
        COALESCE(c.TrangThai, 'HieuLuc') as TrangThaiCoc,
        COALESCE(hd.TrangThai, 'xacthuc') as TrangThai,
        da.TenDuAn
      FROM hopdong hd
      JOIN tindang td ON hd.TinDangID = td.TinDangID
      LEFT JOIN duan da ON COALESCE(hd.DuAnID, td.DuAnID) = da.DuAnID
      JOIN nguoidung nd ON hd.KhachHangID = nd.NguoiDungID
      LEFT JOIN phong p ON hd.PhongID = p.PhongID
      LEFT JOIN coc c ON c.HopDongID = hd.HopDongID
      WHERE td.ChuDuAnID = ?
    `;

    const params = [chuDuAnId];

    if (filters.tuNgay) {
      query += ` AND hd.NgayBatDau >= ?`;
      params.push(filters.tuNgay);
    }

    if (filters.denNgay) {
      query += ` AND hd.NgayKetThuc <= ?`;
      params.push(filters.denNgay);
    }

    query += ` ORDER BY COALESCE(hd.BaoCaoLuc, hd.HopDongID) DESC`;

    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * Lấy tất cả hợp đồng (cho Admin/Operator)
   * @param {Object} filters - Filters: {tuNgay, denNgay, chuDuAnId}
   * @returns {Promise<Array>}
   */
  static async layTatCaHopDong(filters = {}) {
    let query = `
      SELECT 
        hd.HopDongID,
        hd.TinDangID,
        td.TieuDe as TenTinDang,
        hd.KhachHangID,
        nd.TenDayDu as TenKhachHang,
        nd.SoDienThoai,
        p.TenPhong,
        hd.PhongID,
        hd.NgayBatDau,
        hd.NgayKetThuc,
        hd.GiaThueCuoiCung,
        hd.BaoCaoLuc,
        hd.FileScanPath,
        COALESCE(hd.noidunghopdong, hd.NoiDungSnapshot, '') as noidunghopdong,
        COALESCE(hd.SoTienCoc, c.SoTien, 0) as SoTienCoc,
        COALESCE(c.TrangThai, 'HieuLuc') as TrangThaiCoc,
        COALESCE(hd.TrangThai, 'xacthuc') as TrangThai,
        da.TenDuAn,
        da.ChuDuAnID,
        cda.TenDayDu as TenChuDuAn
      FROM hopdong hd
      JOIN tindang td ON hd.TinDangID = td.TinDangID
      JOIN duan da ON COALESCE(hd.DuAnID, td.DuAnID) = da.DuAnID
      JOIN nguoidung nd ON hd.KhachHangID = nd.NguoiDungID
      JOIN nguoidung cda ON da.ChuDuAnID = cda.NguoiDungID
      LEFT JOIN phong p ON hd.PhongID = p.PhongID
      LEFT JOIN coc c ON c.HopDongID = hd.HopDongID
      WHERE 1=1
    `;

    const params = [];

    if (filters.chuDuAnId) {
      query += ` AND da.ChuDuAnID = ?`;
      params.push(filters.chuDuAnId);
    }

    if (filters.tuNgay) {
      query += ` AND (hd.NgayBatDau >= ? OR hd.BaoCaoLuc >= ?)`;
      params.push(filters.tuNgay, filters.tuNgay);
    }

    if (filters.denNgay) {
      query += ` AND (hd.NgayKetThuc <= ? OR hd.BaoCaoLuc <= ?)`;
      params.push(filters.denNgay, filters.denNgay);
    }

    query += ` ORDER BY COALESCE(hd.BaoCaoLuc, hd.HopDongID) DESC`;

    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * Lấy danh sách hợp đồng của Khách hàng
   * @param {number} khachHangId - ID Khách hàng
   * @param {Object} filters - Filters: {tuNgay, denNgay}
   * @returns {Promise<Array>}
   */
  static async layHopDongCuaKhachHang(khachHangId, filters = {}) {
    let query = `
      SELECT 
        hd.HopDongID,
        hd.TinDangID,
        COALESCE(td.TieuDe, '') as TenTinDang,
        COALESCE(da.DiaChi, '') as DiaChiTinDang,
        COALESCE(p.TenPhong, '') as TenPhong,
        hd.PhongID,
        hd.NgayBatDau,
        hd.NgayKetThuc,
        hd.GiaThueCuoiCung,
        hd.BaoCaoLuc,
        hd.FileScanPath,
        COALESCE(hd.noidunghopdong, hd.NoiDungSnapshot, '') as noidunghopdong,
        COALESCE(hd.SoTienCoc, c.SoTien, 0) as SoTienCoc,
        COALESCE(c.TrangThai, 'HieuLuc') as TrangThaiCoc,
        COALESCE(hd.TrangThai, 'xacthuc') as TrangThai,
        COALESCE(da.TenDuAn, '') as TenDuAn,
        COALESCE(da.DiaChi, '') as DiaChiDuAn,
        COALESCE(cda.TenDayDu, '') as TenChuDuAn,
        COALESCE(cda.SoDienThoai, '') as SDTChuDuAn
      FROM hopdong hd
      LEFT JOIN tindang td ON hd.TinDangID = td.TinDangID
      LEFT JOIN duan da ON COALESCE(hd.DuAnID, td.DuAnID) = da.DuAnID
      LEFT JOIN nguoidung cda ON da.ChuDuAnID = cda.NguoiDungID
      LEFT JOIN phong p ON hd.PhongID = p.PhongID
      LEFT JOIN coc c ON c.HopDongID = hd.HopDongID
      WHERE hd.KhachHangID = ?
    `;

    const params = [khachHangId];

    if (filters.tuNgay) {
      query += ` AND (hd.NgayBatDau >= ? OR hd.BaoCaoLuc >= ?)`;
      params.push(filters.tuNgay, filters.tuNgay);
    }

    if (filters.denNgay) {
      query += ` AND (hd.NgayKetThuc <= ? OR hd.BaoCaoLuc <= ?)`;
      params.push(filters.denNgay, filters.denNgay);
    }

    query += ` ORDER BY COALESCE(hd.BaoCaoLuc, hd.HopDongID) DESC`;

    try {
      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      // Nếu lỗi do cột không tồn tại, thử lại với NoiDungSnapshot
      if (error.message && error.message.includes('noidunghopdong')) {
        console.warn('[HopDongModel] Cột noidunghopdong không tồn tại, dùng NoiDungSnapshot');
        query = query.replace(
          /COALESCE\(hd\.noidunghopdong, hd\.NoiDungSnapshot, ''\) as noidunghopdong/,
          'COALESCE(hd.NoiDungSnapshot, \'\') as noidunghopdong'
        );
        const [rows] = await db.query(query, params);
        return rows;
      }
      console.error('[HopDongModel.layHopDongCuaKhachHang] SQL Error:', error.message);
      console.error('[HopDongModel.layHopDongCuaKhachHang] Query:', query);
      throw error;
    }
  }

  /**
   * Lấy chi tiết hợp đồng
   * @param {number} hopDongId
   * @param {number} chuDuAnId - For ownership check
   * @returns {Promise<Object|null>}
   */
  static async layChiTiet(hopDongId, chuDuAnId) {
    const [rows] = await db.query(`
      SELECT 
        hd.*,
        td.TieuDe as TenTinDang,
        td.DiaChi,
        nd.TenDayDu as TenKhachHang,
        nd.Email as EmailKhachHang,
        nd.SoDienThoai as SdtKhachHang,
        p.TenPhong,
        p.TrangThai as TrangThaiPhong,
        c.CocID,
        c.SoTien as SoTienCoc,
        c.TrangThai as TrangThaiCoc,
        c.LyDoGiaiToa,
        c.LyDoKhauTru
      FROM hopdong hd
      JOIN tindang td ON hd.TinDangID = td.TinDangID
      JOIN duan da ON td.DuAnID = da.DuAnID
      JOIN nguoidung nd ON hd.KhachHangID = nd.NguoiDungID
      LEFT JOIN coc c ON c.HopDongID = hd.HopDongID
      LEFT JOIN phong p ON c.PhongID = p.PhongID
      WHERE hd.HopDongID = ? AND da.ChuDuAnID = ?
    `, [hopDongId, chuDuAnId]);

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Cập nhật file scan cho hợp đồng
   * @param {number} hopDongId
   * @param {string} filePath - Đường dẫn file
   * @param {number} chuDuAnId - For ownership check
   * @returns {Promise<boolean>}
   */
  static async capNhatFileScan(hopDongId, filePath, chuDuAnId) {
    // Verify ownership
    const [check] = await db.query(`
      SELECT hd.HopDongID
      FROM hopdong hd
      JOIN tindang td ON hd.TinDangID = td.TinDangID
      JOIN duan da ON td.DuAnID = da.DuAnID
      WHERE hd.HopDongID = ? AND da.ChuDuAnID = ?
    `, [hopDongId, chuDuAnId]);

    if (check.length === 0) {
      throw new Error('Hợp đồng không tồn tại hoặc không thuộc quyền sở hữu');
    }

    await db.query(`
      UPDATE hopdong
      SET FileScanPath = ?
      WHERE HopDongID = ?
    `, [filePath, hopDongId]);

    return true;
  }

  /**
   * Khách hàng xin hủy hợp đồng
   * @param {number} hopDongID
   * @param {number} khachHangID
   * @returns {Promise<boolean>}
   */
  static async xinHuyHopDong(hopDongID, khachHangID) {
    try {
      // Kiểm tra hợp đồng thuộc về khách hàng và trạng thái hợp lệ
      const [rows] = await db.query(`
        SELECT HopDongID, TrangThai, BaoCaoLuc, 
               COALESCE(BaoCaoLuc, DATE_ADD(NOW(), INTERVAL -1 DAY)) as NgayTao
        FROM hopdong
        WHERE HopDongID = ? AND KhachHangID = ?
      `, [hopDongID, khachHangID]);

      if (rows.length === 0) {
        throw new Error('Không tìm thấy hợp đồng');
      }

      const hopDong = rows[0];

      if (hopDong.TrangThai !== 'xacthuc') {
        throw new Error('Chỉ có thể hủy hợp đồng ở trạng thái xác thực');
      }

      // Kiểm tra thời gian: chỉ cho phép hủy trong vòng 3 ngày
      // Sử dụng BaoCaoLuc nếu có, nếu không dùng ngày hiện tại trừ 1 ngày (cho hợp đồng từ đặt cọc)
      const ngayTao = hopDong.BaoCaoLuc || hopDong.NgayTao;
      const baoCaoLuc = new Date(ngayTao);
      const now = new Date();
      const diffTime = now - baoCaoLuc;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays > 3) {
        throw new Error('Chỉ có thể hủy hợp đồng trong vòng 3 ngày kể từ ngày tạo');
      }

      // Cập nhật trạng thái
      await db.query(`
        UPDATE hopdong
        SET TrangThai = 'xinhuy'
        WHERE HopDongID = ?
      `, [hopDongID]);

      return true;
    } catch (error) {
      console.error('[HopDongModel] Lỗi xinHuyHopDong:', error);
      throw error;
    }
  }

  /**
   * Admin xác nhận hủy hợp đồng và hoàn tiền cọc
   * @param {number} hopDongID
   * @param {number} adminID
   * @returns {Promise<boolean>}
   */
  static async xacNhanHuyHopDong(hopDongID, adminID) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Kiểm tra hợp đồng có trạng thái xinhuy
      const [rows] = await connection.query(`
        SELECT hd.HopDongID, hd.KhachHangID, hd.SoTienCoc, hd.TrangThai, hd.PhongID,
               c.CocID, c.SoTien as CocSoTien
        FROM hopdong hd
        LEFT JOIN coc c ON c.HopDongID = hd.HopDongID
        WHERE hd.HopDongID = ? AND hd.TrangThai = 'xinhuy'
      `, [hopDongID]);

      if (rows.length === 0) {
        throw new Error('Không tìm thấy hợp đồng hoặc hợp đồng không ở trạng thái xin hủy');
      }

      const hopDong = rows[0];
      const soTienCoc = hopDong.SoTienCoc || hopDong.CocSoTien || 0;

      if (soTienCoc <= 0) {
        throw new Error('Hợp đồng không có tiền cọc để hoàn lại');
      }

      // Cập nhật trạng thái hợp đồng
      await connection.query(`
        UPDATE hopdong
        SET TrangThai = 'dahuy'
        WHERE HopDongID = ?
      `, [hopDongID]);

      // Hoàn tiền cọc vào ví khách hàng
      // Kiểm tra ví có tồn tại không
      const [viRows] = await connection.query(`
        SELECT ViID, SoDu FROM vi WHERE NguoiDungID = ?
      `, [hopDong.KhachHangID]);

      if (viRows.length === 0) {
        // Tạo ví mới nếu chưa có
        await connection.query(`
          INSERT INTO vi (NguoiDungID, SoDu) VALUES (?, ?)
        `, [hopDong.KhachHangID, soTienCoc]);
      } else {
        // Cộng tiền vào ví
        await connection.query(`
          UPDATE vi SET SoDu = SoDu + ? WHERE NguoiDungID = ?
        `, [soTienCoc, hopDong.KhachHangID]);
      }

      // Ghi lịch sử ví
      const maGiaoDich = `HOAN_COC_HD_${hopDongID}_${Date.now()}`;
      await connection.query(`
        INSERT INTO lich_su_vi (user_id, so_tien, LoaiGiaoDich, trang_thai, ma_giao_dich)
        VALUES (?, ?, 'hoan_coc', 'THANH_CONG', ?)
      `, [
        hopDong.KhachHangID,
        soTienCoc,
        maGiaoDich
      ]);

      // Cập nhật trạng thái cọc nếu có
      if (hopDong.CocID) {
        await connection.query(`
          UPDATE coc
          SET TrangThai = 'DaHoan', CapNhatLuc = NOW()
          WHERE CocID = ?
        `, [hopDong.CocID]);
      }

      // Cập nhật trạng thái phòng về Trong
      if (hopDong.PhongID) {
        await connection.query(`
          UPDATE phong
          SET TrangThai = 'Trong', CapNhatLuc = NOW()
          WHERE PhongID = ?
        `, [hopDong.PhongID]);
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('[HopDongModel] Lỗi xacNhanHuyHopDong:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = HopDongModel;
