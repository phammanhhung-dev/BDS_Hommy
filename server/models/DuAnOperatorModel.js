/**
 * Model cho Nhân viên Điều hành - Quản lý Dự án
 * UC-OPER-02: Quản lý danh sách dự án
 * Tạm ngưng, kích hoạt, thống kê dự án
 */

const db = require('../config/db');
const NhatKyHeThongService = require('../services/NhatKyHeThongService');

/**
 * @typedef {Object} DuAn
 * @property {number} DuAnID
 * @property {string} TenDuAn
 * @property {string} DiaChi
 * @property {string} TrangThai
 * @property {string} TenChuDuAn
 */

class DuAnOperatorModel {
  /**
   * Lấy danh sách dự án với bộ lọc và phân trang
   * @param {Object} filters - Bộ lọc
   * @param {string} [filters.keyword] - Từ khóa tìm kiếm
   * @param {string} [filters.trangThai] - Trạng thái dự án
   * @param {number} [filters.chuDuAnId] - ID chủ dự án
   * @param {number} [filters.page=1] - Trang hiện tại
   * @param {number} [filters.limit=20] - Số items mỗi trang
   * @returns {Promise<{data: Array, total: number, page: number, totalPages: number}>}
   */
  static async layDanhSachDuAn(filters = {}) {
    try {
      const {
        keyword = '',
        trangThai = null,
        chuDuAnId = null,
        operatorId = null,
        page = 1,
        limit = 20
      } = filters;

      const parsedLimit = Number(limit);
      const safeLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20;

      const parsedPage = Number(page);
      const safePage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

      const offset = (safePage - 1) * safeLimit;

      // Build WHERE conditions
      let whereConditions = [];
      const params = [];

      // Nếu có operatorId, lọc theo khu vực phụ trách dựa trên địa chỉ dự án
      let khuVucCondition = '';
      if (operatorId) {
        // Lấy khu vực phụ trách của operator cùng với tên khu vực
        const [hsRows] = await db.query(
          `SELECT 
            hs.KhuVucChinhID, 
            hs.KhuVucPhuTrachID,
            COALESCE(lc_chinh.CommuneName, lp_chinh.ProvinceName) as TenKhuVucChinh,
            COALESCE(lc_phu.CommuneName, lp_phu.ProvinceName) as TenKhuVucPhuTrach
          FROM hosonhanvien hs
          LEFT JOIN legacy_communes lc_chinh ON hs.KhuVucChinhID = lc_chinh.CommuneID
          LEFT JOIN legacy_provinces lp_chinh ON hs.KhuVucChinhID = lp_chinh.ProvinceID
          LEFT JOIN legacy_communes lc_phu ON hs.KhuVucPhuTrachID = lc_phu.CommuneID
          LEFT JOIN legacy_provinces lp_phu ON hs.KhuVucPhuTrachID = lp_phu.ProvinceID
          WHERE hs.NguoiDungID = ?`,
          [operatorId]
        );
        
        if (hsRows.length > 0 && (hsRows[0].KhuVucPhuTrachID || hsRows[0].KhuVucChinhID)) {
          const tenKhuVucPhuTrach = hsRows[0].TenKhuVucPhuTrach;
          const tenKhuVucChinh = hsRows[0].TenKhuVucChinh;
          
          // Xây dựng điều kiện lọc theo địa chỉ
          const conditions = [];
          
          // Lọc theo khu vực phụ trách (quận/huyện) - ưu tiên
          if (tenKhuVucPhuTrach) {
            // Normalize tên: "Quận Gò Vấp" -> "Gò Vấp"
            const normalizedPhuTrach = tenKhuVucPhuTrach
              .replace(/^(Quận|Huyện|Thị xã|Thành phố)\s+/i, '')
              .trim();
            conditions.push(`da.DiaChi LIKE '%${normalizedPhuTrach}%'`);
          }
          
          // Lọc theo khu vực chính (tỉnh/thành) nếu không có khu vực phụ trách
          if (!tenKhuVucPhuTrach && tenKhuVucChinh) {
            // Normalize tên: "TP. Hồ Chí Minh" -> "Hồ Chí Minh"
            const normalizedChinh = tenKhuVucChinh
              .replace(/^(TP\.|Tỉnh|Thành phố)\s*/i, '')
              .trim();
            conditions.push(`da.DiaChi LIKE '%${normalizedChinh}%'`);
          }
          
          if (conditions.length > 0) {
            khuVucCondition = `AND (${conditions.join(' OR ')})`;
          }
        }
      }

      if (keyword && keyword.trim()) {
        whereConditions.push(`(da.TenDuAn LIKE ? OR da.DiaChi LIKE ?)`);
        const keywordParam = `%${keyword.trim()}%`;
        params.push(keywordParam, keywordParam);
      }

      if (trangThai) {
        whereConditions.push(`da.TrangThai = ?`);
        params.push(trangThai);
      }

      if (chuDuAnId) {
        whereConditions.push(`da.ChuDuAnID = ?`);
        params.push(chuDuAnId);
      }

      // Thêm điều kiện khu vực vào whereConditions nếu có
      let fullWhereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ') + ' ' + khuVucCondition
        : khuVucCondition ? 'WHERE 1=1 ' + khuVucCondition : '';

      // Query danh sách
      const query = `
        SELECT 
          da.DuAnID,
          da.TenDuAn,
          da.DiaChi,
          da.TrangThai,
          da.YeuCauPheDuyetChu,
          da.YeuCauMoLai,
          da.LyDoNgungHoatDong,
          da.NgungHoatDongLuc,
          da.TaoLuc,
          da.CapNhatLuc,
          da.BangHoaHong,
          da.SoThangCocToiThieu,
          da.TrangThaiDuyetHoaHong,
          da.NguoiDuyetHoaHongID,
          da.ThoiGianDuyetHoaHong,
          da.LyDoTuChoiHoaHong,
          nd.NguoiDungID as ChuDuAnID,
          nd.TenDayDu as TenChuDuAn,
          nd.Email as EmailChuDuAn,
          nd.SoDienThoai as SoDienThoaiChuDuAn,
          nd_ngung.TenDayDu as NguoiNgungHoatDong,
          nd_duyet.TenDayDu as NguoiDuyetHoaHong,
          (SELECT COUNT(*) FROM tindang WHERE DuAnID = da.DuAnID AND TrangThai = 'DaDuyet') as SoTinDangDaDuyet,
          (SELECT COUNT(*) FROM tindang WHERE DuAnID = da.DuAnID AND TrangThai = 'ChoDuyet') as SoTinDangChoDuyet,
          (SELECT COUNT(*) FROM tindang WHERE DuAnID = da.DuAnID) as TongSoTinDang
        FROM duan da
        INNER JOIN nguoidung nd ON da.ChuDuAnID = nd.NguoiDungID
        LEFT JOIN nguoidung nd_ngung ON da.NguoiNgungHoatDongID = nd_ngung.NguoiDungID
        LEFT JOIN nguoidung nd_duyet ON da.NguoiDuyetHoaHongID = nd_duyet.NguoiDungID
        ${fullWhereClause}
        ORDER BY 
          CASE da.TrangThai
            WHEN 'HoatDong' THEN 1
            WHEN 'NgungHoatDong' THEN 2
            WHEN 'LuuTru' THEN 3
          END,
          da.CapNhatLuc DESC
        LIMIT ${safeLimit} OFFSET ${offset}
      `;
      const [rows] = await db.query(query, params);

      // Query total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM duan da
        INNER JOIN nguoidung nd ON da.ChuDuAnID = nd.NguoiDungID
        ${fullWhereClause}
      `;

      const [countRows] = await db.query(countQuery, params);
      const total = countRows[0].total;

      return {
        data: rows,
        total,
        page: safePage,
        totalPages: Math.ceil(total / safeLimit),
        limit: safeLimit
      };
    } catch (error) {
      console.error('[DuAnOperatorModel] Lỗi layDanhSachDuAn:', error);
      throw new Error(`Lỗi lấy danh sách dự án: ${error.message}`);
    }
  }

  /**
   * Tạm ngưng dự án (không banned, chỉ tạm ngưng)
   * @param {number} duAnId - ID dự án
   * @param {number} nhanVienId - ID nhân viên thực hiện
   * @param {string} lyDo - Lý do tạm ngưng
   * @returns {Promise<Object>} Thông tin dự án sau khi tạm ngưng
   */
  static async tamNgungDuAn(duAnId, nhanVienId, lyDo) {
    const connection = await db.getConnection();
    
    try {
      // Validation lý do
      if (!lyDo || lyDo.trim().length < 10) {
        throw new Error('Lý do tạm ngưng phải có ít nhất 10 ký tự');
      }

      await connection.beginTransaction();

      // Kiểm tra dự án
      const [duAnRows] = await connection.execute(
        `SELECT DuAnID, TenDuAn, TrangThai, ChuDuAnID 
         FROM duan WHERE DuAnID = ?`,
        [duAnId]
      );

      if (!duAnRows.length) {
        throw new Error('Dự án không tồn tại');
      }

      const duAn = duAnRows[0];

      if (duAn.TrangThai === 'NgungHoatDong') {
        throw new Error('Dự án đã bị ngưng hoạt động (banned)');
      }

      if (duAn.TrangThai === 'LuuTru') {
        throw new Error('Dự án đang ở trạng thái lưu trữ');
      }

      // Cập nhật dự án về LuuTru (tạm ngưng)
      await connection.execute(
        `UPDATE duan 
         SET TrangThai = 'LuuTru',
             CapNhatLuc = NOW()
         WHERE DuAnID = ?`,
        [duAnId]
      );

      // Tạm ngưng tất cả tin đăng của dự án (Đã loại bỏ ảnh hưởng chéo theo yêu cầu)
      /* await connection.execute(
        `UPDATE tindang 
         SET TrangThai = 'TamNgung',
             CapNhatLuc = NOW()
         WHERE DuAnID = ? 
         AND TrangThai IN ('DaDang', 'DaDuyet', 'ChoDuyet')`,
        [duAnId]
      ); */

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan({
        TacNhan: 'Operator',
        NguoiDungID: nhanVienId,
        HanhDong: 'TAM_NGUNG_DU_AN',
        DoiTuong: 'DuAn',
        DoiTuongID: duAnId,
        ChiTiet: JSON.stringify({
          TenDuAn: duAn.TenDuAn,
          ChuDuAnID: duAn.ChuDuAnID,
          LyDo: lyDo.trim(),
          TrangThaiCu: duAn.TrangThai,
          TrangThaiMoi: 'LuuTru'
        })
      });

      await connection.commit();

      // Lấy thông tin sau khi cập nhật
      const [updatedRows] = await connection.execute(
        `SELECT da.*, nd.TenDayDu as TenChuDuAn
         FROM duan da
         INNER JOIN nguoidung nd ON da.ChuDuAnID = nd.NguoiDungID
         WHERE da.DuAnID = ?`,
        [duAnId]
      );

      return updatedRows[0];
    } catch (error) {
      await connection.rollback();
      console.error('[DuAnOperatorModel] Lỗi tamNgungDuAn:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Kích hoạt lại dự án (từ LuuTru → HoatDong)
   * @param {number} duAnId - ID dự án
   * @param {number} nhanVienId - ID nhân viên thực hiện
   * @returns {Promise<Object>} Thông tin dự án sau khi kích hoạt
   */
  static async kichHoatDuAn(duAnId, nhanVienId) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Kiểm tra dự án
      const [duAnRows] = await connection.execute(
        `SELECT DuAnID, TenDuAn, TrangThai, ChuDuAnID 
         FROM duan WHERE DuAnID = ?`,
        [duAnId]
      );

      if (!duAnRows.length) {
        throw new Error('Dự án không tồn tại');
      }

      const duAn = duAnRows[0];

      if (duAn.TrangThai === 'NgungHoatDong') {
        throw new Error('Dự án đã bị banned. Cần xử lý yêu cầu mở lại trước.');
      }

      if (duAn.TrangThai === 'HoatDong') {
        throw new Error('Dự án đang hoạt động');
      }

      // Kích hoạt dự án
      await connection.execute(
        `UPDATE duan 
         SET TrangThai = 'HoatDong',
             CapNhatLuc = NOW()
         WHERE DuAnID = ?`,
        [duAnId]
      );

      // Kích hoạt lại các tin đăng đã bị tạm ngưng (Đã loại bỏ ảnh hưởng chéo theo yêu cầu)
      /* await connection.execute(
        `UPDATE tindang 
         SET TrangThai = 'DaDang',
             CapNhatLuc = NOW()
         WHERE DuAnID = ? 
         AND TrangThai = 'TamNgung'`,
        [duAnId]
      ); */

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan({
        TacNhan: 'Operator',
        NguoiDungID: nhanVienId,
        HanhDong: 'KICH_HOAT_DU_AN',
        DoiTuong: 'DuAn',
        DoiTuongID: duAnId,
        ChiTiet: JSON.stringify({
          TenDuAn: duAn.TenDuAn,
          ChuDuAnID: duAn.ChuDuAnID,
          TrangThaiCu: duAn.TrangThai,
          TrangThaiMoi: 'HoatDong'
        })
      });

      await connection.commit();

      // Lấy thông tin sau khi cập nhật
      const [updatedRows] = await connection.execute(
        `SELECT da.*, nd.TenDayDu as TenChuDuAn
         FROM duan da
         INNER JOIN nguoidung nd ON da.ChuDuAnID = nd.NguoiDungID
         WHERE da.DuAnID = ?`,
        [duAnId]
      );

      return updatedRows[0];
    } catch (error) {
      await connection.rollback();
      console.error('[DuAnOperatorModel] Lỗi kichHoatDuAn:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Lấy thống kê dự án theo trạng thái
   * @returns {Promise<Object>} Thống kê số lượng dự án
   */
  static async layThongKeDuAn() {
    try {
      const query = `
        SELECT 
          COUNT(CASE WHEN TrangThai = 'HoatDong' THEN 1 END) as HoatDong,
          COUNT(CASE WHEN TrangThai = 'NgungHoatDong' THEN 1 END) as NgungHoatDong,
          COUNT(CASE WHEN TrangThai = 'LuuTru' THEN 1 END) as LuuTru,
          COUNT(CASE WHEN YeuCauMoLai = 'DangXuLy' THEN 1 END) as YeuCauMoLaiDangXuLy,
          COUNT(*) as TongSo
        FROM duan
      `;

      const [rows] = await db.execute(query);
      
      // Thống kê tin đăng theo dự án
      const tinDangQuery = `
        SELECT 
          da.TrangThai as TrangThaiDuAn,
          COUNT(CASE WHEN td.TrangThai = 'ChoDuyet' THEN 1 END) as TinDangChoDuyet,
          COUNT(CASE WHEN td.TrangThai = 'DaDang' THEN 1 END) as TinDangDaDang
        FROM duan da
        LEFT JOIN tindang td ON da.DuAnID = td.DuAnID
        GROUP BY da.TrangThai
      `;

      const [tinDangRows] = await db.execute(tinDangQuery);

      return {
        duAn: rows[0],
        tinDang: tinDangRows
      };
    } catch (error) {
      console.error('[DuAnOperatorModel] Lỗi layThongKeDuAn:', error);
      throw new Error(`Lỗi lấy thống kê dự án: ${error.message}`);
    }
  }

  /**
   * Lấy chi tiết dự án
   * @param {number} duAnId - ID dự án
   * @returns {Promise<Object>} Chi tiết dự án
   */
  static async layChiTietDuAn(duAnId) {
    try {
      const query = `
        SELECT 
          da.*,
          nd.NguoiDungID as ChuDuAnID,
          nd.TenDayDu as TenChuDuAn,
          nd.Email as EmailChuDuAn,
          nd.SoDienThoai as SoDienThoaiChuDuAn,
          nd.TrangThaiXacMinh as TrangThaiKYC,
          nd_ngung.TenDayDu as NguoiNgungHoatDong,
          nd_xuLy.TenDayDu as NguoiXuLyYeuCau,
          csc.TenChinhSach as TenChinhSachCoc
        FROM duan da
        INNER JOIN nguoidung nd ON da.ChuDuAnID = nd.NguoiDungID
        LEFT JOIN nguoidung nd_ngung ON da.NguoiNgungHoatDongID = nd_ngung.NguoiDungID
        LEFT JOIN nguoidung nd_xuLy ON da.NguoiXuLyYeuCauID = nd_xuLy.NguoiDungID
        LEFT JOIN chinhsachcoc csc ON da.ChinhSachCocID = csc.ChinhSachCocID
        WHERE da.DuAnID = ?
      `;

      const [rows] = await db.execute(query, [duAnId]);

      if (!rows.length) {
        throw new Error('Dự án không tồn tại');
      }

      const duAn = rows[0];

      // Lấy thống kê tin đăng của dự án
      const thongKeQuery = `
        SELECT 
          COUNT(*) as TongSoTinDang,
          COUNT(CASE WHEN TrangThai = 'ChoDuyet' THEN 1 END) as ChoDuyet,
          COUNT(CASE WHEN TrangThai = 'DaDang' THEN 1 END) as DaDang,
          COUNT(CASE WHEN TrangThai = 'TamNgung' THEN 1 END) as TamNgung,
          COUNT(CASE WHEN TrangThai = 'TuChoi' THEN 1 END) as TuChoi
        FROM tindang
        WHERE DuAnID = ?
      `;

      const [thongKeRows] = await db.execute(thongKeQuery, [duAnId]);
      duAn.ThongKeTinDang = thongKeRows[0];

      return duAn;
    } catch (error) {
      console.error('[DuAnOperatorModel] Lỗi layChiTietDuAn:', error);
      throw new Error(`Lỗi lấy chi tiết dự án: ${error.message}`);
    }
  }

  /**
   * Tạo dự án mới từ quản trị viên hệ thống
   * @param {Object} data
   * @param {number} nhanVienId
   * @returns {Promise<Object>}
   */
  static async taoDuAnHeThong(data, nhanVienId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [ownerRows] = await connection.execute(
        `SELECT NguoiDungID, TenDayDu FROM nguoidung WHERE NguoiDungID = ?`,
        [data.ChuDuAnID]
      );

      if (!ownerRows.length) {
        throw new Error('Chủ dự án không tồn tại');
      }

      const [dupAddress] = await connection.execute(
        `SELECT DuAnID FROM duan 
         WHERE ChuDuAnID = ? AND DiaChi = ? AND TrangThai != 'LuuTru'`,
        [data.ChuDuAnID, data.DiaChi]
      );

      if (dupAddress.length > 0) {
        throw new Error('Địa chỉ này đã được sử dụng cho một dự án khác');
      }

      const isSuspended = data.TrangThai === 'NgungHoatDong';

      const [result] = await connection.execute(
        `INSERT INTO duan (
          TenDuAn,
          DiaChi,
          ViDo,
          KinhDo,
          ChuDuAnID,
          YeuCauPheDuyetChu,
          PhuongThucVao,
          TrangThai,
          SoThangCocToiThieu,
          BangHoaHong,
          LyDoNgungHoatDong,
          NguoiNgungHoatDongID,
          NgungHoatDongLuc,
          TaoLuc,
          CapNhatLuc
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          data.TenDuAn,
          data.DiaChi,
          data.ViDo,
          data.KinhDo,
          data.ChuDuAnID,
          data.YeuCauPheDuyetChu ?? 0,
          data.PhuongThucVao || null,
          data.TrangThai || 'HoatDong',
          data.SoThangCocToiThieu,
          data.BangHoaHong,
          isSuspended ? (data.LyDoNgungHoatDong || null) : null,
          isSuspended ? nhanVienId : null,
          isSuspended ? new Date() : null
        ]
      );

      await NhatKyHeThongService.ghiNhan({
        TacNhan: 'QuanTriVienHeThong',
        NguoiDungID: nhanVienId,
        HanhDong: 'TAO_DU_AN_HE_THONG',
        DoiTuong: 'DuAn',
        DoiTuongID: result.insertId,
        ChiTiet: JSON.stringify({
          TenDuAn: data.TenDuAn,
          ChuDuAnID: data.ChuDuAnID,
          TrangThai: data.TrangThai || 'HoatDong'
        })
      });

      await connection.commit();

      return await DuAnOperatorModel.layChiTietDuAn(result.insertId);
    } catch (error) {
      await connection.rollback();
      console.error('[DuAnOperatorModel] Lỗi taoDuAnHeThong:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Cập nhật dự án từ quản trị viên hệ thống
   * @param {number} duAnId
   * @param {Object} data
   * @param {number} nhanVienId
   * @returns {Promise<Object>}
   */
  static async capNhatDuAnHeThong(duAnId, data, nhanVienId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [currentRows] = await connection.execute(
        `SELECT DuAnID, TenDuAn, ChuDuAnID, DiaChi, TrangThai FROM duan WHERE DuAnID = ?`,
        [duAnId]
      );

      if (!currentRows.length) {
        throw new Error('Dự án không tồn tại');
      }

      const current = currentRows[0];
      const nextOwnerId = data.ChuDuAnID || current.ChuDuAnID;

      if (Object.prototype.hasOwnProperty.call(data, 'ChuDuAnID') && data.ChuDuAnID !== current.ChuDuAnID) {
        const [ownerRows] = await connection.execute(
          `SELECT NguoiDungID FROM nguoidung WHERE NguoiDungID = ?`,
          [data.ChuDuAnID]
        );

        if (!ownerRows.length) {
          throw new Error('Chủ dự án không tồn tại');
        }
      }

      if (Object.prototype.hasOwnProperty.call(data, 'DiaChi') && data.DiaChi && data.DiaChi !== current.DiaChi) {
        const [dupRows] = await connection.execute(
          `SELECT DuAnID FROM duan
           WHERE ChuDuAnID = ? AND DiaChi = ? AND DuAnID != ? AND TrangThai != 'LuuTru'`,
          [nextOwnerId, data.DiaChi, duAnId]
        );

        if (dupRows.length > 0) {
          throw new Error('Địa chỉ này đã được sử dụng cho một dự án khác');
        }
      }

      const updates = [];
      const params = [];
      const hasOwn = (field) => Object.prototype.hasOwnProperty.call(data, field);
      let statusChanged = false;

      if (hasOwn('TenDuAn')) {
        updates.push('TenDuAn = ?');
        params.push(data.TenDuAn);
      }

      if (hasOwn('DiaChi')) {
        updates.push('DiaChi = ?');
        params.push(data.DiaChi);
      }

      if (hasOwn('ViDo')) {
        updates.push('ViDo = ?');
        params.push(data.ViDo);
      }

      if (hasOwn('KinhDo')) {
        updates.push('KinhDo = ?');
        params.push(data.KinhDo);
      }

      if (hasOwn('ChuDuAnID')) {
        updates.push('ChuDuAnID = ?');
        params.push(data.ChuDuAnID);
      }

      if (hasOwn('YeuCauPheDuyetChu')) {
        updates.push('YeuCauPheDuyetChu = ?');
        params.push(data.YeuCauPheDuyetChu ?? 0);
      }

      if (hasOwn('PhuongThucVao')) {
        updates.push('PhuongThucVao = ?');
        params.push(data.PhuongThucVao || null);
      }

      if (hasOwn('SoThangCocToiThieu')) {
        updates.push('SoThangCocToiThieu = ?');
        params.push(data.SoThangCocToiThieu);
      }

      if (hasOwn('BangHoaHong')) {
        updates.push('BangHoaHong = ?');
        params.push(data.BangHoaHong);
      }

      const reasonProvided = hasOwn('LyDoNgungHoatDong');

      if (hasOwn('TrangThai') && data.TrangThai !== current.TrangThai) {
        statusChanged = true;
        updates.push('TrangThai = ?');
        params.push(data.TrangThai);

        if (data.TrangThai === 'NgungHoatDong') {
          updates.push('NguoiNgungHoatDongID = ?');
          params.push(nhanVienId);
          updates.push('NgungHoatDongLuc = NOW()');
          updates.push('LyDoNgungHoatDong = ?');
          params.push(data.LyDoNgungHoatDong || null);
        } else {
          updates.push('NguoiNgungHoatDongID = NULL');
          updates.push('NgungHoatDongLuc = NULL');
          if (!reasonProvided) {
            updates.push('LyDoNgungHoatDong = NULL');
          }
        }
      } else if (reasonProvided) {
        updates.push('LyDoNgungHoatDong = ?');
        params.push(data.LyDoNgungHoatDong || null);
      }

      if (!updates.length) {
        throw new Error('Không có trường nào được cập nhật');
      }

      updates.push('CapNhatLuc = NOW()');

      await connection.execute(
        `UPDATE duan SET ${updates.join(', ')} WHERE DuAnID = ?`,
        [...params, duAnId]
      );

      // Đã loại bỏ ảnh hưởng chéo theo yêu cầu
      /* if (statusChanged) {
        if (data.TrangThai === 'HoatDong') {
          await connection.execute(
            `UPDATE tindang 
             SET TrangThai = 'DaDang', CapNhatLuc = NOW()
             WHERE DuAnID = ? AND TrangThai = 'TamNgung'`,
            [duAnId]
          );
        } else {
          await connection.execute(
            `UPDATE tindang 
             SET TrangThai = 'TamNgung', CapNhatLuc = NOW()
             WHERE DuAnID = ? AND TrangThai IN ('DaDang','DaDuyet','ChoDuyet')`,
            [duAnId]
          );
        }
      } */

      await NhatKyHeThongService.ghiNhan({
        TacNhan: 'QuanTriVienHeThong',
        NguoiDungID: nhanVienId,
        HanhDong: 'CAP_NHAT_DU_AN_HE_THONG',
        DoiTuong: 'DuAn',
        DoiTuongID: duAnId,
        ChiTiet: JSON.stringify({
          DuAnID: duAnId,
          Truoc: { TrangThai: current.TrangThai, ChuDuAnID: current.ChuDuAnID },
          Sau: { TrangThai: data.TrangThai || current.TrangThai, ChuDuAnID: data.ChuDuAnID || current.ChuDuAnID }
        })
      });

      await connection.commit();

      return await DuAnOperatorModel.layChiTietDuAn(duAnId);
    } catch (error) {
      await connection.rollback();
      console.error('[DuAnOperatorModel] Lỗi capNhatDuAnHeThong:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Duyệt hoa hồng dự án
   * @param {number} duAnId - ID dự án
   * @param {number} operatorId - ID operator thực hiện
   * @returns {Promise<Object>} Thông tin dự án sau khi duyệt
   */
  static async duyetHoaHongDuAn(duAnId, operatorId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Kiểm tra dự án tồn tại và có BangHoaHong
      const [rows] = await connection.query(
        `SELECT DuAnID, TenDuAn, BangHoaHong, TrangThaiDuyetHoaHong 
         FROM duan WHERE DuAnID = ?`,
        [duAnId]
      );

      if (!rows.length) {
        throw new Error('Dự án không tồn tại');
      }

      const duAn = rows[0];

      if (!duAn.BangHoaHong) {
        throw new Error('Dự án không có bảng hoa hồng để duyệt');
      }

      if (duAn.TrangThaiDuyetHoaHong === 'DaDuyet') {
        throw new Error('Hoa hồng đã được duyệt trước đó');
      }

      // Cập nhật trạng thái duyệt hoa hồng
      await connection.query(
        `UPDATE duan SET 
          TrangThaiDuyetHoaHong = 'DaDuyet',
          NguoiDuyetHoaHongID = ?,
          ThoiGianDuyetHoaHong = NOW(),
          CapNhatLuc = NOW()
         WHERE DuAnID = ?`,
        [operatorId, duAnId]
      );

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan({
        TacNhan: 'Operator',
        NguoiDungID: operatorId,
        HanhDong: 'DUYET_HOA_HONG_DU_AN',
        DoiTuong: 'DuAn',
        DoiTuongID: duAnId,
        ChiTiet: JSON.stringify({
          TenDuAn: duAn.TenDuAn,
          BangHoaHong: duAn.BangHoaHong
        })
      });

      await connection.commit();

      // Trả về thông tin dự án sau khi duyệt
      const [updated] = await db.query(
        `SELECT * FROM duan WHERE DuAnID = ?`,
        [duAnId]
      );

      return updated[0];
    } catch (error) {
      await connection.rollback();
      console.error('[DuAnOperatorModel] Lỗi duyetHoaHongDuAn:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Từ chối hoa hồng dự án
   * @param {number} duAnId - ID dự án
   * @param {number} operatorId - ID operator thực hiện
   * @param {string} lyDo - Lý do từ chối
   * @param {string} [ghiChu] - Ghi chú thêm
   * @returns {Promise<Object>} Thông tin dự án sau khi từ chối
   */
  static async tuChoiHoaHongDuAn(duAnId, operatorId, lyDo, ghiChu) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Kiểm tra dự án tồn tại
      const [rows] = await connection.query(
        `SELECT DuAnID, TenDuAn, BangHoaHong, TrangThaiDuyetHoaHong 
         FROM duan WHERE DuAnID = ?`,
        [duAnId]
      );

      if (!rows.length) {
        throw new Error('Dự án không tồn tại');
      }

      const duAn = rows[0];

      if (duAn.TrangThaiDuyetHoaHong === 'DaDuyet') {
        throw new Error('Hoa hồng đã được duyệt, không thể từ chối');
      }

      // Cập nhật trạng thái từ chối
      await connection.query(
        `UPDATE duan SET 
          TrangThaiDuyetHoaHong = 'TuChoi',
          LyDoTuChoiHoaHong = ?,
          NguoiDuyetHoaHongID = ?,
          ThoiGianDuyetHoaHong = NOW(),
          CapNhatLuc = NOW()
         WHERE DuAnID = ?`,
        [lyDo, operatorId, duAnId]
      );

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan({
        TacNhan: 'Operator',
        NguoiDungID: operatorId,
        HanhDong: 'TU_CHOI_HOA_HONG_DU_AN',
        DoiTuong: 'DuAn',
        DoiTuongID: duAnId,
        ChiTiet: JSON.stringify({
          TenDuAn: duAn.TenDuAn,
          LyDo: lyDo,
          GhiChu: ghiChu
        })
      });

      await connection.commit();

      // Trả về thông tin dự án sau khi từ chối
      const [updated] = await db.query(
        `SELECT * FROM duan WHERE DuAnID = ?`,
        [duAnId]
      );

      return updated[0];
    } catch (error) {
      await connection.rollback();
      console.error('[DuAnOperatorModel] Lỗi tuChoiHoaHongDuAn:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = DuAnOperatorModel;






