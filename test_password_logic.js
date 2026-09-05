const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Dữ liệu thật từ DB
const dbHash = 'e10adc3949ba59abbe56e057f20f883e';
const testPassword = '123456'; // Giả sử password là 123456

console.log('🔍 Test logic so sánh password');
console.log('📝 Hash trong DB:', dbHash);
console.log('📝 Password test:', testPassword);
console.log('📝 Hash có bắt đầu bằng $2a$, $2b$, hoặc $2y$?', 
  dbHash.startsWith('$2a$') || dbHash.startsWith('$2b$') || dbHash.startsWith('$2y$'));

// Logic từ authController.js
let passwordMatch = false;

if (dbHash.startsWith('$2a$') || dbHash.startsWith('$2b$') || dbHash.startsWith('$2y$')) {
  console.log('✅ Phát hiện bcrypt hash, dùng bcrypt.compare()');
  bcrypt.compare(testPassword, dbHash).then(result => {
    console.log('📝 Kết quả bcrypt.compare:', result);
  });
} else {
  console.log('✅ Phát hiện MD5 hash, dùng MD5 so sánh');
  const passwordHash = crypto.createHash('md5').update(String(testPassword)).digest('hex');
  console.log('📝 MD5 hash của password test:', passwordHash);
  passwordMatch = (dbHash === passwordHash);
  console.log('📝 Kết quả so sánh MD5:', passwordMatch);
}

// Test với một số password phổ biến
console.log('\n🔍 Test với các password phổ biến:');
const commonPasswords = ['123456', 'password', 'admin', 'khach1', 'Khach123!'];
commonPasswords.forEach(pwd => {
  const md5Hash = crypto.createHash('md5').update(String(pwd)).digest('hex');
  const match = md5Hash === dbHash;
  console.log(`📝 Password "${pwd}" -> MD5: ${md5Hash} -> Match: ${match}`);
});
