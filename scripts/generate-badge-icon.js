/**
 * Script tạo badge icon cho notifications
 * Badge icon là icon nhỏ hiển thị trên notification
 * 
 * Cách chạy: node scripts/generate-badge-icon.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ICONS_DIR = path.join(__dirname, '../client/public/icons');

// Badge SVG - Simplified Hommy logo
const svgBadge = `
<svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="36" cy="36" r="34" fill="#D4AF37"/>
  
  <!-- H shape - simplified -->
  <g transform="translate(36, 36)">
    <!-- Left vertical -->
    <rect x="-16" y="-12" width="5" height="24" rx="1" fill="#FFFFFF"/>
    <!-- Right vertical -->
    <rect x="11" y="-12" width="5" height="24" rx="1" fill="#FFFFFF"/>
    <!-- Horizontal bar -->
    <rect x="-16" y="-2" width="32" height="5" rx="1" fill="#FFFFFF"/>
    <!-- Roof -->
    <polygon points="0,-18 -18,-4 18,-4" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round"/>
  </g>
</svg>
`;

// Monochrome badge for Android (single color)
const svgBadgeMono = `
<svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(36, 36)">
    <!-- H shape -->
    <rect x="-16" y="-12" width="5" height="24" rx="1" fill="#FFFFFF"/>
    <rect x="11" y="-12" width="5" height="24" rx="1" fill="#FFFFFF"/>
    <rect x="-16" y="-2" width="32" height="5" rx="1" fill="#FFFFFF"/>
    <!-- Roof -->
    <polygon points="0,-18 -18,-4 18,-4" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round"/>
  </g>
</svg>
`;

async function generateBadgeIcons() {
  console.log('🔔 Bắt đầu tạo badge icons...\n');

  // Đảm bảo thư mục tồn tại
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  // Badge 72x72 (colored)
  await sharp(Buffer.from(svgBadge))
    .resize(72, 72)
    .png({ quality: 100 })
    .toFile(path.join(ICONS_DIR, 'badge-72x72.png'));
  console.log('   ✅ badge-72x72.png');

  // Badge 96x96 (high-res)
  await sharp(Buffer.from(svgBadge))
    .resize(96, 96)
    .png({ quality: 100 })
    .toFile(path.join(ICONS_DIR, 'badge-96x96.png'));
  console.log('   ✅ badge-96x96.png');

  // Badge 128x128 (extra high-res)
  await sharp(Buffer.from(svgBadge))
    .resize(128, 128)
    .png({ quality: 100 })
    .toFile(path.join(ICONS_DIR, 'badge-128x128.png'));
  console.log('   ✅ badge-128x128.png');

  // Monochrome badge (for Android adaptive icons)
  await sharp(Buffer.from(svgBadgeMono))
    .resize(72, 72)
    .png({ quality: 100 })
    .toFile(path.join(ICONS_DIR, 'badge-mono-72x72.png'));
  console.log('   ✅ badge-mono-72x72.png');

  // Lưu SVG gốc
  fs.writeFileSync(path.join(ICONS_DIR, 'badge.svg'), svgBadge.trim());
  console.log('   ✅ badge.svg');

  console.log('\n✨ Hoàn thành tạo badge icons!');
}

generateBadgeIcons().catch(console.error);
