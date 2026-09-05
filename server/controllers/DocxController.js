/**
 * Controller xử lý tạo file Word (.docx)
 */

const DocxGeneratorService = require('../services/DocxGeneratorService');
const path = require('path');
const fs = require('fs');

class DocxController {
  /**
   * Tạo báo cáo hiệu suất Chủ dự án
   * POST /api/docx/bao-cao-hieu-suat/:chuDuAnId
   */
  static async taoBaoCaoHieuSuat(req, res) {
    try {
      const { chuDuAnId } = req.params;

      // TODO: Lấy dữ liệu từ database
      // const data = await BaoCaoService.layDuLieuBaoCaoHieuSuat(chuDuAnId);

      // Mock data for now
      const data = {
        tenChuDuAn: 'Nguyễn Văn A',
        email: 'nguyenvana@example.com',
        soDienThoai: '0901234567',
        thongKeTinDang: [
          ['Đã duyệt', '15', '60%'],
          ['Chờ duyệt', '5', '20%'],
          ['Đã đăng', '10', '40%']
        ],
        tongDoanhThu: 50000000,
        doanhThuTheoThang: [
          ['Tháng 1', '10,000,000', '2,000,000', '8,000,000'],
          ['Tháng 2', '15,000,000', '3,000,000', '12,000,000'],
          ['Tháng 3', '25,000,000', '5,000,000', '20,000,000']
        ],
        thongKeCuocHen: [
          ['Đã hẹn', '8', '50%'],
          ['Đã hoàn thành', '5', '31.25%'],
          ['Đã hủy', '3', '18.75%']
        ],
        danhGia: 'Chủ dự án hoạt động tốt, tỷ lệ chuyển đổi cao.'
      };

      // Generate filename
      const filename = `BaoCaoHieuSuat_${chuDuAnId}_${Date.now()}.docx`;
      const outputPath = path.join(process.cwd(), 'temp', filename);

      // Ensure temp directory exists
      const tempDir = path.dirname(outputPath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Generate document
      await DocxGeneratorService.taoBaoCaoHieuSuatChuDuAn(data, outputPath);

      // Send file
      res.download(outputPath, filename, (err) => {
        // Clean up file after download
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }

        if (err) {
          console.error('[DocxController] Error sending file:', err);
        }
      });
    } catch (error) {
      console.error('[DocxController] Error in taoBaoCaoHieuSuat:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi tạo báo cáo',
        error: error.message
      });
    }
  }

  /**
   * Tạo hợp đồng thuê phòng
   * POST /api/docx/hop-dong/:hopDongId
   */
  static async taoHopDong(req, res) {
    try {
      const { hopDongId } = req.params;

      // TODO: Lấy dữ liệu hợp đồng từ database
      // const hopDong = await HopDongService.layThongTinHopDong(hopDongId);

      // Mock data for now
      const hopDong = {
        tenChuNha: 'Nguyễn Văn B',
        cmndChuNha: '001234567890',
        sdtChuNha: '0909876543',
        diaChiChuNha: '123 Đường ABC, Quận 1, TP.HCM',
        tenNguoiThue: 'Trần Thị C',
        cmndNguoiThue: '009876543210',
        sdtNguoiThue: '0901234567',
        diaChiNguoiThue: '456 Đường XYZ, Quận 2, TP.HCM',
        diaChiPhong: 'Phòng 101, 123 Đường ABC, Quận 1, TP.HCM',
        dienTich: 25,
        giaThue: 3000000,
        ngayBatDau: '01/01/2025',
        ngayKetThuc: '31/12/2025'
      };

      // Generate filename
      const filename = `HopDong_${hopDongId}_${Date.now()}.docx`;
      const outputPath = path.join(process.cwd(), 'temp', filename);

      // Ensure temp directory exists
      const tempDir = path.dirname(outputPath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Generate document
      await DocxGeneratorService.taoHopDongThuePhong(hopDong, outputPath);

      // Send file
      res.download(outputPath, filename, (err) => {
        // Clean up file after download
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }

        if (err) {
          console.error('[DocxController] Error sending file:', err);
        }
      });
    } catch (error) {
      console.error('[DocxController] Error in taoHopDong:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi tạo hợp đồng',
        error: error.message
      });
    }
  }

  /**
   * Tạo báo cáo thu chi
   * POST /api/docx/bao-cao-thu-chi
   */
  static async taoBaoCaoThuChi(req, res) {
    try {
      const { kyBaoCao, tuNgay, denNgay } = req.body;

      // TODO: Lấy dữ liệu thu chi từ database
      // const data = await ThuChiService.layDuLieuThuChi(tuNgay, denNgay);

      // Mock data for now
      const data = {
        tieuDe: kyBaoCao || 'Tháng 11/2025',
        kyBaoCao: `${tuNgay} - ${denNgay}`,
        danhSachThu: [
          ['Tiền thuê phòng', '15,000,000', 'Phòng 101-105'],
          ['Tiền điện nước', '2,000,000', 'Thu thêm'],
          ['Tiền dịch vụ', '1,000,000', 'Internet, vệ sinh']
        ],
        tongThu: 18000000,
        danhSachChi: [
          ['Sửa chữa', '3,000,000', 'Sửa điều hòa phòng 103'],
          ['Điện nước', '2,500,000', 'Hóa đơn tháng 11'],
          ['Bảo vệ', '2,000,000', 'Lương bảo vệ'],
          ['Khác', '500,000', 'Chi phí khác']
        ],
        tongChi: 8000000
      };

      // Generate filename
      const filename = `BaoCaoThuChi_${Date.now()}.docx`;
      const outputPath = path.join(process.cwd(), 'temp', filename);

      // Ensure temp directory exists
      const tempDir = path.dirname(outputPath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Generate document
      await DocxGeneratorService.taoBaoCaoThuChi(data, outputPath);

      // Send file
      res.download(outputPath, filename, (err) => {
        // Clean up file after download
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }

        if (err) {
          console.error('[DocxController] Error sending file:', err);
        }
      });
    } catch (error) {
      console.error('[DocxController] Error in taoBaoCaoThuChi:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi tạo báo cáo thu chi',
        error: error.message
      });
    }
  }

  /**
   * Tạo document tùy chỉnh từ JSON config
   * POST /api/docx/custom
   */
  static async taoDocumentCustom(req, res) {
    try {
      const { config } = req.body;

      if (!config) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu config'
        });
      }

      // Generate filename
      const filename = `Document_${Date.now()}.docx`;
      const outputPath = path.join(process.cwd(), 'temp', filename);

      // Ensure temp directory exists
      const tempDir = path.dirname(outputPath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Generate document
      await DocxGeneratorService.createDocx(config, outputPath);

      // Send file
      res.download(outputPath, filename, (err) => {
        // Clean up file after download
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }

        if (err) {
          console.error('[DocxController] Error sending file:', err);
        }
      });
    } catch (error) {
      console.error('[DocxController] Error in taoDocumentCustom:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi tạo document',
        error: error.message
      });
    }
  }
}

module.exports = DocxController;


