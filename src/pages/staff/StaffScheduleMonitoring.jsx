import { useState } from "react";
import StaffSidebar from "../../components/staff/StaffSidebar";

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay
} from "date-fns";

import styles from "../../styles/AdminScheduleManagement.module.css";

// ───────── MOCK SCHEDULE DATA ─────────
const reservations = [
  { date: "2026-04-07", label: "Pavilion A", customer: "Cristalyn Llarenas", status: "confirmed" },
  { date: "2026-04-11", label: "Cottage 3", customer: "James Higoy", status: "confirmed" },
  { date: "2026-04-20", label: "Pavilion B", customer: "Joanna Cooper", status: "confirmed" },
  { date: "2026-04-24", label: "Room 201", customer: "Sheena Emperador", status: "confirmed" },
  { date: "2026-04-29", label: "Pavilion A", customer: "Zean Marquez", status: "confirmed" },
];

export default function StaffScheduleMonitoring() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedReservation, setSelectedReservation] = useState(null);

  // ── Calendar helpers ────────────────────────────────────────────────────────
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const renderHeader = () => (
    <div className={styles.calendarHeader}>
      <button className={styles.calNavBtn} onClick={prevMonth}>◀</button>
      <h3 className={styles.calMonthLabel}>{format(currentDate, "MMMM yyyy")}</h3>
      <button className={styles.calNavBtn} onClick={nextMonth}>▶</button>
    </div>
  );

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentDate);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className={styles.dayName}>
          {format(addDays(startDate, i), "EEE")}
        </div>
      );
    }
    return <div className={styles.daysRow}>{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const reservation = reservations.find(r => isSameDay(new Date(r.date), day));
        const isToday = isSameDay(day, new Date());
        const notThisMonth = !isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            className={[
              styles.cell,
              notThisMonth  ? styles.disabled  : "",
              reservation   ? styles.reserved  : "",
              isToday && !reservation ? styles.today : "",
            ].join(" ")}
            onClick={() => reservation && setSelectedReservation(reservation)}
          >
            <span className={styles.cellDay}>{format(day, "d")}</span>
            {reservation && (
              <span className={styles.cellEvent}>
                <span className={styles.cellEventDot} />
                {reservation.label}
              </span>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className={styles.row} key={day.toString()}>{days}</div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className={styles.adminShell}>
      <StaffSidebar />

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.title}>
              <h1>Schedule Monitoring</h1>
              <p>View reservation schedules and availability</p>
            </div>
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.calendarWrap}>
            <h2 className={styles.sectionTitle}>Reservation Schedule</h2>
            <div className={styles.calendar}>
              {renderHeader()}
              {renderDays()}
              {renderCells()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Reservation Detail Modal ─────────────────────────────────── */}
      {selectedReservation && (
        <div className={styles.modalOverlay} onClick={() => setSelectedReservation(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Schedule Details</h3>
              <button className={styles.modalClose} onClick={() => setSelectedReservation(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalRow}><span>Facility</span><strong>{selectedReservation.label}</strong></div>
              <div className={styles.modalRow}><span>Customer</span><strong>{selectedReservation.customer}</strong></div>
              <div className={styles.modalRow}><span>Date</span><strong>{selectedReservation.date}</strong></div>
              <div className={styles.modalRow}><span>Status</span><strong>{selectedReservation.status}</strong></div>
            </div>
            <button className={styles.closeBtn} onClick={() => setSelectedReservation(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}