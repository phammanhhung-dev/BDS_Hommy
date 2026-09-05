/**
 * Controller xử lý Hợp đồng cọc cho Khách hàng quét QR
 * Public endpoints - không yêu cầu authentication
 */

const db = require('../config/db');
const QRSessionStore = require('../services/QRSessionStore');
const ThongBaoService = require('../services/ThongBaoService');
const HopDongTemplateService = require('../services/HopDongTemplateService');

class HopDongCocQRController {
  /**
   * Xem thông tin hợp đồng cọc từ QR code
   * GET /api/public/hop-dong-coc/:maQR
   */
  static async xemHopDongCocQR(req, res) {
    try {
      const { maQR } = req.params;

      if (!maQR) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu mã QR'
        });
      }

      // Lấy session từ store
      const session = QRSessionStore.get(maQR);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Mã QR không tồn tại hoặc đã hết hạn',
          trangThai: 'KHONG_TON_TAI'
        });
      }

      // Kiểm tra loại QR phải là DAT_COC
      if (session.loaiQR !== 'DAT_COC') {
        return res.status(400).json({
          success: false,
          message: 'Mã QR không hợp lệ cho đặt cọc',
          trangThai: 'SAI_LOAI_QR'
        });
      }

      // Kiểm tra session hết hạn
      const thoiGianConLai = QRSessionStore.getRemainingTime(maQR);
      if (thoiGianConLai <= 0) {
        return res.status(410).json({
          success: false,
          message: 'Mã QR đã hết hạn',
          trangThai: 'HET_HAN'
        });
      }

      // Tính tiền cọc đúng công thức:
      // Tiền cọc = Giá phòng (GiaTinDang nếu có, fallback GiaChuan) × SoThangCocToiThieu (từ dự án, null = 1)
      const giaPhong = session.thongTinPhong?.GiaTinDang
        ? Number(session.thongTinPhong.GiaTinDang)
        : Number(session.thongTinPhong?.GiaChuan || session.thongTinPhong?.Gia || 0);
      const soThangCocToiThieu =
        Number(session.thongTinTinDang?.SoThangCocToiThieu) || 1;
      const soThangKy = session.soThangKy || soThangCocToiThieu;
      const soTienCoc = giaPhong * soThangCocToiThieu;

      // Trả về thông tin hợp đồng cọc
      res.json({
        success: true,
        data: {
          maQR,
          trangThai: session.trangThai || 'CHO_PHAN_HOI',
          thoiGianConLai,
          thongTinPhong: session.thongTinPhong,
          thongTinTinDang: session.thongTinTinDang,
          thongTinNhanVien: session.thongTinNhanVien ? {
            TenDayDu: session.thongTinNhanVien.TenDayDu,
            SoDienThoai: session.thongTinNhanVien.SoDienThoai,
            MaNhanVien: session.thongTinNhanVien.MaNhanVien
          } : null,
          thongTinDatCoc: {
            soThangKy,
            soTienCoc,
            ngayChuyenVao: session.ngayChuyenVao
          }
        }
      });

    } catch (error) {
      console.error('[HopDongCocQRController] xemHopDongCocQR error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải thông tin hợp đồng cọc'
      });
    }
  }

  /**
   * Xác nhận hợp đồng cọc (đồng ý/từ chối)
   * POST /api/public/hop-dong-coc/:maQR/xac-nhan
   */
  static async xacNhanHopDongCocQR(req, res) {
    try {
      const { maQR } = req.params;
      const { dongY, ngayChuyenVao } = req.body;

      if (!maQR) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu mã QR'
        });
      }

      // Lấy session
      const session = QRSessionStore.get(maQR);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Mã QR không tồn tại hoặc đã hết hạn'
        });
      }

      // Kiểm tra loại QR
      if (session.loaiQR !== 'DAT_COC') {
        return res.status(400).json({
          success: false,
          message: 'Mã QR không hợp lệ cho đặt cọc'
        });
      }

      // Kiểm tra hết hạn
      const thoiGianConLai = QRSessionStore.getRemainingTime(maQR);
      if (thoiGianConLai <= 0) {
        return res.status(410).json({
          success: false,
          message: 'Mã QR đã hết hạn'
        });
      }

      // Kiểm tra đã phản hồi chưa
      if (session.trangThai !== 'CHO_PHAN_HOI') {
        return res.status(400).json({
          success: false,
          message: 'Mã QR đã được xử lý trước đó'
        });
      }

      const io = req.app.get('io');

      if (dongY) {
        // Khách đồng ý đặt cọc
        const tinDangId = session.tinDangId;
        const phongId = session.phongId;
        const khachHangId = session.thongTinDatCoc?.khachHangId || null;

        if (!khachHangId) {
          return res.status(400).json({
            success: false,
            message: 'Không xác định được khách hàng từ QR'
          });
        }

        // Số tháng ký hợp đồng (từ QR) và số tháng cọc tối thiểu
        const soThangKyNumber =
          Number(session.soThangKy) ||
          Number(session.thongTinTinDang?.SoThangCocToiThieu) ||
          1;

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
        } else if (session.ngayChuyenVao) {
          const parsedDate = new Date(session.ngayChuyenVao);
          ngayBatDauValue = Number.isNaN(parsedDate.getTime())
            ? new Date().toISOString().split('T')[0]
            : parsedDate.toISOString().split('T')[0];
        } else {
          ngayBatDauValue = new Date().toISOString().split('T')[0];
        }

        const ngayKetThucDate = new Date(ngayBatDauValue);
        ngayKetThucDate.setMonth(ngayKetThucDate.getMonth() + soThangKyNumber);
        const ngayKetThucValue = ngayKetThucDate.toISOString().split('T')[0];

        // Lấy thông tin phòng, giá và SoThangCocToiThieu từ dự án
        const [phongRows] = await db.execute(
          `
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
        `,
          [phongId, tinDangId]
        );

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
        const [viRows] = await db.execute(
          `
          SELECT SoDu FROM vi WHERE NguoiDungID = ?
        `,
          [khachHangId]
        );

        if (viRows.length === 0 || viRows[0].SoDu < tongTienCoc) {
          return res.status(400).json({
            success: false,
            message: 'Số dư ví không đủ để đặt cọc',
            canThieu: tongTienCoc - (viRows[0]?.SoDu || 0)
          });
        }

        // Dựng nội dung hợp đồng (chỉ server-side)
        let noiDungHopDong = `Hợp đồng thuê phòng qua QR - Số tháng ký: ${soThangKyNumber}`;
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
          // Không coi là lỗi nghiệp vụ, chỉ cảnh báo vì đã có fallback nội dung đơn giản
          console.warn(
            '[HopDongCocQRController] buildPreview warning, fallback to simple content:',
            buildErr.message
          );
        }

        // Bắt đầu transaction - tạo coc + hopdong + trừ ví + lịch sử ví + cập nhật phòng
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
          // 1. Tạo bản ghi cọc trong bảng `coc`
          const [cocResult] = await connection.execute(
            `
            INSERT INTO coc (
              GiaoDichID, TinDangID, PhongID, Loai, SoTien, TrangThai, GhiChu
            ) VALUES (0, ?, ?, 'CocGiuCho', ?, 'HieuLuc', ?)
          `,
            [
              tinDangId,
              phongId,
              tongTienCoc,
              `Đặt cọc qua QR - ${maQR}. Số tháng ký: ${soThangKyNumber}`
            ]
          );

          const cocId = cocResult.insertId;

          // 2. Tạo bản ghi hợp đồng thuê trong bảng `hopdong`
          const [hopDongResult] = await connection.execute(
            `
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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'xacthuc')
          `,
            [
              tinDangId,
              phongId,
              phong.DuAnID,
              session.nhanVienId || null,
              khachHangId,
              ngayBatDauValue,
              ngayKetThucValue,
              giaPhong,
              tongTienCoc,
              noiDungHopDong
            ]
          );

          const hopDongId = hopDongResult.insertId;

          // 3. Trừ tiền ví khách hàng
          await connection.execute(
            `
            UPDATE vi SET SoDu = SoDu - ? WHERE NguoiDungID = ?
          `,
            [tongTienCoc, khachHangId]
          );

          // 4. Ghi lịch sử ví
          const maGiaoDich = `DAT_COC_${cocId}_${Date.now()}`;
          await connection.execute(
            `
            INSERT INTO lich_su_vi (
              user_id, so_tien, LoaiGiaoDich, trang_thai, ma_giao_dich
            ) VALUES (?, ?, 'dat_coc', 'THANH_CONG', ?)
          `,
            [khachHangId, -tongTienCoc, maGiaoDich]
          );

          // 5. Cập nhật trạng thái phòng thành GiuCho
          await connection.execute(
            `
            UPDATE phong 
            SET TrangThai = 'GiuCho' 
            WHERE PhongID = ?
          `,
            [phongId]
          );

          await connection.commit();
          connection.release();

          // Cập nhật session
          QRSessionStore.update(maQR, {
            trangThai: 'DONG_Y',
            cocId,
            hopDongId,
            ngayChuyenVao: ngayChuyenVao || session.ngayChuyenVao
          });

          // Emit socket events cho nhân viên
          if (io && session.nhanVienId) {
            // Event riêng cho đặt cọc
            io.to(`nhanvien_${session.nhanVienId}`).emit('qr_dat_coc_response', {
              maQR,
              trangThai: 'DONG_Y',
              cocId,
              hopDongId,
              soTienCoc: tongTienCoc,
              phongId,
              tenPhong: phong.TenPhong
            });

            // Emit goi_y_phan_hoi để frontend modal cập nhật trạng thái
            io.to(`goi_y_${maQR}`).emit('goi_y_phan_hoi', {
              maQR,
              trangThai: 'DONG_Y',
              phanHoiLuc: Date.now()
            });
            console.log(`[HopDongCocQRController] Emitted goi_y_phan_hoi to room goi_y_${maQR}`);

            // Gửi thông báo cho nhân viên (in-app + push)
            try {
              await ThongBaoService.guiThongBao(
                session.nhanVienId,
                'default',
                'Đặt cọc thành công',
                `Khách hàng đã đồng ý đặt cọc ${formatCurrency(
                  tongTienCoc
                )} cho phòng ${phong.TenPhong}`,
                {
                  DoiTuong: 'HopDong',
                  DoiTuongID: hopDongId,
                  maQR,
                  phongId
                },
                `/nhan-vien-ban-hang/cuoc-hen/${session.cuocHenId}`
              );
            } catch (notiErr) {
              console.error('[HopDongCocQRController] Error sending notification:', notiErr);
            }
          }

          // Gửi thông báo cho chủ dự án
          if (session.thongTinTinDang?.ChuDuAnID) {
            try {
              await ThongBaoService.guiThongBao(
                session.thongTinTinDang.ChuDuAnID,
                'default',
                'Có người đặt cọc mới',
                `Phòng ${phong.TenPhong} đã được đặt cọc ${formatCurrency(
                  tongTienCoc
                )}`,
                {
                  DoiTuong: 'HopDong',
                  DoiTuongID: hopDongId,
                  maQR,
                  phongId
                },
                `/chu-du-an/tin-dang/${tinDangId}`
              );
            } catch (notiErr) {
              console.error('[HopDongCocQRController] Error sending CDA notification:', notiErr);
            }
          }

          res.json({
            success: true,
            message: 'Đặt cọc thành công',
            data: {
              cocId,
              hopDongId,
              soTienCoc: tongTienCoc,
              tenPhong: phong.TenPhong
            }
          });
        } catch (txError) {
          await connection.rollback();
          connection.release();
          throw txError;
        }

      } else {
        // Khách từ chối
        QRSessionStore.update(maQR, {
          trangThai: 'TU_CHOI'
        });

        const io = req.app.get('io');

        // Emit socket events cho nhân viên
        if (io && session.nhanVienId) {
          io.to(`nhanvien_${session.nhanVienId}`).emit('qr_dat_coc_response', {
            maQR,
            trangThai: 'TU_CHOI',
            phongId: session.phongId,
            tenPhong: session.thongTinPhong?.TenPhong
          });

          // Emit goi_y_phan_hoi để frontend modal cập nhật trạng thái
          io.to(`goi_y_${maQR}`).emit('goi_y_phan_hoi', {
            maQR,
            trangThai: 'TU_CHOI',
            phanHoiLuc: Date.now()
          });
          console.log(`[HopDongCocQRController] Emitted TU_CHOI to room goi_y_${maQR}`);
        }

        res.json({
          success: true,
          message: 'Đã ghi nhận phản hồi của bạn'
        });
      }

    } catch (error) {
      console.error('[HopDongCocQRController] xacNhanHopDongCocQR error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xử lý phản hồi'
      });
    }
  }
}

/**
 * Format tiền VND
 * @param {number} value 
 * @returns {string}
 */
function formatCurrency(value) {
  if (!value) return '0 đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(value);
}

module.exports = HopDongCocQRController;

