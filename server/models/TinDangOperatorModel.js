/**
 * Model cho Nhân viên Điều hành - Duyệt Tin đăng
 * UC-OPER-01: Duyệt tin đăng
 * Quản lý quy trình duyệt tin đăng (ChoDuyet → DaDang hoặc TuChoi)
 */

const db = require('../config/db');
const NhatKyHeThongService = require('../services/NhatKyHeThongService');

/**
 * @typedef {Object} TinDangChoDuyet
 * @property {number} TinDangID
 * @property {string} TieuDe
 * @property {string} TrangThai
 * @property {string} TenDuAn
 * @property {string} TenChuDuAn
 * @property {string} TrangThaiKYC
 * @property {string} TaoLuc
 */

class TinDangOperatorModel {
  /**
   * Lấy danh sách tin đăng chờ duyệt với phân trang và bộ lọc
   * @param {Object} filters - Bộ lọc tìm kiếm
   * @param {string} [filters.keyword] - Từ khóa tìm kiếm
   * @param {number} [filters.khuVucId] - ID khu vực
   * @param {number} [filters.duAnId] - ID dự án
   * @param {string} [filters.tuNgay] - Từ ngày (YYYY-MM-DD)
   * @param {string} [filters.denNgay] - Đến ngày (YYYY-MM-DD)
   * @param {number} [filters.page=1] - Trang hiện tại
   * @param {number} [filters.limit=20] - Số items mỗi trang
   * @returns {Promise<{data: Array, total: number, page: number, totalPages: number}>}
   * @throws {Error} Nếu có lỗi xảy ra
   */
  static async layDanhSachTinDangChoDuyet(filters = {}) {
    try {
      const {
        keyword = '',
        khuVucId = null,
        duAnId = null,
        tuNgay = null,
        denNgay = null,
        page = 1,
        limit = 20
      } = filters;

      // Parse số nguyên để tránh lỗi prepared statement với LIMIT/OFFSET
      const pageInt = parseInt(page, 10) || 1;
      const limitInt = parseInt(limit, 10) || 20;
      const offset = (pageInt - 1) * limitInt;

      // Build WHERE conditions
      let whereConditions = [`td.TrangThai = 'ChoDuyet'`];
      const params = [];

      if (keyword && keyword.trim()) {
        whereConditions.push(`(td.TieuDe LIKE ? OR da.TenDuAn LIKE ?)`);
        const keywordParam = `%${keyword.trim()}%`;
        params.push(keywordParam, keywordParam);
      }

      if (khuVucId) {
        whereConditions.push(`td.KhuVucID = ?`);
        params.push(khuVucId);
      }

      if (duAnId) {
        whereConditions.push(`td.DuAnID = ?`);
        params.push(duAnId);
      }

      if (tuNgay) {
        whereConditions.push(`DATE(td.TaoLuc) >= ?`);
        params.push(tuNgay);
      }

      if (denNgay) {
        whereConditions.push(`DATE(td.TaoLuc) <= ?`);
        params.push(denNgay);
      }

      const whereClause = whereConditions.join(' AND ');

      // Query danh sách
      const query = `
        SELECT
          td.TinDangID,
          td.TieuDe,
          td.MoTa,
          td.TrangThai,
          td.TaoLuc,
          td.CapNhatLuc,
          td.LoaiGiaoDich,
          td.LoaiBDS,
          td.GiaTien,
          td.DienTichDat,
          td.DienTichSuDung,
          da.DuAnID,
          da.TenDuAn,
          da.DiaChi as DiaChiDuAn,
          da.BangHoaHong as DuAn_BangHoaHong,
          da.SoThangCocToiThieu as DuAn_SoThangCocToiThieu,
          kv.TenKhuVuc as TenKhuVuc,
          nd.NguoiDungID as ChuDuAnID,
          nd.TenDayDu as TenChuDuAn,
          nd.Email as EmailChuDuAn,
          nd.TrangThaiXacMinh as TrangThaiKYC,
          (SELECT COUNT(*) FROM phong_tindang WHERE TinDangID = td.TinDangID) as SoPhong
        FROM tindang td
        LEFT JOIN duan da ON td.DuAnID = da.DuAnID
        LEFT JOIN khuvuc kv ON td.KhuVucID = kv.KhuVucID
        INNER JOIN nguoidung nd ON COALESCE(da.ChuDuAnID, td.ChuDuAnID) = nd.NguoiDungID
        WHERE ${whereClause}
        ORDER BY td.TaoLuc ASC
        LIMIT ? OFFSET ?
      `;

      // Đảm bảo limit và offset là số nguyên cho LIMIT/OFFSET
      params.push(limitInt, offset);
      // Dùng db.query() cho query động (WHERE clause thay đổi) - best practice
      const [rows] = await db.query(query, params);

      // Query total count (không cần LIMIT/OFFSET)
      const countQuery = `
        SELECT COUNT(*) as total
        FROM tindang td
        LEFT JOIN duan da ON td.DuAnID = da.DuAnID
        INNER JOIN nguoidung nd ON COALESCE(da.ChuDuAnID, td.ChuDuAnID) = nd.NguoiDungID
        WHERE ${whereClause}
      `;

      const countParams = params.slice(0, -2); // Remove limit and offset
      const [countRows] = await db.query(countQuery, countParams);
      const total = countRows[0].total;

      return {
        data: rows,
        total,
        page: pageInt,
        totalPages: Math.ceil(total / limitInt),
        limit: limitInt
      };
    } catch (error) {
      console.error('[TinDangOperatorModel] Lỗi layDanhSachTinDangChoDuyet:', error);
      throw new Error(`Lỗi lấy danh sách tin đăng chờ duyệt: ${error.message}`);
    }
  }

  /**
   * Lấy chi tiết tin đăng cần duyệt (kèm checklist KYC)
   * @param {number} tinDangId - ID tin đăng
   * @returns {Promise<Object>} Chi tiết tin đăng với thông tin KYC
   * @throws {Error} Nếu tin đăng không tồn tại
   */
  static async layChiTietTinDangChoDuyet(tinDangId) {
    try {
      const query = `
        SELECT
          td.*,
          da.DuAnID,
          da.TenDuAn,
          da.DiaChi as DiaChiDuAn,
          da.ViDo,
          da.KinhDo,
          kv.TenKhuVuc as TenKhuVuc,
          nd.NguoiDungID as ChuDuAnID,
          nd.TenDayDu as TenChuDuAn,
          nd.Email as EmailChuDuAn,
          nd.SoDienThoai as SoDienThoaiChuDuAn,
          nd.TrangThaiXacMinh as TrangThaiKYC,
          nd.SoCCCD,
          nd.NgayCapCCCD,
          csc.TenChinhSach as TenChinhSachCoc
        FROM tindang td
        LEFT JOIN duan da ON td.DuAnID = da.DuAnID
        LEFT JOIN khuvuc kv ON td.KhuVucID = kv.KhuVucID
        INNER JOIN nguoidung nd ON COALESCE(da.ChuDuAnID, td.ChuDuAnID) = nd.NguoiDungID
        LEFT JOIN chinhsachcoc csc ON td.ChinhSachCocID = csc.ChinhSachCocID
        WHERE td.TinDangID = ?
      `;

      const [rows] = await db.execute(query, [tinDangId]);

      if (!rows.length) {
        throw new Error('Tin đăng không tồn tại');
      }

      const tinDang = rows[0];

      // Lấy danh sách phòng
      const phongQuery = `
        SELECT 
          p.PhongID,
          p.TenPhong,
          p.TrangThai,
          COALESCE(pt.GiaTinDang, p.GiaChuan) as Gia,
          COALESCE(pt.DienTichTinDang, p.DienTichChuan) as DienTich
        FROM phong_tindang pt
        INNER JOIN phong p ON pt.PhongID = p.PhongID
        WHERE pt.TinDangID = ?
        ORDER BY p.TenPhong
      `;

      const [phongRows] = await db.execute(phongQuery, [tinDangId]);
      tinDang.DanhSachPhong = phongRows;

      // Checklist KYC
      // Parse URL an toàn với try-catch
      let hasImages = false;
      if (tinDang.URL) {
        try {
          const urlArray = JSON.parse(tinDang.URL);
          hasImages = Array.isArray(urlArray) && urlArray.length > 0;
        } catch (e) {
          hasImages = false;
        }
      }
      
      tinDang.ChecklistKYC = {
        coTaiKhoan: !!tinDang.ChuDuAnID,
        coHoTen: !!tinDang.TenChuDuAn,
        coEmail: !!tinDang.EmailChuDuAn,
        coSoDienThoai: !!tinDang.SoDienThoaiChuDuAn,
        coSoCCCD: !!tinDang.SoCCCD,
        daXacMinhKYC: tinDang.TrangThaiKYC === 'DaXacMinh',
        coItNhat1Anh: hasImages,
        coDiaChi: !!tinDang.DiaChiDuAn,
        coGia: tinDang.LoaiGiaoDich === 'Ban' ? !!tinDang.GiaTien : (phongRows.length === 0 || phongRows.every(p => p.Gia > 0)),
        coDienTich: tinDang.LoaiGiaoDich === 'Ban' ? !!tinDang.DienTichDat : (phongRows.length === 0 || phongRows.every(p => p.DienTich > 0))
      };

      // Tổng hợp trạng thái có thể duyệt không
      const allChecksPassed = Object.values(tinDang.ChecklistKYC).every(check => check === true);
      tinDang.CoTheDuyet = allChecksPassed;

      return tinDang;
    } catch (error) {
      console.error('[TinDangOperatorModel] Lỗi layChiTietTinDangChoDuyet:', error);
      throw new Error(`Lỗi lấy chi tiết tin đăng: ${error.message}`);
    }
  }

  /**
   * Duyệt tin đăng (ChoDuyet → DaDang)
   * @param {number} tinDangId - ID tin đăng
   * @param {number} nhanVienId - ID nhân viên duyệt
   * @returns {Promise<Object>} Thông tin tin đăng sau khi duyệt
   * @throws {Error} Nếu không đủ điều kiện duyệt
   */
  static async duyetTinDang(tinDangId, nhanVienId) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Kiểm tra tin đăng và KYC
      const [tinDangRows] = await connection.execute(
        `SELECT
          td.TinDangID, td.TieuDe, td.TrangThai, td.DuAnID, td.ChuDuAnID as TinDang_ChuDuAnID,
          da.ChuDuAnID as DuAn_ChuDuAnID,
          nd.TrangThaiXacMinh as TrangThaiKYC
        FROM tindang td
        LEFT JOIN duan da ON td.DuAnID = da.DuAnID
        INNER JOIN nguoidung nd ON COALESCE(da.ChuDuAnID, td.ChuDuAnID) = nd.NguoiDungID
        WHERE td.TinDangID = ?`,
        [tinDangId]
      );

      if (!tinDangRows.length) {
        throw new Error('Tin đăng không tồn tại');
      }

      const tinDang = tinDangRows[0];

      if (tinDang.TrangThai !== 'ChoDuyet') {
        throw new Error(`Tin đăng đang ở trạng thái ${tinDang.TrangThai}, không thể duyệt`);
      }

      if (tinDang.TrangThaiKYC !== 'DaXacMinh') {
        throw new Error('Chủ dự án chưa hoàn thành KYC. Không thể duyệt tin đăng.');
      }

      // Cập nhật trạng thái tin đăng
      await connection.execute(
        `UPDATE tindang 
         SET TrangThai = 'DaDuyet',
             DuyetBoiNhanVienID = ?,
             DuyetLuc = NOW(),
             CapNhatLuc = NOW()
         WHERE TinDangID = ?`,
        [nhanVienId, tinDangId]
      );

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan({
        TacNhan: 'Operator',
        NguoiDungID: nhanVienId,
        HanhDong: 'DUYET_TIN_DANG',
        DoiTuong: 'TinDang',
        DoiTuongID: tinDangId,
        ChiTiet: JSON.stringify({
          TieuDe: tinDang.TieuDe,
          ChuDuAnID: tinDang.DuAn_ChuDuAnID || tinDang.TinDang_ChuDuAnID,
          TrangThaiCu: 'ChoDuyet',
          TrangThaiMoi: 'DaDuyet'
        })
      });

      await connection.commit();

      // Lấy thông tin sau khi duyệt
      const [updatedRows] = await connection.execute(
        `SELECT 
          td.*,
          da.TenDuAn,
          nd.TenDayDu as TenNhanVienDuyet
        FROM tindang td
        INNER JOIN duan da ON td.DuAnID = da.DuAnID
        LEFT JOIN nguoidung nd ON td.DuyetBoiNhanVienID = nd.NguoiDungID
        WHERE td.TinDangID = ?`,
        [tinDangId]
      );

      return updatedRows[0];
    } catch (error) {
      await connection.rollback();
      console.error('[TinDangOperatorModel] Lỗi duyetTinDang:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Từ chối tin đăng với lý do
   * @param {number} tinDangId - ID tin đăng
   * @param {number} nhanVienId - ID nhân viên từ chối
   * @param {string} lyDoTuChoi - Lý do từ chối (min 10 chars)
   * @returns {Promise<Object>} Thông tin tin đăng sau khi từ chối
   * @throws {Error} Nếu validation fail hoặc lỗi hệ thống
   */
  static async tuChoiTinDang(tinDangId, nhanVienId, lyDoTuChoi) {
    const connection = await db.getConnection();
    
    try {
      // Validation lý do từ chối
      if (!lyDoTuChoi || lyDoTuChoi.trim().length < 10) {
        throw new Error('Lý do từ chối phải có ít nhất 10 ký tự');
      }

      if (lyDoTuChoi.length > 1000) {
        throw new Error('Lý do từ chối không được vượt quá 1000 ký tự');
      }

      await connection.beginTransaction();

      // Kiểm tra tin đăng
      const [tinDangRows] = await connection.execute(
        `SELECT
          td.TinDangID, td.TieuDe, td.TrangThai, td.DuAnID, td.ChuDuAnID as TinDang_ChuDuAnID,
          da.ChuDuAnID as DuAn_ChuDuAnID
        FROM tindang td
        LEFT JOIN duan da ON td.DuAnID = da.DuAnID
        WHERE td.TinDangID = ?`,
        [tinDangId]
      );

      if (!tinDangRows.length) {
        throw new Error('Tin đăng không tồn tại');
      }

      const tinDang = tinDangRows[0];

      if (tinDang.TrangThai !== 'ChoDuyet') {
        throw new Error(`Tin đăng đang ở trạng thái ${tinDang.TrangThai}, không thể từ chối`);
      }

      // Cập nhật trạng thái tin đăng
      await connection.execute(
        `UPDATE tindang 
         SET TrangThai = 'TuChoi',
             LyDoTuChoi = ?,
             DuyetBoiNhanVienID = ?,
             DuyetLuc = NOW(),
             CapNhatLuc = NOW()
         WHERE TinDangID = ?`,
        [lyDoTuChoi.trim(), nhanVienId, tinDangId]
      );

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan({
        TacNhan: 'Operator',
        NguoiDungID: nhanVienId,
        HanhDong: 'TU_CHOI_TIN_DANG',
        DoiTuong: 'TinDang',
        DoiTuongID: tinDangId,
        ChiTiet: JSON.stringify({
          TieuDe: tinDang.TieuDe,
          ChuDuAnID: tinDang.DuAn_ChuDuAnID || tinDang.TinDang_ChuDuAnID,
          LyDoTuChoi: lyDoTuChoi.trim(),
          TrangThaiCu: 'ChoDuyet',
          TrangThaiMoi: 'TuChoi'
        })
      });

      await connection.commit();

      // Lấy thông tin sau khi từ chối
      const [updatedRows] = await connection.execute(
        `SELECT 
          td.*,
          da.TenDuAn,
          nd.TenDayDu as TenNhanVienDuyet
        FROM tindang td
        INNER JOIN duan da ON td.DuAnID = da.DuAnID
        LEFT JOIN nguoidung nd ON td.DuyetBoiNhanVienID = nd.NguoiDungID
        WHERE td.TinDangID = ?`,
        [tinDangId]
      );

      return updatedRows[0];
    } catch (error) {
      await connection.rollback();
      console.error('[TinDangOperatorModel] Lỗi tuChoiTinDang:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Lấy thống kê tin đăng theo trạng thái
   * @returns {Promise<Object>} Thống kê số lượng tin đăng
   */
  static async layThongKeTinDang() {
    try {
      const query = `
        SELECT 
          COUNT(CASE WHEN TrangThai = 'ChoDuyet' THEN 1 END) as ChoDuyet,
          COUNT(CASE WHEN TrangThai = 'DaDang' THEN 1 END) as DaDang,
          COUNT(CASE WHEN TrangThai = 'TuChoi' THEN 1 END) as TuChoi,
          COUNT(CASE WHEN TrangThai = 'TamNgung' THEN 1 END) as TamNgung,
          COUNT(*) as TongSo
        FROM tindang
        WHERE TrangThai IN ('ChoDuyet', 'DaDang', 'TuChoi', 'TamNgung')
      `;

      const [rows] = await db.execute(query);
      return rows[0];
    } catch (error) {
      console.error('[TinDangOperatorModel] Lỗi layThongKeTinDang:', error);
      throw new Error(`Lỗi lấy thống kê tin đăng: ${error.message}`);
    }
  }
}

module.exports = TinDangOperatorModel;






