const fs = require('fs');
const path = require('path');

const docsPath = path.join(__dirname, '../docs/API_ENDPOINTS_LIST.md');

try {
  let content = fs.readFileSync(docsPath, 'utf8');
  
  // Replace the old dashboard metrics endpoint with new endpoints
  const oldText = '- `GET /api/operator/dashboard/metrics` - Metrics dashboard';
  const newText = `- `GET /api/operator/dashboard/stats` - Thống kê tổng quan\n' +
                    '- `GET /api/operator/dashboard/revenue-chart` - Biểu đồ doanh thu 6 tháng\n' +
                    '- `GET /api/operator/dashboard/occupancy` - Tỷ lệ lấp đầy theo dự án\n' +
                    '- `GET /api/operator/dashboard/status-distribution` - Phân phối trạng thái tin đăng\n' +
                    '- `GET /api/operator/dashboard/recent-listings` - Tin đăng mới nhất\n' +
                    '- `GET /api/operator/dashboard/upcoming-appointments` - Cuộc hẹn 7 ngày tới';
  
  content = content.replace(oldText, newText);
  
  fs.writeFileSync(docsPath, content, 'utf8');
  console.log('✅ Đã cập nhật file API_ENDPOINTS_LIST.md');
} catch (error) {
  console.error('❌ Lỗi cập nhật docs:', error);
}