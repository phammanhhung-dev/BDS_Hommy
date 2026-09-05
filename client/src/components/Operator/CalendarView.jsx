import './CalendarView.css';

/**
 * Calendar View Component
 * Hiển thị lịch tháng với:
 * - Ca làm (shifts) của NVBH
 * - Cuộc hẹn (appointments) trong các ca
 */
const CalendarView = ({
  shifts = [],
  appointments = [],
  selectedMonth,
  onAppointmentClick,
  onShiftClick
}) => {
  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    return { daysInMonth, startDayOfWeek };
  };

  // Group shifts & appointments by date
  const groupByDate = (items, getDate) => {
    const grouped = {};
    (Array.isArray(items) ? items : []).forEach((item) => {
      const date = getDate(item).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    return grouped;
  };

  const { daysInMonth, startDayOfWeek } = getDaysInMonth(selectedMonth);
  const groupedShifts = groupByDate(
    shifts,
    (shift) => new Date(shift.BatDau || shift.BatDauCa || shift.BatDauCaLam || shift.start || shift.batDau)
  );
  const groupedAppointments = groupByDate(
    appointments,
    (event) => new Date(event.ThoiGianHen)
  );

  // Generate calendar cells
  const renderCalendar = () => {
    const cells = [];
    const totalCells = Math.ceil((daysInMonth + startDayOfWeek) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - startDayOfWeek + 1;
      const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;
      
      if (isValidDay) {
        const currentDate = new Date(
          selectedMonth.getFullYear(),
          selectedMonth.getMonth(),
          dayNumber
        );
        const dateKey = currentDate.toDateString();
        const dayShifts = groupedShifts[dateKey] || [];
        const dayAppointments = groupedAppointments[dateKey] || [];
        const isToday = currentDate.toDateString() === new Date().toDateString();
        const hasEvents = dayShifts.length > 0 || dayAppointments.length > 0;

        cells.push(
          <div 
            key={i} 
            className={`calendar-view__day ${isToday ? 'is-today' : ''} ${hasEvents ? 'has-events' : ''}`}
          >
            <div className="calendar-view__day-number">{dayNumber}</div>

            {/* Shifts block */}
            <div className="calendar-view__shifts">
              {dayShifts.map((shift) => (
                <div
                  key={shift.LichID}
                  className="calendar-view__shift"
                  onClick={() => onShiftClick && onShiftClick(shift)}
                  title={`${shift.TenNhanVien || ''} • ${shift.TenKhuVuc || ''}`}
                >
                  <div className="calendar-view__shift-header">
                    <span className="calendar-view__shift-badge">Ca làm</span>
                    <span className="calendar-view__shift-employee">
                      {shift.TenNhanVien || 'NVBH'}
                    </span>
                  </div>
                  <div className="calendar-view__shift-time">
                    {new Date(shift.BatDau).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {' - '}
                    {new Date(shift.KetThuc).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="calendar-view__shift-meta">
                    <span>
                      {shift.SoCuocHen || 0} cuộc hẹn
                      {shift.SoCuocHenDaXacNhan
                        ? ` • ${shift.SoCuocHenDaXacNhan} đã xác nhận`
                        : ''}
                    </span>
                    {shift.TenKhuVuc && (
                      <span className="calendar-view__shift-area">{shift.TenKhuVuc}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Appointments block */}
            <div className="calendar-view__events">
              {dayAppointments.slice(0, 3).map((event, idx) => (
                <div
                  key={`${event.CuocHenID}-${idx}`}
                  className={`calendar-view__event calendar-view__event--${(event.TrangThai || '').toLowerCase()}`}
                  onClick={() => onAppointmentClick && onAppointmentClick(event)}
                  title={`${event.TenKhachHang} - ${event.TenNVBH || 'Chưa phân công'}`}
                >
                  <span className="calendar-view__event-time">
                    {new Date(event.ThoiGianHen).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="calendar-view__event-title">
                    {event.TenKhachHang}
                  </span>
                </div>
              ))}
              {dayAppointments.length > 3 && (
                <div className="calendar-view__event-more">
                  +{dayAppointments.length - 3} cuộc hẹn khác
                </div>
              )}
            </div>
          </div>
        );
      } else {
        cells.push(
          <div key={i} className="calendar-view__day calendar-view__day--empty"></div>
        );
      }
    }

    return cells;
  };

  return (
    <div className="calendar-view">
      {/* Weekday headers */}
      <div className="calendar-view__header">
        <div className="calendar-view__weekday">CN</div>
        <div className="calendar-view__weekday">T2</div>
        <div className="calendar-view__weekday">T3</div>
        <div className="calendar-view__weekday">T4</div>
        <div className="calendar-view__weekday">T5</div>
        <div className="calendar-view__weekday">T6</div>
        <div className="calendar-view__weekday">T7</div>
      </div>

      {/* Calendar grid */}
      <div className="calendar-view__grid">
        {renderCalendar()}
      </div>

      {/* Legend */}
      <div className="calendar-view__legend">
        <div className="calendar-view__legend-item">
          <span className="calendar-view__legend-badge calendar-view__legend-badge--shift"></span>
          <span className="calendar-view__legend-label">Ca làm NVBH</span>
        </div>
        <div className="calendar-view__legend-item">
          <span className="calendar-view__legend-badge calendar-view__legend-badge--choxacnhan"></span>
          <span className="calendar-view__legend-label">Chờ xác nhận</span>
        </div>
        <div className="calendar-view__legend-item">
          <span className="calendar-view__legend-badge calendar-view__legend-badge--daxacnhan"></span>
          <span className="calendar-view__legend-label">Đã xác nhận</span>
        </div>
        <div className="calendar-view__legend-item">
          <span className="calendar-view__legend-badge calendar-view__legend-badge--hoanthanh"></span>
          <span className="calendar-view__legend-label">Hoàn thành</span>
        </div>
        <div className="calendar-view__legend-item">
          <span className="calendar-view__legend-badge calendar-view__legend-badge--huy"></span>
          <span className="calendar-view__legend-label">Đã hủy</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;






