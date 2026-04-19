import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { adminAPI } from '../../utils/api';
import { FaBell } from 'react-icons/fa';
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
  total_reservations: 45,
  approved_count: 32,
  pending_count: 8,
  cancelled_count: 5,
  total_revenue: 124500,
  average_booking_value: 2767,
  total_guests: 200,
  repeat_guests: 45,
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
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [reservations, setReservations] = useState(MOCK_RESERVATIONS);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const summary = await adminAPI.getReservationSummary();
        const guestReport = await adminAPI.getGuestReport();
        setStats({ ...summary, ...guestReport });

        // DYNAMIC: uncomment to fetch real calendar reservations
        // const calendarData = await adminAPI.getCalendarReservations();
        // setReservations(calendarData);

      } catch (err) {
        console.log('Using demo data (backend offline)');
        setStats(MOCK_STATS);
      }
    };
    fetchStats();
  }, []);

  const handleNotifications = () => navigate('/admin/notifications');

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

  // DYNAMIC: replace these with real availability data from API
  const availableRooms    = 10;
  const availableCottages = 4;
  const availablePavilion = 0;

  return (
    <div className={styles.adminShell}>
      <AdminSidebar />

      <div className={styles.mainContent}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.title}>
              <h1>Admin Dashboard</h1>
              <p>Infinity Garden Resort Reservation Management System</p>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.notifyBtn} onClick={handleNotifications} aria-label="View notifications">
                <FaBell />
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

            <StatCard label="Total Reservations Today" value={stats?.total_reservations ?? 0}
              iconBg="#dbeafe" iconStroke="#0284c7">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </StatCard>

            <StatCard label="Total Guests" value={stats?.total_guests ?? 0}
              iconBg="#e0f2fe" iconStroke="#0369a1">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </StatCard>

            <StatCard label="Approved" value={stats?.approved_count ?? 0}
              iconBg="#dcfce7" iconStroke="#16a34a">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </StatCard>

            <StatCard label="Pending" value={stats?.pending_count ?? 0}
              iconBg="#fef9c3" iconStroke="#eab308">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </StatCard>

            <StatCard label="Cancelled" value={stats?.cancelled_count ?? 0}
              iconBg="#fee2e2" iconStroke="#dc2626">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </StatCard>

            <StatCard
              label="Revenue Today"
              value={`₱${(stats?.total_revenue ?? 0).toLocaleString()}`}
              iconBg="#fce7f3" iconStroke="#db2777">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </StatCard>

          </div>

          {/* ── Calendar + Sidebar ──────────────────────────────────────── */}
          <div className={styles.calendarLayout}>

            <div className={styles.calendarWrap}>
              <h2 className={styles.sectionTitle}>Reservation Calendar and Availability</h2>
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
                  <span>Current Stays</span>
                  <strong>{stats?.approved_count ?? 0}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Upcoming Reservations</span>
                  <strong>{stats?.pending_count ?? 0}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Pending</span>
                  <strong className={styles.summaryAmber}>{stats?.pending_count ?? 0}</strong>
                </div>
              </div>

              <div className={styles.summarySection}>
                <p className={styles.summarySectionTitle}>Reservation Availability</p>
                <div className={styles.summaryRow}>
                  <span>Available Rooms</span>
                  <strong>{availableRooms}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Available Cottage</span>
                  <strong>{availableCottages}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Available Pavilion</span>
                  <strong className={availablePavilion === 0 ? styles.summaryRed : ""}>
                    {availablePavilion}
                  </strong>
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
