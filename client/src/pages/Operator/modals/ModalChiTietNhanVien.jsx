import { useQuery } from '@tanstack/react-query';
import ModalOperator from '../../../components/Operator/shared/ModalOperator';
import BadgeStatusOperator from '../../../components/Operator/shared/BadgeStatusOperator';
import { operatorApi } from '../../../api/operatorApi';
import './ModalChiTietNhanVien.css';

/**
 * Modal xem chi tiết nhân viên
 * Hiển thị thông tin đầy đủ + lịch sử hoạt động
 */
const ModalChiTietNhanVien = ({ nhanVienId, onClose }) => {
  const { data: nhanVien, isLoading, error } = useQuery({
    queryKey: ['nhanVienChiTiet', nhanVienId],
    queryFn: () =>
      operatorApi.nhanVien
        .getChiTiet(nhanVienId)
        .then((res) => res.data?.data),
    enabled: !!nhanVienId
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="modal-chi-tiet-nv__loading">
          <div className="operator-shimmer" style={{ height: '400px' }}></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="modal-chi-tiet-nv__error">
          ❌ Lỗi tải dữ liệu: {error.message}
        </div>
      );
    }

    if (!nhanVien) return null;

    return (
      <div className="modal-chi-tiet-nv__content">
        {/* Thông tin cơ bản */}
        <div className="modal-chi-tiet-nv__section">
          <h3 className="modal-chi-tiet-nv__section-title">👤 Thông tin cơ bản</h3>
          <div className="modal-chi-tiet-nv__info-grid">
            <div className="modal-chi-tiet-nv__info-item">
              <label>Họ và tên:</label>
              <span>{nhanVien.TenDayDu}</span>
            </div>
            <div className="modal-chi-tiet-nv__info-item">
              <label>Email:</label>
              <span>{nhanVien.Email}</span>
            </div>
            <div className="modal-chi-tiet-nv__info-item">
              <label>Số điện thoại:</label>
              <span>{nhanVien.SoDienThoai}</span>
            </div>
            <div className="modal-chi-tiet-nv__info-item">
              <label>Khu vực phụ trách:</label>
              <span>{nhanVien.KhuVucPhuTrach || 'Tất cả khu vực'}</span>
            </div>
            <div className="modal-chi-tiet-nv__info-item">
              <label>Trạng thái:</label>
              <BadgeStatusOperator
                status={nhanVien.TrangThai}
                statusMap={{
                  'Active': { label: 'Hoạt động', variant: 'success' },
                  'Inactive': { label: 'Không hoạt động', variant: 'danger' },
                  'Nghi': { label: 'Nghỉ', variant: 'warning' }
                }}
              />
            </div>
            <div className="modal-chi-tiet-nv__info-item">
              <label>Ngày bắt đầu:</label>
              <span>
                {nhanVien.NgayBatDau 
                  ? new Date(nhanVien.NgayBatDau).toLocaleDateString('vi-VN')
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Thống kê */}
        {nhanVien.ThongKe && (
          <div className="modal-chi-tiet-nv__section">
            <h3 className="modal-chi-tiet-nv__section-title">📊 Thống kê hoạt động</h3>
            <div className="modal-chi-tiet-nv__stats-grid">
              <div className="modal-chi-tiet-nv__stat-card">
                <div className="modal-chi-tiet-nv__stat-value">
                  {nhanVien.ThongKe.TongCuocHen || 0}
                </div>
                <div className="modal-chi-tiet-nv__stat-label">Tổng cuộc hẹn</div>
              </div>
              <div className="modal-chi-tiet-nv__stat-card">
                <div className="modal-chi-tiet-nv__stat-value">
                  {nhanVien.ThongKe.CuocHenHoanThanh || 0}
                </div>
                <div className="modal-chi-tiet-nv__stat-label">Đã hoàn thành</div>
              </div>
              <div className="modal-chi-tiet-nv__stat-card">
                <div className="modal-chi-tiet-nv__stat-value">
                  {nhanVien.ThongKe.TongHopDong || 0}
                </div>
                <div className="modal-chi-tiet-nv__stat-label">Hợp đồng</div>
              </div>
              <div className="modal-chi-tiet-nv__stat-card">
                <div className="modal-chi-tiet-nv__stat-value">
                  {nhanVien.ThongKe.TyLeThanhCong 
                    ? `${nhanVien.ThongKe.TyLeThanhCong}%` 
                    : '0%'}
                </div>
                <div className="modal-chi-tiet-nv__stat-label">Tỷ lệ thành công</div>
              </div>
            </div>
          </div>
        )}

        {/* Lịch làm việc gần đây */}
        {Array.isArray(nhanVien.LichLamViec) && nhanVien.LichLamViec.length > 0 && (
          <div className="modal-chi-tiet-nv__section">
            <h3 className="modal-chi-tiet-nv__section-title">
              🗓️ Lịch làm việc gần đây ({nhanVien.LichLamViec.length})
            </h3>
            <div className="modal-chi-tiet-nv__schedule-list">
              {nhanVien.LichLamViec.map((item) => (
                <div
                  key={item.LichID}
                  className="modal-chi-tiet-nv__schedule-item"
                >
                  <div className="modal-chi-tiet-nv__schedule-time">
                    {new Date(item.BatDau).toLocaleString('vi-VN')} 
                    {' '}→{' '}
                    {new Date(item.KetThuc).toLocaleString('vi-VN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lịch sử hoạt động gần đây */}
        {Array.isArray(nhanVien.LichSu) && nhanVien.LichSu.length > 0 && (
          <div className="modal-chi-tiet-nv__section">
            <h3 className="modal-chi-tiet-nv__section-title">
              📜 Lịch sử hoạt động ({nhanVien.LichSu.length})
            </h3>
            <div className="modal-chi-tiet-nv__history-list">
              {Array.isArray(nhanVien.LichSu) && nhanVien.LichSu.map((item, index) => (
                <div key={index} className="modal-chi-tiet-nv__history-item">
                  <div className="modal-chi-tiet-nv__history-time">
                    {new Date(item.TaoLuc).toLocaleString('vi-VN')}
                  </div>
                  <div className="modal-chi-tiet-nv__history-action">
                    {item.HanhDong}
                  </div>
                  <div className="modal-chi-tiet-nv__history-detail">
                    {item.ChiTiet}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="modal-chi-tiet-nv__actions">
          <button
            className="operator-btn operator-btn--secondary"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    );
  };

  return (
    <ModalOperator
      isOpen={true}
      onClose={onClose}
      title={`👁️ Chi tiết Nhân viên #${nhanVienId}`}
      size="large"
    >
      {renderContent()}
    </ModalOperator>
  );
};

export default ModalChiTietNhanVien;

