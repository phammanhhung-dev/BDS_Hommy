const Sepay = require('../services/sepayService');

(async () => {
  try {
    const data = await Sepay.listTransactions();
    console.log('SEPAY RAW RESPONSE:\n', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('SEPAY CALL ERROR:', err.response?.data || err.message || err);
  }
  process.exit(0);
})();