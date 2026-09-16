const jwt = require('jsonwebtoken');
const RecommendationService = require('../services/recommendationService');

class RecommendationController {
  /**
   * Helper trích xuất userId từ header Authorization nếu có Bearer token
   */
  static extractUserIdFromToken(req) {
    try {
      const authHeader = req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          if (decoded && decoded.userId) {
            return parseInt(decoded.userId, 10);
          }
        }
      }
    } catch {
      // Token không hợp lệ hoặc hết hạn, coi như khách vãng lai
    }
    return null;
  }

  /**
   * GET /api/properties/recommended
   * GET /api/public/tin-dang/recommended
   * Query params:
   * - userId: number (tùy chọn, nếu không gửi thì đọc từ Bearer token)
   * - recent_viewed_ids: string comma-separated (vd: "76,78,12") hoặc array JSON
   * - limit: number (mặc định 8)
   */
  static async getRecommended(req, res) {
    try {
      // 1. Xác định userId (ưu tiên token > req.user > query)
      let userId = req.user?.id || req.user?.userId;
      if (!userId) {
        userId = RecommendationController.extractUserIdFromToken(req);
      }
      if (!userId && req.query.userId) {
        const parsed = parseInt(req.query.userId, 10);
        if (!isNaN(parsed) && parsed > 0) {
          userId = parsed;
        }
      }

      // 2. Parse recent_viewed_ids
      let recentViewedIds = [];
      const rawRecent = req.query.recent_viewed_ids || req.query.recentViewedIds;
      if (rawRecent) {
        if (Array.isArray(rawRecent)) {
          recentViewedIds = rawRecent.map(Number).filter(n => !isNaN(n) && n > 0);
        } else if (typeof rawRecent === 'string') {
          const trimmed = rawRecent.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
              const parsedArr = JSON.parse(trimmed);
              if (Array.isArray(parsedArr)) {
                recentViewedIds = parsedArr.map(Number).filter(n => !isNaN(n) && n > 0);
              }
            } catch {
              recentViewedIds = trimmed.replace(/[\[\]]/g, '').split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n) && n > 0);
            }
          } else {
            recentViewedIds = trimmed.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n) && n > 0);
          }
        }
      }

      // 3. Giới hạn số lượng
      const limit = parseInt(req.query.limit, 10) || 8;

      // 4. Lấy danh sách gợi ý
      const result = await RecommendationService.getRecommendations({
        userId,
        recentViewedIds,
        limit
      });

      return res.json(result);
    } catch (error) {
      console.error('[RecommendationController] Lỗi lấy BĐS gợi ý:', error);
      return res.status(500).json({
        success: false,
        message: 'Không thể tải danh sách bất động sản gợi ý',
        error: error.message
      });
    }
  }

  /**
   * POST /api/properties/:id/view
   * Ghi nhận lượt xem tin đăng (client có thể gọi chủ động)
   */
  static async trackView(req, res) {
    try {
      const tinDangId = parseInt(req.params.id, 10);
      if (!tinDangId) {
        return res.status(400).json({ success: false, message: 'ID tin đăng không hợp lệ' });
      }

      let userId = req.user?.id || req.user?.userId || RecommendationController.extractUserIdFromToken(req);
      if (!userId && req.body?.userId) {
        userId = parseInt(req.body.userId, 10) || null;
      }

      await RecommendationService.recordListingView(tinDangId, userId);

      return res.json({ success: true, message: 'Đã ghi nhận lượt xem' });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = RecommendationController;
