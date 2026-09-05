import React, { useState, useEffect } from 'react';
import { HiOutlineCheck, HiOutlineXMark, HiOutlineBanknotes } from 'react-icons/hi2';
import axiosClient from '../../api/axiosClient';
import './QuanLyRutTien.css';

const QuanLyRutTien = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ChoXuLy'); // ChoXuLy, DaDuyet, TuChoi, TatCa
  const [processingId, setProcessingId] = useState(null);
  
  // Modal Từ chối
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = filter === 'TatCa' ? {} : { trangThai: filter };
      const res = await axiosClient.get('/rut-tien/admin/tat-ca', { params });
      if (res?.data?.data) {
        setRequests(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách yêu cầu:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const handleApprove = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn duyệt yêu cầu này?')) return;
    
    setProcessingId(id);
    try {
      await axiosClient.put(`/rut-tien/admin/${id}/xu-ly`, {
        trangThai: 'DaDuyet',
        ghiChu: 'Đã chuyển khoản thành công'
      });
      alert('Đã duyệt yêu cầu thành công!');
      fetchRequests();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (req) => {
    setSelectedRequest(req);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
        alert('Vui lòng nhập lý do từ chối');
        return;
    }
    
    setProcessingId(selectedRequest.YeuCauID);
    try {
      await axiosClient.put(`/rut-tien/admin/${selectedRequest.YeuCauID}/xu-ly`, {
        trangThai: 'TuChoi',
        ghiChu: rejectReason
      });
      alert('Đã từ chối yêu cầu!');
      setRejectModalOpen(false);
      fetchRequests();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Number(amount).toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div className="ql-ruttien">
      <div className="ql-ruttien__header">
        <h2 className="ql-ruttien__title">
            <HiOutlineBanknotes /> Quản lý Yêu cầu Rút tiền
        </h2>
        <div className="ql-ruttien__filters">
            <button 
                className={`ql-ruttien__filter-btn ${filter === 'ChoXuLy' ? 'active' : ''}`}
                onClick={() => setFilter('ChoXuLy')}
            >
                Chờ xử lý
            </button>
            <button 
                className={`ql-ruttien__filter-btn ${filter === 'DaDuyet' ? 'active' : ''}`}
                onClick={() => setFilter('DaDuyet')}
            >
                Đã duyệt
            </button>
            <button 
                className={`ql-ruttien__filter-btn ${filter === 'TuChoi' ? 'active' : ''}`}
                onClick={() => setFilter('TuChoi')}
            >
                Từ chối
            </button>
            <button 
                className={`ql-ruttien__filter-btn ${filter === 'TatCa' ? 'active' : ''}`}
                onClick={() => setFilter('TatCa')}
            >
                Tất cả
            </button>
        </div>
      </div>

      <div className="ql-ruttien__content">
        {loading ? (
            <div className="ql-ruttien__loading">Đang tải dữ liệu...</div>
        ) : requests.length === 0 ? (
            <div className="ql-ruttien__empty">Không có yêu cầu nào</div>
        ) : (
            <table className="ql-ruttien__table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Người dùng</th>
                        <th>Ngân hàng</th>
                        <th>Thông tin TK</th>
                        <th>Số tiền</th>
                        <th>Thời gian</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map((req) => (
                        <tr key={req.YeuCauID}>
                            <td>#{req.YeuCauID}</td>
                            <td>
                                <div className="user-info">
                                    <div className="user-name">{req.TenDayDu}</div>
                                    <div className="user-contact">{req.SoDienThoai}</div>
                                </div>
                            </td>
                            <td>{req.NganHang}</td>
                            <td>
                                <div className="bank-info">
                                    <div>STK: <strong>{req.SoTaiKhoan}</strong></div>
                                    <div>Chủ TK: {req.TenChuTaiKhoan}</div>
                                </div>
                            </td>
                            <td className="amount-cell">{formatCurrency(req.SoTien)}</td>
                            <td>{new Date(req.TaoLuc).toLocaleString()}</td>
                            <td>
                                <span className={`status-badge status-${req.TrangThai}`}>
                                    {req.TrangThai === 'ChoXuLy' ? 'Chờ xử lý' : 
                                     req.TrangThai === 'DaDuyet' ? 'Đã duyệt' : 'Từ chối'}
                                </span>
                                {req.GhiChu && <div className="note-text">{req.GhiChu}</div>}
                            </td>
                            <td>
                                {req.TrangThai === 'ChoXuLy' && (
                                    <div className="action-buttons">
                                        <button 
                                            className="btn-approve"
                                            onClick={() => handleApprove(req.YeuCauID)}
                                            disabled={processingId === req.YeuCauID}
                                            title="Duyệt và chuyển khoản"
                                        >
                                            <HiOutlineCheck />
                                        </button>
                                        <button 
                                            className="btn-reject"
                                            onClick={() => openRejectModal(req)}
                                            disabled={processingId === req.YeuCauID}
                                            title="Từ chối yêu cầu"
                                        >
                                            <HiOutlineXMark />
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>

      {/* Modal Từ chối */}
      {rejectModalOpen && (
        <div className="reject-modal-overlay">
            <div className="reject-modal">
                <h3>Từ chối yêu cầu rút tiền #{selectedRequest?.YeuCauID}</h3>
                <p>Số tiền {formatCurrency(selectedRequest?.SoTien)} sẽ được hoàn lại ví người dùng.</p>
                <textarea 
                    placeholder="Nhập lý do từ chối..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                />
                <div className="reject-modal-actions">
                    <button className="btn-cancel" onClick={() => setRejectModalOpen(false)}>Hủy</button>
                    <button className="btn-confirm-reject" onClick={handleReject}>Xác nhận từ chối</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default QuanLyRutTien;
