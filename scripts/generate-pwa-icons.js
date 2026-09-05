/**
 * Script tạo PWA icons từ SVG với độ nét cao nhất
 * Sử dụng sharp library để convert SVG → PNG
 * 
 * Cách chạy: node scripts/generate-pwa-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Các kích thước icon PWA chuẩn (độ phân giải cao)
const ICON_SIZES = [
  // Apple Touch Icons
  72, 96, 120, 128, 144, 152, 180, 192,
  // Android Chrome
  256, 384, 512,
  // Windows Tiles
  70, 150, 310,
  // Favicon
  16, 32, 48, 64
];

// Maskable icon sizes (với padding cho safe area)
const MASKABLE_SIZES = [192, 512];

const SVG_PATH = path.join(__dirname, '../client/public/Hommy_Logo_Web.svg');
const OUTPUT_DIR = path.join(__dirname, '../client/public/icons');

async function generateIcons() {
  console.log('🎨 Bắt đầu tạo PWA icons với độ nét cao...\n');

  // Tạo thư mục output nếu chưa có
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Đã tạo thư mục: ${OUTPUT_DIR}\n`);
  }

  // Đọc file SVG
  const svgBuffer = fs.readFileSync(SVG_PATH);
  console.log(`📄 Đã đọc file SVG: ${SVG_PATH}\n`);

  // Tạo regular icons
  console.log('🔲 Tạo regular icons...');
  for (const size of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    
    await sharp(svgBuffer, { density: 300 }) // Density cao để tăng độ nét
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({
        quality: 100,
        compressionLevel: 9,
        palette: false // Không dùng palette để giữ màu tốt hơn
      })
      .toFile(outputPath);
    
    console.log(`   ✅ icon-${size}x${size}.png`);
  }

  // Tạo maskable icons (với padding cho safe area)
  console.log('\n🎭 Tạo maskable icons...');
  for (const size of MASKABLE_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `maskable-icon-${size}x${size}.png`);
    
    // Maskable cần padding khoảng 10% mỗi bên (safe area)
    const iconSize = Math.floor(size * 0.8); // Icon chiếm 80%
    const padding = Math.floor((size - iconSize) / 2);
    
    await sharp(svgBuffer, { density: 300 })
      .resize(iconSize, iconSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 59, g: 59, b: 59, alpha: 1 } // #3B3B3B - màu nền từ SVG
      })
      .png({
        quality: 100,
        compressionLevel: 9
      })
      .toFile(outputPath);
    
    console.log(`   ✅ maskable-icon-${size}x${size}.png`);
  }

  // Tạo Apple Touch Icon (180x180 với background)
  console.log('\n🍎 Tạo Apple Touch Icon...');
  const appleTouchPath = path.join(OUTPUT_DIR, 'apple-touch-icon.png');
  await sharp(svgBuffer, { density: 300 })
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 59, g: 59, b: 59, alpha: 1 }
    })
    .png({ quality: 100 })
    .toFile(appleTouchPath);
  console.log('   ✅ apple-touch-icon.png');

  // Tạo favicon.ico (multi-resolution)
  console.log('\n⭐ Tạo favicon...');
  const faviconPath = path.join(OUTPUT_DIR, 'favicon-32x32.png');
  await sharp(svgBuffer, { density: 300 })
    .resize(32, 32)
    .png({ quality: 100 })
    .toFile(faviconPath);
  console.log('   ✅ favicon-32x32.png');

  const favicon16Path = path.join(OUTPUT_DIR, 'favicon-16x16.png');
  await sharp(svgBuffer, { density: 300 })
    .resize(16, 16)
    .png({ quality: 100 })
    .toFile(favicon16Path);
  console.log('   ✅ favicon-16x16.png');

  // Copy SVG gốc vào thư mục icons
  const svgOutputPath = path.join(OUTPUT_DIR, 'icon.svg');
  fs.copyFileSync(SVG_PATH, svgOutputPath);
  console.log('   ✅ icon.svg (vector gốc)');

  console.log('\n✨ Hoàn thành! Tất cả icons đã được tạo trong:', OUTPUT_DIR);
  console.log('\n📋 Danh sách icons đã tạo:');
  console.log('   - Regular icons: 16x16 đến 512x512');
  console.log('   - Maskable icons: 192x192, 512x512');
  console.log('   - Apple Touch Icon: 180x180');
  console.log('   - Favicons: 16x16, 32x32');
  console.log('   - Vector: icon.svg');
}

generateIcons().catch(console.error);
