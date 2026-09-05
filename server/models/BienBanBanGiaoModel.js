/**
 * Model cho Nhân viên Điều hành - Lập Biên bản Bàn giao
 * UC-OPER-06: Lập biên bản bàn giao
 * Quản lý quy trình bàn giao phòng, giải tỏa cọc an ninh
 */

const db = require('../config/db');
const NhatKyHeThongService = require('../services/NhatKyHeThongService');

class BienBanBanGiaoModel {
  /**
   * Lấy danh sách biên bản bàn giao với phân trang và bộ lọc
   * @param {Object} filters - Bộ lọc
   * @param {string} [filters.keyword] - Từ khóa tìm kiếm
   * @param {number} [filters.nhanVienId] - ID nhân viên bán hàng
   * @param {string} [filters.trangThai] - Trạng thái biên bản
   * @param {number} [filters.page=1] - Trang hiện tại
   * @param {number} [filters.limit=20] - Số items mỗi trang
   * @returns {Promise<{data: Array, total: number, page: number, totalPages: number}>}
   */
  static async layDanhSachBienBan(filters = {}) {
    try {
      const {
        keyword = '',
        nhanVienId = null,
        trangThai = null,
        page = 1,
        limit = 20
      } = filters;

      // Parse số nguyên để tránh lỗi prepared statement với LIMIT/OFFSET
      const pageInt = parseInt(page, 10) || 1;
      const limitInt = parseInt(limit, 10) || 20;
      const offset = (pageInt - 1) * limitInt;

      let whereConditions = [];
      const params = [];

      if (keyword && keyword.trim()) {
        // Tìm theo ID biên bản (cast sang string) hoặc tên KH
        whereConditions.push(`(CAST(bb.BienBanBanGiaoID AS CHAR) LIKE ? OR kh.TenDayDu LIKE ?)`);
        const keywordParam = `%${keyword.trim()}%`;
        params.push(keywordParam, keywordParam);
      }

      if (nhanVienId) {
        // Lọc biên bản theo nhân viên bán hàng (người có cuộc hẹn chốt phòng)
        whereConditions.push(`EXISTS (SELECT 1 FROM cuochen ch WHERE ch.PhongID = bb.PhongID AND ch.NhanVienBanHangID = ?)`);
        params.push(nhanVienId);
      }

      if (trangThai) {
        whereConditions.push(`bb.TrangThai = ?`);
        params.push(trangThai);
      }

      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      const query = `
        SELECT 
          bb.BienBanBanGiaoID AS BienBanID,
          bb.PhongID,
          bb.HopDongID,
          bb.TrangThai,
          bb.TaoLuc,
          bb.CapNhatLuc,
          p.TenPhong,
          td.TieuDe AS TieuDeTinDang,
          da.TenDuAn,
          hd.NgayBatDau as NgayBatDauHopDong,
          kh.NguoiDungID as KhachHangID,
          kh.TenDayDu as TenKhachHang,
          kh.SoDienThoai as SoDienThoaiKhach
        FROM bienbanbangiao bb
        INNER JOIN phong p ON bb.PhongID = p.PhongID
        INNER JOIN hopdong hd ON bb.HopDongID = hd.HopDongID
        INNER JOIN tindang td ON bb.TinDangID = td.TinDangID
        INNER JOIN duan da ON td.DuAnID = da.DuAnID
        INNER JOIN nguoidung kh ON hd.KhachHangID = kh.NguoiDungID
        ${whereClause}
        ORDER BY bb.TaoLuc DESC
        LIMIT ? OFFSET ?
      `;

      // Đảm bảo limit và offset là số nguyên cho LIMIT/OFFSET
      params.push(limitInt, offset);
      // Dùng db.query() cho query động (WHERE clause thay đổi) - best practice
      const [rows] = await db.query(query, params);

      // Query total count (không cần LIMIT/OFFSET)
      const countQuery = `
        SELECT COUNT(*) as total
        FROM bienbanbangiao bb
        INNER JOIN phong p ON bb.PhongID = p.PhongID
        INNER JOIN hopdong hd ON bb.HopDongID = hd.HopDongID
        INNER JOIN nguoidung kh ON hd.KhachHangID = kh.NguoiDungID
        ${whereConditions.length > 0 
          ? 'WHERE ' + whereConditions.join(' AND ')
          : ''}
      `;

      const countParams = params.slice(0, -2);
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
      console.error('[BienBanBanGiaoModel] Lỗi layDanhSachBienBan:', error);
      throw new Error(`Lỗi lấy danh sách biên bản: ${error.message}`);
    }
  }

  /**
   * Lấy danh sách phòng cần bàn giao (Phòng GiuCho, có hợp đồng)
   * @param {Object} filters - Bộ lọc
   * @param {string} [filters.trangThai] - Trạng thái biên bản
   * @param {number} [filters.duAnId] - ID dự án
   * @param {number} [filters.page=1] - Trang hiện tại
   * @param {number} [filters.limit=20] - Số items mỗi trang
   * @returns {Promise<{data: Array, total: number, page: number, totalPages: number}>}
   */
  static async layDanhSachPhongCanBanGiao(filters = {}) {
    try {
      const {
        trangThai = null,
        duAnId = null,
        page = 1,
        limit = 20
      } = filters;

      const offset = (page - 1) * limit;

      let whereConditions = [`p.TrangThai = 'GiuCho'`];
      const params = [];

      if (trangThai) {
        whereConditions.push(`COALESCE(bb.TrangThai, 'ChuaBanGiao') = ?`);
        params.push(trangThai);
      }

      if (duAnId) {
        whereConditions.push(`da.DuAnID = ?`);
        params.push(duAnId);
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT 
          p.PhongID,
          p.TenPhong,
          p.TrangThai as TrangThaiPhong,
          td.TinDangID,
          td.TieuDe as TieuDeTinDang,
          da.DuAnID,
          da.TenDuAn,
          da.DiaChi as DiaChiDuAn,
          hd.HopDongID,
          hd.NgayBatDau as NgayBatDauHopDong,
          hd.GiaThueCuoiCung,
          kh.NguoiDungID as KhachHangID,
          kh.TenDayDu as TenKhachHang,
          kh.SoDienThoai as SoDienThoaiKhachHang,
          bb.BienBanBanGiaoID,
          bb.TrangThai as TrangThaiBienBan,
          bb.TaoLuc as TaoLucBienBan,
          coc.CocID,
          coc.SoTien as SoTienCoc,
          coc.TrangThai as TrangThaiCoc
        FROM phong p
        INNER JOIN phong_tindang m ON m.PhongID = p.PhongID
        INNER JOIN tindang td ON m.TinDangID = td.TinDangID
        INNER JOIN duan da ON td.DuAnID = da.DuAnID
        LEFT JOIN hopdong hd ON td.TinDangID = hd.TinDangID
        LEFT JOIN nguoidung kh ON hd.KhachHangID = kh.NguoiDungID
        LEFT JOIN bienbanbangiao bb ON p.PhongID = bb.PhongID 
          AND bb.TrangThai IN ('ChuaBanGiao', 'DangBanGiao')
        LEFT JOIN coc ON p.PhongID = coc.PhongID 
          AND coc.Loai = 'CocAnNinh'
          AND coc.TrangThai = 'HieuLuc'
        WHERE ${whereClause}
        ORDER BY p.PhongID ASC
        LIMIT ? OFFSET ?
      `;

      params.push(limit, offset);
      const [rows] = await db.execute(query, params);

      // Query total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM phong p
        INNER JOIN phong_tindang m ON m.PhongID = p.PhongID
        INNER JOIN tindang td ON m.TinDangID = td.TinDangID
        INNER JOIN duan da ON td.DuAnID = da.DuAnID
        LEFT JOIN bienbanbangiao bb ON p.PhongID = bb.PhongID 
          AND bb.TrangThai IN ('ChuaBanGiao', 'DangBanGiao')
        WHERE ${whereClause}
      `;

      const countParams = params.slice(0, -2);
      const [countRows] = await db.execute(countQuery, countParams);
      const total = countRows[0].total;

      return {
        data: rows,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
        limit: parseInt(limit)
      };
    } catch (error) {
      console.error('[BienBanBanGiaoModel] Lỗi layDanhSachPhongCanBanGiao:', error);
      throw new Error(`Lỗi lấy danh sách phòng cần bàn giao: ${error.message}`);
    }
  }

  /**
   * Tạo biên bản bàn giao mới
   * @param {Object} data - Dữ liệu biên bản
   * @param {number} data.PhongID - ID phòng
   * @param {number} data.HopDongID - ID hợp đồng
   * @param {number} [data.ChiSoDien] - Chỉ số điện
   * @param {number} [data.ChiSoNuoc] - Chỉ số nước
   * @param {Object} [data.HienTrangJSON] - Hiện trạng tài sản (JSON)
   * @param {number} operatorId - ID operator thực hiện
   * @returns {Promise<Object>} Thông tin biên bản đã tạo
   */
  static async taoBienBan(data, operatorId) {
    const connection = await db.getConnection();
    
    try {
      // Validation
      if (!data.PhongID) {
        throw new Error('PhongID là bắt buộc');
      }

      if (!data.HopDongID) {
        throw new Error('HopDongID là bắt buộc');
      }

      await connection.beginTransaction();

      // Kiểm tra phòng
      const [phongRows] = await connection.execute(
        `SELECT p.PhongID, p.TenPhong, p.TrangThai
         FROM phong p
         WHERE p.PhongID = ?`,
        [data.PhongID]
      );

      if (!phongRows.length) {
        throw new Error('Phòng không tồn tại');
      }

      const phong = phongRows[0];

      if (phong.TrangThai !== 'GiuCho') {
        throw new Error(`Phòng đang ở trạng thái ${phong.TrangThai}, không thể tạo biên bản bàn giao`);
      }

      // Kiểm tra đã có biên bản DangBanGiao chưa (trigger DB sẽ chặn, nhưng check trước)
      const [existingBBRows] = await connection.execute(
        `SELECT BienBanBanGiaoID 
         FROM bienbanbangiao 
         WHERE PhongID = ? AND TrangThai = 'DangBanGiao'`,
        [data.PhongID]
      );

      if (existingBBRows.length > 0) {
        throw new Error('Phòng đã có biên bản đang bàn giao. Hoàn tất biên bản cũ trước.');
      }

      // Kiểm tra hợp đồng
      const [hopDongRows] = await connection.execute(
        `SELECT HopDongID, TinDangID, KhachHangID
         FROM hopdong
         WHERE HopDongID = ?`,
        [data.HopDongID]
      );

      if (!hopDongRows.length) {
        throw new Error('Hợp đồng không tồn tại');
      }

      const hopDong = hopDongRows[0];

      // Xác thực: hợp đồng thuộc tin đăng gắn với phòng (thông qua bảng phong_tindang)
      const [mappingRows] = await connection.execute(
        `SELECT 1 FROM phong_tindang 
         WHERE PhongID = ? AND TinDangID = ? 
         LIMIT 1`,
        [data.PhongID, hopDong.TinDangID]
      );

      if (!mappingRows.length) {
        throw new Error('Hợp đồng không thuộc tin đăng được gắn với phòng này');
      }

      // Tạo biên bản
      const hienTrangJSON = data.HienTrangJSON ? JSON.stringify(data.HienTrangJSON) : null;

      const [result] = await connection.execute(
        `INSERT INTO bienbanbangiao 
         (HopDongID, TinDangID, PhongID, TrangThai, ChiSoDien, ChiSoNuoc, HienTrangJSON, TaoLuc, CapNhatLuc) 
         VALUES (?, ?, ?, 'ChuaBanGiao', ?, ?, ?, NOW(), NOW())`,
        [data.HopDongID, hopDong.TinDangID, data.PhongID, data.ChiSoDien || null, data.ChiSoNuoc || null, hienTrangJSON]
      );

      const bienBanId = result.insertId;

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan({
        TacNhan: 'Operator',
        NguoiDungID: operatorId,
        HanhDong: 'TAO_BIEN_BAN_BAN_GIAO',
        DoiTuong: 'BienBanBanGiao',
        DoiTuongID: bienBanId,
        ChiTiet: JSON.stringify({
          PhongID: data.PhongID,
          TenPhong: phong.TenPhong,
          HopDongID: data.HopDongID,
          ChiSoDien: data.ChiSoDien,
          ChiSoNuoc: data.ChiSoNuoc
        })
      });

      await connection.commit();

      // Lấy thông tin biên bản vừa tạo
      return await this.layChiTietBienBan(bienBanId);
    } catch (error) {
      await connection.rollback();
      console.error('[BienBanBanGiaoModel] Lỗi taoBienBan:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Cập nhật biên bản bàn giao (chuyển trạng thái, cập nhật thông tin)
   * @param {number} bienBanId - ID biên bản
   * @param {Object} data - Dữ liệu cập nhật
   * @param {string} [data.TrangThai] - Trạng thái mới
   * @param {number} [data.ChiSoDien] - Chỉ số điện
   * @param {number} [data.ChiSoNuoc] - Chỉ số nước
   * @param {Object} [data.HienTrangJSON] - Hiện trạng
   * @param {number} operatorId - ID operator thực hiện
   * @returns {Promise<Object>}
   */
  static async capNhatBienBan(bienBanId, data, operatorId) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Lấy thông tin cũ
      const [oldRows] = await connection.execute(
        `SELECT * FROM bienbanbangiao WHERE BienBanBanGiaoID = ?`,
        [bienBanId]
      );

      if (!oldRows.length) {
        throw new Error('Biên bản không tồn tại');
      }

      const oldData = oldRows[0];

      // Validate state transition
      if (data.TrangThai) {
        const validTransitions = {
          'ChuaBanGiao': ['DangBanGiao'],
          'DangBanGiao': ['DaBanGiao'],
          'DaBanGiao': [] // Final state
        };

        if (!validTransitions[oldData.TrangThai]?.includes(data.TrangThai)) {
          throw new Error(`Không thể chuyển từ ${oldData.TrangThai} sang ${data.TrangThai}`);
        }
      }

      // Build update query
      const updateFields = [];
      const updateParams = [];

      if (data.TrangThai) {
        updateFields.push('TrangThai = ?');
        updateParams.push(data.TrangThai);
      }

      if (data.ChiSoDien !== undefined) {
        updateFields.push('ChiSoDien = ?');
        updateParams.push(data.ChiSoDien);
      }

      if (data.ChiSoNuoc !== undefined) {
        updateFields.push('ChiSoNuoc = ?');
        updateParams.push(data.ChiSoNuoc);
      }

      if (data.HienTrangJSON) {
        updateFields.push('HienTrangJSON = ?');
        updateParams.push(JSON.stringify(data.HienTrangJSON));
      }

      if (updateFields.length === 0) {
        throw new Error('Không có dữ liệu để cập nhật');
      }

      updateFields.push('CapNhatLuc = NOW()');
      updateParams.push(bienBanId);

      await connection.execute(
        `UPDATE bienbanbangiao SET ${updateFields.join(', ')} WHERE BienBanBanGiaoID = ?`,
        updateParams
      );

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan({
        TacNhan: 'Operator',
        NguoiDungID: operatorId,
        HanhDong: 'CAP_NHAT_BIEN_BAN_BAN_GIAO',
        DoiTuong: 'BienBanBanGiao',
        DoiTuongID: bienBanId,
        ChiTiet: JSON.stringify({
          TrangThaiCu: oldData.TrangThai,
          TrangThaiMoi: data.TrangThai,
          ThayDoi: data
        })
      });

      await connection.commit();

      return await this.layChiTietBienBan(bienBanId);
    } catch (error) {
      await connection.rollback();
      console.error('[BienBanBanGiaoModel] Lỗi capNhatBienBan:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Ký biên bản (thêm chữ ký số, chuyển sang DaBanGiao)
   * @param {number} bienBanId - ID biên bản
   * @param {string} chuKySo - Chữ ký số (hash, signature, hoặc mã PIN)
   * @param {number} nguoiKyId - ID người ký
   * @returns {Promise<Object>}
   */
  static async kyBienBan(bienBanId, chuKySo, nguoiKyId) {
    const connection = await db.getConnection();
    
    try {
      if (!chuKySo || chuKySo.trim().length < 4) {
        throw new Error('Chữ ký số không hợp lệ');
      }

      await connection.beginTransaction();

      // Lấy thông tin biên bản
      const [bbRows] = await connection.execute(
        `SELECT * FROM bienbanbangiao WHERE BienBanBanGiaoID = ?`,
        [bienBanId]
      );

      if (!bbRows.length) {
        throw new Error('Biên bản không tồn tại');
      }

      const bienBan = bbRows[0];

      if (bienBan.TrangThai === 'ChuaBanGiao') {
        throw new Error('Biên bản chưa bắt đầu bàn giao. Chuyển sang DangBanGiao trước.');
      }

      if (bienBan.TrangThai === 'DaBanGiao') {
        throw new Error('Biên bản đã được ký trước đó');
      }

      // Cập nhật chữ ký và chuyển trạng thái
      await connection.execute(
        `UPDATE bienbanbangiao 
         SET ChuKySo = ?, TrangThai = 'DaBanGiao', CapNhatLuc = NOW() 
         WHERE BienBanBanGiaoID = ?`,
        [chuKySo, bienBanId]
      );

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan({
        TacNhan: 'Operator',
        NguoiDungID: nguoiKyId,
        HanhDong: 'KY_BIEN_BAN_BAN_GIAO',
        DoiTuong: 'BienBanBanGiao',
        DoiTuongID: bienBanId,
        ChiTiet: JSON.stringify({
          PhongID: bienBan.PhongID,
          HopDongID: bienBan.HopDongID
        })
      });

      // Kích hoạt giải tỏa cọc an ninh
      await this._kichHoatGiaiToaCoc(bienBanId, connection, nguoiKyId);

      // Cập nhật trạng thái phòng sang DaThue
      await connection.execute(
        `UPDATE phong SET TrangThai = 'DaThue', CapNhatLuc = NOW() WHERE PhongID = ?`,
        [bienBan.PhongID]
      );

      await connection.commit();

      return await this.layChiTietBienBan(bienBanId);
    } catch (error) {
      await connection.rollback();
      console.error('[BienBanBanGiaoModel] Lỗi kyBienBan:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Kích hoạt giải tỏa CocAnNinh khi DaBanGiao
   * @private
   */
  static async _kichHoatGiaiToaCoc(bienBanId, connection, nguoiKyId) {
    try {
      // Lấy thông tin biên bản
      const [bbRows] = await connection.execute(
        `SELECT PhongID, HopDongID FROM bienbanbangiao WHERE BienBanBanGiaoID = ?`,
        [bienBanId]
      );

      if (!bbRows.length) return;

      const { PhongID, HopDongID } = bbRows[0];

      // Tìm cọc an ninh hiệu lực
      const [cocRows] = await connection.execute(
        `SELECT CocID, SoTien, GiaoDichID, QuyTacGiaiToaSnapshot
         FROM coc
         WHERE PhongID = ? 
           AND Loai = 'CocAnNinh'
           AND TrangThai = 'HieuLuc'
         LIMIT 1`,
        [PhongID]
      );

      if (!cocRows.length) {
        console.log('[BienBanBanGiaoModel] Không tìm thấy cọc an ninh cần giải tỏa');
        return;
      }

      const coc = cocRows[0];

      // Cập nhật link biên bản vào cọc
      await connection.execute(
        `UPDATE coc 
         SET BienBanBanGiaoID = ?,
             HopDongID = ?,
             TrangThai = 'DaGiaiToa',
             LyDoGiaiToa = 'Đã hoàn thành bàn giao phòng',
             CapNhatLuc = NOW()
         WHERE CocID = ?`,
        [bienBanId, HopDongID, coc.CocID]
      );

      // Ghi audit log giải tỏa cọc
      await NhatKyHeThongService.ghiNhan({
        TacNhan: 'Operator',
        NguoiDungID: nguoiKyId,
        HanhDong: 'GIAI_TOA_COC_AN_NINH',
        DoiTuong: 'Coc',
        DoiTuongID: coc.CocID,
        ChiTiet: JSON.stringify({
          BienBanBanGiaoID: bienBanId,
          PhongID,
          SoTien: coc.SoTien,
          QuyTac: coc.QuyTacGiaiToaSnapshot
        })
      });

      console.log(`[BienBanBanGiaoModel] Đã giải tỏa cọc an ninh CocID=${coc.CocID}`);
    } catch (error) {
      console.error('[BienBanBanGiaoModel] Lỗi _kichHoatGiaiToaCoc:', error);
      // Không throw để không làm gián đoạn transaction chính
      // Log error và tiếp tục
    }
  }

  /**
   * Lấy chi tiết biên bản bàn giao
   * @param {number} bienBanId - ID biên bản
   * @returns {Promise<Object>}
   */
  static async layChiTietBienBan(bienBanId) {
    try {
      const query = `
        SELECT 
          bb.*,
          p.TenPhong,
          p.TrangThai as TrangThaiPhong,
          td.TieuDe as TieuDeTinDang,
          da.TenDuAn,
          da.DiaChi as DiaChiDuAn,
          hd.NgayBatDau as NgayBatDauHopDong,
          hd.NgayKetThuc as NgayKetThucHopDong,
          hd.GiaThueCuoiCung,
          kh.NguoiDungID as KhachHangID,
          kh.TenDayDu as TenKhachHang,
          kh.SoDienThoai as SoDienThoaiKhachHang,
          kh.Email as EmailKhachHang,
          cda.TenDayDu as TenChuDuAn,
          coc.CocID,
          coc.SoTien as SoTienCoc,
          coc.TrangThai as TrangThaiCoc
        FROM bienbanbangiao bb
        INNER JOIN phong p ON bb.PhongID = p.PhongID
        INNER JOIN tindang td ON bb.TinDangID = td.TinDangID
        INNER JOIN duan da ON td.DuAnID = da.DuAnID
        INNER JOIN hopdong hd ON bb.HopDongID = hd.HopDongID
        INNER JOIN nguoidung kh ON hd.KhachHangID = kh.NguoiDungID
        INNER JOIN nguoidung cda ON da.ChuDuAnID = cda.NguoiDungID
        LEFT JOIN coc ON bb.PhongID = coc.PhongID 
          AND coc.Loai = 'CocAnNinh'
          AND coc.BienBanBanGiaoID = bb.BienBanBanGiaoID
        WHERE bb.BienBanBanGiaoID = ?
      `;

      const [rows] = await db.execute(query, [bienBanId]);

      if (!rows.length) {
        throw new Error('Biên bản không tồn tại');
      }

      const bienBan = rows[0];

      // Parse HienTrangJSON
      if (bienBan.HienTrangJSON) {
        try {
          bienBan.HienTrang = JSON.parse(bienBan.HienTrangJSON);
        } catch (e) {
          bienBan.HienTrang = null;
        }
      }

      return bienBan;
    } catch (error) {
      console.error('[BienBanBanGiaoModel] Lỗi layChiTietBienBan:', error);
      throw new Error(`Lỗi lấy chi tiết biên bản: ${error.message}`);
    }
  }

  /**
   * Lấy thống kê biên bản bàn giao
   * @returns {Promise<Object>}
   */
  static async layThongKeBienBan() {
    try {
      const query = `
        SELECT 
          COUNT(CASE WHEN TrangThai = 'ChuaBanGiao' THEN 1 END) as ChuaBanGiao,
          COUNT(CASE WHEN TrangThai = 'DangBanGiao' THEN 1 END) as DangBanGiao,
          COUNT(CASE WHEN TrangThai = 'DaBanGiao' THEN 1 END) as DaBanGiao,
          COUNT(*) as TongSo
        FROM bienbanbangiao
      `;

      const [rows] = await db.execute(query);
      return rows[0];
    } catch (error) {
      console.error('[BienBanBanGiaoModel] Lỗi layThongKeBienBan:', error);
      throw new Error(`Lỗi lấy thống kê biên bản: ${error.message}`);
    }
  }
}

module.exports = BienBanBanGiaoModel;






