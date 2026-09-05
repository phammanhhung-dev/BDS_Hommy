const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function checkDatabase() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'realestate'
  });

  try {
    console.log('=== KIỂM TRA DỮ LIỆU DỰ ÁN ===');
    
    // Sử dụng trực tiếp ID 260 (ChuDA1)
    const chuDuAnId = 260;
    console.log('User đang kiểm tra: ChuDA1 (ID:', chuDuAnId + ')');
    
    // Lấy 4 dự án hiện tại
    const [duAns] = await connection.execute(
      'SELECT DuAnID, TenDuAn, DiaChi FROM duan WHERE ChuDuAnID = ? ORDER BY CapNhatLuc DESC LIMIT 4',
      [chuDuAnId]
    );
    
    console.log('\n4 dự án hiện tại:');
    duAns.forEach(da => {
      console.log(`- DuAnID: ${da.DuAnID}, Ten: ${da.TenDuAn}, DiaChi: ${da.DiaChi}`);
    });
    
    // Kiểm tra số liệu cho từng dự án
    console.log('\n=== KIỂM TRA SỐ LIỆU PHÒNG/TIN ĐĂNG/CỌC ===');
    for (const da of duAns) {
      console.log(`\nDự án: ${da.TenDuAn} (ID: ${da.DuAnID})`);
      
      // Đếm phòng
      const [phongStats] = await connection.execute(
        `SELECT 
          COUNT(*) as TongPhong,
          COUNT(CASE WHEN TrangThai = 'Trong' THEN 1 END) as PhongTrong,
          COUNT(CASE WHEN TrangThai = 'GiuCho' THEN 1 END) as PhongGiuCho,
          COUNT(CASE WHEN TrangThai = 'DaThue' THEN 1 END) as PhongDaThue,
          COUNT(CASE WHEN TrangThai = 'DonDep' THEN 1 END) as PhongDonDep
         FROM phong WHERE DuAnID = ?`,
        [da.DuAnID]
      );
      console.log('Phòng:', phongStats[0]);
      
      // Đếm tin đăng
      const [tinDangStats] = await connection.execute(
        `SELECT 
          COUNT(*) as SoTinDang,
          COUNT(CASE WHEN TrangThai IN ('DaDang','DaDuyet','ChoDuyet') THEN 1 END) as TinDangHoatDong,
          COUNT(CASE WHEN TrangThai = 'Nhap' THEN 1 END) as TinDangNhap
         FROM tindang WHERE DuAnID = ?`,
        [da.DuAnID]
      );
      console.log('Tin đăng:', tinDangStats[0]);
      
      // Đếm cọc
      const [cocStats] = await connection.execute(
        `SELECT 
          COUNT(*) as TongCoc,
          COUNT(CASE WHEN c.TrangThai = 'HieuLuc' THEN 1 END) as CocDangHieuLuc,
          SUM(CASE WHEN c.TrangThai = 'HieuLuc' THEN c.SoTien ELSE 0 END) as TongTienCocDangHieuLuc
         FROM coc c
         INNER JOIN phong p ON c.PhongID = p.PhongID
         WHERE p.DuAnID = ?`,
        [da.DuAnID]
      );
      console.log('Cọc:', cocStats[0]);
    }
    
    // Kiểm tra tin đăng mới nhất
    console.log('\n=== KIỂM TRA TIN ĐĂNG MỚI NHẤT ===');
    
    // Kiểm tra cấu trúc bảng tindang trước
    const [tindangColumns] = await connection.execute(
      'DESCRIBE tindang'
    );
    console.log('Cấu trúc bảng tindang:');
    tindangColumns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type}`);
    });
    
    const [newestTinDang] = await connection.execute(
      `SELECT TinDangID, TieuDe, DuAnID, TrangThai, TaoLuc 
       FROM tindang 
       ORDER BY TaoLuc DESC 
       LIMIT 5`
    );
    
    console.log('\n5 tin đăng mới nhất:');
    newestTinDang.forEach(td => {
      console.log(`- TinDangID: ${td.TinDangID}, TieuDe: ${td.TieuDe}, DuAnID: ${td.DuAnID}, TrangThai: ${td.TrangThai}, TaoLuc: ${td.TaoLuc}`);
    });
    
    // Kiểm tra tin đăng thuộc các dự án của ChuDA1
    console.log('\n=== KIỂM TRA TIN ĐĂNG THUỘC DỰ ÁN CỦA ChuDA1 ===');
    const [tinDangByDuAn] = await connection.execute(
      `SELECT TinDangID, TieuDe, DuAnID, TrangThai, TaoLuc 
       FROM tindang 
       WHERE DuAnID IN (?, ?, ?, ?)
       ORDER BY TaoLuc DESC`,
      [28, 27, 29, 30]
    );
    
    console.log('Tin đăng thuộc 4 dự án của ChuDA1:');
    if (tinDangByDuAn.length === 0) {
      console.log('Không có tin đăng nào thuộc 4 dự án này');
    } else {
      tinDangByDuAn.forEach(td => {
        console.log(`- TinDangID: ${td.TinDangID}, TieuDe: ${td.TieuDe}, DuAnID: ${td.DuAnID}, TrangThai: ${td.TrangThai}, TaoLuc: ${td.TaoLuc}`);
      });
    }
    
    // Kiểm tra tất cả tin đăng với trạng thái 'Nhap'
    console.log('\n=== KIỂM TRA TIN ĐĂNG TRẠNG THÁI NHÁP (Nhap) ===');
    const [tinDangNhap] = await connection.execute(
      `SELECT TinDangID, TieuDe, DuAnID, TrangThai, TaoLuc 
       FROM tindang 
       WHERE TrangThai = 'Nhap'
       ORDER BY TaoLuc DESC`
    );
    
    console.log('Tin đăng trạng thái Nháp:');
    if (tinDangNhap.length === 0) {
      console.log('Không có tin đăng nào ở trạng thái Nháp');
    } else {
      tinDangNhap.forEach(td => {
        console.log(`- TinDangID: ${td.TinDangID}, TieuDe: ${td.TieuDe}, DuAnID: ${td.DuAnID}, TrangThai: ${td.TrangThai}, TaoLuc: ${td.TaoLuc}`);
      });
    }
    
    // Kiểm tra tin đăng mới nhất trong 1 giờ qua
    console.log('\n=== KIỂM TRA TIN ĐĂNG MỚI TRONG 1 GIỜ QUA ===');
    const [recentTinDang] = await connection.execute(
      `SELECT TinDangID, TieuDe, DuAnID, TrangThai, TaoLuc 
       FROM tindang 
       WHERE TaoLuc >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
       ORDER BY TaoLuc DESC`
    );
    
    console.log('Tin đăng mới trong 1 giờ qua:');
    if (recentTinDang.length === 0) {
      console.log('Không có tin đăng nào được tạo trong 1 giờ qua');
    } else {
      recentTinDang.forEach(td => {
        console.log(`- TinDangID: ${td.TinDangID}, TieuDe: ${td.TieuDe}, DuAnID: ${td.DuAnID}, TrangThai: ${td.TrangThai}, TaoLuc: ${td.TaoLuc}`);
      });
    }
    
    // Kiểm tra file ảnh mồ côi (đã upload nhưng không có tin đăng tương ứng)
    console.log('\n=== KIỂM TRA FILE ẢNH MÒ CÔI ===');
    const uploadsDir = path.join(__dirname, 'server', 'public', 'uploads');
    
    try {
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        console.log(`Tổng số file trong thư mục uploads: ${files.length}`);
        
        // Kiểm tra cấu trúc URL trong DB
        const [urlSamples] = await connection.execute(
          `SELECT TinDangID, TieuDe, URL, TaoLuc, TrangThai 
           FROM tindang 
           LIMIT 5`
        );
        
        console.log('\n=== KIỂM TRA CẤU TRÚC URL TRONG DB ===');
        if (urlSamples.length > 0) {
          urlSamples.forEach(td => {
            console.log(`\nTinDangID: ${td.TinDangID}, TieuDe: "${td.TieuDe}"`);
            console.log(`URL (raw): ${td.URL}`);
            console.log(`URL type: ${typeof td.URL}`);
            console.log(`URL length: ${td.URL ? td.URL.length : 0}`);
            console.log(`URL IS NULL: ${td.URL === null}`);
            console.log(`URL IS EMPTY STRING: ${td.URL === ''}`);
            console.log(`URL IS EMPTY ARRAY: ${td.URL === '[]'}`);
          });
        } else {
          console.log('Không có tin đăng nào');
        }
        
        // Lấy tất cả tin đăng và timestamps của chúng
        const [allTinDang] = await connection.execute(
          `SELECT TinDangID, TaoLuc FROM tindang`
        );
        
        const tinDangTimestamps = new Set();
        allTinDang.forEach(td => {
          if (td.TaoLuc) {
            const timestamp = new Date(td.TaoLuc).getTime();
            tinDangTimestamps.add(timestamp);
          }
        });
        
        // Kiểm tra file mồ côi (không có tin đăng trong khoảng ±30 phút)
        const orphanFiles = [];
        const thirtyMinutes = 30 * 60 * 1000;
        
        files.forEach(file => {
          const timestamp = parseInt(file.split('.')[0], 10);
          if (!isNaN(timestamp)) {
            const fileTime = new Date(timestamp).getTime();
            let hasMatch = false;
            
            // Kiểm tra xem có tin đăng nào trong khoảng ±30 phút
            for (const tinDangTime of tinDangTimestamps) {
              if (Math.abs(fileTime - tinDangTime) <= thirtyMinutes) {
                hasMatch = true;
                break;
              }
            }
            
            if (!hasMatch) {
              orphanFiles.push({
                file,
                timestamp,
                date: new Date(timestamp).toLocaleString('vi-VN')
              });
            }
          }
        });
        
        // Sắp xếp file mồ côi theo thời gian giảm dần
        orphanFiles.sort((a, b) => b.timestamp - a.timestamp);
        
        console.log(`\n=== KẾT QUẢ PHÁT HIỆN FILE MÒ CÔI ===`);
        console.log(`Tìm thấy ${orphanFiles.length} file ảnh mồ côi (không có tin đăng tương ứng trong ±30 phút):`);
        if (orphanFiles.length === 0) {
          console.log('Không có file ảnh mồ côi nào');
        } else {
          orphanFiles.forEach((item, index) => {
            console.log(`${index + 1}. ${item.file} (${item.date})`);
          });
          
          console.log('\n=== DANH SÁCH FILE MÒ CÔI (dành cho dọn dẹp thủ công) ===');
          orphanFiles.forEach(item => {
            console.log(item.file);
          });
        }
      } else {
        console.log('Thư mục uploads không tồn tại');
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra thư mục uploads:', error.message);
    }
    
  } catch (error) {
    console.error('Lỗi:', error);
  } finally {
    await connection.end();
  }
}

checkDatabase();