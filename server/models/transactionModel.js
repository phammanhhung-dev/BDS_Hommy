const db = require('../config/db');

exports.existsByReference = (reference_number) => {
  if (!reference_number) return Promise.resolve([[]]);
  return db.query('SELECT 1 FROM transactions WHERE reference_number = ? LIMIT 1', [reference_number]);
};

exports.existsByKeyFields = (account_number, amount_in, transaction_date) => {
  // dùng để dedupe khi không có reference_number
  return db.query(
    'SELECT 1 FROM transactions WHERE account_number = ? AND amount_in = ? AND transaction_date = ? LIMIT 1',
    [account_number || null, amount_in, transaction_date || null]
  );
};

exports.insertTransaction = (tx) => {
  const sql = `
    INSERT INTO transactions
      (user_id, sepay_id, bank_name, bank_brand_name, account_number,
       amount_out, amount_in, accumulated, transaction_content, transaction_date,
       reference_number, code, sub_account, bank_account_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    tx.user_id || null,
    tx.sepay_id || null,
    tx.bank_name || null,
    tx.bank_brand_name || null,
    tx.account_number || null,
    tx.amount_out != null ? tx.amount_out : null,
    tx.amount_in != null ? tx.amount_in : null,
    tx.accumulated != null ? tx.accumulated : null,
    tx.transaction_content || null,
    tx.transaction_date || null,
    tx.reference_number || null,
    tx.code || null,
    tx.sub_account || null,
    tx.bank_account_id || null
  ];
  return db.query(sql, params);
};

exports.getAll = (opts = {}) => {
  return db.query(
    `SELECT id, user_id, bank_brand_name, account_number,
            amount_out, amount_in, accumulated, transaction_content,
            transaction_date, reference_number, code
     FROM transactions ORDER BY transaction_date DESC, id DESC`
  );
};

exports.getById = (id) => {
  return db.query(
    `SELECT id, user_id, bank_brand_name, account_number,
            amount_out, amount_in, accumulated, transaction_content,
            transaction_date, reference_number, code
     FROM transactions WHERE id = ? LIMIT 1`,
    [id]
  );
};

exports.updateTransaction = (id, updates) => {
  const keys = Object.keys(updates);
  if (keys.length === 0) return Promise.resolve();
  const set = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => updates[k]);
  const sql = `UPDATE transactions SET ${set} WHERE id = ?`;
  return db.query(sql, [...values, id]);
};

exports.deleteTransaction = (id) => {
  return db.query('DELETE FROM transactions WHERE id = ?', [id]);
};