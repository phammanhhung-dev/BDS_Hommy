const KhuVucSyncService = require('../services/khuVucSyncService');

exports.syncKhuVuc = async (req, res) => {
  try {
    const { source, replace = false, verbose = false } = req.body || {};

    const stats = await KhuVucSyncService.syncFromDvhcvn({
      source: source || null,
      replace: Boolean(replace),
      verbose: Boolean(verbose)
    });

    res.json({
      success: true,
      message: 'Đã đồng bộ dữ liệu khu vực thành công',
      stats
    });
  } catch (error) {
    console.error('[khuVucSyncController] Lỗi đồng bộ khu vực:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đồng bộ dữ liệu khu vực',
      error: error.message
    });
  }
};