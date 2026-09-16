const db = require('../config/db');

/**
 * Service xử lý gợi ý Bất động sản (Personalized Recommendations)
 * 3 Tầng:
 * 1. User cá nhân hóa (dựa trên Tin đã lưu trong yeuthich, Cuộc hẹn cuochen, và lịch sử)
 * 2. Khách vãng lai (dựa trên recent_viewed_ids từ client: cùng khu vực, cùng phân khúc giá +-20%)
 * 3. Fallback dự phòng (Top 8 BĐS có lượt xem cao nhất / mới nhất)
 */
class RecommendationService {
  /**
   * Tạo bảng lichsuxem nếu chưa tồn tại (để theo dõi lịch sử xem của user)
   */
  static async initHistoryTable() {
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS lichsuxem (
          LichSuID INT AUTO_INCREMENT PRIMARY KEY,
          NguoiDungID INT NOT NULL,
          TinDangID INT NOT NULL,
          ThoiGian DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uk_user_tin (NguoiDungID, TinDangID),
          INDEX idx_user_time (NguoiDungID, ThoiGian DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    } catch (err) {
      console.warn('[RecommendationService] Init history table warning:', err.message);
    }
  }

  /**
   * Parse danh sách URL ảnh từ DB
   */
  static parseImages(urlRaw) {
    if (!urlRaw) return [];
    if (Array.isArray(urlRaw)) return urlRaw;
    if (typeof urlRaw === 'string') {
      const s = urlRaw.trim();
      if (s.startsWith('[') && s.endsWith(']')) {
        try {
          const parsed = JSON.parse(s);
          return Array.isArray(parsed) ? parsed : [s];
        } catch {
          return [s];
        }
      }
      return [s];
    }
    return [];
  }

  /**
   * Ghi nhận lượt xem tin đăng (tăng SoLuotXem trong thongketindang và ghi nhận vào lichsuxem nếu có userId)
   */
  static async recordListingView(tinDangId, userId = null) {
    if (!tinDangId) return;
    try {
      // 1. Tăng số lượt xem trong thongketindang cho ngày hôm nay
      await db.execute(`
        INSERT INTO thongketindang (TinDangID, Ky, SoLuotXem, SoYeuThich, SoCuocHen, SoHopDong)
        VALUES (?, CURRENT_DATE, 1, 0, 0, 0)
        ON DUPLICATE KEY UPDATE SoLuotXem = SoLuotXem + 1, CapNhatLuc = CURRENT_TIMESTAMP
      `, [tinDangId]);

      // 2. Nếu có user, lưu vào bảng lichsuxem
      if (userId) {
        await db.execute(`
          INSERT INTO lichsuxem (NguoiDungID, TinDangID, ThoiGian)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON DUPLICATE KEY UPDATE ThoiGian = CURRENT_TIMESTAMP
        `, [userId, tinDangId]);
      }
    } catch (err) {
      console.warn('[RecommendationService] Error recording listing view:', err.message);
    }
  }

  /**
   * Helper query lấy thông tin cơ bản của danh sách BĐS đang hoạt động
   */
  static getBaseSelectQuery(whereClause = '1=1', orderBy = 'td.TaoLuc DESC', limit = 8) {
    return `
      SELECT
        td.TinDangID, td.DuAnID, td.KhuVucID, td.ChinhSachCocID, td.ChuDuAnID,
        td.TieuDe, td.URL, td.MoTa, td.TienIch, td.LoaiGiaoDich, td.LoaiBDS, td.GiaTien,
        td.DienTichDat, td.DienTichSuDung, td.SoTang, td.SoPhongNgu, td.SoPhongTam, td.Huong,
        td.TrangThai, td.TaoLuc, td.CapNhatLuc,
        COALESCE(
          td.GiaTien,
          (SELECT MIN(COALESCE(pt.GiaTinDang, p.GiaChuan)) FROM phong_tindang pt JOIN phong p ON pt.PhongID = p.PhongID WHERE pt.TinDangID = td.TinDangID),
          0
        ) AS Gia,
        COALESCE(
          td.DienTichSuDung,
          td.DienTichDat,
          (SELECT MIN(COALESCE(pt.DienTichTinDang, p.DienTichChuan)) FROM phong_tindang pt JOIN phong p ON pt.PhongID = p.PhongID WHERE pt.TinDangID = td.TinDangID),
          0
        ) AS DienTich,
        da.TenDuAn,
        COALESCE(da.DiaChi, CONCAT_WS(', ', COALESCE(nc.CommuneName, lc.CommuneName), ndist.DistrictName, nprov.ProvinceName), kv.TenKhuVuc) AS DiaChi,
        COALESCE(nc.CommuneName, lc.CommuneName, kv.TenKhuVuc) AS TenKhuVuc,
        ndist.DistrictName AS TenQuanHuyen,
        nprov.ProvinceName AS TenTinh,
        ndist.DistrictID AS QuanHuyenID,
        nprov.ProvinceID AS TinhThanhID,
        COALESCE((SELECT SUM(tk.SoLuotXem) FROM thongketindang tk WHERE tk.TinDangID = td.TinDangID), 0) AS TongLuotXem,
        COALESCE((SELECT COUNT(*) FROM yeuthich yt WHERE yt.TinDangID = td.TinDangID), 0) AS TongYeuThich
      FROM tindang td
      LEFT JOIN duan da ON td.DuAnID = da.DuAnID
      LEFT JOIN khuvuc kv ON td.KhuVucID = kv.KhuVucID
      LEFT JOIN new_communes nc ON td.KhuVucID = nc.CommuneID
      LEFT JOIN legacy_communes lc ON td.KhuVucID = lc.CommuneID
      LEFT JOIN new_districts ndist ON COALESCE(nc.DistrictID, lc.DistrictID) = ndist.DistrictID
      LEFT JOIN legacy_provinces nprov ON ndist.ProvinceID = nprov.ProvinceID
      WHERE td.TrangThai IN ('DaDuyet', 'DaDang') AND (${whereClause})
      ORDER BY ${orderBy}
      LIMIT ${parseInt(limit, 10) || 8}
    `;
  }

  /**
   * Lấy danh sách ID các tin đã lưu của user
   */
  static async getUserSavedIds(userId) {
    if (!userId) return [];
    try {
      const [rows] = await db.execute(
        'SELECT TinDangID FROM yeuthich WHERE NguoiDungID = ?',
        [userId]
      );
      return rows.map(r => r.TinDangID);
    } catch {
      return [];
    }
  }

  /**
   * TẦNG 1: Gợi ý cho người dùng đã đăng nhập (dựa vào yeuthich, cuochen, lichsuxem)
   */
  static async getRecommendationsForUser(userId, limit = 8) {
    try {
      // 1. Lấy thông tin từ tin đã lưu (yeuthich)
      const [favRows] = await db.execute(`
        SELECT td.TinDangID, td.KhuVucID, td.LoaiBDS,
          COALESCE(td.GiaTien, (SELECT MIN(COALESCE(pt.GiaTinDang, p.GiaChuan)) FROM phong_tindang pt JOIN phong p ON pt.PhongID = p.PhongID WHERE pt.TinDangID = td.TinDangID), 0) as Gia,
          COALESCE(nc.DistrictID, lc.DistrictID, ndist.DistrictID) as DistrictID
        FROM yeuthich y
        JOIN tindang td ON y.TinDangID = td.TinDangID
        LEFT JOIN new_communes nc ON td.KhuVucID = nc.CommuneID
        LEFT JOIN legacy_communes lc ON td.KhuVucID = lc.CommuneID
        LEFT JOIN new_districts ndist ON COALESCE(nc.DistrictID, lc.DistrictID) = ndist.DistrictID
        WHERE y.NguoiDungID = ?
        ORDER BY td.CapNhatLuc DESC LIMIT 15
      `, [userId]);

      // 2. Lấy thông tin từ các cuộc hẹn đã đặt (cuochen)
      const [chRows] = await db.execute(`
        SELECT td.TinDangID, td.KhuVucID, td.LoaiBDS,
          COALESCE(td.GiaTien, (SELECT MIN(COALESCE(pt.GiaTinDang, p.GiaChuan)) FROM phong_tindang pt JOIN phong p ON pt.PhongID = p.PhongID WHERE pt.TinDangID = td.TinDangID), 0) as Gia,
          COALESCE(nc.DistrictID, lc.DistrictID, ndist.DistrictID) as DistrictID
        FROM cuochen ch
        JOIN tindang td ON ch.TinDangID = td.TinDangID
        LEFT JOIN new_communes nc ON td.KhuVucID = nc.CommuneID
        LEFT JOIN legacy_communes lc ON td.KhuVucID = lc.CommuneID
        LEFT JOIN new_districts ndist ON COALESCE(nc.DistrictID, lc.DistrictID) = ndist.DistrictID
        WHERE ch.KhachHangID = ?
        ORDER BY ch.TaoLuc DESC LIMIT 15
      `, [userId]);

      // 3. Lấy thông tin từ lịch sử xem (lichsuxem) nếu bảng đã tồn tại
      let viewRows = [];
      try {
        const [views] = await db.execute(`
          SELECT td.TinDangID, td.KhuVucID, td.LoaiBDS,
            COALESCE(td.GiaTien, (SELECT MIN(COALESCE(pt.GiaTinDang, p.GiaChuan)) FROM phong_tindang pt JOIN phong p ON pt.PhongID = p.PhongID WHERE pt.TinDangID = td.TinDangID), 0) as Gia,
            COALESCE(nc.DistrictID, lc.DistrictID, ndist.DistrictID) as DistrictID
          FROM lichsuxem lx
          JOIN tindang td ON lx.TinDangID = td.TinDangID
          LEFT JOIN new_communes nc ON td.KhuVucID = nc.CommuneID
          LEFT JOIN legacy_communes lc ON td.KhuVucID = lc.CommuneID
          LEFT JOIN new_districts ndist ON COALESCE(nc.DistrictID, lc.DistrictID) = ndist.DistrictID
          WHERE lx.NguoiDungID = ?
          ORDER BY lx.ThoiGian DESC LIMIT 15
        `, [userId]);
        viewRows = views;
      } catch (e) {
        // Table may not have data yet, ignore
      }

      const allInteractions = [...favRows, ...chRows, ...viewRows];
      if (allInteractions.length === 0) {
        return null; // Không đủ dữ liệu sở thích, chuyển sang tầng khác
      }

      // Tổng hợp sở thích
      const interactedIds = new Set(allInteractions.map(r => r.TinDangID));
      const districtCounts = {};
      const khuVucCounts = {};
      const loaiBdsCounts = {};
      const validPrices = [];

      allInteractions.forEach(item => {
        if (item.DistrictID) districtCounts[item.DistrictID] = (districtCounts[item.DistrictID] || 0) + 1;
        if (item.KhuVucID) khuVucCounts[item.KhuVucID] = (khuVucCounts[item.KhuVucID] || 0) + 1;
        if (item.LoaiBDS) loaiBdsCounts[item.LoaiBDS] = (loaiBdsCounts[item.LoaiBDS] || 0) + 1;
        const priceNum = Number(item.Gia);
        if (priceNum > 0) validPrices.push(priceNum);
      });

      // Tìm khu vực và loại BĐS nổi trội
      const topDistricts = Object.keys(districtCounts).sort((a, b) => districtCounts[b] - districtCounts[a]).slice(0, 3).map(Number);
      const topKhuVucIds = Object.keys(khuVucCounts).sort((a, b) => khuVucCounts[b] - khuVucCounts[a]).slice(0, 3).map(Number);
      const topLoaiBDS = Object.keys(loaiBdsCounts).sort((a, b) => loaiBdsCounts[b] - loaiBdsCounts[a]).slice(0, 2);

      let minBudget = 0;
      let maxBudget = Infinity;
      if (validPrices.length > 0) {
        const sortedPrices = [...validPrices].sort((a, b) => a - b);
        const median = sortedPrices[Math.floor(sortedPrices.length / 2)];
        minBudget = median * 0.75;
        maxBudget = median * 1.25;
      }

      // Truy vấn danh sách ứng viên (loại trừ các tin đã xem/lưu nếu còn nhiều tin)
      const query = this.getBaseSelectQuery('1=1', 'td.TaoLuc DESC', 80);
      const [candidates] = await db.execute(query);

      // Chấm điểm từng tin đăng theo hồ sơ sở thích của User
      const scored = candidates.map(listing => {
        let score = 0;
        let reasons = [];
        let badges = [];

        const price = Number(listing.Gia) || 0;
        const distId = listing.QuanHuyenID;
        const kvId = listing.KhuVucID;
        const loai = listing.LoaiBDS;

        // Tránh trùng các tin đã tương tác (nếu có đủ tin khác)
        if (interactedIds.has(listing.TinDangID)) {
          score -= 40;
        }

        // Điểm khu vực
        if (topKhuVucIds.includes(kvId)) {
          score += 45;
          reasons.push("Đúng khu vực bạn thường xem");
          badges.push("Gần bạn");
        } else if (topDistricts.includes(distId)) {
          score += 35;
          reasons.push("Cùng quận huyện bạn quan tâm");
          badges.push("Gần bạn");
        }

        // Điểm giá tiền (+-25%)
        if (price > 0 && price >= minBudget && price <= maxBudget) {
          score += 30;
          reasons.push("Mức giá phù hợp ngân sách");
          badges.push("Giá tốt");
        }

        // Điểm loại BĐS
        if (topLoaiBDS.includes(loai)) {
          score += 20;
          reasons.push("Loại BĐS bạn tìm kiếm");
        }

        // Điểm phổ biến (lượt xem / yêu thích)
        const views = Number(listing.TongLuotXem) || 0;
        const favs = Number(listing.TongYeuThich) || 0;
        if (views > 0 || favs > 0) {
          score += Math.min(15, Math.floor(views / 5) + favs * 2);
        }

        let primaryBadge = "Phù hợp với bạn";
        if (badges.includes("Gần bạn") && badges.includes("Giá tốt")) {
          primaryBadge = "Phù hợp nhất";
        } else if (badges.includes("Gần bạn")) {
          primaryBadge = "Gần bạn";
        } else if (badges.includes("Giá tốt")) {
          primaryBadge = "Giá tốt";
        } else if (views >= 10) {
          primaryBadge = "Xu hướng";
        }

        return {
          ...listing,
          URL: this.parseImages(listing.URL),
          recommendScore: score,
          recommendBadge: primaryBadge,
          recommendReason: reasons.join(" • ") || "Gợi ý dựa trên hồ sơ sở thích của bạn"
        };
      });

      // Lấy danh sách điểm cao nhất
      scored.sort((a, b) => b.recommendScore - a.recommendScore || new Date(b.TaoLuc) - new Date(a.TaoLuc));
      return scored.slice(0, limit);
    } catch (err) {
      console.error('[RecommendationService] Error in getRecommendationsForUser:', err);
      return null;
    }
  }

  /**
   * TẦNG 2: Gợi ý cho Khách vãng lai (dựa trên recent_viewed_ids)
   * Tìm BĐS cùng khu vực và cùng phân khúc giá (+-20%)
   */
  static async getRecommendationsForGuest(recentViewedIds = [], limit = 8) {
    if (!Array.isArray(recentViewedIds) || recentViewedIds.length === 0) {
      return null;
    }

    try {
      const cleanIds = recentViewedIds
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id) && id > 0)
        .slice(0, 10);

      if (cleanIds.length === 0) return null;

      const placeholders = cleanIds.map(() => '?').join(',');
      const [viewedRows] = await db.execute(`
        SELECT td.TinDangID, td.KhuVucID, td.LoaiBDS,
          COALESCE(td.GiaTien, (SELECT MIN(COALESCE(pt.GiaTinDang, p.GiaChuan)) FROM phong_tindang pt JOIN phong p ON pt.PhongID = p.PhongID WHERE pt.TinDangID = td.TinDangID), 0) as Gia,
          COALESCE(nc.DistrictID, lc.DistrictID, ndist.DistrictID) as DistrictID,
          ndist.DistrictName
        FROM tindang td
        LEFT JOIN new_communes nc ON td.KhuVucID = nc.CommuneID
        LEFT JOIN legacy_communes lc ON td.KhuVucID = lc.CommuneID
        LEFT JOIN new_districts ndist ON COALESCE(nc.DistrictID, lc.DistrictID) = ndist.DistrictID
        WHERE td.TinDangID IN (${placeholders})
      `, cleanIds);

      if (viewedRows.length === 0) return null;

      // Tính toán khu vực và khoảng giá mục tiêu (+-20%)
      const khuVucIds = [...new Set(viewedRows.map(r => r.KhuVucID).filter(Boolean))];
      const districtIds = [...new Set(viewedRows.map(r => r.DistrictID).filter(Boolean))];
      const prices = viewedRows.map(r => Number(r.Gia)).filter(p => p > 0);
      const loaiBdsList = [...new Set(viewedRows.map(r => r.LoaiBDS).filter(Boolean))];

      let minPrice = 0;
      let maxPrice = Infinity;
      if (prices.length > 0) {
        const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        minPrice = avgPrice * 0.8; // -20%
        maxPrice = avgPrice * 1.2; // +20%
      }

      // Lấy danh sách ứng viên
      const query = this.getBaseSelectQuery('1=1', 'td.TaoLuc DESC', 80);
      const [candidates] = await db.execute(query);

      const scored = candidates.map(listing => {
        let score = 0;
        let reasons = [];
        let badges = [];

        const isViewed = cleanIds.includes(listing.TinDangID);
        if (isViewed) {
          score -= 50; // Ưu tiên khám phá BĐS mới ngoài những tin đã xem
        }

        const price = Number(listing.Gia) || 0;
        const distId = listing.QuanHuyenID;
        const kvId = listing.KhuVucID;
        const loai = listing.LoaiBDS;

        // Tiêu chí 1: Cùng khu vực / cùng quận huyện
        if (kvId && khuVucIds.includes(kvId)) {
          score += 50;
          reasons.push("Cùng khu vực với tin đã xem");
          badges.push("Gần bạn");
        } else if (distId && districtIds.includes(distId)) {
          score += 40;
          reasons.push("Cùng quận với tin đã xem");
          badges.push("Gần bạn");
        }

        // Tiêu chí 2: Cùng phân khúc giá (+-20%)
        if (price > 0 && price >= minPrice && price <= maxPrice) {
          score += 35;
          reasons.push("Cùng phân khúc giá (±20%)");
          badges.push("Giá tốt");
        }

        // Tiêu chí 3: Cùng loại BĐS
        if (loai && loaiBdsList.includes(loai)) {
          score += 20;
          reasons.push("Cùng loại bất động sản");
        }

        // Tiêu chí 4: Lượt xem phổ biến
        const views = Number(listing.TongLuotXem) || 0;
        score += Math.min(10, Math.floor(views / 10));

        let primaryBadge = "Phù hợp với bạn";
        if (badges.includes("Gần bạn") && badges.includes("Giá tốt")) {
          primaryBadge = "Phù hợp nhất";
        } else if (badges.includes("Gần bạn")) {
          primaryBadge = "Gần bạn";
        } else if (badges.includes("Giá tốt")) {
          primaryBadge = "Giá tốt";
        } else if (views >= 10) {
          primaryBadge = "Xu hướng";
        }

        return {
          ...listing,
          URL: this.parseImages(listing.URL),
          recommendScore: score,
          recommendBadge: primaryBadge,
          recommendReason: reasons.join(" • ") || "Gợi ý dựa trên tin bạn vừa xem gần đây"
        };
      });

      scored.sort((a, b) => b.recommendScore - a.recommendScore || new Date(b.TaoLuc) - new Date(a.TaoLuc));
      
      // Lọc các tin có điểm dương (có yếu tố liên quan)
      const relevant = scored.filter(item => item.recommendScore > 0);
      return (relevant.length >= 4 ? relevant : scored).slice(0, limit);
    } catch (err) {
      console.error('[RecommendationService] Error in getRecommendationsForGuest:', err);
      return null;
    }
  }

  /**
   * TẦNG 3: Dự phòng Fallback (Top BĐS có lượt xem cao nhất / mới nhất)
   */
  static async getFallbackRecommendations(limit = 8, excludeIds = []) {
    try {
      let whereClause = "1=1";
      if (Array.isArray(excludeIds) && excludeIds.length > 0) {
        const cleanExclude = excludeIds.map(Number).filter(n => !isNaN(n) && n > 0);
        if (cleanExclude.length > 0) {
          whereClause = `td.TinDangID NOT IN (${cleanExclude.join(',')})`;
        }
      }

      // Sắp xếp ưu tiên: Lượt xem cao nhất từ thongketindang, sau đó đến TaoLuc DESC
      const query = this.getBaseSelectQuery(
        whereClause,
        'TongLuotXem DESC, TongYeuThich DESC, td.TaoLuc DESC',
        limit
      );
      const [rows] = await db.execute(query);

      return rows.map((listing, index) => {
        let badge = "Thịnh hành";
        if (index === 0) badge = "Xem nhiều nhất";
        else if (index === 1) badge = "Nổi bật";
        else if (index % 2 === 0) badge = "Giá tốt";
        else badge = "Xu hướng";

        return {
          ...listing,
          URL: this.parseImages(listing.URL),
          recommendBadge: badge,
          recommendReason: "Bất động sản được nhiều người quan tâm nhất hôm nay"
        };
      });
    } catch (err) {
      console.error('[RecommendationService] Error in getFallbackRecommendations:', err);
      return [];
    }
  }

  /**
   * Hàm điều phối chính (Orchestrator): Kết hợp cả 3 tầng để luôn trả về danh sách gợi ý tốt nhất
   */
  static async getRecommendations({ userId = null, recentViewedIds = [], limit = 8 }) {
    const targetLimit = parseInt(limit, 10) || 8;
    let results = [];
    let strategy = 'fallback';

    // Khởi tạo bảng lịch sử nếu chưa có
    await this.initHistoryTable();

    // 1. Thử Tầng 1: Đăng nhập
    if (userId) {
      const userRecs = await this.getRecommendationsForUser(userId, targetLimit);
      if (userRecs && userRecs.length > 0) {
        results = userRecs;
        strategy = 'user';
      }
    }

    // 2. Thử Tầng 2: Khách vãng lai có recent_viewed_ids (nếu chưa có kết quả)
    if (results.length < targetLimit && Array.isArray(recentViewedIds) && recentViewedIds.length > 0) {
      const guestRecs = await this.getRecommendationsForGuest(recentViewedIds, targetLimit - results.length);
      if (guestRecs && guestRecs.length > 0) {
        if (results.length === 0) {
          results = guestRecs;
          strategy = 'guest';
        } else {
          // Gộp thêm và tránh trùng ID
          const existingIds = new Set(results.map(r => r.TinDangID));
          guestRecs.forEach(r => {
            if (!existingIds.has(r.TinDangID) && results.length < targetLimit) {
              results.push(r);
              existingIds.add(r.TinDangID);
            }
          });
        }
      }
    }

    // 3. Thử Tầng 3: Fallback Top xem nhiều nhất nếu chưa đủ limit
    if (results.length < targetLimit) {
      const existingIds = results.map(r => r.TinDangID);
      const fallbackRecs = await this.getFallbackRecommendations(targetLimit - results.length, existingIds);
      if (results.length === 0) {
        results = fallbackRecs;
        strategy = 'fallback';
      } else {
        const existingSet = new Set(existingIds);
        fallbackRecs.forEach(r => {
          if (!existingSet.has(r.TinDangID) && results.length < targetLimit) {
            results.push(r);
            existingSet.add(r.TinDangID);
          }
        });
      }
    }

    // 4. Nếu có userId, kiểm tra xem tin nào user đã yêu thích để hiển thị icon trái tim đỏ
    if (userId && results.length > 0) {
      const savedIds = await this.getUserSavedIds(userId);
      const savedSet = new Set(savedIds);
      results = results.map(item => ({
        ...item,
        isFavorite: savedSet.has(item.TinDangID)
      }));
    } else {
      results = results.map(item => ({
        ...item,
        isFavorite: false
      }));
    }

    return {
      success: true,
      strategy,
      total: results.length,
      data: results
    };
  }
}

module.exports = RecommendationService;
