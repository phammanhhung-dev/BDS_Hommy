/**
 * Model cho Dự án
 * Quản lý các nghiệp vụ liên quan đến dự án
 * Tách từ ChuDuAnModel.js theo domain-driven design
 */

const db = require('../config/db');
const KhuVuc = require('./khuVucModel');

const parseJsonField = (value, fallback = null) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const stringifyJsonField = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value);
};

class DuAnModel {
  /**
   * Lấy danh sách dự án của chủ dự án
   * @param {number} chuDuAnId ID của chủ dự án
   * @returns {Promise<Array>}
   */
  static async layDanhSachDuAn(chuDuAnId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          da.DuAnID,
          da.TenDuAn,
          da.DiaChi,
          da.TrangThai,
          da.YeuCauPheDuyetChu,
          da.PhuongThucVao,
          da.ViDo,
          da.KinhDo,
          da.ChinhSachCocID,
          da.TaoLuc,
          da.CapNhatLuc,
          da.LyDoNgungHoatDong,
          da.NguoiNgungHoatDongID,
          da.NgungHoatDongLuc,
          da.YeuCauMoLai,
          da.NoiDungGiaiTrinh,
          da.ThoiGianGuiYeuCau,
          da.NguoiXuLyYeuCauID,
          da.ThoiGianXuLyYeuCau,
          da.LyDoTuChoiMoLai,
          da.BangHoaHong,
          da.ThongTinMoRong,
          nd_banned.TenDayDu AS NguoiNgungHoatDong_TenDayDu,
          nd_xulyban.TenDayDu AS NguoiXuLyYeuCau_TenDayDu,
          (SELECT COUNT(*) FROM tindang td WHERE td.DuAnID = da.DuAnID AND td.TrangThai != 'LuuTru') as SoTinDang,
          (SELECT COUNT(*) FROM tindang td WHERE td.DuAnID = da.DuAnID AND td.TrangThai IN ('DaDang','DaDuyet','ChoDuyet')) as TinDangHoatDong,
          (SELECT COUNT(*) FROM tindang td WHERE td.DuAnID = da.DuAnID AND td.TrangThai = 'Nhap') as TinDangNhap,
          (SELECT COUNT(*) FROM phong p WHERE p.DuAnID = da.DuAnID) as TongPhong,
          (SELECT COUNT(*) FROM phong p WHERE p.DuAnID = da.DuAnID AND p.TrangThai = 'Trong') as PhongTrong,
          (SELECT COUNT(*) FROM phong p WHERE p.DuAnID = da.DuAnID AND p.TrangThai = 'GiuCho') as PhongGiuCho,
          (SELECT COUNT(*) FROM phong p WHERE p.DuAnID = da.DuAnID AND p.TrangThai = 'DaThue') as PhongDaThue,
          (SELECT COUNT(*) FROM phong p WHERE p.DuAnID = da.DuAnID AND p.TrangThai = 'DonDep') as PhongDonDep
        FROM duan da
        LEFT JOIN nguoidung nd_banned ON da.NguoiNgungHoatDongID = nd_banned.NguoiDungID
        LEFT JOIN nguoidung nd_xulyban ON da.NguoiXuLyYeuCauID = nd_xulyban.NguoiDungID
        WHERE da.ChuDuAnID = ?
        ORDER BY da.TrangThai DESC, da.CapNhatLuc DESC
      `, [chuDuAnId]);

      if (!rows.length) {
        return [];
      }

      const duAnIds = rows.map((row) => row.DuAnID);
      const placeholders = duAnIds.map(() => '?').join(', ');

      let depositRows = [];
      let policyRows = [];

      if (placeholders.length > 0) {
        [depositRows] = await db.execute(`
          SELECT 
            p.DuAnID,
            SUM(CASE WHEN c.TrangThai = 'HieuLuc' THEN c.SoTien ELSE 0 END) as TongTienCocDangHieuLuc,
            SUM(CASE WHEN c.TrangThai = 'HieuLuc' THEN 1 ELSE 0 END) as CocDangHieuLuc,
            SUM(CASE WHEN c.TrangThai = 'HieuLuc' AND c.Loai = 'CocGiuCho' THEN 1 ELSE 0 END) as CocDangHieuLucGiuCho,
            SUM(CASE WHEN c.TrangThai = 'HieuLuc' AND c.Loai = 'CocAnNinh' THEN 1 ELSE 0 END) as CocDangHieuLucAnNinh,
            SUM(CASE WHEN c.TrangThai = 'HetHan' THEN 1 ELSE 0 END) as CocHetHan,
            SUM(CASE WHEN c.TrangThai = 'DaGiaiToa' THEN 1 ELSE 0 END) as CocDaGiaiToa,
            SUM(CASE WHEN c.TrangThai = 'DaDoiTru' THEN 1 ELSE 0 END) as CocDaDoiTru
          FROM coc c
          INNER JOIN phong p ON c.PhongID = p.PhongID
          WHERE p.DuAnID IN (${placeholders})
          GROUP BY p.DuAnID
        `, duAnIds);

        [policyRows] = await db.execute(`
          SELECT 
            td.DuAnID,
            td.ChinhSachCocID,
            csc.TenChinhSach,
            csc.MoTa,
            csc.ChoPhepCocGiuCho,
            csc.TTL_CocGiuCho_Gio,
            csc.TyLePhat_CocGiuCho,
            csc.ChoPhepCocAnNinh,
            csc.QuyTacGiaiToa,
            csc.HieuLuc,
            csc.CapNhatLuc,
            COUNT(*) as SoTinDangApDung
          FROM tindang td
          LEFT JOIN chinhsachcoc csc ON td.ChinhSachCocID = csc.ChinhSachCocID
          WHERE td.DuAnID IN (${placeholders}) AND td.TrangThai != 'LuuTru'
          GROUP BY 
            td.DuAnID,
            td.ChinhSachCocID,
            csc.TenChinhSach,
            csc.MoTa,
            csc.ChoPhepCocGiuCho,
            csc.TTL_CocGiuCho_Gio,
            csc.TyLePhat_CocGiuCho,
            csc.ChoPhepCocAnNinh,
            csc.QuyTacGiaiToa,
            csc.HieuLuc,
            csc.CapNhatLuc
        `, duAnIds);
      }

      const depositMap = new Map();
      depositRows.forEach((row) => {
        depositMap.set(row.DuAnID, {
          CocDangHieuLuc: Number(row.CocDangHieuLuc) || 0,
          TongTienCocDangHieuLuc: Number(row.TongTienCocDangHieuLuc) || 0,
          CocDangHieuLucGiuCho: Number(row.CocDangHieuLucGiuCho) || 0,
          CocDangHieuLucAnNinh: Number(row.CocDangHieuLucAnNinh) || 0,
          CocHetHan: Number(row.CocHetHan) || 0,
          CocDaGiaiToa: Number(row.CocDaGiaiToa) || 0,
          CocDaDoiTru: Number(row.CocDaDoiTru) || 0
        });
      });

      const policyMap = new Map();
      policyRows.forEach((row) => {
        const list = policyMap.get(row.DuAnID) || [];
        list.push({
          ChinhSachCocID: row.ChinhSachCocID !== null ? Number(row.ChinhSachCocID) : null,
          TenChinhSach: row.TenChinhSach || null,
          MoTa: row.MoTa || null,
          ChoPhepCocGiuCho: row.ChoPhepCocGiuCho === null ? null : Number(row.ChoPhepCocGiuCho) === 1,
          TTL_CocGiuCho_Gio: row.TTL_CocGiuCho_Gio !== null ? Number(row.TTL_CocGiuCho_Gio) : null,
          TyLePhat_CocGiuCho: row.TyLePhat_CocGiuCho !== null ? Number(row.TyLePhat_CocGiuCho) : null,
          ChoPhepCocAnNinh: row.ChoPhepCocAnNinh === null ? null : Number(row.ChoPhepCocAnNinh) === 1,
          QuyTacGiaiToa: row.QuyTacGiaiToa || null,
          HieuLuc: row.HieuLuc === null ? null : Number(row.HieuLuc) === 1,
          CapNhatLuc: row.CapNhatLuc || null,
          SoTinDangApDung: Number(row.SoTinDangApDung) || 0
        });
        policyMap.set(row.DuAnID, list);
      });

      return rows.map((row) => {
        const duAnId = row.DuAnID;
        const cocStats = depositMap.get(duAnId) || {
          CocDangHieuLuc: 0,
          TongTienCocDangHieuLuc: 0,
          CocDangHieuLucGiuCho: 0,
          CocDangHieuLucAnNinh: 0,
          CocHetHan: 0,
          CocDaGiaiToa: 0,
          CocDaDoiTru: 0
        };

        return {
          ...row,
          ViDo: row.ViDo !== null ? Number(row.ViDo) : null,
          KinhDo: row.KinhDo !== null ? Number(row.KinhDo) : null,
          BangHoaHong: parseJsonField(row.BangHoaHong, null),
          ThongTinMoRong: parseJsonField(row.ThongTinMoRong, null),
          SoTinDang: Number(row.SoTinDang) || 0,
          TinDangHoatDong: Number(row.TinDangHoatDong) || 0,
          TinDangNhap: Number(row.TinDangNhap) || 0,
          TongPhong: Number(row.TongPhong) || 0,
          PhongTrong: Number(row.PhongTrong) || 0,
          PhongGiuCho: Number(row.PhongGiuCho) || 0,
          PhongDaThue: Number(row.PhongDaThue) || 0,
          PhongDonDep: Number(row.PhongDonDep) || 0,
          CocStats: cocStats,
          ChinhSachCoc: policyMap.get(duAnId) || []
        };
      });
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách dự án: ${error.message}`);
    }
  }

  /**
   * Lấy thống kê phòng theo trạng thái cho toàn bộ dự án thuộc chủ dự án
   * @param {number} chuDuAnId
   * @returns {Promise<Object>}
   */
  static async layThongKePhong(chuDuAnId) {
    try {
      const [rows] = await db.execute(`
        SELECT
          COUNT(p.PhongID) as TongPhong,
          COUNT(CASE WHEN p.TrangThai = 'Trong' THEN 1 END) as PhongTrong,
          COUNT(CASE WHEN p.TrangThai = 'DaThue' THEN 1 END) as PhongDaThue,
          COUNT(CASE WHEN p.TrangThai = 'GiuCho' THEN 1 END) as PhongGiuCho,
          COUNT(CASE WHEN p.TrangThai = 'DonDep' THEN 1 END) as PhongDonDep
        FROM phong p
        INNER JOIN duan da ON p.DuAnID = da.DuAnID
        WHERE da.ChuDuAnID = ?
      `, [chuDuAnId]);

      const result = rows[0] || {};
      return {
        TongPhong: result.TongPhong || 0,
        PhongTrong: result.PhongTrong || 0,
        PhongDaThue: result.PhongDaThue || 0,
        PhongGiuCho: result.PhongGiuCho || 0,
        PhongDonDep: result.PhongDonDep || 0
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy thống kê phòng: ${error.message}`);
    }
  }

  /**
   * Lấy danh sách khu vực
   * @param {number|null} parentId ID khu vực cha
   * @returns {Promise<Array>}
   */
  static async layDanhSachKhuVuc(parentId = null) {
    try {
      const [rows] = await KhuVuc.getChildren(parentId);
      return rows;
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách khu vực: ${error.message}`);
    }
  }

  /**
   * Lấy chi tiết dự án
   * @param {number} duAnId ID dự án
   * @param {number} chuDuAnId ID chủ dự án
   * @returns {Promise<Object|null>}
   */
  static async layChiTietDuAn(duAnId, chuDuAnId) {
    try {
      const query = `
        SELECT 
          d.DuAnID,
          d.TenDuAn,
          d.DiaChi,
          d.ChuDuAnID,
          d.YeuCauPheDuyetChu,
          d.TrangThai,
          d.TaoLuc,
          d.CapNhatLuc,
          d.ViDo,
          d.KinhDo,
          d.PhuongThucVao,
          d.SoThangCocToiThieu,
          d.BangHoaHong,
          d.ThongTinMoRong
        FROM duan d
        WHERE d.DuAnID = ? AND d.ChuDuAnID = ?
      `;
      const [rows] = await db.execute(query, [duAnId, chuDuAnId]);
      const duAn = rows[0] || null;
      if (!duAn) {
        return null;
      }

      duAn.BangHoaHong = parseJsonField(duAn.BangHoaHong, null);
      duAn.ThongTinMoRong = parseJsonField(duAn.ThongTinMoRong, null);
      return duAn;
    } catch (error) {
      throw new Error(`Lỗi lấy chi tiết dự án: ${error.message}`);
    }
  }

  /**
   * Tạo dự án mới
   * @param {number} chuDuAnId ID chủ dự án
   * @param {Object} data Dữ liệu dự án
   * @returns {Promise<number>} ID dự án vừa tạo
   */
  static async taoDuAn(chuDuAnId, data) {
    try {
      // Kiểm tra trùng địa chỉ
      const [existingProjects] = await db.execute(
        `SELECT DuAnID, TenDuAn FROM duan 
         WHERE ChuDuAnID = ? AND DiaChi = ? AND TrangThai != 'LuuTru'`,
        [chuDuAnId, data.DiaChi]
      );

      if (existingProjects.length > 0) {
        throw new Error(`Địa chỉ này đã được sử dụng cho dự án "${existingProjects[0].TenDuAn}". Vui lòng sử dụng địa chỉ khác.`);
      }

      const [result] = await db.execute(
        `INSERT INTO duan (TenDuAn, DiaChi, ViDo, KinhDo, ChuDuAnID, YeuCauPheDuyetChu, PhuongThucVao, BangHoaHong, SoThangCocToiThieu, ThongTinMoRong, TrangThai, TaoLuc, CapNhatLuc)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          data.TenDuAn, 
          data.DiaChi || '', 
          data.ViDo || null,
          data.KinhDo || null,
          chuDuAnId,
          data.YeuCauPheDuyetChu || 0,
          data.PhuongThucVao || null,
          stringifyJsonField(data.BangHoaHong),
          data.SoThangCocToiThieu || null,
          stringifyJsonField(data.ThongTinMoRong),
          data.TrangThai || 'HoatDong'
        ]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Lỗi tạo dự án: ${error.message}`);
    }
  }

  /**
   * Tạo dự án nhanh (ít fields)
   * @param {Object} data Dữ liệu dự án
   * @returns {Promise<number>} ID dự án vừa tạo
   */
  static async taoDuAnNhanh(data) {
    try {
      // Kiểm tra trùng địa chỉ
      const [existingProjects] = await db.execute(
        `SELECT DuAnID, TenDuAn FROM duan 
         WHERE ChuDuAnID = ? AND DiaChi = ? AND TrangThai != 'LuuTru'`,
        [data.ChuDuAnID, data.DiaChi]
      );

      if (existingProjects.length > 0) {
        throw new Error(`Địa chỉ này đã được sử dụng cho dự án "${existingProjects[0].TenDuAn}". Vui lòng sử dụng địa chỉ khác.`);
      }

      const [result] = await db.execute(
        `INSERT INTO duan (
          TenDuAn, DiaChi, ViDo, KinhDo, ChuDuAnID, YeuCauPheDuyetChu, PhuongThucVao,
          BangHoaHong, SoThangCocToiThieu, ThongTinMoRong, TrangThai, TaoLuc, CapNhatLuc
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'HoatDong', NOW(), NOW())`,
        [
          data.TenDuAn,
          data.DiaChi || '',
          data.ViDo || null,
          data.KinhDo || null,
          data.ChuDuAnID,
          data.YeuCauPheDuyetChu || 0,
          data.PhuongThucVao || null,
          stringifyJsonField(data.BangHoaHong),
          data.SoThangCocToiThieu || null,
          stringifyJsonField(data.ThongTinMoRong)
        ]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Lỗi tạo dự án: ${error.message}`);
    }
  }

  /**
   * Đếm tin đăng hoạt động của dự án
   * @param {number} duAnId ID dự án
   * @returns {Promise<number>} Số lượng tin đăng hoạt động
   */
  static async demTinDangHoatDong(duAnId) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as Tong
       FROM tindang
       WHERE DuAnID = ?
         AND TrangThai IN ('ChoDuyet','DaDuyet','DaDang','TamNgung')`,
      [duAnId]
    );
    return rows[0]?.Tong || 0;
  }

  /**
   * Cập nhật dự án
   * @param {number} duAnId ID dự án
   * @param {number} chuDuAnId ID chủ dự án
   * @param {Object} data Dữ liệu cập nhật
   * @returns {Promise<Object|null>} Dự án sau khi cập nhật
   */
  static async capNhatDuAn(duAnId, chuDuAnId, data = {}) {
    try {
      console.log('[DuAnModel.capNhatDuAn] START - DuAnID:', duAnId, 'Data keys:', Object.keys(data));
      
      const [rows] = await db.execute(
        `SELECT DuAnID, TenDuAn, DiaChi, YeuCauPheDuyetChu, PhuongThucVao
         FROM duan
         WHERE DuAnID = ? AND ChuDuAnID = ?`,
        [duAnId, chuDuAnId]
      );

      if (rows.length === 0) {
        return null;
      }

      const updates = [];
      const params = [];
      const allowedStatuses = new Set(['HoatDong', 'NgungHoatDong', 'LuuTru']);

      if (Object.prototype.hasOwnProperty.call(data, 'TenDuAn')) {
        const ten = (data.TenDuAn || '').trim();
        if (!ten) {
          throw new Error('Tên dự án không được để trống');
        }
        updates.push('TenDuAn = ?');
        params.push(ten);
      }

      if (Object.prototype.hasOwnProperty.call(data, 'DiaChi')) {
        const diaChi = (data.DiaChi || '').trim();

        if (diaChi) {
          const [dupRows] = await db.execute(
            `SELECT DuAnID FROM duan
             WHERE ChuDuAnID = ? AND DiaChi = ? AND DuAnID != ? AND TrangThai != 'LuuTru'`,
            [chuDuAnId, diaChi, duAnId]
          );

          if (dupRows.length > 0) {
            throw new Error('Địa chỉ này đã được sử dụng cho một dự án khác');
          }
        }

        updates.push('DiaChi = ?');
        params.push(diaChi);
      }

      if (Object.prototype.hasOwnProperty.call(data, 'ViDo')) {
        let value = null;
        if (data.ViDo !== null && data.ViDo !== undefined && data.ViDo !== '') {
          const parsed = Number(data.ViDo);
          if (Number.isNaN(parsed)) {
            throw new Error('Vĩ độ không hợp lệ');
          }
          value = parsed;
        }
        updates.push('ViDo = ?');
        params.push(value);
      }

      if (Object.prototype.hasOwnProperty.call(data, 'KinhDo')) {
        let value = null;
        if (data.KinhDo !== null && data.KinhDo !== undefined && data.KinhDo !== '') {
          const parsed = Number(data.KinhDo);
          if (Number.isNaN(parsed)) {
            throw new Error('Kinh độ không hợp lệ');
          }
          value = parsed;
        }
        updates.push('KinhDo = ?');
        params.push(value);
      }

      let requireApproval = null;
      const hasApprovalField = Object.prototype.hasOwnProperty.call(data, 'YeuCauPheDuyetChu');
      if (hasApprovalField) {
        requireApproval = data.YeuCauPheDuyetChu ? 1 : 0;
        updates.push('YeuCauPheDuyetChu = ?');
        params.push(requireApproval);
      }

      if (Object.prototype.hasOwnProperty.call(data, 'PhuongThucVao') || hasApprovalField) {
        let phuongThuc = null;
        if (requireApproval === null) {
          requireApproval = rows[0]?.YeuCauPheDuyetChu || 0;
        }

        if (requireApproval === 1) {
          phuongThuc = null;
        } else if (Object.prototype.hasOwnProperty.call(data, 'PhuongThucVao')) {
          const raw = data.PhuongThucVao === undefined ? null : data.PhuongThucVao;
          phuongThuc = raw ? String(raw).trim() : null;
          if (!phuongThuc) {
            throw new Error('Phương thức vào không được để trống khi không yêu cầu phê duyệt');
          }
        } else {
          phuongThuc = rows[0]?.PhuongThucVao || null;
        }

        updates.push('PhuongThucVao = ?');
        params.push(phuongThuc);
      }

      if (Object.prototype.hasOwnProperty.call(data, 'TrangThai')) {
        const trangThai = data.TrangThai;
        if (!allowedStatuses.has(trangThai)) {
          throw new Error('Trạng thái dự án không hợp lệ');
        }

        if (trangThai === 'LuuTru') {
          const activeCount = await this.demTinDangHoatDong(duAnId);
          if (activeCount > 0) {
            throw new Error('Không thể lưu trữ dự án khi vẫn còn tin đăng hoạt động');
          }
        }

        updates.push('TrangThai = ?');
        params.push(trangThai);
      }

      // Xử lý cập nhật hoa hồng
      if (Object.prototype.hasOwnProperty.call(data, 'SoThangCocToiThieu')) {
        const soThang = data.SoThangCocToiThieu === null ? null : parseInt(data.SoThangCocToiThieu);
        if (soThang !== null && (isNaN(soThang) || soThang < 1)) {
          throw new Error('Số tháng cọc tối thiểu phải >= 1');
        }
        updates.push('SoThangCocToiThieu = ?');
        params.push(soThang);
      }

      if (Object.prototype.hasOwnProperty.call(data, 'BangHoaHong')) {
        // BangHoaHong là JSON array: [{soThang: 6, tyLe: 30}, {soThang: 12, tyLe: 50}]
        // Lưu dạng JSON text trong database
        let bangHoaHong = data.BangHoaHong;
        
        if (bangHoaHong !== null) {
          // Nếu là array, validate và convert sang JSON string
          if (Array.isArray(bangHoaHong)) {
            // Validate từng mức hoa hồng
            for (const muc of bangHoaHong) {
              if (!muc.soThang || !muc.tyLe) {
                throw new Error('Mỗi mức hoa hồng phải có soThang và tyLe');
              }
              const soThang = parseInt(muc.soThang);
              const tyLe = parseFloat(muc.tyLe);
              if (isNaN(soThang) || soThang < 1) {
                throw new Error('Số tháng phải >= 1');
              }
              if (isNaN(tyLe) || tyLe < 0 || tyLe > 100) {
                throw new Error('Tỷ lệ hoa hồng phải từ 0-100%');
              }
            }
            bangHoaHong = JSON.stringify(bangHoaHong);
          } else if (typeof bangHoaHong === 'string') {
            // Đã là JSON string, validate format
            try {
              const parsed = JSON.parse(bangHoaHong);
              if (!Array.isArray(parsed)) {
                throw new Error('BangHoaHong phải là array');
              }
            } catch (err) {
              throw new Error('BangHoaHong JSON không hợp lệ: ' + err.message);
            }
          }
        }
        
        updates.push('BangHoaHong = ?');
        params.push(bangHoaHong);
      }

      if (Object.prototype.hasOwnProperty.call(data, 'ThongTinMoRong')) {
        updates.push('ThongTinMoRong = ?');
        params.push(stringifyJsonField(data.ThongTinMoRong));
      }

      if (updates.length === 0) {
        return await this.layChiTietDuAn(duAnId, chuDuAnId);
      }

      updates.push('CapNhatLuc = NOW()');

      const sql = `UPDATE duan SET ${updates.join(', ')} WHERE DuAnID = ? AND ChuDuAnID = ?`;
      const finalParams = [...params, duAnId, chuDuAnId];
      
      // Debug log
      console.log('[DuAnModel.capNhatDuAn] SQL:', sql);
      console.log('[DuAnModel.capNhatDuAn] Params:', finalParams);

      await db.execute(sql, finalParams);

      return await this.layChiTietDuAn(duAnId, chuDuAnId);
    } catch (error) {
      throw new Error(`Lỗi cập nhật dự án: ${error.message}`);
    }
  }

  /**
   * Lưu trữ dự án (soft delete)
   * @param {number} duAnId ID dự án
   * @param {number} chuDuAnId ID chủ dự án
   * @returns {Promise<Object|null>} Dự án sau khi lưu trữ
   */
  static async luuTruDuAn(duAnId, chuDuAnId) {
    try {
      const [rows] = await db.execute(
        `SELECT DuAnID FROM duan WHERE DuAnID = ? AND ChuDuAnID = ?`,
        [duAnId, chuDuAnId]
      );

      if (rows.length === 0) {
        return null;
      }

      const activeCount = await this.demTinDangHoatDong(duAnId);
      if (activeCount > 0) {
        throw new Error('Không thể lưu trữ dự án khi vẫn còn tin đăng hoạt động');
      }

      await db.execute(
        `UPDATE duan
         SET TrangThai = 'LuuTru', CapNhatLuc = NOW()
         WHERE DuAnID = ? AND ChuDuAnID = ?`,
        [duAnId, chuDuAnId]
      );

      return await this.layChiTietDuAn(duAnId, chuDuAnId);
    } catch (error) {
      throw new Error(`Lỗi lưu trữ dự án: ${error.message}`);
    }
  }
}

module.exports = DuAnModel;












