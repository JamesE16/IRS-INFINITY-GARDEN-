import { useState } from "react";
import Sidebar from "../../components/Sidebar";

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

// ───────── FULL YEAR RESERVATIONS (WITH NAMES + STATUS) ─────────
const rawReservations = [
  // JANUARY
  { date: "2026-01-03", label: "Pavilion A", customer: "Juan Dela Cruz", status: "pending" },
  { date: "2026-01-07", label: "Garde Cottage", customer: "Maria Santos", status: "approved" },
  { date: "2026-01-12", label: "Room 101", customer: "John Reyes", status: "pending" },
  { date: "2026-01-15", label: "New Year Event - Pavilion B", customer: "ABC Corp", status: "approved" },

  // FEBRUARY
  { date: "2026-02-02", label: "Cottage 2", customer: "Ana Lopez", status: "pending" },
  { date: "2026-02-05", label: "Room 102", customer: "Carlos Mendoza", status: "approved" },

  // MARCH
  { date: "2026-03-03", label: "Cottage 3", customer: "Elena Cruz", status: "pending" },
  { date: "2026-03-06", label: "Room 101", customer: "Miguel Torres", status: "approved" },

  // APRIL
  { date: "2026-04-03", label: "Cottage 1", customer: "Sofia Reyes", status: "pending" },
  { date: "2026-04-07", label: "Pavilion A", customer: "David Lim", status: "approved" },
  { date: "2026-04-11", label: "Cottage 3", customer: "Isabella Garcia", status: "pending" },
  { date: "2026-04-15", label: "Room 101", customer: "Andres Cruz", status: "approved" },
  { date: "2026-04-20", label: "Wedding Event - Pavilion B", customer: "Grace Tan", status: "pending" },
  { date: "2026-04-24", label: "Room 201", customer: "Mark Villanueva", status: "approved" },

  // MAY
  { date: "2026-05-02", label: "Pavilion A", customer: "Liam Santos", status: "pending" },
  { date: "2026-05-06", label: "Room 102", customer: "Noah Reyes", status: "approved" },

  // JUNE
  { date: "2026-06-01", label: "Room 101", customer: "Emma Garcia", status: "pending" },
  { date: "2026-06-05", label: "Cottage 3", customer: "Lucas Mendoza", status: "approved" },

  // JULY
  { date: "2026-07-02", label: "Cottage 1", customer: "Sophia Cruz", status: "pending" },
  { date: "2026-07-06", label: "Room 101", customer: "Ethan Lim", status: "approved" },

  // AUGUST
  { date: "2026-08-03", label: "Room 102", customer: "Olivia Santos", status: "pending" },
  { date: "2026-08-07", label: "Cottage 2", customer: "James Reyes", status: "approved" },

  // SEPTEMBER
  { date: "2026-09-02", label: "Room 101", customer: "Ava Cruz", status: "pending" },
  { date: "2026-09-06", label: "Cottage 3", customer: "Benjamin Garcia", status: "approved" },

  // OCTOBER
  { date: "2026-10-03", label: "Cottage 1", customer: "Charlotte Lim", status: "pending" },
  { date: "2026-10-07", label: "Room 102", customer: "Daniel Mendoza", status: "approved" },

  // NOVEMBER
  { date: "2026-11-02", label: "Room 101", customer: "Amelia Reyes", status: "pending" },
  { date: "2026-11-06", label: "Cottage 2", customer: "Henry Santos", status: "approved" },

  // DECEMBER
  { date: "2026-12-01", label: "Room 101", customer: "Mia Cruz", status: "pending" },
  { date: "2026-12-05", label: "Cottage 3", customer: "Alexander Garcia", status: "approved" },
  { date: "2026-12-20", label: "Wedding Event - Pavilion B", customer: "Sophia & Mark", status: "approved" },
  { date: "2026-12-31", label: "New Year Countdown - Pavilion A", customer: "Event Group", status: "pending" }
];

const reservations = rawReservations.map((reservation, index) => ({
  ...reservation,
  guests: 4 + (index % 4)
}));

export default function AdminScheduleManagement({ role = 'admin' }) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3));
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const isAdmin = role === 'admin';

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // FILTER
  const filteredReservations = reservations.filter(r => {
    const resDate = new Date(r.date);
    const sameMonth = isSameMonth(resDate, currentDate);
    const statusMatch = activeTab === "all" ? true : r.status === activeTab;
    return sameMonth && statusMatch;
  });

  const getCount = (type) => {
    return reservations.filter(r => {
      const resDate = new Date(r.date);
      const sameMonth = isSameMonth(resDate, currentDate);
      return type === "all" ? sameMonth : sameMonth && r.status === type;
    }).length;
  };

  const renderHeader = () => (
    <div className={styles.calHeader}>
      <button onClick={prevMonth} className={styles.navBtn}>◀</button>
      <h2>{format(currentDate, "MMMM yyyy")}</h2>
      <button onClick={nextMonth} className={styles.navBtn}>▶</button>
    </div>
  );

  const renderDays = () => {
    const startDate = startOfWeek(currentDate);
    return (
      <div className={styles.daysRow}>
        {[...Array(7)].map((_, i) => (
          <div key={i} className={styles.dayName}>
            {format(addDays(startDate, i), "EEE").toUpperCase()}
          </div>
        ))}
      </div>
    );
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
        const event = filteredReservations.find(r =>
          isSameDay(new Date(r.date), day)
        );

        const isDisabled = !isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            className={`${styles.cell} ${isDisabled ? styles.disabled : ""} ${event ? styles.hasEvent : ""}`}
            onClick={() => event && setSelectedReservation(event)}
          >
            <span className={styles.date}>{format(day, "d")}</span>

            {event && (
              <div className={styles.event}>
                <span className={styles.dot}></span>
                {event.label} - {event.customer} ({event.status})
              </div>
            )}
          </div>
        );

        day = addDays(day, 1);
      }

      rows.push(
        <div className={styles.row} key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }

    return <div>{rows}</div>;
  };

  return (
    <div className={styles.adminShell}>
      <Sidebar role={role} />

      <div className={styles.mainContent}>
        <div className={styles.topHeader}>
          <div>
            <h1>Schedule Management</h1>
            <p>
              {isAdmin
                ? 'Infinity Garden Resort Reservation Management System'
                : 'Infinity Garden Resort - Staff View'}
            </p>
          </div>

        </div>

        <div className={styles.container}>
          <div className={styles.tabs}>
            {["pending", "approved", "all"].map(tab => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.active : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({getCount(tab)})
              </button>
            ))}
          </div>

          <div className={styles.calendarBox}>
            <h3>Reservation Calendar and Availability</h3>

            <div className={styles.calendar}>
              {renderHeader()}
              {renderDays()}
              {renderCells()}
            </div>
          </div>
        </div>
      </div>

      {selectedReservation && (
        <div className={styles.modalOverlay} onClick={() => setSelectedReservation(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Reservation Details</h3>
              <button className={styles.modalClose} onClick={() => setSelectedReservation(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalRow}><span>Name</span><strong>{selectedReservation.customer}</strong></div>
              <div className={styles.modalRow}><span>Room / Facility</span><strong>{selectedReservation.label}</strong></div>
              <div className={styles.modalRow}><span>Guests</span><strong>{selectedReservation.guests}</strong></div>
              <div className={styles.modalRow}><span>Date</span><strong>{selectedReservation.date}</strong></div>
            </div>
            <button className={styles.closeBtn} onClick={() => setSelectedReservation(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
