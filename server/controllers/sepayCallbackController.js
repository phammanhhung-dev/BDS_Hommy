const Transaction = require('../models/transactionModel');

// simple in-memory store (dev only)
const _store = [];
const MAX_STORE = 50;

exports.callback = async (req, res) => {
  try {
    const payload = req.body || {};
    // lưu vào store để inspect
    _store.unshift({ at: new Date().toISOString(), payload });
    if (_store.length > MAX_STORE) _store.pop();

    // map và insert transaction nếu cần (giữ như hiện hành)
    const tx = {
      user_id: payload.user_id || null,
      sepay_id: payload.id || payload.sepay_id || null,
      bank_name: payload.bank_name || payload.bank_brand_name || null,
      bank_brand_name: payload.bank_brand_name || payload.bank_brand || null,
      account_number: payload.account_number || payload.account || null,
      amount_out: payload.amount_out != null ? parseFloat(payload.amount_out) : null,
      amount_in: payload.amount_in != null ? parseFloat(payload.amount_in) : (payload.amount != null ? parseFloat(payload.amount) : null),
      accumulated: payload.accumulated != null ? parseFloat(payload.accumulated) : null,
      transaction_content: payload.transaction_content || payload.note || payload.description || null,
      transaction_date: payload.transaction_date || payload.date || null,
      reference_number: payload.reference_number || payload.ref || null,
      code: payload.code || null,
      sub_account: payload.sub_account || null,
      bank_account_id: payload.bank_account_id || null
    };

    // insert (model nên dùng ON DUPLICATE hoặc xử lý NULL keys)
    await Transaction.insertTransaction(tx).catch(err => {
      console.error('[sepayCallback] insert error', err.message || err);
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[sepayCallback] error:', err.message || err);
    return res.status(500).json({ success: false, error: 'Lỗi hệ thống' });
  }
};

exports.listCallbacks = (req, res) => {
  // trả JSON các callback đã lưu (dev)
  return res.json({ total: _store.length, items: _store });
};