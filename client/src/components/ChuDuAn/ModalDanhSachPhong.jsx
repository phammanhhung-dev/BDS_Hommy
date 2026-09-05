import React, { useEffect, useState } from 'react';
import { HiOutlineXMark, HiOutlineHomeModern } from 'react-icons/hi2';
import './DetailModal.css';
import { PhongService, Utils } from '../../services/ChuDuAnService';

const TRANG_THAI_LABELS = {
  Trong: 'Trống',
  GiuCho: 'Giữ chỗ',
  DaThue: 'Đã thuê',
  DonDep: 'Đang dọn dẹp'
};

const TRANG_THAI_COLORS = {
  Trong: '#0369a1',
  GiuCho: '#d97706',
  DaThue: '#16a34a',
  DonDep: '#7c3aed'
};

function ModalDanhSachPhong({ isOpen, project, onClose }) {
  const duAnId = project?.DuAnID;
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !duAnId) {
      setRooms([]);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    PhongService.layTheoDuAn(duAnId)
      .then((response) => {
        const data = response?.data || response || [];
        setRooms(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(err?.message || 'Không thể tải danh sách phòng');
        setRooms([]);
      })
      .finally(() => setLoading(false));
  }, [isOpen, duAnId]);

  const handleOverlayClick = (event) => {
    if (event.target.classList.contains('detail-modal-overlay')) {
      onClose?.();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="detail-modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className="detail-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="detail-modal-header">
          <div>
            <h2>Phòng thuộc dự án</h2>
            <p>{project?.TenDuAn ? `Dự án: ${project.TenDuAn}` : 'Danh sách phòng hiện có'}</p>
          </div>
          <button type="button" className="detail-modal-close" onClick={onClose} aria-label="Đóng">
            <HiOutlineXMark size={18} />
          </button>
        </div>

        <div className="detail-modal-body">
          {error && <div className="detail-modal-error">{error}</div>}
          {loading ? (
            <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>Đang tải dữ liệu...</div>
          ) : rooms.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
              Chưa có phòng nào trong dự án này.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="detail-modal-table">
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Phòng</th>
                    <th style={{ width: '18%' }}>Trạng thái</th>
                    <th style={{ width: '20%' }}>Giá chuẩn</th>
                    <th style={{ width: '16%' }}>Diện tích</th>
                    <th>Mô tả</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => {
                    const trangThai = room.TrangThai || 'Trong';
                    return (
                      <tr key={room.PhongID}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <HiOutlineHomeModern style={{ color: '#7c3aed' }} />
                            <strong>{room.TenPhong}</strong>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: 999,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: `${TRANG_THAI_COLORS[trangThai] || '#475569'}16`,
                              color: TRANG_THAI_COLORS[trangThai] || '#475569'
                            }}
                          >
                            {TRANG_THAI_LABELS[trangThai] || trangThai}
                          </span>
                        </td>
                        <td>{room.GiaChuan ? Utils.formatCurrency(room.GiaChuan) : '—'}</td>
                        <td>{room.DienTichChuan ? `${room.DienTichChuan} m²` : '—'}</td>
                        <td style={{ color: '#4b5563' }}>{room.MoTaPhong || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

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

export default ModalDanhSachPhong;
