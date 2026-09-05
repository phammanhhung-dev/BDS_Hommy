/**
 * Service Layer cho Nhân viên Bán hàng
 * Xử lý business logic cho 7 use cases (UC-SALE-01 đến UC-SALE-07)
 * Tuân thủ docs/use-cases-v1.2.md
 */

const db = require('../config/db');
const NhatKyHeThongService = require('./NhatKyHeThongService');
const HoaHongService = require('./HoaHongService');

const normalizeImagePath = (value = '') => {
  if (!value) return value;
  if (value.startsWith('/uploads')) return value;
  if (value.startsWith('uploads/')) return `/${value}`;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const parsed = new URL(value);
      if (parsed.pathname?.startsWith('/uploads')) {
        return parsed.pathname;
      }
    } catch {
      return value;
    }
  }
  return value;
};

class NhanVienBanHangService {
  /**
   * UC-SALE-01: Đăng ký lịch làm việc
   * Validate và tạo ca làm việc mới
   */
  static async dangKyLichLamViec(nhanVienId, { batDau, ketThuc }) {
    try {
      // Validate thời gian
      const startTime = new Date(batDau);
      const endTime = new Date(ketThuc);
      
      if (startTime >= endTime) {
        throw new Error('Thời gian bắt đầu phải trước thời gian kết thúc');
      }

      if (startTime < new Date()) {
        throw new Error('Không thể đăng ký ca làm việc trong quá khứ');
      }

      // Kiểm tra xung đột lịch
      const [conflicts] = await db.execute(`
        SELECT LichID, BatDau, KetThuc 
        FROM lichlamviec 
        WHERE NhanVienBanHangID = ? 
        AND (
          (BatDau < ? AND KetThuc > ?) OR
          (BatDau < ? AND KetThuc > ?) OR
          (BatDau >= ? AND KetThuc <= ?)
        )
      `, [nhanVienId, ketThuc, batDau, ketThuc, ketThuc, batDau, ketThuc]);

      if (conflicts.length > 0) {
        throw new Error('Ca làm việc bị trùng với ca khác đã đăng ký');
      }

      // Tạo ca làm việc mới
      const [result] = await db.execute(
        'INSERT INTO lichlamviec (NhanVienBanHangID, BatDau, KetThuc) VALUES (?, ?, ?)',
        [nhanVienId, batDau, ketThuc]
      );

      return {
        lichId: result.insertId,
        batDau,
        ketThuc
      };
    } catch (error) {
      throw new Error(`Lỗi đăng ký lịch làm việc: ${error.message}`);
    }
  }

  /**
   * UC-SALE-01: Cập nhật lịch làm việc
   */
  static async capNhatLichLamViec(lichId, nhanVienId, { batDau, ketThuc }) {
    try {
      // Kiểm tra quyền sở hữu
      const [lich] = await db.execute(
        'SELECT LichID FROM lichlamviec WHERE LichID = ? AND NhanVienBanHangID = ?',
        [lichId, nhanVienId]
      );

      if (lich.length === 0) {
        throw new Error('Không tìm thấy ca làm việc hoặc không có quyền chỉnh sửa');
      }

      // Validate thời gian
      const startTime = new Date(batDau);
      const endTime = new Date(ketThuc);
      
      if (startTime >= endTime) {
        throw new Error('Thời gian bắt đầu phải trước thời gian kết thúc');
      }

      // Kiểm tra xung đột (trừ chính ca này)
      const [conflicts] = await db.execute(`
        SELECT LichID 
        FROM lichlamviec 
        WHERE NhanVienBanHangID = ? 
        AND LichID != ?
        AND (
          (BatDau < ? AND KetThuc > ?) OR
          (BatDau < ? AND KetThuc > ?) OR
          (BatDau >= ? AND KetThuc <= ?)
        )
      `, [nhanVienId, lichId, ketThuc, batDau, ketThuc, ketThuc, batDau, ketThuc]);

      if (conflicts.length > 0) {
        throw new Error('Ca làm việc bị trùng với ca khác đã đăng ký');
      }

      // Cập nhật
      await db.execute(
        'UPDATE lichlamviec SET BatDau = ?, KetThuc = ? WHERE LichID = ?',
        [batDau, ketThuc, lichId]
      );

      return { lichId, batDau, ketThuc };
    } catch (error) {
      throw new Error(`Lỗi cập nhật lịch làm việc: ${error.message}`);
    }
  }

  /**
   * UC-SALE-01: Xóa lịch làm việc
   * Ràng buộc: Không xóa ca đã có cuộc hẹn DaXacNhan
   */
  static async xoaLichLamViec(lichId, nhanVienId) {
    try {
      // Kiểm tra quyền sở hữu
      const [lich] = await db.execute(
        'SELECT LichID, BatDau, KetThuc FROM lichlamviec WHERE LichID = ? AND NhanVienBanHangID = ?',
        [lichId, nhanVienId]
      );

      if (lich.length === 0) {
        throw new Error('Không tìm thấy ca làm việc hoặc không có quyền xóa');
      }

      // Kiểm tra có cuộc hẹn đã xác nhận không
      const [cuocHens] = await db.execute(`
        SELECT COUNT(*) as soLuong 
        FROM cuochen 
        WHERE NhanVienBanHangID = ? 
        AND ThoiGianHen BETWEEN ? AND ?
        AND TrangThai IN ('DaXacNhan', 'HoanThanh')
      `, [nhanVienId, lich[0].BatDau, lich[0].KetThuc]);

      if (cuocHens[0].soLuong > 0) {
        throw new Error('Không thể xóa ca làm việc đã có cuộc hẹn được xác nhận');
      }

      // Xóa ca làm việc
      await db.execute('DELETE FROM lichlamviec WHERE LichID = ?', [lichId]);

      return true;
    } catch (error) {
      throw new Error(`Lỗi xóa lịch làm việc: ${error.message}`);
    }
  }

  /**
   * UC-SALE-02: Lấy chi tiết cuộc hẹn
   */
  static async layChiTietCuocHen(cuocHenId, nhanVienId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          ch.CuocHenID, ch.KhachHangID, ch.NhanVienBanHangID,
          ch.PhongID, ch.ThoiGianHen, ch.TrangThai, ch.SoLanDoiLich,
          ch.GhiChuKetQua, ch.TaoLuc, ch.CapNhatLuc,
          ch.PheDuyetChuDuAn, ch.LyDoTuChoi, ch.PhuongThucVao,
          
          kh.TenDayDu as TenKhachHang, 
          kh.SoDienThoai as SDTKhachHang,
          kh.Email as EmailKhachHang,
          
          -- Thông tin Phòng (từ bảng phong)
          p.PhongID,
          p.TenPhong as TieuDePhong, 
          p.TrangThai as TrangThaiPhong,
          p.GiaChuan as GiaChuanPhong,
          p.DienTichChuan as DienTichChuanPhong,
          p.MoTaPhong,
          p.HinhAnhPhong as HinhAnhPhongGoc,
          
          -- Thông tin Phòng-Tin đăng (từ phong_tindang - ưu tiên cho tin này)
          COALESCE(pt.GiaTinDang, p.GiaChuan) as GiaPhong,
          COALESCE(pt.DienTichTinDang, p.DienTichChuan) as DienTich,
          COALESCE(pt.MoTaTinDang, p.MoTaPhong) as MoTaPhongHienThi,
          COALESCE(pt.HinhAnhTinDang, p.HinhAnhPhong) as HinhAnhPhongTinDang,
          
          -- Thông tin Tin đăng
          td.TinDangID, 
          td.TieuDe as TieuDeTinDang,
          td.MoTa as MoTaTinDang,
          td.TienIch,
          td.GiaDien,
          td.GiaNuoc,
          td.GiaDichVu,
          td.MoTaGiaDichVu,
          td.TrangThai as TrangThaiTinDang,
          td.URL as HinhAnhTinDang,
          td.DuAnID,
          
          -- Thông tin Dự án
          da.DuAnID,
          da.TenDuAn, 
          da.DiaChi as DiaChiPhong,
          da.KinhDo,
          da.ViDo,
          da.PhuongThucVao as PhuongThucVaoDuAn,
          da.TrangThai as TrangThaiDuAn,
          da.BangHoaHong,
          da.SoThangCocToiThieu,
          da.ChuDuAnID,
          
          -- Thông tin Chủ dự án
          cda.TenDayDu as TenChuDuAn,
          cda.SoDienThoai as SoDienThoaiChuDuAn,
          cda.Email as EmailChuDuAn
          
        FROM cuochen ch
        INNER JOIN phong p ON ch.PhongID = p.PhongID
        INNER JOIN phong_tindang pt ON p.PhongID = pt.PhongID AND pt.TinDangID = ch.TinDangID
        INNER JOIN tindang td ON ch.TinDangID = td.TinDangID
        INNER JOIN duan da ON td.DuAnID = da.DuAnID
        LEFT JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        LEFT JOIN nguoidung cda ON da.ChuDuAnID = cda.NguoiDungID
        WHERE ch.CuocHenID = ? AND ch.NhanVienBanHangID = ?
      `, [cuocHenId, nhanVienId]);

      if (rows.length === 0) {
        throw new Error('Không tìm thấy cuộc hẹn hoặc không có quyền xem');
      }

      const appointment = rows[0];

      // Parse JSON fields - Hình ảnh
      // Ưu tiên: HinhAnhTinDang > HinhAnhPhongTinDang > HinhAnhPhongGoc
      let hinhAnhSource = appointment.HinhAnhTinDang || appointment.HinhAnhPhongTinDang || appointment.HinhAnhPhongGoc;
      if (hinhAnhSource) {
        try {
          const images = JSON.parse(hinhAnhSource);
          appointment.HinhAnhPhong = images.map(img => normalizeImagePath(img));
        } catch (e) {
          if (typeof hinhAnhSource === 'string' && hinhAnhSource.trim()) {
            appointment.HinhAnhPhong = [normalizeImagePath(hinhAnhSource)];
          } else {
            appointment.HinhAnhPhong = [];
          }
        }
      } else {
        appointment.HinhAnhPhong = [];
      }

      // Parse TienIch (tiện ích) từ tin đăng
      if (appointment.TienIch) {
        try {
          appointment.TienIch = JSON.parse(appointment.TienIch);
        } catch (e) {
          appointment.TienIch = [];
        }
      } else {
        appointment.TienIch = [];
      }

      // Parse BangHoaHong (bảng hoa hồng) từ dự án
      if (appointment.BangHoaHong) {
        try {
          appointment.BangHoaHong = JSON.parse(appointment.BangHoaHong);
        } catch (e) {
          appointment.BangHoaHong = null;
        }
      } else {
        appointment.BangHoaHong = null;
      }

      // Parse coordinates
      if (appointment.KinhDo && appointment.ViDo) {
        appointment.ToaDo = {
          lat: parseFloat(appointment.ViDo),
          lng: parseFloat(appointment.KinhDo)
        };
      }

      // Parse GhiChuKetQua JSON
      if (appointment.GhiChuKetQua) {
        try {
          const ghiChuData = JSON.parse(appointment.GhiChuKetQua);
          
          // Nếu có cấu trúc mới với activities
          if (ghiChuData.activities) {
            appointment.ActivityLog = ghiChuData.activities;
          } else {
            appointment.ActivityLog = [];
          }
          
          // Nếu có báo cáo kết quả (format mới với thoiGianBaoCao/ketQua)
          if (ghiChuData.thoiGianBaoCao || ghiChuData.ketQua) {
            appointment.BaoCaoKetQua = ghiChuData;
          } else if (ghiChuData.oldNote) {
            // Backward compatibility: nếu có oldNote (text cũ được migrate)
            appointment.BaoCaoKetQua = {
              ghiChu: ghiChuData.oldNote
            };
          } else {
            appointment.BaoCaoKetQua = null;
          }
        } catch (e) {
          // Nếu không phải JSON (dữ liệu cũ text thuần), giữ nguyên
          appointment.BaoCaoKetQua = {
            ghiChu: appointment.GhiChuKetQua
          };
          appointment.ActivityLog = [];
        }
      } else {
        appointment.ActivityLog = [];
        appointment.BaoCaoKetQua = null;
      }

      // Lấy danh sách phòng khác từ cùng tin đăng
      const [phongKhacRows] = await db.execute(`
        SELECT 
          p.PhongID,
          p.TenPhong,
          p.TrangThai as TrangThaiPhong,
          COALESCE(pt.GiaTinDang, p.GiaChuan) as GiaPhong,
          COALESCE(pt.DienTichTinDang, p.DienTichChuan) as DienTich,
          COALESCE(pt.MoTaTinDang, p.MoTaPhong) as MoTaPhong,
          COALESCE(pt.HinhAnhTinDang, p.HinhAnhPhong) as HinhAnhPhong,
          p.GiaChuan as GiaChuanPhong,
          p.DienTichChuan as DienTichChuanPhong
        FROM phong_tindang pt
        INNER JOIN phong p ON pt.PhongID = p.PhongID
        WHERE pt.TinDangID = ? AND p.PhongID != ?
        ORDER BY pt.ThuTuHienThi, p.TenPhong ASC
      `, [appointment.TinDangID, appointment.PhongID]);

      // Parse hình ảnh cho từng phòng
      appointment.DanhSachPhongKhac = phongKhacRows.map(phong => {
        let hinhAnh = [];
        if (phong.HinhAnhPhong) {
          try {
            const images = JSON.parse(phong.HinhAnhPhong);
            hinhAnh = images.map(img => normalizeImagePath(img));
          } catch (e) {
            if (typeof phong.HinhAnhPhong === 'string' && phong.HinhAnhPhong.trim()) {
              hinhAnh = [normalizeImagePath(phong.HinhAnhPhong)];
            }
          }
        }
        return {
          ...phong,
          HinhAnhPhong: hinhAnh
        };
      });

      return appointment;
    } catch (error) {
      throw new Error(`Lỗi lấy chi tiết cuộc hẹn: ${error.message}`);
    }
  }

  /**
   * UC-SALE-03: Xác nhận cuộc hẹn
   */
  static async xacNhanCuocHen(cuocHenId, nhanVienId, ghiChu = '') {
    try {
      // Kiểm tra quyền và trạng thái
      const [cuocHen] = await db.execute(
        'SELECT TrangThai FROM cuochen WHERE CuocHenID = ? AND NhanVienBanHangID = ?',
        [cuocHenId, nhanVienId]
      );

      if (cuocHen.length === 0) {
        throw new Error('Không tìm thấy cuộc hẹn hoặc không có quyền xác nhận');
      }

      if (cuocHen[0].TrangThai !== 'ChoXacNhan' && cuocHen[0].TrangThai !== 'DaYeuCau') {
        throw new Error('Chỉ có thể xác nhận cuộc hẹn ở trạng thái Chờ xác nhận hoặc Đã yêu cầu');
      }

      // Lấy GhiChuKetQua hiện tại
      const [current] = await db.execute(
        'SELECT GhiChuKetQua FROM cuochen WHERE CuocHenID = ?',
        [cuocHenId]
      );

      let ghiChuData = { activities: [] };
      if (current[0]?.GhiChuKetQua) {
        try {
          ghiChuData = JSON.parse(current[0].GhiChuKetQua);
          if (!ghiChuData.activities) {
            ghiChuData.activities = [];
          }
        } catch (e) {
          // Nếu data cũ là text, khởi tạo mới
          ghiChuData = { activities: [], oldNote: current[0].GhiChuKetQua };
        }
      }

      // Thêm activity mới
      ghiChuData.activities.push({
        timestamp: new Date().toISOString(),
        action: 'xac_nhan',
        actor: 'NVBH',
        nhanVienId: nhanVienId,
        note: ghiChu || ''
      });

      // Cập nhật trạng thái
      await db.execute(
        `UPDATE cuochen 
         SET TrangThai = 'DaXacNhan', 
             GhiChuKetQua = ?
         WHERE CuocHenID = ?`,
        [JSON.stringify(ghiChuData), cuocHenId]
      );

      // Kiểm tra nếu cuộc hẹn đã được phê duyệt (PheDuyetChuDuAn = 'DaPheDuyet')
      const [updatedCuocHen] = await db.execute(
        'SELECT PheDuyetChuDuAn FROM cuochen WHERE CuocHenID = ?',
        [cuocHenId]
      );

      // Gửi thông báo nếu đã được phê duyệt (async, không chờ)
      if (updatedCuocHen[0]?.PheDuyetChuDuAn === 'DaPheDuyet') {
        const ThongBaoService = require('./ThongBaoService');
        ThongBaoService.thongBaoCuocHenDaPheDuyet(cuocHenId, nhanVienId)
          .catch(err => console.error('[NhanVienBanHangService] Lỗi gửi thông báo đã phê duyệt:', err));
      }

      return true;
    } catch (error) {
      throw new Error(`Lỗi xác nhận cuộc hẹn: ${error.message}`);
    }
  }

  /**
   * UC-SALE-03: Đổi lịch cuộc hẹn
   * Ràng buộc: SoLanDoiLich < N (giới hạn từ use case)
   */
  static async doiLichCuocHen(cuocHenId, nhanVienId, { thoiGianHenMoi, lyDo }) {
    try {
      const MAX_DOI_LICH = 3; // Giới hạn đổi lịch

      // Kiểm tra quyền và số lần đổi lịch
      const [cuocHen] = await db.execute(
        'SELECT TrangThai, SoLanDoiLich FROM cuochen WHERE CuocHenID = ? AND NhanVienBanHangID = ?',
        [cuocHenId, nhanVienId]
      );

      if (cuocHen.length === 0) {
        throw new Error('Không tìm thấy cuộc hẹn hoặc không có quyền đổi lịch');
      }

      if (cuocHen[0].SoLanDoiLich >= MAX_DOI_LICH) {
        throw new Error(`Đã vượt quá giới hạn đổi lịch (${MAX_DOI_LICH} lần)`);
      }

      if (!['DaXacNhan', 'ChoXacNhan'].includes(cuocHen[0].TrangThai)) {
        throw new Error('Không thể đổi lịch cho cuộc hẹn ở trạng thái này');
      }

      // Validate thời gian mới
      const newTime = new Date(thoiGianHenMoi);
      if (newTime < new Date()) {
        throw new Error('Không thể đổi sang thời gian trong quá khứ');
      }

      // Lấy GhiChuKetQua và thời gian cũ
      const [current] = await db.execute(
        'SELECT GhiChuKetQua, ThoiGianHen FROM cuochen WHERE CuocHenID = ?',
        [cuocHenId]
      );

      let ghiChuData = { activities: [] };
      if (current[0]?.GhiChuKetQua) {
        try {
          ghiChuData = JSON.parse(current[0].GhiChuKetQua);
          if (!ghiChuData.activities) {
            ghiChuData.activities = [];
          }
        } catch (e) {
          ghiChuData = { activities: [], oldNote: current[0].GhiChuKetQua };
        }
      }

      // Thêm activity đổi lịch
      ghiChuData.activities.push({
        timestamp: new Date().toISOString(),
        action: 'doi_lich',
        actor: 'NVBH',
        nhanVienId: nhanVienId,
        note: lyDo || '',
        oldTime: current[0]?.ThoiGianHen,
        newTime: thoiGianHenMoi
      });

      // Cập nhật
      await db.execute(
        `UPDATE cuochen 
         SET ThoiGianHen = ?, 
             SoLanDoiLich = SoLanDoiLich + 1,
             TrangThai = 'DaDoiLich',
             GhiChuKetQua = ?
         WHERE CuocHenID = ?`,
        [thoiGianHenMoi, JSON.stringify(ghiChuData), cuocHenId]
      );

      return true;
    } catch (error) {
      throw new Error(`Lỗi đổi lịch cuộc hẹn: ${error.message}`);
    }
  }

  /**
   * UC-SALE-03: Hủy cuộc hẹn
   */
  static async huyCuocHen(cuocHenId, nhanVienId, lyDoHuy) {
    try {
      // Kiểm tra quyền
      const [cuocHen] = await db.execute(
        'SELECT TrangThai FROM cuochen WHERE CuocHenID = ? AND NhanVienBanHangID = ?',
        [cuocHenId, nhanVienId]
      );

      if (cuocHen.length === 0) {
        throw new Error('Không tìm thấy cuộc hẹn hoặc không có quyền hủy');
      }

      if (cuocHen[0].TrangThai === 'HoanThanh' || cuocHen[0].TrangThai === 'HuyBoiHeThong') {
        throw new Error('Không thể hủy cuộc hẹn ở trạng thái này');
      }

      // Lấy trạng thái hiện tại để kiểm tra
      const [currentCuocHen] = await db.execute(
        'SELECT TrangThai FROM cuochen WHERE CuocHenID = ?',
        [cuocHenId]
      );

      // Cập nhật trạng thái
      await db.execute(
        `UPDATE cuochen 
         SET TrangThai = 'HuyBoiHeThong',
             GhiChuKetQua = CONCAT(IFNULL(GhiChuKetQua, ''), '\n[', NOW(), '] Hủy bởi NVBH: ', ?)
         WHERE CuocHenID = ?`,
        [lyDoHuy, cuocHenId]
      );

      // Nếu trạng thái trước đó là 'HuyBoiKhach', gửi thông báo (async, không chờ)
      if (currentCuocHen[0]?.TrangThai === 'HuyBoiKhach') {
        const ThongBaoService = require('./ThongBaoService');
        ThongBaoService.thongBaoKhachHuyCuocHen(cuocHenId, nhanVienId)
          .catch(err => console.error('[NhanVienBanHangService] Lỗi gửi thông báo khách hủy:', err));
      }

      return true;
    } catch (error) {
      throw new Error(`Lỗi hủy cuộc hẹn: ${error.message}`);
    }
  }

  /**
   * UC-SALE-04: Xác nhận cọc của khách hàng
   */
  static async xacNhanCoc(cocId, nhanVienId) {
    try {
      // Kiểm tra cọc có liên quan đến hợp đồng của NVBH không
      const [cocRows] = await db.execute(`
        SELECT c.CocID, c.TrangThai, c.Loai, c.HopDongID
        FROM coc c
        LEFT JOIN hopdong hd ON c.HopDongID = hd.HopDongID OR (c.TinDangID = hd.TinDangID AND c.PhongID = hd.PhongID)
        WHERE c.CocID = ?
        AND c.Loai IN ('CocGiuCho', 'CocAnNinh')
        AND c.TrangThai = 'HieuLuc'
        AND hd.NhanVienBanHangID = ?
      `, [cocId, nhanVienId]);

      if (cocRows.length === 0) {
        throw new Error('Không tìm thấy cọc hoặc cọc không ở trạng thái chờ xác nhận');
      }

      // Cập nhật trạng thái cọc → DaDoiTru (đã đối trừ vào hợp đồng)
      await db.execute(
        `UPDATE coc 
         SET TrangThai = 'DaDoiTru', CapNhatLuc = NOW()
         WHERE CocID = ?`,
        [cocId]
      );

      return true;
    } catch (error) {
      throw new Error(`Lỗi xác nhận cọc: ${error.message}`);
    }
  }

  /**
   * UC-SALE-05: Báo cáo kết quả cuộc hẹn
   */
  static async baoCaoKetQuaCuocHen(cuocHenId, nhanVienId, { ketQua, khachQuanTam, lyDoThatBai, keHoachFollowUp, ghiChu }) {
    try {
      // Kiểm tra quyền
      const [cuocHen] = await db.execute(
        'SELECT TrangThai, ThoiGianHen FROM cuochen WHERE CuocHenID = ? AND NhanVienBanHangID = ?',
        [cuocHenId, nhanVienId]
      );

      if (cuocHen.length === 0) {
        throw new Error('Không tìm thấy cuộc hẹn hoặc không có quyền báo cáo');
      }

      if (cuocHen[0].TrangThai === 'HoanThanh') {
        throw new Error('Cuộc hẹn đã được báo cáo kết quả');
      }

      // Validate
      if (!ketQua) {
        throw new Error('Kết quả là bắt buộc');
      }

      if (ketQua === 'that_bai' && !lyDoThatBai) {
        throw new Error('Lý do thất bại là bắt buộc khi chọn kết quả Thất bại');
      }

      // Cảnh báo SLA (nếu báo cáo quá hạn)
      const thoiGianHen = new Date(cuocHen[0].ThoiGianHen);
      const now = new Date();
      const hoursLate = (now - thoiGianHen) / (1000 * 60 * 60);
      const slaWarning = hoursLate > 24 ? `Báo cáo muộn ${Math.floor(hoursLate)} giờ` : null;
      
      // Lấy GhiChuKetQua hiện tại để giữ activities
      const [current] = await db.execute(
        'SELECT GhiChuKetQua FROM cuochen WHERE CuocHenID = ?',
        [cuocHenId]
      );

      let ghiChuData = { activities: [] };
      if (current[0]?.GhiChuKetQua) {
        try {
          ghiChuData = JSON.parse(current[0].GhiChuKetQua);
          if (!ghiChuData.activities) {
            ghiChuData.activities = [];
          }
        } catch (e) {
          ghiChuData = { activities: [], oldNote: current[0].GhiChuKetQua };
        }
      }

      // Thêm báo cáo kết quả vào structure
      ghiChuData.thoiGianBaoCao = new Date().toISOString();
      ghiChuData.ketQua = ketQua;
      ghiChuData.khachQuanTam = khachQuanTam || false;
      ghiChuData.lyDoThatBai = lyDoThatBai || null;
      ghiChuData.keHoachFollowUp = keHoachFollowUp || null;
      ghiChuData.ghiChu = ghiChu || null;
      ghiChuData.slaWarning = slaWarning;

      // Thêm activity báo cáo
      ghiChuData.activities.push({
        timestamp: new Date().toISOString(),
        action: 'bao_cao',
        actor: 'NVBH',
        nhanVienId: nhanVienId,
        note: `Kết quả: ${ketQua}`,
        ketQua: ketQua
      });

      // Cập nhật - lưu dạng JSON để dễ parse và hiển thị
      await db.execute(
        `UPDATE cuochen 
         SET TrangThai = 'HoanThanh',
             GhiChuKetQua = ?
         WHERE CuocHenID = ?`,
        [JSON.stringify(ghiChuData), cuocHenId]
      );

      return { success: true, slaWarning: hoursLate > 24, baoCao: ghiChuData };
    } catch (error) {
      throw new Error(`Lỗi báo cáo kết quả: ${error.message}`);
    }
  }

  /**
   * UC-SALE-06: Tính thu nhập/hoa hồng
   * Công thức mới:
   * - Doanh thu công ty = Số tiền cọc × % hoa hồng dự án (theo BangHoaHong JSON)
   * - Thu nhập NVBH = Doanh thu công ty × tỷ lệ hoa hồng nhân viên (thường 50%)
   */
  static async tinhThuNhap(nhanVienId, { tuNgay, denNgay }) {
    try {
      // Sử dụng HoaHongService để tính báo cáo thu nhập theo công thức mới
      const baoCaoHoaHong = await HoaHongService.baoCaoThuNhapNVBH(nhanVienId, tuNgay, denNgay);

      // Lấy thống kê cuộc hẹn để tính tỷ lệ chuyển đổi
      const [cuocHen] = await db.execute(`
        SELECT 
          COUNT(*) as tongCuocHen,
          COUNT(CASE WHEN TrangThai = 'HoanThanh' THEN 1 END) as hoanThanh,
          COUNT(CASE WHEN TrangThai IN ('HuyBoiKhach', 'KhachKhongDen', 'HuyBoiHeThong') THEN 1 END) as huy
        FROM cuochen
        WHERE NhanVienBanHangID = ?
        AND ThoiGianHen BETWEEN ? AND ?
      `, [nhanVienId, tuNgay, denNgay]);

      const tyLeChuyenDoi = cuocHen[0].tongCuocHen > 0 
        ? (cuocHen[0].hoanThanh / cuocHen[0].tongCuocHen * 100).toFixed(2)
        : 0;

      return {
        // Thông tin công thức mới
        tyLeHoaHong: baoCaoHoaHong.tyLeHoaHongNhanVien,
        soGiaoDich: baoCaoHoaHong.soHopDong,
        tongGiaTri: baoCaoHoaHong.tongDoanhThuCongTy,
        tongHoaHong: baoCaoHoaHong.tongThuNhapNVBH,
        hoaHongTrungBinh: baoCaoHoaHong.soHopDong > 0 
          ? (baoCaoHoaHong.tongThuNhapNVBH / baoCaoHoaHong.soHopDong).toFixed(2)
          : 0,
        // Thống kê cuộc hẹn
        tongCuocHen: cuocHen[0].tongCuocHen || 0,
        cuocHenHoanThanh: cuocHen[0].hoanThanh || 0,
        tyLeChuyenDoi,
        // Chi tiết hợp đồng (mới)
        chiTietHopDong: baoCaoHoaHong.chiTietHopDong,
        // Công thức áp dụng
        congThuc: baoCaoHoaHong.congThuc
      };
    } catch (error) {
      throw new Error(`Lỗi tính thu nhập: ${error.message}`);
    }
  }

  /**
   * Lấy metrics dashboard
   */
  static async layMetricsDashboard(nhanVienId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Cuộc hẹn hôm nay
      const [cuocHenHomNay] = await db.execute(`
        SELECT COUNT(*) as soLuong
        FROM cuochen
        WHERE NhanVienBanHangID = ?
        AND ThoiGianHen >= ? AND ThoiGianHen < ?
        AND TrangThai NOT IN ('HuyBoiKhach', 'HuyBoiHeThong')
      `, [nhanVienId, today, tomorrow]);

      // Chờ xác nhận
      const [choXacNhan] = await db.execute(`
        SELECT COUNT(*) as soLuong
        FROM cuochen
        WHERE NhanVienBanHangID = ?
        AND TrangThai = 'ChoXacNhan'
      `, [nhanVienId]);

      // Hoàn thành tuần này
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      
      const [hoanThanhTuan] = await db.execute(`
        SELECT COUNT(*) as soLuong
        FROM cuochen
        WHERE NhanVienBanHangID = ?
        AND TrangThai = 'HoanThanh'
        AND ThoiGianHen >= ?
      `, [nhanVienId, weekStart]);

      // Thu nhập tháng này
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const thuNhap = await this.tinhThuNhap(nhanVienId, {
        tuNgay: monthStart,
        denNgay: new Date()
      });

      return {
        cuocHenHomNay: cuocHenHomNay[0].soLuong || 0,
        choXacNhan: choXacNhan[0].soLuong || 0,
        hoanThanhTuan: hoanThanhTuan[0].soLuong || 0,
        thuNhapThang: thuNhap.tongHoaHong || 0
      };
    } catch (error) {
      throw new Error(`Lỗi lấy metrics dashboard: ${error.message}`);
    }
  }
}

module.exports = NhanVienBanHangService;






