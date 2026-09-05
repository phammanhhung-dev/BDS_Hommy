import { useQuery } from '@tanstack/react-query';
import ModalOperator from '../../../components/Operator/shared/ModalOperator';
import BadgeStatusOperator from '../../../components/Operator/shared/BadgeStatusOperator';
import { operatorApi } from '../../../api/operatorApi';
import './ModalChiTietTinDang.css';

/**
 * Modal hiển thị chi tiết tin đăng cần duyệt
 * Bao gồm: Thông tin tin đăng, KYC checklist, danh sách phòng
 */
const ModalChiTietTinDang = ({ tinDangId, onClose, onDuyet, onTuChoi }) => {
  const { data: tinDang, isLoading, error } = useQuery({
    queryKey: ['tinDangChiTiet', tinDangId],
    queryFn: async () => {
      const response = await operatorApi.tinDang.getChiTiet(tinDangId);
      return response.data?.data || response.data || response;
    },
    enabled: !!tinDangId
  });

  const renderKYCChecklist = (checklist) => {
    if (!checklist) return null;

    const checklistItems = [
      { key: 'coTaiKhoan', label: 'Có tài khoản' },
      { key: 'coHoTen', label: 'Có họ tên' },
      { key: 'coEmail', label: 'Có email' },
      { key: 'coSoDienThoai', label: 'Có số điện thoại' },
      { key: 'coSoCCCD', label: 'Có số CCCD' },
      { key: 'daXacMinhKYC', label: 'Đã xác minh KYC' },
      { key: 'coItNhat1Anh', label: 'Có ít nhất 1 ảnh' },
      { key: 'coDiaChi', label: 'Có địa chỉ' },
      { key: 'coGia', label: 'Tất cả phòng có giá' },
      { key: 'coDienTich', label: 'Tất cả phòng có diện tích' }
    ];

    return (
      <div className="modal-chi-tiet__checklist">
        <h3 className="modal-chi-tiet__section-title">✅ KYC Checklist</h3>
        <div className="modal-chi-tiet__checklist-grid">
          {checklistItems.map(item => (
            <div 
              key={item.key}
              className={`modal-chi-tiet__checklist-item ${checklist[item.key] ? 'is-checked' : 'is-unchecked'}`}
            >
              <span className="modal-chi-tiet__checklist-icon">
                {checklist[item.key] ? '✅' : '❌'}
              </span>
              <span className="modal-chi-tiet__checklist-label">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="modal-chi-tiet__loading">
          <div className="operator-shimmer" style={{ height: '400px' }}></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="modal-chi-tiet__error">
          ❌ Lỗi tải dữ liệu: {error.message}
        </div>
      );
    }

    if (!tinDang) return null;

    return (
      <div className="modal-chi-tiet__content">
        {/* Thông tin cơ bản */}
        <div className="modal-chi-tiet__section">
          <h3 className="modal-chi-tiet__section-title">📋 Thông tin tin đăng</h3>
          <div className="modal-chi-tiet__info-grid">
            <div className="modal-chi-tiet__info-item">
              <label>Tiêu đề:</label>
              <span>{tinDang.TieuDe}</span>
            </div>
            <div className="modal-chi-tiet__info-item">
              <label>Dự án:</label>
              <span>{tinDang.TenDuAn}</span>
            </div>
            <div className="modal-chi-tiet__info-item">
              <label>Khu vực:</label>
              <span>{tinDang.TenKhuVuc || 'N/A'}</span>
            </div>
            <div className="modal-chi-tiet__info-item">
              <label>Địa chỉ:</label>
              <span>{tinDang.DiaChiDuAn}</span>
            </div>
            <div className="modal-chi-tiet__info-item modal-chi-tiet__info-item--full">
              <label>Mô tả:</label>
              <span>{tinDang.MoTa || 'Không có mô tả'}</span>
            </div>
          </div>
        </div>

        {/* Thông tin Chủ dự án */}
        <div className="modal-chi-tiet__section">
          <h3 className="modal-chi-tiet__section-title">👤 Thông tin Chủ dự án</h3>
          <div className="modal-chi-tiet__info-grid">
            <div className="modal-chi-tiet__info-item">
              <label>Họ tên:</label>
              <span>{tinDang.TenChuDuAn}</span>
            </div>
            <div className="modal-chi-tiet__info-item">
              <label>Email:</label>
              <span>{tinDang.EmailChuDuAn}</span>
            </div>
            <div className="modal-chi-tiet__info-item">
              <label>Số điện thoại:</label>
              <span>{tinDang.SoDienThoaiChuDuAn || 'N/A'}</span>
            </div>
            <div className="modal-chi-tiet__info-item">
              <label>Trạng thái KYC:</label>
              <BadgeStatusOperator
                status={tinDang.TrangThaiKYC}
                statusMap={{
                  'DaXacMinh': { label: 'Đã xác minh', variant: 'success' },
                  'ChuaXacMinh': { label: 'Chưa xác minh', variant: 'danger' }
                }}
              />
            </div>
            {tinDang.SoCCCD && (
              <>
                <div className="modal-chi-tiet__info-item">
                  <label>Số CCCD:</label>
                  <span>{tinDang.SoCCCD}</span>
                </div>
                <div className="modal-chi-tiet__info-item">
                  <label>Ngày cấp:</label>
                  <span>{tinDang.NgayCapCCCD ? new Date(tinDang.NgayCapCCCD).toLocaleDateString('vi-VN') : 'N/A'}</span>
                </div>
                <div className="modal-chi-tiet__info-item">
                  <label>Nơi cấp:</label>
                  <span>{tinDang.NoiCapCCCD || 'N/A'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* KYC Checklist */}
        {tinDang.ChecklistKYC && renderKYCChecklist(tinDang.ChecklistKYC)}

        {/* Danh sách phòng */}
        {Array.isArray(tinDang.DanhSachPhong) && tinDang.DanhSachPhong.length > 0 && (
          <div className="modal-chi-tiet__section">
            <h3 className="modal-chi-tiet__section-title">
              🏠 Danh sách phòng ({tinDang.DanhSachPhong.length})
            </h3>
            <div className="modal-chi-tiet__phong-list">
              {tinDang.DanhSachPhong.map(phong => (
                <div key={phong.PhongID} className="modal-chi-tiet__phong-item">
                  <div className="modal-chi-tiet__phong-name">
                    {phong.TenPhong}
                  </div>
                  <div className="modal-chi-tiet__phong-info">
                    <span className="modal-chi-tiet__phong-gia">
                      {(phong.Gia || 0).toLocaleString('vi-VN')} đ/tháng
                    </span>
                    <span className="modal-chi-tiet__phong-dien-tich">
                      {phong.DienTich} m²
                    </span>
                    <BadgeStatusOperator
                      status={phong.TrangThai}
                      statusMap={{
                        'Trong': { label: 'Trống', variant: 'success' },
                        'DaThue': { label: 'Đã thuê', variant: 'danger' },
                        'BaoTri': { label: 'Bảo trì', variant: 'warning' }
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="modal-chi-tiet__footer">
          {tinDang.CoTheDuyet && tinDang.TrangThaiDuyetHoaHong === 'DaDuyet' ? (
            <div className="modal-chi-tiet__footer-success">
              ✅ Tin đăng đủ điều kiện để duyệt
            </div>
          ) : (
            <div className="modal-chi-tiet__footer-warning">
              {!tinDang.CoTheDuyet ? (
                <>⚠️ Tin đăng chưa đủ điều kiện duyệt. Vui lòng kiểm tra checklist.</>
              ) : tinDang.TrangThaiDuyetHoaHong !== 'DaDuyet' ? (
                <>⚠️ Dự án chưa được duyệt hoa hồng. Vui lòng duyệt hoa hồng trước khi duyệt tin đăng.</>
              ) : (
                <>⚠️ Tin đăng chưa đủ điều kiện duyệt.</>
              )}
            </div>
          )}
          
          <div className="modal-chi-tiet__actions">
            <button
              className="operator-btn operator-btn--success"
              onClick={() => {
                onDuyet(tinDangId);
                onClose();
              }}
              disabled={!tinDang.CoTheDuyet || tinDang.TrangThaiDuyetHoaHong !== 'DaDuyet'}
            >
              ✅ Duyệt tin
            </button>
            <button
              className="operator-btn operator-btn--danger"
              onClick={() => {
                onTuChoi(tinDang);
                onClose();
              }}
            >
              ❌ Từ chối
            </button>
            <button
              className="operator-btn operator-btn--secondary"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ModalOperator
      isOpen={true}
      onClose={onClose}
      title={`Chi tiết tin đăng #${tinDangId}`}
      size="large"
    >
      {renderContent()}
    </ModalOperator>
  );
};

export default ModalChiTietTinDang;






