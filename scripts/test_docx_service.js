/**
 * Test script cho DocxGeneratorService
 * Chạy: node scripts/test_docx_service.js
 */

const DocxGeneratorService = require('../server/services/DocxGeneratorService');
const path = require('path');

async function testAll() {
  console.log('=== Test DocxGeneratorService ===\n');

  try {
    // Test 1: Simple document
    console.log('1. Test tạo document đơn giản...');
    const simplePath = path.join(process.cwd(), 'output_simple.docx');
    await DocxGeneratorService.createSimpleDocx(
      'Báo Cáo Test',
      'Đây là nội dung test đơn giản từ Node.js service',
      simplePath
    );
    console.log(`✓ Đã tạo: ${simplePath}\n`);

    // Test 2: Báo cáo hiệu suất
    console.log('2. Test tạo báo cáo hiệu suất...');
    const baoCaoPath = path.join(process.cwd(), 'output_bao_cao.docx');
    const dataBaoCao = {
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
    await DocxGeneratorService.taoBaoCaoHieuSuatChuDuAn(dataBaoCao, baoCaoPath);
    console.log(`✓ Đã tạo: ${baoCaoPath}\n`);

    // Test 3: Hợp đồng
    console.log('3. Test tạo hợp đồng...');
    const hopDongPath = path.join(process.cwd(), 'output_hop_dong.docx');
    const dataHopDong = {
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
    await DocxGeneratorService.taoHopDongThuePhong(dataHopDong, hopDongPath);
    console.log(`✓ Đã tạo: ${hopDongPath}\n`);

    // Test 4: Báo cáo thu chi
    console.log('4. Test tạo báo cáo thu chi...');
    const thuChiPath = path.join(process.cwd(), 'output_thu_chi.docx');
    const dataThuChi = {
      tieuDe: 'Tháng 11/2025',
      kyBaoCao: '01/11/2025 - 30/11/2025',
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
    await DocxGeneratorService.taoBaoCaoThuChi(dataThuChi, thuChiPath);
    console.log(`✓ Đã tạo: ${thuChiPath}\n`);

    // Test 5: Custom config
    console.log('5. Test tạo document với custom config...');
    const customPath = path.join(process.cwd(), 'output_custom.docx');
    const customConfig = {
      title: 'Document Custom',
      sections: [
        { type: 'heading1', text: 'Phần 1: Giới thiệu' },
        { type: 'paragraph', text: 'Đây là đoạn văn giới thiệu với font chữ lớn.', font_size: 14 },
        { type: 'heading2', text: 'Danh sách tính năng' },
        { type: 'list', items: ['Tính năng A', 'Tính năng B', 'Tính năng C'] },
        { type: 'heading2', text: 'Bảng dữ liệu' },
        {
          type: 'table',
          headers: ['STT', 'Tên', 'Giá'],
          rows: [
            ['1', 'Sản phẩm A', '100,000'],
            ['2', 'Sản phẩm B', '200,000']
          ]
        }
      ]
    };
    await DocxGeneratorService.createDocx(customConfig, customPath);
    console.log(`✓ Đã tạo: ${customPath}\n`);

    console.log('=== Tất cả tests đã hoàn thành! ===');
    console.log('\nKiểm tra các file .docx vừa tạo trong thư mục project.');
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

// Run tests
testAll();


