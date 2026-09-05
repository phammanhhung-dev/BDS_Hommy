/**
 * @fileoverview Trang Quản lý Hợp đồng cho Chủ dự án
 * @component QuanLyHopDong
 */

import React, { useState, useEffect } from 'react';
import ChuDuAnLayout from '../../layouts/ChuDuAnLayout';
import {
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiOutlineCurrencyDollar,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineEye,
  HiOutlineXMark,
  HiOutlineArrowDownTray,
  HiOutlineBuildingOffice2
} from 'react-icons/hi2';
import hopDongApi from '../../api/hopDongApi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './QuanLyHopDong.css';
import '../../styles/ChuDuAnDesignSystem.css';

/**
 * Trang Quản lý Hợp đồng cho Chủ dự án
 */
export default function QuanLyHopDong() {
  const [hopDongs, setHopDongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tuNgay: '',
    denNgay: ''
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedHopDong, setSelectedHopDong] = useState(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    taiDanhSach();
  }, []);

  const taiDanhSach = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.tuNgay) params.tuNgay = filters.tuNgay;
      if (filters.denNgay) params.denNgay = filters.denNgay;

      const response = await hopDongApi.getChuDuAnContracts(params);
      if (response.data.success) {
        setHopDongs(response.data.data || []);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách hợp đồng:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const apDungFilter = () => {
    taiDanhSach();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0đ';
    return Number(amount).toLocaleString('vi-VN') + 'đ';
  };

  const getTrangThaiHopDong = (hd) => {
    if (hd.TrangThai) {
      const trangThaiMap = {
        'xacthuc': { label: 'Xác thực', type: 'success' },
        'xinhuy': { label: 'Xin hủy', type: 'warning' },
        'dahuy': { label: 'Đã hủy', type: 'danger' }
      };
      return trangThaiMap[hd.TrangThai] || { label: hd.TrangThai, type: 'info' };
    }
    
    if (hd.BaoCaoLuc && hd.NgayBatDau) {
      return { label: 'Đã báo cáo', type: 'success' };
    }
    if (hd.noidunghopdong) {
      return { label: 'Vừa tạo', type: 'info' };
    }
    return { label: 'Chưa xác định', type: 'warning' };
  };

  const handleXemChiTiet = (hd) => {
    setSelectedHopDong(hd);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedHopDong(null);
  };

  // Hàm loại bỏ HTML tags và lấy text thuần
  const stripHtml = (html) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Tải xuống TXT
  const handleDownloadTXT = () => {
    if (!selectedHopDong || !selectedHopDong.noidunghopdong) {
      alert('Hợp đồng chưa có nội dung để tải xuống');
      return;
    }

    try {
      const textContent = stripHtml(selectedHopDong.noidunghopdong);
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HopDong_${selectedHopDong.HopDongID}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Lỗi tải xuống TXT:', error);
      alert('Có lỗi xảy ra khi tải xuống hợp đồng');
    }
  };

  // Tải xuống HTML
  const handleDownloadHTML = () => {
    if (!selectedHopDong || !selectedHopDong.noidunghopdong) {
      alert('Hợp đồng chưa có nội dung để tải xuống');
      return;
    }

    try {
      const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hợp đồng #${selectedHopDong.HopDongID}</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      margin: 0;
      padding: 20px;
      background: #fff;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  ${selectedHopDong.noidunghopdong}
</body>
</html>
      `.trim();

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HopDong_${selectedHopDong.HopDongID}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Lỗi tải xuống HTML:', error);
      alert('Có lỗi xảy ra khi tải xuống hợp đồng');
    }
  };

  // Hàm loại bỏ các CSS không được hỗ trợ bởi html2canvas
  const sanitizeHtmlForPdf = (html) => {
    if (!html) return '';
    
    let sanitized = html
      .replace(/oklch\([^)]*\)/gi, '#000000')
      .replace(/lab\([^)]*\)/gi, '#000000')
      .replace(/lch\([^)]*\)/gi, '#000000');
    
    return sanitized;
  };

  // Tải xuống PDF
  const handleDownloadPDF = async () => {
    if (!selectedHopDong || !selectedHopDong.noidunghopdong) {
      alert('Hợp đồng chưa có nội dung để tải xuống');
      return;
    }

    if (downloadingPDF) return;

    setDownloadingPDF(true);
    let printDiv = null;

    try {
      const sanitizedHtml = sanitizeHtmlForPdf(selectedHopDong.noidunghopdong);
      
      printDiv = document.createElement('div');
      printDiv.id = 'hopdong-pdf-temp';
      printDiv.style.position = 'absolute';
      printDiv.style.top = '-9999px';
      printDiv.style.left = '0';
      printDiv.style.width = '794px';
      printDiv.style.padding = '40px';
      printDiv.style.fontFamily = "'Times New Roman', Times, serif";
      printDiv.style.fontSize = '13pt';
      printDiv.style.lineHeight = '1.5';
      printDiv.style.color = '#000';
      printDiv.style.backgroundColor = '#fff';
      printDiv.innerHTML = sanitizedHtml;
      document.body.appendChild(printDiv);

      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(printDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      if (printDiv && printDiv.parentNode) {
        document.body.removeChild(printDiv);
      }

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png', 0.95);

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`HopDong_${selectedHopDong.HopDongID}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Lỗi tải xuống PDF:', error);
      if (printDiv && printDiv.parentNode) {
        document.body.removeChild(printDiv);
      }
      alert('Có lỗi xảy ra khi tải xuống PDF. Vui lòng thử tải xuống HTML.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Đếm thống kê
  const countDaBaoCao = hopDongs.filter(hd => hd.BaoCaoLuc).length;
  const countVuaTao = hopDongs.filter(hd => !hd.BaoCaoLuc && hd.noidunghopdong).length;
  const countXinHuy = hopDongs.filter(hd => hd.TrangThai === 'xinhuy').length;

  return (
    <ChuDuAnLayout>
      <div className="qlhd-container">
        {/* Header */}
        <div className="qlhd-header">
          <div className="qlhd-header-left">
            <HiOutlineDocumentText className="qlhd-icon-large" />
            <div>
              <h1>Quản lý Hợp đồng</h1>
              <p className="qlhd-subtitle">Danh sách hợp đồng giao dịch BĐS của bạn</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="qlhd-filters">
          <div className="qlhd-filter-group">
            <label>
              <HiOutlineCalendar />
              Từ ngày
            </label>
            <input
              type="date"
              name="tuNgay"
              value={filters.tuNgay}
              onChange={handleFilterChange}
            />
          </div>

          <div className="qlhd-filter-group">
            <label>
              <HiOutlineCalendar />
              Đến ngày
            </label>
            <input
              type="date"
              name="denNgay"
              value={filters.denNgay}
              onChange={handleFilterChange}
            />
          </div>

          <button className="btn-filter" onClick={apDungFilter}>
            Áp dụng
          </button>
        </div>

        {/* Stats */}
        <div className="qlhd-stats">
          <div className="stat-card">
            <HiOutlineDocumentText className="stat-icon" />
            <div className="stat-content">
              <h3>{hopDongs.length}</h3>
              <p>Tổng hợp đồng</p>
            </div>
          </div>
          <div className="stat-card">
            <HiOutlineCheckCircle className="stat-icon" style={{ color: '#10b981' }} />
            <div className="stat-content">
              <h3>{countDaBaoCao}</h3>
              <p>Đã báo cáo</p>
            </div>
          </div>
          <div className="stat-card">
            <HiOutlineBuildingOffice2 className="stat-icon" style={{ color: '#3b82f6' }} />
            <div className="stat-content">
              <h3>{countVuaTao}</h3>
              <p>Vừa tạo</p>
            </div>
          </div>
          {countXinHuy > 0 && (
            <div className="stat-card">
              <HiOutlineXCircle className="stat-icon" style={{ color: '#f59e0b' }} />
              <div className="stat-content">
                <h3>{countXinHuy}</h3>
                <p>Xin hủy</p>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="qlhd-table-container">
          {loading ? (
            <div className="qlhd-loading">Đang tải...</div>
          ) : hopDongs.length === 0 ? (
            <div className="qlhd-empty">
              <HiOutlineDocumentText className="empty-icon" />
              <p>Chưa có hợp đồng nào</p>
            </div>
          ) : (
            <table className="qlhd-table">
              <thead>
                <tr>
                  <th>Mã HĐ</th>
                  <th>Tin đăng</th>
                  <th>Phòng</th>
                  <th>Khách hàng</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                  <th>Giá thuê</th>
                  <th>Cọc</th>
                  <th>Trạng thái</th>
                  <th>Báo cáo lúc</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {hopDongs.map(hd => {
                  const trangThai = getTrangThaiHopDong(hd);
                  return (
                    <tr key={hd.HopDongID}>
                      <td>#{hd.HopDongID}</td>
                      <td>
                        <div className="td-tin-dang">
                          <HiOutlineDocumentText />
                          <span>{hd.TenTinDang || 'N/A'}</span>
                        </div>
                      </td>
                      <td>{hd.TenPhong || 'N/A'}</td>
                      <td>
                        <div className="td-khach-hang">
                          <HiOutlineUser />
                          <div>
                            <p className="kh-name">{hd.TenKhachHang}</p>
                            <p className="kh-phone">{hd.SoDienThoai}</p>
                          </div>
                        </div>
                      </td>
                      <td>{formatDate(hd.NgayBatDau)}</td>
                      <td>{formatDate(hd.NgayKetThuc)}</td>
                      <td className="td-currency">{formatCurrency(hd.GiaThueCuoiCung)}</td>
                      <td>
                        <div className="td-coc">
                          <span className="coc-amount">{formatCurrency(hd.SoTienCoc)}</span>
                          {hd.TrangThaiCoc === 'DaGiaiToa' && (
                            <span className="badge badge-success">
                              <HiOutlineCheckCircle /> Đã giải tỏa
                            </span>
                          )}
                          {hd.TrangThaiCoc === 'DaDoiTru' && (
                            <span className="badge badge-info">
                              <HiOutlineCheckCircle /> Đã đối trừ
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${trangThai.type}`}>
                          {trangThai.label}
                        </span>
                      </td>
                      <td>{formatDate(hd.BaoCaoLuc)}</td>
                      <td>
                        <button 
                          className="btn-action btn-view" 
                          title="Xem chi tiết"
                          onClick={() => handleXemChiTiet(hd)}
                        >
                          <HiOutlineEye />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal xem hợp đồng */}
        {modalOpen && selectedHopDong && (
          <div
            className="qlhd-modal-overlay"
            onClick={closeModal}
          >
            <div
              className="qlhd-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="qlhd-modal__header">
                <div>
                  <h3>Hợp đồng #{selectedHopDong.HopDongID}</h3>
                  {selectedHopDong.TenPhong && (
                    <p className="qlhd-modal__subtitle">
                      Phòng: {selectedHopDong.TenPhong}
                      {selectedHopDong.GiaThueCuoiCung && ` • ${formatCurrency(selectedHopDong.GiaThueCuoiCung)}/tháng`}
                    </p>
                  )}
                </div>
                <button
                  className="qlhd-modal__close"
                  onClick={closeModal}
                  aria-label="Đóng"
                >
                  <HiOutlineXMark size={20} />
                </button>
              </div>

              {/* Thông tin tóm tắt */}
              <div className="qlhd-modal__info">
                <div className="qlhd-modal__info-item">
                  <span className="label">Khách hàng:</span>
                  <span className="value">{selectedHopDong.TenKhachHang} - {selectedHopDong.SoDienThoai}</span>
                </div>
                <div className="qlhd-modal__info-item">
                  <span className="label">Thời hạn:</span>
                  <span className="value">{formatDate(selectedHopDong.NgayBatDau)} - {formatDate(selectedHopDong.NgayKetThuc)}</span>
                </div>
                <div className="qlhd-modal__info-item">
                  <span className="label">Tiền cọc:</span>
                  <span className="value">{formatCurrency(selectedHopDong.SoTienCoc)}</span>
                </div>
              </div>

              {selectedHopDong.noidunghopdong ? (
                <div
                  id="hopdong-preview-content"
                  className="qlhd-modal__preview"
                  dangerouslySetInnerHTML={{
                    __html: selectedHopDong.noidunghopdong || '',
                  }}
                />
              ) : (
                <div className="qlhd-modal__empty">
                  Hợp đồng chưa có nội dung chi tiết
                </div>
              )}

              <div className="qlhd-modal__actions">
                <div className="qlhd-modal__download-group">
                  <button
                    className="qlhd-btn qlhd-btn--primary"
                    onClick={handleDownloadPDF}
                    disabled={!selectedHopDong?.noidunghopdong || downloadingPDF}
                    title="Tải xuống PDF"
                  >
                    <HiOutlineArrowDownTray style={{ marginRight: '6px' }} />
                    {downloadingPDF ? 'Đang xử lý...' : 'PDF'}
                  </button>
                  <button
                    className="qlhd-btn qlhd-btn--secondary"
                    onClick={handleDownloadTXT}
                    disabled={!selectedHopDong?.noidunghopdong}
                    title="Tải xuống TXT"
                  >
                    <HiOutlineArrowDownTray style={{ marginRight: '6px' }} />
                    TXT
                  </button>
                  <button
                    className="qlhd-btn qlhd-btn--secondary"
                    onClick={handleDownloadHTML}
                    disabled={!selectedHopDong?.noidunghopdong}
                    title="Tải xuống HTML"
                  >
                    <HiOutlineArrowDownTray style={{ marginRight: '6px' }} />
                    HTML
                  </button>
                </div>
                <button
                  className="qlhd-btn qlhd-btn--outline"
                  onClick={closeModal}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ChuDuAnLayout>
  );
}
