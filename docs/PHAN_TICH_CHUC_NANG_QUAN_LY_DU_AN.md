# PHÂN TÍCH CHỨC NĂNG QUẢN LÝ DỰ ÁN - CÒN THIẾU GÌ?

**Ngày tạo:** 2025-10-16  
**Phạm vi:** Module Chủ dự án - Quản lý dự án  
**Tham chiếu:** `thue_tro.sql`, `docs/use-cases-v1.2.md`

---

## 📊 TỔNG QUAN PHÂN TÍCH DATABASE

### ✅ Các chức năng ĐÃ CÓ đầy đủ trong database

| Chức năng | Bảng liên quan | Fields chính | Trạng thái UI |
|-----------|----------------|--------------|---------------|
| **Quản lý Dự án cơ bản** | `duan` | `DuAnID`, `TenDuAn`, `DiaChi`, `ViDo`, `KinhDo`, `ChuDuAnID`, `TrangThai` | ✅ Hoàn chỉnh (QuanLyDuAn_v2) |
| **Phương thức vào dự án** | `duan` | `YeuCauPheDuyetChu`, `PhuongThucVao` | ✅ Có trong ModalCapNhatDuAn |
| **Quản lý Tin đăng** | `tindang` | `TinDangID`, `DuAnID`, `TieuDe`, `MoTa`, `URL`, `TrangThai`, `LyDoTuChoi` | ✅ Có UI (QuanLyTinDang) |
| **Quản lý Phòng** | `phong` | `PhongID`, `DuAnID`, `TenPhong`, `TrangThai`, `GiaChuan`, `DienTichChuan` | ✅ Có backend query |
| **Phê duyệt Cuộc hẹn** | `cuochen` | `PheDuyetChuDuAn`, `LyDoTuChoi`, `PhuongThucVao`, `ThoiGianPheDuyet` | ❓ Chưa rõ có UI chưa |
| **Cọc giữ chỗ/An ninh** | `coc` | `CocID`, `Loai`, `SoTien`, `TTL_Gio`, `TrangThai` | ✅ Có backend query (CocStats) |

### ❌ Các chức năng CHƯA CÓ hoặc THIẾU SOT

#### 1. 🚨 **Quản lý Chính sách Cọc** (THIẾU HOÀN TOÀN)

**Database:** ✅ Bảng `chinhsachcoc` đã có đầy đủ
```sql
CREATE TABLE `chinhsachcoc` (
  `ChinhSachCocID` int(11) NOT NULL,
  `TenChinhSach` varchar(255) NOT NULL,
  `MoTa` text DEFAULT NULL,
  `ChoPhepCocGiuCho` tinyint(1) NOT NULL DEFAULT 1,
  `TTL_CocGiuCho_Gio` int(11) NOT NULL DEFAULT 48,       -- TTL cọc giữ chỗ (giờ)
  `TyLePhat_CocGiuCho` decimal(5,2) NOT NULL DEFAULT 0.00, -- Tỷ lệ phạt (%)
  `ChoPhepCocAnNinh` tinyint(1) NOT NULL DEFAULT 1,
  `QuyTacGiaiToa` enum('BanGiao','TheoNgay','Khac') NOT NULL DEFAULT 'BanGiao',
  `HieuLuc` tinyint(1) NOT NULL DEFAULT 1,
  `TaoLuc` datetime DEFAULT current_timestamp(),
  `CapNhatLuc` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Frontend:** ❌ CHƯA CÓ UI
- QuanLyDuAn_v2 chưa có section hiển thị chính sách cọc
- Chưa có modal tạo/chỉnh sửa chính sách cọc
- Chưa có dropdown chọn chính sách cọc trong TaoTinDang/ChinhSuaTinDang

**Backend:** ❓ Chưa rõ có API CRUD chính sách cọc chưa

**Use Case tham chiếu:** UC-PROJ-03 (Quản lý cọc và thanh toán)

**Ưu tiên:** 🔴 CAO - Ảnh hưởng trực tiếp đến luồng đặt cọc

---

#### 2. 🚨 **Lý do Ngưng hoạt động (Banned) và Yêu cầu Mở lại** (THIẾU HOÀN TOÀN)

**Database:** ❌ CHƯA CÓ fields
- Bảng `duan` thiếu: `LyDoNgungHoatDong`, `NguoiNgungHoatDongID`, `NgungHoatDongLuc`
- Thiếu fields quản lý yêu cầu mở lại: `YeuCauMoLai`, `NoiDungGiaiTrinh`, `ThoiGianGuiYeuCau`, `NguoiXuLyYeuCauID`, `ThoiGianXuLyYeuCau`, `LyDoTuChoiMoLai`

**Migration đã tạo:** ✅ `migrations/2025_10_16_add_banned_reason_to_duan.sql`

**Frontend:** ❌ CHƯA CÓ UI
- QuanLyDuAn_v2 hiển thị badge "Ngưng hoạt động" nhưng không có tooltip lý do
- Không có modal giải trình/yêu cầu mở lại dự án
- Không có UI cho Operator/Admin xử lý yêu cầu mở lại

**Backend:** ❌ CHƯA CÓ API
- Chưa có API banned dự án với lý do
- Chưa có API gửi yêu cầu mở lại
- Chưa có API Operator/Admin duyệt/từ chối yêu cầu

**Use Case tham chiếu:** UC-OP-04 (Quản lý vi phạm và xử phạt)

**Ưu tiên:** 🔴 CAO - Nghiệp vụ quan trọng cho quyền quản trị

---

#### 3. ⚠️ **Hiển thị Lý do Từ chối Tin đăng** (THIẾU UI)

**Database:** ✅ Bảng `tindang` đã có field `LyDoTuChoi TEXT NULL`

**Frontend:** ❓ Chưa rõ UI QuanLyTinDang có hiển thị chưa
- Cần verify: Chi tiết tin đăng có hiển thị lý do từ chối không?
- Cần verify: Modal chỉnh sửa có editable field này không?

**Backend:** ✅ Backend query đã include field này

**Use Case tham chiếu:** UC-PROJ-01 (Đăng tin cho thuê)

**Ưu tiên:** 🟡 TRUNG BÌNH - UX cải thiện, không block nghiệp vụ

---

#### 4. ⚠️ **Liên kết Tin đăng với Chính sách Cọc** (THIẾU UI)

**Database:** ✅ Bảng `tindang` đã có field `ChinhSachCocID INT(11)`

**Frontend:** ❌ CHƯA CÓ UI
- TaoTinDang chưa có dropdown chọn chính sách cọc
- ChinhSuaTinDang chưa có dropdown chọn chính sách cọc
- Chi tiết tin đăng chưa hiển thị thông tin chính sách cọc áp dụng

**Backend:** ✅ Backend query đã include field này

**Use Case tham chiếu:** UC-PROJ-01 (Đăng tin cho thuê)

**Ưu tiên:** 🟡 TRUNG BÌNH - Phụ thuộc vào chức năng #1 (Quản lý chính sách cọc)

---

#### 5. ⚠️ **Phê duyệt Cuộc hẹn từ Chủ dự án** (THIẾU UI)

**Database:** ✅ Bảng `cuochen` đã có đầy đủ fields
```sql
`PheDuyetChuDuAn` enum('ChoPheDuyet','DaPheDuyet','TuChoi') DEFAULT NULL 
  COMMENT 'Trạng thái phê duyệt từ chủ dự án (NULL nếu dự án không yêu cầu phê duyệt)',
`LyDoTuChoi` text DEFAULT NULL 
  COMMENT 'Lý do từ chối cuộc hẹn (nếu PheDuyetChuDuAn = TuChoi)',
`PhuongThucVao` text DEFAULT NULL 
  COMMENT 'Phương thức vào dự án cho cuộc hẹn này (ghi đè PhuongThucVao của duan nếu có)',
`ThoiGianPheDuyet` datetime DEFAULT NULL 
  COMMENT 'Thời điểm chủ dự án phê duyệt/từ chối cuộc hẹn'
```

**Frontend:** ❓ Chưa rõ có UI quản lý cuộc hẹn chưa
- Cần verify: Dashboard có section "Cuộc hẹn chờ phê duyệt" không?
- Cần verify: Có trang quản lý cuộc hẹn riêng không?

**Backend:** ❓ Chưa rõ có API phê duyệt/từ chối cuộc hẹn chưa

**Use Case tham chiếu:** UC-PROJ-02 (Quản lý cuộc hẹn)

**Ưu tiên:** 🔴 CAO - Nghiệp vụ chính của Chủ dự án

---

## 📋 ROADMAP TRIỂN KHAI

### Phase 1: Nghiệp vụ Cốt lõi (Ưu tiên CAO) - Sprint 1 (1 tuần)

#### Task 1.1: Quản lý Chính sách Cọc
**Công việc:**
1. **Backend API:**
   - `GET /api/chu-du-an/chinh-sach-coc` - Danh sách chính sách cọc của Chủ dự án
   - `POST /api/chu-du-an/chinh-sach-coc` - Tạo chính sách cọc mới
   - `PUT /api/chu-du-an/chinh-sách-coc/:id` - Cập nhật chính sách cọc
   - `DELETE /api/chu-du-an/chinh-sach-coc/:id` - Vô hiệu hóa chính sách (soft delete)

2. **Frontend UI:**
   - Component: `ModalQuanLyChinhSachCoc.jsx`
     - Form tạo/sửa: Tên chính sách, Mô tả, TTL giữ chỗ (giờ), Tỷ lệ phạt (%), Quy tắc giải tỏa, Cọc an ninh mặc định
     - Validation: TTL > 0, Tỷ lệ phạt 0-100%
   - Thêm section trong expandable row của QuanLyDuAn_v2:
     ```jsx
     <div className="cda-detail-section">
       <h4>📋 Chính sách Cọc</h4>
       {item.ChinhSachCoc?.map(policy => (
         <div className="policy-card">
           <span className="policy-name">{policy.TenChinhSach}</span>
           <span className="policy-ttl">TTL: {policy.TTL_CocGiuCho_Gio}h</span>
           <span className="policy-fine">Phạt: {policy.TyLePhat_CocGiuCho}%</span>
           <button onClick={() => openEditPolicy(policy.ChinhSachCocID)}>
             <HiOutlinePencil />
           </button>
         </div>
       ))}
       <button className="btn-add-policy" onClick={openCreatePolicy}>
         + Thêm chính sách cọc
       </button>
     </div>
     ```

3. **Backend Model:**
   - File: `server/models/ChinhSachCocModel.js`
   - Methods:
     ```javascript
     layDanhSach(chuDuAnID) // Lấy danh sách chính sách của Chủ dự án
     taoMoi({ TenChinhSach, MoTa, TTL_CocGiuCho_Gio, ... })
     capNhat(chinhSachCocID, data)
     voHieuHoa(chinhSachCocID) // Soft delete (HieuLuc = 0)
     ```

**Estimate:** 3 ngày (1 backend, 2 frontend)

---

#### Task 1.2: Banned Dự án với Lý do
**Công việc:**
1. **Chạy Migration:**
   ```bash
   # PowerShell
   cd "d:\Vo Nguyen Hoanh Hop_J Liff\xampp\htdocs\daphongtro"
   # Import migration vào MySQL
   mysql -u root -p thue_tro < migrations/2025_10_16_add_banned_reason_to_duan.sql
   ```

2. **Backend API:**
   - `PUT /api/operator/du-an/:id/banned` - Operator/Admin banned dự án
     - Body: `{ LyDoNgungHoatDong: string, NguoiNgungHoatDongID: int }`
     - Response: Ghi audit log, cập nhật TrangThai='NgungHoatDong'
   - `POST /api/chu-du-an/du-an/:id/yeu-cau-mo-lai` - Chủ dự án gửi yêu cầu mở lại
     - Body: `{ NoiDungGiaiTrinh: string }`
     - Response: Cập nhật YeuCauMoLai='DangXuLy'
   - `PUT /api/operator/du-an/:id/xu-ly-yeu-cau` - Operator/Admin xử lý yêu cầu
     - Body: `{ KetQua: 'ChapNhan'|'TuChoi', LyDoTuChoiMoLai?: string }`

3. **Frontend UI:**
   - Component: `ModalYeuCauMoLaiDuAn.jsx`
     - Textarea: Nội dung giải trình (required, min 50 ký tự)
     - Upload: Đính kèm bằng chứng (optional, max 5 files)
   - Cập nhật QuanLyDuAn_v2.jsx:
     ```jsx
     {/* Badge cho dự án bị banned */}
     {item.TrangThai === 'NgungHoatDong' && (
       <Tooltip content={item.LyDoNgungHoatDong}>
         <span className="badge badge-banned">
           <HiOutlineExclamationTriangle />
           Ngưng hoạt động
         </span>
       </Tooltip>
     )}
     
     {/* Expandable row - Section lý do banned */}
     {item.TrangThai === 'NgungHoatDong' && (
       <div className="cda-detail-section banned-info">
         <h4>⚠️ Thông tin Ngưng hoạt động</h4>
         <div className="banned-details">
           <p><strong>Lý do:</strong> {item.LyDoNgungHoatDong}</p>
           <p><strong>Người xử lý:</strong> {item.NguoiNgungHoatDong?.TenDayDu}</p>
           <p><strong>Thời gian:</strong> {formatDateTime(item.NgungHoatDongLuc)}</p>
         </div>
         
         {/* Nút yêu cầu mở lại */}
         {!item.YeuCauMoLai || item.YeuCauMoLai === 'TuChoi' ? (
           <button 
             className="btn-request-reopen" 
             onClick={() => openModalYeuCauMoLai(item.DuAnID)}
           >
             <HiOutlineArrowPath />
             Gửi yêu cầu mở lại
           </button>
         ) : (
           <div className="request-status">
             {item.YeuCauMoLai === 'DangXuLy' && (
               <span className="badge badge-warning">
                 <HiOutlineClock />
                 Đang xử lý yêu cầu
               </span>
             )}
             {item.YeuCauMoLai === 'ChapNhan' && (
               <span className="badge badge-success">
                 <HiOutlineCheckCircle />
                 Yêu cầu được chấp nhận
               </span>
             )}
             {item.YeuCauMoLai === 'TuChoi' && (
               <div>
                 <span className="badge badge-danger">
                   <HiOutlineXCircle />
                   Yêu cầu bị từ chối
                 </span>
                 <p className="reason-text">{item.LyDoTuChoiMoLai}</p>
               </div>
             )}
           </div>
         )}
       </div>
     )}
     ```

4. **Backend Model Update:**
   - File: `server/models/ChuDuAnModel.js`
   - Update method `layDanhSachDuAn()` để JOIN thêm fields mới:
     ```javascript
     // Line ~650 (trong method layDanhSachDuAn)
     const query = `
       SELECT 
         d.DuAnID, d.TenDuAn, d.DiaChi, d.TrangThai,
         d.LyDoNgungHoatDong, d.NguoiNgungHoatDongID, d.NgungHoatDongLuc,
         d.YeuCauMoLai, d.NoiDungGiaiTrinh, d.ThoiGianGuiYeuCau,
         d.LyDoTuChoiMoLai,
         nd_banned.TenDayDu AS NguoiNgungHoatDong_TenDayDu,
         ... (existing fields)
       FROM duan d
       LEFT JOIN nguoidung nd_banned ON d.NguoiNgungHoatDongID = nd_banned.NguoiDungID
       ... (existing joins)
     `;
     ```

**Estimate:** 3 ngày (1 migration + backend, 2 frontend)

---

#### Task 1.3: Phê duyệt Cuộc hẹn
**Công việc:**
1. **Verify backend API tồn tại:**
   - Check file: `server/routes/cuocHenRoutes.js` hoặc `chuDuAnRoutes.js`
   - Cần có: `PUT /api/chu-du-an/cuoc-hen/:id/phe-duyet`

2. **Tạo trang Quản lý Cuộc hẹn:**
   - File: `client/src/pages/ChuDuAn/QuanLyCuocHen.jsx`
   - UI gồm:
     - Tabs: Chờ phê duyệt | Đã phê duyệt | Đã từ chối | Tất cả
     - Table: Khách hàng, Phòng, Thời gian hẹn, Trạng thái, Hành động
     - Modal phê duyệt: Chọn "Chấp nhận" hoặc "Từ chối" + Lý do (nếu từ chối) + Phương thức vào (nếu chấp nhận)

3. **Thêm route vào App.jsx:**
   ```jsx
   import QuanLyCuocHen from './pages/ChuDuAn/QuanLyCuocHen';
   // ...
   <Route path='/chu-du-an/cuoc-hen' element={<QuanLyCuocHen />} />
   ```

4. **Update Navigation:**
   - File: `client/src/components/ChuDuAn/NavigationChuDuAn.jsx`
   - Thêm menu item:
     ```jsx
     {
       to: '/chu-du-an/cuoc-hen',
       icon: <HiOutlineCalendar />,
       label: 'Cuộc hẹn',
       badge: countCuocHenChoDuyet // Real-time count từ API
     }
     ```

**Estimate:** 2 ngày (verify backend + frontend UI)

---

### Phase 2: UX Improvements (Ưu tiên TRUNG BÌNH) - Sprint 2 (1 tuần)

#### Task 2.1: Hiển thị Lý do Từ chối Tin đăng
**Công việc:**
1. Verify UI hiện tại:
   ```bash
   # Tìm tất cả file liên quan
   grep -r "LyDoTuChoi" client/src/pages/ChuDuAn/
   ```

2. Nếu chưa có, thêm vào:
   - `QuanLyTinDang.jsx`: Expandable row hiển thị lý do từ chối
   - `ChiTietTinDang.jsx`: Alert box màu đỏ hiển thị lý do từ chối
   - `ChinhSuaTinDang.jsx`: Readonly field hiển thị lý do (không cho sửa)

**Estimate:** 1 ngày

---

#### Task 2.2: Liên kết Tin đăng với Chính sách Cọc
**Công việc:**
1. **TaoTinDang.jsx:**
   - Thêm dropdown chọn chính sách cọc:
     ```jsx
     <div className="form-group">
       <label>Chính sách Cọc <span className="required">*</span></label>
       <select 
         name="ChinhSachCocID" 
         value={formData.ChinhSachCocID}
         onChange={handleChange}
         required
       >
         <option value="">-- Chọn chính sách --</option>
         {danhSachChinhSachCoc.map(policy => (
           <option key={policy.ChinhSachCocID} value={policy.ChinhSachCocID}>
             {policy.TenChinhSach} (TTL: {policy.TTL_CocGiuCho_Gio}h, Phạt: {policy.TyLePhat_CocGiuCho}%)
           </option>
         ))}
       </select>
     </div>
     ```

2. **ChinhSuaTinDang.jsx:** Tương tự TaoTinDang

3. **ChiTietTinDang.jsx:**
   - Hiển thị thông tin chính sách cọc áp dụng:
     ```jsx
     <div className="tin-dang-section">
       <h3>📋 Chính sách Cọc áp dụng</h3>
       <div className="policy-info-card">
         <p><strong>Tên:</strong> {tinDang.ChinhSachCoc.TenChinhSach}</p>
         <p><strong>TTL giữ chỗ:</strong> {tinDang.ChinhSachCoc.TTL_CocGiuCho_Gio} giờ</p>
         <p><strong>Tỷ lệ phạt:</strong> {tinDang.ChinhSachCoc.TyLePhat_CocGiuCho}%</p>
         <p><strong>Quy tắc giải tỏa:</strong> {formatQuyTacGiaiToa(tinDang.ChinhSachCoc.QuyTacGiaiToa)}</p>
       </div>
     </div>
     ```

**Estimate:** 2 ngày

---

## 📊 TỔNG KẾT CHECKLIST

### Database Schema
- ✅ Bảng `chinhsachcoc` - Đã có đầy đủ
- ✅ Bảng `tindang.ChinhSachCocID` - Đã có field
- ✅ Bảng `tindang.LyDoTuChoi` - Đã có field
- ✅ Bảng `cuochen` - Đã có đầy đủ fields phê duyệt
- ❌ Bảng `duan` - Thiếu fields banned/yêu cầu mở lại → Migration đã tạo

### Backend APIs
- ❌ CRUD Chính sách Cọc
- ❌ Banned dự án với lý do
- ❌ Yêu cầu mở lại dự án
- ❌ Xử lý yêu cầu mở lại (Operator/Admin)
- ❓ Phê duyệt/Từ chối cuộc hẹn (cần verify)

### Frontend Components
- ❌ `ModalQuanLyChinhSachCoc.jsx`
- ❌ `ModalYeuCauMoLaiDuAn.jsx`
- ❌ `QuanLyCuocHen.jsx` (trang riêng)
- ❌ Expandable row section: Chính sách Cọc
- ❌ Expandable row section: Lý do banned + Yêu cầu mở lại
- ❓ Dropdown chọn chính sách cọc trong TaoTinDang/ChinhSuaTinDang
- ❓ Hiển thị lý do từ chối tin đăng

### Documentation
- ✅ Migration SQL đã tạo
- ✅ File phân tích này
- ❌ API documentation cho endpoints mới
- ❌ Update `docs/use-cases-v1.2.md` với workflows mới

---

## 🎯 ESTIMATE TỔNG

| Phase | Tasks | Estimate | Priority |
|-------|-------|----------|----------|
| **Phase 1** | Quản lý Chính sách Cọc + Banned + Cuộc hẹn | 8 ngày | 🔴 CAO |
| **Phase 2** | UX improvements (Lý do từ chối, Liên kết cọc) | 3 ngày | 🟡 TRUNG BÌNH |
| **Total** | | **11 ngày** (~2 sprints) | |

**Lưu ý:** Estimate trên giả định 1 developer full-time, chưa tính time testing và bug fixing (thường thêm 20-30%).

---

## 📚 THAM CHIẾU

- **Use Cases:** `docs/use-cases-v1.2.md`
- **Database Schema:** `thue_tro.sql`
- **Migration:** `migrations/2025_10_16_add_banned_reason_to_duan.sql`
- **Existing UI:** `client/src/pages/ChuDuAn/QuanLyDuAn_v2.jsx`, `QuanLyDuAn_v2.css`
- **Design System:** `client/src/styles/ChuDuAnDesignSystem.css`
