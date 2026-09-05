# Phase 1: Phân tích & Inventory - Kết quả

## 1. Phân tích ChuDuAnModel.js (1648 dòng, 29 methods)

### Domain: TinDang (Tin đăng) - 7 methods
**Target file:** `server/models/TinDangModel.js`

| Method | Lines | Mô tả |
|--------|-------|-------|
| `layDanhSachTinDang` | 41-103 | Lấy danh sách tin đăng với filters |
| `layChiTietTinDang` | 111-186 | Lấy chi tiết tin đăng + danh sách phòng |
| `taoTinDang` | 194-253 | Tạo tin đăng mới, thêm phòng vào tin đăng |
| `capNhatTinDang` | 262-339 | Cập nhật tin đăng, sync phòng |
| `guiTinDangDeDuyet` | 347-383 | Gửi tin đăng để duyệt, validate |
| `xoaTinDang` | 392-417 | Soft delete tin đăng (LuuTru) |
| `layDanhSachPhong` | 1416-1419 | Deprecated, delegate to PhongModel |

**Dependencies:**
- `db` (require('../config/db'))
- `PhongModel` (require('./PhongModel')) - used in taoTinDang, capNhatTinDang

---

### Domain: CuocHen (Cuộc hẹn) - 5 methods
**Target file:** `server/models/CuocHenModel.js`

| Method | Lines | Mô tả |
|--------|-------|-------|
| `layDanhSachCuocHen` | 425-475 | Lấy danh sách cuộc hẹn với filters |
| `xacNhanCuocHen` | 484-514 | Xác nhận cuộc hẹn (Chờ → Đã xác nhận) |
| `layMetricsCuocHen` | 521-549 | Thống kê metrics cuộc hẹn |
| `pheDuyetCuocHen` | 559-598 | Phê duyệt cuộc hẹn |
| `tuChoiCuocHen` | 607-647 | Từ chối cuộc hẹn |

**Dependencies:**
- `db` (require('../config/db'))

---

### Domain: BaoCaoHieuSuat (Báo cáo) - 6 methods
**Target file:** `server/models/BaoCaoHieuSuatModel.js`

| Method | Lines | Mô tả |
|--------|-------|-------|
| `layBaoCaoHieuSuat` | 655-764 | Báo cáo tổng quan (legacy) |
| `layDoanhThuTheoThang` | 1433-1455 | Doanh thu 6 tháng gần nhất |
| `layTopTinDang` | 1464-1508 | Top 5 tin đăng hiệu quả nhất |
| `layConversionRate` | 1516-1552 | Tỷ lệ chuyển đổi hẹn → hoàn thành |
| `layLuotXemTheoGio` | 1560-1587 | Heatmap lượt xem theo giờ |
| `layBaoCaoHieuSuatChiTiet` | 1596-1641 | Tổng hợp tất cả báo cáo (enhanced) |

**Dependencies:**
- `db` (require('../config/db'))
- Calls other methods in same domain (Promise.all trong layBaoCaoHieuSuatChiTiet)

---

### Domain: DuAn (Dự án) - 9 methods
**Target file:** `server/models/DuAnModel.js`

| Method | Lines | Mô tả |
|--------|-------|-------|
| `layDanhSachDuAn` | 771-937 | Lấy danh sách dự án + stats + cọc + policies |
| `layThongKePhong` | 944-969 | Thống kê phòng theo trạng thái |
| `layDanhSachKhuVuc` | 971-985 | Lấy danh sách khu vực (có thể tách riêng) |
| `layChiTietDuAn` | 987-1007 | Lấy chi tiết dự án |
| `taoDuAn` | 1012-1043 | Tạo dự án mới, kiểm tra trùng địa chỉ |
| `taoDuAnNhanh` | 1045-1067 | Tạo dự án nhanh (ít fields) |
| `demTinDangHoatDong` | 1069-1078 | Đếm tin đăng còn hoạt động |
| `capNhatDuAn` | 1080-1215 | Cập nhật dự án, validate phức tạp |
| `luuTruDuAn` | 1217-1244 | Soft delete dự án (LuuTru) |

**Dependencies:**
- `db` (require('../config/db'))

**Note:** `layDanhSachKhuVuc` có thể tách sang `KhuVucModel.js` vì không liên quan trực tiếp đến DuAn.

---

### Domain: ChinhSachCoc - 2 methods (ĐÃ CÓ ChinhSachCocModel.js)
**Current file:** `server/models/ChinhSachCocModel.js` (301 dòng)

| Method | Lines | Mô tả |
|--------|-------|-------|
| `layChiTietChinhSachCoc` | 1246-1295 | Lấy chi tiết chính sách cọc |
| `capNhatChinhSachCoc` | 1297-1408 | Cập nhật chính sách cọc |

**Action:** DI CHUYỂN 2 methods này sang `ChinhSachCocModel.js` hiện có.

---

## 2. Phân tích ChuDuAnController.js (1591 dòng, 33 methods)

### Domain: TinDang (Tin đăng) - 10 methods
**Target file:** `server/controllers/TinDangController.js`

| Method | Lines | Description |
|--------|-------|-------------|
| `taoTinDang` | 21-82 | POST /api/chu-du-an/tin-dang - Tạo tin đăng |
| `layDanhSachTinDang` | 84-116 | GET /api/chu-du-an/tin-dang - List tin đăng |
| `layChiTietTinDang` | 118-156 | GET /api/chu-du-an/tin-dang/:id - Chi tiết |
| `layDanhSachPhong` | 158-187 | GET /api/chu-du-an/tin-dang/:id/phong - List phòng |
| `capNhatTinDang` | 189-233 | PUT /api/chu-du-an/tin-dang/:id - Update |
| `guiTinDangDeDuyet` | 235-278 | POST /api/chu-du-an/tin-dang/:id/gui-duyet |
| `luuNhapTinDang` | 864-898 | PUT /api/chu-du-an/tin-dang/:id/luu-nhap |
| `layTinDangDeChinhSua` | 1095-1144 | GET /api/chu-du-an/tin-dang/:id/chinh-sua |
| `layDanhSachTinNhap` | 1245-1272 | GET /api/chu-du-an/tin-nhap |
| `xoaTinDang` | 1274-1327 | DELETE /api/chu-du-an/tin-dang/:id |

---

### Domain: CuocHen (Cuộc hẹn) - 5 methods
**Target file:** `server/controllers/CuocHenController.js`

| Method | Lines | Description |
|--------|-------|-------------|
| `layDanhSachCuocHen` | 280-313 | GET /api/chu-du-an/cuoc-hen |
| `xacNhanCuocHen` | 315-359 | PUT /api/chu-du-an/cuoc-hen/:id/xac-nhan |
| `layMetricsCuocHen` | 361-382 | GET /api/chu-du-an/cuoc-hen/metrics |
| `pheDuyetCuocHen` | 384-445 | PUT /api/chu-du-an/cuoc-hen/:id/phe-duyet |
| `tuChoiCuocHen` | 447-507 | PUT /api/chu-du-an/cuoc-hen/:id/tu-choi |

---

### Domain: BaoCaoHieuSuat (Báo cáo) - 5 methods
**Target file:** `server/controllers/BaoCaoHieuSuatController.js`

| Method | Lines | Description |
|--------|-------|-------------|
| `layBaoCaoHieuSuat` | 509-547 | GET /api/chu-du-an/bao-cao |
| `layDoanhThuTheoThang` | 1474-1495 | GET /api/chu-du-an/bao-cao/doanh-thu |
| `layTopTinDang` | 1497-1523 | GET /api/chu-du-an/bao-cao/top-tin-dang |
| `layConversionRate` | 1525-1551 | GET /api/chu-du-an/bao-cao/conversion |
| `layBaoCaoHieuSuatChiTiet` | 1553-1583 | GET /api/chu-du-an/bao-cao/chi-tiet |

---

### Domain: DuAn (Dự án) - 8 methods
**Target file:** `server/controllers/DuAnController.js`

| Method | Lines | Description |
|--------|-------|-------------|
| `layDanhSachDuAn` | 549-566 | GET /api/chu-du-an/du-an |
| `layChiTietDuAn` | 568-595 | GET /api/chu-du-an/du-an/:id |
| `layDanhSachKhuVuc` | 597-612 | GET /api/chu-du-an/khu-vuc |
| `taoDuAn` | 614-632 | POST /api/chu-du-an/du-an |
| `capNhatDuAn` | 634-703 | PUT /api/chu-du-an/du-an/:id |
| `luuTruDuAn` | 705-751 | DELETE /api/chu-du-an/du-an/:id |
| `taoNhanhDuAn` | 953-1023 | POST /api/chu-du-an/du-an/nhanh |
| `guiYeuCauMoLaiDuAn` | 1329-1472 | POST /api/chu-du-an/du-an/:id/yeu-cau-mo-lai |

---

### Domain: ChinhSachCoc - 2 methods (MERGE vào ChinhSachCocController.js)
**Current file:** `server/controllers/ChinhSachCocController.js`

| Method | Lines | Description |
|--------|-------|-------------|
| `layChiTietChinhSachCoc` | 753-786 | GET /api/chu-du-an/chinh-sach-coc/:id |
| `capNhatChinhSachCoc` | 788-862 | PUT /api/chu-du-an/chinh-sach-coc/:id |

---

### Other - 3 methods (CẦN XỬ LÝ ĐẶC BIỆT)

| Method | Lines | Description | Note |
|--------|-------|-------------|------|
| `layDashboard` | 1025-1093 | GET /api/chu-du-an/dashboard | Aggregate data, có thể để riêng hoặc vào BaoCaoController |
| `baoCaoHopDongChoThue` | 900-951 | POST /api/chu-du-an/bao-cao-hop-dong | UC-PROJ-04, có thể tách sang HopDongController |
| `capNhatTinDang` (duplicate) | 1146-1243 | PUT /api/chu-du-an/tin-dang/:id/cap-nhat | Duplicate method! Cần merge với line 189 |

---

## 3. CSS Files Analysis (43 files)

### Priority 0 - CRITICAL Components (10 files) - 2 giờ
**Components hay dùng, ảnh hưởng lớn đến UX:**

1. `components/ChuDuAn/ModalCapNhatDuAn.css` (388 dòng)
2. `components/ChuDuAn/NavigationChuDuAn.css` (245 dòng)
3. `components/ChuDuAn/ModalPreviewDuAn.css` 
4. `components/ChuDuAn/ModalChonChinhSachCoc.css`
5. `components/ChuDuAn/ModalBaoCaoHopDong.css`
6. `components/ChuDuAn/ModalChiTietCuocHen.css`
7. `components/ChuDuAn/ModalPheDuyetCuocHen.css`
8. `components/ChuDuAn/ModalTuChoiCuocHen.css`
9. `components/ChuDuAn/ModalPreviewPhong.css`
10. `components/ChuDuAn/ModalYeuCauMoLaiDuAn.css`

**Common pattern violations:**
```css
/* ❌ HIỆN TẠI */
.modal-duan-overlay {}
.modal-duan-container {}
.modal-duan-header {}

/* ✅ CẦN SỬA */
.modal-duan {}
.modal-duan__overlay {}
.modal-duan__container {}
.modal-duan__header {}
```

---

### Priority 1 - HIGH (Main Pages) (10 files) - 2 giờ
**Pages chính, traffic cao:**

1. `pages/ChuDuAn/Dashboard.css`
2. `pages/ChuDuAn/QuanLyTinDang.css`
3. `pages/ChuDuAn/TaoTinDang.css` (417 dòng - file lớn)
4. `pages/ChuDuAn/ChiTietTinDang.css` (930 dòng - file RẤT LỚN)
5. `pages/ChuDuAn/QuanLyDuAn.css`
6. `pages/ChuDuAn/QuanLyCuocHen.css`
7. `pages/ChuDuAn/QuanLyHopDong.css`
8. `pages/ChuDuAn/BaoCaoHieuSuat.css`
9. `pages/ChuDuAn/CaiDat.css`
10. `layouts/ChuDuAnLayout.css`

---

### Priority 2 - MEDIUM (Secondary Components) (15 files) - 2 giờ
**Components ít dùng hơn:**

1. `components/ChuDuAn/DetailModal.css`
2. `components/ChuDuAn/MetricCard.css`
3. `components/ChuDuAn/SectionChonPhong.css`
4. `components/ChuDuAn/AddressAutocompleteInput.css`
5. `components/ChuDuAn/Charts/RevenueChart.css`
6. `components/ChuDuAn/ModalQuanLyChinhSachCoc.css`
7. `components/AddressSearchInput/AddressSearchInput.css`
8. `components/AddressAutocomplete/AddressAutocomplete.css`
9. `components/MapViTriPhong/MapViTriPhong.css`
10. `components/header.css`
11. `components/footer.css`
12. `components/SearchKhuVuc/searchkhuvuc.css`
13. `styles/ChuDuAnDesignSystem.css` (chứa design tokens, CẦN GIỮ NGUYÊN)
14. `styles/TableLayout.css`
15. `index.css`

---

### Priority 3 - LOW (Legacy/Public Pages) (8 files) - 1-2 giờ
**Pages public hoặc legacy, ít ảnh hưởng:**

1. `pages/trangchu/trangchu.css`
2. `pages/chitiettindang/chitiettindang.css`
3. `pages/login/login.css`
4. `pages/dangky/dangky.css`
5. `pages/thanhtoan/thanhtoan.css`
6. `pages/thanhtoancoc/thanhtoancoc.css`
7. `pages/quanlytaikhoan/quanlytaikhoan.css`
8. `App.css`

---

## 4. Tổng kết Phase 1

### Models
- **ChuDuAnModel.js**: 1648 dòng → Tách thành 4 files (TinDang, CuocHen, BaoCao, DuAn)
- **2 methods ChinhSachCoc**: Di chuyển sang ChinhSachCocModel.js hiện có

### Controllers  
- **ChuDuAnController.js**: 1591 dòng → Tách thành 4 files (TinDang, CuocHen, BaoCao, DuAn)
- **2 methods ChinhSachCoc**: Di chuyển sang ChinhSachCocController.js
- **3 methods đặc biệt**: Xử lý riêng (Dashboard, HopDong, duplicate method)

### CSS
- **43 files** cần migrate sang BEM
- **Priority 0**: 10 files (modals quan trọng)
- **Priority 1**: 10 files (main pages)
- **Priority 2**: 15 files (secondary components)
- **Priority 3**: 8 files (legacy/public)

### Ước tính tổng thời gian Phase 1
- ✅ **Đã hoàn thành**: Inventory và phân tích chi tiết (1.5 giờ)

---

## 5. Dependencies và Risks

### Model Dependencies
- `TinDangModel` → `PhongModel` (already exists)
- `CuocHenModel` → No dependencies
- `BaoCaoHieuSuatModel` → Calls own methods (Promise.all)
- `DuAnModel` → No dependencies

### Controller Dependencies
- All controllers → Import tương ứng model mới
- `NhatKyHeThongService` → Shared across all controllers (keep as is)

### Critical Risks
1. **Duplicate method** trong ChuDuAnController.js (2 `capNhatTinDang`)
2. **layDashboard** gọi nhiều domains → Cần thiết kế lại
3. **baoCaoHopDongChoThue** → Cần quyết định nằm ở controller nào
4. **CSS files lớn** (ChiTietTinDang: 930 dòng, TaoTinDang: 417 dòng) → Tốn thời gian migrate

---

**Status:** ✅ PHASE 1 COMPLETED
**Next:** PHASE 2 - Tách Models























































