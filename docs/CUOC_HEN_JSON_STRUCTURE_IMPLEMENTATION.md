# Cấu trúc JSON cho Ghi chú Kết quả Cuộc hẹn

## 📋 Tổng quan

Thay vì lưu ghi chú dạng text thuần, hệ thống bây giờ lưu **toàn bộ thông tin** vào cột `GhiChuKetQua` dưới dạng **JSON có cấu trúc**.

### ✅ Lợi ích:
- **Dễ parse và hiển thị**: Frontend có thể render từng field riêng biệt
- **Lịch sử hoạt động đầy đủ**: Track mọi hành động (xác nhận, đổi lịch, báo cáo)
- **Backward compatibility**: Hỗ trợ dữ liệu cũ dạng text
- **Không cần migration**: Không tạo cột mới, dùng lại cột hiện có

---

## 🗂️ Cấu trúc JSON

### Schema:
```json
{
  "activities": [
    {
      "timestamp": "2025-11-19T13:38:08.000Z",
      "action": "xac_nhan",
      "actor": "NVBH",
      "nhanVienId": 8,
      "note": "Đã xác nhận cuộc hẹn"
    },
    {
      "timestamp": "2025-11-19T13:40:00.000Z",
      "action": "doi_lich",
      "actor": "NVBH",
      "nhanVienId": 8,
      "note": "Theo yêu cầu khách hàng",
      "oldTime": "2025-11-20T13:39:00.000Z",
      "newTime": "2025-11-21T01:38:00.000Z"
    },
    {
      "timestamp": "2025-11-19T14:00:00.000Z",
      "action": "bao_cao",
      "actor": "NVBH",
      "nhanVienId": 8,
      "note": "Kết quả: thanh_cong",
      "ketQua": "thanh_cong"
    }
  ],
  "thoiGianBaoCao": "2025-11-19T14:00:00.000Z",
  "ketQua": "thanh_cong",
  "khachQuanTam": true,
  "lyDoThatBai": null,
  "keHoachFollowUp": "Hẹn tháng sau",
  "ghiChu": "Khách hàng rất hài lòng",
  "slaWarning": null
}
```

---

## 🔧 Backend Implementation

### 1. Xác nhận Cuộc hẹn (`xacNhanCuocHen`)

**File:** `server/services/NhanVienBanHangService.js`

```javascript
// Lấy GhiChuKetQua hiện tại
const [current] = await db.execute(
  'SELECT GhiChuKetQua FROM cuochen WHERE CuocHenID = ?',
  [cuocHenId]
);

let ghiChuData = { activities: [] };
if (current[0]?.GhiChuKetQua) {
  try {
    ghiChuData = JSON.parse(current[0].GhiChuKetQua);
    if (!ghiChuData.activities) {
      ghiChuData.activities = [];
    }
  } catch (e) {
    // Nếu data cũ là text, khởi tạo mới
    ghiChuData = { activities: [], oldNote: current[0].GhiChuKetQua };
  }
}

// Thêm activity mới
ghiChuData.activities.push({
  timestamp: new Date().toISOString(),
  action: 'xac_nhan',
  actor: 'NVBH',
  nhanVienId: nhanVienId,
  note: ghiChu || ''
});

// Cập nhật trạng thái
await db.execute(
  `UPDATE cuochen 
   SET TrangThai = 'DaXacNhan', 
       GhiChuKetQua = ?
   WHERE CuocHenID = ?`,
  [JSON.stringify(ghiChuData), cuocHenId]
);
```

### 2. Đổi lịch Cuộc hẹn (`doiLichCuocHen`)

```javascript
// Thêm activity đổi lịch
ghiChuData.activities.push({
  timestamp: new Date().toISOString(),
  action: 'doi_lich',
  actor: 'NVBH',
  nhanVienId: nhanVienId,
  note: lyDo || '',
  oldTime: current[0]?.ThoiGianHen,
  newTime: thoiGianHenMoi
});

// Cập nhật
await db.execute(
  `UPDATE cuochen 
   SET ThoiGianHen = ?, 
       SoLanDoiLich = SoLanDoiLich + 1,
       TrangThai = 'DaDoiLich',
       GhiChuKetQua = ?
   WHERE CuocHenID = ?`,
  [thoiGianHenMoi, JSON.stringify(ghiChuData), cuocHenId]
);
```

### 3. Báo cáo Kết quả (`baoCaoKetQuaCuocHen`)

```javascript
// Thêm báo cáo kết quả vào structure
ghiChuData.thoiGianBaoCao = new Date().toISOString();
ghiChuData.ketQua = ketQua;
ghiChuData.khachQuanTam = khachQuanTam || false;
ghiChuData.lyDoThatBai = lyDoThatBai || null;
ghiChuData.keHoachFollowUp = keHoachFollowUp || null;
ghiChuData.ghiChu = ghiChu || null;
ghiChuData.slaWarning = slaWarning;

// Thêm activity báo cáo
ghiChuData.activities.push({
  timestamp: new Date().toISOString(),
  action: 'bao_cao',
  actor: 'NVBH',
  nhanVienId: nhanVienId,
  note: `Kết quả: ${ketQua}`,
  ketQua: ketQua
});

await db.execute(
  `UPDATE cuochen 
   SET TrangThai = 'HoanThanh',
       GhiChuKetQua = ?
   WHERE CuocHenID = ?`,
  [JSON.stringify(ghiChuData), cuocHenId]
);
```

### 4. Parsing Logic (`layChiTietCuocHen`)

```javascript
// Parse GhiChuKetQua JSON
if (appointment.GhiChuKetQua) {
  try {
    const ghiChuData = JSON.parse(appointment.GhiChuKetQua);
    
    // Nếu có cấu trúc mới với activities
    if (ghiChuData.activities) {
      appointment.ActivityLog = ghiChuData.activities;
    } else {
      appointment.ActivityLog = [];
    }
    
    // Nếu có báo cáo kết quả (format mới với thoiGianBaoCao/ketQua)
    if (ghiChuData.thoiGianBaoCao || ghiChuData.ketQua) {
      appointment.BaoCaoKetQua = ghiChuData;
    } else if (ghiChuData.oldNote) {
      // Backward compatibility: nếu có oldNote (text cũ được migrate)
      appointment.BaoCaoKetQua = {
        ghiChu: ghiChuData.oldNote
      };
    } else {
      appointment.BaoCaoKetQua = null;
    }
  } catch (e) {
    // Nếu không phải JSON (dữ liệu cũ text thuần), giữ nguyên
    appointment.BaoCaoKetQua = {
      ghiChu: appointment.GhiChuKetQua
    };
    appointment.ActivityLog = [];
  }
} else {
  appointment.ActivityLog = [];
  appointment.BaoCaoKetQua = null;
}
```

---

## 🎨 Frontend Implementation

### 1. Activity Timeline Component

**File:** `client/src/components/NhanVienBanHang/ActivityTimeline.jsx`

**Features:**
- Vertical timeline với icons theo action type
- Gradient badges (success/warning/danger/info)
- Hiển thị timestamp, actor, note
- Đặc biệt cho `doi_lich`: hiển thị old time → new time
- Staggered animation (slideInRight)
- Responsive design

**Usage:**
```jsx
{appointment.ActivityLog && appointment.ActivityLog.length > 0 && (
  <div className="nvbh-info-row nvbh-info-row--full">
    <span className="nvbh-info-row__label">Lịch sử hoạt động:</span>
    <ActivityTimeline activities={appointment.ActivityLog} />
  </div>
)}
```

### 2. Báo cáo Kết quả Display

**File:** `client/src/pages/NhanVienBanHang/ChiTietCuocHen.jsx`

**Structure:**
```jsx
<div className="nvbh-bao-cao-ket-qua">
  <div className="nvbh-bao-cao-ket-qua__header">
    <h4>📋 Kết quả cuộc hẹn</h4>
    <span>🕐 {formatDate(...)}</span>
  </div>
  
  <div className="nvbh-bao-cao-item">
    <span className="nvbh-bao-cao-item__label">Kết quả</span>
    <div className="nvbh-bao-cao-item__value">
      <span className="nvbh-bao-cao-badge nvbh-bao-cao-badge--success">
        ✓ Thành công
      </span>
    </div>
  </div>
  
  {/* Conditional fields: lyDoThatBai, keHoachFollowUp, ghiChu */}
  
  {slaWarning && (
    <div className="nvbh-bao-cao-sla-warning">
      ⚠️ {slaWarning}
    </div>
  )}
</div>
```

---

## 📊 Activity Action Types

| Action | Icon | Color | Description |
|--------|------|-------|-------------|
| `xac_nhan` | ✓ CheckCircle | Green | Xác nhận cuộc hẹn |
| `doi_lich` | 📅 Calendar | Orange | Đổi lịch cuộc hẹn |
| `huy` | ✕ XCircle | Red | Hủy cuộc hẹn |
| `bao_cao` | 📝 Document | Blue | Báo cáo kết quả |

---

## 🔄 Backward Compatibility

### Case 1: Dữ liệu cũ (text thuần)
```
GhiChuKetQua = "[2025-11-19 13:38:08] Xác nhận bởi NVBH: Theo yêu cầu"
```

**Xử lý:**
```javascript
try {
  ghiChuData = JSON.parse(GhiChuKetQua); // Fail
} catch (e) {
  // Fallback: Hiển thị text cũ
  BaoCaoKetQua = { ghiChu: GhiChuKetQua };
  ActivityLog = [];
}
```

### Case 2: Dữ liệu mới (JSON)
```json
{
  "activities": [...],
  "thoiGianBaoCao": "...",
  "ketQua": "thanh_cong"
}
```

**Xử lý:** Parse thành công → Hiển thị timeline + báo cáo structured

### Case 3: Dữ liệu migrate (có oldNote)
```json
{
  "activities": [],
  "oldNote": "[2025-11-19 13:38:08] Xác nhận..."
}
```

**Xử lý:** Hiển thị oldNote trong BaoCaoKetQua.ghiChu

---

## 🧪 Testing Scenarios

### 1. Xác nhận cuộc hẹn mới
**Kết quả:**
```json
{
  "activities": [
    {
      "timestamp": "2025-11-19T13:38:08.000Z",
      "action": "xac_nhan",
      "actor": "NVBH",
      "nhanVienId": 8,
      "note": ""
    }
  ]
}
```

### 2. Đổi lịch sau khi xác nhận
**Kết quả:**
```json
{
  "activities": [
    {...}, // xac_nhan
    {
      "timestamp": "2025-11-19T13:40:00.000Z",
      "action": "doi_lich",
      "actor": "NVBH",
      "nhanVienId": 8,
      "note": "Theo yêu cầu",
      "oldTime": "2025-11-20T13:39:00.000Z",
      "newTime": "2025-11-21T01:38:00.000Z"
    }
  ]
}
```

### 3. Báo cáo kết quả
**Kết quả:**
```json
{
  "activities": [
    {...}, // xac_nhan
    {...}, // doi_lich
    {
      "timestamp": "2025-11-19T14:00:00.000Z",
      "action": "bao_cao",
      "actor": "NVBH",
      "nhanVienId": 8,
      "note": "Kết quả: thanh_cong",
      "ketQua": "thanh_cong"
    }
  ],
  "thoiGianBaoCao": "2025-11-19T14:00:00.000Z",
  "ketQua": "thanh_cong",
  "khachQuanTam": true,
  "lyDoThatBai": null,
  "keHoachFollowUp": "Hẹn tháng sau",
  "ghiChu": "Khách hàng hài lòng",
  "slaWarning": null
}
```

---

## 🎯 Key Files Modified

### Backend:
- ✅ `server/services/NhanVienBanHangService.js`
  - `xacNhanCuocHen()` - Append activity
  - `doiLichCuocHen()` - Append activity với oldTime/newTime
  - `baoCaoKetQuaCuocHen()` - Merge báo cáo + activity
  - `layChiTietCuocHen()` - Parse JSON với backward compatibility

### Frontend:
- ✅ `client/src/components/NhanVienBanHang/ActivityTimeline.jsx` - Timeline component
- ✅ `client/src/components/NhanVienBanHang/ActivityTimeline.css` - Styling
- ✅ `client/src/pages/NhanVienBanHang/ChiTietCuocHen.jsx` - Integration
- ✅ `client/src/pages/NhanVienBanHang/ChiTietCuocHen.css` - Báo cáo styles (đã có sẵn)

---

## 📝 Notes

1. **Không cần migration database** - Dùng lại cột `GhiChuKetQua` hiện có
2. **Backward compatible** - Hỗ trợ cả text cũ và JSON mới
3. **Scalable** - Dễ thêm action types mới (phê duyệt, từ chối, etc.)
4. **Clean separation** - `activities` array riêng, `BaoCaoKetQua` fields riêng
5. **Timeline có thể reuse** - Component độc lập, dùng cho modules khác

---

**Date:** 2025-11-19  
**Author:** GitHub Copilot  
**Status:** ✅ Completed
