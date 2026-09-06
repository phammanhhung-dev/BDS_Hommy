/**
 * Model cho Tin đăng
 * Quản lý các nghiệp vụ liên quan đến tin đăng cho Chủ dự án
 */

const db = require('../config/db');

/**
 * @typedef {Object} TinDang
 * @property {number} TinDangID
 * @property {number} DuAnID
 * @property {number} KhuVucID
 * @property {string} TieuDe
 * @property {string} MoTa
 * @property {string} TrangThai - Nhap|ChoDuyet|DaDuyet|DaDang|TamNgung|TuChoi|LuuTru
 * @property {string} TaoLuc
 * @property {string} CapNhatLuc
 */

class TinDangModel {
  /**
   * Lấy danh sách tin đăng của chủ dự án
   * @param {number} chuDuAnId ID của chủ dự án
   * @param {Object} filters Bộ lọc tìm kiếm
   * @param {string} [filters.trangThai] Trạng thái tin đăng
   * @param {number} [filters.duAnId] Lọc theo dự án
   * @param {string} [filters.keyword] Từ khóa tìm kiếm
   * @param {number} [filters.limit] Giới hạn số lượng
   * @returns {Promise<TinDang[]>}
   * @throws {Error} Nếu có lỗi xảy ra
   */
  static async layDanhSachTinDang(chuDuAnId, filters = {}) {
    try {
      let query = `
        SELECT
          td.TinDangID, td.DuAnID, td.KhuVucID, td.ChinhSachCocID,
          td.TieuDe, td.URL, td.MoTa, td.TienIch, td.GiaDien, td.GiaNuoc, td.GiaDichVu, td.MoTaGiaDichVu,
          'Thue' AS LoaiGiaoDich, 'CanHo' AS LoaiBDS, 0 AS GiaTien, 0 AS DienTichDat, 0 AS DienTichSuDung,
          1 AS SoTang, 1 AS SoPhongNgu, 1 AS SoPhongTam, '??ng Nam' AS Huong, 'S? h?ng' AS PhapLy, 2024 AS NamXayDung, '??y ??' AS NoiThat,
          (
            SELECT MIN(pt.PhongID) FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID
          ) AS PhongID,
          (
            SELECT GROUP_CONCAT(pt.PhongID) FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID
          ) AS PhongIDs,
          (
            SELECT MIN(COALESCE(pt.GiaTinDang, p.GiaChuan))
            FROM phong_tindang pt
            JOIN phong p ON pt.PhongID = p.PhongID
            WHERE pt.TinDangID = td.TinDangID
          ) as Gia,
          (
            SELECT MIN(COALESCE(pt.DienTichTinDang, p.DienTichChuan))
            FROM phong_tindang pt
            JOIN phong p ON pt.PhongID = p.PhongID
            WHERE pt.TinDangID = td.TinDangID
          ) as DienTich,
          td.TrangThai,
          td.LyDoTuChoi, td.TaoLuc, td.CapNhatLuc, td.DuyetLuc,
          da.TenDuAn, da.DiaChi AS DiaChi, da.YeuCauPheDuyetChu, kv.TenKhuVuc AS TenKhuVuc,
          (SELECT COUNT(*) FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID) as TongSoPhong,
          (SELECT COUNT(*) FROM phong_tindang pt
           JOIN phong p ON pt.PhongID = p.PhongID
           WHERE pt.TinDangID = td.TinDangID AND p.TrangThai = 'Trong') as SoPhongTrong
        FROM tindang td
        LEFT JOIN duan da ON td.DuAnID = da.DuAnID
         LEFT JOIN khuvuc kv ON td.KhuVucID = kv.KhuVucID
         
        WHERE 1=1
      `;
      
      const params = [];
      if (chuDuAnId !== null && chuDuAnId !== undefined) {
        query += ' AND td.ChuDuAnID = ?';
        params.push(chuDuAnId);
      }
      
      // Đối với chủ dự án hoặc người dùng công khai: ẩn tin Lưu trữ mặc định (trừ khi lọc cụ thể)
      // Đối với quản trị viên (chuDuAnId là null/undefined): hiển thị đầy đủ tin đăng theo mặc định
      if (chuDuAnId !== null && chuDuAnId !== undefined && !filters.trangThai) {
        query += " AND td.TrangThai != 'LuuTru'";
      } else if (filters.trangThai) {
        query += ' AND td.TrangThai = ?';
        params.push(filters.trangThai);
      }
      
      if (filters.duAnId) {
        query += ' AND td.DuAnID = ?';
        params.push(filters.duAnId);
      }
      
      if (filters.keyword) {
        query += ' AND (td.TieuDe LIKE ? OR td.MoTa LIKE ?)';
        params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
      }
      
      query += ' ORDER BY td.CapNhatLuc DESC';
      
      // Sử dụng string interpolation an toàn cho LIMIT (tránh lỗi với prepared statement)
      if (filters.limit) {
        const safeLimit = Math.max(1, Math.min(100, parseInt(filters.limit) || 20));
        query += ` LIMIT ${safeLimit}`;
      }
      
      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách tin đăng: ${error.message}`);
    }
  }

  /**
   * Lấy thông tin chi tiết tin đăng
   * @param {number} tinDangId ID của tin đăng
   * @param {number} chuDuAnId ID của chủ dự án (để kiểm tra quyền sở hữu)
   * @returns {Promise<TinDang|null>}
   * @throws {Error} Nếu có lỗi xảy ra
   */
  static async layChiTietTinDang(tinDangId, chuDuAnId) {
    try {
      // Query chi tiết tin đăng
      let query = `
        SELECT
          td.TinDangID, td.DuAnID, td.KhuVucID, td.ChinhSachCocID,
          td.TieuDe, td.URL, td.MoTa, td.TienIch, td.GiaDien, td.GiaNuoc, td.GiaDichVu, td.MoTaGiaDichVu,
          'Thue' AS LoaiGiaoDich, 'CanHo' AS LoaiBDS, 0 AS GiaTien, 0 AS DienTichDat, 0 AS DienTichSuDung,
          1 AS SoTang, 1 AS SoPhongNgu, 1 AS SoPhongTam, '??ng Nam' AS Huong, 'S? h?ng' AS PhapLy, 2024 AS NamXayDung, '??y ??' AS NoiThat,
          (
            SELECT MIN(COALESCE(pt.GiaTinDang, p.GiaChuan))
            FROM phong_tindang pt
            JOIN phong p ON pt.PhongID = p.PhongID
            WHERE pt.TinDangID = td.TinDangID
          ) as Gia,
          (
            SELECT MIN(COALESCE(pt.DienTichTinDang, p.DienTichChuan))
            FROM phong_tindang pt
            JOIN phong p ON pt.PhongID = p.PhongID
            WHERE pt.TinDangID = td.TinDangID
          ) as DienTich,
          td.TrangThai, td.LyDoTuChoi, td.TaoLuc, td.CapNhatLuc, td.DuyetLuc,
          da.DuAnID as DuAnID, da.ChuDuAnID as ChuDuAnID, da.TenDuAn, da.DiaChi as DiaChiDuAn, da.ViDo, da.KinhDo,
          da.YeuCauPheDuyetChu,
             kv.TenKhuVuc as TenKhuVuc, NULL as TenTinh, csc.TenChinhSach, csc.MoTa as MoTaChinhSach,
          nd.TenDayDu as TenChuDuAn, nd.Email as EmailChuDuAn,
          (SELECT COUNT(*) FROM phong_tindang pt WHERE pt.TinDangID = td.TinDangID) as TongSoPhong,
          (SELECT COUNT(*) FROM phong_tindang pt
           JOIN phong p ON pt.PhongID = p.PhongID
           WHERE pt.TinDangID = td.TinDangID AND p.TrangThai = 'Trong') as SoPhongTrong
        FROM tindang td
        LEFT JOIN duan da ON td.DuAnID = da.DuAnID
           LEFT JOIN new_communes kv ON td.KhuVucID = kv.CommuneID
           LEFT JOIN new_provinces np ON kv.ProvinceID = np.ProvinceID
        LEFT JOIN chinhsachcoc csc ON td.ChinhSachCocID = csc.ChinhSachCocID
        LEFT JOIN nguoidung nd ON td.ChuDuAnID = nd.NguoiDungID
        WHERE td.TinDangID = ?
      `;
      
      const params = [tinDangId];
      
      // Nếu có chuDuAnId, kiểm tra ownership
      if (chuDuAnId) {
        query += ' AND td.ChuDuAnID = ?';
        params.push(chuDuAnId);
      }
      
      const [rows] = await db.execute(query, params);
      const tinDang = rows[0] || null;

      if (!tinDang) {
        return null;
      }

      // Lấy danh sách phòng từ bảng phong_tindang
      const [phongRows] = await db.execute(`
        SELECT 
          p.PhongID, p.TenPhong, p.TrangThai,
          COALESCE(pt.GiaTinDang, p.GiaChuan) as Gia,
          COALESCE(pt.DienTichTinDang, p.DienTichChuan) as DienTich,
          COALESCE(pt.HinhAnhTinDang, p.HinhAnhPhong) as URL,
          COALESCE(pt.MoTaTinDang, p.MoTaPhong) as MoTa,
          p.GiaChuan, p.DienTichChuan,
          pt.GiaTinDang as GiaOverride,
          pt.DienTichTinDang as DienTichOverride,
          pt.ThuTuHienThi,
          p.TaoLuc, p.CapNhatLuc
        FROM phong_tindang pt
        JOIN phong p ON pt.PhongID = p.PhongID
        WHERE pt.TinDangID = ?
        ORDER BY pt.ThuTuHienThi, p.TenPhong ASC
      `, [tinDangId]);

      tinDang.DanhSachPhong = phongRows;

      return tinDang;
    } catch (error) {
      throw new Error(`Lỗi khi lấy chi tiết tin đăng: ${error.message}`);
    }
  }

  /**
   * Tạo tin đăng mới
   * @param {number} chuDuAnId ID của chủ dự án
   * @param {Object} tinDangData Dữ liệu tin đăng
   * @param {number} tinDangData.DuAnID ID dự án
   * @param {number} tinDangData.KhuVucID ID khu vực
   * @param {number} [tinDangData.ChinhSachCocID] ID chính sách cọc
   * @param {string} tinDangData.TieuDe Tiêu đề
   * @param {string} tinDangData.MoTa Mô tả
   * @param {Array} [tinDangData.URL] Danh sách URL ảnh
   * @param {Array} [tinDangData.TienIch] Danh sách tiện ích
   * @param {Array} [tinDangData.PhongIDs] Danh sách phòng
   * @returns {Promise<number>} ID của tin đăng vừa tạo
   * @throws {Error} Nếu có lỗi xảy ra
   */
  static async taoTinDang(chuDuAnId, tinDangData) {
    try {
      // Kiểm tra tính hợp lệ của dự án (nếu có chọn DuAnID)
      if (tinDangData.DuAnID) {
        const [duAnRows] = await db.execute(
          'SELECT DuAnID FROM duan WHERE DuAnID = ? AND TrangThai = "HoatDong"',
          [tinDangData.DuAnID]
        );

        if (duAnRows.length === 0) {
          throw new Error('Dự án được chọn không tồn tại hoặc đã ngừng hoạt động');
        }
      }

      // Coerce TienIch về mảng nếu là string (defensive programming)
      const tienIchArray = Array.isArray(tinDangData.TienIch)
        ? tinDangData.TienIch
        : (typeof tinDangData.TienIch === 'string' && tinDangData.TienIch.trim() !== ''
            ? tinDangData.TienIch.split(',').map(s => s.trim()).filter(Boolean)
            : []);

      const TinDangDataService = require('../services/TinDangDataService');
      const ngayHetHanCalc = TinDangDataService.tinhNgayHetHan(new Date(), tinDangData.SoNgayGoi || 30);

      const query = `
        INSERT INTO tindang (
          DuAnID, ChuDuAnID, KhuVucID, ChinhSachCocID, TieuDe, URL, MoTa,
          TienIch, GiaDien, GiaNuoc, GiaDichVu, MoTaGiaDichVu,
          TrangThai,
          LoaiGiaoDich, LoaiBDS, GiaTien, DienTichDat, DienTichSuDung,
          SoTang, SoPhongNgu, SoPhongTam, Huong, PhapLy, NamXayDung, NoiThat,
          NgayHetHan
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        tinDangData.DuAnID !== undefined ? tinDangData.DuAnID : null,
        chuDuAnId, // Luôn lưu ChuDuAnID từ token đăng nhập
        tinDangData.KhuVucID !== undefined ? tinDangData.KhuVucID : null,
        tinDangData.ChinhSachCocID !== undefined ? tinDangData.ChinhSachCocID : 1,
        tinDangData.TieuDe,
        JSON.stringify(tinDangData.URL || []),
        tinDangData.MoTa,
        // Các trường mới
        JSON.stringify(tienIchArray),
        tinDangData.GiaDien !== undefined ? tinDangData.GiaDien : null,
        tinDangData.GiaNuoc !== undefined ? tinDangData.GiaNuoc : null,
        tinDangData.GiaDichVu !== undefined ? tinDangData.GiaDichVu : null,
        tinDangData.MoTaGiaDichVu !== undefined ? tinDangData.MoTaGiaDichVu : null,
        tinDangData.TrangThai || 'Nhap',
        // Các field mua bán
        tinDangData.LoaiGiaoDich || 'Thue',
        tinDangData.LoaiBDS !== undefined ? tinDangData.LoaiBDS : null,
        tinDangData.GiaTien !== undefined ? tinDangData.GiaTien : null,
        tinDangData.DienTichDat !== undefined ? tinDangData.DienTichDat : null,
        tinDangData.DienTichSuDung !== undefined ? tinDangData.DienTichSuDung : null,
        tinDangData.SoTang !== undefined ? tinDangData.SoTang : null,
        tinDangData.SoPhongNgu !== undefined ? tinDangData.SoPhongNgu : null,
        tinDangData.SoPhongTam !== undefined ? tinDangData.SoPhongTam : null,
        tinDangData.Huong !== undefined ? tinDangData.Huong : null,
        tinDangData.PhapLy !== undefined ? tinDangData.PhapLy : null,
        tinDangData.NamXayDung !== undefined ? tinDangData.NamXayDung : null,
        tinDangData.NoiThat !== undefined ? tinDangData.NoiThat : null,
        tinDangData.NgayHetHan || ngayHetHanCalc
      ];

      const [result] = await db.execute(query, values);

      const tinDangID = result.insertId;
      
      // Nếu có PhongIDs, thêm mapping vào phong_tindang
      if (tinDangData.PhongIDs && tinDangData.PhongIDs.length > 0) {
        const PhongModel = require('./PhongModel');
        
        // Chuẩn bị danh sách phòng để thêm vào tin đăng
        const danhSachPhong = tinDangData.PhongIDs.map(item => ({
          PhongID: item.PhongID || item,
          GiaTinDang: item.GiaTinDang || null,
          DienTichTinDang: item.DienTichTinDang || null,
          MoTaTinDang: item.MoTaTinDang || null,
          HinhAnhTinDang: item.HinhAnhTinDang || null,
          ThuTuHienThi: item.ThuTuHienThi || 0
        }));
        
        await PhongModel.themPhongVaoTinDang(tinDangID, chuDuAnId, danhSachPhong);
      }

      return tinDangID;
    } catch (error) {
      throw new Error(`Lỗi khi tạo tin đăng: ${error.message}`);
    }
  }

  /**
   * Cập nhật tin đăng
   * @param {number} tinDangId ID của tin đăng
   * @param {number} chuDuAnId ID của chủ dự án
   * @param {Object} updateData Dữ liệu cập nhật
   * @param {string} [updateData.action] Hành động (send_review để không reset status)
   * @returns {Promise<boolean>}
   * @throws {Error} Nếu có lỗi xảy ra
   */
  static async capNhatTinDang(tinDangId, chuDuAnId, updateData) {
    try {
      // Kiểm tra quyền sở hữu
      const tinDang = await this.layChiTietTinDang(tinDangId, chuDuAnId);
      if (!tinDang) {
        throw new Error('Không tìm thấy tin đăng hoặc không có quyền chỉnh sửa');
      }

      // Chỉ KHÔNG cho phép cập nhật khi ở trạng thái LuuTru (đã xóa/lưu trữ)
      if (chuDuAnId !== null && tinDang.TrangThai === 'LuuTru') {
        throw new Error('Không thể chỉnh sửa tin đăng đã bị xóa (Lưu trữ)');
      }

      const allowedFields = ['TieuDe', 'MoTa', 'URL', 'KhuVucID', 'ChinhSachCocID', 'TienIch', 'GiaDien', 'GiaNuoc', 'GiaDichVu', 'MoTaGiaDichVu', 'LoaiGiaoDich', 'LoaiBDS', 'GiaTien', 'DienTichDat', 'DienTichSuDung', 'SoTang', 'SoPhongNgu', 'SoPhongTam', 'Huong', 'PhapLy', 'NamXayDung', 'NoiThat', 'TrangThai', 'LyDoTuChoi'];
      const updates = [];
      const values = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = ?`);
          // Serialize JSON cho URL và TienIch
          if (key === 'URL' || key === 'TienIch') {
            // Coerce TienIch về mảng nếu là string (defensive programming)
            const coercedValue = key === 'TienIch'
              ? (Array.isArray(value)
                  ? value
                  : (typeof value === 'string' && value.trim() !== ''
                      ? value.split(',').map(s => s.trim()).filter(Boolean)
                      : []))
              : value;
            values.push(JSON.stringify(coercedValue));
          } else {
            values.push(value);
          }
        }
      }

      const shouldResetStatus = chuDuAnId !== null && updateData.action !== 'send_review' && !updateData.TrangThai && !updateData.trangThai;
      if (updates.length > 0) {
        values.push(tinDangId);
        const trangThaiClause = shouldResetStatus ? `, TrangThai = 'Nhap'` : '';
        const query = `UPDATE tindang SET ${updates.join(', ')}` + trangThaiClause + ' WHERE TinDangID = ?';
        await db.execute(query, values);
      } else if (shouldResetStatus) {
        await db.execute(
          'UPDATE tindang SET TrangThai = \'Nhap\' WHERE TinDangID = ?',
          [tinDangId]
        );
      }

      if (Array.isArray(updateData.PhongIDs)) {
        const PhongModel = require('./PhongModel');
        const phongIds = updateData.PhongIDs
          .map(item => {
            const rawId = typeof item === 'object' ? item.PhongID : item;
            return rawId ? parseInt(rawId, 10) : null;
          })
          .filter(id => !!id);

        if (phongIds.length === 0) {
          throw new Error('Tin đăng phải có ít nhất một phòng được gắn vào');
        }

        const placeholders = phongIds.map(() => '?').join(', ');
        await db.execute(
          `DELETE FROM phong_tindang WHERE TinDangID = ? AND PhongID NOT IN (${placeholders})`,
          [tinDangId, ...phongIds]
        );

        const danhSachPhong = updateData.PhongIDs.map(item => ({
          PhongID: item.PhongID || item,
          GiaTinDang: item.GiaTinDang || null,
          DienTichTinDang: item.DienTichTinDang || null,
          MoTaTinDang: item.MoTaTinDang || null,
          HinhAnhTinDang: item.HinhAnhTinDang || null,
          ThuTuHienThi: item.ThuTuHienThi || 0
        }));

        await PhongModel.themPhongVaoTinDang(tinDangId, chuDuAnId, danhSachPhong);
      }

      return true;
    } catch (error) {
      throw new Error(`Lỗi khi cập nhật tin đăng: ${error.message}`);
    }
  }

  /**
   * Gửi tin đăng để duyệt
   * @param {number} tinDangId ID của tin đăng
   * @param {number} chuDuAnId ID của chủ dự án
   * @param {Object} [updateData] Dữ liệu cần cập nhật trước khi gửi duyệt
   * @returns {Promise<boolean>}
   * @throws {Error} Nếu có lỗi xảy ra
   */
  static async guiTinDangDeDuyet(tinDangId, chuDuAnId, updateData = {}) {
    try {
      const tinDang = await this.layChiTietTinDang(tinDangId, chuDuAnId);
      if (!tinDang) {
        throw new Error('Không tìm thấy tin đăng');
      }

      // Chỉ KHÔNG cho phép gửi duyệt khi ở trạng thái LuuTru (đã xóa)
      if (tinDang.TrangThai === 'LuuTru') {
        throw new Error('Không thể gửi duyệt tin đăng đã bị xóa (Lưu trữ)');
      }

      // Kiểm tra đầy đủ thông tin
      if (!tinDang.TieuDe || !tinDang.MoTa) {
        throw new Error('Vui lòng điền đầy đủ Tiêu đề và Mô tả');
      }

      // Tin thuê bắt buộc phải gắn với ít nhất một phòng
      // Tin bán không cần phòng
      if (tinDang.LoaiGiaoDich === 'Thue') {
        const [phongRows] = await db.execute(
          'SELECT COUNT(*) as SoPhong FROM phong_tindang WHERE TinDangID = ?',
          [tinDangId]
        );

        if ((phongRows[0]?.SoPhong || 0) === 0 && (!updateData.PhongIDs || updateData.PhongIDs.length === 0)) {
          throw new Error('Vui lòng thêm ít nhất 1 phòng vào tin đăng');
        }
      }

      // Tin bán bắt buộc phải có giá
      if (tinDang.LoaiGiaoDich === 'Ban' && !tinDang.GiaTien) {
        throw new Error('Vui lòng nhập giá bán');
      }

      await db.execute(
        'UPDATE tindang SET TrangThai = "ChoDuyet" WHERE TinDangID = ?',
        [tinDangId]
      );
      
      return true;
    } catch (error) {
      throw new Error(`Lỗi khi gửi tin đăng để duyệt: ${error.message}`);
    }
  }

  /**
   * Xóa tin đăng (chuyển sang trạng thái LuuTru)
   * @param {number} tinDangId ID của tin đăng
   * @param {number} chuDuAnId ID của chủ dự án
   * @param {string} [lyDoXoa] Lý do xóa (bắt buộc nếu tin đã duyệt/đang đăng)
   * @returns {Promise<boolean>}
   * @throws {Error} Nếu có lỗi xảy ra
   */
  static async xoaTinDang(tinDangId, chuDuAnId, lyDoXoa = null) {
    try {
      // Kiểm tra quyền sở hữu
      const tinDang = await this.layChiTietTinDang(tinDangId, chuDuAnId);
      if (!tinDang) {
        throw new Error('Không tìm thấy tin đăng hoặc không có quyền xóa');
      }

      // Nếu tin đã duyệt hoặc đang đăng → BẮT BUỘC phải có lý do xóa
      if (['DaDuyet', 'DaDang'].includes(tinDang.TrangThai)) {
        if (!lyDoXoa || lyDoXoa.trim().length < 10) {
          throw new Error('Vui lòng nhập lý do xóa (tối thiểu 10 ký tự) vì tin đăng đã được duyệt/đang đăng');
        }
      }

      // Chuyển sang trạng thái LuuTru (soft delete) và lưu lý do
      await db.execute(
        'UPDATE tindang SET TrangThai = "LuuTru", LyDoTuChoi = ? WHERE TinDangID = ?',
        [lyDoXoa || 'Chủ dự án tự xóa', tinDangId]
      );
      
      return true;
    } catch (error) {
      throw new Error(`Lỗi khi xóa tin đăng: ${error.message}`);
    }
  }

  /**
   * Lấy metadata tin đăng phục vụ sinh hợp đồng (public)
   * @param {number} tinDangId
   * @returns {Promise<Object|null>}
   */
  static async layThongTinChoHopDong(tinDangId) {
    if (!tinDangId || Number.isNaN(Number(tinDangId))) {
      throw new Error('TinDangID không hợp lệ');
    }

    try {
      const [rows] = await db.execute(
        `
          SELECT 
            td.TinDangID,
            td.TieuDe,
            td.GiaDien,
            td.GiaNuoc,
            td.GiaDichVu,
            td.MoTaGiaDichVu,
            td.TrangThai,
            td.ChinhSachCocID,
            da.TenDuAn,
            da.DiaChi AS DiaChiDuAn,
            da.ChuDuAnID,
            nd.TenDayDu AS TenChuDuAn,
            nd.SoDienThoai AS SoDienThoaiChuDuAn,
            nd.DiaChi AS DiaChiChuDuAn,
            nd.NgaySinh AS NgaySinhChuDuAn,
            nd.SoCCCD AS SoCCCDChuDuAn,
            nd.NgayCapCCCD AS NgayCapChuDuAn,
            csc.TenChinhSach,
            csc.SoTienCocAnNinhMacDinh,
            csc.QuyTacGiaiToa,
            (
              SELECT MIN(COALESCE(pt.GiaTinDang, p.GiaChuan))
              FROM phong_tindang pt
              JOIN phong p ON pt.PhongID = p.PhongID
              WHERE pt.TinDangID = td.TinDangID
            ) AS GiaThueThamChieu,
            (
              SELECT MIN(COALESCE(pt.DienTichTinDang, p.DienTichChuan))
              FROM phong_tindang pt
              JOIN phong p ON pt.PhongID = p.PhongID
              WHERE pt.TinDangID = td.TinDangID
            ) AS DienTichThamChieu
          FROM tindang td
          LEFT JOIN duan da ON td.DuAnID = da.DuAnID
          LEFT JOIN nguoidung nd ON td.ChuDuAnID = nd.NguoiDungID
          LEFT JOIN chinhsachcoc csc ON td.ChinhSachCocID = csc.ChinhSachCocID
          WHERE td.TinDangID = ? AND td.TrangThai != 'LuuTru'
        `,
        [tinDangId]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`Lỗi khi lấy dữ liệu hợp đồng cho tin đăng: ${error.message}`);
    }
  }
}

module.exports = TinDangModel;
