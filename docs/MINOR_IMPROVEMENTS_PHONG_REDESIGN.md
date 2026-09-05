# 🔧 DANH SÁCH CẢI TIẾN NHỎ - PHÒNG REDESIGN

**Ngày:** 16/10/2025  
**Ưu tiên:** Minor Fixes (không ảnh hưởng chức năng chính)

---

## 🎯 CẢI TIẾN KHUYẾN NGHỊ

### 1. ⚠️ Fix Hardcoded API URL

**File:** `client/src/pages/ChuDuAn/TaoTinDang.jsx`  
**Line:** 292, 401 (và các chỗ khác dùng axios)

**Hiện tại:**
```javascript
const response = await axios.get(
  `http://localhost:5000/api/chu-du-an/du-an/${duAnId}/phong`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

**Đề xuất sửa:**
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const response = await axios.get(
  `${API_BASE_URL}/api/chu-du-an/du-an/${duAnId}/phong`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

**File cần tạo:** `client/.env`
```env
VITE_API_BASE_URL=http://localhost:5000
```

**Ưu điểm:**
- Dễ dàng switch giữa dev/staging/production
- Không cần rebuild khi đổi API URL
- Best practice cho Vite projects

---

### 2. 🎨 Thêm Loading State cho Danh Sách Phòng

**File:** `client/src/pages/ChuDuAn/TaoTinDang.jsx`

**Thêm state:**
```javascript
const [loadingPhong, setLoadingPhong] = useState(false);
```

**Update layDanhSachPhongDuAn:**
```javascript
const layDanhSachPhongDuAn = async (duAnId) => {
  try {
    setLoadingPhong(true); // ← Thêm
    const token = localStorage.getItem('token') || 'mock-token-for-development';
    const response = await axios.get(...);
    setDanhSachPhongDuAn(payload.data);
  } catch (error) {
    console.error('Lỗi khi tải danh sách phòng:', error);
    setDanhSachPhongDuAn([]);
  } finally {
    setLoadingPhong(false); // ← Thêm
  }
};
```

**Pass vào SectionChonPhong:**
```jsx
<SectionChonPhong
  loading={loadingPhong}
  danhSachPhongDuAn={danhSachPhongDuAn}
  ...
/>
```

**Update SectionChonPhong.jsx:**
```jsx
const SectionChonPhong = ({ loading, danhSachPhongDuAn, ... }) => {
  if (loading) {
    return (
      <div className="section-chon-phong">
        <div className="loading-skeleton">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-phong-item" />
          ))}
        </div>
      </div>
    );
  }
  // ... rest of component
}
```

**CSS cho skeleton:**
```css
/* SectionChonPhong.css */
.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-phong-item {
  height: 80px;
  border-radius: 12px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

### 3. 🔔 Replace alert() với Toast Notifications

**Cài đặt library:**
```bash
cd client
npm install react-hot-toast
```

**Update TaoTinDang.jsx:**
```javascript
import toast, { Toaster } from 'react-hot-toast';

// Trong component:
const TaoTinDang = () => {
  // ... existing code
  
  // Replace alert() với toast
  const thucHienGuiTinDang = async (trangThai) => {
    if (!validate()) {
      toast.error('Vui lòng kiểm tra lại thông tin', {
        duration: 3000,
        position: 'top-center'
      });
      return;
    }
    
    try {
      const response = await TinDangService.tao(tinDangData);
      
      if (response.success) {
        toast.success(
          trangThai === 'Nhap' ? 'Đã lưu nháp tin đăng!' : 'Đã gửi tin đăng chờ duyệt!',
          { duration: 4000 }
        );
        navigate('/chu-du-an/tin-dang');
      } else {
        toast.error(`Lỗi: ${response.message}`);
      }
    } catch (err) {
      toast.error(`Lỗi: ${err.message}`);
    }
  };
  
  return (
    <ChuDuAnLayout>
      <Toaster /> {/* Thêm Toaster component */}
      {/* ... rest of JSX */}
    </ChuDuAnLayout>
  );
};
```

---

### 4. 📝 Thêm Placeholder Text Hướng Dẫn

**File:** `client/src/components/ChuDuAn/SectionChonPhong.jsx`

**Update override input placeholders:**
```jsx
<input
  type="text"
  className="override-input"
  placeholder={`Để trống để dùng giá chuẩn: ${phong.GiaChuan?.toLocaleString() || '0'}đ`}
  value={phongData?.GiaTinDang ? formatGiaTien(phongData.GiaTinDang) : ''}
  onChange={(e) => onOverrideGia(phong.PhongID, e.target.value)}
/>
```

**Thêm tooltip cho mô tả override:**
```jsx
<label className="override-label">
  Mô tả riêng cho tin đăng này
  <span className="tooltip-icon" title="VD: 'Ưu đãi sinh viên giảm 200k tháng đầu'">
    ℹ️
  </span>
</label>
```

---

### 5. 🎯 Validation Feedback Tốt Hơn

**File:** `client/src/pages/ChuDuAn/TaoTinDang.jsx`

**Update validation logic:**
```javascript
const validate = () => {
  const newErrors = {};
  
  if (!formData.DuAnID) {
    newErrors.DuAnID = '⚠️ Vui lòng chọn dự án trước';
  }
  
  if (!formData.TieuDe) {
    newErrors.TieuDe = '⚠️ Tiêu đề không được để trống';
  } else if (formData.TieuDe.length < 10) {
    newErrors.TieuDe = '⚠️ Tiêu đề phải có ít nhất 10 ký tự';
  }
  
  if (phongDaChon.length === 0) {
    newErrors.PhongIDs = '⚠️ Vui lòng chọn ít nhất một phòng cho tin đăng. Click "Tạo phòng mới" nếu dự án chưa có phòng.';
  }
  
  if (anhPreview.length === 0) {
    newErrors.URL = '⚠️ Vui lòng tải lên ít nhất 1 hình ảnh đại diện cho tin đăng';
  }
  
  setErrors(newErrors);
  
  // Scroll to first error
  if (Object.keys(newErrors).length > 0) {
    const firstErrorField = Object.keys(newErrors)[0];
    const element = document.querySelector(`[name="${firstErrorField}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  
  return Object.keys(newErrors).length === 0;
};
```

---

### 6. 🖼️ Preview Modal cho Ảnh Phòng

**File:** `client/src/components/ChuDuAn/SectionChonPhong.jsx`

**Thêm state:**
```javascript
const [previewImage, setPreviewImage] = useState(null);
```

**Update render ảnh:**
```jsx
<div className="phong-anh-preview">
  {imgSrc ? (
    <>
      <img 
        src={imgSrc} 
        alt="Ảnh phòng" 
        onClick={() => setPreviewImage(imgSrc)}
        style={{ cursor: 'pointer' }}
        title="Click để xem phóng to"
      />
      {previewImage && (
        <div className="image-preview-modal" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" />
          <button className="close-preview">✕</button>
        </div>
      )}
    </>
  ) : (
    <div className="phong-anh-placeholder">Chưa có ảnh phòng</div>
  )}
</div>
```

**CSS:**
```css
.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  cursor: pointer;
}

.image-preview-modal img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}

.close-preview {
  position: absolute;
  top: 20px;
  right: 20px;
  background: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
```

---

### 7. 🔄 Bulk Actions

**File:** `client/src/components/ChuDuAn/SectionChonPhong.jsx`

**Thêm buttons:**
```jsx
<div className="phong-bulk-actions" style={{ marginBottom: '12px' }}>
  <button 
    type="button"
    className="btn-bulk-action"
    onClick={() => {
      const allPhongIds = danhSachPhongDuAn
        .filter(p => p.TrangThai !== 'DaThue')
        .map(p => p.PhongID);
      allPhongIds.forEach(id => {
        const phong = danhSachPhongDuAn.find(p => p.PhongID === id);
        if (!phongDaChon.some(p => p.PhongID === id)) {
          onChonPhong(phong, true);
        }
      });
    }}
  >
    ✓ Chọn tất cả
  </button>
  
  <button 
    type="button"
    className="btn-bulk-action"
    onClick={() => {
      phongDaChon.forEach(p => {
        onChonPhong({ PhongID: p.PhongID }, false);
      });
    }}
  >
    ✕ Bỏ chọn tất cả
  </button>
</div>
```

---

### 8. 📊 Thống Kê Phòng Đã Chọn

**File:** `client/src/components/ChuDuAn/SectionChonPhong.jsx`

**Thêm summary bar:**
```jsx
{phongDaChon.length > 0 && (
  <div className="phong-selection-summary">
    <div className="summary-stats">
      <span className="stat-item">
        <strong>{phongDaChon.length}</strong> phòng đã chọn
      </span>
      <span className="stat-item">
        Tổng giá: <strong>
          {phongDaChon.reduce((sum, p) => {
            const gia = p.GiaTinDang || danhSachPhongDuAn.find(dp => dp.PhongID === p.PhongID)?.GiaChuan || 0;
            return sum + parseFloat(gia);
          }, 0).toLocaleString()}đ
        </strong>
      </span>
    </div>
  </div>
)}
```

---

## 📝 ƯU TIÊN THỰC HIỆN

### Độ ưu tiên CAO (làm ngay):
1. ✅ Fix Hardcoded API URL (quan trọng cho deployment)
2. ✅ Replace alert() với Toast (UX improvement)
3. ✅ Thêm Loading State (tránh confusion)

### Độ ưu tiên TRUNG BÌNH (có thể làm sau):
4. Validation Feedback Tốt Hơn
5. Placeholder Text Hướng Dẫn
6. Thống Kê Phòng Đã Chọn

### Độ ưu tiên THẤP (nice-to-have):
7. Preview Modal cho Ảnh Phòng
8. Bulk Actions

---

## 🚀 HƯỚNG DẪN THỰC HIỆN

### Bước 1: Fix Hardcoded URL
```bash
# Tạo file .env
cd client
echo "VITE_API_BASE_URL=http://localhost:5000" > .env

# Tạo .env.example
echo "VITE_API_BASE_URL=http://localhost:5000" > .env.example

# Đảm bảo .env trong .gitignore
echo ".env" >> .gitignore
```

### Bước 2: Install Toast Library
```bash
cd client
npm install react-hot-toast
```

### Bước 3: Áp dụng các thay đổi từng file một
- Tránh thay đổi quá nhiều file cùng lúc
- Test sau mỗi thay đổi
- Commit từng improvement riêng biệt

---

**Status:** Đề xuất cải tiến (chưa triển khai)  
**Next Action:** Review và quyết định improvements nào cần làm ngay
