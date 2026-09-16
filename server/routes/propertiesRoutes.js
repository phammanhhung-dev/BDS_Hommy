const express = require('express');
const router = express.Router();
const RecommendationController = require('../controllers/recommendationController');

/**
 * GET /api/properties/recommended
 * Lấy danh sách bất động sản gợi ý cho người dùng / khách vãng lai
 */
router.get('/recommended', RecommendationController.getRecommended);

/**
 * POST /api/properties/:id/view
 * Ghi nhận lượt xem tin đăng
 */
router.post('/:id/view', RecommendationController.trackView);

module.exports = router;
