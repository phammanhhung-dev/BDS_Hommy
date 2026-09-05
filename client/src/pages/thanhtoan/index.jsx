import React, { useEffect, useState } from 'react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import thanhtoanApi from '../../api/thanhtoanApi';
import './thanhtoan.css';

function ThanhToan() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await thanhtoanApi.getTransactions();
      console.log('[ThanhToan] api res:', res?.data);

      // backend may return array or wrapped object
      let txs = [];
      if (Array.isArray(res.data)) {
        txs = res.data;
      } else if (Array.isArray(res?.data?.metadata?.transactions)) {
        txs = res.data.metadata.transactions;
      } else if (Array.isArray(res?.data?.transactions)) {
        txs = res.data.transactions;
      } else {
        // fallback: if metadata contains something else
        txs = [];
      }

      // normalize fields to expected names for UI
      const normalized = txs.map(t => ({
        id: t.sepay_id ?? t.id ?? t.reference_number ?? '',
        bank_brand_name: t.bank_brand_name ?? t.bank_name ?? t.bankName ?? '',
        account_number: t.account_number ?? t.accountNumber ?? t.account ?? '',
        transaction_date: t.transaction_date ?? t.transactionDate ?? '',
        amount_in: t.amount_in ?? t.amountIn ?? '0.00',
        amount_out: t.amount_out ?? t.amountOut ?? '0.00',
        accumulated: t.accumulated ?? t.balance ?? '0.00',
        transaction_content: t.transaction_content ?? t.transactionContent ?? '',
        reference_number: t.reference_number ?? t.ref ?? '',
        raw: t,
      }));

      setTransactions(normalized);
    } catch (err) {
      console.error('Lỗi lấy giao dịch:', err);
      setError('Không thể tải lịch sử giao dịch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="thanhtoan-page">
      <Header />
      <div className="container content-thanhtoan">
        <h3>Lịch sử giao dịch</h3>

        {loading && <div className="tt-loading">Đang tải...</div>}
        {error && <div className="tt-error">{error}</div>}

        {!loading && !error && (
          <div className="tt-table-wrap">
            <table className="tt-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ngân hàng</th>
                  <th>Số tài khoản</th>
                  <th>Ngày</th>
                  <th>Tiền vào</th>
                  <th>Tiền ra</th>
                  <th>Số dư</th>
                  <th>Nội dung</th>
                  <th>Ref</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan="9" className="no-data">Chưa có giao dịch</td></tr>
                ) : transactions.map(tx => (
                  <tr key={tx.id || tx.reference_number}>
                    <td>{tx.id}</td>
                    <td>{tx.bank_brand_name}</td>
                    <td>{tx.account_number}</td>
                    <td>{tx.transaction_date}</td>
                    <td className="num">{tx.amount_in}</td>
                    <td className="num">{tx.amount_out}</td>
                    <td className="num">{tx.accumulated}</td>
                    <td>{tx.transaction_content}</td>
                    <td>{tx.reference_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default ThanhToan;