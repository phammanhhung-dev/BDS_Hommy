/**
 * Model cho Nhân viên Điều hành - Quản lý Hồ sơ Nhân viên
 * UC-OPER-04 & UC-OPER-05: Quản lý hồ sơ và tạo tài khoản NVBH
 */

const db = require('../config/db');
const NhatKyHeThongService = require('../services/NhatKyHeThongService');
const crypto = require('crypto');

class HoSoNhanVienModel {
  /**
   * Lấy danh sách nhân viên bán hàng với phân trang và bộ lọc
   * @param {Object} filters - Bộ lọc
   * @param {string} [filters.keyword] - Từ khóa tìm kiếm
   * @param {string} [filters.trangThai] - Trạng thái làm việc
   * @param {number} [filters.khuVucId] - ID khu vực
   * @param {number} [filters.page=1] - Trang hiện tại
   * @param {number} [filters.limit=20] - Số items mỗi trang
   * @returns {Promise<{data: Array, total: number, page: number, totalPages: number}>}
   */
  static async layDanhSachNhanVien(filters = {}) {
    try {
      const {
        keyword = '',
        trangThai = null,
        khuVucId = null,
        page = 1,
        limit = 20,
        operatorId = -1
      } = filters;

      // Parse số nguyên để tránh lỗi prepared statement với LIMIT/OFFSET
      const pageInt = parseInt(page, 10) || 1;
      const limitInt = parseInt(limit, 10) || 20;
      const offset = (pageInt - 1) * limitInt;

      let whereConditions = [];
      const params = [];

      if (keyword && keyword.trim()) {
        whereConditions.push(`(nd.TenDayDu LIKE ? OR nd.Email LIKE ? OR hs.MaNhanVien LIKE ?)`);
        const keywordParam = `%${keyword.trim()}%`;
        params.push(keywordParam, keywordParam, keywordParam);
      }

      if (trangThai) {
        whereConditions.push(`nd.TrangThai = ?`);
        params.push(trangThai);
      }

      if (khuVucId) {
        whereConditions.push(`hs.KhuVucChinhID = ?`);
        params.push(khuVucId);
      }

      if (operatorId != -1) {
        whereConditions.push(`hs.QuanLyID = ?`);
        params.push(operatorId);
      }

      // Luôn loại bỏ nhân viên đã xóa mềm
      whereConditions.push(`nd.TrangThai != 'XoaMem'`);

      const whereClause = whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      const query = `
        SELECT 
          hs.HoSoID,
          hs.NguoiDungID,
          hs.MaNhanVien,
          hs.KhuVucChinhID,
          hs.KhuVucPhuTrachID,
          hs.TyLeHoaHong,
          hs.NgayBatDau,
          hs.NgayKetThuc,
          hs.GhiChu,
          hs.QuanLyID,
          nd.TenDayDu,
          nd.Email,
          nd.SoDienThoai,
          nd.TrangThai as TrangThaiTaiKhoan,
          nd.TrangThai as TrangThaiLamViec,
          COALESCE(lc_chinh.CommuneName, lp_chinh.ProvinceName) as TenKhuVucChinh,
          COALESCE(lc_phu.CommuneName, lp_phu.ProvinceName) as KhuVucPhuTrach,
          COUNT(DISTINCT ch.CuocHenID) as TongSoCuocHen,
          COUNT(DISTINCT CASE WHEN ch.TrangThai = 'HoanThanh' THEN ch.CuocHenID END) as SoCuocHenHoanThanh
        FROM hosonhanvien hs
        INNER JOIN nguoidung nd ON hs.NguoiDungID = nd.NguoiDungID
        LEFT JOIN legacy_communes lc_chinh ON hs.KhuVucChinhID = lc_chinh.CommuneID
        LEFT JOIN legacy_provinces lp_chinh ON hs.KhuVucChinhID = lp_chinh.ProvinceID
        LEFT JOIN legacy_communes lc_phu ON hs.KhuVucPhuTrachID = lc_phu.CommuneID
        LEFT JOIN legacy_provinces lp_phu ON hs.KhuVucPhuTrachID = lp_phu.ProvinceID
        LEFT JOIN cuochen ch ON nd.NguoiDungID = ch.NhanVienBanHangID
        ${whereClause}
        GROUP BY hs.HoSoID
       ORDER BY nd.TrangThai ASC, nd.TenDayDu ASC
        LIMIT ? OFFSET ?
      `;

      // Đảm bảo limit và offset là số nguyên cho LIMIT/OFFSET
      params.push(limitInt, offset);
      // Dùng db.query() cho query động (WHERE clause thay đổi) - best practice
      const [rows] = await db.query(query, params);

      // Query total count (không cần LIMIT/OFFSET)
      const countQuery = `
        SELECT COUNT(*) as total
        FROM hosonhanvien hs
        INNER JOIN nguoidung nd ON hs.NguoiDungID = nd.NguoiDungID
        ${whereClause}
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
      console.error('[HoSoNhanVienModel] Lỗi layDanhSachNhanVien:', error);
      throw new Error(`Lỗi lấy danh sách nhân viên: ${error.message}`);
    }
  }

  /**
   * Lấy danh sách nhân viên phụ trách một khu vực cụ thể
   * @param {number} khuVucId
   * @returns {Promise<Array>}
   */
  static async layNhanVienTheoKhuVuc(khuVucId) {
    try {
      const query = `
        SELECT 
          hs.HoSoID,
          hs.NguoiDungID,
          hs.MaNhanVien,
          hs.KhuVucChinhID,
          hs.KhuVucPhuTrachID,
          nd.TenDayDu,
          nd.Email,
          nd.SoDienThoai,
          nd.TrangThai,
          COALESCE(lc_chinh.CommuneName, lp_chinh.ProvinceName) AS TenKhuVucChinh,
          COALESCE(lc_phu.CommuneName, lp_phu.ProvinceName) AS TenKhuVucPhuTrach
        FROM hosonhanvien hs
        INNER JOIN nguoidung nd ON hs.NguoiDungID = nd.NguoiDungID
        LEFT JOIN legacy_communes lc_chinh ON hs.KhuVucChinhID = lc_chinh.CommuneID
        LEFT JOIN legacy_provinces lp_chinh ON hs.KhuVucChinhID = lp_chinh.ProvinceID
        LEFT JOIN legacy_communes lc_phu ON hs.KhuVucPhuTrachID = lc_phu.CommuneID
        LEFT JOIN legacy_provinces lp_phu ON hs.KhuVucPhuTrachID = lp_phu.ProvinceID
        WHERE nd.TrangThai != 'XoaMem'
          AND (hs.KhuVucChinhID = ? OR hs.KhuVucPhuTrachID = ?)
        ORDER BY nd.TrangThai ASC, nd.TenDayDu ASC
      `;

      const [rows] = await db.execute(query, [khuVucId, khuVucId]);
      return rows;
    } catch (error) {
      console.error('[HoSoNhanVienModel] Lỗi layNhanVienTheoKhuVuc:', error);
      throw new Error(`Lỗi lấy danh sách nhân viên theo khu vực: ${error.message}`);
    }
  }

  /**
   * Lấy chi tiết hồ sơ nhân viên
   * @param {number} nhanVienId - ID nhân viên (NguoiDungID)
   * @returns {Promise<Object>} Chi tiết hồ sơ
   */
  static async layChiTietNhanVien(nhanVienId) {
    try {
      const query = `
        SELECT 
          hs.*,
          nd.TenDayDu,
          nd.Email,
          nd.SoDienThoai,
          nd.TrangThai as TrangThaiTaiKhoan,
          nd.TrangThaiXacMinh,
          COALESCE(lc_chinh.CommuneName, lp_chinh.ProvinceName) as TenKhuVucChinh,
          COALESCE(lc_phu.CommuneName, lp_phu.ProvinceName) as KhuVucPhuTrach,
          COUNT(DISTINCT ch.CuocHenID) as TongSoCuocHen,
          COUNT(DISTINCT CASE WHEN ch.TrangThai = 'HoanThanh' THEN ch.CuocHenID END) as SoCuocHenHoanThanh,
          COUNT(DISTINCT CASE WHEN ch.TrangThai = 'KhachKhongDen' THEN ch.CuocHenID END) as SoCuocHenKhachKhongDen
        FROM hosonhanvien hs
        INNER JOIN nguoidung nd ON hs.NguoiDungID = nd.NguoiDungID
        LEFT JOIN legacy_communes lc_chinh ON hs.KhuVucChinhID = lc_chinh.CommuneID
        LEFT JOIN legacy_provinces lp_chinh ON hs.KhuVucChinhID = lp_chinh.ProvinceID
        LEFT JOIN legacy_communes lc_phu ON hs.KhuVucPhuTrachID = lc_phu.CommuneID
        LEFT JOIN legacy_provinces lp_phu ON hs.KhuVucPhuTrachID = lp_phu.ProvinceID
        LEFT JOIN cuochen ch ON nd.NguoiDungID = ch.NhanVienBanHangID
        WHERE hs.NguoiDungID = ?
        GROUP BY hs.HoSoID
      `;

      const [rows] = await db.execute(query, [nhanVienId]);

      if (!rows.length) {
        // Giữ nguyên message thuần để controller có thể phân biệt 404
        throw new Error('Nhân viên không tồn tại');
      }

      const nhanVien = rows[0];

      // Tính KPI
      if (nhanVien.TongSoCuocHen > 0) {
        nhanVien.TyLeHoanThanh = (nhanVien.SoCuocHenHoanThanh / nhanVien.TongSoCuocHen * 100).toFixed(2);
        nhanVien.TyLeKhachKhongDen = (nhanVien.SoCuocHenKhachKhongDen / nhanVien.TongSoCuocHen * 100).toFixed(2);
      } else {
        nhanVien.TyLeHoanThanh = 0;
        nhanVien.TyLeKhachKhongDen = 0;
      }

      // Lấy lịch sử cuộc hẹn gần đây
      // LƯU Ý: Bảng `phong` KHÔNG có cột `TinDangID`, quan hệ phòng - tin đăng
      // đi qua bảng trung gian `phong_tindang`
      const lichSuQuery = `
        SELECT 
          ch.CuocHenID,
          ch.ThoiGianHen,
          ch.TrangThai,
          p.TenPhong,
          td.TieuDe as TieuDeTinDang,
          kh.TenDayDu as TenKhachHang
        FROM cuochen ch
        INNER JOIN phong p ON ch.PhongID = p.PhongID
        INNER JOIN phong_tindang pt ON p.PhongID = pt.PhongID
        INNER JOIN tindang td ON pt.TinDangID = td.TinDangID
        INNER JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        WHERE ch.NhanVienBanHangID = ?
        ORDER BY ch.ThoiGianHen DESC
        LIMIT 10
      `;

      const [lichSuRows] = await db.execute(lichSuQuery, [nhanVienId]);
      nhanVien.LichSuCuocHen = lichSuRows;

      // Lấy lịch làm việc gần đây của nhân viên
      const lichLamViecQuery = `
        SELECT 
          ll.LichID,
          ll.NhanVienBanHangID,
          ll.BatDau,
          ll.KetThuc
        FROM lichlamviec ll
        WHERE ll.NhanVienBanHangID = ?
        ORDER BY ll.BatDau DESC
        LIMIT 10
      `;

      const [lichLamViecRows] = await db.execute(lichLamViecQuery, [nhanVienId]);
      nhanVien.LichLamViecGanDay = lichLamViecRows;

      return nhanVien;
    } catch (error) {
      console.error('[HoSoNhanVienModel] Lỗi layChiTietNhanVien:', error);
      // Không wrap message "Nhân viên không tồn tại" để controller trả về 404 đúng
      if (error.message === 'Nhân viên không tồn tại') {
        throw error;
      }
      throw new Error(`Lỗi lấy chi tiết nhân viên: ${error.message}`);
    }
  }

  /**
   * Cập nhật hồ sơ nhân viên
   * @param {number} nhanVienId - ID nhân viên
   * @param {Object} data - Dữ liệu cập nhật
   * @param {number} operatorId - ID operator thực hiện
   * @returns {Promise<Object>} Thông tin sau khi cập nhật
   */
  static async capNhatHoSo(nhanVienId, data, operatorId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Validate phone số điện thoại
      if (data.SoDienThoai && !/^(0[3|5|7|8|9])+([0-9]{8})$/.test(data.SoDienThoai)) {
        throw new Error('Số điện thoại không hợp lệ (định dạng: 0xxxxxxxxx)');
      }

      // Lấy thông tin cũ
      const [oldRows] = await connection.execute(
        `SELECT hs.*, nd.TenDayDu, nd.SoDienThoai, nd.Email
         FROM hosonhanvien hs
         INNER JOIN nguoidung nd ON hs.NguoiDungID = nd.NguoiDungID
         WHERE hs.NguoiDungID = ?`,
        [nhanVienId]
      );

      if (!oldRows.length) {
        throw new Error('Nhân viên không tồn tại');
      }

      const oldData = oldRows[0];

      // Cập nhật nguoidung
      if (data.TenDayDu || data.SoDienThoai) {
        const updateUserFields = [];
        const updateUserParams = [];

        if (data.TenDayDu) {
          updateUserFields.push('TenDayDu = ?');
          updateUserParams.push(data.TenDayDu);
        }

        if (data.SoDienThoai) {
          updateUserFields.push('SoDienThoai = ?');
          updateUserParams.push(data.SoDienThoai);
        }

        if (updateUserFields.length > 0) {
          updateUserParams.push(nhanVienId);
          await connection.execute(
            `UPDATE nguoidung SET ${updateUserFields.join(', ')}, CapNhatLuc = NOW() WHERE NguoiDungID = ?`,
            updateUserParams
          );
        }
      }

      // Cập nhật hosonhanvien
      const updateHSFields = [];
      const updateHSParams = [];

      if (data.KhuVucChinhID !== undefined) {
        updateHSFields.push('KhuVucChinhID = ?');
        updateHSParams.push(data.KhuVucChinhID);
      }

      if (data.KhuVucPhuTrachID !== undefined) {
        updateHSFields.push('KhuVucPhuTrachID = ?');
        updateHSParams.push(data.KhuVucPhuTrachID);
      }

      if (data.TyLeHoaHong !== undefined) {
        if (data.TyLeHoaHong < 0 || data.TyLeHoaHong > 100) {
          throw new Error('Tỷ lệ hoa hồng phải từ 0-100');
        }
        updateHSFields.push('TyLeHoaHong = ?');
        updateHSParams.push(data.TyLeHoaHong);
      }

      if (data.GhiChu !== undefined) {
        updateHSFields.push('GhiChu = ?');
        updateHSParams.push(data.GhiChu);
      }

      if (updateHSFields.length > 0) {
        updateHSParams.push(nhanVienId);
        await connection.execute(
          `UPDATE hosonhanvien SET ${updateHSFields.join(', ')} WHERE NguoiDungID = ?`,
          updateHSParams
        );
      }

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan({
        TacNhan: 'Operator',
        NguoiDungID: operatorId,
        HanhDong: 'CAP_NHAT_HO_SO_NHAN_VIEN',
        DoiTuong: 'HoSoNhanVien',
        DoiTuongID: nhanVienId,
        ChiTiet: JSON.stringify({
          DuLieuCu: oldData,
          DuLieuMoi: data
        })
      });

      await connection.commit();

      // Lấy thông tin sau khi cập nhật
      return await this.layChiTietNhanVien(nhanVienId);
    } catch (error) {
      await connection.rollback();
      console.error('[HoSoNhanVienModel] Lỗi capNhatHoSo:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Tạo tài khoản nhân viên mới (user + vai trò + hồ sơ)
   * @param {Object} data - Dữ liệu nhân viên
   * @param {string} data.Email - Email (unique)
   * @param {string} data.TenDayDu - Họ tên
   * @param {string} data.SoDienThoai - Số điện thoại
   * @param {number} data.KhuVucChinhID - Khu vực chính
   * @param {number} [data.TyLeHoaHong=5] - Tỷ lệ hoa hồng (%)
   * @param {number} operatorId - ID operator thực hiện
   * @returns {Promise<{userId: number, setupToken: string}>}
   */
  static async taoTaiKhoanNhanVien(data) {
    const connection = await db.getConnection();

    try {
      // Validation
      if (!data.Email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.Email)) {
        throw new Error('Email không hợp lệ');
      }

      if (!data.TenDayDu || data.TenDayDu.trim().length < 3) {
        throw new Error('Họ tên phải có ít nhất 3 ký tự');
      }

      if (!data.SoDienThoai || !/^(0[3|5|7|8|9])+([0-9]{8})$/.test(data.SoDienThoai)) {
        throw new Error('Số điện thoại không hợp lệ');
      }

      if (!data.KhuVucChinhID) {
        throw new Error('Phải chọn khu vực chính');
      }

      await connection.beginTransaction();

      // Kiểm tra email trùng
      const [existingUsers] = await connection.execute(
        `SELECT NguoiDungID FROM nguoidung WHERE Email = ?`,
        [data.Email]
      );

      if (existingUsers.length > 0) {
        throw new Error('Email đã được sử dụng');
      }

      // Tạo mật khẩu tạm thời (sẽ bắt buộc đổi khi đăng nhập lần đầu)
      const crypto = require('crypto');
      const tempPassword = this._generateTempPassword();
      const hashedPassword = crypto.createHash('md5').update(tempPassword).digest('hex');

      // Tạo nguoidung
      const [userResult] = await connection.execute(
        `INSERT INTO nguoidung 
         (TenDayDu, Email, SoDienThoai, MatKhauHash, TrangThai, TrangThaiXacMinh, TaoLuc, CapNhatLuc) 
         VALUES (?, ?, ?, ?, 'HoatDong', 'ChuaXacMinh', NOW(), NOW())`,
        [data.TenDayDu.trim(), data.Email.toLowerCase(), data.SoDienThoai, hashedPassword]
      );

      const userId = userResult.insertId;

      // Lấy ID vai trò NhanVienBanHang
      const [vaiTroRows] = await connection.execute(
        `SELECT VaiTroID FROM vaitro WHERE TenVaiTro = 'Nhân viên Bán hàng' OR TenVaiTro = 'NhanVienBanHang' LIMIT 1`
      );

      if (!vaiTroRows.length) {
        throw new Error('Vai trò Nhân viên Bán hàng chưa được tạo trong hệ thống');
      }

      const vaiTroId = vaiTroRows[0].VaiTroID;

      // Cập nhật VaiTroHoatDongID trước (bảng nguoidung chắc chắn tồn tại)
      await connection.execute(
        `UPDATE nguoidung SET VaiTroHoatDongID = ? WHERE NguoiDungID = ?`,
        [vaiTroId, userId]
      );

      // Gán vai trò vào bảng nguoidung_vaitro (nếu bảng tồn tại)
      try {
        await connection.execute(
          `INSERT IGNORE INTO nguoidung_vaitro (NguoiDungID, VaiTroID) VALUES (?, ?)`,
          [userId, vaiTroId]
        );
      } catch (roleTableError) {
        // Bảng nguoidung_vaitro có thể không tồn tại - bỏ qua vì đã có VaiTroHoatDongID
        console.warn('[HoSoNhanVienModel] Bảng nguoidung_vaitro không tồn tại, dùng VaiTroHoatDongID:', roleTableError.message);
      }

      // Tạo mã nhân viên
      const maNhanVien = await this._generateNextMaNhanVien(connection);

      // Tạo hồ sơ nhân viên
      await connection.execute(
        `INSERT INTO hosonhanvien 
         (NguoiDungID, MaNhanVien, KhuVucChinhID, KhuVucPhuTrachID, TyLeHoaHong, NgayBatDau, QuanLyID) 
         VALUES (?, ?, ?, ?, ?, CURDATE(), ?)`,
        [userId, maNhanVien, data.KhuVucChinhID, data.KhuVucPhuTrachID, 50, data.operatorId]
      );

      // Tạo setup token (để gửi email)
      const setupToken = this._generateSetupToken(userId);

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan({
        TacNhan: 'Operator',
        NguoiDungID: data.operatorId,
        HanhDong: 'TAO_TAI_KHOAN_NHAN_VIEN',
        DoiTuong: 'NguoiDung',
        DoiTuongID: userId,
        ChiTiet: JSON.stringify({
          Email: data.Email,
          TenDayDu: data.TenDayDu,
          MaNhanVien: maNhanVien,
          KhuVucChinhID: data.KhuVucChinhID
        })
      });

      await connection.commit();

      return {
        userId,
        setupToken,
        email: data.Email,
        maNhanVien
      };
    } catch (error) {
      await connection.rollback();
      console.error('[HoSoNhanVienModel] Lỗi taoTaiKhoanNhanVien:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Kích hoạt/vô hiệu hóa nhân viên
   * @param {number} nhanVienId - ID nhân viên
   * @param {string} trangThai - 'Active' hoặc 'Inactive'
   * @param {number} operatorId - ID operator thực hiện
   * @returns {Promise<Object>}
   */
  static async kichHoat_VoHieuHoaNhanVien(nhanVienId, trangThai, operatorId) {
    const connection = await db.getConnection();

    try {
      if (!['Active', 'Inactive'].includes(trangThai)) {
        throw new Error("Trạng thái phải là 'Active' hoặc 'Inactive'");
      }

      // Map frontend status sang DB status
      const dbTrangThai = trangThai === 'Active' ? 'HoatDong' : 'VoHieuHoa';

      await connection.beginTransaction();

      // Cập nhật trạng thái tài khoản người dùng
      await connection.execute(
        `UPDATE nguoidung SET TrangThai = ? WHERE NguoiDungID = ?`,
        [dbTrangThai, nhanVienId]
      );

      // Nếu vô hiệu hóa, set NgayKetThuc
      if (trangThai === 'Inactive') {
        await connection.execute(
          `UPDATE hosonhanvien SET NgayKetThuc = CURDATE() WHERE NguoiDungID = ? AND NgayKetThuc IS NULL`,
          [nhanVienId]
        );
      }

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan({
        TacNhan: 'Operator',
        NguoiDungID: operatorId,
        HanhDong: trangThai === 'Active' ? 'KICH_HOAT_NHAN_VIEN' : 'VO_HIEU_HOA_NHAN_VIEN',
        DoiTuong: 'HoSoNhanVien',
        DoiTuongID: nhanVienId,
        ChiTiet: JSON.stringify({ TrangThaiMoi: trangThai })
      });

      await connection.commit();

      return await this.layChiTietNhanVien(nhanVienId);
    } catch (error) {
      await connection.rollback();
      console.error('[HoSoNhanVienModel] Lỗi kichHoat_VoHieuHoaNhanVien:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Generate mật khẩu tạm thời
   * @private
   */
  static _generateTempPassword() {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Generate mã nhân viên (format: NV + timestamp + random)
   * @private
   */
  /**
   * Tìm mã NV lớn nhất hiện tại và sinh mã tiếp theo (VD: NV0005 -> NV0006)
   * @param {Object} connection - Connection transaction hiện tại
   */
  static async _generateNextMaNhanVien(connection) {
    // 1. Lấy mã nhân viên mới nhất (sắp xếp giảm dần theo ID hoặc tách chuỗi)
    // Lưu ý: REGEXP_SUBSTR chỉ dùng cho MySQL 8.0+, nếu version thấp dùng logic khác
    const [rows] = await connection.execute(
      `SELECT MaNhanVien FROM hosonhanvien 
       WHERE MaNhanVien LIKE 'NV%' 
       ORDER BY LENGTH(MaNhanVien) DESC, MaNhanVien DESC 
       LIMIT 1`
    );

    let nextNumber = 1;

    if (rows.length > 0 && rows[0].MaNhanVien) {
      // 2. Tách phần số ra khỏi chuỗi "NVxxxxx"
      const currentMa = rows[0].MaNhanVien; // Ví dụ: NV00015
      const numberPart = currentMa.replace(/\D/g, ''); // Lấy mỗi số: 00015

      if (numberPart) {
        nextNumber = parseInt(numberPart, 10) + 1;
      }
    }

    // 3. Format lại thành chuỗi (ví dụ 5 ký tự số: 16 -> NV00016)
    const nextMa = `NV${String(nextNumber).padStart(4, '0')}`;
    return nextMa;
  }

  /**
   * Generate setup token (JWT-like token, TTL 24h)
   * @private
   */
  static _generateSetupToken(userId) {
    const payload = {
      userId,
      type: 'setup_password',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24h
    };

    // Simple base64 encoding (in production, use proper JWT)
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Lấy thống kê nhân viên
   * @returns {Promise<Object>}
   */
  static async layThongKeNhanVien(operatorId) {
    try {
      let whereCondition = "nd.TrangThai != 'XoaMem'";
      const params = [];

      // Nếu KHÔNG PHẢI là Admin (-1) thì mới lọc theo quản lý
      if (operatorId && operatorId != -1) {
        whereCondition += " AND hs.QuanLyID = ?";
        params.push(operatorId);
      }

      const query = `
        SELECT 
          COUNT(CASE WHEN nd.TrangThai = 'HoatDong' THEN 1 END) as HoatDong,
          COUNT(CASE WHEN nd.TrangThai = 'TamKhoa' THEN 1 END) as TamKhoa,
          COUNT(CASE WHEN nd.TrangThai = 'VoHieuHoa' THEN 1 END) as VoHieuHoa,
          COUNT(*) as TongSo,
          AVG(hs.TyLeHoaHong) as TyLeHoaHongTrungBinh
        FROM hosonhanvien hs
          INNER JOIN nguoidung nd ON hs.NguoiDungID = nd.NguoiDungID
        WHERE ${whereCondition}
      `;

      const [rows] = await db.execute(query, params);

      console.log('📊 [HoSoNhanVienModel] Stats result:', rows[0]);

      return rows[0];
    } catch (error) {
      console.error('[HoSoNhanVienModel] Lỗi layThongKeNhanVien:', error);
      throw new Error(`Lỗi lấy thống kê nhân viên: ${error.message}`);
    }
  }

  /**
   * Lấy thông tin khu vực chính và phụ trách của nhân viên (với tên khu vực)
   * @param {number} nhanVienId - ID nhân viên (NguoiDungID)
   * @returns {Promise<Object>} Thông tin khu vực với tên
   */
  static async layKhuVucPhuTrach(nhanVienId) {
    try {
      console.log('[HoSoNhanVienModel] layKhuVucPhuTrach - nhanVienId:', nhanVienId);

      // Lấy KhuVucChinhID, KhuVucPhuTrachID + TÊN khu vực từ bảng khuvuc
      const [hoSoRows] = await db.execute(
        `SELECT 
          h.HoSoID, 
          h.KhuVucChinhID,
          COALESCE(lc_chinh.CommuneName, lp_chinh.ProvinceName) AS TenKhuVucChinh,
          h.KhuVucPhuTrachID,
          COALESCE(lc_phu.CommuneName, lp_phu.ProvinceName) AS TenKhuVucPhuTrach
         FROM hosonhanvien h
         LEFT JOIN legacy_communes lc_chinh ON h.KhuVucChinhID = lc_chinh.CommuneID
         LEFT JOIN legacy_provinces lp_chinh ON h.KhuVucChinhID = lp_chinh.ProvinceID
         LEFT JOIN legacy_communes lc_phu ON h.KhuVucPhuTrachID = lc_phu.CommuneID
         LEFT JOIN legacy_provinces lp_phu ON h.KhuVucPhuTrachID = lp_phu.ProvinceID
         WHERE h.NguoiDungID = ?`,
        [nhanVienId]
      );

      console.log('[HoSoNhanVienModel] layKhuVucPhuTrach - hoSoRows:', JSON.stringify(hoSoRows));

      if (!hoSoRows.length) {
        console.log('[HoSoNhanVienModel] layKhuVucPhuTrach - Không tìm thấy hồ sơ');
        throw new Error('Nhân viên không tồn tại');
      }

      const hoSo = hoSoRows[0];
      console.log('[HoSoNhanVienModel] layKhuVucPhuTrach - hoSo chi tiết:', hoSo);

      const result = {
        KhuVucChinhID: hoSo.KhuVucChinhID || null,
        TenKhuVucChinh: hoSo.TenKhuVucChinh || 'N/A',
        KhuVucPhuTrachID: hoSo.KhuVucPhuTrachID || null,
        TenKhuVucPhuTrach: hoSo.TenKhuVucPhuTrach || 'N/A'
      };

      console.log('[HoSoNhanVienModel] layKhuVucPhuTrach - Kết quả trả về:', result);

      return result;
    } catch (error) {
      console.error('[HoSoNhanVienModel] Lỗi layKhuVucPhuTrach:', error.message);
      if (error.message === 'Nhân viên không tồn tại') {
        throw error;
      }
      throw new Error(`Lỗi lấy khu vực phụ trách: ${error.message}`);
    }
  }
}

module.exports = HoSoNhanVienModel;