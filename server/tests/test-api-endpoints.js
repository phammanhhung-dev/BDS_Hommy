const ChuDuAnModel = require('./models/ChuDuAnModel');
const db = require('./config/db');

// ID chủ dự án để test (cần có dữ liệu trong database)
const CHU_DU_AN_ID = 1; // Thay bằng ID thực tế

async function testEndpoints() {
  try {
    console.log('=== TEST API ENDPOINTS ===\n');
    
    // Test 1: Lấy danh sách tin đăng
    console.log('1. Lấy danh sách tin đăng...');
    let danhSachTinDang = [];
    try {
      danhSachTinDang = await ChuDuAnModel.layDanhSachTinDang(CHU_DU_AN_ID);
      console.log('✅ Thành công! Số lượng tin đăng:', danhSachTinDang.length);
      
      if (danhSachTinDang.length > 0) {
        console.log('   Tin đăng đầu tiên:', {
          TinDangID: danhSachTinDang[0].TinDangID,
          TieuDe: danhSachTinDang[0].TieuDe,
          TrangThai: danhSachTinDang[0].TrangThai,
          TongSoPhong: danhSachTinDang[0].TongSoPhong,
          SoPhongTrong: danhSachTinDang[0].SoPhongTrong
        });
      }
    } catch (error) {
      console.log('❌ Lỗi:', error.message);
    }
    
    // Test 2: Lấy chi tiết tin đăng (nếu có)
    if (danhSachTinDang && danhSachTinDang.length > 0) {
      const tinDangId = danhSachTinDang[0].TinDangID;
      console.log(`\n2. Lấy chi tiết tin đăng #${tinDangId}...`);
      try {
        const chiTietTinDang = await ChuDuAnModel.layChiTietTinDang(tinDangId, CHU_DU_AN_ID);
        console.log('✅ Thành công!');
        console.log('   Tiêu đề:', chiTietTinDang.TieuDe);
        console.log('   Số phòng:', chiTietTinDang.DanhSachPhong?.length || 0);
        
        if (chiTietTinDang.DanhSachPhong && chiTietTinDang.DanhSachPhong.length > 0) {
          console.log('   Phòng đầu tiên:', {
            PhongID: chiTietTinDang.DanhSachPhong[0].PhongID,
            TenPhong: chiTietTinDang.DanhSachPhong[0].TenPhong,
            TrangThai: chiTietTinDang.DanhSachPhong[0].TrangThai,
            Gia: chiTietTinDang.DanhSachPhong[0].Gia
          });
        }
      } catch (error) {
        console.log('❌ Lỗi:', error.message);
      }
    }
    
    // Test 3: Lấy danh sách cuộc hẹn
    console.log('\n3. Lấy danh sách cuộc hẹn...');
    try {
      const danhSachCuocHen = await ChuDuAnModel.layDanhSachCuocHen(CHU_DU_AN_ID);
      console.log('✅ Thành công! Số lượng cuộc hẹn:', danhSachCuocHen.length);
      
      if (danhSachCuocHen.length > 0) {
        console.log('   Cuộc hẹn đầu tiên:', {
          CuocHenID: danhSachCuocHen[0].CuocHenID,
          PhongID: danhSachCuocHen[0].PhongID,
          TrangThai: danhSachCuocHen[0].TrangThai,
          ThoiGianHen: danhSachCuocHen[0].ThoiGianHen
        });
      }
    } catch (error) {
      console.log('❌ Lỗi:', error.message);
    }
    
    // Test 4: Lấy báo cáo hiệu suất
    console.log('\n4. Lấy báo cáo hiệu suất...');
    try {
      const baoCao = await ChuDuAnModel.layBaoCaoHieuSuat(CHU_DU_AN_ID);
      console.log('✅ Thành công!');
      console.log('   Tổng quan:', baoCao.tongQuan);
      console.log('   Cuộc hẹn:', baoCao.cuocHen);
      console.log('   Cọc:', baoCao.coc);
    } catch (error) {
      console.log('❌ Lỗi:', error.message);
    }
    
    // Test 5: Lấy danh sách dự án
    console.log('\n5. Lấy danh sách dự án...');
    try {
      const danhSachDuAn = await ChuDuAnModel.layDanhSachDuAn(CHU_DU_AN_ID);
      console.log('✅ Thành công! Số lượng dự án:', danhSachDuAn.length);
      
      if (danhSachDuAn.length > 0) {
        console.log('   Dự án đầu tiên:', {
          DuAnID: danhSachDuAn[0].DuAnID,
          TenDuAn: danhSachDuAn[0].TenDuAn,
          TrangThai: danhSachDuAn[0].TrangThai,
          SoTinDang: danhSachDuAn[0].SoTinDang
        });
      }
    } catch (error) {
      console.log('❌ Lỗi:', error.message);
    }
    
    // Test 6: Test query trực tiếp để kiểm tra schema
    console.log('\n6. Test query直接 để kiểm tra schema...');
    try {
      const [phongRows] = await db.execute(`
        SELECT p.PhongID, p.DuAnID, p.TenPhong, p.TrangThai, p.GiaChuan, p.DienTichChuan
        FROM phong p
        LIMIT 5
      `);
      console.log('✅ Query phòng thành công! Số lượng phòng:', phongRows.length);
      if (phongRows.length > 0) {
        console.log('   Phòng đầu tiên:', phongRows[0]);
      }
    } catch (error) {
      console.log('❌ Lỗi query phòng:', error.message);
    }
    
    try {
      const [phongTindangRows] = await db.execute(`
        SELECT pt.PhongTinDangID, pt.PhongID, pt.TinDangID, pt.GiaTinDang, pt.DienTichTinDang
        FROM phong_tindang pt
        LIMIT 5
      `);
      console.log('✅ Query phong_tindang thành công! Số lượng:', phongTindangRows.length);
      if (phongTindangRows.length > 0) {
        console.log('   Mapping đầu tiên:', phongTindangRows[0]);
      }
    } catch (error) {
      console.log('❌ Lỗi query phong_tindang:', error.message);
    }
    
    console.log('\n=== KẾT THÚC TEST ===');
    
  } catch (error) {
    console.error('Lỗi chung:', error);
  } finally {
    process.exit(0);
  }
}

testEndpoints();