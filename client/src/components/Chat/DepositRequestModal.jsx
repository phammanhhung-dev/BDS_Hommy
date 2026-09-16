/**
 * @fileoverview Deposit Request Modal Component
 * @component DepositRequestModal
 */

import React, { useState } from 'react';
import { HiOutlineXMark, HiOutlineCurrencyDollar } from 'react-icons/hi2';
import './DepositRequestModal.css';

export const DepositRequestModal = ({ isOpen, onClose, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    
    // We create a special JSON payload
    const payload = JSON.stringify({
      type: 'DEPOSIT_REQUEST',
      amount: Number(amount),
      note: note.trim()
    });

    onSubmit(payload);
    setAmount('');
    setNote('');
    onClose();
  };

  const formatCurrency = (val) => {
    if (!val) return '';
    const num = val.replace(/\D/g, '');
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setAmount(rawValue);
  };

  return (
    <div className="deposit-modal-overlay" onClick={onClose}>
      <div className="deposit-modal-content" onClick={e => e.stopPropagation()}>
        <div className="deposit-modal-header">
          <h3><HiOutlineCurrencyDollar className="icon" /> Tạo Yêu Cầu Đặt Cọc</h3>
          <button className="close-btn" onClick={onClose}>
            <HiOutlineXMark />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="deposit-modal-form">
          <div className="form-group">
            <label>Số tiền cọc (VNĐ) <span className="required">*</span></label>
            <input
              type="text"
              value={formatCurrency(amount)}
              onChange={handleAmountChange}
              placeholder="VD: 5,000,000"
              required
            />
          </div>

          <div className="form-group">
            <label>Ghi chú (Tùy chọn)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Cọc giữ chỗ phòng 101..."
              rows={3}
            />
          </div>

          <div className="deposit-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-submit" disabled={!amount || Number(amount) <= 0}>
              Gửi yêu cầu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepositRequestModal;
