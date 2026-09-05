# 🔐 Triển khai Phê duyệt Cuộc hẹn & Phương thức Vào Dự án

## 📋 Tổng quan

Tài liệu này mô tả việc triển khai tính năng **phê duyệt cuộc hẹn từ chủ dự án** và **quản lý phương thức vào dự án**.

---

## 🗄️ Thay đổi Database

### Bảng `duan` - Thêm cột mới:
```sql
ALTER TABLE `duan` 
ADD COLUMN `PhuongThucVao` TEXT DEFAULT NULL 
COMMENT 'Phương thức vào dự án khi không cần phê duyệt (mật khẩu cửa, vị trí lấy chìa khóa, v.v.)' 
AFTER `YeuCauPheDuyetChu`;
```

**Mục đích:**
- Lưu trữ phương thức vào **mặc định** của dự án
- Chỉ áp dụng khi `YeuCauPheDuyetChu = 0` (không yêu cầu phê duyệt)
- Ví dụ: "Mật khẩu cổng: 1234, Chìa khóa tại hộp thư số 5"

### Bảng `cuochen` - Thêm 4 cột mới:

```sql
ALTER TABLE `cuochen` 
ADD COLUMN `PheDuyetChuDuAn` ENUM('ChoPheDuyet','DaPheDuyet','TuChoi') DEFAULT NULL
COMMENT 'Trạng thái phê duyệt từ chủ dự án (NULL nếu dự án không yêu cầu phê duyệt)'
AFTER `TrangThai`;

ALTER TABLE `cuochen` 
ADD COLUMN `LyDoTuChoi` TEXT DEFAULT NULL
COMMENT 'Lý do từ chối cuộc hẹn (nếu PheDuyetChuDuAn = TuChoi)'
AFTER `PheDuyetChuDuAn`;

ALTER TABLE `cuochen` 
ADD COLUMN `PhuongThucVao` TEXT DEFAULT NULL
COMMENT 'Phương thức vào dự án cho cuộc hẹn này (ghi đè PhuongThucVao của duan nếu có)'
AFTER `LyDoTuChoi`;

ALTER TABLE `cuochen` 
ADD COLUMN `ThoiGianPheDuyet` DATETIME DEFAULT NULL
COMMENT 'Thời điểm chủ dự án phê duyệt/từ chối cuộc hẹn'
AFTER `PhuongThucVao`;
```

**Mục đích:**
- `PheDuyetChuDuAn`: Trạng thái phê duyệt của chủ dự án
  - `NULL`: Không cần phê duyệt
  - `ChoPheDuyet`: Đang chờ chủ dự án phê duyệt
  - `DaPheDuyet`: Đã được phê duyệt
  - `TuChoi`: Bị từ chối
- `LyDoTuChoi`: Ghi lý do khi từ chối
- `PhuongThucVao`: Phương thức vào **cụ thể cho cuộc hẹn này** (ưu tiên hơn `duan.PhuongThucVao`)
- `ThoiGianPheDuyet`: Timestamp khi phê duyệt/từ chối

---

## 🎯 Nghiệp vụ Logic

### **LUỒNG 1: Dự án YÊU CẦU phê duyệt** (`YeuCauPheDuyetChu = 1`)

1. **Tạo cuộc hẹn:**
   - Khách hàng/Sales tạo cuộc hẹn
   - `TrangThai = 'DaYeuCau'`
   - `PheDuyetChuDuAn = 'ChoPheDuyet'`
   - `duan.PhuongThucVao` = NULL (không cần cung cấp trước)

2. **Chủ dự án xem danh sách cuộc hẹn chờ phê duyệt:**
   - Filter: `PheDuyetChuDuAn = 'ChoPheDuyet'`
   - Hiển thị: Thông tin khách hàng, sales, thời gian hẹn

3. **Chủ dự án phê duyệt:**
   - **Option A - Phê duyệt:**
     - `PheDuyetChuDuAn = 'DaPheDuyet'`
     - Nhập `cuochen.PhuongThucVao` (bắt buộc)
     - `ThoiGianPheDuyet = NOW()`
   - **Option B - Từ chối:**
     - `PheDuyetChuDuAn = 'TuChoi'`
     - Nhập `LyDoTuChoi` (bắt buộc)
     - `ThoiGianPheDuyet = NOW()`

4. **Sales/Khách xem phương thức vào:**
   - Chỉ hiển thị `cuochen.PhuongThucVao` khi `PheDuyetChuDuAn = 'DaPheDuyet'`
   - Hiển thị `LyDoTuChoi` khi `PheDuyetChuDuAn = 'TuChoi'`

### **LUỒNG 2: Dự án KHÔNG yêu cầu phê duyệt** (`YeuCauPheDuyetChu = 0`)

1. **Tạo dự án:**
   - `duan.PhuongThucVao` là **BẮT BUỘC**
   - Chủ dự án phải nhập trước

2. **Tạo cuộc hẹn:**
   - `TrangThai = 'DaXacNhan'` (tự động xác nhận)
   - `PheDuyetChuDuAn = NULL` (không cần phê duyệt)
   - `cuochen.PhuongThucVao` = NULL (dùng `duan.PhuongThucVao`)

3. **Sales/Khách xem phương thức vào:**
   - Hiển thị `duan.PhuongThucVao` ngay lập tức
   - Không cần chờ phê duyệt

---

## 💻 Triển khai Frontend

### **File:** `client/src/components/ChuDuAn/ModalTaoNhanhDuAn.jsx`

#### **State mới:**
```javascript
const [formData, setFormData] = useState({
  TenDuAn: '',
  DiaChiChiTiet: '',
  MoTa: '',
  YeuCauPheDuyetChu: false,  // Checkbox
  PhuongThucVao: '',          // Textarea - Điều kiện hiển thị
  TrangThai: 'HoatDong'
});
```

#### **Validation:**
```javascript
// Nếu KHÔNG yêu cầu phê duyệt → PhuongThucVao là BẮT BUỘC
if (!formData.YeuCauPheDuyetChu && !formData.PhuongThucVao.trim()) {
  setError('Vui lòng nhập phương thức vào dự án (mật khẩu cửa, vị trí chìa khóa...)');
  return;
}
```

#### **UI Logic:**
```javascript
{/* Chỉ hiện textarea khi KHÔNG tick checkbox phê duyệt */}
{!formData.YeuCauPheDuyetChu && (
  <div>
    <label>Phương thức vào dự án <span style={{ color: '#dc2626' }}>*</span></label>
    <textarea
      name="PhuongThucVao"
      value={formData.PhuongThucVao}
      onChange={xuLyThayDoi}
      placeholder="VD: Mật khẩu cổng: 1234, Chìa khóa để tại hộp thư số 5..."
      rows="3"
    />
    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
      💡 Thông tin này sẽ được chia sẻ với nhân viên bán hàng và khách hàng sau khi đặt hẹn
    </p>
  </div>
)}
```

#### **API Call:**
```javascript
body: JSON.stringify({
  TenDuAn: formData.TenDuAn.trim(),
  DiaChi: diaChiDayDu,
  MoTa: formData.MoTa.trim() || '',
  YeuCauPheDuyetChu: formData.YeuCauPheDuyetChu ? 1 : 0,
  PhuongThucVao: formData.YeuCauPheDuyetChu ? null : formData.PhuongThucVao.trim(),
  TrangThai: formData.TrangThai
})
```

**Giải thích:**
- Nếu `YeuCauPheDuyetChu = true` → `PhuongThucVao = null` (không gửi)
- Nếu `YeuCauPheDuyetChu = false` → `PhuongThucVao = giá trị nhập` (bắt buộc)

---

## ⚙️ Triển khai Backend

### **File:** `server/models/ChuDuAnModel.js`

#### **Method:** `taoDuAn(chuDuAnId, data)`

```javascript
static async taoDuAn(chuDuAnId, data) {
  try {
    const [result] = await db.execute(
      `INSERT INTO duan (TenDuAn, DiaChi, ChuDuAnID, YeuCauPheDuyetChu, PhuongThucVao, TrangThai, TaoLuc, CapNhatLuc)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.TenDuAn, 
        data.DiaChi || '', 
        chuDuAnId,
        data.YeuCauPheDuyetChu || 0,
        data.PhuongThucVao || null,  // ← Trường mới
        data.TrangThai || 'HoatDong'
      ]
    );
    return result.insertId;
  } catch (error) {
    throw new Error(`Lỗi tạo dự án: ${error.message}`);
  }
}
```

### **File:** `server/controllers/ChuDuAnController.js`

#### **Endpoint:** `POST /api/chu-du-an/du-an/tao-nhanh`

```javascript
static async taoNhanhDuAn(req, res) {
  try {
    const chuDuAnId = req.user.id;
    const { TenDuAn, DiaChi, MoTa, YeuCauPheDuyetChu, PhuongThucVao, TrangThai } = req.body;

    // Validation cơ bản
    if (!TenDuAn || !TenDuAn.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tên dự án không được để trống'
      });
    }

    if (!DiaChi || !DiaChi.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Địa chỉ không được để trống'
      });
    }

    // ✅ VALIDATION MỚI: Nếu không yêu cầu phê duyệt → PhuongThucVao là BẮT BUỘC
    if (!YeuCauPheDuyetChu && (!PhuongThucVao || !PhuongThucVao.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Phương thức vào dự án là bắt buộc khi không yêu cầu phê duyệt'
      });
    }

    // Tạo dự án
    const duAnId = await ChuDuAnModel.taoDuAn(chuDuAnId, {
      TenDuAn: TenDuAn.trim(),
      DiaChi: DiaChi.trim(),
      MoTa: MoTa ? MoTa.trim() : '',
      YeuCauPheDuyetChu: YeuCauPheDuyetChu ? 1 : 0,
      PhuongThucVao: YeuCauPheDuyetChu ? null : (PhuongThucVao ? PhuongThucVao.trim() : null),
      TrangThai: TrangThai || 'HoatDong'
    });

    // ... (phần còn lại)
  }
}
```

**Logic:**
- Nếu `YeuCauPheDuyetChu = true` → `PhuongThucVao = null` (không lưu)
- Nếu `YeuCauPheDuyetChu = false` → `PhuongThucVao` **BẮT BUỘC** (phải nhập)

---

## 🧪 Test Cases

### **Test 1: Tạo dự án YÊU CẦU phê duyệt**
1. Mở modal tạo dự án
2. Nhập tên, địa chỉ
3. **TICK** checkbox "Yêu cầu phê duyệt từ chủ dự án"
4. → Textarea "Phương thức vào" **ẨN**
5. Submit → Success

**Expected Database:**
```sql
INSERT INTO duan (...) VALUES (
  'Dự án ABC',
  '123 Đường Test...',
  1,
  1,        -- YeuCauPheDuyetChu = 1
  NULL,     -- PhuongThucVao = NULL
  'HoatDong'
);
```

### **Test 2: Tạo dự án KHÔNG yêu cầu phê duyệt - Không nhập phương thức**
1. Mở modal tạo dự án
2. Nhập tên, địa chỉ
3. **KHÔNG TICK** checkbox "Yêu cầu phê duyệt"
4. → Textarea "Phương thức vào" **HIỆN** với dấu sao đỏ (*)
5. **KHÔNG NHẬP** phương thức vào
6. Submit → **ERROR**: "Vui lòng nhập phương thức vào dự án..."

### **Test 3: Tạo dự án KHÔNG yêu cầu phê duyệt - Có nhập phương thức**
1. Mở modal tạo dự án
2. Nhập tên, địa chỉ
3. **KHÔNG TICK** checkbox "Yêu cầu phê duyệt"
4. → Textarea "Phương thức vào" **HIỆN**
5. Nhập: "Mật khẩu cổng: 1234, Chìa khóa tại hộp thư số 5"
6. Submit → Success

**Expected Database:**
```sql
INSERT INTO duan (...) VALUES (
  'Dự án XYZ',
  '456 Đường Test...',
  1,
  0,        -- YeuCauPheDuyetChu = 0
  'Mật khẩu cổng: 1234, Chìa khóa tại hộp thư số 5',  -- PhuongThucVao
  'HoatDong'
);
```

### **Test 4: Toggle checkbox phê duyệt**
1. Mở modal tạo dự án
2. **KHÔNG TICK** checkbox → Textarea "Phương thức vào" **HIỆN**
3. Nhập nội dung vào textarea
4. **TICK** checkbox → Textarea **ẨN** (nội dung vẫn còn trong state)
5. **BỎ TICK** checkbox → Textarea **HIỆN** lại với nội dung cũ
6. Submit → Success

---

## 🔜 Công việc tiếp theo (Future Work)

### **Phase 2: UI Phê duyệt cuộc hẹn**

1. **Trang quản lý cuộc hẹn cho chủ dự án:**
   - Tab "Chờ phê duyệt" (filter: `PheDuyetChuDuAn = 'ChoPheDuyet'`)
   - Hiển thị: Thông tin khách hàng, sales, thời gian hẹn, dự án
   - Action buttons: "Phê duyệt" | "Từ chối"

2. **Modal phê duyệt:**
   - Textarea: Phương thức vào (bắt buộc khi phê duyệt)
   - Button: "✓ Phê duyệt"

3. **Modal từ chối:**
   - Textarea: Lý do từ chối (bắt buộc)
   - Button: "✗ Từ chối"

4. **API Endpoints cần thêm:**
   - `PUT /api/chu-du-an/cuoc-hen/:id/phe-duyet`
   - `PUT /api/chu-du-an/cuoc-hen/:id/tu-choi`

5. **Backend logic:**
   ```javascript
   // Phê duyệt
   UPDATE cuochen SET 
     PheDuyetChuDuAn = 'DaPheDuyet',
     PhuongThucVao = ?,
     ThoiGianPheDuyet = NOW()
   WHERE CuocHenID = ?
   
   // Từ chối
   UPDATE cuochen SET 
     PheDuyetChuDuAn = 'TuChoi',
     LyDoTuChoi = ?,
     ThoiGianPheDuyet = NOW()
   WHERE CuocHenID = ?
   ```

6. **UI cho Sales/Khách:**
   - Hiển thị trạng thái phê duyệt:
     - "⏳ Chờ chủ dự án phê duyệt"
     - "✓ Đã phê duyệt - Phương thức vào: [PhuongThucVao]"
     - "✗ Đã từ chối - Lý do: [LyDoTuChoi]"

### **Phase 3: Notification & Alerts**

1. **Email/SMS thông báo:**
   - Chủ dự án khi có cuộc hẹn mới
   - Sales/Khách khi cuộc hẹn được phê duyệt/từ chối

2. **In-app notification:**
   - Badge count cuộc hẹn chờ phê duyệt
   - Real-time alert qua WebSocket

---

## 📊 Metrics & Monitoring

### **KPIs cần tracking:**
1. Tỷ lệ phê duyệt/từ chối cuộc hẹn
2. Thời gian trung bình từ "DaYeuCau" → "DaPheDuyet"
3. Số lượng dự án yêu cầu phê duyệt vs không yêu cầu
4. Tỷ lệ cuộc hẹn bị từ chối theo lý do

### **Query ví dụ:**
```sql
-- Tỷ lệ phê duyệt
SELECT 
  PheDuyetChuDuAn,
  COUNT(*) as SoLuong,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM cuochen WHERE PheDuyetChuDuAn IS NOT NULL), 2) as TyLe
FROM cuochen
WHERE PheDuyetChuDuAn IS NOT NULL
GROUP BY PheDuyetChuDuAn;

-- Thời gian phê duyệt trung bình
SELECT 
  AVG(TIMESTAMPDIFF(HOUR, TaoLuc, ThoiGianPheDuyet)) as TrungBinhGio
FROM cuochen
WHERE PheDuyetChuDuAn = 'DaPheDuyet';
```

---

## ✅ Checklist Hoàn thành

- [x] Database migration (thêm cột `duan.PhuongThucVao`, `cuochen.PheDuyetChuDuAn`, etc.)
- [x] Backend Model: `ChuDuAnModel.taoDuAn()` hỗ trợ `PhuongThucVao`
- [x] Backend Controller: Validation `PhuongThucVao` bắt buộc khi không phê duyệt
- [x] Frontend Modal: Thêm textarea `PhuongThucVao` với điều kiện hiển thị
- [x] Frontend Modal: Validation và UX hints
- [x] Kiểm tra lỗi biên dịch (No errors found)
- [ ] Manual testing trên dev environment
- [ ] UI/UX cho phê duyệt cuộc hẹn (Phase 2)
- [ ] API endpoints phê duyệt/từ chối (Phase 2)
- [ ] Notification system (Phase 3)

---

## 📝 Ghi chú bổ sung

### **Lưu ý bảo mật:**
1. Trường `PhuongThucVao` chứa thông tin nhạy cảm (mật khẩu cửa, vị trí chìa khóa)
2. Chỉ hiển thị cho:
   - Chủ dự án (owner)
   - Sales đã xác nhận cuộc hẹn
   - Khách hàng đã được phê duyệt
3. **KHÔNG** trả về trong API public (danh sách tin đăng)

### **Optimization:**
- Thêm index cho `cuochen.PheDuyetChuDuAn` để tối ưu query filter
- Cache `duan.PhuongThucVao` trong Redis nếu dự án có nhiều cuộc hẹn

---

**Document Version:** 1.0  
**Last Updated:** October 1, 2025  
**Author:** GitHub Copilot  
