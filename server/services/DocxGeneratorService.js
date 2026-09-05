/**
 * Service tạo file Word (.docx)
 * Sử dụng Python script helper với python-docx
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

class DocxGeneratorService {
  /**
   * Tạo file .docx từ config
   * @param {Object} config - Config theo format của create_docx.py
   * @param {string} config.title - Tiêu đề document
   * @param {Array} config.sections - Danh sách sections
   * @param {string} outputPath - Đường dẫn file output
   * @returns {Promise<string>} - Đường dẫn file đã tạo
   */
  static async createDocx(config, outputPath) {
    try {
      // Tạo temp config file
      const tempConfigPath = path.join(
        process.cwd(),
        'temp',
        `docx_config_${Date.now()}.json`
      );

      // Ensure temp directory exists
      const tempDir = path.dirname(tempConfigPath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Write config to temp file
      await writeFileAsync(tempConfigPath, JSON.stringify(config, null, 2), 'utf-8');

      // Execute Python script
      const scriptPath = path.join(process.cwd(), 'scripts', 'create_docx.py');
      const command = `python "${scriptPath}" --json "${tempConfigPath}" --output "${outputPath}"`;

      const { stdout, stderr } = await execAsync(command);

      // Clean up temp file
      await unlinkAsync(tempConfigPath);

      if (stderr && !stderr.includes('[OK]')) {
        throw new Error(`Python script error: ${stderr}`);
      }

      return outputPath;
    } catch (error) {
      throw new Error(`Lỗi tạo file .docx: ${error.message}`);
    }
  }

  /**
   * Tạo file .docx đơn giản với title và content
   * @param {string} title - Tiêu đề
   * @param {string} content - Nội dung
   * @param {string} outputPath - Đường dẫn file output
   * @returns {Promise<string>}
   */
  static async createSimpleDocx(title, content, outputPath) {
    const config = {
      title,
      sections: [
        {
          type: 'paragraph',
          text: content
        }
      ]
    };

    return this.createDocx(config, outputPath);
  }

  /**
   * Tạo báo cáo hiệu suất Chủ dự án
   * @param {Object} data - Dữ liệu báo cáo
   * @param {string} outputPath - Đường dẫn file output
   * @returns {Promise<string>}
   */
  static async taoBaoCaoHieuSuatChuDuAn(data, outputPath) {
    const config = {
      title: `Báo Cáo Hiệu Suất - ${data.tenChuDuAn}`,
      sections: [
        {
          type: 'heading1',
          text: '1. Thông Tin Chủ Dự Án'
        },
        {
          type: 'paragraph',
          text: `Tên: ${data.tenChuDuAn}`
        },
        {
          type: 'paragraph',
          text: `Email: ${data.email}`
        },
        {
          type: 'paragraph',
          text: `Số điện thoại: ${data.soDienThoai}`
        },
        {
          type: 'paragraph',
          text: `Ngày tạo báo cáo: ${new Date().toLocaleDateString('vi-VN')}`
        },
        {
          type: 'page_break'
        },
        {
          type: 'heading1',
          text: '2. Thống Kê Tin Đăng'
        },
        {
          type: 'table',
          headers: ['Trạng Thái', 'Số Lượng', 'Tỷ Lệ'],
          rows: data.thongKeTinDang || []
        },
        {
          type: 'heading1',
          text: '3. Doanh Thu'
        },
        {
          type: 'paragraph',
          text: `Tổng doanh thu: ${data.tongDoanhThu?.toLocaleString('vi-VN')} VNĐ`,
          bold: true,
          font_size: 14
        },
        {
          type: 'table',
          headers: ['Tháng', 'Doanh Thu', 'Chi Phí', 'Lợi Nhuận'],
          rows: data.doanhThuTheoThang || []
        },
        {
          type: 'heading1',
          text: '4. Cuộc Hẹn'
        },
        {
          type: 'table',
          headers: ['Trạng Thái', 'Số Lượng', 'Tỷ Lệ'],
          rows: data.thongKeCuocHen || []
        },
        {
          type: 'page_break'
        },
        {
          type: 'heading1',
          text: '5. Đánh Giá & Nhận Xét'
        },
        {
          type: 'paragraph',
          text: data.danhGia || 'Chưa có đánh giá'
        }
      ]
    };

    return this.createDocx(config, outputPath);
  }

  /**
   * Tạo hợp đồng thuê phòng
   * @param {Object} hopDong - Dữ liệu hợp đồng
   * @param {string} outputPath - Đường dẫn file output
   * @returns {Promise<string>}
   */
  static async taoHopDongThuePhong(hopDong, outputPath) {
    const config = {
      title: 'HỢP ĐỒNG THUÊ BẤT ĐỘNG SẢN',
      sections: [
        {
          type: 'paragraph',
          text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
          align: 'center',
          bold: true
        },
        {
          type: 'paragraph',
          text: 'Độc lập - Tự do - Hạnh phúc',
          align: 'center',
          bold: true
        },
        {
          type: 'paragraph',
          text: '--------------------------------',
          align: 'center'
        },
        {
          type: 'paragraph',
          text: ''
        },
        {
          type: 'heading1',
          text: 'BÊN CHO THUÊ (Bên A)'
        },
        {
          type: 'paragraph',
          text: `Họ và tên: ${hopDong.tenChuNha}`
        },
        {
          type: 'paragraph',
          text: `CMND/CCCD: ${hopDong.cmndChuNha}`
        },
        {
          type: 'paragraph',
          text: `Số điện thoại: ${hopDong.sdtChuNha}`
        },
        {
          type: 'paragraph',
          text: `Địa chỉ: ${hopDong.diaChiChuNha}`
        },
        {
          type: 'heading1',
          text: 'BÊN THUÊ (Bên B)'
        },
        {
          type: 'paragraph',
          text: `Họ và tên: ${hopDong.tenNguoiThue}`
        },
        {
          type: 'paragraph',
          text: `CMND/CCCD: ${hopDong.cmndNguoiThue}`
        },
        {
          type: 'paragraph',
          text: `Số điện thoại: ${hopDong.sdtNguoiThue}`
        },
        {
          type: 'paragraph',
          text: `Địa chỉ: ${hopDong.diaChiNguoiThue}`
        },
        {
          type: 'heading1',
          text: 'ĐIỀU 1: THÔNG TIN BẤT ĐỘNG SẢN'
        },
        {
          type: 'paragraph',
          text: `Địa chỉ bất động sản: ${hopDong.diaChiPhong}`
        },
        {
          type: 'paragraph',
          text: `Diện tích: ${hopDong.dienTich} m²`
        },
        {
          type: 'paragraph',
          text: `Giá thuê: ${hopDong.giaThue?.toLocaleString('vi-VN')} VNĐ/tháng`
        },
        {
          type: 'heading1',
          text: 'ĐIỀU 2: THỜI HẠN HỢP ĐỒNG'
        },
        {
          type: 'paragraph',
          text: `Từ ngày: ${hopDong.ngayBatDau}`
        },
        {
          type: 'paragraph',
          text: `Đến ngày: ${hopDong.ngayKetThuc}`
        },
        {
          type: 'heading1',
          text: 'ĐIỀU 3: TRÁCH NHIỆM CÁC BÊN'
        },
        {
          type: 'heading2',
          text: 'Trách nhiệm Bên A:'
        },
        {
          type: 'list',
          items: hopDong.trachNhiemBenA || [
            'Giao phòng đúng thời hạn trong tình trạng tốt',
            'Đảm bảo các tiện ích trong phòng hoạt động tốt',
            'Không tăng giá thuê tùy tiện trong thời hạn hợp đồng'
          ]
        },
        {
          type: 'heading2',
          text: 'Trách nhiệm Bên B:'
        },
        {
          type: 'list',
          items: hopDong.trachNhiemBenB || [
            'Thanh toán tiền thuê đúng hạn',
            'Giữ gìn vệ sinh chung',
            'Không làm ảnh hưởng đến các hộ xung quanh',
            'Báo trước khi chuyển đi ít nhất 1 tháng'
          ]
        },
        {
          type: 'heading1',
          text: 'ĐIỀU 4: CAM KẾT'
        },
        {
          type: 'paragraph',
          text: 'Hai bên cam kết thực hiện đúng các điều khoản đã thỏa thuận. Hợp đồng có hiệu lực kể từ ngày ký.'
        },
        {
          type: 'paragraph',
          text: ''
        },
        {
          type: 'table',
          headers: ['BÊN A', 'BÊN B'],
          rows: [
            ['(Ký và ghi rõ họ tên)', '(Ký và ghi rõ họ tên)'],
            ['', ''],
            ['', ''],
            ['', '']
          ]
        }
      ]
    };

    return this.createDocx(config, outputPath);
  }

  /**
   * Tạo báo cáo thu chi
   * @param {Object} data - Dữ liệu thu chi
   * @param {string} outputPath - Đường dẫn file output
   * @returns {Promise<string>}
   */
  static async taoBaoCaoThuChi(data, outputPath) {
    const config = {
      title: `Báo Cáo Thu Chi - ${data.tieuDe}`,
      sections: [
        {
          type: 'heading1',
          text: '1. Thông Tin Chung'
        },
        {
          type: 'paragraph',
          text: `Kỳ báo cáo: ${data.kyBaoCao}`
        },
        {
          type: 'paragraph',
          text: `Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`
        },
        {
          type: 'heading1',
          text: '2. Thu Nhập'
        },
        {
          type: 'table',
          headers: ['Nguồn Thu', 'Số Tiền', 'Ghi Chú'],
          rows: data.danhSachThu || []
        },
        {
          type: 'paragraph',
          text: `Tổng thu: ${data.tongThu?.toLocaleString('vi-VN')} VNĐ`,
          bold: true,
          font_size: 14,
          color: '#16a34a'
        },
        {
          type: 'heading1',
          text: '3. Chi Tiêu'
        },
        {
          type: 'table',
          headers: ['Khoản Chi', 'Số Tiền', 'Ghi Chú'],
          rows: data.danhSachChi || []
        },
        {
          type: 'paragraph',
          text: `Tổng chi: ${data.tongChi?.toLocaleString('vi-VN')} VNĐ`,
          bold: true,
          font_size: 14,
          color: '#dc2626'
        },
        {
          type: 'heading1',
          text: '4. Tổng Kết'
        },
        {
          type: 'paragraph',
          text: `Số dư: ${(data.tongThu - data.tongChi)?.toLocaleString('vi-VN')} VNĐ`,
          bold: true,
          font_size: 16,
          color: data.tongThu >= data.tongChi ? '#16a34a' : '#dc2626'
        }
      ]
    };

    return this.createDocx(config, outputPath);
  }
}

module.exports = DocxGeneratorService;


