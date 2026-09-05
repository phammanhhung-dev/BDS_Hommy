/**
 * Controller cho Gợi ý Tin đăng
 * Xử lý logic tìm kiếm gợi ý và tạo QR "Xem Ngay"
 */

const crypto = require('crypto');
const GoiYTinDangModel = require('../models/GoiYTinDangModel');

/**
 * Tạo mã ngẫu nhiên tương tự nanoid
 * @param {number} size - Độ dài mã (mặc định 12)
 * @returns {string} Mã ngẫu nhiên URL-safe
 */
function generateQRCode(size = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(size);
  let result = '';
  for (let i = 0; i < size; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}
const QRSessionStore = require('../services/QRSessionStore');
const db = require('../config/db');

class GoiYTinDangController {
  /**
   * Tìm kiếm tin đăng gợi ý
   * POST /api/nhan-vien-ban-hang/goi-y/tim-kiem
   */
  static async timKiemGoiY(req, res) {
    try {
      const nhanVienId = req.user.id;
      const {
        cuocHenId,
        khuVucId,
        giaMin,
        giaMax,
        dienTichMin,
        dienTichMax,
        tienIch,
        limit = 10
      } = req.body;

      console.log(`[GoiYTinDangController] timKiemGoiY - NVBH: ${nhanVienId}, CuocHenID: ${cuocHenId}`);

      // Lấy khu vực phụ trách của NVBH từ hồ sơ nhân viên
      let parentKhuVucId = khuVucId;
      
      if (!parentKhuVucId) {
        const [nhanVienRows] = await db.execute(`
          SELECT KhuVucPhuTrachID 
          FROM hosonhanvien 
          WHERE NguoiDungID = ?
          LIMIT 1
        `, [nhanVienId]);

        if (nhanVienRows.length > 0 && nhanVienRows[0].KhuVucPhuTrachID) {
          parentKhuVucId = nhanVienRows[0].KhuVucPhuTrachID;
          console.log(`[GoiYTinDangController] Lấy khu vực phụ trách từ hồ sơ NVBH: ${parentKhuVucId}`);
        }
      }

      // Lấy danh sách khu vực con để filter (tin đăng thường nằm trong các khu vực con, không phải parent)
      let khuVucIdsToFilter = null;
      if (parentKhuVucId) {
        const khuVucConList = await GoiYTinDangModel.layDanhSachKhuVucCon(parentKhuVucId);
        if (khuVucConList && khuVucConList.length > 0) {
          // Lấy array các child IDs
          khuVucIdsToFilter = khuVucConList.map(kv => kv.KhuVucID);
          console.log(`[GoiYTinDangController] Lấy được ${khuVucIdsToFilter.length} khu vực con từ parent ${parentKhuVucId}:`, khuVucIdsToFilter);
        } else {
          // Nếu không có khu vực con, dùng chính parent ID
          khuVucIdsToFilter = [parentKhuVucId];
          console.log(`[GoiYTinDangController] Không có khu vực con, dùng parent ID: ${parentKhuVucId}`);
        }
      }

      // Lấy thông tin cuộc hẹn để biết tin đăng gốc (loại trừ)
      let excludeTinDangId = null;

      if (cuocHenId) {
        const [cuocHenRows] = await db.execute(`
          SELECT 
            ch.CuocHenID,
            td.TinDangID
          FROM cuochen ch
          INNER JOIN phong p ON ch.PhongID = p.PhongID
          INNER JOIN phong_tindang pt ON p.PhongID = pt.PhongID
          INNER JOIN tindang td ON pt.TinDangID = td.TinDangID
          WHERE ch.CuocHenID = ? AND ch.NhanVienBanHangID = ?
          LIMIT 1
        `, [cuocHenId, nhanVienId]);

        if (cuocHenRows.length > 0) {
          excludeTinDangId = cuocHenRows[0].TinDangID;
          console.log(`[GoiYTinDangController] Loại trừ tin đăng gốc: ${excludeTinDangId}`);
        }
      }

      // Tìm kiếm tin đăng gợi ý
      console.log(`[GoiYTinDangController] Filters:`, {
        khuVucId: khuVucIdsToFilter, // Array các child IDs
        giaMin,
        giaMax,
        dienTichMin,
        dienTichMax,
        tienIch,
        excludeTinDangId,
        limit
      });

      // Đảm bảo không có undefined values
      const filters = {
        khuVucId: khuVucIdsToFilter || null, // Truyền array các child IDs
        giaMin: (giaMin !== undefined && giaMin !== null && giaMin !== '') ? parseFloat(giaMin) : null,
        giaMax: (giaMax !== undefined && giaMax !== null && giaMax !== '') ? parseFloat(giaMax) : null,
        dienTichMin: (dienTichMin !== undefined && dienTichMin !== null && dienTichMin !== '') ? parseFloat(dienTichMin) : null,
        dienTichMax: (dienTichMax !== undefined && dienTichMax !== null && dienTichMax !== '') ? parseFloat(dienTichMax) : null,
        tienIch: tienIch || null,
        excludeTinDangId: excludeTinDangId || null,
        limit: parseInt(limit) || 10
      };

      const results = await GoiYTinDangModel.timKiemGoiY(filters);

      console.log(`[GoiYTinDangController] Tìm thấy ${results.length} tin đăng`);

      // Lấy danh sách khu vực con dựa trên KhuVucPhuTrachID của NVBH (cho dropdown filter)
      let khuVucList = [];
      try {
        if (parentKhuVucId) {
          khuVucList = await GoiYTinDangModel.layDanhSachKhuVucCon(parentKhuVucId);
          console.log(`[GoiYTinDangController] Lấy được ${khuVucList.length} khu vực con từ parent ${parentKhuVucId} (cho dropdown)`);
        } else {
          // Nếu không có khu vực phụ trách, lấy tất cả khu vực
          khuVucList = await GoiYTinDangModel.layDanhSachKhuVuc();
          console.log(`[GoiYTinDangController] Lấy được ${khuVucList.length} khu vực (tất cả)`);
        }
      } catch (khuVucError) {
        console.error('[GoiYTinDangController] Lỗi khi lấy danh sách khu vực:', khuVucError);
        // Không throw error, chỉ log và trả về mảng rỗng
      }

      res.json({
        success: true,
        data: {
          tinDangList: results,
          khuVucList,
          filters: {
            khuVucId: parentKhuVucId, // Trả về parent ID cho UI
            giaMin,
            giaMax,
            dienTichMin,
            dienTichMax,
            tienIch,
            excludeTinDangId
          }
        },
        message: `Tìm thấy ${results.length} tin đăng phù hợp`
      });

    } catch (error) {
      console.error('[GoiYTinDangController] timKiemGoiY error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi tìm kiếm gợi ý tin đăng'
      });
    }
  }

  /**
   * Lấy danh sách khu vực con dựa trên KhuVucPhuTrachID của NVBH
   * GET /api/nhan-vien-ban-hang/goi-y/khu-vuc
   */
  static async layDanhSachKhuVuc(req, res) {
    try {
      const nhanVienId = req.user.id;

      // Lấy KhuVucPhuTrachID từ hồ sơ nhân viên
      const [nhanVienRows] = await db.execute(`
        SELECT KhuVucPhuTrachID 
        FROM hosonhanvien 
        WHERE NguoiDungID = ?
        LIMIT 1
      `, [nhanVienId]);

      let khuVucList = [];

      if (nhanVienRows.length > 0 && nhanVienRows[0].KhuVucPhuTrachID) {
        const parentKhuVucId = nhanVienRows[0].KhuVucPhuTrachID;
        khuVucList = await GoiYTinDangModel.layDanhSachKhuVucCon(parentKhuVucId);
        console.log(`[GoiYTinDangController] Lấy được ${khuVucList.length} khu vực con cho NVBH ${nhanVienId}`);
      } else {
        // Nếu không có khu vực phụ trách, trả về mảng rỗng
        console.log(`[GoiYTinDangController] NVBH ${nhanVienId} không có khu vực phụ trách`);
      }

      res.json({
        success: true,
        data: khuVucList
      });
    } catch (error) {
      console.error('[GoiYTinDangController] layDanhSachKhuVuc error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy danh sách khu vực'
      });
    }
  }

  /**
   * Lấy chi tiết tin đăng gợi ý (bao gồm danh sách phòng trống)
   * GET /api/nhan-vien-ban-hang/goi-y/tin-dang/:tinDangId
   */
  static async layChiTietTinDang(req, res) {
    try {
      const { tinDangId } = req.params;

      const tinDang = await GoiYTinDangModel.layChiTietTinDangGoiY(tinDangId);

      if (!tinDang) {
        return res.status(404).json({
          success: false,
          message: 'Tin đăng không tồn tại hoặc không khả dụng'
        });
      }

      res.json({
        success: true,
        data: tinDang
      });

    } catch (error) {
      console.error('[GoiYTinDangController] layChiTietTinDang error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy chi tiết tin đăng'
      });
    }
  }

  /**
   * Tạo QR "Xem Ngay"
   * POST /api/nhan-vien-ban-hang/goi-y/tao-qr
   */
  static async taoQRXemNgay(req, res) {
    try {
      const nhanVienId = req.user.id;
      const { cuocHenId, tinDangId, phongId } = req.body;

      console.log(`[GoiYTinDangController] taoQRXemNgay - NVBH: ${nhanVienId}, TinDang: ${tinDangId}, Phong: ${phongId}`);

      // Validate required fields
      if (!tinDangId || !phongId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin tin đăng hoặc phòng'
        });
      }

      // Kiểm tra phòng còn trống không
      const phongConTrong = await GoiYTinDangModel.kiemTraPhongConTrong(phongId);
      if (!phongConTrong) {
        return res.status(400).json({
          success: false,
          message: 'Phòng này không còn trống. Vui lòng chọn phòng khác.'
        });
      }

      // Lấy thông tin phòng
      const thongTinPhong = await GoiYTinDangModel.layChiTietPhong(phongId);
      if (!thongTinPhong) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin phòng'
        });
      }

      // Lấy thông tin tin đăng
      const thongTinTinDang = await GoiYTinDangModel.layChiTietTinDangGoiY(tinDangId);
      if (!thongTinTinDang) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin tin đăng'
        });
      }

      // Lấy thông tin nhân viên
      const [nhanVienRows] = await db.execute(`
        SELECT 
          nd.NguoiDungID,
          nd.TenDayDu,
          nd.SoDienThoai,
          nd.Email,
          hs.MaNhanVien
        FROM nguoidung nd
        LEFT JOIN hosonhanvien hs ON nd.NguoiDungID = hs.NguoiDungID
        WHERE nd.NguoiDungID = ?
      `, [nhanVienId]);

      const thongTinNhanVien = nhanVienRows.length > 0 ? nhanVienRows[0] : null;

      // Tạo mã QR unique
      const maQR = generateQRCode(12);

      // Lưu session
      const session = QRSessionStore.create({
        maQR,
        nhanVienId,
        cuocHenId: cuocHenId || null,
        tinDangId,
        phongId,
        thongTinPhong,
        thongTinTinDang: {
          TinDangID: thongTinTinDang.TinDangID,
          TieuDe: thongTinTinDang.TieuDe,
          DiaChi: thongTinTinDang.DiaChi,
          TenDuAn: thongTinTinDang.TenDuAn,
          GiaDien: thongTinTinDang.GiaDien,
          GiaNuoc: thongTinTinDang.GiaNuoc,
          GiaDichVu: thongTinTinDang.GiaDichVu,
          TienIch: thongTinTinDang.TienIch,
          ViDo: thongTinTinDang.ViDo,
          KinhDo: thongTinTinDang.KinhDo,
          PhuongThucVao: thongTinTinDang.PhuongThucVao
        },
        thongTinNhanVien: thongTinNhanVien ? {
          NguoiDungID: thongTinNhanVien.NguoiDungID,
          TenDayDu: thongTinNhanVien.TenDayDu,
          SoDienThoai: thongTinNhanVien.SoDienThoai,
          MaNhanVien: thongTinNhanVien.MaNhanVien
        } : null
      });

      // Tính thời gian còn lại
      const thoiGianConLai = QRSessionStore.getRemainingTime(maQR);

      res.json({
        success: true,
        data: {
          maQR,
          qrUrl: `/xem-ngay/${maQR}`,
          thoiGianConLai,
          hetHanLuc: session.hetHanLuc,
          thongTinPhong: {
            PhongID: thongTinPhong.PhongID,
            TenPhong: thongTinPhong.TenPhong,
            Gia: thongTinPhong.GiaChuan,
            DienTich: thongTinPhong.DienTichChuan,
            DiaChi: thongTinPhong.DiaChi,
            TenDuAn: thongTinPhong.TenDuAn
          }
        },
        message: 'Tạo QR thành công'
      });

    } catch (error) {
      console.error('[GoiYTinDangController] taoQRXemNgay error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi tạo QR'
      });
    }
  }

  /**
   * Xem thông tin QR (Public - Khách quét QR)
   * GET /api/public/xem-ngay/:maQR
   */
  static async xemQRXemNgay(req, res) {
    try {
      const { maQR } = req.params;

      console.log(`[GoiYTinDangController] xemQRXemNgay - MaQR: ${maQR}`);

      const session = QRSessionStore.get(maQR);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Mã QR không tồn tại hoặc đã hết hạn'
        });
      }

      // Kiểm tra trạng thái
      if (session.trangThai === 'HET_HAN') {
        return res.status(410).json({
          success: false,
          message: 'Mã QR đã hết hạn',
          trangThai: 'HET_HAN'
        });
      }

      if (session.trangThai !== 'CHO_PHAN_HOI') {
        return res.status(409).json({
          success: false,
          message: session.trangThai === 'DONG_Y' 
            ? 'Bạn đã xác nhận xem phòng này rồi' 
            : 'Bạn đã từ chối xem phòng này',
          trangThai: session.trangThai
        });
      }

      // Tính thời gian còn lại
      const thoiGianConLai = QRSessionStore.getRemainingTime(maQR);

      res.json({
        success: true,
        data: {
          maQR,
          trangThai: session.trangThai,
          thoiGianConLai,
          thongTinPhong: session.thongTinPhong,
          thongTinTinDang: session.thongTinTinDang,
          // Chỉ hiển thị thông tin liên hệ SAU khi khách đồng ý
          thongTinNhanVien: null
        }
      });

    } catch (error) {
      console.error('[GoiYTinDangController] xemQRXemNgay error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi xem thông tin QR'
      });
    }
  }

  /**
   * Phản hồi QR (Public - Khách đồng ý/từ chối)
   * POST /api/public/xem-ngay/:maQR/phan-hoi
   */
  static async phanHoiQRXemNgay(req, res) {
    try {
      const { maQR } = req.params;
      const { dongY, thoiGianHen } = req.body; // true = đồng ý, false = từ chối
      // thoiGianHen: Thời gian từ thiết bị khách hàng (format: YYYY-MM-DD HH:MM:SS hoặc ISO string)

      console.log(`[GoiYTinDangController] phanHoiQRXemNgay - MaQR: ${maQR}, DongY: ${dongY}, ThoiGianHen: ${thoiGianHen}`);

      const session = QRSessionStore.get(maQR);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Mã QR không tồn tại hoặc đã hết hạn'
        });
      }

      // Kiểm tra trạng thái
      if (session.trangThai !== 'CHO_PHAN_HOI') {
        return res.status(409).json({
          success: false,
          message: 'Bạn đã phản hồi rồi',
          trangThai: session.trangThai
        });
      }

      // Kiểm tra hết hạn
      if (Date.now() > session.hetHanLuc) {
        QRSessionStore.updateStatus(maQR, 'HET_HAN');
        return res.status(410).json({
          success: false,
          message: 'Mã QR đã hết hạn',
          trangThai: 'HET_HAN'
        });
      }

      // Cập nhật trạng thái
      const newStatus = dongY ? QRSessionStore.STATUS.DONG_Y : QRSessionStore.STATUS.TU_CHOI;
      const updatedSession = QRSessionStore.updateStatus(maQR, newStatus);

      // NẾU ĐỒNG Ý: Tự động tạo cuộc hẹn mới
      let cuocHenMoiId = null;
      if (dongY) {
        try {
          // 1. Lấy KhachHangID từ cuộc hẹn gốc (BẮT BUỘC)
          let khachHangID = null;
          if (session.cuocHenId) {
            const [cuocHenGoc] = await db.execute(
              'SELECT KhachHangID FROM cuochen WHERE CuocHenID = ?',
              [session.cuocHenId]
            );
            if (cuocHenGoc.length > 0) {
              khachHangID = cuocHenGoc[0].KhachHangID;
            }
          }

          if (!khachHangID) {
            throw new Error(`Không tìm thấy KhachHangID từ cuộc hẹn gốc ${session.cuocHenId}. Không thể tạo cuộc hẹn mới.`);
          }

          // 2. Lấy thông tin dự án và ChuDuAnID từ tin đăng (1 query duy nhất)
          const [tinDangRows] = await db.execute(
            `SELECT 
              td.DuAnID, 
              da.ChuDuAnID,
              da.YeuCauPheDuyetChu,
              da.PhuongThucVao
             FROM tindang td
             INNER JOIN duan da ON td.DuAnID = da.DuAnID
             WHERE td.TinDangID = ?`,
            [session.tinDangId]
          );

          if (tinDangRows.length === 0) {
            throw new Error('Không tìm thấy thông tin dự án cho tin đăng này');
          }

          const chuDuAnID = tinDangRows[0].ChuDuAnID;
          const yeuCauPheDuyet = tinDangRows[0]?.YeuCauPheDuyetChu || 0;
          const phuongThucVao = tinDangRows[0]?.PhuongThucVao || null; // NULL nếu không có

          // 3. Xác định trạng thái cuộc hẹn
          const trangThai = yeuCauPheDuyet ? 'ChoXacNhan' : 'DaXacNhan';
          const pheDuyetChuDuAn = yeuCauPheDuyet ? 'ChoPheDuyet' : 'DaPheDuyet';

          // 4. Tạo GhiChuKetQua JSON với lịch sử (theo format chuẩn)
          const ghiChuKetQua = {
            activities: [
              {
                timestamp: new Date().toISOString(),
                action: 'xac_nhan',
                actor: 'NVBH',
                nhanVienId: session.nhanVienId,
                note: 'Khách hàng đồng ý xem phòng qua QR gợi ý. Cuộc hẹn được tạo tự động.',
                qrCode: maQR,
                cuocHenGoc: session.cuocHenId
              }
            ]
          };

          // 5. Thời gian hẹn từ thiết bị khách hàng (nếu có) hoặc fallback về server time
          // Format: YYYY-MM-DD HH:MM:SS (MySQL datetime format)
          let thoiGianHenFinal = null;
          
          if (thoiGianHen) {
            // Validate và parse thời gian từ client
            try {
              // Nếu là ISO string, parse và format lại
              let parsedDate;
              if (thoiGianHen.includes('T') || thoiGianHen.includes('Z')) {
                // ISO format: 2024-01-15T10:30:00Z hoặc 2024-01-15T10:30:00
                parsedDate = new Date(thoiGianHen);
              } else if (thoiGianHen.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
                // MySQL datetime format: 2024-01-15 10:30:00
                // Parse bằng cách thêm 'T' để tạo ISO string
                parsedDate = new Date(thoiGianHen.replace(' ', 'T'));
              } else {
                throw new Error('Format thời gian không hợp lệ');
              }

              // Validate: Không được là quá khứ (cho phép 5 phút trước để xử lý độ lệch thời gian)
              const now = new Date();
              const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
              if (parsedDate < fiveMinutesAgo) {
                throw new Error('Thời gian hẹn không được là quá khứ');
              }

              // Validate: Không được quá xa tương lai (tối đa 1 năm)
              const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
              if (parsedDate > oneYearLater) {
                throw new Error('Thời gian hẹn không được quá xa trong tương lai');
              }

              // Format lại theo MySQL datetime: YYYY-MM-DD HH:MM:SS
              const year = parsedDate.getFullYear();
              const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
              const day = String(parsedDate.getDate()).padStart(2, '0');
              const hours = String(parsedDate.getHours()).padStart(2, '0');
              const minutes = String(parsedDate.getMinutes()).padStart(2, '0');
              const seconds = String(parsedDate.getSeconds()).padStart(2, '0');
              thoiGianHenFinal = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
              
              console.log(`[GoiYTinDangController] ✅ Sử dụng thời gian từ thiết bị khách hàng: ${thoiGianHenFinal}`);
            } catch (parseError) {
              console.warn(`[GoiYTinDangController] ⚠️ Lỗi parse thời gian từ client: ${parseError.message}. Sử dụng thời gian server.`);
              // Fallback về server time nếu parse lỗi
              const now = new Date();
              thoiGianHenFinal = now.toISOString().slice(0, 19).replace('T', ' ');
            }
          } else {
            // Nếu không có thời gian từ client, sử dụng server time
            const now = new Date();
            thoiGianHenFinal = now.toISOString().slice(0, 19).replace('T', ' ');
            console.log(`[GoiYTinDangController] ⚠️ Không có thời gian từ client. Sử dụng thời gian server: ${thoiGianHenFinal}`);
          }

          // 6. GhiChu (NOT NULL) - mô tả cuộc hẹn được tạo từ QR
          const ghiChu = `Cuộc hẹn được tạo tự động từ QR gợi ý (${maQR}). Cuộc hẹn gốc: #${session.cuocHenId || 'N/A'}`;

          // 7. Tạo cuộc hẹn mới (theo đúng schema bảng cuochen)
          const [result] = await db.execute(
            `INSERT INTO cuochen 
             (PhongID, TinDangID, ChuDuAnID, KhachHangID, NhanVienBanHangID, 
              ThoiGianHen, TrangThai, PhuongThucVao, PheDuyetChuDuAn, 
              GhiChu, GhiChuKetQua, SoLanDoiLich, TaoLuc, CapNhatLuc)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
            [
              session.phongId,
              session.tinDangId,
              chuDuAnID,
              khachHangID,
              session.nhanVienId,
              thoiGianHenFinal,
              trangThai,
              phuongThucVao, // NULL nếu không có
              pheDuyetChuDuAn,
              ghiChu, // NOT NULL
              JSON.stringify(ghiChuKetQua) // NULL nếu không có
            ]
          );

          cuocHenMoiId = result.insertId;
          console.log(`[GoiYTinDangController] ✅ Đã tạo cuộc hẹn mới #${cuocHenMoiId} từ QR ${maQR} cho KhachHangID=${khachHangID}`);

          // 8. Ghi nhật ký hệ thống
          const NhatKyHeThongService = require('../services/NhatKyHeThongService');
          await NhatKyHeThongService.ghiNhan(
            session.nhanVienId,
            'tao_cuoc_hen_tu_qr',
            'CuocHen',
            cuocHenMoiId,
            null,
            { 
              qrCode: maQR, 
              cuocHenGoc: session.cuocHenId,
              tinDangId: session.tinDangId,
              phongId: session.phongId,
              khachHangID: khachHangID
            },
            req.ip,
            req.get('User-Agent')
          );

          // 9. Gửi thông báo cho NVBH về cuộc hẹn từ QR (async, không chờ)
          const ThongBaoService = require('../services/ThongBaoService');
          ThongBaoService.thongBaoCuocHenTuQR(cuocHenMoiId, session.nhanVienId, maQR)
            .catch(err => console.error('[GoiYTinDangController] Lỗi gửi thông báo cuộc hẹn từ QR:', err));

        } catch (createError) {
          console.error('[GoiYTinDangController] ❌ Lỗi khi tạo cuộc hẹn mới từ QR:', createError);
          // Vẫn cập nhật trạng thái QR nhưng log lỗi
          // Không throw error để không làm gián đoạn flow phản hồi QR
          // NVBH sẽ thấy lỗi trong log và có thể tạo cuộc hẹn thủ công
        }
      }

      // Gửi thông báo phản hồi gợi ý cho NVBH (async, không chờ)
      // Lấy KhachHangID từ cuộc hẹn gốc hoặc từ session
      let khachHangIDForNotification = null;
      if (dongY && cuocHenMoiId) {
        // Nếu đã tạo cuộc hẹn mới, lấy từ cuộc hẹn mới
        try {
          const [cuocHenMoi] = await db.execute(
            'SELECT KhachHangID FROM cuochen WHERE CuocHenID = ?',
            [cuocHenMoiId]
          );
          if (cuocHenMoi.length > 0) {
            khachHangIDForNotification = cuocHenMoi[0].KhachHangID;
          }
        } catch (err) {
          console.error('[GoiYTinDangController] Lỗi lấy KhachHangID từ cuộc hẹn mới:', err);
        }
      } else if (session.cuocHenId) {
        // Nếu không tạo cuộc hẹn mới, lấy từ cuộc hẹn gốc
        try {
          const [cuocHenGoc] = await db.execute(
            'SELECT KhachHangID FROM cuochen WHERE CuocHenID = ?',
            [session.cuocHenId]
          );
          if (cuocHenGoc.length > 0) {
            khachHangIDForNotification = cuocHenGoc[0].KhachHangID;
          }
        } catch (err) {
          console.error('[GoiYTinDangController] Lỗi lấy KhachHangID từ cuộc hẹn gốc:', err);
        }
      }

      const ThongBaoService = require('../services/ThongBaoService');
      const phanHoi = dongY ? 'XemNgay' : 'KhongThich';
      ThongBaoService.thongBaoPhanHoiGoiY(session.nhanVienId, {
        KhachHangID: khachHangIDForNotification,
        TinDangID: session.tinDangId,
        PhanHoi: phanHoi
      }).catch(err => console.error('[GoiYTinDangController] Lỗi gửi thông báo phản hồi gợi ý:', err));

      // Emit socket event để NVBH nhận thông báo real-time
      const io = req.app.get('io');
      if (io) {
        io.to(`goi_y_${maQR}`).emit('goi_y_phan_hoi', {
          maQR,
          trangThai: newStatus,
          phanHoiLuc: updatedSession.phanHoiLuc,
          cuocHenMoiId: cuocHenMoiId // Thêm ID cuộc hẹn mới vào event
        });
        console.log(`[GoiYTinDangController] Emitted goi_y_phan_hoi to room goi_y_${maQR}`);
      }

      // Response
      const responseData = {
        maQR,
        trangThai: newStatus,
        message: dongY ? 'Cảm ơn bạn đã xác nhận! Cuộc hẹn đã được tạo tự động.' : 'Đã ghi nhận phản hồi của bạn',
        cuocHenMoiId: cuocHenMoiId // Trả về ID cuộc hẹn mới nếu có
      };

      // Nếu đồng ý, trả về thông tin liên hệ NVBH
      if (dongY && updatedSession.thongTinNhanVien) {
        responseData.thongTinLienHe = {
          tenNhanVien: updatedSession.thongTinNhanVien.TenDayDu,
          soDienThoai: updatedSession.thongTinNhanVien.SoDienThoai,
          diaChi: updatedSession.thongTinPhong?.DiaChi || updatedSession.thongTinTinDang?.DiaChi,
          tenDuAn: updatedSession.thongTinPhong?.TenDuAn || updatedSession.thongTinTinDang?.TenDuAn,
          viDo: updatedSession.thongTinPhong?.ViDo || updatedSession.thongTinTinDang?.ViDo,
          kinhDo: updatedSession.thongTinPhong?.KinhDo || updatedSession.thongTinTinDang?.KinhDo
        };
      }

      res.json({
        success: true,
        data: responseData
      });

    } catch (error) {
      console.error('[GoiYTinDangController] phanHoiQRXemNgay error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi xử lý phản hồi'
      });
    }
  }

  /**
   * Tạo QR đặt cọc cho khách hàng quét
   * POST /api/nhan-vien-ban-hang/goi-y/tao-qr-dat-coc
   */
  static async taoQRDatCoc(req, res) {
    try {
      const nhanVienId = req.user.id;
      const { cuocHenId, tinDangId, phongId, soThangKy, soTienCoc } = req.body;

      console.log(`[GoiYTinDangController] taoQRDatCoc - NVBH: ${nhanVienId}, CuocHen: ${cuocHenId}, TinDang: ${tinDangId}, Phong: ${phongId}`);

      // Validate required fields
      if (!cuocHenId || !tinDangId || !phongId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin cuộc hẹn, tin đăng hoặc phòng'
        });
      }

      // Kiểm tra phòng còn trống không
      const phongConTrong = await GoiYTinDangModel.kiemTraPhongConTrong(phongId);
      if (!phongConTrong) {
        return res.status(400).json({
          success: false,
          message: 'Phòng này không còn trống. Không thể đặt cọc.'
        });
      }

      // Lấy thông tin phòng
      const thongTinPhong = await GoiYTinDangModel.layChiTietPhong(phongId);
      if (!thongTinPhong) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin phòng'
        });
      }

      // Lấy thông tin tin đăng
      const thongTinTinDang = await GoiYTinDangModel.layChiTietTinDangGoiY(tinDangId);
      if (!thongTinTinDang) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin tin đăng'
        });
      }

      // Lấy thông tin cuộc hẹn để có khách hàng ID
      const [cuocHenRows] = await db.execute(`
        SELECT 
          ch.CuocHenID,
          ch.KhachHangID,
          kh.TenDayDu as TenKhachHang,
          kh.SoDienThoai as SDTKhachHang,
          kh.Email as EmailKhachHang
        FROM cuochen ch
        LEFT JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
        WHERE ch.CuocHenID = ?
      `, [cuocHenId]);

      const thongTinCuocHen = cuocHenRows.length > 0 ? cuocHenRows[0] : null;
      if (!thongTinCuocHen) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin cuộc hẹn'
        });
      }

      // Lấy thông tin nhân viên
      const [nhanVienRows] = await db.execute(`
        SELECT 
          nd.NguoiDungID,
          nd.TenDayDu,
          nd.SoDienThoai,
          nd.Email,
          hs.MaNhanVien
        FROM nguoidung nd
        LEFT JOIN hosonhanvien hs ON nd.NguoiDungID = hs.NguoiDungID
        WHERE nd.NguoiDungID = ?
      `, [nhanVienId]);

      const thongTinNhanVien = nhanVienRows.length > 0 ? nhanVienRows[0] : null;

      // Tính số tiền cọc nếu chưa có
      // Giá phòng: ưu tiên GiaTinDang (nếu có), fallback GiaChuan
      const [ptRows] = await db.execute(
        `SELECT GiaTinDang FROM phong_tindang WHERE PhongID = ? AND TinDangID = ? LIMIT 1`,
        [phongId, tinDangId]
      );
      const giaPhong = ptRows.length > 0 && ptRows[0].GiaTinDang != null
        ? Number(ptRows[0].GiaTinDang)
        : Number(thongTinPhong.GiaChuan) || 0;
      const soThangCocToiThieu = Number(thongTinTinDang.SoThangCocToiThieu) || 1;
      const tienCocTinhToan = soTienCoc || (giaPhong * soThangCocToiThieu);

      // Tạo mã QR unique
      const maQR = generateQRCode(12);

      // Lưu session với thông tin đặt cọc
      const soThangKyFinal = soThangKy || soThangCocToiThieu;
      const session = QRSessionStore.create({
        maQR,
        nhanVienId,
        cuocHenId,
        tinDangId,
        phongId,
        loaiQR: 'DAT_COC', // Đánh dấu loại QR là đặt cọc
        soThangKy: soThangKyFinal, // Thêm trực tiếp để QRSessionStore lưu đúng
        thongTinDatCoc: {
          soThangKy: soThangKyFinal,
          soTienCoc: tienCocTinhToan,
          khachHangId: thongTinCuocHen.KhachHangID
        },
        thongTinPhong,
        thongTinTinDang: {
          TinDangID: thongTinTinDang.TinDangID,
          TieuDe: thongTinTinDang.TieuDe,
          DiaChi: thongTinTinDang.DiaChi,
          TenDuAn: thongTinTinDang.TenDuAn,
          GiaDien: thongTinTinDang.GiaDien,
          GiaNuoc: thongTinTinDang.GiaNuoc,
          GiaDichVu: thongTinTinDang.GiaDichVu,
          SoThangCocToiThieu: thongTinTinDang.SoThangCocToiThieu,
          BangHoaHong: thongTinTinDang.BangHoaHong
        },
        thongTinKhachHang: {
          KhachHangID: thongTinCuocHen.KhachHangID,
          TenDayDu: thongTinCuocHen.TenKhachHang,
          SoDienThoai: thongTinCuocHen.SDTKhachHang,
          Email: thongTinCuocHen.EmailKhachHang
        },
        thongTinNhanVien: thongTinNhanVien ? {
          NguoiDungID: thongTinNhanVien.NguoiDungID,
          TenDayDu: thongTinNhanVien.TenDayDu,
          SoDienThoai: thongTinNhanVien.SoDienThoai,
          MaNhanVien: thongTinNhanVien.MaNhanVien
        } : null
      });

      // Tính thời gian còn lại
      const thoiGianConLai = QRSessionStore.getRemainingTime(maQR);

      res.json({
        success: true,
        data: {
          maQR,
          qrUrl: `/dat-coc/${maQR}`,
          thoiGianConLai,
          hetHanLuc: session.hetHanLuc,
          thongTinPhong: {
            PhongID: thongTinPhong.PhongID,
            TenPhong: thongTinPhong.TenPhong,
            Gia: thongTinPhong.GiaChuan,
            DienTich: thongTinPhong.DienTichChuan,
            DiaChi: thongTinPhong.DiaChi,
            TenDuAn: thongTinPhong.TenDuAn
          },
          thongTinDatCoc: {
            soThangKy: soThangKy || soThangCocToiThieu,
            soTienCoc: tienCocTinhToan
          }
        },
        message: 'Tạo QR đặt cọc thành công'
      });

    } catch (error) {
      console.error('[GoiYTinDangController] taoQRDatCoc error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi tạo QR đặt cọc'
      });
    }
  }

  /**
   * Kiểm tra trạng thái QR (NVBH polling)
   * GET /api/nhan-vien-ban-hang/goi-y/trang-thai/:maQR
   */
  static async kiemTraTrangThaiQR(req, res) {
    try {
      const { maQR } = req.params;
      const nhanVienId = req.user.id;

      const session = QRSessionStore.get(maQR);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy session'
        });
      }

      // Kiểm tra ownership
      if (session.nhanVienId !== nhanVienId) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền xem session này'
        });
      }

      res.json({
        success: true,
        data: {
          maQR,
          trangThai: session.trangThai,
          thoiGianConLai: QRSessionStore.getRemainingTime(maQR),
          phanHoiLuc: session.phanHoiLuc
        }
      });

    } catch (error) {
      console.error('[GoiYTinDangController] kiemTraTrangThaiQR error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi kiểm tra trạng thái'
      });
    }
  }
}

module.exports = GoiYTinDangController;

