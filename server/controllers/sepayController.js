const Sepay = require('../services/sepayService');

exports.getTransactions = async (req, res) => {
  try {
    const params = req.query || {};
    const data = await Sepay.listTransactions(params);
    return res.status(200).json({
      message: 'Lấy lịch sử giao dịch thành công !',
      metadata: data
    });
  } catch (err) {
    console.error('SEPAY error:', err.message || err);
    const status = err.response?.status || 500;
    const details = err.response?.data || { message: err.message };
    return res.status(status).json({
      error: 'Lấy lịch sử giao dịch thất bại',
      details
    });
  }
};