# TÓM TẮT: CHỨC NĂNG CÒN THIẾU - MODULE CHỦ DỰ ÁN

**Ngày phân tích:** 2025-10-16  
**Phạm vi:** Quản lý Dự án (QuanLyDuAn_v2)  
**Người thực hiện:** GitHub Copilot  

---

## 🎯 KẾT QUẢ PHÂN TÍCH DATABASE

### ✅ ĐÃ CÓ TRONG DATABASE (100% Schema)

| Chức năng | Bảng | Trạng thái UI |
|-----------|------|---------------|
| Quản lý Dự án | `duan` | ✅ Hoàn chỉnh |
| Quản lý Tin đăng | `tindang` + `tindang.LyDoTuChoi` | ✅ Có UI |
| Quản lý Phòng | `phong` | ✅ Backend query OK |
| Phê duyệt Cuộc hẹn | `cuochen` (PheDuyetChuDuAn, LyDoTuChoi, PhuongThucVao) | ❓ Chưa rõ |
| Chính sách Cọc (bảng) | `chinhsachcoc` | ❌ Chưa có UI |
| Liên kết Tin-Cọc | `tindang.ChinhSachCocID` | ❌ Chưa có UI |

### ❌ THIẾU TRONG DATABASE

**Bảng `duan` thiếu 9 fields:**
1. `LyDoNgungHoatDong` TEXT - Lý do banned
2. `NguoiNgungHoatDongID` INT - ID Operator/Admin banned
3. `NgungHoatDongLuc` DATETIME - Thời điểm banned
4. `YeuCauMoLai` ENUM('ChuaGui','DangXuLy','ChapNhan','TuChoi')
5. `NoiDungGiaiTrinh` TEXT - Nội dung giải trình
6. `ThoiGianGuiYeuCau` DATETIME - Thời điểm gửi yêu cầu
7. `NguoiXuLyYeuCauID` INT - ID Operator/Admin xử lý
8. `ThoiGianXuLyYeuCau` DATETIME - Thời điểm xử lý
9. `LyDoTuChoiMoLai` TEXT - Lý do từ chối mở lại

**✅ Đã tạo migration:** `migrations/2025_10_16_add_banned_reason_to_duan.sql`

---

## 🚨 3 CHỨC NĂNG THIẾU QUAN TRỌNG NHẤT

### 1️⃣ Quản lý Chính sách Cọc (🔴 CAO)
**Hiện trạng:**
- ✅ Database: Bảng `chinhsachcoc` đã có đầy đủ 12 fields
- ❌ Backend: Chưa có API CRUD
- ❌ Frontend: Chưa có UI

**Cần làm:**
- Backend: 4 APIs (GET/POST/PUT/DELETE `/api/chu-du-an/chinh-sach-coc`)
- Frontend: Modal tạo/sửa chính sách + section trong expandable row QuanLyDuAn_v2
- Estimate: **3 ngày**

---

### 2️⃣ Lý do Banned + Yêu cầu Mở lại (🔴 CAO)
**Hiện trạng:**
- ❌ Database: Thiếu 9 fields → Migration đã tạo
- ❌ Backend: Chưa có API banned/yêu cầu mở lại/xử lý yêu cầu
- ❌ Frontend: Badge "Ngưng hoạt động" chưa có tooltip lý do, chưa có modal giải trình

**Cần làm:**
1. Chạy migration SQL
2. Backend: 3 APIs
   - PUT `/api/operator/du-an/:id/banned` (Operator/Admin banned dự án)
   - POST `/api/chu-du-an/du-an/:id/yeu-cau-mo-lai` (Chủ dự án gửi giải trình)
   - PUT `/api/operator/du-an/:id/xu-ly-yeu-cau` (Operator/Admin duyệt/từ chối)
3. Frontend:
   - Tooltip trên badge "Ngưng hoạt động" hiển thị lý do
   - Section trong expandable row hiển thị thông tin banned đầy đủ
   - Modal giải trình với textarea + upload bằng chứng
   - Badge trạng thái yêu cầu (Đang xử lý/Chấp nhận/Từ chối)
4. Update backend query `layDanhSachDuAn()` JOIN fields mới
- Estimate: **3 ngày**

---

### 3️⃣ Phê duyệt Cuộc hẹn (🔴 CAO)
**Hiện trạng:**
- ✅ Database: Bảng `cuochen` đã có đầy đủ fields (PheDuyetChuDuAn, LyDoTuChoi, PhuongThucVao, ThoiGianPheDuyet)
- ❓ Backend: Cần verify API tồn tại
- ❌ Frontend: Chưa có trang Quản lý Cuộc hẹn

**Cần làm:**
1. Verify backend API `/api/chu-du-an/cuoc-hen/:id/phe-duyet`
2. Tạo trang `QuanLyCuocHen.jsx`:
   - Tabs: Chờ phê duyệt | Đã phê duyệt | Đã từ chối
   - Table: Khách hàng, Phòng, Thời gian hẹn, Trạng thái
   - Modal phê duyệt: Chấp nhận (+ Phương thức vào) hoặc Từ chối (+ Lý do)
3. Thêm route `/chu-du-an/cuoc-hen` vào App.jsx
4. Update Navigation: Menu item mới với badge count real-time
- Estimate: **2 ngày**

---

## 📊 CHECKLIST TỔNG HỢP

### Database
- [x] Phân tích toàn bộ schema (duan, chinhsachcoc, tindang, cuochen, phong, coc)
- [x] Tạo migration thêm fields banned/yêu cầu mở lại
- [ ] Chạy migration vào MySQL

### Backend APIs (Cần tạo)
- [ ] CRUD Chính sách Cọc (4 endpoints)
- [ ] Banned dự án (1 endpoint)
- [ ] Yêu cầu mở lại dự án (1 endpoint)
- [ ] Xử lý yêu cầu mở lại (1 endpoint)
- [ ] Verify API phê duyệt cuộc hẹn

### Frontend UI (Cần tạo)
- [ ] `ModalQuanLyChinhSachCoc.jsx`
- [ ] `ModalYeuCauMoLaiDuAn.jsx`
- [ ] `QuanLyCuocHen.jsx` (trang riêng)
- [ ] Section Chính sách Cọc trong expandable row (QuanLyDuAn_v2)
- [ ] Section Lý do Banned trong expandable row (QuanLyDuAn_v2)
- [ ] Dropdown chọn chính sách cọc trong TaoTinDang/ChinhSuaTinDang
- [ ] Hiển thị lý do từ chối tin đăng (verify)

---

## ⏱️ ESTIMATE THỜI GIAN

| Giai đoạn | Công việc | Estimate |
|-----------|-----------|----------|
| **Sprint 1** | Chính sách Cọc + Banned/Mở lại + Cuộc hẹn | 8 ngày |
| **Sprint 2** | UX improvements (Lý do từ chối tin, Liên kết cọc) | 3 ngày |
| **Total** | | **11 ngày** |

*Lưu ý: Chưa tính time testing (thêm ~20-30%)*

---

## 📁 FILES ĐÃ TẠO

1. ✅ `migrations/2025_10_16_add_banned_reason_to_duan.sql` - Migration SQL
2. ✅ `docs/PHAN_TICH_CHUC_NANG_QUAN_LY_DU_AN.md` - Phân tích chi tiết
3. ✅ File này - Tóm tắt executive summary

---

## 🎯 HÀNH ĐỘNG TIẾP THEO

**Ưu tiên CAO (Cần làm trước):**
1. Chạy migration SQL vào database
2. Tạo backend API cho 3 chức năng chính
3. Tạo UI components tương ứng

**Ưu tiên TRUNG BÌNH (Cải thiện UX):**
4. Verify và bổ sung UI hiển thị lý do từ chối tin đăng
5. Thêm dropdown chọn chính sách cọc trong form tin đăng

**Ưu tiên THẤP (Documentation):**
6. Cập nhật `docs/use-cases-v1.2.md` với workflows mới
7. Tạo API documentation chi tiết

---

## 📚 THAM KHẢO

- **Phân tích đầy đủ:** `docs/PHAN_TICH_CHUC_NANG_QUAN_LY_DU_AN.md`
- **Migration SQL:** `migrations/2025_10_16_add_banned_reason_to_duan.sql`
- **Database schema:** `thue_tro.sql`
- **Use cases:** `docs/use-cases-v1.2.md`
