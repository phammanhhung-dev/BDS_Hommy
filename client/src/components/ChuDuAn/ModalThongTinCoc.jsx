import React from 'react';
import { HiOutlineXMark, HiOutlineCurrencyDollar, HiOutlineInformationCircle } from 'react-icons/hi2';
import './DetailModal.css';
import { Utils } from '../../services/ChuDuAnService';

function ModalThongTinCoc({ isOpen, projectName, stats, onClose }) {
  if (!isOpen) {
    return null;
  }

  const {
    CocDangHieuLuc = 0,
    CocDangHieuLucGiuCho = 0,
    CocDangHieuLucAnNinh = 0,
    CocHetHan = 0,
    CocDaGiaiToa = 0,
    CocDaDoiTru = 0,
    TongTienCocDangHieuLuc = 0
  } = stats || {};

  const formattedAmount = Utils.formatCurrency(TongTienCocDangHieuLuc || 0);

  const handleOverlayClick = (event) => {
    if (event.target.classList.contains('detail-modal-overlay')) {
      onClose?.();
    }
  };

  return (
    <div className="detail-modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className="detail-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="detail-modal-header">
          <div>
            <h2>Chi tiết giao dịch cọc</h2>
            <p>{projectName ? `Dự án: ${projectName}` : 'Tổng quan trạng thái cọc hiện tại'}</p>
          </div>
          <button type="button" className="detail-modal-close" onClick={onClose} aria-label="Đóng">
            <HiOutlineXMark size={18} />
          </button>
        </div>

        <div className="detail-modal-body">
          <div className="detail-modal-notice" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <HiOutlineInformationCircle size={18} style={{ marginTop: 2 }} />
            <div>
              Số liệu được tổng hợp từ các giao dịch cọc giữ chỗ và cọc an ninh đang gắn với các tin đăng thuộc dự án.
            </div>
          </div>

          <div className="detail-modal-grid">
            <div className="detail-modal-field">
              <label>Đơn cọc đang hiệu lực</label>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#7c3aed' }}>{CocDangHieuLuc}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                Giữ chỗ {CocDangHieuLucGiuCho} • Cọc an ninh {CocDangHieuLucAnNinh}
              </div>
            </div>

            <div className="detail-modal-field">
              <label>Tổng tiền cọc đang giữ</label>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f766e', display: 'flex', gap: 6 }}>
                <HiOutlineCurrencyDollar />
                {formattedAmount}
              </div>
            </div>

            <div className="detail-modal-field">
              <label>Hoàn tất / giải tỏa</label>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                Hết hạn: <strong>{CocHetHan}</strong> • Giải tỏa: <strong>{CocDaGiaiToa}</strong> • Đối trừ:{' '}
                <strong>{CocDaDoiTru}</strong>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ margin: '12px 0 6px', fontSize: '1rem', color: '#1f2937' }}>Gợi ý hành động</h3>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#4b5563', fontSize: '0.85rem' }}>
              <li>Kiểm tra các đơn cọc sắp hết hạn để kịp thời xử lý.</li>
              <li>Đảm bảo quy trình giải tỏa cọc rõ ràng cho cả giữ chỗ và cọc an ninh.</li>
              <li>Kết hợp báo cáo tài chính để theo dõi dòng tiền liên quan đến cọc.</li>
            </ul>
          </div>

          <div className="detail-modal-footer">
            <button type="button" className="detail-modal-btn primary" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalThongTinCoc;
