/**
 * Controller xử lý Hợp đồng cho Khách hàng (Authenticated)
 * Routes: /api/hop-dong/*
 */

const db = require('../config/db');
const HopDongTemplateService = require('../services/HopDongTemplateService');

class HopDongCustomerController {
  /**
   * Dựng hợp đồng preview cho khách hàng
   * POST /api/hop-dong/generate
   * Body: { tinDangId, phongId, soThangKy, ngayChuyenVao }
   */
  static async generate(req, res) {
    try {
      const khachHangId = req.user.id;
      const { tinDangId, phongId, soThangKy, ngayChuyenVao, mauHopDongId } = req.body;

      if (!tinDangId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu TinDangID để dựng hợp đồng'
        });
      }

      // Lấy thông tin phòng nếu có
      let thongTinPhong = null;
      if (phongId) {
        const [phongRows] = await db.execute(`
          SELECT 
            p.PhongID,
            p.TenPhong,
            p.GiaChuan,
            p.DienTichChuan,
            pt.GiaTinDang,
            pt.DienTichTinDang
          FROM phong p
          LEFT JOIN phong_tindang pt ON p.PhongID = pt.PhongID AND pt.TinDangID = ?
          WHERE p.PhongID = ?
        `, [tinDangId, phongId]);
        
        if (phongRows.length > 0) {
          thongTinPhong = phongRows[0];
        }
      }

      // Dựng preview hợp đồng
      const preview = await HopDongTemplateService.buildPreview({
        mauHopDongId: mauHopDongId || null,
        tinDangId,
        khachHangId,
        overrides: {
          batDongSan: {
            tenPhong: thongTinPhong?.TenPhong || null,
            dienTich: thongTinPhong?.DienTichTinDang || thongTinPhong?.DienTichChuan || null
          },
          chiPhi: {
            giaThue: thongTinPhong?.GiaTinDang || thongTinPhong?.GiaChuan || null,
            soTienCoc: soThangKy ? (thongTinPhong?.GiaTinDang || thongTinPhong?.GiaChuan || 0) * soThangKy : null
          }
        }
      });

      // Thêm thông tin bổ sung
      preview.thongTinBoSung = {
        phongId,
        soThangKy,
        ngayChuyenVao,
        giaPhong: thongTinPhong?.GiaTinDang || thongTinPhong?.GiaChuan || 0
      };

      res.json({
        success: true,
        data: preview
      });
    } catch (error) {
      console.error('[HopDongCustomerController] generate error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi dựng hợp đồng'
      });
    }
  }

  /**
   * Xác nhận đặt cọc (khách hàng đồng ý)
   * POST /api/hop-dong/:tinDangId/confirm-deposit
   * Body: { phongId, soThangKy, ngayChuyenVao }
   */
  static async confirmDeposit(req, res) {
    try {
      const khachHangId = req.user.id;
      const { tinDangId } = req.params;
      const { phongId, soThangKy, ngayChuyenVao, noiDungSnapshot } = req.body;

      if (!tinDangId || !phongId || !soThangKy) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin cần thiết để đặt cọc'
        });
      }

      const soThangKyNumber = Number(soThangKy);
      if (!soThangKyNumber || Number.isNaN(soThangKyNumber) || soThangKyNumber <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Số tháng ký hợp đồng không hợp lệ'
        });
      }

      // Tính ngày bắt đầu (ngày chuyển vào) và ngày kết thúc hợp đồng
      let ngayBatDauValue;
      if (ngayChuyenVao) {
        const parsedDate = new Date(ngayChuyenVao);
        if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
            message: 'Ngày chuyển vào không hợp lệ'
        });
      }
        ngayBatDauValue = parsedDate.toISOString().split('T')[0];
      } else {
        ngayBatDauValue = new Date().toISOString().split('T')[0];
      }

      const ngayKetThucDate = new Date(ngayBatDauValue);
      ngayKetThucDate.setMonth(ngayKetThucDate.getMonth() + soThangKyNumber);
      const ngayKetThucValue = ngayKetThucDate.toISOString().split('T')[0];

      // Lấy thông tin phòng, giá và SoThangCocToiThieu từ dự án
      const [phongRows] = await db.execute(`
          SELECT 
            p.PhongID, 
          p.TenPhong,
          p.GiaChuan,
            p.TrangThai,
          pt.GiaTinDang,
          td.TinDangID,
          td.TieuDe,
          da.DuAnID,
          da.TenDuAn,
          da.ChuDuAnID,
            da.SoThangCocToiThieu
        FROM phong p
        INNER JOIN phong_tindang pt ON p.PhongID = pt.PhongID
          INNER JOIN tindang td ON pt.TinDangID = td.TinDangID
        INNER JOIN duan da ON td.DuAnID = da.DuAnID
        WHERE p.PhongID = ? AND td.TinDangID = ?
      `, [phongId, tinDangId]);

      if (phongRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phòng hoặc tin đăng'
        });
      }

      const phong = phongRows[0];

      // Kiểm tra trạng thái phòng
      if (phong.TrangThai !== 'Trong') {
        return res.status(400).json({
          success: false,
          message: 'Phòng không còn trống, không thể đặt cọc'
        });
      }

      // Tính tiền cọc đúng công thức:
      // Tiền cọc = Giá phòng (GiaTinDang nếu có, fallback GiaChuan) × SoThangCocToiThieu (từ dự án, null = 1)
      const giaPhong = phong.GiaTinDang || phong.GiaChuan || 0;
      const soThangCocToiThieu =
        Number(phong.SoThangCocToiThieu) || 1;
      const tongTienCoc = giaPhong * soThangCocToiThieu;

      // Kiểm tra ví khách hàng
      const [viRows] = await db.execute(`
        SELECT SoDu FROM vi WHERE NguoiDungID = ?
      `, [khachHangId]);

      if (viRows.length === 0 || viRows[0].SoDu < tongTienCoc) {
        return res.status(400).json({
          success: false,
          message: 'Số dư ví không đủ để đặt cọc',
          canThieu: tongTienCoc - (viRows[0]?.SoDu || 0)
        });
      }

      // Dựng nội dung hợp đồng
      // Ưu tiên dùng noiDungSnapshot client đã generate (HTML đầy đủ),
      // nếu không có thì fallback sang buildPreview trên server
      let noiDungHopDong =
        typeof noiDungSnapshot === 'string' && noiDungSnapshot.trim()
          ? noiDungSnapshot
          : `Hợp đồng thuê phòng qua app - Số tháng ký: ${soThangKyNumber}`;

      if (!noiDungSnapshot || typeof noiDungSnapshot !== 'string' || !noiDungSnapshot.trim()) {
        try {
          const preview = await HopDongTemplateService.buildPreview({
            mauHopDongId: null,
            tinDangId: Number(tinDangId),
            khachHangId,
            overrides: {
              batDongSan: {
                tenPhong: phong.TenPhong,
                dienTich: null
              },
              chiPhi: {
                giaThue: giaPhong,
                soTienCoc: tongTienCoc
              }
            }
          });
          if (preview && preview.renderedHtml) {
            noiDungHopDong = preview.renderedHtml;
          }
        } catch (buildErr) {
          console.error('[HopDongCustomerController] buildPreview error, fallback to simple content:', buildErr);
        }
      }

      // Bắt đầu transaction
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // 1. Tạo bản ghi cọc trong bảng `coc`
        const [cocResult] = await connection.execute(`
          INSERT INTO coc (
            GiaoDichID, TinDangID, PhongID, Loai, SoTien, TrangThai, GhiChu
          ) VALUES (0, ?, ?, 'CocGiuCho', ?, 'HieuLuc', ?)
        `, [
          tinDangId, phongId, tongTienCoc, 
          `Đặt cọc qua app. Số tháng ký: ${soThangKy}`
        ]);

        const cocId = cocResult.insertId;

        // 2. Tạo bản ghi hợp đồng thuê trong bảng `hopdong`
        const [hopDongResult] = await connection.execute(`
          INSERT INTO hopdong (
            TinDangID, 
            PhongID,
            DuAnID,
            NhanVienBanHangID,
            KhachHangID, 
            NgayBatDau,
            NgayKetThuc,
            GiaThueCuoiCung,
            SoTienCoc,
            noidunghopdong,
            TrangThai
          ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, 'xacthuc')
        `, [
          tinDangId,
          phongId,
          phong.DuAnID,
          khachHangId,
          ngayBatDauValue,
          ngayKetThucValue,
          giaPhong,
          tongTienCoc,
          noiDungHopDong
        ]);

        const hopDongId = hopDongResult.insertId;

        // 3. Trừ tiền ví khách hàng
        await connection.execute(`
          UPDATE vi SET SoDu = SoDu - ? WHERE NguoiDungID = ?
        `, [tongTienCoc, khachHangId]);

        // 4. Ghi lịch sử ví
        const maGiaoDich = `DAT_COC_${cocId}_${Date.now()}`;
        await connection.execute(`
          INSERT INTO lich_su_vi (
            user_id, so_tien, LoaiGiaoDich, trang_thai, ma_giao_dich
          ) VALUES (?, ?, 'dat_coc', 'THANH_CONG', ?)
        `, [khachHangId, -tongTienCoc, maGiaoDich]);

        // 5. Cập nhật trạng thái phòng - chuyển sang GiuCho
        await connection.execute(`
          UPDATE phong SET TrangThai = 'GiuCho' WHERE PhongID = ?
        `, [phongId]);

        await connection.commit();

        // Emit socket event nếu có
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${phong.ChuDuAnID}`).emit('dat_coc_moi', {
            cocId,
            hopDongId,
            tenPhong: phong.TenPhong,
            tongTienCoc,
            khachHangId
        });
      }

        res.json({
        success: true,
          message: 'Đặt cọc thành công',
        data: {
            cocId,
            hopDongId,
            tongTienCoc,
            phong: {
              PhongID: phong.PhongID,
              TenPhong: phong.TenPhong
            }
          }
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('[HopDongCustomerController] confirmDeposit error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi xác nhận đặt cọc'
      });
    }
  }

  /**
   * Lấy danh sách hợp đồng của khách hàng
   * GET /api/hop-dong/khach-hang
   */
  static async layDanhSachHopDong(req, res) {
    try {
      const nguoiDungId = req.user.id;

      // Lấy danh sách hợp đồng thuê của khách hàng
      const [hopDongs] = await db.execute(`
        SELECT 
          hd.HopDongID,
          hd.TinDangID,
          hd.PhongID,
          hd.DuAnID,
          hd.NgayBatDau,
          hd.NgayKetThuc,
          hd.GiaThueCuoiCung,
          hd.SoTienCoc,
          hd.TrangThai,
          td.TieuDe AS TieuDeTinDang,
          p.TenPhong,
          p.GiaChuan AS GiaPhong,
          da.TenDuAn,
          da.DiaChi
        FROM hopdong hd
        LEFT JOIN tindang td ON hd.TinDangID = td.TinDangID
        LEFT JOIN phong p ON hd.PhongID = p.PhongID
        LEFT JOIN duan da ON hd.DuAnID = da.DuAnID
        WHERE hd.KhachHangID = ?
        ORDER BY hd.NgayBatDau DESC
      `, [nguoiDungId]);

      res.json({
        success: true,
        data: hopDongs
      });
    } catch (error) {
      console.error('[HopDongCustomerController] layDanhSachHopDong error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách hợp đồng'
      });
    }
  }

  /**
   * Yêu cầu hủy hợp đồng
   * POST /api/hop-dong/:id/xin-huy
   */
  static async xinHuy(req, res) {
    try {
      const { id } = req.params;
      const nguoiDungId = req.user.id;
      const { lyDo } = req.body;

      // Kiểm tra hợp đồng tồn tại và thuộc về người dùng
      const [hopDongs] = await db.execute(`
        SELECT * FROM hopdong 
        WHERE HopDongID = ? AND KhachHangID = ?
      `, [id, nguoiDungId]);

      if (hopDongs.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy hợp đồng'
        });
      }

      const hopDong = hopDongs[0];

      // Chỉ hợp đồng đã xác thực mới có thể xin hủy
      if (hopDong.TrangThai !== 'xacthuc') {
        return res.status(400).json({
          success: false,
          message: 'Không thể hủy hợp đồng ở trạng thái này'
        });
      }

      // Cập nhật trạng thái hợp đồng thành xinhuy
      await db.execute(`
        UPDATE hopdong 
        SET TrangThai = 'xinhuy'
        WHERE HopDongID = ?
      `, [id]);

      res.json({
        success: true,
        message: 'Đã gửi yêu cầu hủy hợp đồng'
      });
    } catch (error) {
      console.error('[HopDongCustomerController] xinHuy error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi gửi yêu cầu hủy'
      });
    }
  }
}

module.exports = HopDongCustomerController;

