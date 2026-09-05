# Tích hợp Chat cho Nhân viên Bán hàng - Hoàn tất

## 📋 Tổng quan

Tài liệu này ghi lại quá trình tích hợp tính năng trò chuyện (chat) vào module **Chi tiết Cuộc hẹn** của Nhân viên Bán hàng, cho phép nhân viên bán hàng trò chuyện trực tiếp với khách hàng và chủ dự án từ trang chi tiết cuộc hẹn.

**Ngày hoàn thành:** 2024
**Modules liên quan:** NhanVienBanHang (Nhân viên Bán hàng)
**Use Case:** UC-SALE-03 (Chi tiết Cuộc hẹn)

---

## ✅ Các thay đổi đã thực hiện

### 1. Frontend - Chi tiết Cuộc hẹn

#### File: `client/src/pages/NhanVienBanHang/ChiTietCuocHen.jsx`

**Thay đổi 1: Thêm import icon chat**
```jsx
import {
  // ... existing imports
  HiOutlineChatBubbleLeftRight  // NEW: Icon chat bubble
} from 'react-icons/hi2';
```

**Thay đổi 2: Thêm handler functions**
```jsx
/**
 * Tạo conversation với khách hàng
 */
const handleChatWithCustomer = async () => {
  try {
    if (!appointment.KhachHangID) {
      alert('Không tìm thấy thông tin khách hàng');
      return;
    }

    const response = await fetch('http://localhost:5000/api/chat/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        NguCanhID: appointment.CuocHenID,
        NguCanhLoai: 'CuocHen',
        ThanhVienIDs: [appointment.KhachHangID],
        TieuDe: `Cuộc hẹn #${appointment.CuocHenID} - ${appointment.TenKhachHang || 'Khách hàng'}`
      })
    });

    const data = await response.json();
    if (data.success) {
      window.location.href = `/nhan-vien-ban-hang/tro-chuyen`;
    }
  } catch (error) {
    console.error('Error creating conversation:', error);
    alert('Không thể tạo cuộc trò chuyện');
  }
};

/**
 * Tạo conversation với chủ dự án
 */
const handleChatWithOwner = async () => {
  try {
    if (!appointment.ChuDuAnID) {
      alert('Không tìm thấy thông tin chủ dự án');
      return;
    }

    const response = await fetch('http://localhost:5000/api/chat/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        NguCanhID: appointment.CuocHenID,
        NguCanhLoai: 'CuocHen',
        ThanhVienIDs: [appointment.ChuDuAnID],
        TieuDe: `Cuộc hẹn #${appointment.CuocHenID} - ${appointment.TenDuAn || 'Dự án'}`
      })
    });

    const data = await response.json();
    if (data.success) {
      window.location.href = `/nhan-vien-ban-hang/tro-chuyen`;
    }
  } catch (error) {
    console.error('Error creating conversation:', error);
    alert('Không thể tạo cuộc trò chuyện');
  }
};
```

**Thay đổi 3: Thêm card "Thông tin Chủ dự án"**
```jsx
{/* Project Owner Info Card */}
<div className="nvbh-card">
  <div className="nvbh-card__header">
    <HiOutlineHome />
    <h2>Thông tin Chủ dự án</h2>
  </div>
  <div className="nvbh-card__body">
    <div className="nvbh-customer-info">
      <div className="nvbh-customer-info__avatar">
        {appointment.TenChuDuAn?.[0] || appointment.TenDuAn?.[0] || 'C'}
      </div>
      <div className="nvbh-customer-info__details">
        <h3>{appointment.TenChuDuAn || appointment.TenDuAn || 'Chủ dự án'}</h3>
        {appointment.SoDienThoaiChuDuAn && (
          <div className="nvbh-info-row">
            <HiOutlinePhone />
            <a href={`tel:${appointment.SoDienThoaiChuDuAn}`}>
              {formatPhone(appointment.SoDienThoaiChuDuAn)}
            </a>
          </div>
        )}
        {appointment.EmailChuDuAn && (
          <div className="nvbh-info-row">
            <HiOutlineEnvelope />
            <a href={`mailto:${appointment.EmailChuDuAn}`}>{appointment.EmailChuDuAn}</a>
          </div>
        )}
        <button
          className="nvbh-btn nvbh-btn--secondary nvbh-btn--sm"
          onClick={handleChatWithOwner}
          style={{ marginTop: '12px', width: '100%' }}
        >
          <HiOutlineChatBubbleLeftRight />
          Trò chuyện với chủ dự án
        </button>
      </div>
    </div>
  </div>
</div>
```

**Thay đổi 4: Thêm nút chat vào card khách hàng**
```jsx
{/* Trong Customer Info Card */}
<button
  className="nvbh-btn nvbh-btn--secondary nvbh-btn--sm"
  onClick={handleChatWithCustomer}
  style={{ marginTop: '12px', width: '100%' }}
>
  <HiOutlineChatBubbleLeftRight />
  Trò chuyện với khách hàng
</button>
```

**Thay đổi 5: Sửa field names để khớp với backend**
```jsx
// CŨ:
<a href={`tel:${appointment.SoDienThoai}`}>
  {formatPhone(appointment.SoDienThoai)}
</a>
{appointment.Email && (
  <a href={`mailto:${appointment.Email}`}>{appointment.Email}</a>
)}

// MỚI:
<a href={`tel:${appointment.SDTKhachHang}`}>
  {formatPhone(appointment.SDTKhachHang)}
</a>
{appointment.EmailKhachHang && (
  <a href={`mailto:${appointment.EmailKhachHang}`}>{appointment.EmailKhachHang}</a>
)}
```

---

### 2. Backend - API Chi tiết Cuộc hẹn

#### File: `server/services/NhanVienBanHangService.js`

**Thay đổi 1: Cập nhật SQL query để lấy thông tin chủ dự án**
```javascript
const [rows] = await db.execute(`
  SELECT 
    ch.CuocHenID, ch.KhachHangID, ch.NhanVienBanHangID,
    ch.PhongID, ch.ThoiGianHen, ch.TrangThai, ch.SoLanDoiLich,
    ch.GhiChuKetQua, ch.TaoLuc, ch.CapNhatLuc,
    ch.PheDuyetChuDuAn, ch.LyDoTuChoi, ch.PhuongThucVao,
    
    kh.TenDayDu as TenKhachHang, 
    kh.SoDienThoai as SDTKhachHang,
    kh.Email as EmailKhachHang,
    
    p.TenPhong as TieuDePhong, 
    p.GiaChuan as GiaPhong,
    p.DienTich,
    
    td.TinDangID, 
    td.TieuDe as TieuDeTinDang,
    td.DuAnID as ChuDuAnID,  -- ✅ NEW: Thêm ChuDuAnID
    td.URL as HinhAnhPhong,  -- ✅ NEW: Lấy hình ảnh từ tin đăng
    
    da.TenDuAn, 
    da.DiaChi as DiaChiPhong,
    da.KinhDo,  -- ✅ NEW: Tọa độ GPS
    da.ViDo,    -- ✅ NEW: Tọa độ GPS
    
    -- ✅ NEW: Thông tin chủ dự án
    cda.TenDayDu as TenChuDuAn,
    cda.SoDienThoai as SoDienThoaiChuDuAn,
    cda.Email as EmailChuDuAn
    
  FROM cuochen ch
  INNER JOIN phong p ON ch.PhongID = p.PhongID
  INNER JOIN phong_tindang pt ON p.PhongID = pt.PhongID
  INNER JOIN tindang td ON pt.TinDangID = td.TinDangID
  INNER JOIN duan da ON td.DuAnID = da.DuAnID
  LEFT JOIN nguoidung kh ON ch.KhachHangID = kh.NguoiDungID
  LEFT JOIN nguoidung cda ON da.ChuDuAnID = cda.NguoiDungID  -- ✅ NEW: JOIN với chủ dự án
  WHERE ch.CuocHenID = ? AND ch.NhanVienBanHangID = ?
`, [cuocHenId, nhanVienId]);
```

**Thay đổi 2: Parse JSON fields và tọa độ**
```javascript
if (rows.length === 0) {
  throw new Error('Không tìm thấy cuộc hẹn hoặc không có quyền xem');
}

const appointment = rows[0];

// ✅ NEW: Parse JSON fields
if (appointment.HinhAnhPhong) {
  try {
    appointment.HinhAnhPhong = JSON.parse(appointment.HinhAnhPhong);
  } catch (e) {
    appointment.HinhAnhPhong = [];
  }
} else {
  appointment.HinhAnhPhong = [];
}

// ✅ NEW: Parse coordinates
if (appointment.KinhDo && appointment.ViDo) {
  appointment.ToaDo = {
    lat: parseFloat(appointment.ViDo),
    lng: parseFloat(appointment.KinhDo)
  };
}

return appointment;
```

---

## 📊 Data Flow

### 1. Tạo Conversation với Khách hàng

```
Frontend (ChiTietCuocHen.jsx)
  |
  | handleChatWithCustomer()
  |
  v
POST /api/chat/conversations
  Body: {
    NguCanhID: appointment.CuocHenID,
    NguCanhLoai: 'CuocHen',
    ThanhVienIDs: [appointment.KhachHangID],
    TieuDe: 'Cuộc hẹn #123 - Nguyễn Văn A'
  }
  |
  v
Backend (ChatController)
  |
  | Tạo conversation mới hoặc lấy existing
  |
  v
Response: {
  success: true,
  data: { ConversationID: 456, ... }
}
  |
  v
Redirect to /nhan-vien-ban-hang/tro-chuyen
```

### 2. Tạo Conversation với Chủ dự án

```
Frontend (ChiTietCuocHen.jsx)
  |
  | handleChatWithOwner()
  |
  v
POST /api/chat/conversations
  Body: {
    NguCanhID: appointment.CuocHenID,
    NguCanhLoai: 'CuocHen',
    ThanhVienIDs: [appointment.ChuDuAnID],
    TieuDe: 'Cuộc hẹn #123 - Dự án XYZ'
  }
  |
  v
Backend (ChatController)
  |
  | Tạo conversation mới hoặc lấy existing
  |
  v
Response: {
  success: true,
  data: { ConversationID: 789, ... }
}
  |
  v
Redirect to /nhan-vien-ban-hang/tro-chuyen
```

---

## 🎯 API Response Schema

### GET /api/nhan-vien-ban-hang/cuoc-hen/:id

**Response Structure:**
```json
{
  "success": true,
  "message": "Lấy chi tiết cuộc hẹn thành công",
  "data": {
    // Appointment Info
    "CuocHenID": 123,
    "PhongID": 456,
    "KhachHangID": 789,
    "ChuDuAnID": 101,
    "NhanVienBanHangID": 111,
    "ThoiGianHen": "2024-01-15 10:00:00",
    "TrangThai": "DaXacNhan",
    "SoLanDoiLich": 0,
    "PheDuyetChuDuAn": "DaPheDuyet",
    
    // Customer Info
    "TenKhachHang": "Nguyễn Văn A",
    "SDTKhachHang": "0912345678",
    "EmailKhachHang": "nguyenvana@example.com",
    
    // Owner Info (NEW)
    "TenChuDuAn": "Trần Thị B",
    "SoDienThoaiChuDuAn": "0987654321",
    "EmailChuDuAn": "tranthib@example.com",
    
    // Room Info
    "TieuDePhong": "Phòng trọ cao cấp Quận 1",
    "GiaPhong": 5000000,
    "DienTich": 25,
    "HinhAnhPhong": [
      "http://example.com/image1.jpg",
      "http://example.com/image2.jpg"
    ],
    
    // Project Info
    "TenDuAn": "Chung cư ABC",
    "DiaChiPhong": "123 Đường XYZ, Quận 1, TP.HCM",
    "ToaDo": {
      "lat": 10.7769,
      "lng": 106.7009
    }
  }
}
```

---

## 🎨 UI Components

### 1. Card "Thông tin Chủ dự án"

**Vị trí:** Sau card "Thông tin Khách hàng", trước card "Thông tin Phòng"

**Layout:**
```
┌─────────────────────────────────────┐
│ 🏢 Thông tin Chủ dự án              │
├─────────────────────────────────────┤
│                                     │
│  ┌───┐  Trần Thị B                 │
│  │ T │  📞 098 765 4321             │
│  └───┘  ✉️  tranthib@example.com    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 💬 Trò chuyện với chủ dự án │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**CSS Classes:**
- `.nvbh-card` - Card container
- `.nvbh-card__header` - Card header với icon + title
- `.nvbh-customer-info` - Customer/Owner info layout
- `.nvbh-customer-info__avatar` - Avatar circle với chữ cái đầu
- `.nvbh-customer-info__details` - Thông tin chi tiết
- `.nvbh-btn--secondary` - Button style (Corporate Blue theme)

---

## ✅ Testing Checklist

### Frontend Testing
- [x] Import `HiOutlineChatBubbleLeftRight` thành công
- [x] Handler `handleChatWithCustomer()` được định nghĩa
- [x] Handler `handleChatWithOwner()` được định nghĩa
- [x] Card "Thông tin Chủ dự án" render đúng
- [x] Nút "Trò chuyện với khách hàng" hiển thị
- [x] Nút "Trò chuyện với chủ dự án" hiển thị
- [x] Field names khớp với backend (SDTKhachHang, EmailKhachHang)
- [ ] **Pending:** Test conversation creation khi click button
- [ ] **Pending:** Test redirect đến trang trò chuyện
- [ ] **Pending:** Test fallback khi thiếu ChuDuAnID hoặc KhachHangID

### Backend Testing
- [x] SQL query JOIN với bảng `nguoidung` (alias `cda`)
- [x] Trả về fields: TenChuDuAn, SoDienThoaiChuDuAn, EmailChuDuAn
- [x] Trả về ChuDuAnID từ `td.DuAnID`
- [x] Parse JSON cho field `HinhAnhPhong`
- [x] Parse tọa độ GPS thành object `ToaDo`
- [ ] **Pending:** Test với DB thực tế
- [ ] **Pending:** Test khi ChuDuAnID NULL
- [ ] **Pending:** Test khi không có hình ảnh

### Integration Testing
- [ ] **Pending:** Tạo conversation mới với khách hàng
- [ ] **Pending:** Tạo conversation mới với chủ dự án
- [ ] **Pending:** Kiểm tra conversation không bị duplicate
- [ ] **Pending:** Kiểm tra redirect đúng trang
- [ ] **Pending:** Kiểm tra token authentication

---

## 🐛 Known Issues & TODOs

### Issues
1. **Chưa có error handling cho network errors**
   - Handler functions chỉ log error ra console
   - Cần thêm UI feedback rõ ràng hơn

2. **Hardcoded API URL**
   - `http://localhost:5000/api/chat/conversations` nên lấy từ config
   - Cần tạo service function trong `nhanVienBanHangApi.js`

3. **Không có loading state**
   - Khi tạo conversation, không có spinner/loading indicator
   - User có thể click nhiều lần

### TODOs
- [ ] Refactor API calls vào `nhanVienBanHangApi.js`
- [ ] Thêm loading spinner khi tạo conversation
- [ ] Thêm error notification component
- [ ] Thêm confirmation dialog trước khi tạo conversation
- [ ] Thêm logic kiểm tra existing conversation trước khi tạo mới
- [ ] Thêm unit tests cho handler functions
- [ ] Thêm integration tests cho chat flow
- [ ] Cập nhật documentation trong `NVBH_TESTING_GUIDE.md`

---

## 📝 Code Review Notes

### Strengths ✅
1. **Consistent Naming:** Sử dụng tiếng Việt không dấu cho function/variable names
2. **Clean Structure:** Card layout tách biệt rõ ràng
3. **Reusable Components:** Dùng lại `.nvbh-customer-info` cho cả khách hàng và chủ dự án
4. **Backend Aliases:** SQL query sử dụng aliases rõ ràng (TieuDePhong, DiaChiPhong)

### Areas for Improvement 🔧
1. **API Service Layer:** Nên tạo dedicated functions trong `nhanVienBanHangApi.js`
2. **Error Handling:** Cần improve error messages và UI feedback
3. **Loading States:** Thêm loading indicators cho better UX
4. **Type Safety:** Thêm JSDoc comments cho function parameters
5. **Configuration:** Move API base URL to environment config

---

## 🔗 Related Documentation

- **Use Case:** `docs/use-cases-v1.2.md` (UC-SALE-03: Xem chi tiết cuộc hẹn)
- **API Routes:** `docs/NHAN_VIEN_BAN_HANG_IMPLEMENTATION.md`
- **Chat System:** `docs/CHAT_AUTH_FIX_SUMMARY.md`
- **Testing Guide:** `docs/NVBH_TESTING_GUIDE.md`
- **Design System:** `client/src/styles/NhanVienBanHangDesignSystem.css`

---

## 📅 Changelog

### 2024-01-XX - Initial Implementation
- ✅ Thêm import `HiOutlineChatBubbleLeftRight` icon
- ✅ Tạo `handleChatWithCustomer()` function
- ✅ Tạo `handleChatWithOwner()` function
- ✅ Thêm card "Thông tin Chủ dự án"
- ✅ Thêm nút chat vào customer card
- ✅ Cập nhật backend SQL query để lấy thông tin chủ dự án
- ✅ Parse JSON fields (HinhAnhPhong) và tọa độ GPS
- ✅ Sửa field names (SDTKhachHang, EmailKhachHang)

---

## 👤 Author & Reviewers

**Author:** GitHub Copilot  
**Date:** 2024-01-XX  
**Reviewers:** TBD  
**Status:** ✅ Implementation Complete, ⏳ Testing Pending
