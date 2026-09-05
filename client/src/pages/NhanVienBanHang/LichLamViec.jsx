/**
 * UC-SALE-01: Lịch làm việc
 * Đăng ký và quản lý ca làm việc
 */

import React, { useEffect, useState } from 'react';
import CalendarGrid from '../../components/NhanVienBanHang/CalendarGrid';
import { layLichLamViec, taoLichLamViec, xoaLichLamViec, getWeekStart, getWeekEnd } from '../../api/nhanVienBanHangApi';
import './LichLamViec.css';

// Helper: format Date về string "YYYY-MM-DD HH:mm:ss" (giờ local, không timezone)
const formatLocalDateTime = (date) => {
  const d = new Date(date);
  const pad = (n) => n.toString().padStart(2, '0');

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const LichLamViec = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [duration, setDuration] = useState('4');

  useEffect(() => {
    loadShifts();
  }, [weekStart]);

  const loadShifts = async () => {
    try {
      setLoading(true);
      const weekEnd = getWeekEnd(weekStart);
      const response = await layLichLamViec({
        tuNgay: formatLocalDateTime(weekStart),
        denNgay: formatLocalDateTime(weekEnd)
      });
      if (response.success) {
        const normalizedShifts = (response.data?.lichLamViecs || []).map((shift) => ({
          ...shift,
          batDau: shift.batDau || shift.BatDau,
          ketThuc: shift.ketThuc || shift.KetThuc,
          soCuocHen: shift.soCuocHen ?? shift.SoCuocHen ?? 0,
          soDaXacNhan: shift.soDaXacNhan ?? shift.SoDaXacNhan ?? 0
        }));
        setShifts(normalizedShifts);
      }
    } catch (error) {
      console.error('Lỗi load lịch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSlotClick = (date) => {
    setSelectedDate(date);
    setDuration('4');
    setShowModal(true);
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const durationValue = parseInt(formData.get('duration'));
    
    const batDau = new Date(selectedDate);
    const ketThuc = new Date(batDau);
    ketThuc.setHours(ketThuc.getHours() + durationValue);

    try {
      const response = await taoLichLamViec({
        batDau: formatLocalDateTime(batDau),
        ketThuc: formatLocalDateTime(ketThuc)
      });
      if (response.success) {
        alert('Tạo ca làm việc thành công!');
        setShowModal(false);
        loadShifts();
      }
    } catch (error) {
      alert(error.message || 'Lỗi tạo ca làm việc');
    }
  };

  const handleDeleteShift = async (shiftId) => {
    if (!window.confirm('Xác nhận xóa ca làm việc này?')) return;
    
    try {
      await xoaLichLamViec(shiftId);
      alert('Xóa ca làm việc thành công!');
      loadShifts();
    } catch (error) {
      alert(error.message || 'Không thể xóa ca làm việc');
    }
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() - 7);
    setWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + 7);
    setWeekStart(newDate);
  };

  const formattedStartTime = selectedDate
    ? selectedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const formattedStartDate = selectedDate
    ? selectedDate.toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : '--/--';

  return (
    <div className="nvbh-lich-lam-viec">
      <div className="nvbh-page-header">
        <h1 className="nvbh-page-title">Lịch làm việc</h1>
        <div className="nvbh-week-nav">
          <button className="nvbh-btn nvbh-btn--ghost" onClick={goToPreviousWeek}>← Tuần trước</button>
          <span className="nvbh-week-label">
            Tuần {weekStart.toLocaleDateString('vi-VN')} - {getWeekEnd(weekStart).toLocaleDateString('vi-VN')}
          </span>
          <button className="nvbh-btn nvbh-btn--ghost" onClick={goToNextWeek}>Tuần sau →</button>
        </div>
      </div>

      {loading ? (
        <div className="nvbh-loading"><div className="nvbh-loading-spinner" /><p>Đang tải...</p></div>
      ) : (
        <div className="nvbh-card">
          <CalendarGrid
            shifts={shifts}
            weekStart={weekStart}
            onTimeSlotClick={handleTimeSlotClick}
            onShiftClick={(shift) => {
              if (window.confirm('Xóa ca này?')) {
                handleDeleteShift(shift.LichID);
              }
            }}
          />
        </div>
      )}

      {/* Modal tạo ca */}
      {showModal && (
        <div className="nvbh-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nvbh-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nvbh-modal__header">
              <div>
                <h2 className="nvbh-modal__title">Tạo ca làm việc</h2>
                <p className="nvbh-modal__subtitle">
                  Khai báo khung giờ rảnh để hệ thống tự động phân công Cuộc hẹn
                </p>
              </div>
              <button
                type="button"
                className="nvbh-modal__close"
                onClick={() => setShowModal(false)}
                aria-label="Đóng modal tạo ca"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateShift}>
              <div className="nvbh-modal__body">
                <div className="nvbh-modal__grid">
                  <div className="nvbh-modal__card nvbh-modal__card--accent">
                    <span className="nvbh-modal__badge">Ca đang tạo</span>
                    <p className="nvbh-modal__label">Thời gian bắt đầu</p>
                    <div className="nvbh-modal__time-block">
                      <span className="nvbh-modal__time">{formattedStartTime}</span>
                      <span className="nvbh-modal__date">{formattedStartDate}</span>
                    </div>
                    <p className="nvbh-modal__hint">
                      Hệ thống sẽ tự khóa các slot trùng sau khi lưu ca này.
                    </p>
                  </div>
                  <div className="nvbh-modal__card">
                    <div className="nvbh-modal__field">
                      <label className="nvbh-modal__label" htmlFor="nvbh-modal-duration">
                        Thời lượng ca
                      </label>
                      <select
                        id="nvbh-modal-duration"
                        name="duration"
                        className="nvbh-modal__select"
                        required
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                      >
                        <option value="2">2 giờ</option>
                        <option value="3">3 giờ</option>
                        <option value="4">4 giờ</option>
                        <option value="8">8 giờ</option>
                      </select>
                    </div>
                    <div className="nvbh-modal__suggestions">
                      <span
                        className={`nvbh-modal__tag ${duration === '4' ? 'nvbh-modal__tag--active' : ''}`}
                        onClick={() => setDuration('4')}
                      >
                        4 giờ • Ca tiêu chuẩn
                      </span>
                      <span
                        className={`nvbh-modal__tag ${duration === '8' ? 'nvbh-modal__tag--active' : ''}`}
                        onClick={() => setDuration('8')}
                      >
                        8 giờ • Hỗ trợ dự án
                      </span>
                    </div>
                    <p className="nvbh-modal__hint">
                      Có thể điều chỉnh sau nếu lịch vẫn trống.
                    </p>
                  </div>
                </div>
                <div className="nvbh-modal__tips">
                  <h4 className="nvbh-modal__tips-title">Nguyên tắc lập ca</h4>
                  <ul className="nvbh-modal__tips-list">
                    <li className="nvbh-modal__tips-item">
                      Không trùng với ca đã có Cuộc hẹn xác nhận.
                    </li>
                    <li className="nvbh-modal__tips-item">
                      Tạo ca trước ít nhất 24h để hệ thống phân công hiệu quả.
                    </li>
                    <li className="nvbh-modal__tips-item">
                      Ưu tiên ca 4 giờ cho khung giờ cao điểm (sáng 8h-12h, chiều 13h-17h).
                    </li>
                  </ul>
                </div>
              </div>
              <div className="nvbh-modal__footer">
                <button type="button" className="nvbh-btn nvbh-btn--secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="nvbh-btn nvbh-btn--primary">Tạo ca</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LichLamViec;








