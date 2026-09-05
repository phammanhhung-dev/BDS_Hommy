/**
 * UC-NVDH: Báo cáo Thu nhập cho Nhân viên Điều hành
 * Hiển thị thu nhập từ các NVBH dưới quyền
 * 
 * CÔNG THỨC:
 * - Doanh thu công ty = Số tiền cọc × % hoa hồng dự án
 * - Thu nhập NVDH = Doanh thu công ty × tỷ lệ hoa hồng quản lý (thường 10%)
 */

import React, { useState, useEffect } from 'react';
import { 
  HiOutlineCurrencyDollar, 
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineInformationCircle,
  HiOutlineCalculator,
  HiOutlineBuildingOffice2
} from 'react-icons/hi2';
import { formatCurrency, formatDate } from '../../utils/nvbhHelpers';
import './BaoCaoThuNhapNVDH.css';
import { useOperatorPageSEO } from './seo';
import { nvdhApi } from '../../api/operatorApi';

const BaoCaoThuNhapNVDH = () => {
  useOperatorPageSEO({
    title: 'Báo cáo thu nhập NVDH',
    description: 'Theo dõi doanh thu công ty và thu nhập NVDH theo giai đoạn, bao gồm chi tiết theo từng nhân viên bán hàng.',
    keywords: 'báo cáo thu nhập NVDH, nvdh, doanh thu công ty, hoa hồng quản lý, thu nhập điều hành',
    canonicalPath: '/nvdh/thu-nhap',
  });

  const [reportData, setReportData] = useState(null);
  const [nvbhList, setNvbhList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);
  const [selectedNVBH, setSelectedNVBH] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadNVBHList();
  }, []);

  useEffect(() => {
    loadReport();
  }, [dateRange]);

  // Lấy danh sách NVBH dưới quyền
  const loadNVBHList = async () => {
    try {
      const response = await nvdhApi.nhanVienDieuHanh.getDanhSachNVBH();
      const result = response.data;
      setNvbhList(result.data || []);
    } catch (err) {
      console.error('Lỗi lấy danh sách NVBH:', err);
    }
  };

  // Lấy báo cáo thu nhập NVDH
  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await nvdhApi.nhanVienDieuHanh.getBaoCaoThuNhap({
        tuNgay: dateRange.from,
        denNgay: dateRange.to
      });

      const result = response.data;
      if (result.success) {
        setReportData(result.data);
      } else {
        setError(result.message || 'Không thể tải báo cáo');
      }
    } catch (err) {
      setError(err.message || 'Không thể tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  // Lấy chi tiết thu nhập 1 NVBH
  const loadNVBHDetail = async (nhanVienId) => {
    try {
      const response = await nvdhApi.nhanVienDieuHanh.getThuNhapNVBH(nhanVienId, {
        tuNgay: dateRange.from,
        denNgay: dateRange.to
      });
      const result = response.data;
      if (result.success) {
        setSelectedNVBH(result.data);
      }
    } catch (err) {
      console.error('Lỗi lấy chi tiết NVBH:', err);
    }
  };

  if (loading && !reportData) {
    return (
      <div className="nvdh-bao-cao-thu-nhap">
        <div className="nvdh-loading">Đang tải báo cáo...</div>
      </div>
    );
  }

  if (error && !reportData) {
    return (
      <div className="nvdh-bao-cao-thu-nhap">
        <div className="nvdh-error">
          <p>{error}</p>
          <button onClick={loadReport}>Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="nvdh-bao-cao-thu-nhap">
      {/* Header */}
      <div className="nvdh-header">
        <div className="nvdh-header__title">
          <HiOutlineCurrencyDollar />
          <h1>Báo cáo Thu nhập NVDH</h1>
        </div>
        <div className="nvdh-header__actions">
          <div className="nvdh-date-range">
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            />
            <span>đến</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            />
          </div>
        </div>
      </div>

      {reportData && (
        <>
          {/* Formula Info Banner */}
          <div className="nvdh-formula-banner">
            <div className="nvdh-formula-banner__header" onClick={() => setShowFormulaInfo(!showFormulaInfo)}>
              <div className="nvdh-formula-banner__title">
                <HiOutlineCalculator />
                <span>Công thức tính thu nhập</span>
              </div>
              <button className="nvdh-formula-banner__toggle">
                <HiOutlineInformationCircle />
                {showFormulaInfo ? 'Ẩn' : 'Xem chi tiết'}
              </button>
            </div>
            {showFormulaInfo && (
              <div className="nvdh-formula-banner__content">
                <div className="nvdh-formula-step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <strong>Doanh thu công ty</strong> = Số tiền cọc × % Hoa hồng dự án
                    <small>% hoa hồng phụ thuộc vào số tháng cọc (VD: 30% cho 6 tháng, 70% cho 12 tháng)</small>
                  </div>
                </div>
                <div className="nvdh-formula-step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <strong>Thu nhập của bạn</strong> = Doanh thu công ty × {reportData.tyLeHoaHongQuanLy || 10}%
                    <small>Tính trên tất cả hợp đồng của NVBH dưới quyền</small>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Metrics */}
          <div className="nvdh-metrics">
            <div className="nvdh-metric-card primary">
              <HiOutlineUserGroup className="nvdh-metric-icon" />
              <div className="nvdh-metric-content">
                <span className="nvdh-metric-label">NVBH dưới quyền</span>
                <span className="nvdh-metric-value">{reportData.soNVBHDuoiQuyen || 0}</span>
              </div>
            </div>

            <div className="nvdh-metric-card success">
              <HiOutlineCalendar className="nvdh-metric-icon" />
              <div className="nvdh-metric-content">
                <span className="nvdh-metric-label">Tổng hợp đồng</span>
                <span className="nvdh-metric-value">{reportData.tongSoHopDong || 0}</span>
              </div>
            </div>

            <div className="nvdh-metric-card warning">
              <HiOutlineBuildingOffice2 className="nvdh-metric-icon" />
              <div className="nvdh-metric-content">
                <span className="nvdh-metric-label">Doanh thu công ty</span>
                <span className="nvdh-metric-value">{formatCurrency(reportData.tongDoanhThuCongTy || 0)}</span>
              </div>
            </div>

            <div className="nvdh-metric-card gold">
              <HiOutlineCurrencyDollar className="nvdh-metric-icon" />
              <div className="nvdh-metric-content">
                <span className="nvdh-metric-label">Thu nhập của bạn</span>
                <span className="nvdh-metric-value">{formatCurrency(reportData.tongThuNhapNVDH || 0)}</span>
              </div>
            </div>
          </div>

          {/* Chi tiết theo NVBH */}
          {reportData.chiTietNVBH && reportData.chiTietNVBH.length > 0 && (
            <div className="nvdh-table-section">
              <h2>
                <HiOutlineUserGroup />
                Thu nhập theo từng NVBH
              </h2>
              <div className="nvdh-table-wrapper">
                <table className="nvdh-table">
                  <thead>
                    <tr>
                      <th>Mã NV</th>
                      <th>Tên nhân viên</th>
                      <th>Số HĐ</th>
                      <th>Doanh thu CT</th>
                      <th>Thu nhập của bạn</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.chiTietNVBH.map((nvbh, index) => (
                      <tr key={index}>
                        <td>{nvbh.maNhanVien}</td>
                        <td>{nvbh.tenNhanVien}</td>
                        <td>{nvbh.soHopDong}</td>
                        <td>{formatCurrency(nvbh.tongDoanhThuCongTy)}</td>
                        <td className="amount success">{formatCurrency(nvbh.thuNhapNVDHTuNVBHNay)}</td>
                        <td>
                          <button 
                            className="nvdh-btn-detail"
                            onClick={() => loadNVBHDetail(nvbh.nhanVienId)}
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3"><strong>Tổng cộng</strong></td>
                      <td><strong>{formatCurrency(reportData.tongDoanhThuCongTy)}</strong></td>
                      <td className="amount success"><strong>{formatCurrency(reportData.tongThuNhapNVDH)}</strong></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Modal chi tiết NVBH */}
          {selectedNVBH && (
            <div className="nvdh-modal-overlay" onClick={() => setSelectedNVBH(null)}>
              <div className="nvdh-modal" onClick={(e) => e.stopPropagation()}>
                <div className="nvdh-modal-header">
                  <h3>Chi tiết thu nhập: {selectedNVBH.tenNhanVien}</h3>
                  <button className="nvdh-modal-close" onClick={() => setSelectedNVBH(null)}>×</button>
                </div>
                <div className="nvdh-modal-body">
                  <div className="nvdh-modal-summary">
                    <div><strong>Mã NV:</strong> {selectedNVBH.maNhanVien}</div>
                    <div><strong>Tỷ lệ HH NV:</strong> {selectedNVBH.tyLeHoaHongNhanVien}%</div>
                    <div><strong>Số hợp đồng:</strong> {selectedNVBH.soHopDong}</div>
                    <div><strong>Tổng thu nhập NV:</strong> {formatCurrency(selectedNVBH.tongThuNhapNVBH)}</div>
                  </div>
                  
                  {selectedNVBH.chiTietHopDong && selectedNVBH.chiTietHopDong.length > 0 && (
                    <table className="nvdh-table-small">
                      <thead>
                        <tr>
                          <th>Dự án</th>
                          <th>Phòng</th>
                          <th>Số tiền cọc</th>
                          <th>% HH DA</th>
                          <th>Doanh thu CT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedNVBH.chiTietHopDong.map((hd, idx) => (
                          <tr key={idx}>
                            <td>{hd.tenDuAn}</td>
                            <td>{hd.soPhong || '-'}</td>
                            <td>{formatCurrency(hd.soTienCoc)}</td>
                            <td>{hd.tyLeHoaHongDuAn}%</td>
                            <td>{formatCurrency(hd.doanhThuCongTy)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BaoCaoThuNhapNVDH;
