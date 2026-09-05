# 📋 KẾ HOẠCH TRIỂN KHAI UC-PROJ-04 & UC-PROJ-05

**Ngày tạo:** 30/10/2025  
**Tham chiếu:** `use-cases-v1.2.md` lines 405-418  
**Status:** 🔴 CHƯA TRIỂN KHAI

---

## 🎯 UC-PROJ-04: BÁO CÁO HỢP ĐỒNG CHO THUÊ

### 📊 Phân tích Nghiệp vụ

**Mục tiêu:** 
> "Báo cáo việc đã ký hợp đồng với khách thuê để chốt trạng thái và giải tỏa TiềnTạmGiữ"

**Luồng nghiệp vụ:**
```
1. Khách hàng đặt cọc (CocGiuCho hoặc CocAnNinh)
   ↓
2. Phòng chuyển sang trạng thái "GiuCho"
   ↓
3. Chủ dự án & Khách hàng ký hợp đồng offline
   ↓
4. Chủ dự án BÁO CÁO lên hệ thống:
   - Upload hợp đồng scan (PDF/Image)
   - Nhập thông tin: Ngày bắt đầu, Ngày kết thúc, Giá thuê cuối cùng
   ↓
5. Hệ thống xử lý:
   a. Tạo bản ghi `hopdong`
   b. Chuyển Phòng → "DaThue"
   c. Cập nhật Cọc: TrangThai = "DaDoiTru" (nếu đối trừ vào tiền thuê)
                   hoặc "DaGiaiToa" (nếu hoàn lại)
   d. Tạo GiaoDich giải tỏa cọc (nếu hoàn)
   e. Ghi NhatKyHeThong
   ↓
6. Thông báo cho Khách hàng: Hợp đồng đã được xác nhận
```

**Điều kiện tiên quyết:**
- ✅ Phòng đang ở trạng thái `GiuCho`
- ✅ Có `coc.CocID` liên kết với Phòng, TrangThai = `HieuLuc`
- ✅ Cọc chưa hết hạn (hoặc đã được gia hạn)

**Kết quả mong đợi:**
- ✅ `hopdong` được tạo với đầy đủ thông tin
- ✅ `phong.TrangThai` = `DaThue`
- ✅ `coc.TrangThai` = `DaDoiTru` hoặc `DaGiaiToa`
- ✅ Nếu giải tỏa → Tạo `giaodich` hoàn cọc
- ✅ `nhatkyheThong` ghi nhận hành động

---

### 🗄️ Database Schema (ALREADY EXISTS ✅)

```sql
-- Bảng hopdong
CREATE TABLE `hopdong` (
  `HopDongID` int(11) NOT NULL AUTO_INCREMENT,
  `TinDangID` int(11) DEFAULT NULL,
  `KhachHangID` int(11) DEFAULT NULL,
  `NgayBatDau` date DEFAULT NULL,
  `NgayKetThuc` date DEFAULT NULL,
  `GiaThueCuoiCung` decimal(15,2) DEFAULT NULL,
  `BaoCaoLuc` datetime DEFAULT NULL,
  `MauHopDongID` int(11) DEFAULT NULL,
  `NoiDungSnapshot` text DEFAULT NULL,
  PRIMARY KEY (`HopDongID`)
);

-- Bảng coc (CẦN UPDATE TrangThai)
CREATE TABLE `coc` (
  `CocID` bigint(20) NOT NULL AUTO_INCREMENT,
  `GiaoDichID` int(11) NOT NULL,
  `TinDangID` int(11) NOT NULL,
  `PhongID` int(11) NOT NULL,
  `Loai` enum('CocGiuCho','CocAnNinh') NOT NULL,
  `SoTien` decimal(15,2) NOT NULL,
  `TrangThai` enum('HieuLuc','HetHan','DaGiaiToa','DaDoiTru') NOT NULL DEFAULT 'HieuLuc',
  `HopDongID` int(11) DEFAULT NULL, -- Liên kết với HopDongID
  `LyDoGiaiToa` text DEFAULT NULL,
  PRIMARY KEY (`CocID`)
);

-- Bảng phong (CẦN UPDATE TrangThai)
CREATE TABLE `phong` (
  `PhongID` int(11) NOT NULL AUTO_INCREMENT,
  `TrangThai` enum('Trong','GiuCho','DaThue','DonDep') DEFAULT 'Trong',
  PRIMARY KEY (`PhongID`)
);
```

---

### 💻 Backend Implementation

#### File Structure
```
server/
├── models/
│   ├── HopDongModel.js          # NEW - CRUD hợp đồng
│   └── CocModel.js               # NEW - Logic giải tỏa cọc
├── controllers/
│   └── HopDongController.js     # NEW - HTTP handlers
├── routes/
│   └── hopDongRoutes.js         # NEW - Routes
└── services/
    └── GiaiToaCocService.js     # NEW - Business logic giải tỏa
```

---

#### 1. **HopDongModel.js** (NEW)

```javascript
/**
 * @fileoverview Model quản lý Hợp đồng
 * @module HopDongModel
 * @requires config/db
 */

const db = require('../config/db');

class HopDongModel {
  /**
   * Tạo hợp đồng mới (báo cáo hợp đồng đã ký)
   * @param {Object} data - Thông tin hợp đồng
   * @param {number} data.TinDangID
   * @param {number} data.KhachHangID
   * @param {number} data.PhongID - Phòng được thuê
   * @param {string} data.NgayBatDau - YYYY-MM-DD
   * @param {string} data.NgayKetThuc - YYYY-MM-DD
   * @param {number} data.GiaThueCuoiCung
   * @param {string} data.NoiDungSnapshot - Optional: Snapshot nội dung HĐ
   * @param {number} chuDuAnId - ID Chủ dự án (for validation)
   * @returns {Promise<number>} HopDongID
   */
  static async baoCaoHopDong(data, chuDuAnId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // 1. VALIDATE: Kiểm tra Phòng thuộc sở hữu Chủ dự án
      const [phongCheck] = await connection.query(`
        SELECT p.PhongID, p.TrangThai, p.DuAnID, da.ChuDuAnID
        FROM phong p
        JOIN duan da ON p.DuAnID = da.DuAnID
        WHERE p.PhongID = ? AND da.ChuDuAnID = ?
      `, [data.PhongID, chuDuAnId]);

      if (phongCheck.length === 0) {
        throw new Error('Phòng không tồn tại hoặc không thuộc quyền sở hữu của bạn');
      }

      if (phongCheck[0].TrangThai !== 'GiuCho') {
        throw new Error(`Phòng phải ở trạng thái "GiuCho" (hiện tại: ${phongCheck[0].TrangThai})`);
      }

      // 2. VALIDATE: Kiểm tra có Cọc hợp lệ
      const [cocCheck] = await connection.query(`
        SELECT 
          c.CocID, c.Loai, c.SoTien, c.TrangThai,
          c.ChinhSachCocID, c.QuyTacGiaiToaSnapshot
        FROM coc c
        WHERE c.PhongID = ? AND c.TrangThai = 'HieuLuc'
        ORDER BY c.TaoLuc DESC
        LIMIT 1
      `, [data.PhongID]);

      if (cocCheck.length === 0) {
        throw new Error('Không tìm thấy cọc hợp lệ cho phòng này');
      }

      const cocInfo = cocCheck[0];

      // 3. INSERT Hợp đồng
      const [hopDongResult] = await connection.query(`
        INSERT INTO hopdong (
          TinDangID, KhachHangID, NgayBatDau, NgayKetThuc,
          GiaThueCuoiCung, BaoCaoLuc, NoiDungSnapshot
        ) VALUES (?, ?, ?, ?, ?, NOW(), ?)
      `, [
        data.TinDangID,
        data.KhachHangID,
        data.NgayBatDau,
        data.NgayKetThuc,
        data.GiaThueCuoiCung,
        data.NoiDungSnapshot || null
      ]);

      const hopDongId = hopDongResult.insertId;

      // 4. UPDATE Phòng → DaThue
      await connection.query(`
        UPDATE phong
        SET TrangThai = 'DaThue', CapNhatLuc = NOW()
        WHERE PhongID = ?
      `, [data.PhongID]);

      // 5. XỬ LÝ CỌC theo quy tắc
      const quyTac = cocInfo.QuyTacGiaiToaSnapshot || 'BanGiao';

      if (data.DoiTruCocVaoTienThue) {
        // Trường hợp: Đối trừ cọc vào tiền thuê tháng đầu
        await connection.query(`
          UPDATE coc
          SET 
            TrangThai = 'DaDoiTru',
            HopDongID = ?,
            LyDoKhauTru = 'Đối trừ vào tiền thuê tháng đầu',
            CapNhatLuc = NOW()
          WHERE CocID = ?
        `, [hopDongId, cocInfo.CocID]);

      } else {
        // Trường hợp: Giải tỏa cọc (hoàn lại khách)
        await connection.query(`
          UPDATE coc
          SET 
            TrangThai = 'DaGiaiToa',
            HopDongID = ?,
            LyDoGiaiToa = 'Hợp đồng đã được ký, giải tỏa cọc theo quy tắc',
            CapNhatLuc = NOW()
          WHERE CocID = ?
        `, [hopDongId, cocInfo.CocID]);

        // TODO: Tạo GiaoDich hoàn cọc (nếu có luồng thanh toán online)
        // await GiaoDichModel.taoGiaoDichHoanCoc({
        //   CocID: cocInfo.CocID,
        //   SoTien: cocInfo.SoTien,
        //   KhachHangID: data.KhachHangID
        // });
      }

      await connection.commit();
      return hopDongId;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Lấy danh sách hợp đồng của Chủ dự án
   * @param {number} chuDuAnId - ID Chủ dự án
   * @param {Object} filters - Filters: {trangThai, tuNgay, denNgay}
   * @returns {Promise<Array>}
   */
  static async layDanhSach(chuDuAnId, filters = {}) {
    let query = `
      SELECT 
        hd.HopDongID,
        hd.TinDangID,
        td.TieuDe as TenTinDang,
        hd.KhachHangID,
        nd.TenDayDu as TenKhachHang,
        nd.SoDienThoai,
        p.TenPhong,
        p.PhongID,
        hd.NgayBatDau,
        hd.NgayKetThuc,
        hd.GiaThueCuoiCung,
        hd.BaoCaoLuc,
        c.SoTien as SoTienCoc,
        c.TrangThai as TrangThaiCoc
      FROM hopdong hd
      JOIN tindang td ON hd.TinDangID = td.TinDangID
      JOIN duan da ON td.DuAnID = da.DuAnID
      JOIN nguoidung nd ON hd.KhachHangID = nd.NguoiDungID
      LEFT JOIN coc c ON c.HopDongID = hd.HopDongID
      LEFT JOIN phong p ON c.PhongID = p.PhongID
      WHERE da.ChuDuAnID = ?
    `;

    const params = [chuDuAnId];

    if (filters.tuNgay) {
      query += ` AND hd.NgayBatDau >= ?`;
      params.push(filters.tuNgay);
    }

    if (filters.denNgay) {
      query += ` AND hd.NgayKetThuc <= ?`;
      params.push(filters.denNgay);
    }

    query += ` ORDER BY hd.BaoCaoLuc DESC`;

    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * Lấy chi tiết hợp đồng
   * @param {number} hopDongId
   * @param {number} chuDuAnId - For ownership check
   * @returns {Promise<Object|null>}
   */
  static async layChiTiet(hopDongId, chuDuAnId) {
    const [rows] = await db.query(`
      SELECT 
        hd.*,
        td.TieuDe as TenTinDang,
        td.DiaChi,
        nd.TenDayDu as TenKhachHang,
        nd.Email as EmailKhachHang,
        nd.SoDienThoai as SdtKhachHang,
        p.TenPhong,
        p.TrangThai as TrangThaiPhong,
        c.CocID,
        c.SoTien as SoTienCoc,
        c.TrangThai as TrangThaiCoc,
        c.LyDoGiaiToa,
        c.LyDoKhauTru
      FROM hopdong hd
      JOIN tindang td ON hd.TinDangID = td.TinDangID
      JOIN duan da ON td.DuAnID = da.DuAnID
      JOIN nguoidung nd ON hd.KhachHangID = nd.NguoiDungID
      LEFT JOIN coc c ON c.HopDongID = hd.HopDongID
      LEFT JOIN phong p ON c.PhongID = p.PhongID
      WHERE hd.HopDongID = ? AND da.ChuDuAnID = ?
    `, [hopDongId, chuDuAnId]);

    return rows.length > 0 ? rows[0] : null;
  }
}

module.exports = HopDongModel;
```

---

#### 2. **HopDongController.js** (NEW)

```javascript
/**
 * @fileoverview Controller quản lý Hợp đồng
 * @module HopDongController
 */

const HopDongModel = require('../models/HopDongModel');
const NhatKyService = require('../services/NhatKyHeThongService');

class HopDongController {
  /**
   * POST /api/chu-du-an/hop-dong/bao-cao
   * Báo cáo hợp đồng đã ký
   */
  static async baoCao(req, res) {
    try {
      const chuDuAnId = req.user.NguoiDungID;
      const {
        TinDangID,
        KhachHangID,
        PhongID,
        NgayBatDau,
        NgayKetThuc,
        GiaThueCuoiCung,
        DoiTruCocVaoTienThue, // boolean
        NoiDungSnapshot
      } = req.body;

      // Validation
      if (!TinDangID || !KhachHangID || !PhongID || !NgayBatDau || !NgayKetThuc || !GiaThueCuoiCung) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc'
        });
      }

      // Kiểm tra NgayKetThuc > NgayBatDau
      if (new Date(NgayKetThuc) <= new Date(NgayBatDau)) {
        return res.status(400).json({
          success: false,
          message: 'Ngày kết thúc phải sau ngày bắt đầu'
        });
      }

      const hopDongId = await HopDongModel.baoCaoHopDong({
        TinDangID,
        KhachHangID,
        PhongID,
        NgayBatDau,
        NgayKetThuc,
        GiaThueCuoiCung,
        DoiTruCocVaoTienThue,
        NoiDungSnapshot
      }, chuDuAnId);

      // Audit log
      await NhatKyService.ghiNhan({
        NguoiDungID: chuDuAnId,
        HanhDong: 'bao_cao_hop_dong_thue',
        DoiTuong: 'hopdong',
        DoiTuongID: hopDongId,
        ChiTiet: JSON.stringify({
          PhongID,
          TinDangID,
          KhachHangID,
          GiaThueCuoiCung,
          DoiTruCoc: DoiTruCocVaoTienThue || false
        })
      });

      res.status(201).json({
        success: true,
        message: 'Báo cáo hợp đồng thành công',
        data: { HopDongID: hopDongId }
      });

    } catch (error) {
      console.error('[HopDongController.baoCao]', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi báo cáo hợp đồng'
      });
    }
  }

  /**
   * GET /api/chu-du-an/hop-dong
   * Lấy danh sách hợp đồng
   */
  static async layDanhSach(req, res) {
    try {
      const chuDuAnId = req.user.NguoiDungID;
      const { tuNgay, denNgay } = req.query;

      const danhSach = await HopDongModel.layDanhSach(chuDuAnId, {
        tuNgay,
        denNgay
      });

      res.json({
        success: true,
        data: danhSach
      });

    } catch (error) {
      console.error('[HopDongController.layDanhSach]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách hợp đồng'
      });
    }
  }

  /**
   * GET /api/chu-du-an/hop-dong/:id
   * Lấy chi tiết hợp đồng
   */
  static async layChiTiet(req, res) {
    try {
      const chuDuAnId = req.user.NguoiDungID;
      const { id } = req.params;

      const hopDong = await HopDongModel.layChiTiet(id, chuDuAnId);

      if (!hopDong) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy hợp đồng'
        });
      }

      res.json({
        success: true,
        data: hopDong
      });

    } catch (error) {
      console.error('[HopDongController.layChiTiet]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy chi tiết hợp đồng'
      });
    }
  }
}

module.exports = HopDongController;
```

---

#### 3. **hopDongRoutes.js** (NEW)

```javascript
/**
 * @fileoverview Routes quản lý Hợp đồng
 * @module hopDongRoutes
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const HopDongController = require('../controllers/HopDongController');

// Base path: /api/chu-du-an

/**
 * POST /api/chu-du-an/hop-dong/bao-cao
 * Báo cáo hợp đồng đã ký
 */
router.post(
  '/hop-dong/bao-cao',
  auth,
  role.checkRole('ChuDuAn'),
  HopDongController.baoCao
);

/**
 * GET /api/chu-du-an/hop-dong
 * Lấy danh sách hợp đồng
 */
router.get(
  '/hop-dong',
  auth,
  role.checkRole('ChuDuAn'),
  HopDongController.layDanhSach
);

/**
 * GET /api/chu-du-an/hop-dong/:id
 * Lấy chi tiết hợp đồng
 */
router.get(
  '/hop-dong/:id',
  auth,
  role.checkRole('ChuDuAn'),
  HopDongController.layChiTiet
);

module.exports = router;
```

---

#### 4. **Mount Routes** (UPDATE)

**File:** `server/routes/chuDuAnRoutes.js`

```javascript
// ADD at top
const hopDongRoutes = require('./hopDongRoutes');

// ADD after other routes
router.use(hopDongRoutes);
```

---

### 🎨 Frontend Implementation

#### File Structure
```
client/src/
├── pages/ChuDuAn/
│   └── QuanLyHopDong.jsx/.css    # NEW - Trang quản lý hợp đồng
├── components/ChuDuAn/
│   ├── ModalBaoCaoHopDong.jsx/.css  # NEW - Modal báo cáo hợp đồng
│   └── ModalChiTietHopDong.jsx/.css # NEW - Modal xem chi tiết
└── services/
    └── HopDongService.js         # NEW - API client
```

---

#### 1. **HopDongService.js** (NEW)

```javascript
/**
 * @fileoverview Service API cho Hợp đồng
 * @module HopDongService
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Báo cáo hợp đồng đã ký
 * @param {Object} data - Thông tin hợp đồng
 * @returns {Promise<Object>}
 */
export const baoCaoHopDong = async (data) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_BASE}/api/chu-du-an/hop-dong/bao-cao`,
    data,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

/**
 * Lấy danh sách hợp đồng
 * @param {Object} filters - {tuNgay, denNgay}
 * @returns {Promise<Array>}
 */
export const layDanhSachHopDong = async (filters = {}) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  if (filters.tuNgay) params.append('tuNgay', filters.tuNgay);
  if (filters.denNgay) params.append('denNgay', filters.denNgay);

  const response = await axios.get(
    `${API_BASE}/api/chu-du-an/hop-dong?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.data;
};

/**
 * Lấy chi tiết hợp đồng
 * @param {number} hopDongId
 * @returns {Promise<Object>}
 */
export const layChiTietHopDong = async (hopDongId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_BASE}/api/chu-du-an/hop-dong/${hopDongId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.data;
};
```

---

#### 2. **ModalBaoCaoHopDong.jsx** (NEW - 300+ lines)

```javascript
/**
 * @fileoverview Modal báo cáo hợp đồng đã ký
 * @component ModalBaoCaoHopDong
 */

import React, { useState } from 'react';
import {
  HiOutlineXMark,
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiOutlineCurrencyDollar,
  HiOutlineCheckCircle
} from 'react-icons/hi2';
import { baoCaoHopDong } from '../../services/HopDongService';
import './ModalBaoCaoHopDong.css';

/**
 * Modal báo cáo hợp đồng
 * @param {Object} props
 * @param {boolean} props.show
 * @param {Function} props.onClose
 * @param {Object} props.phongInfo - {PhongID, TenPhong, TinDangID, CocInfo}
 */
export default function ModalBaoCaoHopDong({ show, onClose, phongInfo }) {
  const [formData, setFormData] = useState({
    KhachHangID: '',
    NgayBatDau: '',
    NgayKetThuc: '',
    GiaThueCuoiCung: '',
    DoiTruCocVaoTienThue: false,
    NoiDungSnapshot: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.KhachHangID || !formData.NgayBatDau || !formData.NgayKetThuc || !formData.GiaThueCuoiCung) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (new Date(formData.NgayKetThuc) <= new Date(formData.NgayBatDau)) {
      setError('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }

    try {
      setSubmitting(true);

      await baoCaoHopDong({
        ...formData,
        TinDangID: phongInfo.TinDangID,
        PhongID: phongInfo.PhongID
      });

      alert('Báo cáo hợp đồng thành công!');
      onClose(true); // true = refresh data

    } catch (err) {
      console.error('Lỗi báo cáo hợp đồng:', err);
      setError(err.response?.data?.message || 'Lỗi khi báo cáo hợp đồng');
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="mbchd-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mbchd-header">
          <div className="mbchd-header-left">
            <HiOutlineDocumentText className="mbchd-header-icon" />
            <div>
              <h2>Báo cáo Hợp đồng</h2>
              <p className="mbchd-subtitle">Phòng: {phongInfo?.TenPhong}</p>
            </div>
          </div>
          <button className="mbchd-close-btn" onClick={onClose}>
            <HiOutlineXMark />
          </button>
        </div>

        {/* Content */}
        <form className="mbchd-content" onSubmit={handleSubmit}>
          {error && <div className="mbchd-error">{error}</div>}

          {/* Thông tin Cọc hiện tại */}
          <div className="mbchd-info-box">
            <h3>Thông tin Cọc hiện tại</h3>
            <div className="mbchd-info-grid">
              <div className="mbchd-info-item">
                <span className="label">Loại cọc:</span>
                <span className="value">{phongInfo?.CocInfo?.Loai}</span>
              </div>
              <div className="mbchd-info-item">
                <span className="label">Số tiền:</span>
                <span className="value">{phongInfo?.CocInfo?.SoTien?.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>

          {/* Form fields */}
          <div className="mbchd-form-group">
            <label>
              <HiOutlineCheckCircle />
              Khách hàng ID <span className="required">*</span>
            </label>
            <input
              type="number"
              name="KhachHangID"
              value={formData.KhachHangID}
              onChange={handleChange}
              placeholder="Nhập ID khách hàng"
              required
            />
          </div>

          <div className="mbchd-form-row">
            <div className="mbchd-form-group">
              <label>
                <HiOutlineCalendar />
                Ngày bắt đầu <span className="required">*</span>
              </label>
              <input
                type="date"
                name="NgayBatDau"
                value={formData.NgayBatDau}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mbchd-form-group">
              <label>
                <HiOutlineCalendar />
                Ngày kết thúc <span className="required">*</span>
              </label>
              <input
                type="date"
                name="NgayKetThuc"
                value={formData.NgayKetThuc}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mbchd-form-group">
            <label>
              <HiOutlineCurrencyDollar />
              Giá thuê cuối cùng <span className="required">*</span>
            </label>
            <input
              type="number"
              name="GiaThueCuoiCung"
              value={formData.GiaThueCuoiCung}
              onChange={handleChange}
              placeholder="Nhập giá thuê (VNĐ)"
              required
            />
          </div>

          <div className="mbchd-form-group">
            <label className="mbchd-checkbox-label">
              <input
                type="checkbox"
                name="DoiTruCocVaoTienThue"
                checked={formData.DoiTruCocVaoTienThue}
                onChange={handleChange}
              />
              <span>Đối trừ cọc vào tiền thuê tháng đầu</span>
            </label>
            <p className="mbchd-help-text">
              {formData.DoiTruCocVaoTienThue 
                ? '✓ Cọc sẽ được đối trừ, khách không nhận lại tiền cọc'
                : 'Cọc sẽ được giải tỏa và hoàn lại khách hàng'
              }
            </p>
          </div>

          <div className="mbchd-form-group">
            <label>Ghi chú (optional)</label>
            <textarea
              name="NoiDungSnapshot"
              value={formData.NoiDungSnapshot}
              onChange={handleChange}
              placeholder="Ghi chú thêm về hợp đồng..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="mbchd-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Đang xử lý...' : 'Xác nhận báo cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

### 📋 Testing Plan

**File:** `docs/test-hop-dong-api.js`

```javascript
/**
 * Test script cho API Hợp đồng
 * @run node docs/test-hop-dong-api.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000';
const TEST_TOKEN = 'YOUR_JWT_TOKEN_HERE';
const headers = { Authorization: `Bearer ${TEST_TOKEN}` };

async function runTests() {
  console.log('🧪 BẮT ĐẦU TEST HỢP ĐỒNG API\n');

  try {
    // TEST 1: Báo cáo hợp đồng
    console.log('TEST 1: POST /api/chu-du-an/hop-dong/bao-cao');
    const baoCaoRes = await axios.post(
      `${API_BASE}/api/chu-du-an/hop-dong/bao-cao`,
      {
        TinDangID: 1,
        KhachHangID: 5,
        PhongID: 1,
        NgayBatDau: '2025-11-01',
        NgayKetThuc: '2026-10-31',
        GiaThueCuoiCung: 3000000,
        DoiTruCocVaoTienThue: false
      },
      { headers }
    );
    console.log('✅ PASS - Báo cáo thành công:', baoCaoRes.data);

    // TEST 2: Lấy danh sách
    console.log('\nTEST 2: GET /api/chu-du-an/hop-dong');
    const listRes = await axios.get(
      `${API_BASE}/api/chu-du-an/hop-dong`,
      { headers }
    );
    console.log(`✅ PASS - Lấy được ${listRes.data.data.length} hợp đồng`);

    // TEST 3: Lấy chi tiết
    const hopDongId = baoCaoRes.data.data.HopDongID;
    console.log(`\nTEST 3: GET /api/chu-du-an/hop-dong/${hopDongId}`);
    const detailRes = await axios.get(
      `${API_BASE}/api/chu-du-an/hop-dong/${hopDongId}`,
      { headers }
    );
    console.log('✅ PASS - Chi tiết hợp đồng:', detailRes.data.data);

    console.log('\n✅ TẤT CẢ TESTS PASSED!');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.response?.data || error.message);
  }
}

runTests();
```

---

## 🎯 UC-PROJ-05: NHẮN TIN (CHAT SYSTEM)

**Status:** 🟡 LOWER PRIORITY (Nice to have)

### Phân tích:
> "Tương tự UC-CUST-07, nhưng ở vai trò ChuDuAn"

**Scope:**
- ✅ Chủ dự án nhắn tin với Khách hàng
- ✅ Chủ dự án nhắn tin với Nhân viên Bán hàng
- ✅ Real-time messaging (WebSocket/Socket.io)
- ✅ Chat history persistence

**Estimate:** 5-7 ngày (Full chat system)

**Dependencies:**
- WebSocket server setup
- Message persistence (bảng `chat_messages`)
- Real-time notification system
- File upload cho chat (images, documents)

**Recommend:** Triển khai SAU khi hoàn thành UC-PROJ-04 và các core features khác.

---

## 📊 TỔNG KẾT

### UC-PROJ-04: Báo cáo Hợp đồng
**Priority:** 🔴 HIGH  
**Complexity:** ⭐⭐⭐ (Medium)  
**Estimate:** 2-3 ngày  
**Impact:** Critical - Chốt luồng nghiệp vụ cho thuê

**Files to Create:**
- Backend: 3 files (Model, Controller, Routes)
- Frontend: 3 files (Service, Modal, CSS)
- Testing: 1 file

**Database:** ✅ Schema đã có sẵn, không cần migration

---

### UC-PROJ-05: Nhắn tin
**Priority:** 🟢 LOW (Nice to have)  
**Complexity:** ⭐⭐⭐⭐⭐ (High)  
**Estimate:** 5-7 ngày  
**Impact:** Enhancement - Cải thiện UX

**Recommend:** Triển khai ở Sprint sau

---

## 🚀 NEXT ACTIONS

**Week 1:**
1. ✅ Implement UC-PROJ-04 backend (1 ngày)
2. ✅ Implement UC-PROJ-04 frontend (1 ngày)
3. ✅ Testing & bug fixes (0.5 ngày)

**Week 2:**
- Continue với Quản lý Cuộc hẹn (UC-PROJ-02)
- Dashboard real data integration

**Week 3+:**
- UC-PROJ-05 Chat system (if time permits)

---

**END OF DOCUMENT**
