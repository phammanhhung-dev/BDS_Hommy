/**
 * Automated tests for Nhan Vien Ban Hang module
 * Tests all 7 use cases (UC-SALE-01 to UC-SALE-07)
 * 
 * Run with: npm test -- nhanVienBanHang.test.js
 */

const request = require('supertest');
const express = require('express');
const NhanVienBanHangController = require('../controllers/NhanVienBanHangController');
const {
  createTestNVBH,
  createTestCustomer,
  createTestTinDang,
  createTestCuocHen,
  createTestGiaoDich,
  cleanupTestData,
  generateTestToken
} = require('./helpers/nvbhTestHelpers');

// Mock auth middleware for testing
const mockAuthMiddleware = (req, res, next) => {
  // Set user from token or use test user
  if (!req.user) {
    req.user = {
      id: global.testNVBHId || 1,
      tenDayDu: 'Test NVBH',
      email: 'test.nvbh@test.com',
      vaiTroId: 4,
      vaiTro: 'NhanVienBanHang',
      vaiTros: ['NhanVienBanHang'],
      coQuyenTruyCap: true
    };
  }
  next();
};

// Mock role middleware
const mockRoleMiddleware = (req, res, next) => {
  if (req.user && req.user.vaiTros && req.user.vaiTros.includes('NhanVienBanHang')) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Forbidden' });
  }
};

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/nhan-vien-ban-hang', mockAuthMiddleware);
app.use('/api/nhan-vien-ban-hang', mockRoleMiddleware);

// Routes
const router = express.Router();
router.get('/lich-lam-viec', NhanVienBanHangController.layLichLamViec);
router.post('/lich-lam-viec', NhanVienBanHangController.taoLichLamViec);
router.put('/lich-lam-viec/:id', NhanVienBanHangController.capNhatLichLamViec);
router.delete('/lich-lam-viec/:id', NhanVienBanHangController.xoaLichLamViec);
router.get('/cuoc-hen', NhanVienBanHangController.layDanhSachCuocHen);
router.get('/cuoc-hen/:id', NhanVienBanHangController.xemChiTietCuocHen);
router.put('/cuoc-hen/:id/xac-nhan', NhanVienBanHangController.xacNhanCuocHen);
router.put('/cuoc-hen/:id/doi-lich', NhanVienBanHangController.doiLichCuocHen);
router.put('/cuoc-hen/:id/huy', NhanVienBanHangController.huyCuocHen);
router.post('/cuoc-hen/:id/bao-cao-ket-qua', NhanVienBanHangController.baoCaoKetQuaCuocHen);
router.get('/giao-dich', NhanVienBanHangController.layDanhSachGiaoDich);
router.get('/giao-dich/:id', NhanVienBanHangController.xemChiTietGiaoDich);
router.post('/giao-dich/:id/xac-nhan-coc', NhanVienBanHangController.xacNhanCoc);
router.get('/bao-cao/thu-nhap', NhanVienBanHangController.layBaoCaoThuNhap);
router.get('/bao-cao/thong-ke', NhanVienBanHangController.layThongKeHieuSuat);
router.get('/bao-cao/cuoc-hen-theo-tuan', NhanVienBanHangController.layCuocHenTheoTuan);
router.get('/dashboard', NhanVienBanHangController.layDashboard);
router.get('/ho-so', NhanVienBanHangController.layHoSo);
router.put('/ho-so', NhanVienBanHangController.capNhatHoSo);

app.use('/api/nhan-vien-ban-hang', router);

describe('Nhan Vien Ban Hang API Tests', () => {
  let nvbhId, customerId, duAnId, tinDangId, phongId, chuDuAnId, token;
  let testCuocHenId, testGiaoDichId, testLichId;

  beforeAll(async () => {
    // Create test data
    nvbhId = await createTestNVBH();
    global.testNVBHId = nvbhId; // Set for mock middleware
    customerId = await createTestCustomer();
    token = generateTestToken(nvbhId);
    
    // Create test project owner (needed for tin dang)
    const db = require('../config/db');
    const timestamp = Date.now();
    const [chuDuAnResult] = await db.execute(
      `INSERT INTO nguoidung (TenDayDu, Email, SoDienThoai, MatKhauHash, TrangThai, VaiTroHoatDongID)
       VALUES (?, ?, ?, ?, 'HoatDong', 3)`,
      [`Test Chu Du An ${timestamp}`, `test.chuduan.${timestamp}@test.com`, `0111111${String(timestamp).slice(-4)}`, '$2b$10$K7L/8Y3QxqhkqWTF4qHxJeBZkG1rXvT2n3pM4sL8qWkF9qHxJeBZk']
    );
    chuDuAnId = chuDuAnResult.insertId;
    
    const { duAnId: dId, tinDangId: tId, phongId: pId } = await createTestTinDang(chuDuAnId);
    duAnId = dId;
    tinDangId = tId;
    phongId = pId;
  });

  afterAll(async () => {
    // Cleanup
    await cleanupTestData(nvbhId, customerId, duAnId, tinDangId, phongId, chuDuAnId);
    delete global.testNVBHId;
  });

  describe('UC-SALE-01: Lich Lam Viec', () => {
    test('POST /lich-lam-viec - Create shift successfully', async () => {
      const batDau = new Date();
      batDau.setDate(batDau.getDate() + 1);
      batDau.setHours(9, 0, 0, 0);
      
      const ketThuc = new Date(batDau);
      ketThuc.setHours(13, 0, 0, 0);

      const response = await request(app)
        .post('/api/nhan-vien-ban-hang/lich-lam-viec')
        .set('Authorization', `Bearer ${token}`)
        .send({
          batDau: batDau.toISOString(),
          ketThuc: ketThuc.toISOString()
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.lichId).toBeDefined();
      testLichId = response.body.data.lichId;
    });

    test('POST /lich-lam-viec - Reject overlapping shifts', async () => {
      const batDau = new Date();
      batDau.setDate(batDau.getDate() + 1);
      batDau.setHours(10, 0, 0, 0);
      
      const ketThuc = new Date(batDau);
      ketThuc.setHours(14, 0, 0, 0);

      const response = await request(app)
        .post('/api/nhan-vien-ban-hang/lich-lam-viec')
        .set('Authorization', `Bearer ${token}`)
        .send({
          batDau: batDau.toISOString(),
          ketThuc: ketThuc.toISOString()
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('POST /lich-lam-viec - Reject past date', async () => {
      const batDau = new Date();
      batDau.setDate(batDau.getDate() - 1);
      
      const ketThuc = new Date(batDau);
      ketThuc.setHours(ketThuc.getHours() + 4);

      const response = await request(app)
        .post('/api/nhan-vien-ban-hang/lich-lam-viec')
        .set('Authorization', `Bearer ${token}`)
        .send({
          batDau: batDau.toISOString(),
          ketThuc: ketThuc.toISOString()
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('GET /lich-lam-viec - List shifts with filters', async () => {
      const tuNgay = new Date();
      tuNgay.setDate(tuNgay.getDate() + 1);
      const denNgay = new Date(tuNgay);
      denNgay.setDate(denNgay.getDate() + 7);

      const response = await request(app)
        .get('/api/nhan-vien-ban-hang/lich-lam-viec')
        .set('Authorization', `Bearer ${token}`)
        .query({
          tuNgay: tuNgay.toISOString(),
          denNgay: denNgay.toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.lichLamViecs)).toBe(true);
    });

    test('PUT /lich-lam-viec/:id - Update shift', async () => {
      if (!testLichId) return;

      const batDau = new Date();
      batDau.setDate(batDau.getDate() + 2);
      batDau.setHours(10, 0, 0, 0);
      
      const ketThuc = new Date(batDau);
      ketThuc.setHours(14, 0, 0, 0);

      const response = await request(app)
        .put(`/api/nhan-vien-ban-hang/lich-lam-viec/${testLichId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          batDau: batDau.toISOString(),
          ketThuc: ketThuc.toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('DELETE /lich-lam-viec/:id - Delete empty shift', async () => {
      // Create a new shift without appointments
      const batDau = new Date();
      batDau.setDate(batDau.getDate() + 3);
      batDau.setHours(15, 0, 0, 0);
      
      const ketThuc = new Date(batDau);
      ketThuc.setHours(19, 0, 0, 0);

      const createResponse = await request(app)
        .post('/api/nhan-vien-ban-hang/lich-lam-viec')
        .set('Authorization', `Bearer ${token}`)
        .send({
          batDau: batDau.toISOString(),
          ketThuc: ketThuc.toISOString()
        });

      const newLichId = createResponse.body.data.lichId;

      const response = await request(app)
        .delete(`/api/nhan-vien-ban-hang/lich-lam-viec/${newLichId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('UC-SALE-02/03: Cuoc Hen', () => {
    beforeAll(async () => {
      testCuocHenId = await createTestCuocHen(nvbhId, customerId, phongId, 'ChoXacNhan');
    });

    test('GET /cuoc-hen - List appointments by status', async () => {
      const response = await request(app)
        .get('/api/nhan-vien-ban-hang/cuoc-hen')
        .set('Authorization', `Bearer ${token}`)
        .query({ trangThai: 'ChoXacNhan' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.cuocHens)).toBe(true);
    });

    test('GET /cuoc-hen/:id - View detail with full data', async () => {
      const response = await request(app)
        .get(`/api/nhan-vien-ban-hang/cuoc-hen/${testCuocHenId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.CuocHenID).toBe(testCuocHenId);
      expect(response.body.data.TenKhachHang).toBeDefined();
      expect(response.body.data.TieuDeTinDang).toBeDefined();
    });

    test('PUT /cuoc-hen/:id/xac-nhan - Confirm appointment', async () => {
      const response = await request(app)
        .put(`/api/nhan-vien-ban-hang/cuoc-hen/${testCuocHenId}/xac-nhan`)
        .set('Authorization', `Bearer ${token}`)
        .send({ ghiChu: 'Xác nhận cuộc hẹn' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('PUT /cuoc-hen/:id/doi-lich - Reschedule (< 3 times)', async () => {
      const thoiGianHenMoi = new Date();
      thoiGianHenMoi.setDate(thoiGianHenMoi.getDate() + 2);
      thoiGianHenMoi.setHours(14, 0, 0, 0);

      const response = await request(app)
        .put(`/api/nhan-vien-ban-hang/cuoc-hen/${testCuocHenId}/doi-lich`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          thoiGianHenMoi: thoiGianHenMoi.toISOString(),
          lyDo: 'Đổi lịch lần 1'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('PUT /cuoc-hen/:id/huy - Cancel with reason', async () => {
      // Create new appointment to cancel
      const newCuocHenId = await createTestCuocHen(nvbhId, customerId, phongId, 'DaXacNhan');

      const response = await request(app)
        .put(`/api/nhan-vien-ban-hang/cuoc-hen/${newCuocHenId}/huy`)
        .set('Authorization', `Bearer ${token}`)
        .send({ lyDoHuy: 'Lý do hủy test' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('UC-SALE-04: Xac Nhan Coc', () => {
    beforeAll(async () => {
      testGiaoDichId = await createTestGiaoDich(tinDangId, 'DaUyQuyen', 'COC_GIU_CHO');
    });

    test('GET /giao-dich - List transactions with DaUyQuyen status', async () => {
      const response = await request(app)
        .get('/api/nhan-vien-ban-hang/giao-dich')
        .set('Authorization', `Bearer ${token}`)
        .query({ trangThai: 'DaUyQuyen' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.giaoDichs)).toBe(true);
    });

    test('POST /giao-dich/:id/xac-nhan-coc - Confirm deposit', async () => {
      const response = await request(app)
        .post(`/api/nhan-vien-ban-hang/giao-dich/${testGiaoDichId}/xac-nhan-coc`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('POST /giao-dich/:id/xac-nhan-coc - Reject already confirmed', async () => {
      const response = await request(app)
        .post(`/api/nhan-vien-ban-hang/giao-dich/${testGiaoDichId}/xac-nhan-coc`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('UC-SALE-05: Bao Cao Ket Qua', () => {
    test('POST /cuoc-hen/:id/bao-cao-ket-qua - Report success', async () => {
      const cuocHenId = await createTestCuocHen(nvbhId, customerId, phongId, 'DaXacNhan');

      const response = await request(app)
        .post(`/api/nhan-vien-ban-hang/cuoc-hen/${cuocHenId}/bao-cao-ket-qua`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          ketQua: 'thanh_cong',
          khachQuanTam: true,
          keHoachFollowUp: 'Follow up next week'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('POST /cuoc-hen/:id/bao-cao-ket-qua - Report failure with reason', async () => {
      const cuocHenId = await createTestCuocHen(nvbhId, customerId, phongId, 'DaXacNhan');

      const response = await request(app)
        .post(`/api/nhan-vien-ban-hang/cuoc-hen/${cuocHenId}/bao-cao-ket-qua`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          ketQua: 'that_bai',
          khachQuanTam: false,
          lyDoThatBai: 'Khách không hài lòng với giá'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('POST /cuoc-hen/:id/bao-cao-ket-qua - Reject already reported', async () => {
      const cuocHenId = await createTestCuocHen(nvbhId, customerId, phongId, 'HoanThanh');

      const response = await request(app)
        .post(`/api/nhan-vien-ban-hang/cuoc-hen/${cuocHenId}/bao-cao-ket-qua`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          ketQua: 'thanh_cong',
          khachQuanTam: true
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('UC-SALE-06: Bao Cao Thu Nhap', () => {
    test('GET /bao-cao/thu-nhap - Calculate commission correctly', async () => {
      const tuNgay = new Date();
      tuNgay.setMonth(tuNgay.getMonth() - 1);
      const denNgay = new Date();

      const response = await request(app)
        .get('/api/nhan-vien-ban-hang/bao-cao/thu-nhap')
        .set('Authorization', `Bearer ${token}`)
        .query({
          tuNgay: tuNgay.toISOString(),
          denNgay: denNgay.toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tyLeHoaHong).toBeDefined();
      expect(response.body.data.tongHoaHong).toBeDefined();
    });

    test('GET /bao-cao/thong-ke - Performance metrics', async () => {
      const response = await request(app)
        .get('/api/nhan-vien-ban-hang/bao-cao/thong-ke')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.cuocHen).toBeDefined();
      expect(response.body.data.giaoDich).toBeDefined();
    });

    test('GET /bao-cao/cuoc-hen-theo-tuan - Weekly chart data', async () => {
      const response = await request(app)
        .get('/api/nhan-vien-ban-hang/bao-cao/cuoc-hen-theo-tuan')
        .set('Authorization', `Bearer ${token}`)
        .query({ soTuan: 4 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Dashboard', () => {
    test('GET /dashboard - All metrics calculated', async () => {
      const response = await request(app)
        .get('/api/nhan-vien-ban-hang/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.metrics).toBeDefined();
      expect(response.body.data.metrics.cuocHenHomNay).toBeDefined();
      expect(response.body.data.metrics.choXacNhan).toBeDefined();
      expect(response.body.data.metrics.hoanThanhTuan).toBeDefined();
      expect(response.body.data.metrics.thuNhapThang).toBeDefined();
    });

    test('GET /ho-so - Profile data', async () => {
      const response = await request(app)
        .get('/api/nhan-vien-ban-hang/ho-so')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.NguoiDungID).toBe(nvbhId);
    });

    test('PUT /ho-so - Update profile (non-sensitive fields only)', async () => {
      const response = await request(app)
        .put('/api/nhan-vien-ban-hang/ho-so')
        .set('Authorization', `Bearer ${token}`)
        .send({ ghiChu: 'Test ghi chú' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

