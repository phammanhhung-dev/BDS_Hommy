import React, { useEffect, useState } from 'react';
import { FiSearch, FiEdit2, FiTrash2, FiCheck, FiPlus, FiRefreshCw, FiGrid, FiList } from 'react-icons/fi';
import tinDangApi from '../../api/tinDangApi';
import './QuanLyTinDang.css';

function QuanLyTinDang() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filtering & Search states
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, statusFilter, typeFilter]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [form, setForm] = useState({
    id: null,
    TieuDe: '',
    GiaTien: '',
    DiaChi: '',
    DienTichSuDung: '',
    KhuVucID: '',
    TrangThai: 'Nhap',
    LoaiGiaoDich: 'Thue',
    LoaiBDS: 'CanHo',
    MoTa: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await tinDangApi.getAll({ limit: 1000 });
      const raw = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      
      const mapped = raw.map(t => ({
        id: t.TinDangID ?? t.id ?? t._id,
        TieuDe: t.TieuDe ?? t.title ?? '-',
        GiaTien: t.GiaTien ?? t.Gia ?? t.Price ?? 0,
        DiaChi: t.DiaChi ?? t.diachi ?? t.address ?? '-',
        DienTichSuDung: t.DienTichSuDung ?? t.DienTich ?? t.area ?? 0,
        KhuVucID: t.KhuVucID ?? t.khuvucId ?? null,
        TrangThai: t.TrangThai ?? t.trangthai ?? t.status ?? 'Nhap',
        LoaiGiaoDich: t.LoaiGiaoDich ?? (t.GiaTien > 100000000 ? 'Ban' : 'Thue'),
        LoaiBDS: t.LoaiBDS ?? 'CanHo',
        MoTa: t.MoTa ?? '',
        raw: t,
      }));
      setItems(mapped);
    } catch (err) {
      console.error('Lỗi lấy tin đăng:', err?.response?.data || err.message);
      setError('Không thể tải danh sách tin đăng. Vui lòng kiểm tra lại kết nối.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (val, type) => {
    const num = Number(val);
    if (!num || isNaN(num)) return 'Thỏa thuận';
    if (type === 'Ban') {
      if (num >= 1000000000) return `${(num / 1000000000).toFixed(2).replace(/\.00$/, '')} tỷ`;
      if (num >= 1000000) return `${(num / 1000000).toFixed(0)} triệu`;
    }
    return `${num.toLocaleString('vi-VN')} đ${type === 'Thue' ? '/tháng' : ''}`;
  };

  const getStatusLabel = (status) => {
    const mapping = {
      'Nhap': 'Nháp',
      'ChoDuyet': 'Chờ duyệt',
      'DaDuyet': 'Đã duyệt',
      'DaDang': 'Đang đăng',
      'TamNgung': 'Tạm ngưng',
      'TuChoi': 'Bị từ chối',
      'LuuTru': 'Lưu trữ',
    };
    return mapping[status] || status;
  };

  const openCreate = () => {
    setModalMode('create');
    setForm({
      id: null,
      TieuDe: '',
      GiaTien: '',
      DiaChi: '',
      DienTichSuDung: '',
      KhuVucID: '',
      TrangThai: 'Nhap',
      LoaiGiaoDich: 'Thue',
      LoaiBDS: 'CanHo',
      MoTa: '',
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setModalMode('edit');
    setForm({
      id: item.id,
      TieuDe: item.TieuDe,
      GiaTien: item.GiaTien || '',
      DiaChi: item.DiaChi,
      DienTichSuDung: item.DienTichSuDung || '',
      KhuVucID: item.KhuVucID ?? '',
      TrangThai: item.TrangThai ?? 'Nhap',
      LoaiGiaoDich: item.LoaiGiaoDich ?? 'Thue',
      LoaiBDS: item.LoaiBDS ?? 'CanHo',
      MoTa: item.MoTa ?? '',
    });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        TieuDe: form.TieuDe,
        GiaTien: form.GiaTien ? Number(form.GiaTien) : null,
        DiaChi: form.DiaChi,
        DienTichSuDung: form.DienTichSuDung ? Number(form.DienTichSuDung) : null,
        KhuVucID: form.KhuVucID ? Number(form.KhuVucID) : null,
        TrangThai: form.TrangThai,
        LoaiGiaoDich: form.LoaiGiaoDich,
        LoaiBDS: form.LoaiBDS,
        MoTa: form.MoTa,
      };

      if (modalMode === 'create') {
        await tinDangApi.create(payload);
      } else {
        await tinDangApi.update(form.id, payload);
      }
      setModalOpen(false);
      await fetchItems();
    } catch (err) {
      console.error('Lỗi lưu tin đăng:', err?.response?.data || err.message);
      alert(err?.response?.data?.message || 'Không thể lưu tin đăng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tin đăng: "${item.TieuDe}"?`)) return;
    try {
      await tinDangApi.remove(item.id);
      await fetchItems();
    } catch (err) {
      console.error('Lỗi xóa tin:', err?.response?.data || err.message);
      alert(err?.response?.data?.message || 'Xóa tin đăng thất bại.');
    }
  };

  const handleApprove = async (item) => {
    if (!window.confirm(`Xác nhận phê duyệt tin đăng: "${item.TieuDe}" để hiển thị công khai?`)) return;
    try {
      await tinDangApi.approve(item.id, { approved: true });
      await fetchItems();
    } catch (err) {
      console.error('Lỗi phê duyệt:', err?.response?.data || err.message);
      alert(err?.response?.data?.message || 'Phê duyệt thất bại.');
    }
  };

  // Filter listings based on controls
  const filteredItems = items.filter(item => {
    const matchesKeyword = item.TieuDe.toLowerCase().includes(searchKeyword.toLowerCase()) || 
                           item.DiaChi.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesStatus = statusFilter ? item.TrangThai === statusFilter : true;
    const matchesType = typeFilter ? item.LoaiGiaoDich === typeFilter : true;
    return matchesKeyword && matchesStatus && matchesType;
  });

  // Calculate items for current page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <div className="quanlytd-wrapper">
      <div className="quanlytd-container">
        
        {/* Header section */}
        <div className="quanlytd-header">
          <div>
            <h3>Quản lý Tin Đăng</h3>
          </div>
          <div className="quanlytd-header-actions">
            <button className="btn-premium btn-premium--primary" onClick={openCreate}>
              <FiPlus /> Thêm tin mới
            </button>
            <button className="btn-premium btn-premium--secondary" onClick={fetchItems}>
              <FiRefreshCw /> Làm mới
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="quanlytd-filters">
          <div className="quanlytd-search-input">
            <FiSearch className="quanlytd-search-icon" />
            <input 
              type="text" 
              placeholder="Tìm kiếm tin đăng theo tiêu đề, địa chỉ..." 
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
          
          <select 
            className="quanlytd-select-filter" 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">-- Hình thức giao dịch --</option>
            <option value="Thue">Cho thuê</option>
            <option value="Ban">Mua bán</option>
          </select>

          <select 
            className="quanlytd-select-filter" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">-- Trạng thái tin --</option>
            <option value="Nhap">Nháp</option>
            <option value="ChoDuyet">Chờ duyệt</option>
            <option value="DaDuyet">Đã duyệt</option>
            <option value="DaDang">Đang đăng</option>
            <option value="TamNgung">Tạm ngưng</option>
            <option value="TuChoi">Bị từ chối</option>
            <option value="LuuTru">Lưu trữ</option>
          </select>
        </div>

        {error && <div className="quanlytd-alert quanlytd-alert--error">{error}</div>}

        {/* Listings Table wrapper */}
        <div className="quanlytd-table-wrapper">
          <table className="quanlytd-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Tin đăng</th>
                <th>Giá giao dịch</th>
                <th>Thông số</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="quanlytd-empty">
                    <FiRefreshCw className="animate-spin" style={{ marginRight: 8 }} /> Đang tải danh sách tin đăng...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="quanlytd-empty">
                    Không tìm thấy tin đăng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                currentItems.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '0.25rem' }}>
                        {item.TieuDe}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        📍 {item.DiaChi}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '800', color: '#ef4444' }}>
                        {formatPrice(item.GiaTien, item.LoaiGiaoDich)}
                      </div>
                      <span className={`badge-type badge-type--${(item.LoaiGiaoDich || 'Thue').toLowerCase()}`}>
                        {item.LoaiGiaoDich === 'Ban' ? 'Bán nhà đất' : 'Cho thuê'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{item.DienTichSuDung ? `${item.DienTichSuDung} m²` : '-'}</div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Phân loại: {item.LoaiBDS === 'CanHo' ? 'Chung cư' : (item.LoaiBDS === 'NhaO' ? 'Nhà riêng' : 'Khác')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-status badge-status--${(item.TrangThai || 'nhap').toLowerCase()}`}>
                        {getStatusLabel(item.TrangThai)}
                      </span>
                    </td>
                    <td>
                      <div className="quanlytd-actions-col" style={{ justifyContent: 'center' }}>
                        <button 
                          className="btn-premium btn-premium--secondary" 
                          onClick={() => openEdit(item)}
                          title="Sửa thông tin"
                        >
                          <FiEdit2 /> Sửa
                        </button>
                        
                        {item.TrangThai === 'ChoDuyet' && (
                          <button 
                            className="btn-premium btn-premium--primary" 
                            onClick={() => handleApprove(item)}
                            title="Phê duyệt tin đăng"
                          >
                            <FiCheck /> Duyệt
                          </button>
                        )}

                        <button 
                          className="btn-premium btn-premium--danger" 
                          onClick={() => handleDelete(item)}
                          title="Xóa tin đăng"
                        >
                          <FiTrash2 /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls inside container */}
        {totalPages > 1 && (
          <div className="quanlytd-pagination" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center', marginTop: '1.5rem' }}>
            <button
              className="btn-premium btn-premium--secondary"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              ← Trang trước
            </button>
            <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600 }}>
              Trang {currentPage} / {totalPages}
            </span>
            <button
              className="btn-premium btn-premium--secondary"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
            >
              Trang sau →
            </button>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {modalOpen && (
        <div className="quanlytd-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="quanlytd-modal" onClick={e => e.stopPropagation()}>
            <div className="quanlytd-modal-header">
              <h4>{modalMode === 'create' ? 'Đăng tin mới' : 'Cập nhật tin đăng'}</h4>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="quanlytd-modal-body">
                <div className="quanlytd-form">
                  <div className="quanlytd-form-group">
                    <label>Tiêu đề tin đăng <span style={{ color: 'red' }}>*</span></label>
                    <input 
                      name="TieuDe" 
                      value={form.TieuDe} 
                      onChange={handleChange} 
                      placeholder="VD: Căn hộ cao cấp 2PN trung tâm Quận 1"
                      required 
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="quanlytd-form-group">
                      <label>Giá trị giao dịch (VNĐ) <span style={{ color: 'red' }}>*</span></label>
                      <input 
                        type="number" 
                        name="GiaTien" 
                        value={form.GiaTien} 
                        onChange={handleChange} 
                        placeholder="VD: 5000000"
                        required 
                      />
                    </div>
                    <div className="quanlytd-form-group">
                      <label>Diện tích sử dụng (m²)</label>
                      <input 
                        type="number" 
                        name="DienTichSuDung" 
                        value={form.DienTichSuDung} 
                        onChange={handleChange} 
                        placeholder="VD: 65"
                      />
                    </div>
                  </div>

                  <div className="quanlytd-form-group">
                    <label>Địa chỉ hiển thị <span style={{ color: 'red' }}>*</span></label>
                    <input 
                      name="DiaChi" 
                      value={form.DiaChi} 
                      onChange={handleChange} 
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                      required 
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="quanlytd-form-group">
                      <label>Hình thức giao dịch</label>
                      <select name="LoaiGiaoDich" value={form.LoaiGiaoDich} onChange={handleChange}>
                        <option value="Thue">Cho thuê</option>
                        <option value="Ban">Mua bán</option>
                      </select>
                    </div>
                    <div className="quanlytd-form-group">
                      <label>Phân loại BĐS</label>
                      <select name="LoaiBDS" value={form.LoaiBDS} onChange={handleChange}>
                        <option value="CanHo">Chung cư / Căn hộ</option>
                        <option value="NhaO">Nhà ở riêng lẻ</option>
                        <option value="Khac">Khác</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="quanlytd-form-group">
                      <label>Khu vực ID (Mã xã/phường)</label>
                      <input 
                        type="number" 
                        name="KhuVucID" 
                        value={form.KhuVucID} 
                        onChange={handleChange} 
                        placeholder="VD: 10001"
                      />
                    </div>
                    <div className="quanlytd-form-group">
                      <label>Trạng thái</label>
                      <select name="TrangThai" value={form.TrangThai} onChange={handleChange}>
                        <option value="Nhap">Nháp</option>
                        <option value="ChoDuyet">Chờ duyệt</option>
                        <option value="DaDuyet">Đã duyệt</option>
                        <option value="DaDang">Đang đăng</option>
                        <option value="TamNgung">Tạm ngưng</option>
                        <option value="TuChoi">Bị từ chối</option>
                        <option value="LuuTru">Lưu trữ</option>
                      </select>
                    </div>
                  </div>

                  <div className="quanlytd-form-group">
                    <label>Mô tả chi tiết</label>
                    <textarea 
                      name="MoTa" 
                      value={form.MoTa} 
                      onChange={handleChange} 
                      placeholder="Mô tả các tiện ích xung quanh, hướng nhà, nội thất..."
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              <div className="quanlytd-modal-footer">
                <button type="button" className="btn-premium btn-premium--secondary" onClick={() => setModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-premium btn-premium--primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuanLyTinDang;