/**
 * Section Chọn Phòng cho Tạo Tin Đăng
 * Redesign 09/10/2025
 */

import React from 'react';
import { HiOutlinePlus, HiOutlineHome } from 'react-icons/hi2';
import { getApiBaseUrl } from '../../config/api';
import './SectionChonPhong.css';

// Base URL ảnh từ backend để tránh 404 ở Vite dev server
const API_BASE_URL = getApiBaseUrl();

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('blob:')) return url;
  if (url.startsWith('/uploads/')) return `${API_BASE_URL}${url}`;
  return url;
};

const SectionChonPhong = ({
  danhSachPhongDuAn = [],
  phongDaChon = [],
  onChonPhong,
  onOverrideGia,
  onOverrideDienTich,
  onOverrideMoTa,
  onOverrideHinhAnh,
  onXoaAnhPhong,
  onMoModalTaoPhong,
  formatGiaTien
}) => {

  const getTrangThaiClass = (trangThai) => {
    switch (trangThai) {
      case 'Trong': return 'trangthai-trong';
      case 'GiuCho': return 'trangthai-giucho';
      case 'DaThue': return 'trangthai-dathue';
      case 'DonDep': return 'trangthai-dondep';
      default: return '';
    }
  };

  if (!Array.isArray(danhSachPhongDuAn) || danhSachPhongDuAn.length === 0) {
    return (
      <div className="section-chon-phong">
        <div className="empty-phong">
          <HiOutlineHome className="empty-icon" />
          <p>Dự án chưa có phòng nào</p>
          <button 
            type="button"
            className="btn-tao-phong-dau-tien"
            onClick={onMoModalTaoPhong}
          >
            <HiOutlinePlus /> Tạo phòng đầu tiên
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="section-chon-phong">
      {/* Header cột */}
      <div className="phong-header" role="row">
        <div className="col col-ten">Mã phòng</div>
        <div className="col col-gia">Giá chuẩn</div>
        <div className="col col-dientich">Diện tích</div>
        <div className="col col-trangthai">Trạng thái</div>
        <div className="col col-usage">Đang dùng</div>
      </div>
      <div className="danh-sach-phong">
        {danhSachPhongDuAn.map(phong => {
          const isChon = phongDaChon.some(p => p.PhongID === phong.PhongID);
          const phongData = phongDaChon.find(p => p.PhongID === phong.PhongID);
          
          return (
            <div key={phong.PhongID} className={`phong-item ${isChon ? 'phong-item-checked' : ''}`}>
              <label className="phong-checkbox">
                <input
                  type="checkbox"
                  checked={isChon}
                  onChange={(e) => onChonPhong(phong, e.target.checked)}
                  disabled={phong.TrangThai === 'DaThue'}
                />
                <div className="phong-info-grid" role="row">
                  <div className="col col-ten">{phong.TenPhong}</div>
                  <div className="col col-gia">{phong.GiaChuan ? `${parseFloat(phong.GiaChuan).toLocaleString()}đ` : '—'}</div>
                  <div className="col col-dientich">{phong.DienTichChuan ? `${phong.DienTichChuan}m²` : '—'}</div>
                  <div className={`col col-trangthai ${getTrangThaiClass(phong.TrangThai)}`}>{phong.TrangThai}</div>
                  <div className="col col-usage">{phong.SoTinDangDangDung || 0}</div>
                </div>
              </label>

              {isChon && (
                <div className="phong-override">
                  <div className="override-row">
                    <div className="form-group">
                      <label className="override-label">
                        Override giá (để trống = dùng giá chuẩn: {phong.GiaChuan?.toLocaleString() || '0'}đ)
                      </label>
                      <input
                        type="text"
                        className="override-input"
                        placeholder={`Giá chuẩn: ${phong.GiaChuan?.toLocaleString() || '0'}đ`}
                        value={phongData?.GiaTinDang ? formatGiaTien(phongData.GiaTinDang) : ''}
                        onChange={(e) => onOverrideGia(phong.PhongID, e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="override-label">
                        Override diện tích (chuẩn: {phong.DienTichChuan || '0'}m²)
                      </label>
                      <input
                        type="number"
                        className="override-input"
                        step="0.01"
                        placeholder={`${phong.DienTichChuan || '0'}m²`}
                        value={phongData?.DienTichTinDang || ''}
                        onChange={(e) => onOverrideDienTich(phong.PhongID, e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="override-label">Ảnh riêng cho phòng trong tin đăng</label>
                    <div className="phong-anh-uploader">
                      <input
                        id={`upload-anh-override-${phong.PhongID}`}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files && e.target.files[0];
                          if (file && onOverrideHinhAnh) onOverrideHinhAnh(phong.PhongID, file);
                          e.target.value = '';
                        }}
                      />
                      <label htmlFor={`upload-anh-override-${phong.PhongID}`} className="btn-tao-phong-moi" style={{ marginRight: 12 }}>
                        Chọn ảnh
                      </label>
                      {(() => {
                        const imgSrc = resolveImageUrl(
                          phongData?.HinhAnhTinDangPreview ||
                          phongData?.HinhAnhTinDang ||
                          phong.HinhAnhPhong
                        );
                        return (
                          <div className="phong-anh-preview">
                            {imgSrc ? (
                              <img src={imgSrc} alt="Ảnh phòng" />
                            ) : (
                              <div className="phong-anh-placeholder">
                                Chưa có ảnh phòng
                              </div>
                            )}
                            {(phongData?.HinhAnhTinDangPreview || phongData?.HinhAnhTinDang) ? (
                              <button
                                type="button"
                                className="btn-xoa-anh"
                                onClick={() => onXoaAnhPhong && onXoaAnhPhong(phong.PhongID)}
                              >
                                Xóa ảnh override
                              </button>
                            ) : (
                              <span className="ghi-chu-anh">
                                Đang dùng ảnh mặc định của phòng
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="override-label">Mô tả riêng cho tin đăng này</label>
                    <input
                      type="text"
                      className="override-input"
                      placeholder="VD: Ưu đãi sinh viên, Giảm 200k tháng đầu..."
                      value={phongData?.MoTaTinDang || ''}
                      onChange={(e) => onOverrideMoTa(phong.PhongID, e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="btn-tao-phong-moi"
        onClick={onMoModalTaoPhong}
      >
        <HiOutlinePlus /> Tạo phòng mới cho dự án
      </button>
    </div>
  );
};

export default SectionChonPhong;

