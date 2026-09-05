/**
 * CalendarGrid - Weekly calendar view
 * Grid 7 days × time slots cho lịch làm việc
 */

import React, { useState } from 'react';
import './CalendarGrid.css';

const CalendarGrid = ({ shifts = [], onShiftClick, onTimeSlotClick, weekStart }) => {
  // Days of week
  const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const daysFull = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

  // Time slots (7AM to 9PM)
  const timeSlots = [];
  for (let hour = 7; hour <= 21; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  // Get dates for the week
  const getWeekDates = () => {
    const dates = [];
    const start = weekStart ? new Date(weekStart) : new Date();
    start.setDate(start.getDate() - start.getDay()); // Go to Sunday

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  // Check if a shift is in a specific time slot
  const getShiftInSlot = (dayIndex, timeSlot) => {
    const date = weekDates[dayIndex];
    const [hour] = timeSlot.split(':');
    
    return shifts.filter((shift) => {
      const shiftStart = new Date(shift.batDau);
      const shiftEnd = new Date(shift.ketThuc);
      
      // Check if shift is on this day and overlaps with this hour
      if (
        shiftStart.toDateString() === date.toDateString() &&
        shiftStart.getHours() <= parseInt(hour) &&
        shiftEnd.getHours() > parseInt(hour)
      ) {
        return true;
      }
      return false;
    });
  };

  // Handle time slot click
  const handleSlotClick = (dayIndex, timeSlot) => {
    if (onTimeSlotClick) {
      const date = weekDates[dayIndex];
      const [hour, minute] = timeSlot.split(':');
      date.setHours(parseInt(hour), parseInt(minute), 0, 0);
      onTimeSlotClick(date);
    }
  };

  return (
    <div className="nvbh-calendar">
      {/* Header - Days of week */}
      <div className="nvbh-calendar__header">
        <div className="nvbh-calendar__time-label">Giờ</div>
        {weekDates.map((date, index) => (
          <div key={index} className="nvbh-calendar__day-header">
            <div className="nvbh-calendar__day-name">{daysOfWeek[index]}</div>
            <div className="nvbh-calendar__day-date">{formatDate(date)}</div>
          </div>
        ))}
      </div>

      {/* Body - Time slots grid */}
      <div className="nvbh-calendar__body">
        {timeSlots.map((timeSlot, timeIndex) => (
          <div key={timeIndex} className="nvbh-calendar__row">
            {/* Time label */}
            <div className="nvbh-calendar__time">{timeSlot}</div>

            {/* Day cells */}
            {weekDates.map((date, dayIndex) => {
              const shiftsInSlot = getShiftInSlot(dayIndex, timeSlot);
              const hasShift = shiftsInSlot.length > 0;

              return (
                <div
                  key={dayIndex}
                  className={`nvbh-calendar__cell ${hasShift ? 'nvbh-calendar__cell--has-shift' : ''}`}
                  onClick={() => !hasShift && handleSlotClick(dayIndex, timeSlot)}
                  role="button"
                  tabIndex={hasShift ? -1 : 0}
                >
                  {hasShift && (
                    <div
                      className="nvbh-calendar__shift"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShiftClick && onShiftClick(shiftsInSlot[0]);
                      }}
                    >
                      <span className="nvbh-calendar__shift-time">
                        {new Date(shiftsInSlot[0].batDau).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {' - '}
                        {new Date(shiftsInSlot[0].ketThuc).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {shiftsInSlot[0].soCuocHen > 0 && (
                        <span className="nvbh-calendar__shift-badge">
                          {shiftsInSlot[0].soCuocHen} hẹn
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarGrid;








