const Sepay = require('./sepayService');
const Transaction = require('../models/transactionModel');

const mapSepayToTx = (item) => {
  // debug: in raw item để kiểm tra chính xác payload
 

  return {
    sepay_id: item.id || item.sepay_id || null,
    // nếu API trả bank_brand_name nhưng bạn muốn lưu vào bank_name, dùng fallback
    bank_name: item.bank_name || item.bank_brand_name || null,
    bank_brand_name: item.bank_brand_name || item.bank_brand || null,
    account_number: item.account_number || item.account || null,
    amount_out: item.amount_out != null ? parseFloat(item.amount_out) : null,
    amount_in: item.amount_in != null ? parseFloat(item.amount_in) : (item.amount != null ? parseFloat(item.amount) : null),
    accumulated: item.accumulated != null ? parseFloat(item.accumulated) : null,
    transaction_content: item.transaction_content || item.note || null,
    transaction_date: item.transaction_date || item.date || null,
    reference_number: item.reference_number || item.ref || null,
    code: item.code || null,
    sub_account: item.sub_account || null,
    bank_account_id: item.bank_account_id || null
  };
};

const safeGetItems = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.transactions)) return data.transactions;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [];
};

exports.syncOnce = async (opts = {}) => {
  const stats = { total: 0, inserted: 0, skipped: 0, errors: 0 };
  try {
    
    const data = await Sepay.listTransactions(opts);
    const items = safeGetItems(data);
    

    for (const it of items) {
      stats.total++;
      const tx = mapSepayToTx(it);
      // normalize date to MySQL DATETIME
      if (tx.transaction_date) {
        const d = new Date(tx.transaction_date);
        if (!isNaN(d)) tx.transaction_date = d.toISOString().slice(0, 19).replace('T', ' ');
      }

      try {
        let exists = false;
        if (tx.reference_number) {
          const [r] = await Transaction.existsByReference(tx.reference_number);
          exists = Array.isArray(r) ? r.length > 0 : (r && r.length > 0);
        } else {
          const [r] = await Transaction.existsByKeyFields(tx.account_number, tx.amount_in, tx.transaction_date);
          exists = Array.isArray(r) ? r.length > 0 : (r && r.length > 0);
        }

        if (exists) {
          stats.skipped++;
          
          continue;
        }

        await Transaction.insertTransaction(tx);
        stats.inserted++;
        
      } catch (err) {
        stats.errors++;
        
      }
    }
  } catch (err) {
    
    throw err;
  }
  
  return stats;
};

let _intervalHandle = null;
exports.startPolling = (intervalMs = 60000) => {
  exports.syncOnce().catch(err => console.error('sepay initial sync failed', err));
  if (_intervalHandle) clearInterval(_intervalHandle);
  _intervalHandle = setInterval(() => {
    exports.syncOnce().catch(err => console.error('sepay sync failed', err));
  }, intervalMs);
};
exports.stopPolling = () => { if (_intervalHandle) clearInterval(_intervalHandle); _intervalHandle = null; };