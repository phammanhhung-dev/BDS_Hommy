/**
 * Controller cho Chủ dự án
 * Xử lý các request liên quan đến nghiệp vụ của chủ dự án
 */

const ChuDuAnModel = require('../models/ChuDuAnModel');
const NhatKyHeThongService = require('../services/NhatKyHeThongService');
const HoaHongService = require('../services/HoaHongService');

/**
 * @typedef {Object} ResponseFormat
 * @property {boolean} success
 * @property {string} message
 * @property {*} data
 */

class ChuDuAnController {
  /**
   * UC-PROJ-01: Đăng tin cho thuê
   * POST /api/chu-du-an/tin-dang
   */
  static async taoTinDang(req, res) {
    try {
      const chuDuAnId = req.user.id; // Từ middleware auth
      const tinDangData = req.body;

      console.log('📥 Backend nhận dữ liệu:', JSON.stringify(tinDangData, null, 2));

      // Validate dữ liệu đầu vào
      if (!tinDangData.TieuDe) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc: TieuDe'
        });
      }

      // PhongIDs giờ là optional - chỉ validate nếu có gửi lên
      if (tinDangData.PhongIDs && Array.isArray(tinDangData.PhongIDs) && tinDangData.PhongIDs.length > 0) {
        const phongIdKhongHopLe = tinDangData.PhongIDs.some(item => !item || !item.PhongID);
        if (phongIdKhongHopLe) {
          return res.status(400).json({
            success: false,
            message: 'Danh sách phòng không hợp lệ'
          });
        }
      }

      const tinDangId = await ChuDuAnModel.taoTinDang(chuDuAnId, tinDangData);

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan(
        chuDuAnId,
        'tao_tin_dang',
        'TinDang',
        tinDangId,
        null,
        { trangThai: 'Nhap', tieuDe: tinDangData.TieuDe },
        req.ip,
        req.get('User-Agent')
      );

      res.status(201).json({
        success: true,
        message: 'Tạo tin đăng thành công',
        data: { tinDangId }
      });
    } catch (error) {
      console.error('Lỗi tạo tin đăng:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * UC-PROJ-01: Lấy danh sách tin đăng của chủ dự án
   * GET /api/chu-du-an/tin-dang
   */
  static async layDanhSachTinDang(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const filters = {
        trangThai: req.query.trangThai,
        duAnId: req.query.duAnId,
        keyword: req.query.keyword,
        limit: req.query.limit || 20
      };

      const danhSach = await ChuDuAnModel.layDanhSachTinDang(chuDuAnId, filters);

      res.json({
        success: true,
        message: 'Lấy danh sách tin đăng thành công',
        data: {
          tinDangs: danhSach,
          tongSo: danhSach.length,
          filters: filters
        }
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách tin đăng:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * UC-PROJ-01: Lấy chi tiết tin đăng
   * GET /api/chu-du-an/tin-dang/:id
   */
  static async layChiTietTinDang(req, res) {
    try {
      // 🧪 DEV: Allow testing without auth (fallback to owner ID from DB)
      const chuDuAnId = req.user?.id || null; // NULL allows fetching without ownership check
      const tinDangId = parseInt(req.params.id);

      if (!tinDangId) {
        return res.status(400).json({
          success: false,
          message: 'ID tin đăng không hợp lệ'
        });
      }

      const tinDang = await ChuDuAnModel.layChiTietTinDang(tinDangId, chuDuAnId);

      if (!tinDang) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tin đăng hoặc không có quyền truy cập'
        });
      }

      res.json({
        success: true,
        message: 'Lấy chi tiết tin đăng thành công',
        data: tinDang
      });
    } catch (error) {
      console.error('Lỗi lấy chi tiết tin đăng:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy danh sách phòng của tin đăng
   * GET /api/chu-du-an/tin-dang/:id/phong
   */
  static async layDanhSachPhong(req, res) {
    try {
      const tinDangId = parseInt(req.params.id);
      
      if (!tinDangId) {
        return res.status(400).json({
          success: false,
          message: 'ID tin đăng không hợp lệ'
        });
      }

      const phongs = await ChuDuAnModel.layDanhSachPhong(tinDangId);

      res.json({
        success: true,
        message: 'Lấy danh sách phòng thành công',
        data: phongs
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách phòng:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * UC-PROJ-01: Cập nhật tin đăng
   * PUT /api/chu-du-an/tin-dang/:id
   */
  static async capNhatTinDang(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const tinDangId = parseInt(req.params.id);
      const updateData = req.body;

      if (!tinDangId) {
        return res.status(400).json({
          success: false,
          message: 'ID tin đăng không hợp lệ'
        });
      }

      const ketQua = await ChuDuAnModel.capNhatTinDang(tinDangId, chuDuAnId, updateData);

      if (ketQua) {
        // Ghi audit log
        await NhatKyHeThongService.ghiNhan(
          chuDuAnId,
          'cap_nhat_tin_dang',
          'TinDang',
          tinDangId,
          { trangThai: 'Cũ' },
          { trangThai: 'Nhap', ...updateData },
          req.ip,
          req.get('User-Agent')
        );

        res.json({
          success: true,
          message: 'Cập nhật tin đăng thành công'
        });
      }
    } catch (error) {
      console.error('Lỗi cập nhật tin đăng:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * UC-PROJ-01: Gửi tin đăng để duyệt
   * POST /api/chu-du-an/tin-dang/:id/gui-duyet
   */
  static async guiTinDangDeDuyet(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const tinDangId = parseInt(req.params.id);

      if (!tinDangId) {
        return res.status(400).json({
          success: false,
          message: 'ID tin đăng không hợp lệ'
        });
      }

      const ketQua = await ChuDuAnModel.guiTinDangDeDuyet(tinDangId, chuDuAnId);

      if (ketQua) {
        // Ghi audit log
        await NhatKyHeThongService.ghiNhan(
          chuDuAnId,
          'gui_tin_dang_de_duyet',
          'TinDang',
          tinDangId,
          { trangThai: 'Nhap' },
          { trangThai: 'ChoDuyet' },
          req.ip,
          req.get('User-Agent')
        );

        res.json({
          success: true,
          message: 'Gửi tin đăng để duyệt thành công'
        });
      }
    } catch (error) {
      console.error('Lỗi gửi tin đăng để duyệt:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * UC-PROJ-02: Quản lý cuộc hẹn xem phòng
   * GET /api/chu-du-an/cuoc-hen
   */
  static async layDanhSachCuocHen(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const filters = {
        trangThai: req.query.trangThai,
        tinDangId: req.query.tinDangId,
        tuNgay: req.query.tuNgay,
        denNgay: req.query.denNgay,
        limit: req.query.limit || 50
      };

      const danhSach = await ChuDuAnModel.layDanhSachCuocHen(chuDuAnId, filters);

      res.json({
        success: true,
        message: 'Lấy danh sách cuộc hẹn thành công',
        data: {
          cuocHens: danhSach,
          tongSo: danhSach.length,
          filters: filters
        }
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách cuộc hẹn:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * UC-PROJ-02: Xác nhận cuộc hẹn
   * POST /api/chu-du-an/cuoc-hen/:id/xac-nhan
   */
  static async xacNhanCuocHen(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const cuocHenId = parseInt(req.params.id);
      const { ghiChu } = req.body;

      if (!cuocHenId) {
        return res.status(400).json({
          success: false,
          message: 'ID cuộc hẹn không hợp lệ'
        });
      }

      const ketQua = await ChuDuAnModel.xacNhanCuocHen(cuocHenId, chuDuAnId, ghiChu);

      if (ketQua) {
        // Ghi audit log
        await NhatKyHeThongService.ghiNhan(
          chuDuAnId,
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
      }
    } catch (error) {
      console.error('Lỗi xác nhận cuộc hẹn:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy metrics/thống kê cuộc hẹn
   * GET /api/chu-du-an/cuoc-hen/metrics
   */
  static async layMetricsCuocHen(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const metrics = await ChuDuAnModel.layMetricsCuocHen(chuDuAnId);

      res.json({
        success: true,
        message: 'Lấy metrics cuộc hẹn thành công',
        data: metrics
      });
    } catch (error) {
      console.error('Lỗi lấy metrics cuộc hẹn:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Phê duyệt cuộc hẹn
   * POST /api/chu-du-an/cuoc-hen/:id/phe-duyet
   */
  static async pheDuyetCuocHen(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const cuocHenId = parseInt(req.params.id);
      const { phuongThucVao, ghiChu } = req.body;

      // Validation
      if (!cuocHenId) {
        return res.status(400).json({
          success: false,
          message: 'ID cuộc hẹn không hợp lệ'
        });
      }

      if (!phuongThucVao || phuongThucVao.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Phương thức vào là bắt buộc'
        });
      }

      const ketQua = await ChuDuAnModel.pheDuyetCuocHen(
        cuocHenId, 
        chuDuAnId, 
        phuongThucVao, 
        ghiChu
      );

      if (ketQua) {
        // Ghi audit log
        await NhatKyHeThongService.ghiNhan(
          chuDuAnId,
          'phe_duyet_cuoc_hen',
          'CuocHen',
          cuocHenId,
          { pheDuyetChuDuAn: 'ChoPheDuyet' },
          { 
            pheDuyetChuDuAn: 'DaPheDuyet', 
            phuongThucVao,
            ghiChu 
          },
          req.ip,
          req.get('User-Agent')
        );

        // Gửi thông báo cho NVBH (async, không chờ)
        // Lấy NhanVienBanHangID từ cuộc hẹn
        const ThongBaoService = require('../services/ThongBaoService');
        const db = require('../config/db');
        const [cuocHen] = await db.execute(
          'SELECT NhanVienBanHangID FROM cuochen WHERE CuocHenID = ?',
          [cuocHenId]
        );
        
        if (cuocHen.length > 0 && cuocHen[0].NhanVienBanHangID) {
          ThongBaoService.thongBaoCuocHenDaPheDuyet(cuocHenId, cuocHen[0].NhanVienBanHangID)
            .catch(err => console.error('[ChuDuAnController] Lỗi gửi thông báo đã phê duyệt:', err));
        }

        res.json({
          success: true,
          message: 'Phê duyệt cuộc hẹn thành công'
        });
      }
    } catch (error) {
      console.error('Lỗi phê duyệt cuộc hẹn:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Từ chối cuộc hẹn
   * POST /api/chu-du-an/cuoc-hen/:id/tu-choi
   */
  static async tuChoiCuocHen(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const cuocHenId = parseInt(req.params.id);
      const { lyDoTuChoi } = req.body;

      // Validation
      if (!cuocHenId) {
        return res.status(400).json({
          success: false,
          message: 'ID cuộc hẹn không hợp lệ'
        });
      }

      if (!lyDoTuChoi || lyDoTuChoi.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Lý do từ chối là bắt buộc'
        });
      }

      const ketQua = await ChuDuAnModel.tuChoiCuocHen(
        cuocHenId, 
        chuDuAnId, 
        lyDoTuChoi
      );

      if (ketQua) {
        // Ghi audit log
        await NhatKyHeThongService.ghiNhan(
          chuDuAnId,
          'tu_choi_cuoc_hen',
          'CuocHen',
          cuocHenId,
          { pheDuyetChuDuAn: 'ChoPheDuyet' },
          { 
            pheDuyetChuDuAn: 'TuChoi',
            trangThai: 'DaTuChoi',
            lyDoTuChoi 
          },
          req.ip,
          req.get('User-Agent')
        );

        // Gửi thông báo cho NVBH (async, không chờ)
        // Lấy NhanVienBanHangID từ cuộc hẹn
        const ThongBaoService = require('../services/ThongBaoService');
        const db = require('../config/db');
        const [cuocHen] = await db.execute(
          'SELECT NhanVienBanHangID FROM cuochen WHERE CuocHenID = ?',
          [cuocHenId]
        );
        
        if (cuocHen.length > 0 && cuocHen[0].NhanVienBanHangID) {
          ThongBaoService.thongBaoCuocHenTuChoi(cuocHenId, cuocHen[0].NhanVienBanHangID, lyDoTuChoi)
            .catch(err => console.error('[ChuDuAnController] Lỗi gửi thông báo từ chối:', err));
        }

        res.json({
          success: true,
          message: 'Từ chối cuộc hẹn thành công'
        });
      }
    } catch (error) {
      console.error('Lỗi từ chối cuộc hẹn:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Xử lý hàng loạt cuộc hẹn (Bulk action: phe-duyet / xac-nhan / tu-choi)
   */
  static async xuLyHangLoatCuocHen(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const { action, cuocHenIds } = req.body;

      if (!Array.isArray(cuocHenIds) || cuocHenIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn ít nhất 1 cuộc hẹn'
        });
      }

      let successCount = 0;
      for (const id of cuocHenIds) {
        const cuocHenId = parseInt(id, 10);
        if (!cuocHenId) continue;

        try {
          if (action === 'phe-duyet' || action === 'pheDuyet') {
            await ChuDuAnModel.pheDuyetCuocHen(cuocHenId, chuDuAnId, 'Xác nhận theo lô', 'Duyệt hàng loạt');
            successCount++;
          } else if (action === 'xac-nhan' || action === 'xacNhan') {
            await ChuDuAnModel.xacNhanCuocHen(cuocHenId, chuDuAnId, 'Xác nhận hàng loạt');
            successCount++;
          } else if (action === 'tu-choi' || action === 'tuChoi') {
            await ChuDuAnModel.tuChoiCuocHen(cuocHenId, chuDuAnId, 'Từ chối hàng loạt');
            successCount++;
          }
        } catch (err) {
          console.error(`Lỗi xử lý hàng loạt cuộc hẹn #${cuocHenId}:`, err.message);
        }
      }

      return res.json({
        success: true,
        message: `Đã xử lý thành công ${successCount}/${cuocHenIds.length} cuộc hẹn`,
        data: { count: successCount }
      });
    } catch (error) {
      console.error('Lỗi bulk action cuộc hẹn:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi xử lý hàng loạt cuộc hẹn: ' + error.message
      });
    }
  }

  /**
   * UC-PROJ-03: Xem báo cáo hiệu suất
   * GET /api/chu-du-an/bao-cao
   */
  static async layBaoCaoHieuSuat(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const filters = {
        tuNgay: req.query.tuNgay,
        denNgay: req.query.denNgay
      };

      const baoCao = await ChuDuAnModel.layBaoCaoHieuSuat(chuDuAnId, filters);

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan(
        chuDuAnId,
        'chu_du_an_xem_bao_cao',
        'BaoCao',
        null,
        null,
        { loaiBaoCao: 'HieuSuat', ...filters },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Lấy báo cáo hiệu suất thành công',
        data: baoCao
      });
    } catch (error) {
      console.error('Lỗi lấy báo cáo hiệu suất:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy danh sách dự án của chủ dự án
   * GET /api/chu-du-an/du-an
   */
  static async layDanhSachDuAn(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const danhSach = await ChuDuAnModel.layDanhSachDuAn(chuDuAnId);

      res.json({
        success: true,
        message: 'Lấy danh sách dự án thành công',
        data: danhSach
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách dự án:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async layChiTietDuAn(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const duAnId = req.params.id;
      const duAn = await ChuDuAnModel.layChiTietDuAn(duAnId, chuDuAnId);
      
      if (!duAn) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy dự án'
        });
      }
      
      res.json({
        success: true,
        data: duAn
      });
    } catch (error) {
      console.error('Lỗi lấy chi tiết dự án:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy danh sách khu vực theo parent (null = Tỉnh/TP)
   */
  static async layDanhSachKhuVuc(req, res) {
    try {
      let { parentId } = req.query;
      if (
        parentId === undefined ||
        parentId === null ||
        parentId === '' ||
        parentId === 'null' ||
        parentId === 'root'
      ) {
        parentId = null;
      } else {
        const parsed = Number(parentId);
        if (Number.isNaN(parsed)) {
          return res.status(400).json({ success: false, message: 'parentId không hợp lệ' });
        }
        parentId = parsed;
      }
      const danhSach = await ChuDuAnModel.layDanhSachKhuVuc(parentId);
      return res.json({ success: true, data: danhSach });
    } catch (error) {
      console.error('Lỗi lấy danh sách khu vực:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Tạo mới Dự án (đơn giản cho Chủ dự án tự tạo nhanh khi đăng tin)
   */
  static async taoDuAn(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const { TenDuAn, DiaChi } = req.body;
      if (!TenDuAn) {
        return res.status(400).json({ success: false, message: 'Thiếu TenDuAn' });
      }

      const duAnId = await ChuDuAnModel.taoDuAnNhanh({
        TenDuAn,
        DiaChi: DiaChi || '',
        ChuDuAnID: chuDuAnId
      });

      res.status(201).json({ success: true, duAnId });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async capNhatDuAn(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const duAnId = parseInt(req.params.id, 10);

      if (Number.isNaN(duAnId)) {
        return res.status(400).json({
          success: false,
          message: 'ID dự án không hợp lệ'
        });
      }

      const allowedFields = [
        'TenDuAn',
        'DiaChi',
        'ViDo',
        'KinhDo',
        'YeuCauPheDuyetChu',
        'PhuongThucVao',
        'TrangThai',
        'ChinhSachCocID',
        'BangHoaHong',
        'SoThangCocToiThieu'
      ];

      const payload = {};
      allowedFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          payload[field] = req.body[field];
        }
      });

      // Debug: Log payload để kiểm tra BangHoaHong
      console.log('[ChuDuAnController.capNhatDuAn] DuAnID:', duAnId, 'Payload:', JSON.stringify(payload, null, 2));

      if (Object.keys(payload).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Không có dữ liệu để cập nhật'
        });
      }

      console.log('[ChuDuAnController.capNhatDuAn] Calling Model.capNhatDuAn...');
      const duAn = await ChuDuAnModel.capNhatDuAn(duAnId, chuDuAnId, payload);
      console.log('[ChuDuAnController.capNhatDuAn] Model returned:', duAn ? 'SUCCESS' : 'NULL');

      if (!duAn) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy dự án hoặc bạn không có quyền truy cập'
        });
      }

      await NhatKyHeThongService.ghiNhan(
        chuDuAnId,
        'cap_nhat_du_an',
        'DuAn',
        duAnId,
        null,
        payload,
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Cập nhật dự án thành công',
        data: duAn
      });
    } catch (error) {
      console.error('Lỗi cập nhật dự án:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async luuTruDuAn(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const duAnId = parseInt(req.params.id, 10);

      if (Number.isNaN(duAnId)) {
        return res.status(400).json({
          success: false,
          message: 'ID dự án không hợp lệ'
        });
      }

      const lyDo = req.body?.lyDo || null;

      const duAn = await ChuDuAnModel.luuTruDuAn(duAnId, chuDuAnId);

      if (!duAn) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy dự án hoặc bạn không có quyền truy cập'
        });
      }

      await NhatKyHeThongService.ghiNhan(
        chuDuAnId,
        'luu_tru_du_an',
        'DuAn',
        duAnId,
        null,
        { lyDo: lyDo || undefined },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Lưu trữ dự án thành công',
        data: duAn
      });
    } catch (error) {
      console.error('Lỗi lưu trữ dự án:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async layChiTietChinhSachCoc(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const chinhSachId = parseInt(req.params.id, 10);

      if (Number.isNaN(chinhSachId)) {
        return res.status(400).json({
          success: false,
          message: 'ID chính sách không hợp lệ'
        });
      }

      const chinhSach = await ChuDuAnModel.layChiTietChinhSachCoc(chuDuAnId, chinhSachId);

      if (!chinhSach) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chính sách cọc hoặc bạn không có quyền truy cập'
        });
      }

      res.json({
        success: true,
        message: 'Lấy chi tiết chính sách cọc thành công',
        data: chinhSach
      });
    } catch (error) {
      console.error('Lỗi lấy chi tiết chính sách cọc:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async capNhatChinhSachCoc(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const chinhSachId = parseInt(req.params.id, 10);

      if (Number.isNaN(chinhSachId)) {
        return res.status(400).json({
          success: false,
          message: 'ID chính sách không hợp lệ'
        });
      }

      const allowedFields = [
        'TenChinhSach',
        'MoTa',
        'ChoPhepCocGiuCho',
        'TTL_CocGiuCho_Gio',
        'TyLePhat_CocGiuCho',
        'ChoPhepCocAnNinh',
        'QuyTacGiaiToa',
        'HieuLuc'
      ];

      const payload = {};
      allowedFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          payload[field] = req.body[field];
        }
      });

      if (Object.keys(payload).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Không có dữ liệu để cập nhật'
        });
      }

      const chinhSach = await ChuDuAnModel.capNhatChinhSachCoc(chuDuAnId, chinhSachId, payload);

      if (!chinhSach) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chính sách cọc hoặc bạn không có quyền truy cập'
        });
      }

      await NhatKyHeThongService.ghiNhan(
        chuDuAnId,
        'cap_nhat_chinh_sach_coc',
        'ChinhSachCoc',
        chinhSachId,
        null,
        payload,
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Cập nhật chính sách cọc thành công',
        data: chinhSach
      });
    } catch (error) {
      console.error('Lỗi cập nhật chính sách cọc:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lưu nháp tin đăng
   * POST /api/chu-du-an/tin-dang/nhap
   */
  static async luuNhapTinDang(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const tinDangData = {
        ...req.body,
        TrangThai: 'Nhap' // Đảm bảo trạng thái là Nháp
      };

      // Validate cơ bản (không yêu cầu đầy đủ như khi gửi duyệt)
      if (!tinDangData.DuAnID) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin dự án'
        });
      }

      const tinDangId = await ChuDuAnModel.taoTinDang(chuDuAnId, tinDangData);

      res.status(201).json({
        success: true,
        message: 'Lưu nháp thành công',
        tinDangId
      });
    } catch (error) {
      console.error('Lỗi lưu nháp tin đăng:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * UC-PROJ-04: Báo cáo hợp đồng cho thuê
   * POST /api/chu-du-an/hop-dong/bao-cao
   */
  static async baoCaoHopDongChoThue(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const { phongId, khachHangId, thongTinHopDong } = req.body;

      if (!phongId || !khachHangId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin phòng hoặc khách hàng'
        });
      }

      // TODO: Implement logic báo cáo hợp đồng
      // - Kiểm tra quyền sở hữu phòng
      // - Kiểm tra trạng thái phòng (GiuCho)
      // - Kiểm tra giao dịch cọc hợp lệ
      // - Chuyển trạng thái phòng sang DaThue
      // - Chuẩn bị giải tỏa TiềnTạmGiữ

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan(
        chuDuAnId,
        'bao_cao_hop_dong_thue',
        'Phong',
        phongId,
        { trangThai: 'GiuCho' },
        { trangThai: 'DaThue', khachHangId, ...thongTinHopDong },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Báo cáo hợp đồng cho thuê thành công',
        data: {
          phongId,
          khachHangId,
          trangThaiMoi: 'DaThue'
        }
      });
    } catch (error) {
      console.error('Lỗi báo cáo hợp đồng:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Tạo nhanh dự án (dùng từ modal trong trang tạo tin đăng)
   * POST /api/chu-du-an/du-an/tao-nhanh
   */
  static async taoNhanhDuAn(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const { TenDuAn, DiaChi, ViDo, KinhDo, YeuCauPheDuyetChu, PhuongThucVao, ThongTinMoRong, TrangThai } = req.body;

      // Validate
      if (!TenDuAn || !TenDuAn.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tên dự án không được để trống'
        });
      }

      if (!DiaChi || !DiaChi.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Địa chỉ không được để trống'
        });
      }

      // Nếu không yêu cầu phê duyệt thì phải có phương thức vào
      if (!YeuCauPheDuyetChu && (!PhuongThucVao || !PhuongThucVao.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Phương thức vào dự án là bắt buộc khi không yêu cầu phê duyệt'
        });
      }

      // Tạo dự án với thông tin đầy đủ (bao gồm tọa độ & metadata mở rộng)
      const duAnId = await ChuDuAnModel.taoDuAn(chuDuAnId, {
        TenDuAn: TenDuAn.trim(),
        DiaChi: DiaChi.trim(),
        ViDo: ViDo || null,
        KinhDo: KinhDo || null,
        YeuCauPheDuyetChu: YeuCauPheDuyetChu ? 1 : 0,
        PhuongThucVao: YeuCauPheDuyetChu ? null : (PhuongThucVao ? PhuongThucVao.trim() : null),
        ThongTinMoRong: ThongTinMoRong || null,
        TrangThai: TrangThai || 'HoatDong'
      });

      // Lấy thông tin dự án vừa tạo
      const duAn = await ChuDuAnModel.layChiTietDuAn(duAnId, chuDuAnId);

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan(
        chuDuAnId,
        'tao_nhanh_du_an',
        'DuAn',
        duAnId,
        null,
        { tenDuAn: TenDuAn, diaChi: DiaChi },
        req.ip,
        req.get('User-Agent')
      );

      res.status(201).json({
        success: true,
        message: 'Tạo dự án thành công',
        duAn: duAn
      });
    } catch (error) {
      console.error('Lỗi tạo nhanh dự án:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Dashboard tổng quan cho chủ dự án
   * GET /api/chu-du-an/dashboard
   */
  static async layDashboard(req, res) {
    try {
      const chuDuAnId = req.user.id;
      
      // Lấy thống kê nhanh và dữ liệu cần thiết
      const [tinDangs, cuocHens, duAns, thongKeTong, thongKePhong] = await Promise.all([
        ChuDuAnModel.layDanhSachTinDang(chuDuAnId, { limit: 5 }),
        ChuDuAnModel.layDanhSachCuocHen(chuDuAnId, { limit: 10 }),
        ChuDuAnModel.layDanhSachDuAn(chuDuAnId),
        ChuDuAnModel.layBaoCaoHieuSuat(chuDuAnId),
        ChuDuAnModel.layThongKePhong(chuDuAnId)
      ]);

      const cuocHenSapToi = cuocHens.filter(ch => 
        new Date(ch.ThoiGianHen) > new Date() && 
        ['ChoXacNhan', 'DaXacNhan'].includes(ch.TrangThai)
      );

      const tongQuan = thongKeTong?.tongQuan || {};
      const tuongTac = thongKeTong?.tuongTac || {};
      const coc = thongKeTong?.coc || {};

      // ✨ Tính toán cọc hoàn về cho chủ dự án theo công thức mới
      // cocHoanVeChuDuAn = soTienCoc - doanhThuCongTy
      let tongCocHoanVeChuDuAn = 0;
      let tongDoanhThuCongTy = 0;
      
      try {
        // Lấy danh sách hợp đồng của chủ dự án trong tháng này
        console.log('📊 [Dashboard] Đang gọi HoaHongService.baoCaoDoanhThuChuDuAn với chuDuAnId:', chuDuAnId);
        const doanhThuResult = await HoaHongService.baoCaoDoanhThuChuDuAn(chuDuAnId);
        console.log('📊 [Dashboard] Kết quả từ HoaHongService:', doanhThuResult);
        if (doanhThuResult) {
          tongCocHoanVeChuDuAn = doanhThuResult.tongCocHoanVeChuDuAn || 0;
          tongDoanhThuCongTy = doanhThuResult.tongDoanhThuCongTy || 0;
        }
        console.log('📊 [Dashboard] Giá trị cuối cùng:', { tongCocHoanVeChuDuAn, tongDoanhThuCongTy });
      } catch (err) {
        console.warn('⚠️ Không thể tính hoa hồng cho Chủ dự án:', err.message);
        // Fallback: Sử dụng giá trị cọc cũ nếu không tính được
        tongCocHoanVeChuDuAn = coc.TongTienCoc || 0;
      }

      const summary = {
        tongTinDang: tongQuan.TongTinDang || 0,
        tinDangDangHoatDong: tongQuan.TinDangDaDang || 0,
        tinDangChoDuyet: tongQuan.TinDangChoDuyet || 0,
        tinDangNhap: tongQuan.TinDangNhap || 0,
        tinDangTamNgung: tongQuan.TinDangTamNgung || 0,
        tinDangDaDuyet: tongQuan.TinDangDaDuyet || 0,
        tinDangTuChoi: tongQuan.TinDangTuChoi || 0,
        giaTrungBinh: tongQuan.GiaTrungBinh || 0,
        tongDienTich: tongQuan.TongDienTich || 0,
        tongPhong: thongKePhong.TongPhong || 0,
        tongPhongTrong: thongKePhong.PhongTrong || 0,
        tongPhongDaThue: thongKePhong.PhongDaThue || 0,
        tongPhongGiuCho: thongKePhong.PhongGiuCho || 0,
        tongPhongDonDep: thongKePhong.PhongDonDep || 0,
        tongLuotXem: tuongTac.TongLuotXem || 0,
        tongYeuThich: tuongTac.TongYeuThich || 0,
        luotXemHomNay: tuongTac.LuotXemHomNay || 0,
        yeuThichHomNay: tuongTac.YeuThichHomNay || 0,
        tongGiaoDichCoc: coc.TongGiaoDichCoc || 0,
        tongTienCoc: coc.TongTienCoc || 0,
        doanhThuThang: coc.TongTienCocThangNay || 0,
        // ✨ Thêm các field mới theo công thức hoa hồng
        cocHoanVeChuDuAnThang: tongCocHoanVeChuDuAn, // Số tiền cọc sau khi trừ hoa hồng
        doanhThuCongTyThang: tongDoanhThuCongTy, // Phần công ty giữ lại
        cuocHenSapToi: cuocHenSapToi.length // Số lượng cuộc hẹn sắp tới
      };

      res.json({
        success: true,
        message: 'Lấy dashboard thành công',
        data: {
          ...summary, // Spread summary vào data level để frontend access dễ hơn
          tinDangGanDay: tinDangs,
          cuocHenSapToiList: cuocHenSapToi, // Array cuộc hẹn chi tiết
          duAns
        }
      });
    } catch (error) {
      console.error('Lỗi lấy dashboard:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy tin đăng để chỉnh sửa
   * GET /api/chu-du-an/chinh-sua-tin-dang/:id
   */
  static async layTinDangDeChinhSua(req, res) {
    try {
      const tinDangId = req.params.id;
      const chuDuAnId = req.user.id;

      // Lấy chi tiết tin đăng
      const tinDang = await ChuDuAnModel.layChiTietTinDang(tinDangId, chuDuAnId);

      if (!tinDang) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tin đăng hoặc không có quyền truy cập'
        });
      }

      // Lấy danh sách phòng nếu có
      const danhSachPhong = await ChuDuAnModel.layDanhSachPhong(tinDangId);

      // Audit log
      await NhatKyHeThongService.ghiNhan(
        chuDuAnId,
        'xem_tin_dang_de_chinh_sua',
        'TinDang',
        tinDangId,
        null,
        null,
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Lấy thông tin tin đăng thành công',
        data: {
          ...tinDang,
          DanhSachPhong: danhSachPhong
        }
      });
    } catch (error) {
      console.error('Lỗi lấy tin đăng để chỉnh sửa:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Cập nhật tin đăng (lưu nháp hoặc gửi duyệt)
   * PUT /api/chu-du-an/chinh-sua-tin-dang/:id
   */
  static async capNhatTinDang(req, res) {
    try {
      const tinDangId = req.params.id;
      const chuDuAnId = req.user.id;
      const updateData = req.body;
      const { action } = req.body; // 'save_draft' hoặc 'send_review'

      console.log('📥 Backend nhận dữ liệu cập nhật:', JSON.stringify(updateData, null, 2));

      // Validate ownership
      const tinDangCu = await ChuDuAnModel.layChiTietTinDang(tinDangId, chuDuAnId);
      if (!tinDangCu) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tin đăng hoặc không có quyền truy cập'
        });
      }

      // Chặn thay đổi loại giao dịch sau khi đã tạo tin
      if (updateData.LoaiGiaoDich && updateData.LoaiGiaoDich !== tinDangCu.LoaiGiaoDich) {
        return res.status(400).json({
          success: false,
          message: 'Không thể thay đổi loại giao dịch sau khi tạo tin'
        });
      }

      // Chỉ bắt buộc chọn phòng cho tin Thuê
      if (tinDangCu.LoaiGiaoDich === 'Thue') {
        if (!Array.isArray(updateData.PhongIDs) || updateData.PhongIDs.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Tin đăng phải chọn ít nhất một phòng thuộc dự án'
          });
        }

        const phongIdsHopLe = updateData.PhongIDs.every(item => {
          if (typeof item === 'object') {
            return item && item.PhongID;
          }
          return !!item;
        });

        if (!phongIdsHopLe) {
          return res.status(400).json({
            success: false,
            message: 'Danh sách phòng không hợp lệ'
          });
        }
      }

      // Validate dữ liệu nếu gửi duyệt
      if (action === 'send_review') {
        if (!updateData.TieuDe || !updateData.DuAnID) {
          return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin bắt buộc khi gửi duyệt'
          });
        }
      }

      // Cập nhật tin đăng
      const result = await ChuDuAnModel.capNhatTinDang(tinDangId, chuDuAnId, updateData);

      // Nếu gửi duyệt, chuyển trạng thái sang ChoDuyet
      if (action === 'send_review') {
        await ChuDuAnModel.guiTinDangDeDuyet(tinDangId, chuDuAnId);
        
        // Audit log
        await NhatKyHeThongService.ghiNhan(
          chuDuAnId,
          'gui_duyet_tin_dang',
          'TinDang',
          tinDangId,
          null,
          updateData,
          req.ip,
          req.get('User-Agent')
        );
      } else {
        // Audit log cho lưu nháp
        await NhatKyHeThongService.ghiNhan(
          chuDuAnId,
          'luu_nhap_tin_dang',
          'TinDang',
          tinDangId,
          null,
          updateData,
          req.ip,
          req.get('User-Agent')
        );
      }

      res.json({
        success: true,
        message: action === 'send_review' ? 'Gửi duyệt tin đăng thành công' : 'Lưu nháp thành công',
        data: result
      });
    } catch (error) {
      console.error('Lỗi cập nhật tin đăng:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy danh sách tin nháp
   * GET /api/chu-du-an/tin-nhap
   */
  static async layDanhSachTinNhap(req, res) {
    try {
      const chuDuAnId = req.user.id;

      // Lấy danh sách tin đăng với trạng thái Nhap
      const tinNhaps = await ChuDuAnModel.layDanhSachTinDang(chuDuAnId, { 
        trangThai: 'Nhap',
        limit: 100
      });

      res.json({
        success: true,
        message: 'Lấy danh sách tin nháp thành công',
        data: tinNhaps
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách tin nháp:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Xóa tin đăng (chuyển sang trạng thái LuuTru)
   * DELETE /api/chu-du-an/tin-dang/:id
   * Body: { lyDoXoa: string } - Bắt buộc nếu tin đã duyệt/đang đăng
   */
  static async xoaTinDang(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const tinDangId = parseInt(req.params.id);
      const { lyDoXoa } = req.body;

      if (!tinDangId) {
        return res.status(400).json({
          success: false,
          message: 'ID tin đăng không hợp lệ'
        });
      }

      // Xóa tin đăng (chuyển sang LuuTru)
      const result = await ChuDuAnModel.xoaTinDang(tinDangId, chuDuAnId, lyDoXoa);

      // Audit log
      await NhatKyHeThongService.ghiNhan(
        chuDuAnId,
        'xoa_tin_dang',
        'TinDang',
        tinDangId,
        null,
        { TrangThai: 'LuuTru', LyDoXoa: lyDoXoa || 'Chủ dự án tự xóa' },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Xóa tin đăng thành công',
        data: result
      });
    } catch (error) {
      console.error('Lỗi xóa tin đăng:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * UC-PROJ-BANNED: Gửi yêu cầu mở lại dự án bị banned
   * POST /api/chu-du-an/du-an/:id/yeu-cau-mo-lai
   * 
   * @param {Object} req.params.id - DuAnID
   * @param {Object} req.body.NoiDungGiaiTrinh - Nội dung giải trình (required, min 50 chars)
   * @param {Object} req.user - Thông tin Chủ dự án từ JWT
   * @returns {Object} 200 - Success
   * @returns {Object} 400 - Validation errors
   * @returns {Object} 403 - Không có quyền (không phải chủ dự án)
   * @returns {Object} 404 - Dự án không tồn tại
   * @returns {Object} 409 - Dự án chưa bị banned hoặc yêu cầu đang xử lý
   */
  static async guiYeuCauMoLaiDuAn(req, res) {
    const db = require('../config/db');
    const connection = await db.getConnection();
    
    try {
      const duAnId = parseInt(req.params.id);
      const { NoiDungGiaiTrinh } = req.body;
      const chuDuAnId = req.user.NguoiDungID;

      // Validation
      if (!NoiDungGiaiTrinh || NoiDungGiaiTrinh.trim().length < 50) {
        return res.status(400).json({
          success: false,
          message: 'Nội dung giải trình phải có ít nhất 50 ký tự để giải thích rõ lý do',
        });
      }

      if (NoiDungGiaiTrinh.length > 2000) {
        return res.status(400).json({
          success: false,
          message: 'Nội dung giải trình không được vượt quá 2000 ký tự',
        });
      }

      await connection.beginTransaction();

      // Kiểm tra dự án và quyền sở hữu
      const [duAnRows] = await connection.execute(
        `SELECT DuAnID, TenDuAn, ChuDuAnID, TrangThai, YeuCauMoLai, LyDoNgungHoatDong
         FROM duan 
         WHERE DuAnID = ?`,
        [duAnId]
      );

      if (!duAnRows.length) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Dự án không tồn tại',
        });
      }

      const duAn = duAnRows[0];

      // Kiểm tra quyền sở hữu
      if (duAn.ChuDuAnID !== chuDuAnId) {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền gửi yêu cầu cho dự án này',
        });
      }

      // Validate trạng thái dự án
      if (duAn.TrangThai !== 'NgungHoatDong') {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: 'Dự án chưa bị ngưng hoạt động, không thể gửi yêu cầu mở lại',
        });
      }

      // Validate trạng thái yêu cầu
      if (duAn.YeuCauMoLai === 'DangXuLy') {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: 'Yêu cầu mở lại đang được xử lý, vui lòng chờ kết quả',
        });
      }

      if (duAn.YeuCauMoLai === 'ChapNhan') {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: 'Dự án đã được mở lại trước đó',
        });
      }

      // Update yêu cầu mở lại
      await connection.execute(
        `UPDATE duan 
         SET YeuCauMoLai = 'DangXuLy',
             NoiDungGiaiTrinh = ?,
             ThoiGianGuiYeuCau = NOW(),
             CapNhatLuc = NOW()
         WHERE DuAnID = ?`,
        [NoiDungGiaiTrinh.trim(), duAnId]
      );

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan({
        TacNhan: 'ChuDuAn',
        NguoiDungID: chuDuAnId,
        HanhDong: 'GUI_YEU_CAU_MO_LAI_DU_AN',
        DoiTuong: 'DuAn',
        DoiTuongID: duAnId,
        ChiTiet: JSON.stringify({
          TenDuAn: duAn.TenDuAn,
          LyDoNgungHoatDong: duAn.LyDoNgungHoatDong,
          NoiDungGiaiTrinh: NoiDungGiaiTrinh.trim(),
        }),
      });

      await connection.commit();

      // Lấy thông tin sau khi update
      const [updatedRows] = await connection.execute(
        `SELECT 
          DuAnID, TenDuAn, TrangThai, YeuCauMoLai,
          NoiDungGiaiTrinh, ThoiGianGuiYeuCau,
          LyDoNgungHoatDong, NgungHoatDongLuc
         FROM duan 
         WHERE DuAnID = ?`,
        [duAnId]
      );

      return res.status(200).json({
        success: true,
        message: 'Đã gửi yêu cầu mở lại dự án. Operator sẽ xử lý trong vòng 3-5 ngày làm việc.',
        data: updatedRows[0],
      });
    } catch (error) {
      await connection.rollback();
      console.error('Lỗi khi gửi yêu cầu mở lại:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi xử lý yêu cầu',
        error: error.message,
      });
    } finally {
      connection.release();
    }
  }

  /**
   * ============================================================================
   * NEW ENDPOINTS CHO BÁO CÁO CHI TIẾT (2025-10-24)
   * ============================================================================
   */

  /**
   * Lấy doanh thu theo tháng (6 tháng gần nhất)
   * GET /api/chu-du-an/bao-cao/doanh-thu-theo-thang
   */
  static async layDoanhThuTheoThang(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const data = await ChuDuAnModel.layDoanhThuTheoThang(chuDuAnId);

      res.json({
        success: true,
        message: 'Lấy doanh thu theo tháng thành công',
        data
      });
    } catch (error) {
      console.error('Lỗi lấy doanh thu theo tháng:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy Top 5 tin đăng hiệu quả nhất
   * GET /api/chu-du-an/bao-cao/top-tin-dang?tuNgay=YYYY-MM-DD&denNgay=YYYY-MM-DD
   */
  static async layTopTinDang(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const filters = {
        tuNgay: req.query.tuNgay,
        denNgay: req.query.denNgay
      };

      const data = await ChuDuAnModel.layTopTinDang(chuDuAnId, filters);

      res.json({
        success: true,
        message: 'Lấy top tin đăng thành công',
        data
      });
    } catch (error) {
      console.error('Lỗi lấy top tin đăng:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy Conversion Rate
   * GET /api/chu-du-an/bao-cao/conversion-rate?tuNgay=YYYY-MM-DD&denNgay=YYYY-MM-DD
   */
  static async layConversionRate(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const filters = {
        tuNgay: req.query.tuNgay,
        denNgay: req.query.denNgay
      };

      const data = await ChuDuAnModel.layConversionRate(chuDuAnId, filters);

      res.json({
        success: true,
        message: 'Lấy conversion rate thành công',
        data
      });
    } catch (error) {
      console.error('Lỗi lấy conversion rate:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy báo cáo chi tiết (Enhanced version với tất cả metrics)
   * GET /api/chu-du-an/bao-cao-chi-tiet?tuNgay=YYYY-MM-DD&denNgay=YYYY-MM-DD
   */
  static async layBaoCaoHieuSuatChiTiet(req, res) {
    try {
      const chuDuAnId = req.user.id;
      const filters = {
        tuNgay: req.query.tuNgay,
        denNgay: req.query.denNgay
      };

      const data = await ChuDuAnModel.layBaoCaoHieuSuatChiTiet(chuDuAnId, filters);

      // Ghi audit log
      await NhatKyHeThongService.ghiNhan(
        chuDuAnId,
        'chu_du_an_xem_bao_cao_chi_tiet',
        'BaoCao',
        null,
        null,
        { loaiBaoCao: 'ChiTiet', ...filters },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Lấy báo cáo chi tiết thành công',
        data
      });
    } catch (error) {
      console.error('Lỗi lấy báo cáo chi tiết:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = ChuDuAnController;
