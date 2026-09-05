const PublicTinDangModel = require("../models/PublicTinDangModel");
const ChuDuAnModel = require("../models/ChuDuAnModel");

class PublicTinDangController {
  static async getDanhSachTinDang(req, res) {
    try {
      const filters = {
        onlyPublic: req.query.onlyPublic,
        trangThai: req.query.trangThai,
        duAnId: req.query.duAnId,
        loaiGiaoDich: req.query.loaiGiaoDich,
        keyword: req.query.keyword,
        limit: req.query.limit,
        diaChi: req.query.diaChi,
        khuVucId: req.query.khuVucId || req.query.KhuVucID, // Hỗ trợ cả 2 format
        loaiBDS: req.query.loaiBDS,
        minGia: req.query.minGia,
        maxGia: req.query.maxGia,
        minDienTich: req.query.minDienTich,
        maxDienTich: req.query.maxDienTich,
        quanHuyen: req.query.quanHuyen || req.query.quan_huyen,
      };
      const data = await PublicTinDangModel.layTatCaTinDang(filters);
      return res.json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Lấy thống kê cho trang chủ (Public)
   * GET /api/public/tin-dang/stats
   */
  static async getThongKeTrangChu(req, res) {
    try {
      const stats = await PublicTinDangModel.layThongKeTrangChu();
      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('[PublicTinDangController] Lỗi lấy thống kê:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy chi tiết tin đăng công khai
   * GET /api/public/tin-dang/:id
   */
  static async getChiTietTinDang(req, res) {
    try {
      const tinDangId = parseInt(req.params.id, 10);
      
      if (!tinDangId) {
        return res.status(400).json({ 
          success: false, 
          message: 'ID tin đăng không hợp lệ' 
        });
      }

      const chiTiet = await PublicTinDangModel.layChiTietTinDang(tinDangId);
      
      if (!chiTiet) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy tin đăng' 
        });
      }

      return res.json({ 
        success: true, 
        data: chiTiet 
      });
    } catch (error) {
      console.error('[PublicTinDangController] Error getting detail:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  // PUT /api/public/tin-dang/:id (không cần auth)
  static async updateTinDang(req, res) {
    try {
      const tinDangId = parseInt(req.params.id, 10);

      // Lấy chuDuAnId từ body thay vì req.user
      const chuDuAnId = req.body.chuDuAnId;

      if (!tinDangId || !chuDuAnId) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Thiếu ID tin đăng hoặc chuDuAnId",
          });
      }

      const allowed = [
        "KhuVucID",
        "TieuDe",
        "URL",
        "MoTa",
        "TrangThai",
        "LyDoTuChoi",
        "PhongIDs",
      ];
      const updates = {};
      for (const k of allowed)
        if (req.body[k] !== undefined) updates[k] = req.body[k];

      if (Object.keys(updates).length === 0) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Không có trường hợp lệ để cập nhật",
          });
      }

      const result = await ChuDuAnModel.capNhatTinDang(
        tinDangId,
        chuDuAnId,
        updates
      );

      if (!result) {
        return res
          .status(404)
          .json({
            success: false,
            message: "Không tìm thấy tin đăng hoặc không có quyền",
          });
      }

      const chiTiet = await ChuDuAnModel.layChiTietTinDang(
        tinDangId,
        chuDuAnId
      );

      return res.json({
        success: true,
        data: chiTiet,
        message: "Cập nhật tin đăng thành công",
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // DELETE /api/public/tin-dang/:id (không cần auth)
  static async deleteTinDang(req, res) {
    try {
      const tinDangId = parseInt(req.params.id, 10);

      // Lấy chuDuAnId từ body thay vì req.user
      const chuDuAnId = req.body.chuDuAnId;
      const { lyDoXoa } = req.body || {};

      if (!tinDangId || !chuDuAnId) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Thiếu ID tin đăng hoặc chuDuAnId",
          });
      }

      const ok = await ChuDuAnModel.xoaTinDang(
        tinDangId,
        chuDuAnId,
        lyDoXoa || null
      );

      if (!ok) {
        return res
          .status(404)
          .json({
            success: false,
            message: "Không tìm thấy tin đăng hoặc không có quyền",
          });
      }

      return res.json({
        success: true,
        message: "Xóa (lưu trữ) tin đăng thành công",
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

    static async predictPrice(req, res) {
    try {
      const { dien_tich, so_phong_ngu, so_phong_tam, tinh_thanh, quan_huyen, loai_bds } = req.body;

      if (!dien_tich || parseFloat(dien_tich) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Thiếu diện tích sử dụng để định giá"
        });
      }

      const dt = parseFloat(dien_tich);
      const spn = parseInt(so_phong_ngu, 10) || 1;
      const spt = parseInt(so_phong_tam, 10) || 1;
      const tt = String(tinh_thanh || 'TP. Hồ Chí Minh').trim();
      const qh = String(quan_huyen || '').trim();
      const loai = String(loai_bds || 'CanHo').trim();

      let resultData = null;

      // 1. Thử gọi Flask API (ML Service)
      const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
      try {
        const response = await fetch(`${mlServiceUrl}/api/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dien_tich: dt,
            so_phong_ngu: spn,
            so_phong_tam: spt,
            tinh_thanh: tt,
            quan_huyen: qh,
            loai_bds: loai
          })
        });

        if (response.ok) {
          const json = await response.json();
          if (json?.success && json.data) {
            resultData = json.data;
          }
        }
      } catch (flaskErr) {
        console.warn("[PublicTinDangController] Flask ML service offline, using Node.js market model fallback");
      }

      // 2. Thuật toán định giá Heuristic Fallback nếu Flask ML service tạm thời ngắt kết nối
      if (!resultData) {
        let baseRatePerM2 = 45; // Triệu VNĐ / m2 trung bình
        const qhLower = qh.toLowerCase();
        const ttLower = tt.toLowerCase();

        // Ước lượng cơ bản dựa trên Tỉnh/Thành
        if (ttLower.includes('hồ chí minh') || ttLower.includes('hà nội')) {
            baseRatePerM2 = 50;
            if (qhLower.includes('quận 1') || qhLower.includes('quận 3') || qhLower.includes('hoàn kiếm')) baseRatePerM2 = 120;
            else if (qhLower.includes('quận 7') || qhLower.includes('cầu giấy') || qhLower.includes('bình thạnh')) baseRatePerM2 = 85;
            else if (qhLower.includes('quận 10') || qhLower.includes('hai bà trưng') || qhLower.includes('đống đa')) baseRatePerM2 = 95;
            else if (qhLower.includes('tân bình') || qhLower.includes('phú nhuận')) baseRatePerM2 = 75;
            else if (qhLower.includes('gò vấp') || qhLower.includes('quận 12') || qhLower.includes('hà đông')) baseRatePerM2 = 55;
            else if (qhLower.includes('bình tân') || qhLower.includes('hóc môn') || qhLower.includes('long biên')) baseRatePerM2 = 45;
        } else if (ttLower.includes('đà nẵng')) {
            baseRatePerM2 = 40;
            if (qhLower.includes('hải châu')) baseRatePerM2 = 80;
            else if (qhLower.includes('sơn trà')) baseRatePerM2 = 65;
        } else if (ttLower.includes('bình dương') || ttLower.includes('đồng nai')) {
            baseRatePerM2 = 30;
            if (qhLower.includes('dĩ an') || qhLower.includes('biên hòa') || qhLower.includes('thủ dầu một')) baseRatePerM2 = 45;
        }

        let typeMultiplier = 1.0;
        if (loai === 'NhaPho') typeMultiplier = 1.35;
        else if (loai === 'Biethu') typeMultiplier = 1.8;
        else if (loai === 'DatNen') typeMultiplier = 1.2;

        const estimatedPrice = Math.round(dt * baseRatePerM2 * typeMultiplier + (spn * 40) + (spt * 25));
        const minPrice = Math.round(estimatedPrice * 0.92);
        const maxPrice = Math.round(estimatedPrice * 1.08);

        resultData = {
          predicted_price: estimatedPrice,
          price_range_min: minPrice,
          price_range_max: maxPrice,
          currency: "triệu VNĐ",
          price_per_m2: Math.round((estimatedPrice / dt) * 10) / 10
        };
      }

      return res.json({
        success: true,
        data: resultData
      });
    } catch (error) {
      console.error("[PublicTinDangController] Error in predictPrice:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi xử lý định giá: " + error.message
      });
    }
  }
}

module.exports = PublicTinDangController;
