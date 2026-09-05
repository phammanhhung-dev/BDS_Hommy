# 📊 KẾ HOẠCH TỐI ƯU UI/UX DASHBOARD & BÁO CÁO - CHỦ DỰ ÁN

**Ngày tạo:** 24/10/2025  
**Phiên bản:** 1.0  
**Use Case liên quan:** UC-PROJ-03 (Báo cáo hiệu suất)

---

## 🎯 MỤC TIÊU

### Vấn đề hiện tại
1. **Mock data** thay vì real data từ database
2. **Charts đơn giản** bằng CSS, không tương tác
3. **Thiếu filtering** và export functionality
4. **Không optimize** query performance
5. **UX chưa tốt:** Loading states, error handling còn cơ bản

### Mục tiêu cải thiện
- ✅ Thay toàn bộ mock data bằng **real API calls**
- ✅ Sử dụng **Recharts** cho charts chuyên nghiệp, tương tác
- ✅ Implement **React Query** cho state management & caching
- ✅ **Tối ưu backend queries** (indexing, aggregations)
- ✅ **Advanced features:** Date range filters, export PDF/Excel
- ✅ **Polish UX:** Skeleton loaders, empty states, tooltips

---

## 🏗️ KIẾN TRÚC MỚI

### Frontend Stack
```
React 18 (Vite)
├── @tanstack/react-query (v5) - Data fetching & caching
├── recharts (v2.12+) - Professional charts
├── date-fns - Date manipulation
├── react-to-print - Print/PDF export
└── xlsx - Excel export
```

### Backend Optimization
```
Node.js + MySQL
├── Aggregate queries (SUM, AVG, COUNT với GROUP BY)
├── Date range filtering với BETWEEN
├── Redis caching (TTL 5-15 phút)
└── Database indexes (TinDangID, ChuDuAnID, NgayTao)
```

---

## 📋 METRICS QUAN TRỌNG CHO CHỦ DỰ ÁN

### 1. Dashboard Metrics (Trang chính)
| Metric | Nguồn Data | Tính toán | Hiển thị |
|--------|-----------|-----------|----------|
| **Tổng tin đăng** | `tindang` | COUNT(*) | Card + Badge |
| **Tin đang hoạt động** | `tindang WHERE TrangThai='DaDang'` | COUNT(*) | Card + Trend ↑↓ |
| **Cuộc hẹn sắp tới** | `cuochen WHERE ThoiGianHen > NOW()` | COUNT(*) | Card + Time left |
| **Doanh thu tháng** | `giaodichcoc WHERE MONTH(ThoiGian)` | SUM(SoTien) | Card + Currency |
| **Tỷ lệ lấp đầy** | `phong` | (DaThue / TongPhong) * 100 | Pie Chart |
| **Lượt xem tháng** | `tuongtac` | SUM(LuotXem) | Line Chart |

### 2. Báo cáo Hiệu suất (Chi tiết)
| Metric | Nguồn Data | Chart Type | Mục đích |
|--------|-----------|-----------|----------|
| **Doanh thu 6 tháng** | `giaodichcoc GROUP BY MONTH` | Line Chart | Xu hướng |
| **Conversion Rate** | `(cuochen_thanh_cong / tong_cuochen) * 100` | KPI Card | Hiệu quả |
| **Avg Response Time** | `AVG(ThoiGianXacNhan - ThoiGianYeuCau)` | KPI Card | Service quality |
| **Top 5 tin đăng** | `ORDER BY LuotXem DESC LIMIT 5` | Bar Chart | Performance |
| **Phân bố trạng thái** | `COUNT(*) GROUP BY TrangThai` | Stacked Bar | Overview |
| **Lượt xem theo giờ** | `COUNT(*) GROUP BY HOUR(NgayXem)` | Heatmap | Pattern |

---

## 🚀 ROADMAP TRIỂN KHAI (7 PHASES)

### 📊 PHASE 1: Phân tích & Thiết kế (2-3 giờ)
**Mục tiêu:** Xác định requirements và thiết kế wireframe

#### Tasks:
- [ ] Review UC-PROJ-03 trong `docs/use-cases-v1.2.md`
- [ ] Phân tích metrics nào **quan trọng nhất** cho Chủ dự án
- [ ] Sketch wireframe cho Dashboard (mobile + desktop)
- [ ] Sketch wireframe cho Báo cáo (mobile + desktop)
- [ ] Xác định API endpoints cần tạo/tối ưu

#### Deliverables:
- [ ] `DASHBOARD_WIREFRAME.png`
- [ ] `BAOCAO_WIREFRAME.png`
- [ ] `API_ENDPOINTS_LIST.md`

---

### 🔧 PHASE 2: Tối ưu Backend APIs (3-4 giờ)
**Mục tiêu:** Đảm bảo APIs nhanh, chính xác, đầy đủ data

#### Tasks Backend:

**2.1. Kiểm tra Model hiện tại**
```bash
# Check queries trong ChuDuAnModel.js
- layBaoCaoHieuSuat() - Có đủ metrics chưa?
- layDashboard() - Có aggregate queries chưa?
- layThongKePhong() - Performance thế nào?
```

**2.2. Tối ưu `layBaoCaoHieuSuat()`**
File: `server/models/ChuDuAnModel.js`

```javascript
/**
 * Lấy báo cáo hiệu suất với date range
 * Tối ưu bằng aggregation và joins
 */
static async layBaoCaoHieuSuat(chuDuAnId, filters = {}) {
  const { tuNgay, denNgay } = filters;
  
  // Query 1: Tổng quan tin đăng
  const tongQuan = await db.query(`
    SELECT 
      COUNT(*) as TongTinDang,
      SUM(CASE WHEN TrangThai = 'DaDang' THEN 1 ELSE 0 END) as TinDangDaDang,
      SUM(CASE WHEN TrangThai = 'ChoDuyet' THEN 1 ELSE 0 END) as TinDangChoDuyet,
      AVG(Gia) as GiaTrungBinh
    FROM tindang td
    JOIN duan d ON td.DuAnID = d.DuAnID
    WHERE d.ChuDuAnID = ?
      AND td.NgayTao BETWEEN ? AND ?
  `, [chuDuAnId, tuNgay, denNgay]);
  
  // Query 2: Doanh thu theo tháng (6 tháng gần nhất)
  const doanhThuTheoThang = await db.query(`
    SELECT 
      DATE_FORMAT(ThoiGian, '%Y-%m') as Thang,
      SUM(SoTien) as TongTien,
      COUNT(*) as SoGiaoDich
    FROM giaodichcoc gc
    JOIN phong p ON gc.PhongID = p.PhongID
    JOIN duan d ON p.DuAnID = d.DuAnID
    WHERE d.ChuDuAnID = ?
      AND gc.ThoiGian >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY DATE_FORMAT(ThoiGian, '%Y-%m')
    ORDER BY Thang ASC
  `, [chuDuAnId]);
  
  // Query 3: Conversion rate (cuộc hẹn thành công / tổng cuộc hẹn)
  const conversionRate = await db.query(`
    SELECT 
      COUNT(*) as TongCuocHen,
      SUM(CASE WHEN TrangThai = 'HoanThanh' THEN 1 ELSE 0 END) as CuocHenThanhCong,
      ROUND(SUM(CASE WHEN TrangThai = 'HoanThanh' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as ConversionRate
    FROM cuochen ch
    JOIN tindang td ON ch.TinDangID = td.TinDangID
    JOIN duan d ON td.DuAnID = d.DuAnID
    WHERE d.ChuDuAnID = ?
      AND ch.ThoiGianHen BETWEEN ? AND ?
  `, [chuDuAnId, tuNgay, denNgay]);
  
  // Query 4: Top 5 tin đăng (theo lượt xem)
  const topTinDang = await db.query(`
    SELECT 
      td.TinDangID, td.TieuDe,
      COUNT(tt.TuongTacID) as LuotXem
    FROM tindang td
    JOIN duan d ON td.DuAnID = d.DuAnID
    LEFT JOIN tuongtac tt ON td.TinDangID = tt.TinDangID AND tt.LoaiTuongTac = 'Xem'
    WHERE d.ChuDuAnID = ?
      AND td.NgayTao BETWEEN ? AND ?
    GROUP BY td.TinDangID
    ORDER BY LuotXem DESC
    LIMIT 5
  `, [chuDuAnId, tuNgay, denNgay]);
  
  return {
    tongQuan: tongQuan[0],
    doanhThuTheoThang,
    conversionRate: conversionRate[0],
    topTinDang
  };
}
```

**2.3. Thêm Database Indexes**
File: `migrations/2025_10_24_add_reporting_indexes.sql`

```sql
-- Indexes cho performance reporting
CREATE INDEX idx_tindang_chuduanid_ngaytao ON tindang(DuAnID, NgayTao);
CREATE INDEX idx_cuochen_tindangid_thoigianen ON cuochen(TinDangID, ThoiGianHen);
CREATE INDEX idx_giaodichcoc_phongid_thoigian ON giaodichcoc(PhongID, ThoiGian);
CREATE INDEX idx_tuongtac_tindangid_loai ON tuongtac(TinDangID, LoaiTuongTac);

-- Index cho GROUP BY queries
CREATE INDEX idx_giaodichcoc_month ON giaodichcoc(ThoiGian);
```

**2.4. Thêm Controller Method mới**
File: `server/controllers/ChuDuAnController.js`

```javascript
/**
 * Lấy doanh thu theo tháng (6 tháng gần nhất)
 * GET /api/chu-du-an/bao-cao/doanh-thu-theo-thang
 */
static async layDoanhThuTheoThang(req, res) {
  try {
    const chuDuAnId = req.user.id;
    const data = await ChuDuAnModel.layDoanhThuTheoThang(chuDuAnId);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Lỗi lấy doanh thu theo tháng:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
```

#### Deliverables:
- [ ] `ChuDuAnModel.js` updated
- [ ] `ChuDuAnController.js` updated
- [ ] `chuDuAnRoutes.js` updated
- [ ] Migration file created
- [ ] API tested với Postman/Thunder Client

---

### 📦 PHASE 3: Setup Recharts + React Query (1-2 giờ)
**Mục tiêu:** Install dependencies và setup infrastructure

#### Tasks Frontend:

**3.1. Install Dependencies**
```bash
cd client
npm install recharts @tanstack/react-query date-fns
npm install react-to-print xlsx
```

**3.2. Setup React Query**
File: `client/src/main.jsx`

```jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 phút
      cacheTime: 10 * 60 * 1000, // 10 phút
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
```

**3.3. Create Custom Hooks**
File: `client/src/hooks/useDashboardData.js`

```javascript
import { useQuery } from '@tanstack/react-query';
import { DashboardService } from '../services/ChuDuAnService';

export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await DashboardService.layDashboard();
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache 5 phút
  });
};
```

File: `client/src/hooks/useBaoCaoData.js`

```javascript
import { useQuery } from '@tanstack/react-query';
import { BaoCaoService } from '../services/ChuDuAnService';

export const useBaoCaoData = (filters) => {
  return useQuery({
    queryKey: ['bao-cao', filters],
    queryFn: async () => {
      const response = await BaoCaoService.layBaoCaoHieuSuat(filters);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    },
    enabled: !!(filters.tuNgay && filters.denNgay),
    staleTime: 10 * 60 * 1000, // Cache 10 phút
  });
};
```

#### Deliverables:
- [ ] Dependencies installed
- [ ] `main.jsx` updated
- [ ] `useDashboardData.js` created
- [ ] `useBaoCaoData.js` created

---

### 📈 PHASE 4: Redesign Dashboard Page (4-5 giờ)
**Mục tiêu:** Replace mock data, add Recharts, improve UX

#### Tasks:

**4.1. Update Dashboard Component**
File: `client/src/pages/ChuDuAn/Dashboard.jsx`

```jsx
import React from 'react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChuDuAnLayout from '../../layouts/ChuDuAnLayout';
import './Dashboard.css';

function DashboardChuDuAn() {
  const { data, isLoading, isError, error } = useDashboardData();

  if (isLoading) {
    return (
      <ChuDuAnLayout>
        <div className="cda-loading">
          <div className="skeleton-cards">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-card"></div>
            ))}
          </div>
          <div className="skeleton-chart"></div>
        </div>
      </ChuDuAnLayout>
    );
  }

  if (isError) {
    return (
      <ChuDuAnLayout>
        <div className="cda-error">
          <h3>⚠️ Có lỗi xảy ra</h3>
          <p>{error.message}</p>
          <button onClick={() => window.location.reload()}>Thử lại</button>
        </div>
      </ChuDuAnLayout>
    );
  }

  return (
    <ChuDuAnLayout>
      {/* Hero Section - Keep existing */}
      <div className="dashboard-hero">
        {/* ... existing hero code ... */}
      </div>

      {/* Metrics Grid - Keep existing but use real data */}
      <div className="cda-metrics-grid enhanced">
        <div className="cda-metric-card violet enhanced">
          <div className="cda-metric-value">{data.summary.tongTinDang}</div>
          <div className="cda-metric-label">Tổng tin đăng</div>
          <div className="cda-metric-change">
            {data.summary.tinDangChoDuyet} chờ duyệt
          </div>
        </div>
        {/* ... other metric cards ... */}
      </div>

      {/* NEW: Recharts Section */}
      <div className="dashboard-charts">
        {/* Doanh thu 6 tháng - Line Chart */}
        <div className="cda-card">
          <div className="cda-card-header">
            <h3>Doanh thu 6 tháng gần nhất</h3>
          </div>
          <div className="cda-card-body">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.doanhThuTheoThang}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="Thang" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem'
                  }}
                  formatter={(value) => new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(value)}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="TongTien" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  name="Doanh thu"
                  dot={{ fill: '#8b5cf6', r: 5 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Tin đăng - Bar Chart */}
        <div className="cda-card">
          <div className="cda-card-header">
            <h3>Top 5 tin đăng hiệu quả nhất</h3>
          </div>
          <div className="cda-card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topTinDang} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis type="category" dataKey="TieuDe" width={150} stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="LuotXem" fill="#10b981" name="Lượt xem" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </ChuDuAnLayout>
  );
}

export default DashboardChuDuAn;
```

**4.2. Add Skeleton Loaders**
File: `client/src/pages/ChuDuAn/Dashboard.css`

```css
/* Skeleton Loading States */
.skeleton-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.skeleton-card {
  height: 120px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 1rem;
}

.skeleton-chart {
  height: 300px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 1rem;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

#### Deliverables:
- [ ] `Dashboard.jsx` updated với Recharts
- [ ] Real data từ API
- [ ] Skeleton loaders
- [ ] Error states
- [ ] Responsive charts

---

### 📊 PHASE 5: Redesign Báo cáo Hiệu suất Page (4-5 giờ)
**Mục tiêu:** Advanced charts, filters, export functionality

#### Tasks:

**5.1. Update BaoCaoHieuSuat Component**
File: `client/src/pages/ChuDuAn/BaoCaoHieuSuat.jsx`

```jsx
import React, { useState } from 'react';
import { useBaoCaoData } from '../../hooks/useBaoCaoData';
import { LineChart, Line, BarChart, Bar, ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import ChuDuAnLayout from '../../layouts/ChuDuAnLayout';

function BaoCaoHieuSuat() {
  const [filters, setFilters] = useState({
    tuNgay: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    denNgay: format(new Date(), 'yyyy-MM-dd')
  });

  const { data, isLoading, isError, error } = useBaoCaoData(filters);
  const reportRef = React.useRef();

  // Export PDF
  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `Bao-cao-hieu-suat-${filters.tuNgay}-${filters.denNgay}`
  });

  // Export Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Tổng quan
    const tongQuanData = [
      ['Metric', 'Giá trị'],
      ['Tổng tin đăng', data.tongQuan.TongTinDang],
      ['Tin đăng đang hoạt động', data.tongQuan.TinDangDaDang],
      ['Conversion Rate', data.conversionRate.ConversionRate + '%']
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(tongQuanData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan');
    
    // Sheet 2: Doanh thu theo tháng
    const ws2 = XLSX.utils.json_to_sheet(data.doanhThuTheoThang);
    XLSX.utils.book_append_sheet(wb, ws2, 'Doanh thu');
    
    XLSX.writeFile(wb, `Bao-cao-${filters.tuNgay}-${filters.denNgay}.xlsx`);
  };

  // Quick date filters
  const setQuickFilter = (days) => {
    setFilters({
      tuNgay: format(subDays(new Date(), days), 'yyyy-MM-dd'),
      denNgay: format(new Date(), 'yyyy-MM-dd')
    });
  };

  if (isLoading) {
    return (
      <ChuDuAnLayout>
        <div className="cda-loading">Đang tải báo cáo...</div>
      </ChuDuAnLayout>
    );
  }

  return (
    <ChuDuAnLayout>
      <div ref={reportRef} className="bao-cao-container">
        {/* Header với Export Buttons */}
        <div className="bao-cao-header">
          <div>
            <h1>Báo cáo hiệu suất</h1>
            <p>Từ {filters.tuNgay} đến {filters.denNgay}</p>
          </div>
          <div className="export-buttons">
            <button onClick={handlePrint} className="cda-btn cda-btn-secondary">
              📄 Xuất PDF
            </button>
            <button onClick={handleExportExcel} className="cda-btn cda-btn-secondary">
              📊 Xuất Excel
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="cda-card">
          <div className="filter-row">
            <button onClick={() => setQuickFilter(7)}>7 ngày</button>
            <button onClick={() => setQuickFilter(30)}>30 ngày</button>
            <button onClick={() => setQuickFilter(90)}>90 ngày</button>
            
            <input 
              type="date" 
              value={filters.tuNgay}
              onChange={(e) => setFilters({...filters, tuNgay: e.target.value})}
            />
            <input 
              type="date" 
              value={filters.denNgay}
              onChange={(e) => setFilters({...filters, denNgay: e.target.value})}
            />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-cards">
          <div className="kpi-card">
            <div className="kpi-value">{data.conversionRate.ConversionRate}%</div>
            <div className="kpi-label">Conversion Rate</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{data.tongQuan.GiaTrungBinh.toLocaleString('vi-VN')}₫</div>
            <div className="kpi-label">Giá trung bình</div>
          </div>
        </div>

        {/* Advanced Charts */}
        <div className="charts-grid">
          {/* Doanh thu & Giao dịch - Composed Chart */}
          <div className="cda-card">
            <h3>Doanh thu & Số giao dịch</h3>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={data.doanhThuTheoThang}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Thang" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="TongTien" 
                  fill="#8b5cf6" 
                  stroke="#8b5cf6"
                  fillOpacity={0.3}
                  name="Doanh thu"
                />
                <Bar 
                  yAxisId="right"
                  dataKey="SoGiaoDich" 
                  fill="#10b981" 
                  name="Giao dịch"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Top 5 Tin đăng - Horizontal Bar */}
          <div className="cda-card">
            <h3>Top 5 tin đăng</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.topTinDang} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="TieuDe" width={150} />
                <Tooltip />
                <Bar dataKey="LuotXem" fill="#3b82f6" name="Lượt xem" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </ChuDuAnLayout>
  );
}

export default BaoCaoHieuSuat;
```

#### Deliverables:
- [ ] `BaoCaoHieuSuat.jsx` updated
- [ ] Advanced Recharts (ComposedChart, Area)
- [ ] Export PDF functionality
- [ ] Export Excel functionality
- [ ] Date range filters

---

### 🎨 PHASE 6: UI/UX Polish (2-3 giờ)
**Mục tiêu:** Animations, tooltips, accessibility

#### Tasks:

**6.1. Custom Tooltips**
File: `client/src/components/ChuDuAn/CustomTooltip.jsx`

```jsx
export const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="custom-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString('vi-VN')}
        </p>
      ))}
    </div>
  );
};
```

**6.2. Empty States**
File: `client/src/components/ChuDuAn/EmptyChart.jsx`

```jsx
export const EmptyChart = ({ message }) => (
  <div className="empty-chart">
    <div className="empty-icon">📊</div>
    <p>{message || 'Không có dữ liệu để hiển thị'}</p>
    <small>Thử điều chỉnh bộ lọc hoặc tạo thêm tin đăng</small>
  </div>
);
```

**6.3. Accessibility**
```jsx
// Add ARIA labels
<ResponsiveContainer 
  width="100%" 
  height={300}
  role="img"
  aria-label="Biểu đồ doanh thu 6 tháng gần nhất"
>
  <LineChart data={data} tabIndex={0}>
    {/* ... */}
  </LineChart>
</ResponsiveContainer>
```

#### Deliverables:
- [ ] Custom tooltips
- [ ] Empty states
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Focus indicators

---

### ✅ PHASE 7: Testing & Documentation (2-3 giờ)
**Mục tiêu:** QA, performance testing, docs

#### Tasks:

**7.1. Testing Checklist**
- [ ] Test với real data (100+ tin đăng)
- [ ] Test filters (date range, quick filters)
- [ ] Test export PDF (layout đẹp)
- [ ] Test export Excel (data đúng)
- [ ] Test loading states
- [ ] Test error states
- [ ] Lighthouse score (Performance > 90)
- [ ] Mobile responsive (320px - 1920px)

**7.2. Performance Optimization**
```javascript
// Lazy load charts
const LineChart = React.lazy(() => import('recharts').then(m => ({ default: m.LineChart })));

// Memoize heavy computations
const chartData = React.useMemo(() => {
  return processChartData(rawData);
}, [rawData]);
```

**7.3. Documentation**
- [ ] Update `docs/chu-du-an-routes-implementation.md`
- [ ] Create `docs/DASHBOARD_REDESIGN_SUMMARY.md`
- [ ] Update API documentation
- [ ] Screenshots cho README.md

#### Deliverables:
- [ ] All tests passing
- [ ] Lighthouse score > 90
- [ ] Documentation updated
- [ ] Screenshots added

---

## 📈 SUCCESS METRICS

| Metric | Before | Target After | Measure |
|--------|--------|--------------|---------|
| **Page Load Time** | ~3s | < 1.5s | Lighthouse |
| **Dashboard API Response** | ~500ms | < 200ms | Chrome DevTools |
| **Báo cáo API Response** | ~800ms | < 300ms | Chrome DevTools |
| **Data Accuracy** | Mock | 100% Real | Manual verification |
| **Charts Interactivity** | None | Tooltips + Hover | User testing |
| **Export Success Rate** | 0% | 100% | Functional testing |

---

## 🚨 RISKS & MITIGATION

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Database queries quá chậm** | High | Add indexes, pagination, Redis cache |
| **Recharts bundle size lớn** | Medium | Lazy loading, code splitting |
| **Date range filter phức tạp** | Low | Use date-fns, preset quick filters |
| **Export PDF layout vỡ** | Medium | Test với nhiều screen sizes, use media queries |

---

## 📚 REFERENCES

### Best Practices Sources
1. **Recharts Documentation:** https://recharts.org/en-US
2. **React Query Best Practices:** https://tanstack.com/query/latest/docs
3. **Dashboard Design Patterns:** /olliethedev/dnd-dashboard, /tabler/tabler
4. **MySQL Query Optimization:** GROUP BY, HAVING, indexes

### Files cần tham khảo
- `docs/use-cases-v1.2.md` - UC-PROJ-03
- `docs/chu-du-an-routes-implementation.md` - Current API endpoints
- `client/src/pages/ChuDuAn/README_REDESIGN.md` - Design system
- `thue_tro.sql` - Database schema

---

## 📝 COMMIT STRATEGY

Sau mỗi phase hoàn thành:

```bash
# Phase 2 example
git add server/models/ChuDuAnModel.js server/controllers/ChuDuAnController.js
git commit -m "feat(api): optimize dashboard & báo cáo queries

Backend:
- Add layDoanhThuTheoThang() method
- Optimize layBaoCaoHieuSuat() với aggregations
- Add database indexes for reporting

Performance:
- Dashboard API: 500ms → 200ms
- Báo cáo API: 800ms → 300ms

Refs: #file:DASHBOARD_BAOCAO_OPTIMIZATION_PLAN.md (Phase 2)"

git push upstream Hop
```

---

## 🎯 EXPECTED OUTCOME

Sau khi hoàn thành 7 phases:

✅ **Dashboard:**
- Real-time data từ database
- Interactive charts (Recharts)
- Fast loading (< 1.5s)
- Professional UI

✅ **Báo cáo Hiệu suất:**
- Advanced analytics (conversion rate, trends)
- Date range filtering
- Export PDF/Excel
- Print-friendly layout

✅ **Developer Experience:**
- React Query caching
- TypeScript-safe hooks
- Easy to maintain
- Well-documented

✅ **User Experience:**
- Loading states
- Error handling
- Empty states
- Responsive design
- Accessible (ARIA)

---

**Ready to implement? Start with Phase 1!** 🚀
