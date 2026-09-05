# 🎯 FLOW TẠO TIN ĐĂNG MỚI - REDESIGN

## Ngày: 09/10/2025

---

## 📋 FLOW MỚI

### Bước 1: Chọn Dự án
```
┌─────────────────────────────────────┐
│ Chọn dự án: [Dropdown]              │
│  → Nhà trọ Minh Tâm ▼               │
│  → Nhà trọ ABC                       │
│  → ... (+) Tạo dự án mới            │
└─────────────────────────────────────┘
        │
        ▼ (API call khi chọn)
   Load phòng của dự án
```

### Bước 2: Chọn Phòng
```
┌──────────────────────────────────────────────┐
│ Danh sách phòng có sẵn:                      │
│                                               │
│ ☑️ Phòng 101 - 3.000.000đ - 25m²             │
│    Override giá: [2.800.000] đ (Optional)    │
│    Mô tả riêng: [Ưu đãi SV] (Optional)       │
│                                               │
│ ☐ Phòng 102 - 3.500.000đ - 30m²             │
│                                               │
│ ☑️ Phòng 103 - 4.000.000đ - 35m²             │
│    Override giá: [] đ (Dùng giá chuẩn)       │
│                                               │
│ [+ Tạo phòng mới]                            │
└──────────────────────────────────────────────┘
```

### Bước 3: Modal Tạo Phòng Mới (Nếu cần)
```
┌─────────────────────────────────────────┐
│ ✨ Tạo phòng mới cho dự án              │
├─────────────────────────────────────────┤
│ Tên phòng: [104]                        │
│ Giá chuẩn: [3.200.000] đ                │
│ Diện tích: [28] m²                       │
│ Mô tả: [...]                             │
│                                          │
│ [Hủy]  [Tạo và thêm vào tin đăng]      │
└─────────────────────────────────────────┘
        │
        ▼
  Phòng mới được tạo + tự động checked
```

### Bước 4: Submit Tin Đăng
```javascript
POST /api/chu-du-an/tin-dang
{
  "DuAnID": 14,
  "TieuDe": "...",
  "MoTa": "...",
  "URL": [...],
  "PhongIDs": [
    {
      "PhongID": 1,
      "GiaTinDang": 2800000,  // Override
      "MoTaTinDang": "Ưu đãi SV"
    },
    {
      "PhongID": 3,
      "GiaTinDang": null  // Dùng giá chuẩn
    }
  ]
}
```

---

## 💻 IMPLEMENTATION

### State mới cần thêm
```javascript
const [danhSachPhongDuAn, setDanhSachPhongDuAn] = useState([]);
const [phongDaChon, setPhongDaChon] = useState([]);
// { PhongID, GiaTinDang (override), MoTaTinDang (override) }

const [modalTaoPhong, setModalTaoPhong] = useState(false);
```

### API cần gọi
```javascript
// 1. Load phòng khi chọn dự án
useEffect(() => {
  if (formData.DuAnID) {
    layDanhSachPhongDuAn(formData.DuAnID);
  }
}, [formData.DuAnID]);

const layDanhSachPhongDuAn = async (duAnID) => {
  const response = await axios.get(
    `/api/chu-du-an/du-an/${duAnID}/phong`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  setDanhSachPhongDuAn(response.data.data);
};

// 2. Tạo phòng mới
const taoPhongMoi = async (phongData) => {
  const response = await axios.post(
    `/api/chu-du-an/du-an/${formData.DuAnID}/phong`,
    phongData,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  // Reload danh sách + auto check phòng mới
  layDanhSachPhongDuAn(formData.DuAnID);
  setPhongDaChon([...phongDaChon, { PhongID: response.data.data.PhongID }]);
};
```

### UI Component - Phòng Section
```jsx
<div className="section-phong">
  <h3>Chọn phòng cho tin đăng</h3>
  
  {danhSachPhongDuAn.map(phong => (
    <div key={phong.PhongID} className="phong-item">
      <label>
        <input
          type="checkbox"
          checked={phongDaChon.some(p => p.PhongID === phong.PhongID)}
          onChange={(e) => xuLyChonPhong(phong, e.target.checked)}
        />
        <span className="phong-info">
          {phong.TenPhong} - {phong.GiaChuan.toLocaleString()}đ - {phong.DienTichChuan}m²
        </span>
      </label>
      
      {phongDaChon.some(p => p.PhongID === phong.PhongID) && (
        <div className="phong-override">
          <input
            type="number"
            placeholder={`Giá override (mặc định: ${phong.GiaChuan})`}
            value={phongDaChon.find(p => p.PhongID === phong.PhongID).GiaTinDang || ''}
            onChange={(e) => xuLyOverrideGia(phong.PhongID, e.target.value)}
          />
          <input
            type="text"
            placeholder="Mô tả riêng (VD: Ưu đãi SV)"
            value={phongDaChon.find(p => p.PhongID === phong.PhongID).MoTaTinDang || ''}
            onChange={(e) => xuLyOverrideMoTa(phong.PhongID, e.target.value)}
          />
        </div>
      )}
    </div>
  ))}
  
  <button onClick={() => setModalTaoPhong(true)}>
    + Tạo phòng mới
  </button>
</div>
```

---

## 🔄 LOGIC XỬ LÝ

### Chọn/Bỏ chọn phòng
```javascript
const xuLyChonPhong = (phong, isChecked) => {
  if (isChecked) {
    setPhongDaChon([
      ...phongDaChon,
      {
        PhongID: phong.PhongID,
        GiaTinDang: null,  // null = dùng giá chuẩn
        MoTaTinDang: ''
      }
    ]);
  } else {
    setPhongDaChon(phongDaChon.filter(p => p.PhongID !== phong.PhongID));
  }
};
```

### Override giá
```javascript
const xuLyOverrideGia = (phongID, giaMoi) => {
  setPhongDaChon(phongDaChon.map(p => 
    p.PhongID === phongID 
      ? { ...p, GiaTinDang: giaMoi ? parseInt(giaMoi) : null }
      : p
  ));
};
```

### Submit
```javascript
const xuLyGuiForm = async (e) => {
  e.preventDefault();
  
  // Validation
  if (phongDaChon.length === 0 && !formData.Gia) {
    alert('Vui lòng chọn phòng hoặc nhập giá phòng đơn');
    return;
  }
  
  const payload = {
    ...formData,
    PhongIDs: phongDaChon.map(p => ({
      PhongID: p.PhongID,
      GiaTinDang: p.GiaTinDang || null,
      MoTaTinDang: p.MoTaTinDang || null
    }))
  };
  
  await TinDangService.taoTinDang(payload);
};
```

---

## 🎨 UX CONSIDERATIONS

1. **Khi chưa chọn dự án:**
   - Không hiển thị section chọn phòng
   - Hiển thị message "Vui lòng chọn dự án trước"

2. **Khi dự án chưa có phòng:**
   - Hiển thị empty state
   - Nút "Tạo phòng đầu tiên" nổi bật

3. **Override giá:**
   - Collapse/expand khi check/uncheck
   - Placeholder hiển thị giá chuẩn

4. **Validation:**
   - Phải chọn ít nhất 1 phòng (nếu không phải phòng đơn)
   - Giá override phải > 0 (nếu nhập)

---

## 📝 NOTES

- **Không xóa** logic cũ của `isNhapNhieu` / `phongs[]` (legacy, dùng cho case phòng đơn nếu cần)
- Section "Chọn phòng" chỉ hiển thị khi đã chọn dự án
- Phòng mới tạo sẽ tự động được chọn (UX tốt hơn)
- Submit sẽ gửi `PhongIDs[]` thay vì `Phongs[]`

