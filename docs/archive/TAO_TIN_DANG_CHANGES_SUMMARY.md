# 📝 SUMMARY - THAY ĐỔI TAOTINDANG.JSX

## Ngày: 09/10/2025

---

## ✅ ĐÃ HOÀN THÀNH

### Backend
- ✅ PhongModel - CRUD phòng master
- ✅ ChuDuAnModel - Cập nhật logic phòng
- ✅ PhongController - API endpoints
- ✅ Routes - Mount vào /api/chu-du-an

### Frontend
- ✅ Xóa QuanLyPhong.jsx (không cần trang riêng)
- ✅ Document flow mới

---

## 🔧 CẦN LÀM TIẾP

### 1. Update TaoTinDang.jsx

**File:** `client/src/pages/ChuDuAn/TaoTinDang.jsx`

#### A. Thêm State Mới (sau line 142)
```javascript
// State cho chọn phòng từ dự án
const [danhSachPhongDuAn, setDanhSachPhongDuAn] = useState([]);
const [phongDaChon, setPhongDaChon] = useState([]); 
// Format: [{ PhongID, GiaTinDang, MoTaTinDang, DienTichTinDang }]
const [modalTaoPhongMoi, setModalTaoPhongMoi] = useState(false);
const [formPhongMoi, setFormPhongMoi] = useState({
  TenPhong: '',
  GiaChuan: '',
  DienTichChuan: '',
  MoTaPhong: ''
});
```

#### B. Thêm useEffect Load Phòng (sau line 189)
```javascript
// Load danh sách phòng khi chọn dự án
useEffect(() => {
  if (formData.DuAnID) {
    layDanhSachPhongDuAn(formData.DuAnID);
  } else {
    setDanhSachPhongDuAn([]);
    setPhongDaChon([]);
  }
}, [formData.DuAnID]);
```

#### C. Thêm Functions (sau line 300)
```javascript
/**
 * Load danh sách phòng của dự án
 */
const layDanhSachPhongDuAn = async (duAnID) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `/api/chu-du-an/du-an/${duAnID}/phong`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    setDanhSachPhongDuAn(response.data.data || []);
  } catch (error) {
    console.error('Lỗi khi load phòng:', error);
    alert('Không thể tải danh sách phòng');
  }
};

/**
 * Xử lý chọn/bỏ chọn phòng
 */
const xuLyChonPhong = (phong, isChecked) => {
  if (isChecked) {
    setPhongDaChon([
      ...phongDaChon,
      {
        PhongID: phong.PhongID,
        TenPhong: phong.TenPhong, // Để hiển thị
        GiaTinDang: null,
        DienTichTinDang: null,
        MoTaTinDang: ''
      }
    ]);
  } else {
    setPhongDaChon(phongDaChon.filter(p => p.PhongID !== phong.PhongID));
  }
};

/**
 * Cập nhật override giá cho phòng đã chọn
 */
const xuLyOverrideGiaPhong = (phongID, giaMoi) => {
  setPhongDaChon(phongDaChon.map(p =>
    p.PhongID === phongID
      ? { ...p, GiaTinDang: giaMoi ? parseGiaTien(giaMoi) : null }
      : p
  ));
};

/**
 * Cập nhật override diện tích
 */
const xuLyOverrideDienTichPhong = (phongID, dienTichMoi) => {
  setPhongDaChon(phongDaChon.map(p =>
    p.PhongID === phongID
      ? { ...p, DienTichTinDang: dienTichMoi || null }
      : p
  ));
};

/**
 * Cập nhật override mô tả
 */
const xuLyOverrideMoTaPhong = (phongID, moTaMoi) => {
  setPhongDaChon(phongDaChon.map(p =>
    p.PhongID === phongID
      ? { ...p, MoTaTinDang: moTaMoi }
      : p
  ));
};

/**
 * Tạo phòng mới cho dự án
 */
const xuLyTaoPhongMoi = async (e) => {
  e.preventDefault();
  
  if (!formPhongMoi.TenPhong.trim()) {
    alert('Vui lòng nhập tên phòng');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `/api/chu-du-an/du-an/${formData.DuAnID}/phong`,
      {
        TenPhong: formPhongMoi.TenPhong,
        GiaChuan: formPhongMoi.GiaChuan ? parseGiaTien(formPhongMoi.GiaChuan) : null,
        DienTichChuan: formPhongMoi.DienTichChuan || null,
        MoTaPhong: formPhongMoi.MoTaPhong || null
      },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    const phongMoiID = response.data.data.PhongID;
    
    // Reload danh sách phòng
    await layDanhSachPhongDuAn(formData.DuAnID);
    
    // Tự động chọn phòng mới tạo
    setPhongDaChon([
      ...phongDaChon,
      {
        PhongID: phongMoiID,
        TenPhong: formPhongMoi.TenPhong,
        GiaTinDang: null,
        DienTichTinDang: null,
        MoTaTinDang: ''
      }
    ]);
    
    // Reset form
    setFormPhongMoi({
      TenPhong: '',
      GiaChuan: '',
      DienTichChuan: '',
      MoTaPhong: ''
    });
    setModalTaoPhongMoi(false);
    
    alert('Tạo phòng thành công!');
  } catch (error) {
    console.error('Lỗi khi tạo phòng:', error);
    alert(error.response?.data?.message || 'Không thể tạo phòng');
  }
};
```

#### D. Update xuLyGuiForm (tìm function này)
```javascript
// Trong hàm xuLyGuiForm, thay đổi payload:

const dataToSubmit = {
  ...formData,
  Gia: formData.Gia ? parseGiaTien(formData.Gia) : null,
  DienTich: formData.DienTich || null,
  GiaDien: formData.GiaDien ? parseGiaTien(formData.GiaDien) : null,
  GiaNuoc: formData.GiaNuoc ? parseGiaTien(formData.GiaNuoc) : null,
  GiaDichVu: formData.GiaDichVu ? parseGiaTien(formData.GiaDichVu) : null,
  URL: anhPreview,
  TienIch: formData.TienIch,
  
  // MỚI: Gửi PhongIDs thay vì Phongs
  PhongIDs: phongDaChon.map(p => ({
    PhongID: p.PhongID,
    GiaTinDang: p.GiaTinDang || null,
    DienTichTinDang: p.DienTichTinDang || null,
    MoTaTinDang: p.MoTaTinDang || null,
    ThuTuHienThi: 0
  }))
};

// Xóa dòng này nếu có:
// Phongs: phongs.map(...)
```

#### E. Thêm JSX Section Chọn Phòng (sau section Tiện ích)
Tìm section `<!-- SECTION: TIỆN ÍCH -->` và thêm sau đó:

```jsx
{/* SECTION: CHỌN PHÒNG */}
{formData.DuAnID && (
  <div className="form-section">
    <div 
      className="section-header"
      onClick={() => toggleSection('chonPhong')}
    >
      <h3>
        <HiOutlineHome className="section-icon" />
        Chọn phòng cho tin đăng
      </h3>
      <button type="button" className="toggle-btn">
        {sectionsExpanded.chonPhong ? '−' : '+'}
      </button>
    </div>

    {sectionsExpanded.chonPhong && (
      <div className="section-body">
        {danhSachPhongDuAn.length === 0 ? (
          <div className="empty-phong">
            <p>Dự án chưa có phòng nào</p>
            <button 
              type="button"
              className="btn-primary"
              onClick={() => setModalTaoPhongMoi(true)}
            >
              <HiOutlinePlus /> Tạo phòng đầu tiên
            </button>
          </div>
        ) : (
          <>
            <div className="danh-sach-phong">
              {danhSachPhongDuAn.map(phong => {
                const isChon = phongDaChon.some(p => p.PhongID === phong.PhongID);
                const phongData = phongDaChon.find(p => p.PhongID === phong.PhongID);
                
                return (
                  <div key={phong.PhongID} className="phong-item">
                    <label className="phong-checkbox">
                      <input
                        type="checkbox"
                        checked={isChon}
                        onChange={(e) => xuLyChonPhong(phong, e.target.checked)}
                      />
                      <div className="phong-info">
                        <span className="phong-ten">{phong.TenPhong}</span>
                        <span className="phong-gia">
                          {phong.GiaChuan ? `${parseFloat(phong.GiaChuan).toLocaleString()}đ` : 'Chưa có giá'}
                        </span>
                        <span className="phong-dientich">
                          {phong.DienTichChuan ? `${phong.DienTichChuan}m²` : 'Chưa có DT'}
                        </span>
                        <span className={`phong-trangthai ${phong.TrangThai.toLowerCase()}`}>
                          {phong.TrangThai}
                        </span>
                      </div>
                    </label>

                    {isChon && (
                      <div className="phong-override">
                        <div className="form-group">
                          <label>Override giá (để trống = dùng giá chuẩn)</label>
                          <input
                            type="text"
                            placeholder={`Giá chuẩn: ${phong.GiaChuan?.toLocaleString() || '0'}đ`}
                            value={phongData?.GiaTinDang ? formatGiaTien(phongData.GiaTinDang) : ''}
                            onChange={(e) => xuLyOverrideGiaPhong(phong.PhongID, e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Override diện tích</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder={`Diện tích chuẩn: ${phong.DienTichChuan || '0'}m²`}
                            value={phongData?.DienTichTinDang || ''}
                            onChange={(e) => xuLyOverrideDienTichPhong(phong.PhongID, e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Mô tả riêng cho tin đăng này</label>
                          <input
                            type="text"
                            placeholder="VD: Ưu đãi sinh viên, Giảm 200k..."
                            value={phongData?.MoTaTinDang || ''}
                            onChange={(e) => xuLyOverrideMoTaPhong(phong.PhongID, e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setModalTaoPhongMoi(true)}
            >
              <HiOutlinePlus /> Tạo phòng mới
            </button>
          </>
        )}
      </div>
    )}
  </div>
)}
```

#### F. Thêm Modal Tạo Phòng Mới (trước closing tag của component)
```jsx
{/* Modal Tạo Phòng Mới */}
{modalTaoPhongMoi && (
  <div className="modal-overlay" onClick={() => setModalTaoPhongMoi(false)}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Tạo phòng mới</h2>
        <button onClick={() => setModalTaoPhongMoi(false)}>×</button>
      </div>

      <form onSubmit={xuLyTaoPhongMoi} className="modal-body">
        <div className="form-group">
          <label>Tên phòng <span className="required">*</span></label>
          <input
            type="text"
            value={formPhongMoi.TenPhong}
            onChange={(e) => setFormPhongMoi({...formPhongMoi, TenPhong: e.target.value})}
            placeholder="VD: 104, A01, ..."
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Giá chuẩn (VNĐ/tháng)</label>
            <input
              type="text"
              value={formPhongMoi.GiaChuan}
              onChange={(e) => setFormPhongMoi({...formPhongMoi, GiaChuan: formatGiaTien(e.target.value)})}
              placeholder="3.000.000"
            />
          </div>

          <div className="form-group">
            <label>Diện tích (m²)</label>
            <input
              type="number"
              step="0.01"
              value={formPhongMoi.DienTichChuan}
              onChange={(e) => setFormPhongMoi({...formPhongMoi, DienTichChuan: e.target.value})}
              placeholder="25"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Mô tả phòng</label>
          <textarea
            value={formPhongMoi.MoTaPhong}
            onChange={(e) => setFormPhongMoi({...formPhongMoi, MoTaPhong: e.target.value})}
            placeholder="Tầng, hướng, view, nội thất..."
            rows="3"
          />
        </div>

        <div className="modal-actions">
          <button type="button" onClick={() => setModalTaoPhongMoi(false)}>
            Hủy
          </button>
          <button type="submit" className="btn-primary">
            Tạo và thêm vào tin đăng
          </button>
        </div>
      </form>
    </div>
  </div>
)}
```

---

### 2. Update CSS (TaoTinDang.css hoặc tạo mới)

Thêm styles cho section chọn phòng (có thể tạo file riêng hoặc thêm vào cuối file CSS hiện tại):

```css
/* Danh sách phòng */
.danh-sach-phong {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.phong-item {
  border: 2px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s;
}

.phong-item:has(input:checked) {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.05);
}

.phong-checkbox {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.phong-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.phong-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.phong-ten {
  font-weight: 700;
  font-size: 16px;
  color: #111827;
}

.phong-gia {
  color: #8b5cf6;
  font-weight: 600;
}

.phong-dientich {
  color: #6b7280;
}

.phong-trangthai {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.phong-trangthai.trong {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.phong-override {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(139, 92, 246, 0.2);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.empty-phong {
  text-align: center;
  padding: 40px;
  background: rgba(139, 92, 246, 0.05);
  border-radius: 12px;
}
```

---

## 📋 CHECKLIST

- [ ] Thêm states mới
- [ ] Thêm useEffect load phòng
- [ ] Thêm các functions xử lý
- [ ] Update xuLyGuiForm
- [ ] Thêm JSX section chọn phòng
- [ ] Thêm modal tạo phòng
- [ ] Thêm CSS
- [ ] Test flow: Chọn dự án → Load phòng → Check/uncheck → Override → Submit
- [ ] Test tạo phòng mới
- [ ] Kiểm tra responsive

---

**Estimate:** ~2-3 giờ implementation + testing
**Priority:** HIGH (blocking cho tính năng tạo tin đăng)

