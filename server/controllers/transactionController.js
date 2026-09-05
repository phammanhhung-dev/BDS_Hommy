const Transaction = require('../models/transactionModel');

const normalize = (p = {}) => ({
  user_id: p.user_id || p.userId || null,
  sepay_id: p.id || p.sepay_id || null,
  bank_name: p.bank_name || p.bankBrandName || null,
  bank_brand_name: p.bank_brand_name || null,
  account_number: p.account_number || p.accountNumber || null,
  amount_out: p.amount_out != null ? parseFloat(p.amount_out) : (p.amountOut != null ? parseFloat(p.amountOut) : null),
  amount_in: p.amount_in != null ? parseFloat(p.amount_in) : (p.amountIn != null ? parseFloat(p.amountIn) : null),
  accumulated: p.accumulated != null ? parseFloat(p.accumulated) : null,
  transaction_content: p.transaction_content || p.transactionContent || null,
  transaction_date: p.transaction_date || p.transactionDate || null,
  reference_number: p.reference_number || p.ref || null,
  code: p.code || null,
  sub_account: p.sub_account || null,
  bank_account_id: p.bank_account_id || p.bankAccountId || null
});

exports.create = async (req, res) => {
  try {
    const payload = req.body.transaction || req.body.data || req.body || {};
    const tx = normalize(payload);
    const [result] = await Transaction.insertTransaction(tx);
    return res.status(201).json({ id: result.insertId, ...tx });
  } catch (err) {
    console.error('create transaction error', err);
    return res.status(500).json({ error: 'Lỗi hệ thống' });
  }
};

exports.list = async (req, res) => {
  try {
    const [rows] = await Transaction.getAll();
    return res.status(200).json(rows);
  } catch (err) {
    console.error('list transactions error', err);
    return res.status(500).json({ error: 'Lỗi hệ thống' });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await Transaction.getById(id);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error('get transaction error', err);
    return res.status(500).json({ error: 'Lỗi hệ thống' });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const allowed = ['user_id','bank_brand_name','account_number','amount_out','amount_in','accumulated','transaction_content','transaction_date','reference_number','code'];
    const updates = {};
    const payload = req.body || {};
    for (const k of allowed) if (payload[k] !== undefined) updates[k] = payload[k];
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update' });
    await Transaction.updateTransaction(id, updates);
    const [rows] = await Transaction.getById(id);
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error('update transaction error', err);
    return res.status(500).json({ error: 'Lỗi hệ thống' });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    await Transaction.deleteTransaction(id);
    return res.status(204).send();
  } catch (err) {
    console.error('delete transaction error', err);
    return res.status(500).json({ error: 'Lỗi hệ thống' });
  }
};