import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../../config/api';
import khuvucApi from '../../api/khuvucApi';
import './QuanLyKhuVuc.css';

const createEmptyForm = (overrides = {}) => ({
  KhuVucID: null,
  TenKhuVuc: '',
  ParentKhuVucID: null,
  ViDo: '',
  KinhDo: '',
  ...overrides
});

const normalizeResponse = (res) => {
  if (!res) return [];
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.data)) return res.data.data;
  return [];
};

function QuanLyKhuVuc() {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [staff, setStaff] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);

  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingDistrict, setLoadingDistrict] = useState(false);
  const [loadingWard, setLoadingWard] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState('create');
  const [form, setForm] = useState(createEmptyForm());

  useEffect(() => {
    fetchProvinces();
  }, []);

  const loadChildren = async (parentId = null) => {
    const res = await khuvucApi.getChildren(parentId);
    return normalizeResponse(res);
  };

  const fetchProvinces = async (keepSelection = false) => {
    setLoadingProvince(true);
    setError('');
    try {
      const res = await axios.get(buildApiUrl('/api/address/provinces/legacy'));
      const data = res.data?.data || [];
      setProvinces(data);

      if (keepSelection && selectedProvince) {
        const found = data.find((item) => item.KhuVucID === selectedProvince.KhuVucID);
        if (found) {
          setSelectedProvince(found);
        } else {
          setSelectedProvince(null);
          setDistricts([]);
          setSelectedDistrict(null);
          setWards([]);
          setSelectedWard(null);
          setStaff([]);
        }
      }

      return data;
    } catch (err) {
      console.error(err);
      setError('Không tải được danh sách tỉnh/thành');
      return [];
    } finally {
      setLoadingProvince(false);
    }
  };

  const fetchDistricts = async (provinceId, keepSelection = false) => {
    if (!provinceId) {
      setDistricts([]);
      return [];
    }
    setLoadingDistrict(true);
    try {
      const res = await axios.get(buildApiUrl(`/api/address/districts/${provinceId}`));
      const data = res.data?.data || [];
      setDistricts(data);

      if (keepSelection && selectedDistrict) {
        const found = data.find((item) => item.KhuVucID === selectedDistrict.KhuVucID);
        if (found) {
          setSelectedDistrict(found);
        } else {
          setSelectedDistrict(null);
          setWards([]);
          setSelectedWard(null);
          setStaff([]);
        }
      }
      return data;
    } catch (err) {
      console.error(err);
      setError('Không tải được quận/huyện');
      return [];
    } finally {
      setLoadingDistrict(false);
    }
  };

  const fetchWards = async (districtId, keepSelection = false) => {
    if (!districtId) {
      setWards([]);
      return [];
    }
    setLoadingWard(true);
    try {
      const res = await axios.get(buildApiUrl(`/api/address/wards/${districtId}`));
      const data = res.data?.data || [];
      setWards(data);

      if (keepSelection && selectedWard) {
        const found = data.find((item) => item.KhuVucID === selectedWard.KhuVucID);
        if (found) {
          setSelectedWard(found);
        } else {
          setSelectedWard(null);
        }
      }

      return data;
    } catch (err) {
      console.error(err);
      setError('Không tải được phường/xã');
      return [];
    } finally {
      setLoadingWard(false);
    }
  };

  const fetchStaffForDistrict = async (districtId) => {
    if (!districtId) {
      setStaff([]);
      return;
    }
    setLoadingStaff(true);
    try {
      const res = await khuvucApi.getNhanVien(districtId);
      const data = normalizeResponse(res);
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setStaff([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleSelectProvince = async (province) => {
    if (!province) return;
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);
    setStaff([]);
    await fetchDistricts(province.KhuVucID);
  };

  const handleSelectDistrict = async (district) => {
    if (!district) return;
    setSelectedDistrict(district);
    setSelectedWard(null);
    setWards([]);
    await Promise.all([
      fetchWards(district.KhuVucID),
      fetchStaffForDistrict(district.KhuVucID)
    ]);
  };

  const handleSelectWard = (ward) => {
    setSelectedWard(ward);
  };

  const openCreate = (parentId = null) => {
    setMode('create');
    setForm(createEmptyForm({ ParentKhuVucID: parentId }));
    setModalOpen(true);
  };

  const openEdit = (node) => {
    setMode('edit');
    setForm(createEmptyForm({
      KhuVucID: node.KhuVucID,
      TenKhuVuc: node.TenKhuVuc || '',
      ParentKhuVucID: node.ParentKhuVucID ?? null,
      ViDo: node.ViDo ?? '',
      KinhDo: node.KinhDo ?? ''
    }));
    setModalOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const refreshHierarchy = async () => {
    const provincesData = await fetchProvinces(true);
    if (selectedProvince) {
      const matchProvince = provincesData.find((item) => item.KhuVucID === selectedProvince.KhuVucID);
      if (matchProvince) {
        const districtsData = await fetchDistricts(matchProvince.KhuVucID, true);
        if (selectedDistrict) {
          const matchDistrict = districtsData.find((item) => item.KhuVucID === selectedDistrict.KhuVucID);
          if (matchDistrict) {
            await fetchWards(matchDistrict.KhuVucID, true);
            await fetchStaffForDistrict(matchDistrict.KhuVucID);
          }
        }
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (mode === 'create') {
        await khuvucApi.create({
          TenKhuVuc: form.TenKhuVuc,
          ParentKhuVucID: form.ParentKhuVucID || null,
          ViDo: form.ViDo || null,
          KinhDo: form.KinhDo || null
        });
      } else {
        await khuvucApi.update(form.KhuVucID, {
          TenKhuVuc: form.TenKhuVuc,
          ParentKhuVucID: form.ParentKhuVucID || null,
          ViDo: form.ViDo || null,
          KinhDo: form.KinhDo || null
        });
      }

      setModalOpen(false);
      await refreshHierarchy();
    } catch (err) {
      console.error(err);
      alert('Lưu khu vực thất bại, vui lòng thử lại');
    }
  };

  const handleDelete = async (node) => {
    if (!window.confirm(`Xóa khu vực "${node.TenKhuVuc}"?`)) return;
    try {
      await khuvucApi.remove(node.KhuVucID);
      await refreshHierarchy();
    } catch (err) {
      console.error(err);
      alert('Xóa khu vực thất bại');
    }
  };

  const renderList = (items, activeId, onSelect, emptyText) => (
    <ul className="quan-ly-khu-vuc__list">
      {items.length === 0 ? (
        <li className="quan-ly-khu-vuc__empty">{emptyText}</li>
      ) : (
        items.map((item) => (
          <li
            key={item.KhuVucID}
            className={`quan-ly-khu-vuc__list-item ${
              activeId === item.KhuVucID ? 'quan-ly-khu-vuc__list-item--active' : ''
            }`}
            onClick={() => onSelect(item)}
          >
            <div className="quan-ly-khu-vuc__list-content">
              <span>{item.TenKhuVuc}</span>
            </div>
            <div className="quan-ly-khu-vuc__list-actions">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openEdit(item);
                }}
              >
                Sửa
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDelete(item);
                }}
              >
                Xóa
              </button>
            </div>
          </li>
        ))
      )}
    </ul>
  );

  return (
    <div className="quan-ly-khu-vuc">
      <div className="quan-ly-khu-vuc__header">
        <div>
          <h1 className="quan-ly-khu-vuc__title">Quản lý Khu vực</h1>
          <p className="quan-ly-khu-vuc__subtitle">Chọn tỉnh → quận/huyện để xem nhân viên phụ trách</p>
        </div>
        <button className="quan-ly-khu-vuc__primary-btn" onClick={() => openCreate(null)}>
          + Thêm tỉnh / thành
        </button>
      </div>

      {error && <div className="quan-ly-khu-vuc__alert quan-ly-khu-vuc__alert--error">{error}</div>}

      <div className="quan-ly-khu-vuc__columns">
        <div className="quan-ly-khu-vuc__column">
          <div className="quan-ly-khu-vuc__column-header">
            <h3>Tỉnh/Thành</h3>
            <button onClick={() => openCreate(null)}>+ Tỉnh</button>
          </div>
          {loadingProvince ? (
            <div className="quan-ly-khu-vuc__empty">Đang tải...</div>
          ) : (
            renderList(provinces, selectedProvince?.KhuVucID, handleSelectProvince, 'Chưa có tỉnh/thành')
          )}
        </div>

        <div className="quan-ly-khu-vuc__column">
          <div className="quan-ly-khu-vuc__column-header">
            <h3>Quận/Huyện</h3>
            <button
              disabled={!selectedProvince}
              onClick={() => openCreate(selectedProvince?.KhuVucID || null)}
            >
              + Quận/Huyện
            </button>
          </div>
          {!selectedProvince ? (
            <div className="quan-ly-khu-vuc__empty">Chọn tỉnh để xem danh sách quận/huyện</div>
          ) : loadingDistrict ? (
            <div className="quan-ly-khu-vuc__empty">Đang tải...</div>
          ) : (
            renderList(districts, selectedDistrict?.KhuVucID, handleSelectDistrict, 'Chưa có quận/huyện')
          )}
        </div>

        <div className="quan-ly-khu-vuc__column">
          <div className="quan-ly-khu-vuc__column-header">
            <h3>Phường/Xã</h3>
            <button
              disabled={!selectedDistrict}
              onClick={() => openCreate(selectedDistrict?.KhuVucID || null)}
            >
              + Phường/Xã
            </button>
          </div>
          {!selectedDistrict ? (
            <div className="quan-ly-khu-vuc__empty">Chọn quận/huyện để xem phường/xã</div>
          ) : loadingWard ? (
            <div className="quan-ly-khu-vuc__empty">Đang tải...</div>
          ) : (
            renderList(wards, selectedWard?.KhuVucID, handleSelectWard, 'Chưa có phường/xã')
          )}
        </div>
      </div>

      <div className="quan-ly-khu-vuc__staff-card">
        <div className="quan-ly-khu-vuc__staff-header">
          <div>
            <h3>Nhân viên phụ trách</h3>
            <p>
              {selectedDistrict
                ? `Danh sách nhân viên phụ trách quận ${selectedDistrict.TenKhuVuc}`
                : 'Chọn quận/huyện để xem nhân viên'}
            </p>
          </div>
          <span className="quan-ly-khu-vuc__staff-count">{staff.length}</span>
        </div>

        {loadingStaff ? (
          <div className="quan-ly-khu-vuc__empty">Đang tải danh sách nhân viên...</div>
        ) : staff.length === 0 ? (
          <div className="quan-ly-khu-vuc__empty">Chưa có nhân viên phụ trách</div>
        ) : (
          <table className="quan-ly-khu-vuc__staff-table">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Liên hệ</th>
                <th>Khu vực chính</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((nv) => (
                <tr key={nv.NguoiDungID}>
                  <td>
                    <div className="quan-ly-khu-vuc__user">
                      <span className="quan-ly-khu-vuc__user-name">{nv.TenDayDu}</span>
                      <span className="quan-ly-khu-vuc__user-id">#{nv.MaNhanVien || nv.NguoiDungID}</span>
                    </div>
                  </td>
                  <td>
                    <div className="quan-ly-khu-vuc__contact">
                      <span>{nv.Email}</span>
                      <span>{nv.SoDienThoai}</span>
                    </div>
                  </td>
                  <td>{nv.TenKhuVucChinh || '-'}</td>
                  <td>
                    <span
                      className={`quan-ly-khu-vuc__status quan-ly-khu-vuc__status--${(nv.TrangThai || '')
                        .toLowerCase()}`}
                    >
                      {nv.TrangThai}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="quan-ly-khu-vuc__modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="quan-ly-khu-vuc__modal" onClick={(event) => event.stopPropagation()}>
            <div className="quan-ly-khu-vuc__modal-header">
              <h3>{mode === 'create' ? 'Thêm khu vực' : 'Cập nhật khu vực'}</h3>
              <button className="quan-ly-khu-vuc__modal-close" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="quan-ly-khu-vuc__form">
              <label className="quan-ly-khu-vuc__form-field">
                <span>Tên khu vực</span>
                <input name="TenKhuVuc" value={form.TenKhuVuc} onChange={handleChange} required />
              </label>
              <label className="quan-ly-khu-vuc__form-field">
                <span>Parent KhuVucID</span>
                <input name="ParentKhuVucID" value={form.ParentKhuVucID ?? ''} onChange={handleChange} />
              </label>
              <label className="quan-ly-khu-vuc__form-field">
                <span>Vĩ độ</span>
                <input name="ViDo" value={form.ViDo} onChange={handleChange} />
              </label>
              <label className="quan-ly-khu-vuc__form-field">
                <span>Kinh độ</span>
                <input name="KinhDo" value={form.KinhDo} onChange={handleChange} />
              </label>
              <div className="quan-ly-khu-vuc__form-actions">
                <button
                  type="button"
                  className="quan-ly-khu-vuc__secondary-btn"
                  onClick={() => setModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="quan-ly-khu-vuc__primary-btn">
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuanLyKhuVuc;