import React, { useState, useEffect } from 'react';
import {
  HiOutlineXMark,
  HiOutlinePlus,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineDocumentCheck,
  HiOutlineExclamationTriangle,
  HiOutlineCurrencyDollar,
  HiOutlineCalendarDays,
  HiOutlinePencilSquare,
  HiOutlineTrash
} from 'react-icons/hi2';
import ChinhSachCocService from '../../services/ChinhSachCocService';
import { DuAnService, Utils } from '../../services/ChuDuAnService';
import './ModalChonChinhSachCoc.css';

/**
 * ModalChonChinhSachCoc - Modal chọn chính sách cọc cho dự án
 * Features:
 * - Hiển thị danh sách chính sách cọc (hệ thống + của chủ dự án)
 * - Radio select (chỉ chọn 1 chính sách)
 * - Hiển thị chi tiết chính sách được chọn
 * - Nút tạo chính sách cọc mới
 * - Lưu chính sách đã chọn vào dự án
 */

function ModalChonChinhSachCoc({ isOpen, onClose, duAn, onSuccess, onOpenCreateModal }) {
  const [chinhSachCocList, setChinhSachCocList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  
  // States cho edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  
  // States cho delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingPolicy, setDeletingPolicy] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') {
      return 'Chưa thiết lập';
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric) || numeric < 0) {
      return 'Chưa thiết lập';
    }
    return `${numeric.toLocaleString('vi-VN')} ₫`;
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current body overflow
      const originalOverflow = document.body.style.overflow;
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Cleanup: restore body scroll when modal closes
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Load danh sách chính sách cọc
  // Load danh sách chính sách và pre-select chính sách đang dùng
  useEffect(() => {
    if (isOpen && duAn) {
      loadChinhSachCoc();
      
      // Pre-select chính sách hiện tại của dự án (nếu có)
      if (duAn.ChinhSachCocID) {
        setSelectedId(duAn.ChinhSachCocID);
      } else {
        setSelectedId(null);
      }
      
      setError('');
    }
  }, [isOpen, duAn]);

  const loadChinhSachCoc = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await ChinhSachCocService.layDanhSach({ chiLayHieuLuc: true });
      if (response.success) {
        setChinhSachCocList(response.data || []);
      } else {
        setError('Không thể tải danh sách chính sách cọc');
      }
    } catch (err) {
      setError(err?.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!duAn || !duAn.DuAnID) return;

    try {
      setSaving(true);
      setError('');
      
      // Cập nhật chính sách cọc cho dự án
      await DuAnService.capNhat(duAn.DuAnID, { ChinhSachCocID: selectedId });
      
      if (onSuccess) {
        onSuccess(selectedId);
      }
      onClose();
    } catch (err) {
      setError(err?.message || 'Không thể lưu chính sách cọc');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNew = () => {
    onClose();
    if (onOpenCreateModal) {
      onOpenCreateModal();
    }
  };

  const handleEdit = (e, policy) => {
    e.stopPropagation();
    setEditingPolicy(policy);
    setEditFormData({
      TenChinhSach: policy.TenChinhSach || '',
      MoTa: policy.MoTa || '',
      ChoPhepCocGiuCho: policy.ChoPhepCocGiuCho === 1,
      TTL_CocGiuCho_Gio: policy.TTL_CocGiuCho_Gio || '',
      TyLePhat_CocGiuCho: policy.TyLePhat_CocGiuCho || '',
      ChoPhepCocAnNinh: policy.ChoPhepCocAnNinh === 1,
      SoTienCocAnNinhMacDinh: policy.SoTienCocAnNinhMacDinh || '',
      QuyTacGiaiToa: policy.QuyTacGiaiToa || 'BanGiao',
      HieuLuc: policy.HieuLuc === 1
    });
    setShowEditModal(true);
    setEditError('');
  };

  const handleDelete = (e, policy) => {
    e.stopPropagation();
    setDeletingPolicy(policy);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingPolicy) return;
    
    try {
      setDeleteLoading(true);
      setEditError('');
      await ChinhSachCocService.voHieuHoa(deletingPolicy.ChinhSachCocID);
      
      // Reload danh sách
      await loadChinhSachCoc();
      
      // Nếu đang chọn chính sách bị xóa, bỏ chọn
      if (selectedId === deletingPolicy.ChinhSachCocID) {
        setSelectedId(null);
      }
      
      setShowDeleteConfirm(false);
      setDeletingPolicy(null);
    } catch (err) {
      setEditError(err?.response?.data?.message || err?.message || 'Không thể xóa chính sách cọc');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPolicy) return;
    
    try {
      setEditLoading(true);
      setEditError('');
      
      const payload = {
        TenChinhSach: editFormData.TenChinhSach.trim(),
        MoTa: editFormData.MoTa?.trim() || null,
        ChoPhepCocGiuCho: editFormData.ChoPhepCocGiuCho ? 1 : 0,
        TTL_CocGiuCho_Gio: editFormData.ChoPhepCocGiuCho ? parseInt(editFormData.TTL_CocGiuCho_Gio) : null,
        TyLePhat_CocGiuCho: editFormData.ChoPhepCocGiuCho ? parseFloat(editFormData.TyLePhat_CocGiuCho) : null,
        ChoPhepCocAnNinh: editFormData.ChoPhepCocAnNinh ? 1 : 0,
        SoTienCocAnNinhMacDinh: editFormData.SoTienCocAnNinhMacDinh ? parseFloat(editFormData.SoTienCocAnNinhMacDinh) : null,
        QuyTacGiaiToa: editFormData.QuyTacGiaiToa,
        HieuLuc: editFormData.HieuLuc ? 1 : 0
      };
      
      await ChinhSachCocService.capNhat(editingPolicy.ChinhSachCocID, payload);
      
      // Reload danh sách
      await loadChinhSachCoc();
      
      setShowEditModal(false);
      setEditingPolicy(null);
      setEditFormData(null);
    } catch (err) {
      setEditError(err?.response?.data?.message || err?.message || 'Không thể cập nhật chính sách cọc');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (editError) setEditError('');
  };

  const selectedPolicy = chinhSachCocList.find(cs => cs.ChinhSachCocID === selectedId);

  if (!isOpen) return null;

  return (
    <div className="modal-chon-chinh-sach-coc__overlay" onClick={onClose}>
      <div className="modal-chon-chinh-sach-coc" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-chon-chinh-sach-coc__header">
          <div className="modal-chon-chinh-sach-coc__header-title-group">
            <h2 className="modal-chon-chinh-sach-coc__title">Chọn Chính sách Cọc</h2>
            {duAn && (
              <p className="modal-chon-chinh-sach-coc__subtitle">Dự án: {duAn.TenDuAn}</p>
            )}
          </div>
          <button type="button" className="modal-chon-chinh-sach-coc__close-btn" onClick={onClose}>
            <HiOutlineXMark />
          </button>
        </div>

        {/* Body */}
        <div className="modal-chon-chinh-sach-coc__body">
          {error && (
            <div className="modal-chon-chinh-sach-coc__alert modal-chon-chinh-sach-coc__alert--error">
              <HiOutlineInformationCircle className="modal-chon-chinh-sach-coc__alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="modal-chon-chinh-sach-coc__loading">
              <div className="modal-chon-chinh-sach-coc__loading-spinner"></div>
              <p>Đang tải danh sách...</p>
            </div>
          ) : (
            <div className="modal-chon-chinh-sach-coc__content">
              {/* Left: Danh sách chính sách */}
              <div className="modal-chon-chinh-sach-coc__list-panel">
                <div className="modal-chon-chinh-sach-coc__panel-header">
                  <h3 className="modal-chon-chinh-sach-coc__panel-title">Danh sách chính sách</h3>
                  <button
                    type="button"
                    className="cda-btn cda-btn-primary cda-btn-sm"
                    onClick={handleCreateNew}
                  >
                    <HiOutlinePlus className="btn-icon" />
                    Tạo mới
                  </button>
                </div>

                <div className="modal-chon-chinh-sach-coc__list">
                  {chinhSachCocList.length === 0 ? (
                    <div className="modal-chon-chinh-sach-coc__empty">
                      <p className="modal-chon-chinh-sach-coc__empty-text">Chưa có chính sách cọc nào</p>
                      <button
                        type="button"
                        className="cda-btn cda-btn-primary cda-btn-sm"
                        onClick={handleCreateNew}
                      >
                        <HiOutlinePlus className="btn-icon" />
                        Tạo chính sách đầu tiên
                      </button>
                    </div>
                  ) : (
                    chinhSachCocList.map((policy) => {
                      const isDefaultPolicy = policy.ChinhSachCocID === 1;
                      const canEditDelete = !isDefaultPolicy && policy.ChuDuAnID;
                      
                      return (
                        <div
                          key={policy.ChinhSachCocID}
                          className={`modal-chon-chinh-sach-coc__item-wrapper ${selectedId === policy.ChinhSachCocID ? 'modal-chon-chinh-sach-coc__item-wrapper--active' : ''}`}
                        >
                          <label
                            className={`modal-chon-chinh-sach-coc__item ${selectedId === policy.ChinhSachCocID ? 'modal-chon-chinh-sach-coc__item--active' : ''}`}
                          >
                            <input
                              type="radio"
                              name="chinhSachCoc"
                              value={policy.ChinhSachCocID}
                              checked={selectedId === policy.ChinhSachCocID}
                              onChange={() => setSelectedId(policy.ChinhSachCocID)}
                            />
                            <div className="modal-chon-chinh-sach-coc__item-content">
                              <div className="modal-chon-chinh-sach-coc__item-header">
                                <span className="modal-chon-chinh-sach-coc__item-name">{policy.TenChinhSach}</span>
                                {selectedId === policy.ChinhSachCocID && (
                                  <HiOutlineCheckCircle className="modal-chon-chinh-sach-coc__check-icon" />
                                )}
                              </div>
                              <div className="modal-chon-chinh-sach-coc__item-tags">
                                {policy.ChuDuAnID ? (
                                  <span className="modal-chon-chinh-sach-coc__tag modal-chon-chinh-sach-coc__tag--custom">Của tôi</span>
                                ) : (
                                  <span className="modal-chon-chinh-sach-coc__tag modal-chon-chinh-sach-coc__tag--system">Hệ thống</span>
                                )}
                                {policy.ChoPhepCocGiuCho === 1 && (
                                  <span className="modal-chon-chinh-sach-coc__tag modal-chon-chinh-sach-coc__tag--info">Giữ chỗ</span>
                                )}
                                {policy.ChoPhepCocAnNinh === 1 && (
                                  <span className="modal-chon-chinh-sach-coc__tag modal-chon-chinh-sach-coc__tag--success">An ninh</span>
                                )}
                              </div>
                              {policy.SoTinDangSuDung > 0 && (
                                <div className="modal-chon-chinh-sach-coc__item-usage">
                                  Đang dùng: {policy.SoTinDangSuDung} tin đăng
                                </div>
                              )}
                            </div>
                          </label>
                          {canEditDelete && (
                            <div className="modal-chon-chinh-sach-coc__item-actions">
                              <button
                                type="button"
                                className="modal-chon-chinh-sach-coc__action-btn modal-chon-chinh-sach-coc__action-btn--edit"
                                onClick={(e) => handleEdit(e, policy)}
                                title="Sửa chính sách"
                              >
                                <HiOutlinePencilSquare />
                              </button>
                              <button
                                type="button"
                                className="modal-chon-chinh-sach-coc__action-btn modal-chon-chinh-sach-coc__action-btn--delete"
                                onClick={(e) => handleDelete(e, policy)}
                                title="Xóa chính sách"
                              >
                                <HiOutlineTrash />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right: Chi tiết chính sách */}
              <div className="modal-chon-chinh-sach-coc__detail-panel">
                <div className="modal-chon-chinh-sach-coc__panel-header">
                  <h3 className="modal-chon-chinh-sach-coc__panel-title">Chi tiết</h3>
                </div>

                {selectedPolicy ? (
                  <div className="modal-chon-chinh-sach-coc__detail">
                    {/* Header */}
                    <div className="modal-chon-chinh-sach-coc__detail-header">
                      <h3 className="modal-chon-chinh-sach-coc__detail-title">{selectedPolicy.TenChinhSach}</h3>
                      {selectedPolicy.MoTa && (
                        <p className="modal-chon-chinh-sach-coc__detail-description">{selectedPolicy.MoTa}</p>
                      )}
                    </div>

                    {/* Section 1: Cọc giữ chỗ */}
                    <div className="modal-chon-chinh-sach-coc__detail-card">
                      <div className="modal-chon-chinh-sach-coc__detail-card-header">
                        <HiOutlineClock className="modal-chon-chinh-sach-coc__detail-card-icon modal-chon-chinh-sach-coc__detail-card-icon--blue" />
                        <h4 className="modal-chon-chinh-sach-coc__detail-card-title">Cọc giữ chỗ</h4>
                      </div>
                      <div className="modal-chon-chinh-sach-coc__detail-card-body">
                        <div className="modal-chon-chinh-sach-coc__info-row">
                          <span className="modal-chon-chinh-sach-coc__info-label">Cho phép</span>
                          <span className={`modal-chon-chinh-sach-coc__info-badge ${selectedPolicy.ChoPhepCocGiuCho === 1 ? 'modal-chon-chinh-sach-coc__info-badge--success' : 'modal-chon-chinh-sach-coc__info-badge--gray'}`}>
                            {selectedPolicy.ChoPhepCocGiuCho === 1 ? 'Có' : 'Không'}
                          </span>
                        </div>
                        {selectedPolicy.ChoPhepCocGiuCho === 1 && (
                          <>
                            <div className="modal-chon-chinh-sach-coc__info-row">
                              <span className="modal-chon-chinh-sach-coc__info-label">
                                <HiOutlineClock className="modal-chon-chinh-sach-coc__inline-icon" />
                                Thời hạn hiệu lực
                              </span>
                              <span className="modal-chon-chinh-sach-coc__info-value">{selectedPolicy.TTL_CocGiuCho_Gio} giờ</span>
                            </div>
                            <div className="modal-chon-chinh-sach-coc__info-row">
                              <span className="modal-chon-chinh-sach-coc__info-label">
                                <HiOutlineExclamationTriangle className="modal-chon-chinh-sach-coc__inline-icon" />
                                Tỷ lệ phạt nếu hủy
                              </span>
                              <span className="modal-chon-chinh-sach-coc__info-value modal-chon-chinh-sach-coc__info-value--highlight">
                                {selectedPolicy.TyLePhat_CocGiuCho !== null && selectedPolicy.TyLePhat_CocGiuCho !== undefined
                                  ? `${selectedPolicy.TyLePhat_CocGiuCho}%`
                                  : 'Không phạt (0%)'}
                              </span>
                            </div>
                            <div className="modal-chon-chinh-sach-coc__info-row">
                              <span className="modal-chon-chinh-sach-coc__info-label">
                                <HiOutlineCurrencyDollar className="modal-chon-chinh-sach-coc__inline-icon" />
                                Số tiền giữ chỗ mặc định
                              </span>
                              <span className="modal-chon-chinh-sach-coc__info-value modal-chon-chinh-sach-coc__info-value--money">
                                {formatCurrency(selectedPolicy.SoTienCocAnNinhMacDinh)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Section 2: Cọc an ninh */}
                    <div className="modal-chon-chinh-sach-coc__detail-card">
                      <div className="modal-chon-chinh-sach-coc__detail-card-header">
                        <HiOutlineShieldCheck className="modal-chon-chinh-sach-coc__detail-card-icon modal-chon-chinh-sach-coc__detail-card-icon--green" />
                        <h4 className="modal-chon-chinh-sach-coc__detail-card-title">Cọc an ninh</h4>
                      </div>
                      <div className="modal-chon-chinh-sach-coc__detail-card-body">
                        <div className="modal-chon-chinh-sach-coc__info-row">
                          <span className="modal-chon-chinh-sach-coc__info-label">Cho phép</span>
                          <span className={`modal-chon-chinh-sach-coc__info-badge ${selectedPolicy.ChoPhepCocAnNinh === 1 ? 'modal-chon-chinh-sach-coc__info-badge--success' : 'modal-chon-chinh-sach-coc__info-badge--gray'}`}>
                            {selectedPolicy.ChoPhepCocAnNinh === 1 ? 'Có' : 'Không'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Quy tắc giải tỏa */}
                    <div className="modal-chon-chinh-sach-coc__detail-card">
                      <div className="modal-chon-chinh-sach-coc__detail-card-header">
                        <HiOutlineDocumentCheck className="modal-chon-chinh-sach-coc__detail-card-icon modal-chon-chinh-sach-coc__detail-card-icon--purple" />
                        <h4 className="modal-chon-chinh-sach-coc__detail-card-title">Quy tắc giải tỏa</h4>
                      </div>
                      <div className="modal-chon-chinh-sach-coc__detail-card-body">
                        <div className="modal-chon-chinh-sach-coc__info-row">
                          <span className="modal-chon-chinh-sach-coc__info-label">Quy tắc áp dụng</span>
                          <span className="modal-chon-chinh-sach-coc__info-badge modal-chon-chinh-sach-coc__info-badge--primary">
                            {selectedPolicy.QuyTacGiaiToa === 'BanGiao' && 'Bàn giao phòng'}
                            {selectedPolicy.QuyTacGiaiToa === 'TheoNgay' && 'Theo ngày'}
                            {selectedPolicy.QuyTacGiaiToa === 'Khac' && 'Quy tắc khác'}
                          </span>
                        </div>
                        {selectedPolicy.QuyTacGiaiToa === 'TheoNgay' && selectedPolicy.SoNgayGiaiToa && (
                          <div className="modal-chon-chinh-sach-coc__info-row">
                            <span className="modal-chon-chinh-sach-coc__info-label">
                              <HiOutlineCalendarDays className="modal-chon-chinh-sach-coc__inline-icon" />
                              Số ngày giải tỏa
                            </span>
                            <span className="modal-chon-chinh-sach-coc__info-value">{selectedPolicy.SoNgayGiaiToa} ngày</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metadata footer */}
                    <div className="modal-chon-chinh-sach-coc__detail-footer">
                      <div className="modal-chon-chinh-sach-coc__footer-item">
                        <span className="modal-chon-chinh-sach-coc__footer-label">Loại chính sách:</span>
                        <span className="modal-chon-chinh-sach-coc__footer-value">
                          {selectedPolicy.ChuDuAnID ? 'Tùy chỉnh' : 'Hệ thống'}
                        </span>
                      </div>
                      {selectedPolicy.SoTinDangSuDung > 0 && (
                        <div className="modal-chon-chinh-sach-coc__footer-item">
                          <span className="modal-chon-chinh-sach-coc__footer-label">Đang sử dụng:</span>
                          <span className="modal-chon-chinh-sach-coc__footer-value">{selectedPolicy.SoTinDangSuDung} tin đăng</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="modal-chon-chinh-sach-coc__detail-empty">
                    <HiOutlineInformationCircle className="modal-chon-chinh-sach-coc__detail-empty-icon" />
                    <p>Chọn một chính sách để xem chi tiết</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-chon-chinh-sach-coc__footer">
          <button
            type="button"
            className="cda-btn cda-btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </button>
          <button
            type="button"
            className="cda-btn cda-btn-primary"
            onClick={handleSave}
            disabled={saving || !selectedId}
          >
            {saving ? 'Đang lưu...' : 'Lưu chính sách'}
          </button>
        </div>
      </div>

      {/* Edit Modal với Preview */}
      {showEditModal && editingPolicy && editFormData && (
        <div className="modal-chon-chinh-sach-coc__edit-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-chon-chinh-sach-coc__edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-chon-chinh-sach-coc__edit-header">
              <h3 className="modal-chon-chinh-sach-coc__edit-title">Sửa chính sách cọc</h3>
              <button
                type="button"
                className="modal-chon-chinh-sach-coc__edit-close"
                onClick={() => setShowEditModal(false)}
              >
                <HiOutlineXMark />
              </button>
            </div>

            <div className="modal-chon-chinh-sach-coc__edit-body">
              {editError && (
                <div className="modal-chon-chinh-sach-coc__alert modal-chon-chinh-sach-coc__alert--error">
                  <HiOutlineInformationCircle className="modal-chon-chinh-sach-coc__alert-icon" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="modal-chon-chinh-sach-coc__edit-form">
                <div className="modal-chon-chinh-sach-coc__form-group">
                  <label className="modal-chon-chinh-sach-coc__form-label">Tên chính sách *</label>
                  <input
                    type="text"
                    className="modal-chon-chinh-sach-coc__form-input"
                    value={editFormData.TenChinhSach}
                    onChange={(e) => handleEditFormChange('TenChinhSach', e.target.value)}
                    placeholder="Nhập tên chính sách"
                  />
                </div>

                <div className="modal-chon-chinh-sach-coc__form-group">
                  <label className="modal-chon-chinh-sach-coc__form-label">Mô tả</label>
                  <textarea
                    className="modal-chon-chinh-sach-coc__form-textarea"
                    value={editFormData.MoTa}
                    onChange={(e) => handleEditFormChange('MoTa', e.target.value)}
                    placeholder="Nhập mô tả (tùy chọn)"
                    rows={3}
                  />
                </div>

                <div className="modal-chon-chinh-sach-coc__form-group">
                  <label className="modal-chon-chinh-sach-coc__form-checkbox">
                    <input
                      type="checkbox"
                      checked={editFormData.ChoPhepCocGiuCho}
                      onChange={(e) => handleEditFormChange('ChoPhepCocGiuCho', e.target.checked)}
                    />
                    <span>Cho phép cọc giữ chỗ</span>
                  </label>
                </div>

                {editFormData.ChoPhepCocGiuCho && (
                  <>
                    <div className="modal-chon-chinh-sach-coc__form-group">
                      <label className="modal-chon-chinh-sach-coc__form-label">TTL giữ chỗ (giờ) *</label>
                      <input
                        type="number"
                        className="modal-chon-chinh-sach-coc__form-input"
                        value={editFormData.TTL_CocGiuCho_Gio}
                        onChange={(e) => handleEditFormChange('TTL_CocGiuCho_Gio', e.target.value)}
                        min="1"
                        max="168"
                        placeholder="1-168 giờ"
                      />
                    </div>

                    <div className="modal-chon-chinh-sach-coc__form-group">
                      <label className="modal-chon-chinh-sach-coc__form-label">Tỷ lệ phạt (%)</label>
                      <input
                        type="number"
                        className="modal-chon-chinh-sach-coc__form-input"
                        value={editFormData.TyLePhat_CocGiuCho}
                        onChange={(e) => handleEditFormChange('TyLePhat_CocGiuCho', e.target.value)}
                        min="0"
                        max="100"
                        placeholder="0-100%"
                      />
                    </div>

                    <div className="modal-chon-chinh-sach-coc__form-group">
                      <label className="modal-chon-chinh-sach-coc__form-label">Số tiền giữ chỗ mặc định (₫)</label>
                      <input
                        type="number"
                        className="modal-chon-chinh-sach-coc__form-input"
                        value={editFormData.SoTienCocAnNinhMacDinh}
                        onChange={(e) => handleEditFormChange('SoTienCocAnNinhMacDinh', e.target.value)}
                        min="0"
                        placeholder="0"
                      />
                    </div>
                  </>
                )}

                <div className="modal-chon-chinh-sach-coc__form-group">
                  <label className="modal-chon-chinh-sach-coc__form-checkbox">
                    <input
                      type="checkbox"
                      checked={editFormData.ChoPhepCocAnNinh}
                      onChange={(e) => handleEditFormChange('ChoPhepCocAnNinh', e.target.checked)}
                    />
                    <span>Cho phép cọc an ninh</span>
                  </label>
                </div>

                <div className="modal-chon-chinh-sach-coc__form-group">
                  <label className="modal-chon-chinh-sach-coc__form-label">Quy tắc giải tỏa</label>
                  <select
                    className="modal-chon-chinh-sach-coc__form-select"
                    value={editFormData.QuyTacGiaiToa}
                    onChange={(e) => handleEditFormChange('QuyTacGiaiToa', e.target.value)}
                  >
                    <option value="BanGiao">Bàn giao phòng</option>
                    <option value="TheoNgay">Theo ngày</option>
                    <option value="Khac">Quy tắc khác</option>
                  </select>
                </div>

                <div className="modal-chon-chinh-sach-coc__form-group">
                  <label className="modal-chon-chinh-sach-coc__form-checkbox">
                    <input
                      type="checkbox"
                      checked={editFormData.HieuLuc}
                      onChange={(e) => handleEditFormChange('HieuLuc', e.target.checked)}
                    />
                    <span>Hiệu lực</span>
                  </label>
                </div>
              </div>

              {/* Preview Section */}
              <div className="modal-chon-chinh-sach-coc__preview-section">
                <h4 className="modal-chon-chinh-sach-coc__preview-title">Preview cập nhật</h4>
                <div className="modal-chon-chinh-sach-coc__preview-card">
                  <div className="modal-chon-chinh-sach-coc__preview-header">
                    <h5 className="modal-chon-chinh-sach-coc__preview-name">
                      {editFormData.TenChinhSach?.trim() || 'Chính sách chưa có tên'}
                    </h5>
                    {editFormData.MoTa?.trim() && (
                      <p className="modal-chon-chinh-sach-coc__preview-description">{editFormData.MoTa.trim()}</p>
                    )}
                  </div>

                  <div className="modal-chon-chinh-sach-coc__preview-details">
                    <div className="modal-chon-chinh-sach-coc__preview-row">
                      <span className="modal-chon-chinh-sach-coc__preview-label">Cọc giữ chỗ</span>
                      <span className={`modal-chon-chinh-sach-coc__preview-badge ${editFormData.ChoPhepCocGiuCho ? 'modal-chon-chinh-sach-coc__preview-badge--success' : 'modal-chon-chinh-sach-coc__preview-badge--gray'}`}>
                        {editFormData.ChoPhepCocGiuCho ? 'Có' : 'Không'}
                      </span>
                    </div>
                    {editFormData.ChoPhepCocGiuCho && (
                      <>
                        <div className="modal-chon-chinh-sach-coc__preview-row">
                          <span className="modal-chon-chinh-sach-coc__preview-label">
                            <HiOutlineClock className="modal-chon-chinh-sach-coc__preview-icon" />
                            TTL giữ chỗ
                          </span>
                          <span className="modal-chon-chinh-sach-coc__preview-value">{editFormData.TTL_CocGiuCho_Gio || 'Chưa thiết lập'} giờ</span>
                        </div>
                        <div className="modal-chon-chinh-sach-coc__preview-row">
                          <span className="modal-chon-chinh-sach-coc__preview-label">
                            <HiOutlineExclamationTriangle className="modal-chon-chinh-sach-coc__preview-icon" />
                            Tỷ lệ phạt
                          </span>
                          <span className="modal-chon-chinh-sach-coc__preview-value">{editFormData.TyLePhat_CocGiuCho || '0'}%</span>
                        </div>
                        <div className="modal-chon-chinh-sach-coc__preview-row">
                          <span className="modal-chon-chinh-sach-coc__preview-label">
                            <HiOutlineCurrencyDollar className="modal-chon-chinh-sach-coc__preview-icon" />
                            Số tiền giữ chỗ
                          </span>
                          <span className="modal-chon-chinh-sach-coc__preview-value">{formatCurrency(editFormData.SoTienCocAnNinhMacDinh)}</span>
                        </div>
                      </>
                    )}
                    <div className="modal-chon-chinh-sach-coc__preview-row">
                      <span className="modal-chon-chinh-sach-coc__preview-label">Cọc an ninh</span>
                      <span className={`modal-chon-chinh-sach-coc__preview-badge ${editFormData.ChoPhepCocAnNinh ? 'modal-chon-chinh-sach-coc__preview-badge--success' : 'modal-chon-chinh-sach-coc__preview-badge--gray'}`}>
                        {editFormData.ChoPhepCocAnNinh ? 'Có' : 'Không'}
                      </span>
                    </div>
                    <div className="modal-chon-chinh-sach-coc__preview-row">
                      <span className="modal-chon-chinh-sach-coc__preview-label">
                        <HiOutlineDocumentCheck className="modal-chon-chinh-sach-coc__preview-icon" />
                        Quy tắc giải tỏa
                      </span>
                      <span className="modal-chon-chinh-sach-coc__preview-value">
                        {editFormData.QuyTacGiaiToa === 'BanGiao' && 'Bàn giao phòng'}
                        {editFormData.QuyTacGiaiToa === 'TheoNgay' && 'Theo ngày'}
                        {editFormData.QuyTacGiaiToa === 'Khac' && 'Quy tắc khác'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-chon-chinh-sach-coc__edit-footer">
              <button
                type="button"
                className="cda-btn cda-btn-secondary"
                onClick={() => setShowEditModal(false)}
                disabled={editLoading}
              >
                Hủy
              </button>
              <button
                type="button"
                className="cda-btn cda-btn-primary"
                onClick={handleSaveEdit}
                disabled={editLoading || !editFormData.TenChinhSach?.trim()}
              >
                {editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && deletingPolicy && (
        <div className="modal-chon-chinh-sach-coc__delete-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-chon-chinh-sach-coc__delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-chon-chinh-sach-coc__delete-header">
              <HiOutlineExclamationTriangle className="modal-chon-chinh-sach-coc__delete-icon" />
              <h3 className="modal-chon-chinh-sach-coc__delete-title">Xác nhận xóa chính sách</h3>
            </div>
            <div className="modal-chon-chinh-sach-coc__delete-body">
              <p className="modal-chon-chinh-sach-coc__delete-message">
                Bạn có chắc chắn muốn xóa chính sách <strong>"{deletingPolicy.TenChinhSach}"</strong>?
              </p>
              {deletingPolicy.SoTinDangSuDung > 0 && (
                <div className="modal-chon-chinh-sach-coc__delete-warning">
                  <HiOutlineInformationCircle className="modal-chon-chinh-sach-coc__delete-warning-icon" />
                  <span>Chính sách này đang được sử dụng bởi {deletingPolicy.SoTinDangSuDung} tin đăng. Không thể xóa.</span>
                </div>
              )}
              {editError && (
                <div className="modal-chon-chinh-sach-coc__alert modal-chon-chinh-sach-coc__alert--error">
                  <HiOutlineInformationCircle className="modal-chon-chinh-sach-coc__alert-icon" />
                  <span>{editError}</span>
                </div>
              )}
            </div>
            <div className="modal-chon-chinh-sach-coc__delete-footer">
              <button
                type="button"
                className="cda-btn cda-btn-secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingPolicy(null);
                  setEditError('');
                }}
                disabled={deleteLoading}
              >
                Hủy
              </button>
              <button
                type="button"
                className="cda-btn cda-btn-danger"
                onClick={confirmDelete}
                disabled={deleteLoading || deletingPolicy.SoTinDangSuDung > 0}
              >
                {deleteLoading ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModalChonChinhSachCoc;
