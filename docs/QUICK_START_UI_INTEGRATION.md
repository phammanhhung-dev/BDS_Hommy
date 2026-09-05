# 🚀 QUICK START - TIẾP TỤC UI INTEGRATION

## ⏸️ TRẠNG THÁI HIỆN TẠI
- ✅ Backend: 8/8 APIs hoàn thành (100%)
- ✅ Frontend Components: 4 modals/services hoàn thành
- ⏸️ **CẦN LÀM:** Tích hợp 3 components vào QuanLyDuAn_v2.jsx

---

## 📋 CHECKLIST 3 TASKS CÒN LẠI (7 giờ)

### 🔴 Task 11: Section Chính sách Cọc (3h)
**File:** `client/src/pages/ChuDuAn/QuanLyDuAn_v2.jsx`

**Vị trí:** Trong expandable row, sau section "Thông tin dự án"

**Code cần thêm:**
```jsx
// Import
import ChinhSachCocService from '../../services/ChinhSachCocService';
import ModalQuanLyChinhSachCoc from '../../components/ChuDuAn/ModalQuanLyChinhSachCoc';

// State
const [modalCSC, setModalCSC] = useState({ isOpen: false, mode: 'create', data: null });
const [chinhSachCocList, setChinhSachCocList] = useState([]);

// Fetch function
const fetchChinhSachCoc = async () => {
  const response = await ChinhSachCocService.layDanhSach({ chiLayHieuLuc: true });
  setChinhSachCocList(response.data);
};

// JSX trong expandable row
<div className="section-chinh-sach-coc">
  <h4>💰 Chính sách Cọc</h4>
  <div className="policy-cards">
    {chinhSachCocList.map(csc => (
      <div key={csc.ChinhSachCocID} className="policy-card">
        <div className="policy-info">
          <span className="policy-name">{csc.TenChinhSach}</span>
          <span className="policy-ttl">TTL: {csc.TTL_CocGiuCho_Gio}h</span>
          <span className="policy-phat">Phạt: {csc.TyLePhat_CocGiuCho}%</span>
        </div>
        {csc.ChuDuAnID && (
          <button onClick={() => setModalCSC({ isOpen: true, mode: 'edit', data: csc })}>
            <HiOutlinePencil />
          </button>
        )}
      </div>
    ))}
  </div>
  <button className="btn-add-policy" onClick={() => setModalCSC({ isOpen: true, mode: 'create', data: null })}>
    + Thêm chính sách cọc
  </button>
</div>

// Modal component
<ModalQuanLyChinhSachCoc
  isOpen={modalCSC.isOpen}
  onClose={() => setModalCSC({ isOpen: false, mode: 'create', data: null })}
  onSuccess={fetchChinhSachCoc}
  chinhSachCoc={modalCSC.data}
  mode={modalCSC.mode}
/>
```

---

### 🟡 Task 13: Badge Banned Tooltip (1h)
**File:** `client/src/pages/ChuDuAn/QuanLyDuAn_v2.jsx`

**Vị trí:** Badge "Ngưng hoạt động" trong bảng danh sách

**Code cần thêm:**
```jsx
// Import
import { HiOutlineExclamationTriangle } from 'react-icons/hi2';

// State
const [tooltipDuAnId, setTooltipDuAnId] = useState(null);

// JSX thay badge hiện tại
{duAn.TrangThai === 'NgungHoatDong' && (
  <div 
    className="badge-banned-wrapper"
    onMouseEnter={() => setTooltipDuAnId(duAn.DuAnID)}
    onMouseLeave={() => setTooltipDuAnId(null)}
  >
    <span className="badge badge-banned">
      <HiOutlineExclamationTriangle className="icon" />
      Ngưng hoạt động
    </span>
    {tooltipDuAnId === duAn.DuAnID && duAn.LyDoNgungHoatDong && (
      <div className="tooltip">
        <strong>Lý do:</strong>
        <p>{duAn.LyDoNgungHoatDong}</p>
      </div>
    )}
  </div>
)}
```

**CSS cần thêm:**
```css
.badge-banned-wrapper {
  position: relative;
  display: inline-block;
}

.badge-banned {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  z-index: 50;
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  max-width: 300px;
  width: max-content;
}
```

---

### 🔴 Task 14: Section Banned Info (3h)
**File:** `client/src/pages/ChuDuAn/QuanLyDuAn_v2.jsx`

**Vị trí:** ĐẦU TIÊN trong expandable row, chỉ hiển thị khi TrangThai='NgungHoatDong'

**Code cần thêm:**
```jsx
// Import
import ModalYeuCauMoLaiDuAn from '../../components/ChuDuAn/ModalYeuCauMoLaiDuAn';

// State
const [modalYeuCau, setModalYeuCau] = useState({ isOpen: false, duAn: null });

// Submit function
const handleGuiYeuCauMoLai = async (duAnId, noiDungGiaiTrinh) => {
  const response = await fetch(`/api/chu-du-an/du-an/${duAnId}/yeu-cau-mo-lai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ NoiDungGiaiTrinh: noiDungGiaiTrinh })
  });
  if (response.ok) {
    alert('Đã gửi yêu cầu thành công!');
    fetchDuAnList(); // Refresh list
  }
};

// JSX đầu expandable row (CONDITIONAL)
{duAn.TrangThai === 'NgungHoatDong' && (
  <div className="banned-info-section">
    <h4>⚠️ Thông tin Ngưng hoạt động</h4>
    
    <div className="info-row">
      <span className="info-label">Lý do:</span>
      <div className="info-value info-value-danger">
        {duAn.LyDoNgungHoatDong}
      </div>
    </div>

    {duAn.NguoiNgungHoatDong_TenDayDu && (
      <div className="info-row">
        <span className="info-label">Người xử lý:</span>
        <span className="info-value">{duAn.NguoiNgungHoatDong_TenDayDu}</span>
      </div>
    )}

    <div className="info-row">
      <span className="info-label">Thời gian:</span>
      <span className="info-value">
        {new Date(duAn.NgungHoatDongLuc).toLocaleString('vi-VN')}
      </span>
    </div>

    {/* Trạng thái yêu cầu */}
    <div className="info-row">
      <span className="info-label">Trạng thái yêu cầu:</span>
      {duAn.YeuCauMoLai === 'ChuaGui' && (
        <span className="request-status-badge badge-gray">Chưa gửi</span>
      )}
      {duAn.YeuCauMoLai === 'DangXuLy' && (
        <span className="request-status-badge badge-warning">Đang xử lý</span>
      )}
      {duAn.YeuCauMoLai === 'ChapNhan' && (
        <span className="request-status-badge badge-success">Đã chấp nhận</span>
      )}
      {duAn.YeuCauMoLai === 'TuChoi' && (
        <span className="request-status-badge badge-danger">Đã từ chối</span>
      )}
    </div>

    {/* Nội dung giải trình (nếu DangXuLy) */}
    {duAn.YeuCauMoLai === 'DangXuLy' && duAn.NoiDungGiaiTrinh && (
      <div className="info-row">
        <span className="info-label">Nội dung giải trình:</span>
        <div className="info-value">{duAn.NoiDungGiaiTrinh}</div>
      </div>
    )}

    {/* Lý do từ chối (nếu TuChoi) */}
    {duAn.YeuCauMoLai === 'TuChoi' && duAn.LyDoTuChoiMoLai && (
      <div className="info-row">
        <span className="info-label">Lý do từ chối:</span>
        <div className="info-value info-value-danger">{duAn.LyDoTuChoiMoLai}</div>
      </div>
    )}

    {/* Button gửi yêu cầu (nếu ChuaGui hoặc TuChoi) */}
    {(duAn.YeuCauMoLai === 'ChuaGui' || duAn.YeuCauMoLai === 'TuChoi') && (
      <button 
        className="btn btn-request-reopen"
        onClick={() => setModalYeuCau({ isOpen: true, duAn: duAn })}
      >
        <HiOutlinePaperAirplane className="icon" />
        Gửi yêu cầu mở lại
      </button>
    )}
  </div>
)}

// Modal component
<ModalYeuCauMoLaiDuAn
  isOpen={modalYeuCau.isOpen}
  onClose={() => setModalYeuCau({ isOpen: false, duAn: null })}
  onSubmit={handleGuiYeuCauMoLai}
  duAn={modalYeuCau.duAn}
/>
```

**CSS cần thêm:**
```css
.banned-info-section {
  background: rgba(239, 68, 68, 0.05);
  border-left: 4px solid #ef4444;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.request-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-warning { background: #fef3c7; color: #92400e; }
.badge-success { background: #d1fae5; color: #065f46; }
.badge-danger { background: #fee2e2; color: #991b1b; }
.badge-gray { background: #f3f4f6; color: #4b5563; }

.btn-request-reopen {
  margin-top: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-request-reopen:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}
```

---

## 🧪 TESTING AFTER IMPLEMENTATION

### 1. Test Modal Chính sách Cọc
```bash
# Khởi chạy dev server
cd client
npm run dev

# Navigate: http://localhost:5173 → Login → Quản lý dự án
# Click expand row bất kỳ → Tìm section "Chính sách Cọc"
# Test:
✓ Click "+ Thêm chính sách cọc" → Modal mở
✓ Nhập form → Submit → Success → List refresh
✓ Click icon edit → Modal mở với pre-fill data
✓ Update → Success
```

### 2. Test Tooltip Banned
```bash
# Tìm dự án có TrangThai = 'NgungHoatDong'
# Hover badge "Ngưng hoạt động"
✓ Tooltip hiển thị với LyDoNgungHoatDong
✓ Tooltip biến mất khi mouse leave
```

### 3. Test Yêu cầu Mở lại
```bash
# Expand row dự án banned
# Kiểm tra section "⚠️ Thông tin Ngưng hoạt động"
✓ Hiển thị đầy đủ: Lý do, Người xử lý, Thời gian
✓ Badge YeuCauMoLai đúng màu (gray/yellow/green/red)
✓ Click "Gửi yêu cầu mở lại" → Modal mở
✓ Nhập giải trình < 50 chars → Button disabled
✓ Nhập ≥ 50 chars → Button enabled
✓ Submit → Success → List refresh → YeuCauMoLai = 'DangXuLy'
```

---

## 📦 FILES CREATED (12 files)

### Backend (7 files)
- `server/models/ChinhSachCocModel.js` (320 LOC)
- `server/controllers/ChinhSachCocController.js` (345 LOC)
- `server/controllers/OperatorController.js` (330 LOC)
- `server/routes/chinhSachCocRoutes.js` (92 LOC)
- `server/routes/operatorRoutes.js` (72 LOC)
- `migrations/2025_10_16_add_banned_reason_to_duan.sql` (123 LOC)
- `migrations/2025_10_16_add_chuduan_to_chinhsachcoc.sql` (61 LOC)

### Frontend (5 files)
- `client/src/services/ChinhSachCocService.js` (110 LOC)
- `client/src/components/ChuDuAn/ModalQuanLyChinhSachCoc.jsx` (320 LOC)
- `client/src/components/ChuDuAn/ModalQuanLyChinhSachCoc.css` (400 LOC)
- `client/src/components/ChuDuAn/ModalYeuCauMoLaiDuAn.jsx` (180 LOC)
- `client/src/components/ChuDuAn/ModalYeuCauMoLaiDuAn.css` (350 LOC)

### Modified (2 files)
- `server/models/ChuDuAnModel.js` (updated layDanhSachDuAn)
- `server/index.js` (mounted operatorRoutes)

---

## 📚 DOCUMENTATION
- `docs/BACKEND_IMPLEMENTATION_SUMMARY.md` - Chi tiết APIs
- `docs/FINAL_IMPLEMENTATION_SUMMARY.md` - Tổng quan project
- `docs/QUICK_START_UI_INTEGRATION.md` - File này

---

## 🎯 ESTIMATE

| Task | Estimate | Priority |
|------|----------|----------|
| Task 11 | 3h | 🔴 HIGH |
| Task 13 | 1h | 🟡 MED |
| Task 14 | 3h | 🔴 HIGH |
| **TOTAL** | **7h** | |

**Sau khi hoàn thành 3 tasks này:**
- ✅ Backend: 100%
- ✅ Frontend: 100%
- ⏸️ Testing: 0% (cần 4h)

**ETA to PRODUCTION READY:** 7h (UI) + 4h (testing) = **11 giờ**

---

## 💡 TIPS

1. **Import icons:** Đảm bảo import đúng từ `react-icons/hi2`
2. **State management:** Dùng `useState` cho modal state
3. **Fetch timing:** Call `fetchChinhSachCoc()` trong `useEffect` khi expand row
4. **Responsive:** Test mobile (480px) sau khi hoàn thành
5. **Error handling:** Wrap API calls trong try-catch, hiển thị error alerts

---

**🚀 READY TO CODE! Bắt đầu từ Task 11 → Task 13 → Task 14**
