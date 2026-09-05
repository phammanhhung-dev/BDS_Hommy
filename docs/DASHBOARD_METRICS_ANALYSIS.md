# 📊 PHÂN TÍCH METRICS CHO DASHBOARD CHỦ DỰ ÁN

**Ngày:** 24/10/2025  
**Nguồn:** UC-PROJ-03 (use-cases-v1.2.md) + Database schema (thue_tro.sql)

---

## 🎯 UC-PROJ-03: Yêu cầu Nghiệp vụ

### Mục tiêu
> Theo dõi hiệu suất của các TinĐăng

### Chỉ số bắt buộc theo UC
- ✅ **Số lượt xem** (tracking views)
- ✅ **Lượt yêu thích** (favorites/saved)
- ✅ **Số CuộcHẹn** (appointments booked)
- ✅ **Tỉ lệ lấp đầy** (occupancy rate)

### Audit
- Mọi lần xem báo cáo phải log: `chu_du_an_xem_bao_cao`

---

## 📋 METRICS MAPPING (Database → UI)

### 1. Dashboard Chính (Overview)

| Metric Name | Database Query | Nguồn Bảng | Hiển thị | Priority |
|-------------|----------------|-----------|----------|----------|
| **Tổng tin đăng** | `COUNT(*) FROM tindang WHERE DuAnID IN (SELECT DuAnID FROM duan WHERE ChuDuAnID = ?)` | `tindang`, `duan` | Card với badge | HIGH |
| **Tin đang hoạt động** | `+ WHERE TrangThai = 'DaDang'` | `tindang` | Card + Trend ↑↓ | HIGH |
| **Tin chờ duyệt** | `+ WHERE TrangThai = 'ChoDuyet'` | `tindang` | Badge warning | MEDIUM |
| **Tin nháp** | `+ WHERE TrangThai = 'Nhap'` | `tindang` | Badge info | LOW |
| **Cuộc hẹn sắp tới** | `COUNT(*) FROM cuochen WHERE TinDangID IN (...) AND ThoiGianHen > NOW() AND TrangThai IN ('ChoXacNhan', 'DaXacNhan')` | `cuochen` | Card + Time countdown | HIGH |
| **Tổng phòng** | `COUNT(*) FROM phong WHERE DuAnID IN (...)` | `phong` | KPI Card | HIGH |
| **Phòng trống** | `+ WHERE TrangThai = 'Trong'` | `phong` | Green badge | HIGH |
| **Phòng đã thuê** | `+ WHERE TrangThai = 'DaThue'` | `phong` | Success badge | HIGH |
| **Tỷ lệ lấp đầy** | `(PhongDaThue / TongPhong) * 100` | Calculated | Pie Chart | HIGH |
| **Doanh thu tháng** | `SUM(SoTien) FROM giaodichcoc WHERE PhongID IN (...) AND MONTH(ThoiGian) = MONTH(NOW())` | `giaodichcoc` | Card currency | HIGH |

### 2. Tương tác (Engagement Metrics)

| Metric Name | Database Query | Nguồn Bảng | Hiển thị | Priority |
|-------------|----------------|-----------|----------|----------|
| **Tổng lượt xem** | `COUNT(*) FROM tuongtac WHERE TinDangID IN (...) AND LoaiTuongTac = 'Xem'` | `tuongtac` | KPI Card | HIGH |
| **Lượt xem hôm nay** | `+ AND DATE(NgayTao) = CURDATE()` | `tuongtac` | Small badge | MEDIUM |
| **Tổng lượt yêu thích** | `COUNT(*) FROM tuongtac WHERE TinDangID IN (...) AND LoaiTuongTac = 'YeuThich'` | `tuongtac` | KPI Card | HIGH |
| **Yêu thích hôm nay** | `+ AND DATE(NgayTao) = CURDATE()` | `tuongtac` | Small badge | MEDIUM |
| **Avg time on page** | `AVG(ThoiGianTrenTrang)` (nếu có) | `tuongtac` | Hidden/Future | LOW |

### 3. Hiệu suất Cuộc hẹn

| Metric Name | Database Query | Nguồn Bảng | Hiển thị | Priority |
|-------------|----------------|-----------|----------|----------|
| **Tổng cuộc hẹn** | `COUNT(*) FROM cuochen WHERE TinDangID IN (...)` | `cuochen` | KPI Card | HIGH |
| **Cuộc hẹn đã xác nhận** | `+ WHERE TrangThai = 'DaXacNhan'` | `cuochen` | Progress bar | MEDIUM |
| **Cuộc hẹn hoàn thành** | `+ WHERE TrangThai = 'HoanThanh'` | `cuochen` | Success count | MEDIUM |
| **Cuộc hẹn hủy** | `+ WHERE TrangThai IN ('HuyBoiKhach', 'HuyBoiHeThong')` | `cuochen` | Warning count | MEDIUM |
| **Khách không đến** | `+ WHERE TrangThai = 'KhachKhongDen'` | `cuochen` | Error count | MEDIUM |
| **Conversion Rate** | `(HoanThanh / Tong) * 100` | Calculated | Percentage badge | HIGH |

### 4. Giao dịch Cọc (Revenue)

| Metric Name | Database Query | Nguồn Bảng | Hiển thị | Priority |
|-------------|----------------|-----------|----------|----------|
| **Tổng giao dịch cọc** | `COUNT(*) FROM giaodichcoc WHERE PhongID IN (...)` | `giaodichcoc` | KPI Card | HIGH |
| **Cọc giữ chỗ** | `+ WHERE LoaiCoc = 'CocGiuCho'` | `giaodichcoc` | Info badge | MEDIUM |
| **Cọc an ninh** | `+ WHERE LoaiCoc = 'CocAnNinh'` | `giaodichcoc` | Warning badge | MEDIUM |
| **Tổng tiền cọc** | `SUM(SoTien)` | `giaodichcoc` | Currency KPI | HIGH |
| **Doanh thu tháng này** | `+ WHERE MONTH(ThoiGian) = MONTH(NOW())` | `giaodichcoc` | Big currency card | HIGH |
| **Doanh thu 6 tháng** | `GROUP BY MONTH(ThoiGian) ... LIMIT 6` | `giaodichcoc` | Line Chart | HIGH |

---

## 📈 ADVANCED METRICS (Báo cáo Chi tiết)

### 5. Performance Analytics

| Metric Name | Calculation | Purpose | Chart Type |
|-------------|-------------|---------|-----------|
| **Conversion Funnel** | `Views → Favorites → Appointments → Deposits → Contracts` | Identify drop-off points | Funnel Chart |
| **Avg Response Time** | `AVG(ThoiGianXacNhan - ThoiGianYeuCau)` từ `cuochen` | Service quality | KPI Card |
| **Time to Rent** | `AVG(NgayThue - NgayDangTin)` | Efficiency | KPI Card |
| **Revenue per Listing** | `(Tổng doanh thu / Số tin đăng)` | Profitability | Bar Chart |
| **Top 5 Listings** | `ORDER BY LuotXem DESC LIMIT 5` | Best performers | Horizontal Bar |
| **Bottom 5 Listings** | `ORDER BY LuotXem ASC LIMIT 5` | Need attention | Horizontal Bar |

### 6. Temporal Analysis

| Metric Name | Calculation | Purpose | Chart Type |
|-------------|-------------|---------|-----------|
| **Views by Hour** | `COUNT(*) GROUP BY HOUR(NgayTao)` | Peak traffic times | Heatmap |
| **Appointments by Day** | `COUNT(*) GROUP BY DAYOFWEEK(ThoiGianHen)` | Scheduling patterns | Bar Chart |
| **Revenue Trend** | `SUM(SoTien) GROUP BY MONTH` | Growth trajectory | Line Chart |
| **Occupancy Trend** | `(DaThue/Tong) GROUP BY MONTH` | Seasonal patterns | Area Chart |

### 7. Comparative Metrics

| Metric Name | Calculation | Purpose | Chart Type |
|-------------|-------------|---------|-----------|
| **Project Comparison** | Metrics grouped by `DuAnID` | Multi-property performance | Grouped Bar |
| **Month over Month** | `(ThisMonth - LastMonth) / LastMonth * 100` | Growth rate | Delta cards |
| **YoY Growth** | Same month last year comparison | Yearly trends | Line + Area |

---

## 🎨 UI COMPONENTS MAPPING

### Dashboard Chính

```
┌────────────────────────────────────────────────────────────┐
│  Hero Section                                              │
│  - Welcome message + Quick actions (4 buttons)             │
└────────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┐
│ Tổng tin │ Đang hoạt│ Cuộc hẹn │ Doanh thu│  Metric Cards
│   đăng   │   động   │ sắp tới  │  tháng   │  (4 cards)
└──────────┴──────────┴──────────┴──────────┘

┌─────────────────────────┬──────────────────┐
│ Doanh thu 6 tháng      │ Tỷ lệ lấp đầy    │  Charts Row 1
│ (Line Chart)            │ (Pie Chart)      │
└─────────────────────────┴──────────────────┘

┌─────────────────────────┬──────────────────┐
│ Phân bố trạng thái     │ Tương tác        │  Charts Row 2
│ (Horizontal Bars)       │ (KPI Cards)      │
└─────────────────────────┴──────────────────┘

┌─────────────────────────┬──────────────────┐
│ Tin đăng gần đây       │ Cuộc hẹn sắp tới │  Lists
│ (List with badges)      │ (Calendar cards) │
└─────────────────────────┴──────────────────┘
```

### Báo cáo Hiệu suất

```
┌────────────────────────────────────────────────────────────┐
│  Header: Báo cáo hiệu suất                                │
│  [Export PDF] [Export Excel]                               │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  Filters: [7 ngày] [30 ngày] [90 ngày] [Custom range]    │
└────────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┐
│Conversion│Avg Response│ Time to │Revenue per│  KPI Row
│   Rate   │    Time   │  Rent   │  Listing  │
└──────────┴──────────┴──────────┴──────────┘

┌─────────────────────────────────────────────┐
│ Conversion Funnel                           │  Full width
│ (Funnel Chart: Views → Favorites → ...)    │
└─────────────────────────────────────────────┘

┌─────────────────────────┬──────────────────┐
│ Revenue & Transactions  │ Top 5 Listings   │  Charts Row
│ (Composed Chart)        │ (Horizontal Bar) │
└─────────────────────────┴──────────────────┘

┌─────────────────────────┬──────────────────┐
│ Views by Hour           │ Appointments by  │  Heatmaps
│ (Heatmap)               │ Day (Bar Chart)  │
└─────────────────────────┴──────────────────┘
```

---

## 🔧 IMPLEMENTATION PRIORITIES

### Phase 1 (MVP) - Dashboard Chính
✅ **Must Have:**
- Tổng tin đăng (by status)
- Cuộc hẹn sắp tới
- Tổng phòng + Tỷ lệ lấp đầy
- Doanh thu tháng

**Chart types:**
- Metric Cards (4)
- Simple Pie Chart (occupancy)
- Recent lists (no chart)

### Phase 2 - Enhanced Dashboard
✅ **Should Have:**
- Doanh thu 6 tháng (Line Chart)
- Tương tác (Views, Favorites)
- Phân bố trạng thái (Horizontal Bars)

**New components:**
- Recharts LineChart
- Recharts BarChart
- Tooltips

### Phase 3 - Advanced Báo cáo
✅ **Nice to Have:**
- Conversion Funnel
- Time-based analysis (Heatmap)
- Export PDF/Excel
- Comparison views

**Advanced charts:**
- Funnel Chart
- Heatmap
- ComposedChart (Area + Bar)

---

## 📊 DATABASE QUERIES OPTIMIZATION

### Critical Queries (Cần Index)

```sql
-- Index cho Dashboard
CREATE INDEX idx_tindang_chuduan_status ON tindang(DuAnID, TrangThai);
CREATE INDEX idx_cuochen_tindang_thoigian ON cuochen(TinDangID, ThoiGianHen, TrangThai);
CREATE INDEX idx_phong_duan_trangthai ON phong(DuAnID, TrangThai);
CREATE INDEX idx_giaodichcoc_phong_thoigian ON giaodichcoc(PhongID, ThoiGian);

-- Index cho Tương tác
CREATE INDEX idx_tuongtac_tindang_loai_ngay ON tuongtac(TinDangID, LoaiTuongTac, NgayTao);

-- Index cho Báo cáo theo tháng
CREATE INDEX idx_giaodichcoc_month ON giaodichcoc(ThoiGian);
```

### Query Templates

**Dashboard Overview:**
```sql
-- Single optimized query for dashboard summary
SELECT 
  -- Tin đăng
  COUNT(DISTINCT td.TinDangID) as TongTinDang,
  SUM(CASE WHEN td.TrangThai = 'DaDang' THEN 1 ELSE 0 END) as TinDangDangHoatDong,
  SUM(CASE WHEN td.TrangThai = 'ChoDuyet' THEN 1 ELSE 0 END) as TinDangChoDuyet,
  
  -- Phòng
  COUNT(DISTINCT p.PhongID) as TongPhong,
  SUM(CASE WHEN p.TrangThai = 'Trong' THEN 1 ELSE 0 END) as PhongTrong,
  SUM(CASE WHEN p.TrangThai = 'DaThue' THEN 1 ELSE 0 END) as PhongDaThue,
  
  -- Doanh thu tháng này
  COALESCE(SUM(CASE 
    WHEN MONTH(gc.ThoiGian) = MONTH(NOW()) 
      AND YEAR(gc.ThoiGian) = YEAR(NOW()) 
    THEN gc.SoTien 
    ELSE 0 
  END), 0) as DoanhThuThangNay
  
FROM duan d
LEFT JOIN tindang td ON d.DuAnID = td.DuAnID
LEFT JOIN phong p ON d.DuAnID = p.DuAnID
LEFT JOIN giaodichcoc gc ON p.PhongID = gc.PhongID
WHERE d.ChuDuAnID = ?
  AND d.TrangThai != 'LuuTru';
```

**Doanh thu 6 tháng:**
```sql
SELECT 
  DATE_FORMAT(gc.ThoiGian, '%Y-%m') as Thang,
  SUM(gc.SoTien) as TongTien,
  COUNT(*) as SoGiaoDich,
  COUNT(DISTINCT gc.PhongID) as SoPhong
FROM giaodichcoc gc
JOIN phong p ON gc.PhongID = p.PhongID
JOIN duan d ON p.DuAnID = d.DuAnID
WHERE d.ChuDuAnID = ?
  AND gc.ThoiGian >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
  AND gc.TrangThai = 'ThanhCong'
GROUP BY DATE_FORMAT(gc.ThoiGian, '%Y-%m')
ORDER BY Thang ASC;
```

**Top 5 Tin đăng:**
```sql
SELECT 
  td.TinDangID,
  td.TieuDe,
  COUNT(DISTINCT tt.TuongTacID) as LuotXem,
  COUNT(DISTINCT CASE WHEN tt.LoaiTuongTac = 'YeuThich' THEN tt.TuongTacID END) as LuotYeuThich,
  COUNT(DISTINCT ch.CuocHenID) as SoCuocHen
FROM tindang td
JOIN duan d ON td.DuAnID = d.DuAnID
LEFT JOIN tuongtac tt ON td.TinDangID = tt.TinDangID
LEFT JOIN cuochen ch ON td.TinDangID = ch.TinDangID
WHERE d.ChuDuAnID = ?
  AND td.TrangThai = 'DaDang'
GROUP BY td.TinDangID
ORDER BY LuotXem DESC
LIMIT 5;
```

---

## 🎯 SUCCESS CRITERIA

### Functional Requirements
- ✅ Tất cả metrics trong UC-PROJ-03 phải có
- ✅ Data phải real-time (cache max 5 phút)
- ✅ Audit log khi xem báo cáo
- ✅ Export PDF & Excel hoạt động

### Performance Requirements
- ✅ Dashboard load < 1.5s
- ✅ Báo cáo load < 2s
- ✅ Charts render < 500ms
- ✅ Mobile responsive (320px+)

### UX Requirements
- ✅ Loading states cho mọi data fetch
- ✅ Error states với retry button
- ✅ Empty states với helpful messages
- ✅ Tooltips cho mọi metric (giải thích ý nghĩa)
- ✅ Accessibility (ARIA labels, keyboard nav)

---

## 📝 NEXT STEPS

1. ✅ **Phase 1 Complete** - Document created
2. 🔄 **Phase 2 Start** - Implement backend optimizations
   - Create optimized queries
   - Add database indexes
   - Test performance

3. 🔜 **Phase 3** - Frontend implementation
   - Install Recharts + React Query
   - Create custom hooks
   - Build components

---

**Document Status:** ✅ Complete  
**Last Updated:** 24/10/2025  
**Author:** GitHub Copilot  
**Refs:** UC-PROJ-03, thue_tro.sql
