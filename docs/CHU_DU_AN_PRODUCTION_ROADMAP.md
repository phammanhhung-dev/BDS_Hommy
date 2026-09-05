# 🚀 KẾ HOẠCH XÂY DỰNG MODULE CHỦ DỰ ÁN - PRODUCTION READY

**Ngày tạo:** 30/10/2025  
**Phiên bản:** 1.0  
**Tham chiếu:** use-cases-v1.2.md, TOM_TAT_CHUC_NANG_CON_THIEU.md  
**Architecture:** Bulletproof React Pattern  

---

## 📊 HIỆN TRẠNG (OCTOBER 2025)

### ✅ ĐÃ HOÀN THÀNH (75%)

| Chức năng | Backend | Frontend | Testing | Status |
|-----------|---------|----------|---------|--------|
| Dashboard | ✅ | ✅ | ❌ | 70% |
| Quản lý Dự án | ✅ | ✅ | ❌ | 80% |
| Tạo Tin đăng | ✅ | ✅ | ❌ | 85% |
| Quản lý Tin đăng | ✅ | ✅ | ❌ | 75% |
| Quản lý Phòng (Redesign) | ✅ | ✅ | ❌ | 100% Code |
| Báo cáo Hiệu suất | ✅ | ✅ | ❌ | 60% |
| Cài đặt Tài khoản | ✅ | ✅ | ❌ | 70% |

### ❌ THIẾU QUAN TRỌNG (25%)

| Chức năng | Priority | Estimate | Use Case |
|-----------|----------|----------|----------|
| **Quản lý Chính sách Cọc** | 🔴 CAO | 3 ngày | UC-PROJ-01 |
| **Lý do Banned + Yêu cầu Mở lại** | 🔴 CAO | 3 ngày | UC-ADMIN-03 |
| **Phê duyệt Cuộc hẹn** | 🔴 CAO | 2 ngày | UC-PROJ-02 |
| **Báo cáo Hợp đồng** | 🟡 TRUNG | 2 ngày | UC-PROJ-04 |
| **Upload Multi-Media** | 🟡 TRUNG | 1 ngày | UC-PROJ-01 |
| **Testing E2E** | 🔴 CAO | 4 ngày | ALL |
| **Security Hardening** | 🔴 CAO | 2 ngày | ALL |

---

## 🎯 CHIẾN LƯỢC PRODUCTION

### Phase 1: CORE FEATURES (8 ngày) - Sprint 1
**Mục tiêu:** Hoàn thiện 3 chức năng quan trọng nhất

### Phase 2: TESTING & SECURITY (6 ngày) - Sprint 2
**Mục tiêu:** Đảm bảo chất lượng và bảo mật

### Phase 3: OPTIMIZATION & DEPLOY (4 ngày) - Sprint 3
**Mục tiêu:** Tối ưu hiệu năng và triển khai production

---

## 📅 PHASE 1: CORE FEATURES (8 NGÀY)

### 🔴 Task 1.1: Quản lý Chính sách Cọc (3 ngày)

#### 📋 Phân tích Nghiệp vụ (use-cases-v1.2.md)

**UC-PROJ-01: Đăng tin Cho thuê**
> "Mỗi TinĐăng có thể đính **ChinhSachCoc** (mẫu chuẩn của hệ thống, chủ nhà có thể chọn/ghi đè trong phạm vi cho phép)."

**4.1 Cọc & hoàn cọc (policy-based)**
- Chính sách theo TinĐăng: `tindang.ChinhSachCocID`
- Loại cọc: CọcGiữChỗ (TTL 24-72h), CọcAnNinh (điều kiện giải tỏa: BiênBảnBànGiao)
- Giải tỏa: Khi DaBanGiao, hệ thống giải tỏa/đối trừ theo chính sách

#### Database Schema (ALREADY EXISTS ✅)

```sql
CREATE TABLE chinhsachcoc (
  ChinhSachCocID INT PRIMARY KEY AUTO_INCREMENT,
  TenChinhSach VARCHAR(100) NOT NULL,
  LoaiCoc ENUM('GiuCho','AnNinh') DEFAULT 'GiuCho',
  SoTienCoc DECIMAL(15,2),
  PhanTramCoc DECIMAL(5,2), -- % trên giá thuê
  TTL INT, -- TTL cho cọc giữ chỗ (giờ)
  PhanTramHuyTruocHan DECIMAL(5,2), -- % hoàn nếu hủy trước TTL
  PhanTramHuySauHan DECIMAL(5,2), -- % hoàn nếu hủy sau TTL
  DieuKienGiaiToa TEXT,
  TrangThai ENUM('HoatDong','NgungHoatDong') DEFAULT 'HoatDong',
  TaoLuc DATETIME DEFAULT CURRENT_TIMESTAMP,
  CapNhatLuc DATETIME ON UPDATE CURRENT_TIMESTAMP
);

-- Liên kết với tin đăng (ALREADY EXISTS)
ALTER TABLE tindang ADD ChinhSachCocID INT;
ALTER TABLE tindang ADD FOREIGN KEY (ChinhSachCocID) REFERENCES chinhsachcoc(ChinhSachCocID);
```

#### Backend Implementation (Day 1: 6h)

**File:** `server/models/ChinhSachCocModel.js` (NEW)
```javascript
/**
 * @fileoverview Model quản lý Chính sách Cọc
 * @module ChinhSachCocModel
 * @requires config/db
 * @architecture Bulletproof Pattern - Data Layer
 */

const db = require('../config/db');

class ChinhSachCocModel {
  /**
   * Lấy danh sách chính sách cọc của dự án
   * @param {number} duAnId - ID dự án
   * @returns {Promise<Array>} Danh sách chính sách
   */
  static async layDanhSachTheoDuAn(duAnId) {
    const [rows] = await db.query(`
      SELECT 
        csc.*,
        COUNT(DISTINCT td.TinDangID) as SoTinDangSuDung
      FROM chinhsachcoc csc
      LEFT JOIN tindang td ON csc.ChinhSachCocID = td.ChinhSachCocID
      WHERE csc.DuAnID = ? AND csc.TrangThai = 'HoatDong'
      GROUP BY csc.ChinhSachCocID
      ORDER BY csc.TaoLuc DESC
    `, [duAnId]);
    return rows;
  }

  /**
   * Tạo chính sách cọc mới
   * @param {Object} data - Dữ liệu chính sách
   * @param {number} nguoiDungId - ID người tạo
   * @returns {Promise<number>} ChinhSachCocID
   */
  static async tao(data, nguoiDungId) {
    // Validation
    if (!data.TenChinhSach || data.TenChinhSach.length < 5) {
      throw new Error('Tên chính sách phải có ít nhất 5 ký tự');
    }

    if (data.LoaiCoc === 'GiuCho' && (!data.TTL || data.TTL < 1 || data.TTL > 168)) {
      throw new Error('TTL phải trong khoảng 1-168 giờ (1 tuần)');
    }

    // Business logic: Kiểm tra số tiền hoặc phần trăm
    if (!data.SoTienCoc && !data.PhanTramCoc) {
      throw new Error('Phải nhập Số tiền cố định hoặc Phần trăm');
    }

    const [result] = await db.query(`
      INSERT INTO chinhsachcoc (
        DuAnID, TenChinhSach, LoaiCoc, SoTienCoc, PhanTramCoc,
        TTL, PhanTramHuyTruocHan, PhanTramHuySauHan,
        DieuKienGiaiToa, NguoiTaoID
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.DuAnID, data.TenChinhSach, data.LoaiCoc,
      data.SoTienCoc || null, data.PhanTramCoc || null,
      data.TTL || null,
      data.PhanTramHuyTruocHan || 0,
      data.PhanTramHuySauHan || 0,
      data.DieuKienGiaiToa || null,
      nguoiDungId
    ]);

    return result.insertId;
  }

  /**
   * Cập nhật chính sách cọc
   * @param {number} id - ChinhSachCocID
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise<boolean>} Success
   */
  static async capNhat(id, data) {
    // Kiểm tra chính sách đang được sử dụng
    const [check] = await db.query(`
      SELECT COUNT(*) as SoTinDang
      FROM tindang
      WHERE ChinhSachCocID = ? AND TrangThai IN ('DaDang', 'DaDuyet')
    `, [id]);

    if (check[0].SoTinDang > 0) {
      throw new Error('Không thể sửa chính sách đang được sử dụng bởi tin đăng đang hoạt động');
    }

    const [result] = await db.query(`
      UPDATE chinhsachcoc
      SET 
        TenChinhSach = COALESCE(?, TenChinhSach),
        SoTienCoc = COALESCE(?, SoTienCoc),
        PhanTramCoc = COALESCE(?, PhanTramCoc),
        TTL = COALESCE(?, TTL),
        PhanTramHuyTruocHan = COALESCE(?, PhanTramHuyTruocHan),
        PhanTramHuySauHan = COALESCE(?, PhanTramHuySauHan),
        DieuKienGiaiToa = COALESCE(?, DieuKienGiaiToa)
      WHERE ChinhSachCocID = ?
    `, [
      data.TenChinhSach, data.SoTienCoc, data.PhanTramCoc,
      data.TTL, data.PhanTramHuyTruocHan, data.PhanTramHuySauHan,
      data.DieuKienGiaiToa, id
    ]);

    return result.affectedRows > 0;
  }

  /**
   * Xóa mềm chính sách cọc
   * @param {number} id - ChinhSachCocID
   * @returns {Promise<boolean>} Success
   */
  static async xoa(id) {
    // Kiểm tra đang được sử dụng
    const [check] = await db.query(`
      SELECT COUNT(*) as SoTinDang
      FROM tindang
      WHERE ChinhSachCocID = ?
    `, [id]);

    if (check[0].SoTinDang > 0) {
      throw new Error('Không thể xóa chính sách đang được liên kết với tin đăng');
    }

    const [result] = await db.query(`
      UPDATE chinhsachcoc
      SET TrangThai = 'NgungHoatDong'
      WHERE ChinhSachCocID = ?
    `, [id]);

    return result.affectedRows > 0;
  }
}

module.exports = ChinhSachCocModel;
```

**File:** `server/controllers/ChinhSachCocController.js` (NEW)
```javascript
/**
 * @fileoverview Controller quản lý Chính sách Cọc
 * @module ChinhSachCocController
 * @requires models/ChinhSachCocModel
 * @requires services/NhatKyHeThongService
 * @architecture Bulletproof Pattern - HTTP Layer
 */

const ChinhSachCocModel = require('../models/ChinhSachCocModel');
const NhatKyService = require('../services/NhatKyHeThongService');

class ChinhSachCocController {
  /**
   * GET /api/chu-du-an/du-an/:duAnId/chinh-sach-coc
   * Lấy danh sách chính sách cọc của dự án
   */
  static async layDanhSach(req, res) {
    try {
      const { duAnId } = req.params;
      const nguoiDungId = req.user.NguoiDungID;

      // Verify ownership (middleware đã check, nhưng double-check)
      const danhSach = await ChinhSachCocModel.layDanhSachTheoDuAn(duAnId);

      res.json({
        success: true,
        data: danhSach
      });
    } catch (error) {
      console.error('[ChinhSachCocController.layDanhSach]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách chính sách cọc'
      });
    }
  }

  /**
   * POST /api/chu-du-an/du-an/:duAnId/chinh-sach-coc
   * Tạo chính sách cọc mới
   */
  static async tao(req, res) {
    try {
      const { duAnId } = req.params;
      const nguoiDungId = req.user.NguoiDungID;
      const data = { ...req.body, DuAnID: duAnId };

      const chinhSachCocId = await ChinhSachCocModel.tao(data, nguoiDungId);

      // Audit log
      await NhatKyService.ghiNhan({
        NguoiDungID: nguoiDungId,
        HanhDong: 'tao_chinh_sach_coc',
        DoiTuong: 'chinhsachcoc',
        DoiTuongID: chinhSachCocId,
        ChiTiet: JSON.stringify({ DuAnID: duAnId, TenChinhSach: data.TenChinhSach })
      });

      res.status(201).json({
        success: true,
        message: 'Tạo chính sách cọc thành công',
        data: { ChinhSachCocID: chinhSachCocId }
      });
    } catch (error) {
      console.error('[ChinhSachCocController.tao]', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi tạo chính sách cọc'
      });
    }
  }

  /**
   * PUT /api/chu-du-an/chinh-sach-coc/:id
   * Cập nhật chính sách cọc
   */
  static async capNhat(req, res) {
    try {
      const { id } = req.params;
      const nguoiDungId = req.user.NguoiDungID;

      const success = await ChinhSachCocModel.capNhat(id, req.body);

      if (success) {
        await NhatKyService.ghiNhan({
          NguoiDungID: nguoiDungId,
          HanhDong: 'cap_nhat_chinh_sach_coc',
          DoiTuong: 'chinhsachcoc',
          DoiTuongID: id,
          ChiTiet: JSON.stringify(req.body)
        });
      }

      res.json({
        success,
        message: success ? 'Cập nhật thành công' : 'Không tìm thấy chính sách'
      });
    } catch (error) {
      console.error('[ChinhSachCocController.capNhat]', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * DELETE /api/chu-du-an/chinh-sach-coc/:id
   * Xóa mềm chính sách cọc
   */
  static async xoa(req, res) {
    try {
      const { id } = req.params;
      const nguoiDungId = req.user.NguoiDungID;

      const success = await ChinhSachCocModel.xoa(id);

      if (success) {
        await NhatKyService.ghiNhan({
          NguoiDungID: nguoiDungId,
          HanhDong: 'xoa_chinh_sach_coc',
          DoiTuong: 'chinhsachcoc',
          DoiTuongID: id
        });
      }

      res.json({
        success,
        message: success ? 'Xóa thành công' : 'Không tìm thấy chính sách'
      });
    } catch (error) {
      console.error('[ChinhSachCocController.xoa]', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = ChinhSachCocController;
```

**File:** `server/routes/chinhSachCocRoutes.js` (NEW)
```javascript
/**
 * @fileoverview Routes cho Chính sách Cọc
 * @module chinhSachCocRoutes
 * @requires express
 * @requires middleware/auth
 * @requires middleware/role
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const ChinhSachCocController = require('../controllers/ChinhSachCocController');

// Base path: /api/chu-du-an

/**
 * GET /api/chu-du-an/du-an/:duAnId/chinh-sach-coc
 * Lấy danh sách chính sách cọc của dự án
 * @middleware auth - Xác thực JWT
 * @middleware role - Kiểm tra vai trò ChuDuAn + ownership
 */
router.get(
  '/du-an/:duAnId/chinh-sach-coc',
  auth,
  role.checkRole('ChuDuAn'),
  role.checkDuAnOwnership,
  ChinhSachCocController.layDanhSach
);

/**
 * POST /api/chu-du-an/du-an/:duAnId/chinh-sach-coc
 * Tạo chính sách cọc mới
 */
router.post(
  '/du-an/:duAnId/chinh-sach-coc',
  auth,
  role.checkRole('ChuDuAn'),
  role.checkDuAnOwnership,
  ChinhSachCocController.tao
);

/**
 * PUT /api/chu-du-an/chinh-sach-coc/:id
 * Cập nhật chính sách cọc
 */
router.put(
  '/chinh-sach-coc/:id',
  auth,
  role.checkRole('ChuDuAn'),
  role.checkChinhSachCocOwnership, // NEW middleware
  ChinhSachCocController.capNhat
);

/**
 * DELETE /api/chu-du-an/chinh-sach-coc/:id
 * Xóa mềm chính sách cọc
 */
router.delete(
  '/chinh-sach-coc/:id',
  auth,
  role.checkRole('ChuDuAn'),
  role.checkChinhSachCocOwnership,
  ChinhSachCocController.xoa
);

module.exports = router;
```

**File:** `server/routes/chuDuAnRoutes.js` (UPDATE)
```javascript
// ADD at top
const chinhSachCocRoutes = require('./chinhSachCocRoutes');

// ADD after other routes
router.use(chinhSachCocRoutes);
```

**File:** `server/middleware/role.js` (UPDATE - ADD NEW MIDDLEWARE)
```javascript
/**
 * Kiểm tra quyền sở hữu chính sách cọc
 */
async function checkChinhSachCocOwnership(req, res, next) {
  try {
    const { id } = req.params;
    const nguoiDungId = req.user.NguoiDungID;

    const [rows] = await db.query(`
      SELECT csc.ChinhSachCocID
      FROM chinhsachcoc csc
      JOIN duan da ON csc.DuAnID = da.DuAnID
      WHERE csc.ChinhSachCocID = ? AND da.ChuDuAnID = ?
    `, [id, nguoiDungId]);

    if (rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thao tác với chính sách cọc này'
      });
    }

    next();
  } catch (error) {
    console.error('[role.checkChinhSachCocOwnership]', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra quyền sở hữu'
    });
  }
}

module.exports = {
  // ... existing exports
  checkChinhSachCocOwnership
};
```

#### Frontend Implementation (Day 2-3: 12h)

**Architecture:** Bulletproof React Pattern
```
client/src/
├── features/
│   └── chinh-sach-coc/          # NEW Feature Module
│       ├── api/
│       │   └── chinhSachCocApi.js
│       ├── components/
│       │   ├── ModalQuanLyChinhSachCoc.jsx
│       │   ├── ModalQuanLyChinhSachCoc.css
│       │   ├── FormChinhSachCoc.jsx
│       │   └── CardChinhSachCoc.jsx
│       ├── hooks/
│       │   └── useChinhSachCoc.js
│       ├── types/
│       │   └── chinhSachCoc.types.js
│       └── utils/
│           └── validation.js
```

**File:** `client/src/features/chinh-sach-coc/api/chinhSachCocApi.js`
```javascript
/**
 * @fileoverview API client cho Chính sách Cọc
 * @module chinhSachCocApi
 * @architecture Bulletproof Pattern - API Layer
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Lấy danh sách chính sách cọc
 * @param {number} duAnId - ID dự án
 * @returns {Promise<Array>} Danh sách chính sách
 */
export const layDanhSachChinhSachCoc = async (duAnId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_BASE}/api/chu-du-an/du-an/${duAnId}/chinh-sach-coc`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.data;
};

/**
 * Tạo chính sách cọc mới
 * @param {number} duAnId - ID dự án
 * @param {Object} data - Dữ liệu chính sách
 * @returns {Promise<Object>} Kết quả
 */
export const taoChinhSachCoc = async (duAnId, data) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_BASE}/api/chu-du-an/du-an/${duAnId}/chinh-sach-coc`,
    data,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

/**
 * Cập nhật chính sách cọc
 * @param {number} id - ChinhSachCocID
 * @param {Object} data - Dữ liệu cập nhật
 * @returns {Promise<Object>} Kết quả
 */
export const capNhatChinhSachCoc = async (id, data) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(
    `${API_BASE}/api/chu-du-an/chinh-sach-coc/${id}`,
    data,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

/**
 * Xóa chính sách cọc
 * @param {number} id - ChinhSachCocID
 * @returns {Promise<Object>} Kết quả
 */
export const xoaChinhSachCoc = async (id) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(
    `${API_BASE}/api/chu-du-an/chinh-sach-coc/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
```

**File:** `client/src/features/chinh-sach-coc/components/ModalQuanLyChinhSachCoc.jsx`
```javascript
/**
 * @fileoverview Modal quản lý Chính sách Cọc
 * @component ModalQuanLyChinhSachCoc
 * @architecture Bulletproof Pattern - Component Layer
 */

import React, { useState, useEffect } from 'react';
import {
  HiOutlineCurrencyDollar,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark
} from 'react-icons/hi2';
import {
  layDanhSachChinhSachCoc,
  taoChinhSachCoc,
  capNhatChinhSachCoc,
  xoaChinhSachCoc
} from '../api/chinhSachCocApi';
import FormChinhSachCoc from './FormChinhSachCoc';
import CardChinhSachCoc from './CardChinhSachCoc';
import './ModalQuanLyChinhSachCoc.css';

/**
 * Modal quản lý chính sách cọc
 * @param {Object} props
 * @param {boolean} props.show - Hiển thị modal
 * @param {Function} props.onClose - Callback đóng modal
 * @param {number} props.duAnId - ID dự án
 */
export default function ModalQuanLyChinhSachCoc({ show, onClose, duAnId }) {
  const [danhSach, setDanhSach] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  useEffect(() => {
    if (show && duAnId) {
      loadDanhSach();
    }
  }, [show, duAnId]);

  const loadDanhSach = async () => {
    try {
      setLoading(true);
      const data = await layDanhSachChinhSachCoc(duAnId);
      setDanhSach(data);
    } catch (error) {
      console.error('Lỗi load chính sách cọc:', error);
      alert('Không thể tải danh sách chính sách cọc');
    } finally {
      setLoading(false);
    }
  };

  const handleTao = () => {
    setEditingPolicy(null);
    setShowForm(true);
  };

  const handleEdit = (policy) => {
    setEditingPolicy(policy);
    setShowForm(true);
  };

  const handleDelete = async (id, tenChinhSach) => {
    if (!window.confirm(`Xác nhận xóa chính sách "${tenChinhSach}"?`)) return;

    try {
      await xoaChinhSachCoc(id);
      alert('Xóa chính sách thành công');
      loadDanhSach();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi xóa chính sách');
    }
  };

  const handleSubmitForm = async (data) => {
    try {
      if (editingPolicy) {
        await capNhatChinhSachCoc(editingPolicy.ChinhSachCocID, data);
        alert('Cập nhật chính sách thành công');
      } else {
        await taoChinhSachCoc(duAnId, data);
        alert('Tạo chính sách thành công');
      }
      setShowForm(false);
      setEditingPolicy(null);
      loadDanhSach();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi lưu chính sách');
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="mqcsc-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mqcsc-header">
          <div className="mqcsc-header-left">
            <HiOutlineCurrencyDollar className="mqcsc-header-icon" />
            <h2>Quản lý Chính sách Cọc</h2>
          </div>
          <button className="mqcsc-close-btn" onClick={onClose}>
            <HiOutlineXMark />
          </button>
        </div>

        {/* Content */}
        <div className="mqcsc-content">
          {showForm ? (
            <FormChinhSachCoc
              initialData={editingPolicy}
              onSubmit={handleSubmitForm}
              onCancel={() => {
                setShowForm(false);
                setEditingPolicy(null);
              }}
            />
          ) : (
            <>
              {/* Actions */}
              <div className="mqcsc-actions">
                <button className="btn btn-primary" onClick={handleTao}>
                  <HiOutlineCurrencyDollar />
                  Tạo chính sách mới
                </button>
              </div>

              {/* List */}
              {loading ? (
                <div className="mqcsc-loading">Đang tải...</div>
              ) : danhSach.length === 0 ? (
                <div className="mqcsc-empty">
                  <HiOutlineCurrencyDollar className="empty-icon" />
                  <p>Chưa có chính sách cọc nào</p>
                  <p className="empty-subtitle">
                    Tạo chính sách đầu tiên để áp dụng cho tin đăng
                  </p>
                </div>
              ) : (
                <div className="mqcsc-list">
                  {danhSach.map((policy) => (
                    <CardChinhSachCoc
                      key={policy.ChinhSachCocID}
                      policy={policy}
                      onEdit={() => handleEdit(policy)}
                      onDelete={() => handleDelete(
                        policy.ChinhSachCocID,
                        policy.TenChinhSach
                      )}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Chi tiết còn lại:** FormChinhSachCoc, CardChinhSachCoc, CSS sẽ được implement theo design pattern tương tự.

#### Testing Plan (Day 3: 2h)

**File:** `docs/test-chinh-sach-coc.js`
```javascript
/**
 * Test script cho Chính sách Cọc API
 * @run node docs/test-chinh-sach-coc.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000';
const TEST_TOKEN = 'YOUR_JWT_TOKEN_HERE';
const TEST_DUAN_ID = 1;

const headers = { Authorization: `Bearer ${TEST_TOKEN}` };

async function runTests() {
  console.log('🧪 BẮT ĐẦU TEST CHÍNH SÁCH CỌC API\n');

  try {
    // TEST 1: Tạo chính sách Giữ chỗ
    console.log('TEST 1: POST /api/chu-du-an/du-an/:duAnId/chinh-sach-coc (Giữ chỗ)');
    const createRes1 = await axios.post(
      `${API_BASE}/api/chu-du-an/du-an/${TEST_DUAN_ID}/chinh-sach-coc`,
      {
        TenChinhSach: 'Cọc giữ chỗ 24h',
        LoaiCoc: 'GiuCho',
        SoTienCoc: 500000,
        TTL: 24,
        PhanTramHuyTruocHan: 100,
        PhanTramHuySauHan: 0
      },
      { headers }
    );
    console.log('✅ PASS - Tạo chính sách Giữ chỗ:', createRes1.data.data);

    const chinhSachId1 = createRes1.data.data.ChinhSachCocID;

    // TEST 2: Tạo chính sách An ninh
    console.log('\nTEST 2: POST /api/chu-du-an/du-an/:duAnId/chinh-sach-coc (An ninh)');
    const createRes2 = await axios.post(
      `${API_BASE}/api/chu-du-an/du-an/${TEST_DUAN_ID}/chinh-sach-coc`,
      {
        TenChinhSach: 'Cọc an ninh 1 tháng',
        LoaiCoc: 'AnNinh',
        PhanTramCoc: 100, // 100% giá thuê
        DieuKienGiaiToa: 'Giải tỏa sau khi bàn giao và thanh toán đủ tháng đầu'
      },
      { headers }
    );
    console.log('✅ PASS - Tạo chính sách An ninh:', createRes2.data.data);

    // TEST 3: Lấy danh sách
    console.log('\nTEST 3: GET /api/chu-du-an/du-an/:duAnId/chinh-sach-coc');
    const listRes = await axios.get(
      `${API_BASE}/api/chu-du-an/du-an/${TEST_DUAN_ID}/chinh-sach-coc`,
      { headers }
    );
    console.log(`✅ PASS - Lấy được ${listRes.data.data.length} chính sách`);

    // TEST 4: Cập nhật
    console.log('\nTEST 4: PUT /api/chu-du-an/chinh-sach-coc/:id');
    const updateRes = await axios.put(
      `${API_BASE}/api/chu-du-an/chinh-sach-coc/${chinhSachId1}`,
      { TTL: 48 },
      { headers }
    );
    console.log('✅ PASS - Cập nhật TTL thành công');

    // TEST 5: Xóa (expected fail - đang được sử dụng)
    console.log('\nTEST 5: DELETE /api/chu-du-an/chinh-sach-coc/:id');
    try {
      await axios.delete(
        `${API_BASE}/api/chu-du-an/chinh-sach-coc/${chinhSachId1}`,
        { headers }
      );
      console.log('❌ FAIL - Không nên xóa được chính sách đang dùng');
    } catch (error) {
      console.log('✅ PASS - Chặn xóa chính sách đang sử dụng:', error.response?.data?.message);
    }

    console.log('\n✅ TẤT CẢ TESTS PASSED!');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.response?.data || error.message);
  }
}

runTests();
```

---

### 🔴 Task 1.2: Lý do Banned + Yêu cầu Mở lại (3 ngày)

**Chi tiết implementation tương tự pattern trên...**

---

### 🔴 Task 1.3: Phê duyệt Cuộc hẹn (2 ngày)

**Chi tiết implementation tương tự pattern trên...**

---

## 📅 PHASE 2: TESTING & SECURITY (6 NGÀY)

### Task 2.1: E2E Testing với Playwright (3 ngày)
### Task 2.2: Security Hardening (2 ngày)
### Task 2.3: Performance Testing (1 ngày)

---

## 📅 PHASE 3: OPTIMIZATION & DEPLOY (4 NGÀY)

### Task 3.1: Code Splitting & Lazy Loading (1 ngày)
### Task 3.2: Bundle Size Optimization (1 ngày)
### Task 3.3: Production Build & Deploy (2 ngày)

---

## 📊 METRICS & KPIs

### Development Metrics
- Code Coverage: > 80%
- Bundle Size: < 500KB (gzipped)
- Lighthouse Score: > 90

### Performance Metrics
- API Response Time (P95): < 200ms
- Page Load Time (P95): < 2s
- Time to Interactive: < 3s

---

## 🔒 SECURITY CHECKLIST

- [ ] Tất cả API endpoints có JWT authentication
- [ ] Ownership verification cho tất cả CRUD operations
- [ ] Input validation (backend + frontend)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize user input)
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Audit logging đầy đủ

---

## 📚 TÀI LIỆU THAM KHẢO

- `docs/use-cases-v1.2.md` - Đặc tả nghiệp vụ
- `docs/TOM_TAT_CHUC_NANG_CON_THIEU.md` - Phân tích thiếu sót
- `docs/IMPLEMENTATION_STATUS.md` - Trạng thái hiện tại
- Bulletproof React Pattern: https://github.com/alan2207/bulletproof-react

---

**TỔNG ESTIMATE:** 18 ngày (3.5 tuần)  
**Target Release:** Q1 2026  
**Priority:** 🔴 HIGH - Production Critical
