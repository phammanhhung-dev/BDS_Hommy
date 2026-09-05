/**
 * UC-SALE-06: Báo cáo Thu nhập
 * Income report with Recharts (Line, Bar, Pie), export PDF/Excel
 * 
 * CÔNG THỨC MỚI:
 * - Doanh thu công ty = Số tiền cọc × % hoa hồng dự án (từ BangHoaHong JSON)
 * - Thu nhập NVBH = Doanh thu công ty × tỷ lệ hoa hồng nhân viên (thường 50%)
 */

import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  HiOutlineCurrencyDollar, 
  HiOutlineDocumentArrowDown, 
  HiOutlinePrinter,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineInformationCircle,
  HiOutlineCalculator,
  HiOutlineBuildingOffice2
} from 'react-icons/hi2';
import { useReactToPrint } from 'react-to-print';
import { layBaoCaoThuNhap } from '../../api/nhanVienBanHangApi';
import { formatCurrency, formatDate, exportToExcel, exportToPDF, calculateChange } from '../../utils/nvbhHelpers';
import MetricCard from '../../components/NhanVienBanHang/MetricCard';
import LoadingSkeleton from '../../components/NhanVienBanHang/LoadingSkeleton';
import ErrorBanner from '../../components/NhanVienBanHang/ErrorBanner';
import './BaoCaoThuNhap.css';

const COLORS = ['#1D4ED8', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444'];

const BaoCaoThuNhap = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const printRef = React.useRef();

  useEffect(() => {
    loadReport();
  }, [dateRange]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await layBaoCaoThuNhap(dateRange);
      if (response.success) {
        // Map dữ liệu từ API mới (HoaHongService)
        const data = response.data;
        setReportData({
          // Metrics tổng quan
          tongDoanhThuCongTy: data.tongGiaTri || 0,          // Doanh thu công ty (cũ: tongGiaTri)
          tongThuNhapNVBH: data.tongHoaHong || 0,            // Thu nhập NVBH (cũ: tongHoaHong)
          tyLeHoaHong: data.tyLeHoaHong || 50,               // Tỷ lệ hoa hồng nhân viên
          soCuocHenThanhCong: data.cuocHenHoanThanh || 0,
          soHopDong: data.soGiaoDich || 0,                   // Số hợp đồng
          tyLeChot: data.tyLeChuyenDoi || 0,
          
          // Chi tiết công thức (mới)
          congThuc: data.congThuc || null,
          chiTietHopDong: data.chiTietHopDong || [],         // Mới: chi tiết từng hợp đồng
          
          // Giữ lại cho charts (fallback nếu không có)
          thuNhapTheoNgay: data.thuNhapTheoNgay || [],
          hoaHongTheoTuan: data.hoaHongTheoTuan || [],
          phanBoLoaiPhong: data.phanBoLoaiPhong || [],
          chiTietHoaHong: data.chiTietHoaHong || []
        });
      }
    } catch (err) {
      setError(err.message || 'Không thể tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    
    // Export chi tiết hợp đồng với công thức mới
    const exportData = reportData.chiTietHopDong.length > 0
      ? reportData.chiTietHopDong.map(item => ({
          'Mã HĐ': item.hopDongId,
          'Dự án': item.tenDuAn,
          'Phòng': item.soPhong,
          'Số tiền cọc': item.soTienCoc,
          'Số tháng cọc': item.soThangCocThucTe,
          '% HH Dự án': item.tyLeHoaHongDuAn,
          'Doanh thu công ty': item.doanhThuCongTy,
          'Thu nhập NVBH': item.thuNhapNVBH,
          'Ngày': formatDate(item.ngayBatDau)
        }))
      : reportData.chiTietHoaHong.map(item => ({
          'Mã cuộc hẹn': item.CuocHenID,
          'Khách hàng': item.TenKhachHang,
          'Phòng': item.TenPhong,
          'Ngày': formatDate(item.Ngay),
          'Giá trị HĐ': item.GiaTriHopDong,
          '% Hoa hồng': item.TyLeHoaHong,
          'Số tiền': item.SoTienHoaHong
        }));
    
    exportToExcel(exportData, `bao-cao-thu-nhap-${dateRange.from}-${dateRange.to}`, 'Báo cáo thu nhập');
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Báo cáo thu nhập ${dateRange.from} - ${dateRange.to}`
  });

  if (loading && !reportData) {
    return (
      <div className="nvbh-bao-cao-thu-nhap">
        <LoadingSkeleton type="card" count={4} />
      </div>
    );
  }

  if (error && !reportData) {
    return (
      <div className="nvbh-bao-cao-thu-nhap">
        <ErrorBanner message={error} onRetry={loadReport} />
      </div>
    );
  }

  const metrics = reportData ? [
    {
      label: 'Doanh thu công ty',
      value: formatCurrency(reportData.tongDoanhThuCongTy),
      subtitle: 'Từ các hợp đồng',
      icon: HiOutlineBuildingOffice2,
      color: 'primary'
    },
    {
      label: 'Thu nhập của bạn',
      value: formatCurrency(reportData.tongThuNhapNVBH),
      subtitle: `${reportData.tyLeHoaHong}% doanh thu`,
      icon: HiOutlineCurrencyDollar,
      color: 'success'
    },
    {
      label: 'Số hợp đồng',
      value: reportData.soHopDong,
      subtitle: 'Đã ký trong kỳ',
      icon: HiOutlineCalendar,
      color: 'warning'
    },
    {
      label: 'Tỷ lệ chốt',
      value: `${reportData.tyLeChot}%`,
      subtitle: `${reportData.soCuocHenThanhCong} cuộc hẹn thành công`,
      icon: HiOutlineChartBar,
      color: 'danger'
    }
  ] : [];

  return (
    <div className="nvbh-bao-cao-thu-nhap" ref={printRef}>
      {/* Header */}
      <div className="nvbh-bao-cao-thu-nhap__header no-print">
        <div className="nvbh-bao-cao-thu-nhap__title">
          <HiOutlineCurrencyDollar />
          <h1>Báo cáo Thu nhập</h1>
        </div>
        <div className="nvbh-bao-cao-thu-nhap__actions">
          <div className="nvbh-date-range">
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
          <button className="nvbh-btn-icon" onClick={handleExportExcel} disabled={!reportData}>
            <HiOutlineDocumentArrowDown />
            Excel
          </button>
          <button className="nvbh-btn-icon" onClick={handlePrint} disabled={!reportData}>
            <HiOutlinePrinter />
            In
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="print-only">
        <h1>Báo cáo Thu nhập</h1>
        <p>Từ {formatDate(dateRange.from)} đến {formatDate(dateRange.to)}</p>
      </div>

      {reportData && (
        <>
          {/* Formula Info Banner */}
          <div className="nvbh-formula-banner">
            <div className="nvbh-formula-banner__header" onClick={() => setShowFormulaInfo(!showFormulaInfo)}>
              <div className="nvbh-formula-banner__title">
                <HiOutlineCalculator />
                <span>Công thức tính thu nhập</span>
              </div>
              <button className="nvbh-formula-banner__toggle">
                <HiOutlineInformationCircle />
                {showFormulaInfo ? 'Ẩn' : 'Xem chi tiết'}
              </button>
            </div>
            {showFormulaInfo && (
              <div className="nvbh-formula-banner__content">
                <div className="nvbh-formula-step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <strong>Doanh thu công ty</strong> = Số tiền cọc × % Hoa hồng dự án
                    <small>% hoa hồng phụ thuộc vào số tháng cọc (VD: 30% cho 6 tháng, 70% cho 12 tháng)</small>
                  </div>
                </div>
                <div className="nvbh-formula-step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <strong>Thu nhập của bạn</strong> = Doanh thu công ty × {reportData.tyLeHoaHong}%
                    <small>Tỷ lệ hoa hồng được cấu hình trong hồ sơ nhân viên</small>
                  </div>
                </div>
                {reportData.congThuc && (
                  <div className="nvbh-formula-note">
                    <HiOutlineInformationCircle />
                    {reportData.congThuc.moTa}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Metrics */}
          <div className="nvbh-bao-cao-thu-nhap__metrics">
            {metrics.map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}
          </div>

          {/* Chi tiết hợp đồng (MỚI) */}
          {reportData.chiTietHopDong && reportData.chiTietHopDong.length > 0 && (
            <div className="nvbh-bao-cao-thu-nhap__table">
              <h2>
                <HiOutlineBuildingOffice2 />
                Chi tiết Hoa hồng theo Hợp đồng
              </h2>
              <div className="nvbh-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Mã HĐ</th>
                      <th>Dự án</th>
                      <th>Phòng</th>
                      <th>Số tiền cọc</th>
                      <th>Tháng cọc</th>
                      <th>% HH Dự án</th>
                      <th>Doanh thu CT</th>
                      <th>Thu nhập</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.chiTietHopDong.map((item, index) => (
                      <tr key={index}>
                        <td>{item.hopDongId}</td>
                        <td>{item.tenDuAn}</td>
                        <td>{item.soPhong || '-'}</td>
                        <td>{formatCurrency(item.soTienCoc)}</td>
                        <td>{item.soThangCocThucTe} tháng</td>
                        <td className="highlight">{item.tyLeHoaHongDuAn}%</td>
                        <td>{formatCurrency(item.doanhThuCongTy)}</td>
                        <td className="amount success">{formatCurrency(item.thuNhapNVBH)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="6"><strong>Tổng cộng</strong></td>
                      <td><strong>{formatCurrency(reportData.tongDoanhThuCongTy)}</strong></td>
                      <td className="amount success"><strong>{formatCurrency(reportData.tongThuNhapNVBH)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="nvbh-bao-cao-thu-nhap__charts">
            {/* Line Chart - Thu nhập theo ngày */}
            <div className="nvbh-chart-card">
              <h2>Thu nhập theo ngày</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.thuNhapTheoNgay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="income" name="Thu nhập" stroke="#1D4ED8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart - Hoa hồng theo tuần */}
            <div className="nvbh-chart-card">
              <h2>Hoa hồng theo tuần</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.hoaHongTheoTuan}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="commission" name="Hoa hồng" fill="#0EA5E9" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart - Phân bố theo loại phòng */}
            <div className="nvbh-chart-card">
              <h2>Phân bố theo loại phòng</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.phanBoLoaiPhong}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData.phanBoLoaiPhong.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Commission Table (Legacy - hiển thị nếu không có chiTietHopDong) */}
          {(!reportData.chiTietHopDong || reportData.chiTietHopDong.length === 0) && 
           reportData.chiTietHoaHong && reportData.chiTietHoaHong.length > 0 && (
            <div className="nvbh-bao-cao-thu-nhap__table">
              <h2>Chi tiết Hoa hồng</h2>
              <div className="nvbh-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Mã CH</th>
                      <th>Khách hàng</th>
                      <th>Phòng</th>
                      <th>Ngày</th>
                      <th>Giá trị HĐ</th>
                      <th>% HH</th>
                      <th>Số tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.chiTietHoaHong.map((item, index) => (
                      <tr key={index}>
                        <td>{item.CuocHenID}</td>
                        <td>{item.TenKhachHang}</td>
                        <td>{item.TenPhong}</td>
                        <td>{formatDate(item.Ngay)}</td>
                        <td>{formatCurrency(item.GiaTriHopDong)}</td>
                        <td>{item.TyLeHoaHong}%</td>
                        <td className="amount">{formatCurrency(item.SoTienHoaHong)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="6"><strong>Tổng cộng</strong></td>
                      <td className="amount"><strong>{formatCurrency(reportData.tongThuNhapNVBH)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BaoCaoThuNhap;





