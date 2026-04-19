import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffSidebar from '../../components/staff/StaffSidebar';
import { adminAPI } from '../../utils/api';
import styles from '../../styles/AdminDashboard.module.css';

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

// ─── MOCK DATA (remove when backend is ready) ─────────────────────────────────
const MOCK_STATS = {
  total_guests: 150,
  total_reservations: 45,
  pending_reservations: 8,
  verified_payments: 32,
  todays_schedule: 5,
};

const MOCK_RESERVATIONS = [
  { date: "2026-04-07", name: "Cristalyn Llarenas",      room: "Pavilion A",  guests: 5 },
  { date: "2026-04-11", name: "James Higoy",   room: "Cottage 3",   guests: 3 },
  { date: "2026-04-20", name: "Joanna Cooper",   room: "Pavilion B",  guests: 8 },
  { date: "2026-04-24", name: "Sheena Emperador",  room: "Room 201",    guests: 2 },
  { date: "2026-04-29", name: "Zean Marquez", room: "Pavilion A",  guests: 6 },
];

// ─── STAT CARD COMPONENT ──────────────────────────────────────────────────────
function StatCard({ label, value, iconBg, iconStroke, children }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: iconBg }}>
        <svg viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2">
          {children}
        </svg>
      </div>
      <div className={styles.statContent}>
        <p className={styles.statLabel}>{label}</p>
        <p className={styles.statValue}>{value}</p>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function StaffDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [reservations, setReservations] = useState(MOCK_RESERVATIONS);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // For now, use mock data
        setStats(MOCK_STATS);
      } catch (err) {
        console.log('Using demo data');
        setStats(MOCK_STATS);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('staffEmail');
    localStorage.removeItem('isStaffLoggedIn');
    localStorage.removeItem('staffRole');
    navigate('/');
  };

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
                {reservation.room}
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

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.title}>
              <h1>Staff Dashboard</h1>
              <p>Infinity Garden Resort Reservation Management System</p>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* ── Main Content ────────────────────────────────────────────── */}
        <div className={styles.container}>

          {error && (
            <div className={styles.errorBanner}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <p>{error}</p>
            </div>
          )}

          {/* ── Stat Cards ─────────────────────────────────────────────── */}
          <div className={styles.statsGrid}>

            <StatCard label="Total Guests" value={stats?.total_guests ?? 0}
              iconBg="#e0f2fe" iconStroke="#0369a1">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </StatCard>

            <StatCard label="Total Reservations" value={stats?.total_reservations ?? 0}
              iconBg="#dbeafe" iconStroke="#0284c7">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </StatCard>

            <StatCard label="Pending Reservations" value={stats?.pending_reservations ?? 0}
              iconBg="#fef9c3" iconStroke="#eab308">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </StatCard>

            <StatCard label="Verified Payments" value={stats?.verified_payments ?? 0}
              iconBg="#dcfce7" iconStroke="#16a34a">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </StatCard>

            <StatCard label="Today's Schedule" value={stats?.todays_schedule ?? 0}
              iconBg="#fce7f3" iconStroke="#db2777">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </StatCard>

          </div>

          {/* ── Calendar + Sidebar ──────────────────────────────────────── */}
          <div className={styles.calendarLayout}>

            <div className={styles.calendarWrap}>
              <h2 className={styles.sectionTitle}>Reservation Calendar</h2>
              <div className={styles.calendar}>
                {renderHeader()}
                {renderDays()}
                {renderCells()}
              </div>
            </div>

            <div className={styles.sidebarSummary}>

              <div className={styles.summarySection}>
                <p className={styles.summarySectionTitle}>Reservation Summary</p>
                <div className={styles.summaryRow}>
                  <span>Total Reservations</span>
                  <strong>{stats?.total_reservations ?? 0}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Pending Reservations</span>
                  <strong className={styles.summaryAmber}>{stats?.pending_reservations ?? 0}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Verified Payments</span>
                  <strong>{stats?.verified_payments ?? 0}</strong>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ── Reservation Detail Modal ─────────────────────────────────── */}
      {selectedReservation && (
        <div className={styles.modalOverlay} onClick={() => setSelectedReservation(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Reservation Details</h3>
              <button className={styles.modalClose} onClick={() => setSelectedReservation(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalRow}><span>Name</span><strong>{selectedReservation.name}</strong></div>
              <div className={styles.modalRow}><span>Room / Facility</span><strong>{selectedReservation.room}</strong></div>
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