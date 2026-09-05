/**
 * @fileoverview Trang Hợp đồng của tôi - Dành cho Khách hàng
 * @component HopDongCuaToi
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiOutlineCurrencyDollar,
  HiOutlineBuildingOffice2,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineEye,
  HiOutlineHome,
  HiOutlineXMark,
  HiOutlineArrowDownTray,
  HiOutlineTrash
} from 'react-icons/hi2';
import hopDongApi from '../../api/hopDongApi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './HopDongCuaToi.css';

/**
 * Trang Hợp đồng của tôi cho Khách hàng
 */
export default function HopDongCuaToi() {
  const navigate = useNavigate();
  const [hopDongs, setHopDongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tuNgay: '',
    denNgay: ''
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedHopDong, setSelectedHopDong] = useState(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [huyLoading, setHuyLoading] = useState(false);

  useEffect(() => {
    taiDanhSach();
  }, []);

  const taiDanhSach = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.tuNgay) params.tuNgay = filters.tuNgay;
      if (filters.denNgay) params.denNgay = filters.denNgay;

      const response = await hopDongApi.getCustomerContracts(params);
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
    // Ưu tiên TrangThai từ database
    if (hd.TrangThai) {
      const trangThaiMap = {
        'xacthuc': { label: 'Xác thực', type: 'success' },
        'xinhuy': { label: 'Xin hủy', type: 'warning' },
        'dahuy': { label: 'Đã hủy', type: 'danger' }
      };
      return trangThaiMap[hd.TrangThai] || { label: hd.TrangThai, type: 'info' };
    }
    
    // Fallback logic cũ
    // Nếu có BaoCaoLuc và NgayBatDau → Đã báo cáo
    if (hd.BaoCaoLuc && hd.NgayBatDau) {
      return { label: 'Đã báo cáo', type: 'success' };
    }
    // Nếu chỉ có noidunghopdong → Vừa tạo từ đặt cọc
    if (hd.noidunghopdong) {
      return { label: 'Vừa tạo', type: 'info' };
    }
    return { label: 'Chưa xác định', type: 'warning' };
  };

  const handleXemChiTiet = (hd) => {
    console.log('[handleXemChiTiet] Mở modal với hợp đồng:', hd);
    setSelectedHopDong(hd);
    setModalOpen(true);
    console.log('[handleXemChiTiet] Đã set modalOpen = true');
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

  // Hàm loại bỏ các CSS không được hỗ trợ bởi html2canvas
  const sanitizeHtmlForPdf = (html) => {
    if (!html) return '';
    
    // Thay thế các color functions không được hỗ trợ bằng regex - xử lý toàn bộ HTML string
    let sanitized = html
      // Thay thế oklch() trong tất cả các context (style attributes, CSS rules, etc.)
      .replace(/oklch\([^)]*\)/gi, (match) => {
        // Nếu là background, dùng trắng, còn lại dùng đen
        return match.includes('background') ? '#ffffff' : '#000000';
      })
      // Thay thế lab() trong tất cả các context
      .replace(/lab\([^)]*\)/gi, (match) => {
        return match.includes('background') ? '#ffffff' : '#000000';
      })
      // Thay thế lch() trong tất cả các context
      .replace(/lch\([^)]*\)/gi, (match) => {
        return match.includes('background') ? '#ffffff' : '#000000';
      })
      // Xử lý các style attributes có chứa oklch/lab/lch
      .replace(/style="([^"]*)"/gi, (match, styleContent) => {
        let cleaned = styleContent
          .replace(/oklch\([^)]*\)/gi, (m) => m.includes('background') ? '#ffffff' : '#000000')
          .replace(/lab\([^)]*\)/gi, (m) => m.includes('background') ? '#ffffff' : '#000000')
          .replace(/lch\([^)]*\)/gi, (m) => m.includes('background') ? '#ffffff' : '#000000');
        return `style="${cleaned}"`;
      });
    
    // Tạo một div tạm để parse và xử lý HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitized;
    
    // Xử lý các element có inline styles
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.hasAttribute('style')) {
        const styleAttr = el.getAttribute('style');
        if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('lab(') || styleAttr.includes('lch('))) {
          // Loại bỏ toàn bộ style attribute và set lại với các giá trị an toàn
          el.removeAttribute('style');
          // Chỉ giữ lại các properties không có color functions
          const safeProps = styleAttr.split(';').filter(prop => {
            const trimmed = prop.trim();
            return trimmed && !trimmed.includes('oklch') && !trimmed.includes('lab(') && !trimmed.includes('lch(');
          });
          if (safeProps.length > 0) {
            el.setAttribute('style', safeProps.join(';'));
          }
        }
      }
    });
    
    return tempDiv.innerHTML;
  };

  // Tải xuống PDF
  const handleDownloadPDF = async () => {
    if (!selectedHopDong || !selectedHopDong.noidunghopdong) {
      alert('Hợp đồng chưa có nội dung để tải xuống');
      return;
    }

    if (downloadingPDF) {
      return; // Đang xử lý, không cho click lại
    }

    setDownloadingPDF(true);
    let printDiv = null;

    try {
      // Sanitize HTML để loại bỏ các CSS không được hỗ trợ
      const sanitizedHtml = sanitizeHtmlForPdf(selectedHopDong.noidunghopdong);
      
      console.log('Sanitized HTML length:', sanitizedHtml.length);
      console.log('Sanitized HTML preview:', sanitizedHtml.substring(0, 200));
      
      // Tạo một div để render HTML - đặt ở ngoài viewport nhưng vẫn visible
      printDiv = document.createElement('div');
      printDiv.id = 'hopdong-pdf-temp';
      printDiv.style.position = 'absolute';
      printDiv.style.top = '-9999px';
      printDiv.style.left = '0';
      printDiv.style.width = '794px'; // A4 width in pixels (210mm * 3.78)
      printDiv.style.padding = '40px';
      printDiv.style.fontFamily = "'Times New Roman', Times, serif";
      printDiv.style.fontSize = '13pt';
      printDiv.style.lineHeight = '1.5';
      printDiv.style.color = '#000';
      printDiv.style.backgroundColor = '#fff';
      printDiv.style.overflow = 'visible';
      printDiv.innerHTML = sanitizedHtml;
      document.body.appendChild(printDiv);

      // Kiểm tra xem element có nội dung không
      if (!printDiv.innerHTML || printDiv.innerHTML.trim().length === 0) {
        throw new Error('Nội dung hợp đồng trống');
      }

      console.log('Element innerHTML length:', printDiv.innerHTML.length);
      console.log('Element scrollHeight:', printDiv.scrollHeight);
      console.log('Element scrollWidth:', printDiv.scrollWidth);

      // Đợi để HTML render xong và images load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Kiểm tra lại sau khi render
      console.log('After wait - scrollHeight:', printDiv.scrollHeight, 'scrollWidth:', printDiv.scrollWidth);
      
      if (printDiv.scrollHeight === 0 || printDiv.scrollWidth === 0) {
        console.error('Element dimensions:', {
          scrollHeight: printDiv.scrollHeight,
          scrollWidth: printDiv.scrollWidth,
          offsetHeight: printDiv.offsetHeight,
          offsetWidth: printDiv.offsetWidth,
          clientHeight: printDiv.clientHeight,
          clientWidth: printDiv.clientWidth
        });
        throw new Error('Không thể render nội dung hợp đồng - kích thước element = 0');
      }

      // Đợi tất cả images load xong
      const images = printDiv.querySelectorAll('img');
      if (images.length > 0) {
        await Promise.all(
          Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = resolve; // Continue even if image fails
              setTimeout(resolve, 3000); // Timeout after 3s
            });
          })
        );
      }

      // Render HTML thành canvas
      console.log('Starting html2canvas with dimensions:', {
        width: printDiv.scrollWidth,
        height: printDiv.scrollHeight,
        scale: 2
      });
      
      const canvas = await html2canvas(printDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true, // Bật logging để debug
        backgroundColor: '#ffffff',
        width: printDiv.scrollWidth || 794,
        height: printDiv.scrollHeight || 1123,
        x: 0,
        y: 0,
        onclone: (clonedDoc, element) => {
          // Xử lý tất cả các element trong cloned document để loại bỏ oklch
          const allElements = clonedDoc.querySelectorAll('*');
          
          allElements.forEach(el => {
            // Xử lý inline styles - chỉ override các properties có oklch
            if (el.style && el.style.length > 0) {
              const styleProps = [];
              for (let i = 0; i < el.style.length; i++) {
                styleProps.push(el.style[i]);
              }
              
              styleProps.forEach(prop => {
                try {
                  const value = el.style.getPropertyValue(prop);
                  if (value && (value.includes('oklch') || value.includes('lab(') || value.includes('lch('))) {
                    // Chỉ override nếu có oklch, không override tất cả
                    if (prop.includes('background')) {
                      el.style.setProperty(prop, '#ffffff', 'important');
                    } else if (prop.includes('color') || prop.includes('border')) {
                      el.style.setProperty(prop, '#000000', 'important');
                    }
                  }
                } catch (e) {
                  // Bỏ qua nếu không thể đọc property
                }
              });
            }
          });
          
          // Xử lý các style tags trong cloned document
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach(styleTag => {
            if (styleTag.textContent) {
              styleTag.textContent = styleTag.textContent
                .replace(/oklch\([^)]+\)/gi, '#000000')
                .replace(/lab\([^)]+\)/gi, '#000000')
                .replace(/lch\([^)]+\)/gi, '#000000');
            }
          });
        },
      });

      // Xóa div tạm
      if (printDiv && printDiv.parentNode) {
        document.body.removeChild(printDiv);
      }

      // Kiểm tra canvas có dữ liệu không
      console.log('Canvas created:', {
        width: canvas?.width,
        height: canvas?.height,
        exists: !!canvas
      });
      
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error(`Không thể render hợp đồng thành ảnh. Canvas: ${canvas ? `${canvas.width}x${canvas.height}` : 'null'}`);
      }
      
      // Kiểm tra canvas có dữ liệu thực sự không
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, Math.min(100, canvas.width), Math.min(100, canvas.height));
      const hasData = imageData.data.some(pixel => pixel !== 0);
      console.log('Canvas has data:', hasData);
      
      if (!hasData) {
        throw new Error('Canvas được tạo nhưng không có dữ liệu (toàn màu trắng/trong suốt)');
      }

      // Tính toán kích thước PDF
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png', 0.95);
      
      // Kiểm tra imgData
      if (!imgData || imgData === 'data:,') {
        throw new Error('Không thể tạo ảnh từ canvas');
      }

      let heightLeft = imgHeight;
      let position = 0;

      // Thêm ảnh vào trang đầu
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Nếu nội dung dài hơn 1 trang, thêm các trang mới
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Lưu file
      pdf.save(`HopDong_${selectedHopDong.HopDongID}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Lỗi tải xuống PDF:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Đảm bảo xóa div tạm nếu có lỗi
      if (printDiv && printDiv.parentNode) {
        document.body.removeChild(printDiv);
      }
      
      alert(`Có lỗi xảy ra khi tải xuống hợp đồng PDF: ${error.message || 'Lỗi không xác định'}. Vui lòng thử lại hoặc tải xuống định dạng HTML.`);
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Kiểm tra xem hợp đồng có thể hủy không
  const coTheHuy = (hopDong) => {
    if (!hopDong) {
      return false;
    }
    
    const trangThai = hopDong.TrangThai;
    
    // Không cho phép hủy nếu đã bị hủy rồi
    if (trangThai === 'xinhuy' || trangThai === 'dahuy') {
      return false;
    }
    
    // Cho phép hủy nếu:
    // - TrangThai = null/undefined/empty (hợp đồng mới tạo)
    // - TrangThai = 'xacthuc' (Xác thực)
    // BỎ điều kiện 3 ngày - luôn cho phép hủy
    return true;
  };

  // Hủy hợp đồng
  const handleHuyHopDong = async (hopDong = null) => {
    const hopDongToCancel = hopDong || selectedHopDong;
    if (!hopDongToCancel) return;

    if (!window.confirm('Bạn có chắc chắn muốn hủy hợp đồng này? Yêu cầu hủy sẽ được gửi đến quản trị viên để xem xét.')) {
      return;
    }

    try {
      setHuyLoading(true);
      const response = await hopDongApi.requestCancel(hopDongToCancel.HopDongID);

      if (response.data.success) {
        alert('Đã gửi yêu cầu hủy hợp đồng thành công. Quản trị viên sẽ xem xét và phản hồi.');
        await taiDanhSach();
        if (modalOpen) closeModal();
      } else {
        alert(response.data.message || 'Không thể gửi yêu cầu hủy hợp đồng');
      }
    } catch (error) {
      console.error('Lỗi hủy hợp đồng:', error);
      const message = error.response?.data?.message || 'Không thể gửi yêu cầu hủy hợp đồng';
      alert(message);
    } finally {
      setHuyLoading(false);
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

  return (
    <div className="hdct-container">
      {/* Header */}
      <div className="hdct-header">
        <button className="hdct-back-btn" onClick={() => navigate('/')}>
          <HiOutlineHome />
          <span>Về trang chủ</span>
        </button>
        <div className="hdct-header-content">
          <HiOutlineDocumentText className="hdct-icon-large" />
          <div>
            <h1>Hợp đồng của tôi</h1>
            <p className="hdct-subtitle">Danh sách hợp đồng giao dịch bất động sản của bạn</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="hdct-filters">
        <div className="hdct-filter-group">
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

        <div className="hdct-filter-group">
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

        <button className="hdct-btn-filter" onClick={apDungFilter}>
          Áp dụng
        </button>
      </div>

      {/* Stats */}
      <div className="hdct-stats">
        <div className="hdct-stat-card">
          <HiOutlineDocumentText className="hdct-stat-icon" />
          <div className="hdct-stat-content">
            <h3>{hopDongs.length}</h3>
            <p>Tổng hợp đồng</p>
          </div>
        </div>
        <div className="hdct-stat-card">
          <HiOutlineCheckCircle className="hdct-stat-icon" style={{ color: '#10b981' }} />
          <div className="hdct-stat-content">
            <h3>{hopDongs.filter(hd => hd.BaoCaoLuc).length}</h3>
            <p>Đã báo cáo</p>
          </div>
        </div>
        <div className="hdct-stat-card">
          <HiOutlineXCircle className="hdct-stat-icon" style={{ color: '#3b82f6' }} />
          <div className="hdct-stat-content">
            <h3>{hopDongs.filter(hd => !hd.BaoCaoLuc && hd.noidunghopdong).length}</h3>
            <p>Vừa tạo</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="hdct-table-container">
        {loading ? (
          <div className="hdct-loading">Đang tải...</div>
        ) : hopDongs.length === 0 ? (
          <div className="hdct-empty">
            <HiOutlineDocumentText className="hdct-empty-icon" />
            <p>Bạn chưa có hợp đồng nào</p>
            <button className="hdct-btn-primary" onClick={() => navigate('/')}>
              Tìm phòng ngay
            </button>
          </div>
        ) : (
          <table className="hdct-table">
            <thead>
              <tr>
                <th>Mã HĐ</th>
                <th>Tin đăng</th>
                <th>Dự án</th>
                <th>Chủ dự án</th>
                <th>Phòng</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Giá thuê</th>
                <th>Cọc</th>
                <th>Trạng thái</th>
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
                      <div className="hdct-td-tin-dang">
                        <HiOutlineDocumentText />
                        <span>{hd.TenTinDang || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="hdct-td-du-an">
                        <HiOutlineBuildingOffice2 />
                        <span>{hd.TenDuAn || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="hdct-td-chu-du-an">
                        <HiOutlineUser />
                        <div>
                          <p className="hdct-chu-name">{hd.TenChuDuAn || 'N/A'}</p>
                          <p className="hdct-chu-phone">{hd.SDTChuDuAn || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td>{hd.TenPhong || 'N/A'}</td>
                    <td>{formatDate(hd.NgayBatDau)}</td>
                    <td>{formatDate(hd.NgayKetThuc)}</td>
                    <td className="hdct-td-currency">{formatCurrency(hd.GiaThueCuoiCung)}</td>
                    <td>
                      <div className="hdct-td-coc">
                        <span className="hdct-coc-amount">{formatCurrency(hd.SoTienCoc)}</span>
                        {hd.TrangThaiCoc === 'DaGiaiToa' && (
                          <span className="hdct-badge hdct-badge-success">
                            <HiOutlineCheckCircle /> Đã giải tỏa
                          </span>
                        )}
                        {hd.TrangThaiCoc === 'DaDoiTru' && (
                          <span className="hdct-badge hdct-badge-info">
                            <HiOutlineCheckCircle /> Đã đối trừ
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`hdct-badge hdct-badge-${trangThai.type}`}>
                        {trangThai.label}
                      </span>
                    </td>
                    <td>
                      <div className="hdct-actions">
                        <button 
                          className="hdct-btn-action hdct-btn-view" 
                          title="Xem chi tiết"
                          onClick={() => handleXemChiTiet(hd)}
                        >
                          <HiOutlineEye />
                        </button>
                        {coTheHuy(hd) && (
                          <button 
                            className="hdct-btn-action hdct-btn-danger" 
                            title="Hủy hợp đồng"
                            onClick={() => handleHuyHopDong(hd)}
                            disabled={huyLoading}
                          >
                            <HiOutlineTrash />
                          </button>
                        )}
                      </div>
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
          className="hen-modal-overlay"
          onClick={closeModal}
        >
          {console.log('[Modal Render] Modal đang được render, selectedHopDong:', selectedHopDong)}
          <div
            className="hop-dong-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="hop-dong-modal__header">
              <div>
                <h3>Hợp đồng #{selectedHopDong.HopDongID}</h3>
                {selectedHopDong.TenPhong && (
                  <p className="hop-dong-modal__subtitle">
                    Phòng: {selectedHopDong.TenPhong}
                    {selectedHopDong.GiaThueCuoiCung && ` • ${formatCurrency(selectedHopDong.GiaThueCuoiCung)}/tháng`}
                  </p>
                )}
              </div>
              <button
                className="hop-dong-modal__close"
                onClick={closeModal}
                aria-label="Đóng"
              >
                <HiOutlineXMark size={20} />
              </button>
            </div>

            {selectedHopDong.noidunghopdong ? (
              <div
                id="hopdong-preview-content"
                className="hop-dong-modal__preview"
                dangerouslySetInnerHTML={{
                  __html: selectedHopDong.noidunghopdong || '',
                }}
              />
            ) : (
              <div className="hop-dong-modal__state">
                Hợp đồng chưa có nội dung
              </div>
            )}

            <div className="hop-dong-modal__actions">
              <button>abcxyz</button>
              <div className="hop-dong-modal__download-group">
                <button
                  className="hen-btn primary"
                  onClick={handleDownloadPDF}
                  disabled={!selectedHopDong?.noidunghopdong || downloadingPDF}
                  title="Tải xuống PDF"
                >
                  <HiOutlineArrowDownTray style={{ marginRight: '6px' }} />
                  {downloadingPDF ? 'Đang xử lý...' : 'PDF'}
                </button>
                <button
                  className="hen-btn secondary"
                  onClick={handleDownloadTXT}
                  disabled={!selectedHopDong?.noidunghopdong}
                  title="Tải xuống TXT"
                >
                  <HiOutlineArrowDownTray style={{ marginRight: '6px' }} />
                  TXT
                </button>
                <button
                  className="hen-btn secondary"
                  onClick={handleDownloadHTML}
                  disabled={!selectedHopDong?.noidunghopdong}
                  title="Tải xuống HTML"
                >
                  <HiOutlineArrowDownTray style={{ marginRight: '6px' }} />
                  HTML
                </button>
              </div>
              {/* Nút hủy hợp đồng - LUÔN HIỂN THỊ */}
              {selectedHopDong?.TrangThai === 'xinhuy' ? (
                <span className="hen-btn danger" style={{ opacity: 0.7, cursor: 'not-allowed', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', marginLeft: 'auto' }}>
                  Đã gửi yêu cầu hủy
                </span>
              ) : selectedHopDong?.TrangThai === 'dahuy' ? (
                <span className="hen-btn danger" style={{ opacity: 0.7, cursor: 'not-allowed', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', marginLeft: 'auto' }}>
                  Đã hủy
                </span>
              ) : (
                <button
                  className="hen-btn danger"
                  onClick={() => {
                    console.log('[Huy Button] Clicked!', selectedHopDong);
                    handleHuyHopDong(selectedHopDong);
                  }}
                  disabled={huyLoading}
                  title="Hủy hợp đồng"
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center',
                    padding: '10px 18px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    cursor: huyLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginLeft: 'auto'
                  }}
                >
                  <HiOutlineTrash style={{ marginRight: '6px', width: '18px', height: '18px' }} />
                  {huyLoading ? 'Đang xử lý...' : 'Hủy hợp đồng'}
                </button>
              )}
              <button
                className="hen-btn secondary"
                onClick={closeModal}
              >
                Đóng (TEST)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

