/**
 * Controller cho Nhân viên Bán hàng
 * Xử lý 19 API endpoints cho 7 use cases
 * Tuân thủ docs/use-cases-v1.2.md
 */

const NhanVienBanHangService = require('../services/NhanVienBanHangService');
const LichLamViecModel = require('../models/LichLamViecModel');
const BaoCaoThuNhapModel = require('../models/BaoCaoThuNhapModel');
const CuocHenModel = require('../models/cuocHenModel');
const NhatKyHeThongService = require('../services/NhatKyHeThongService');

class NhanVienBanHangController {
  // ==================== LỊCH LÀM VIỆC (UC-SALE-01) ====================

  /**
   * GET /api/nhan-vien-ban-hang/lich-lam-viec
   * Lấy danh sách lịch làm việc
   */
  static async layLichLamViec(req, res) {
    try {
      const nhanVienId = req.user.id;
      const filters = {
        tuNgay: req.query.tuNgay,
        denNgay: req.query.denNgay
      };

      const danhSach = await LichLamViecModel.layLichLamViec(nhanVienId, filters);

      res.json({
        success: true,
        message: 'Lấy lịch làm việc thành công',
        data: {
          lichLamViecs: danhSach,
          tongSo: danhSach.length
        }
      });
    } catch (error) {
      console.error('[NhanVienBanHangController] Lỗi layLichLamViec:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/nhan-vien-ban-hang/lich-lam-viec
   * Tạo ca làm việc mới
   */
  static async taoLichLamViec(req, res) {
    try {
      const nhanVienId = req.user.id;
      const { batDau, ketThuc } = req.body;

      if (!batDau || !ketThuc) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin thời gian bắt đầu và kết thúc'
        });
      }

      const result = await NhanVienBanHangService.dangKyLichLamViec(nhanVienId, { batDau, ketThuc });

      // Audit log
      await NhatKyHeThongService.ghiNhan(
        nhanVienId,
        'tao_ca_lam_viec_sales',
        'LichLamViec',
        result.lichId,
        null,
        { batDau, ketThuc },
        req.ip,
        req.get('User-Agent')
      );

      res.status(201).json({
        success: true,
        message: 'Đăng ký ca làm việc thành công',
        data: result
      });
    } catch (error) {
      console.error('[NhanVienBanHangController] Lỗi taoLichLamViec:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PUT /api/nhan-vien-ban-hang/lich-lam-viec/:id
   * Cập nhật ca làm việc
   */
  static async capNhatLichLamViec(req, res) {
    try {
      const nhanVienId = req.user.id;
      const lichId = parseInt(req.params.id);
      const { batDau, ketThuc } = req.body;

      if (!batDau || !ketThuc) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin thời gian'
        });
      }

      const result = await NhanVienBanHangService.capNhatLichLamViec(lichId, nhanVienId, { batDau, ketThuc });

      // Audit log
      await NhatKyHeThongService.ghiNhan(
        nhanVienId,
        'cap_nhat_ca_lam_viec_sales',
        'LichLamViec',
        lichId,
        null,
        { batDau, ketThuc },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Cập nhật ca làm việc thành công',
        data: result
      });
    } catch (error) {
      console.error('[NhanVienBanHangController] Lỗi capNhatLichLamViec:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * DELETE /api/nhan-vien-ban-hang/lich-lam-viec/:id
   * Xóa ca làm việc (nếu chưa có hẹn)
   */
  static async xoaLichLamViec(req, res) {
    try {
      const nhanVienId = req.user.id;
      const lichId = parseInt(req.params.id);

      await NhanVienBanHangService.xoaLichLamViec(lichId, nhanVienId);

      // Audit log
      await NhatKyHeThongService.ghiNhan(
        nhanVienId,
        'xoa_ca_lam_viec_sales',
        'LichLamViec',
        lichId,
        { deleted: false },
        { deleted: true },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Xóa ca làm việc thành công'
      });
    } catch (error) {
      console.error('[NhanVienBanHangController] Lỗi xoaLichLamViec:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // ==================== CUỘC HẸN (UC-SALE-02, UC-SALE-03, UC-SALE-05) ====================

  /**
   * GET /api/nhan-vien-ban-hang/cuoc-hen
   * Lấy danh sách cuộc hẹn được gán
   */
  static async layDanhSachCuocHen(req, res) {
    try {
      const nhanVienId = req.user.id;
      const filters = {
        trangThai: req.query.trangThai,
        tuNgay: req.query.tuNgay,
        denNgay: req.query.denNgay,
        limit: req.query.limit || 50
      };

      // Sử dụng query tùy chỉnh cho NVBH
      const [danhSach] = await require('../config/db').execute(`
        SELECT 
          ch.CuocHenID, ch.KhachHangID, ch.NhanVienBanHangID,
          ch.PhongID, ch.ThoiGianHen, ch.TrangThai, ch.SoLanDoiLich,
          ch.GhiChuKetQua, ch.TaoLuc, ch.CapNhatLuc,
          kh.TenDayDu as TenKhachHang,
          kh.SoDienThoai as SDTKhachHang,
          p.TenPhong,
          COALESCE(pt.GiaTinDang, p.GiaChuan, 0) as GiaPhong,
          td.TieuDe as TieuDeTinDang,
          da.DiaChi as DiaChiTinDang
        FROM cuochen ch
        LEFT JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        LEFT JOIN phong p ON ch.PhongID = p.PhongID
        LEFT JOIN phong_tindang pt ON p.PhongID = pt.PhongID AND pt.TinDangID = ch.TinDangID
        LEFT JOIN tindang td ON ch.TinDangID = td.TinDangID
        LEFT JOIN duan da ON td.DuAnID = da.DuAnID
        WHERE ch.NhanVienBanHangID = ?
        ${filters.trangThai ? 'AND ch.TrangThai = ?' : ''}
        ${filters.tuNgay && filters.denNgay ? 'AND ch.ThoiGianHen BETWEEN ? AND ?' : ''}
        ORDER BY ch.ThoiGianHen DESC
        LIMIT ${Math.max(1, Math.min(100, parseInt(filters.limit) || 20))}
      `, [
        nhanVienId,
        ...(filters.trangThai ? [filters.trangThai] : []),
        ...(filters.tuNgay && filters.denNgay ? [filters.tuNgay, filters.denNgay] : [])
      ]);

      res.json({
        success: true,
        message: 'Lấy danh sách cuộc hẹn thành công',
        data: {
          cuocHens: danhSach,
          tongSo: danhSach.length
        }
      });
    } catch (error) {
      console.error('[NhanVienBanHangController] Lỗi layDanhSachCuocHen:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/nhan-vien-ban-hang/cuoc-hen/:id
   * Xem chi tiết cuộc hẹn (UC-SALE-02)
   */
  static async xemChiTietCuocHen(req, res) {
    try {
      const nhanVienId = req.user.id;
      const cuocHenId = parseInt(req.params.id);

      const chiTiet = await NhanVienBanHangService.layChiTietCuocHen(cuocHenId, nhanVienId);

      // Audit log
      await NhatKyHeThongService.ghiNhan(
        nhanVienId,
        'xem_chi_tiet_cuoc_hen',
        'CuocHen',
        cuocHenId,
        null,
        null,
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Lấy chi tiết cuộc hẹn thành công',
        data: chiTiet
      });
    } catch (error) {
      console.error('[NhanVienBanHangController] Lỗi xemChiTietCuocHen:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PUT /api/nhan-vien-ban-hang/cuoc-hen/:id/xac-nhan
   * Xác nhận cuộc hẹn (UC-SALE-03)
   */
  static async xacNhanCuocHen(req, res) {
    try {
      const nhanVienId = req.user.id;
      const cuocHenId = parseInt(req.params.id);
      const { ghiChu } = req.body;

      await NhanVienBanHangService.xacNhanCuocHen(cuocHenId, nhanVienId, ghiChu);

      // Audit log
      await NhatKyHeThongService.ghiNhan(
        nhanVienId,
        'xac_nhan_cuoc_hen',
        'CuocHen',
        cuocHenId,
        { trangThai: 'ChoXacNhan' },
        { trangThai: 'DaXacNhan', ghiChu },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Xác nhận cuộc hẹn thành công'
      });
    } catch (error) {
      console.error('[NhanVienBanHangController] Lỗi xacNhanCuocHen:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PUT /api/nhan-vien-ban-hang/cuoc-hen/:id/doi-lich
   * Đổi lịch cuộc hẹn (UC-SALE-03)
   */
  static async doiLichCuocHen(req, res) {
    try {
      const nhanVienId = req.user.id;
      const cuocHenId = parseInt(req.params.id);
      const { thoiGianHenMoi, lyDo } = req.body;

      if (!thoiGianHenMoi) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thời gian hẹn mới'
        });
      }

      await NhanVienBanHangService.doiLichCuocHen(cuocHenId, nhanVienId, { thoiGianHenMoi, lyDo });

      // Audit log
      await NhatKyHeThongService.ghiNhan(
        nhanVienId,
        'doi_lich_cuoc_hen',
        'CuocHen',
        cuocHenId,
        null,
        { thoiGianHenMoi, lyDo },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Đổi lịch cuộc hẹn thành công'
      });
    } catch (error) {
      console.error('[NhanVienBanHangController] Lỗi doiLichCuocHen:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PUT /api/nhan-vien-ban-hang/cuoc-hen/:id/huy
   * Hủy cuộc hẹn (UC-SALE-03)
   */
  static async huyCuocHen(req, res) {
    try {
      const nhanVienId = req.user.id;
      const cuocHenId = parseInt(req.params.id);
      const { lyDoHuy } = req.body;

      if (!lyDoHuy) {
        return res.status(400).json({
          success: false,
          message: 'Lý do hủy là bắt buộc'
        });
      }

      await NhanVienBanHangService.huyCuocHen(cuocHenId, nhanVienId, lyDoHuy);

      // Audit log
      await NhatKyHeThongService.ghiNhan(
        nhanVienId,
        'huy_cuoc_hen',
        'CuocHen',
        cuocHenId,
        null,
        { lyDoHuy },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Hủy cuộc hẹn thành công'
      });
    } catch (error) {
      console.error('[NhanVienBanHangController] Lỗi huyCuocHen:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/nhan-vien-ban-hang/cuoc-hen/:id/bao-cao-ket-qua
   * Báo cáo kết quả cuộc hẹn (UC-SALE-05)
   */
  static async baoCaoKetQuaCuocHen(req, res) {
    try {
      const nhanVienId = req.user.id;
      const cuocHenId = parseInt(req.params.id);
      const { ketQua, khachQuanTam, lyDoThatBai, keHoachFollowUp, ghiChu } = req.body;

      const result = await NhanVienBanHangService.baoCaoKetQuaCuocHen(
        cuocHenId,
        nhanVienId,
        { ketQua, khachQuanTam, lyDoThatBai, keHoachFollowUp, ghiChu }
      );

      // Audit log
      await NhatKyHeThongService.ghiNhan(
        nhanVienId,
        'bao_cao_ket_qua_cuoc_hen',
        'CuocHen',
        cuocHenId,
        null,
        { ketQua, khachQuanTam, slaWarning: result.slaWarning },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Báo cáo kết quả thành công',
        data: result
      });
    } catch (error) {
      console.error('[NhanVienBanHangController] Lỗi baoCaoKetQuaCuocHen:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // ==================== GIAO DỊCH/CỌC (UC-SALE-04) ====================

  /**
   * GET /api/nhan-vien-ban-hang/giao-dich
   * Lấy danh sách cọc/giao dịch liên quan đến NVBH
   * Query từ bảng coc + hopdong (hệ thống mới)
   */
  static async layDanhSachGiaoDich(req, res) {
    try {
      const nhanVienId = req.user.id;
      const filters = {
        loai: req.query.loai,
        trangThai: req.query.trangThai,
        tuNgay: req.query.tuNgay,
        denNgay: req.query.denNgay,
        limit: req.query.limit || 50
      };

      // Map trạng thái frontend sang backend
      // Frontend: DaUyQuyen (chờ xác nhận), DaGhiNhan (đã xác nhận), DaHoanTien (đã hoàn)
      // Backend coc: HieuLuc, HetHan, DaGiaiToa, DaDoiTru
      const trangThaiMap = {
        DaUyQuyen: 'HieuLuc',      // Cọc hiệu lực = chờ xác nhận/đang giữ
        DaGhiNhan: 'DaDoiTru',     // Đã đối trừ vào hợp đồng = đã xác nhận
        DaHoanTien: 'DaGiaiToa'    // Đã giải tỏa = đã hoàn trả
      };

      // Map loại frontend sang backend
      const loaiMap = {
        COC_GIU_CHO: 'CocGiuCho',
        COC_AN_NINH: 'CocAnNinh'
      };

      const trangThaiBE = filters.trangThai && filters.trangThai !== 'all'
        ? trangThaiMap[filters.trangThai] || filters.trangThai
        : null;
      const loaiBE = filters.loai && filters.loai !== 'all'
        ? loaiMap[filters.loai] || filters.loai
        : null;

      // Query từ bảng coc với JOIN hopdong và cuochen
      const [danhSach] = await require('../config/db').execute(`
        SELECT 
          c.CocID as GiaoDichID,
          c.SoTien,
          c.Loai,
          c.TrangThai,
          c.TaoLuc as ThoiGian,
          c.TinDangID,
          c.PhongID,
          c.HetHanLuc,
          c.GhiChu,
          c.HopDongID,
          hd.KhachHangID,
          hd.NgayBatDau,
          hd.NgayKetThuc,
          hd.GiaThueCuoiCung,
          kh.TenDayDu as TenKhachHang,
          kh.SoDienThoai as SDTKhachHang,
          kh.Email as EmailKhachHang,
          td.TieuDe as TieuDeTinDang,
          da.TenDuAn,
          da.DiaChi as DiaChiDuAn,
          p.TenPhong
        FROM coc c
        LEFT JOIN hopdong hd ON c.HopDongID = hd.HopDongID OR (c.TinDangID = hd.TinDangID AND c.PhongID = hd.PhongID)
        LEFT JOIN nguoidung kh ON hd.KhachHangID = kh.NguoiDungID
        LEFT JOIN tindang td ON c.TinDangID = td.TinDangID
        LEFT JOIN duan da ON td.DuAnID = da.DuAnID
        LEFT JOIN phong p ON c.PhongID = p.PhongID
        WHERE hd.NhanVienBanHangID = ?
        ${loaiBE ? 'AND c.Loai = ?' : ''}
        ${trangThaiBE ? 'AND c.TrangThai = ?' : ''}
        ${filters.tuNgay && filters.denNgay ? 'AND c.TaoLuc BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)' : ''}
        ORDER BY c.TaoLuc DESC
        LIMIT ${Math.max(1, Math.min(100, parseInt(filters.limit) || 50))}
      `, [
        nhanVienId,
        ...(loaiBE ? [loaiBE] : []),
        ...(trangThaiBE ? [trangThaiBE] : []),
        ...(filters.tuNgay && filters.denNgay ? [filters.tuNgay, filters.denNgay] : [])
      ]);

      // Map lại trạng thái backend sang frontend
      const trangThaiReverseMap = {
        HieuLuc: 'DaUyQuyen',
        DaDoiTru: 'DaGhiNhan',
        DaGiaiToa: 'DaHoanTien',
        HetHan: 'DaHoanTien'
      };
      const loaiReverseMap = {
        CocGiuCho: 'COC_GIU_CHO',
        CocAnNinh: 'COC_AN_NINH'
      };

      const mappedList = danhSach.map(item => ({
        ...item,
        TrangThai: trangThaiReverseMap[item.TrangThai] || item.TrangThai,
        Loai: loaiReverseMap[item.Loai] || item.Loai
      }));

      res.json({
        success: true,
        message: 'Lấy danh sách giao dịch thành công',
        data: {
          giaoDichs: mappedList,
          tongSo: mappedList.length
        }
      });
    } catch (error) {
      console.error('[NhanVienBanHangController] Lỗi layDanhSachGiaoDich:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/nhan-vien-ban-hang/giao-dich/:id
   * Chi tiết cọc/giao dịch (query từ bảng coc)
   */
  static async xemChiTietGiaoDich(req, res) {
    try {
      const nhanVienId = req.user.id;
      const cocId = parseInt(req.params.id);

      const [rows] = await require('../config/db').execute(`
        SELECT 
          c.CocID as GiaoDichID,
          c.SoTien,
          c.Loai,
          c.TrangThai,
          c.TaoLuc as ThoiGian,
          c.CapNhatLuc,
          c.TinDangID,
          c.PhongID,
          c.HetHanLuc,
          c.GhiChu,
          c.HopDongID,
          c.ChinhSachCocID,
          c.TTL_Gio as TTL_CocGiuCho_Gio,
          c.TaoLuc as CocTaoLuc,
          c.CapNhatLuc as CocCapNhatLuc,
          
          hd.KhachHangID,
          hd.NgayBatDau,
          hd.NgayKetThuc,
          hd.GiaThueCuoiCung,
          hd.SoTienCoc as SoTienCocHopDong,
          
          kh.TenDayDu as TenKhachHang,
          kh.SoDienThoai as SDTKhachHang,
          kh.Email as EmailKhachHang,
          
          td.TieuDe as TieuDeTinDang,
          
          da.TenDuAn,
          da.DiaChi as DiaChiTinDang,
          
          p.TenPhong,
          
          cs.TenChinhSach,
          cs.TyLePhat_CocGiuCho as TyLePhat_CocGiuCho
        FROM coc c
        LEFT JOIN hopdong hd ON c.HopDongID = hd.HopDongID OR (c.TinDangID = hd.TinDangID AND c.PhongID = hd.PhongID)
        LEFT JOIN nguoidung kh ON hd.KhachHangID = kh.NguoiDungID
        LEFT JOIN tindang td ON c.TinDangID = td.TinDangID
        LEFT JOIN duan da ON td.DuAnID = da.DuAnID
        LEFT JOIN phong p ON c.PhongID = p.PhongID
        LEFT JOIN chinhsachcoc cs ON c.ChinhSachCocID = cs.ChinhSachCocID
        WHERE c.CocID = ?
        AND hd.NhanVienBanHangID = ?
      `, [cocId, nhanVienId]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy giao dịch hoặc không có quyền xem'
        });
      }

      // Map trạng thái backend sang frontend
      const trangThaiReverseMap = {
        HieuLuc: 'DaUyQuyen',
        DaDoiTru: 'DaGhiNhan',
        DaGiaiToa: 'DaHoanTien',
        HetHan: 'DaHoanTien'
      };
      const loaiReverseMap = {
        CocGiuCho: 'COC_GIU_CHO',
        CocAnNinh: 'COC_AN_NINH'
      };

      const result = {
        ...rows[0],
        TrangThai: trangThaiReverseMap[rows[0].TrangThai] || rows[0].TrangThai,
        Loai: loaiReverseMap[rows[0].Loai] || rows[0].Loai
      };

      res.json({
        success: true,
        message: 'Lấy chi tiết giao dịch thành công',
        data: result
      });
    } catch (error) {
      console.error('[NhanVienBanHangController] Lỗi xemChiTietGiaoDich:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/nhan-vien-ban-hang/giao-dich/:id/xac-nhan-coc
   * Xác nhận cọc (UC-SALE-04)
   */
  static async xacNhanCoc(req, res) {
    try {
      const nhanVienId = req.user.id;
      const giaoDichId = parseInt(req.params.id);

      await NhanVienBanHangService.xacNhanCoc(giaoDichId, nhanVienId);

      // Audit log
      await NhatKyHeThongService.ghiNhan(
        nhanVienId,
        'coc_xac_nhan_boi_sales',
        'GiaoDich',
        giaoDichId,
        { trangThai: 'DaUyQuyen' },
        { trangThai: 'DaGhiNhan' },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Xác nhận cọc thành công'
      });
    } catch (error) {
      console.error('[NhanVienBanHangController] Lỗi xacNhanCoc:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // ==================== BÁO CÁO THU NHẬP (UC-SALE-06) ====================

  /**
   * GET /api/nhan-vien-ban-hang/bao-cao/thu-nhap
   * Báo cáo thu nhập/hoa hồng
   */
  static async layBaoCaoThuNhap(req, res) {
    try {
      const nhanVienId = req.user.id;
      // Accept both tuNgay/denNgay and from/to for compatibility
      const tuNgay = req.query.tuNgay || req.query.from;
      const denNgay = req.query.denNgay || req.query.to;

      if (!tuNgay || !denNgay) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu tham số tuNgay/from và denNgay/to'
        });
      }

      const baoCao = await NhanVienBanHangService.tinhThuNhap(nhanVienId, { tuNgay, denNgay });

      res.json({
        success: true,
        message: 'Lấy báo cáo thu nhập thành công',
        data: baoCao
      });
    } catch (error) {
      console.error('[NhanVienBanHangController] Lỗi layBaoCaoThuNhap:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/nhan-vien-ban-hang/bao-cao/thong-ke
   * Thống kê hiệu suất
   */
  static async layThongKeHieuSuat(req, res) {
    try {
      const nhanVienId = req.user.id;
      const { tuNgay, denNgay } = req.query;

      const thongKeCuocHen = await BaoCaoThuNhapModel.layThongKeCuocHen(nhanVienId, { tuNgay, denNgay });
      const thongKeGiaoDich = await BaoCaoThuNhapModel.layThongKeGiaoDich(nhanVienId, { tuNgay, denNgay });

      res.json({
        success: true,
        message: 'Lấy thống kê hiệu suất thành công',
        data: {
          cuocHen: thongKeCuocHen,
          giaoDich: thongKeGiaoDich
        }
      });
    } catch (error) {
      console.error('[NhanVienBanHangController] Lỗi layThongKeHieuSuat:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/nhan-vien-ban-hang/bao-cao/cuoc-hen-theo-tuan
   * Cuộc hẹn theo tuần (cho chart)
   */
  static async layCuocHenTheoTuan(req, res) {
    try {
      const nhanVienId = req.user.id;
      const soTuan = parseInt(req.query.soTuan) || 4;

      const data = await BaoCaoThuNhapModel.layCuocHenTheoTuan(nhanVienId, soTuan);

      res.json({
        success: true,
        message: 'Lấy cuộc hẹn theo tuần thành công',
        data
      });
    } catch (error) {
      console.error('[NhanVienBanHangController] Lỗi layCuocHenTheoTuan:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ==================== DASHBOARD ====================

  /**
   * GET /api/nhan-vien-ban-hang/dashboard
   * Lấy metrics tổng quan cho dashboard
   */
  static async layDashboard(req, res) {
    try {
      const nhanVienId = req.user.id;

      const metrics = await NhanVienBanHangService.layMetricsDashboard(nhanVienId);
      const hieuSuat7Ngay = await BaoCaoThuNhapModel.layHieuSuat7Ngay(nhanVienId);

      // Lấy cuộc hẹn hôm nay
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const db = require('../config/db');
      
      const [cuocHenHomNay] = await db.execute(`
        SELECT 
          ch.CuocHenID,
          ch.ThoiGianHen,
          ch.TrangThai,
          kh.TenDayDu as TenKhachHang,
          p.TenPhong,
          td.TieuDe as TieuDeTinDang
        FROM cuochen ch
        LEFT JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        LEFT JOIN phong p ON ch.PhongID = p.PhongID
        LEFT JOIN tindang td ON ch.TinDangID = td.TinDangID
        WHERE ch.NhanVienBanHangID = ?
        AND ch.ThoiGianHen >= ? AND ch.ThoiGianHen < ?
        AND ch.TrangThai NOT IN ('HuyBoiKhach', 'HuyBoiHeThong')
        ORDER BY ch.ThoiGianHen ASC
      `, [nhanVienId, today, tomorrow]);

      // Lấy lịch làm việc tuần này cho mini calendar
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const [lichLamViecTuan] = await db.execute(`
        SELECT 
          DATE(BatDau) as Ngay,
          COUNT(*) as SoCa
        FROM lichlamviec
        WHERE NhanVienBanHangID = ?
        AND BatDau >= ? AND BatDau <= ?
        GROUP BY DATE(BatDau)
      `, [nhanVienId, weekStart, weekEnd]);

      // Lấy hoạt động gần đây (giao dịch và cuộc hẹn)
      const [giaoDichGanDay] = await db.execute(`
        SELECT DISTINCT
          gd.GiaoDichID,
          gd.SoTien,
          gd.Loai,
          gd.TrangThai,
          gd.ThoiGian,
          kh.TenDayDu as TenKhachHang,
          td.TieuDe as TieuDeTinDang
        FROM giaodich gd
        INNER JOIN coc c ON gd.GiaoDichID = c.GiaoDichID
        LEFT JOIN hopdong hd ON c.HopDongID = hd.HopDongID OR (c.TinDangID = hd.TinDangID AND c.PhongID = hd.PhongID)
        LEFT JOIN cuochen ch ON (c.TinDangID = ch.TinDangID AND c.PhongID = ch.PhongID)
        LEFT JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID OR hd.KhachHangID = kh.NguoiDungID
        LEFT JOIN tindang td ON gd.TinDangLienQuanID = td.TinDangID
        WHERE (hd.NhanVienBanHangID = ? OR ch.NhanVienBanHangID = ?)
        AND gd.Loai IN ('COC_GIU_CHO', 'COC_AN_NINH')
        ORDER BY gd.ThoiGian DESC
        LIMIT 5
      `, [nhanVienId, nhanVienId]);

      const [cuocHenGanDay] = await db.execute(`
        SELECT 
          ch.CuocHenID,
          ch.ThoiGianHen,
          ch.TrangThai,
          kh.TenDayDu as TenKhachHang,
          p.TenPhong,
          td.TieuDe as TieuDeTinDang
        FROM cuochen ch
        LEFT JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        LEFT JOIN phong p ON ch.PhongID = p.PhongID
        LEFT JOIN tindang td ON ch.TinDangID = td.TinDangID
        WHERE ch.NhanVienBanHangID = ?
        ORDER BY ch.ThoiGianHen DESC
        LIMIT 5
      `, [nhanVienId]);

      // Tạo danh sách activities từ giao dịch và cuộc hẹn
      const activities = [];
      
      // Thêm activities từ giao dịch
      giaoDichGanDay.forEach(gd => {
        activities.push({
          type: 'giaoDich',
          id: gd.GiaoDichID,
          status: gd.TrangThai,
          message: `Giao dịch #GD${gd.GiaoDichID} cho khách hàng ${gd.TenKhachHang || 'Khách hàng'} ${gd.TrangThai === 'DaXacNhan' ? 'đã được xác nhận thành công' : 'đang chờ xử lý'}.`,
          time: gd.ThoiGian,
          highlight: `#GD${gd.GiaoDichID}`
        });
      });

      // Thêm activities từ cuộc hẹn sắp tới (trong 2 giờ)
      const now = new Date();
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      
      cuocHenGanDay.forEach(ch => {
        const thoiGianHen = new Date(ch.ThoiGianHen);
        if (thoiGianHen > now && thoiGianHen <= twoHoursLater) {
          const hoursUntil = Math.round((thoiGianHen - now) / (60 * 60 * 1000));
          activities.push({
            type: 'cuocHen',
            id: ch.CuocHenID,
            status: 'warning',
            message: `Cuộc hẹn với ${ch.TenKhachHang || 'Khách hàng'} sắp diễn ra trong ${hoursUntil} giờ nữa.`,
            time: ch.ThoiGianHen
          });
        }
      });

      // Sắp xếp theo thời gian (mới nhất trước)
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));

      res.json({
        success: true,
        message: 'Lấy dashboard thành công',
        data: {
          metrics,
          hieuSuat7Ngay,
          cuocHenHomNay,
          lichLamViecTuan: lichLamViecTuan.reduce((acc, item) => {
            let key = item.Ngay;
            if (item.Ngay instanceof Date) {
              const year = item.Ngay.getFullYear();
              const month = String(item.Ngay.getMonth() + 1).padStart(2, '0');
              const day = String(item.Ngay.getDate()).padStart(2, '0');
              key = `${year}-${month}-${day}`;
            } else if (typeof item.Ngay === 'string') {
              key = item.Ngay.split('T')[0];
            }
            acc[key] = item.SoCa;
            return acc;
          }, {}),
          activities: activities.slice(0, 5) // Chỉ lấy 5 activities gần nhất
        }
      });
    } catch (error) {
      console.error('[NhanVienBanHangController] Lỗi layDashboard:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/nhan-vien-ban-hang/ho-so
   * Lấy thông tin hồ sơ nhân viên
   */
  static async layHoSo(req, res) {
    try {
      const nhanVienId = req.user.id;

      const [rows] = await require('../config/db').execute(`
        SELECT 
          hs.*,
          nd.TenDayDu,
          nd.Email,
          nd.SoDienThoai,
          COALESCE(lc.CommuneName, lp.ProvinceName) as TenKhuVucChinh
        FROM hosonhanvien hs
        LEFT JOIN nguoidung nd ON hs.NguoiDungID = nd.NguoiDungID
        LEFT JOIN legacy_communes lc ON hs.KhuVucChinhID = lc.CommuneID
        LEFT JOIN legacy_provinces lp ON hs.KhuVucChinhID = lp.ProvinceID
        WHERE hs.NguoiDungID = ?
      `, [nhanVienId]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy hồ sơ nhân viên'
        });
      }

      res.json({
        success: true,
        message: 'Lấy hồ sơ thành công',
        data: rows[0]
      });
    } catch (error) {
      console.error('[NhanVienBanHangController] Lỗi layHoSo:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PUT /api/nhan-vien-ban-hang/ho-so
   * Cập nhật hồ sơ (thông tin không nhạy cảm)
   */
  static async capNhatHoSo(req, res) {
    try {
      const nhanVienId = req.user.id;
      const { ghiChu } = req.body; // Chỉ cho phép cập nhật ghi chú

      await require('../config/db').execute(
        'UPDATE hosonhanvien SET GhiChu = ? WHERE NguoiDungID = ?',
        [ghiChu, nhanVienId]
      );

      res.json({
        success: true,
        message: 'Cập nhật hồ sơ thành công'
      });
    } catch (error) {
      console.error('[NhanVienBanHangController] Lỗi capNhatHoSo:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = NhanVienBanHangController;



