const db = require('./config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function checkPassword() {
  try {
    console.log('=== KIỂM TRA PASSWORD ADMIN ===\n');

    // Kiểm tra password hash của admin
    const [admin] = await db.execute(`
      SELECT NguoiDungID, TenDayDu, Email, MatKhauHash, TrangThai
      FROM nguoidung
      WHERE Email = 'hethong@gmail.com'
    `);
    
    if (admin.length > 0) {
      console.log('Admin account:', admin[0]);
      console.log('Password hash:', admin[0].MatKhauHash);
      
      // Test password 123456
      const testPassword = '123456';
      const isMatch = await bcrypt.compare(testPassword, admin[0].MatKhauHash);
      console.log('Password "123456" match:', isMatch);
      
      // Kiểm tra xem có phải MD5 hash không
      const md5Hash = crypto.createHash('md5').update(testPassword).digest('hex');
      console.log('MD5 hash of "123456":', md5Hash);
      console.log('MD5 hash matches?', md5Hash === admin[0].MatKhauHash);
      
      // Nếu là MD5 hash, có thể thử các password phổ biến
      if (md5Hash === admin[0].MatKhauHash) {
        console.log('✅ Đây là MD5 hash, password là "123456"');
      }
      
      // Nếu không khớp với bcrypt, thử các password phổ biến khác
      if (!isMatch && md5Hash !== admin[0].MatKhauHash) {
        const commonPasswords = ['admin', 'password', '123456789', 'admin123', 'hethong', 'Hethong@123'];
        for (const pwd of commonPasswords) {
          const match = await bcrypt.compare(pwd, admin[0].MatKhauHash);
          if (match) {
            console.log(`✅ Password đúng (bcrypt): "${pwd}"`);
            break;
          }
        }
      }
    } else {
      console.log('Không tìm thấy account admin');
    }

    console.log('\n=== KẾT THÚC ===');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
}

checkPassword();