import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
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

export default function AdminDashboard() {

  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedReservation, setSelectedReservation] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {

        const summary = await adminAPI.getReservationSummary();
        const guestReport = await adminAPI.getGuestReport();

        setStats({
          ...summary,
          ...guestReport
        });

      } catch (err) {

        console.log('Using demo data (backend offline)');

        setStats({
          total_reservations: 0,
          approved_count: 0,
          pending_count: 0,
          cancelled_count: 0,
          total_revenue: 0,
          average_booking_value: 0,
          total_guests: 0,
          repeat_guests: 0
        });

      }
    };

    fetchStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminRole');
    navigate('/');
  };

  const reservations = [
    {
      date: "2026-03-07",
      name: "John Cruz",
      room: "Pavilion A",
      guests: 5
    },
    {
      date: "2026-03-11",
      name: "Maria Santos",
      room: "Cottage 3",
      guests: 3
    }
  ];

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const renderHeader = () => (
    <div className={styles.calendarHeader}>
      <button onClick={prevMonth}>◀</button>
      <h3>{format(currentDate, "MMMM yyyy")}</h3>
      <button onClick={nextMonth}>▶</button>
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

        const reservation = reservations.find(r =>
          isSameDay(new Date(r.date), day)
        );

        days.push(
          <div
            key={day}
            className={`${styles.cell}
            ${!isSameMonth(day, monthStart) ? styles.disabled : ""}
            ${reservation ? styles.reserved : ""}`}
            onClick={() => reservation && setSelectedReservation(reservation)}
          >
            {format(day, "d")}
          </div>
        );

        day = addDays(day, 1);
      }

      rows.push(
        <div className={styles.row} key={day}>
          {days}
        </div>
      );

      days = [];
    }

    return <div>{rows}</div>;
  };

  return (
    <div className={styles.adminShell}>
      <AdminSidebar />

      <div className={styles.mainContent}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>

            <div className={styles.title}>
              <h1>Admin Dashboard</h1>
              <p>Infinity Garden Resort Reservation Management System</p>
            </div>

            <div className={styles.headerActions}>

              <button
                className={styles.logoutBtn}
                onClick={handleLogout}
              >
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

        {/* Main content */}
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

          {/* Stats Grid */}
          <div className={styles.statsGrid}>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#dbeafe' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
              </div>

              <div className={styles.statContent}>
                <p className={styles.statLabel}>Total Reservations</p>
                <p className={styles.statValue}>{stats?.total_reservations || 0}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#dcfce7' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>

              <div className={styles.statContent}>
                <p className={styles.statLabel}>Approved</p>
                <p className={styles.statValue}>{stats?.approved_count || 0}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#fef9c3' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>

              <div className={styles.statContent}>
                <p className={styles.statLabel}>Pending</p>
                <p className={styles.statValue}>{stats?.pending_count || 0}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#fee2e2' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>

              <div className={styles.statContent}>
                <p className={styles.statLabel}>Cancelled</p>
                <p className={styles.statValue}>{stats?.cancelled_count || 0}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#fce7f3' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2">
                  <path d="M12 2v20M2 12h20"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </div>

              <div className={styles.statContent}>
                <p className={styles.statLabel}>Total Revenue</p>
                <p className={styles.statValue}>
                  ₱{(stats?.total_revenue || 0).toLocaleString()}
                </p>
              </div>
            </div>

          </div>

          {/* Calendar */}
          <div className={styles.calendar}>
            {renderHeader()}
            {renderDays()}
            {renderCells()}
          </div>

        </div>

        {selectedReservation && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3>Reservation Details</h3>

              <p><strong>Name:</strong> {selectedReservation.name}</p>
              <p><strong>Room:</strong> {selectedReservation.room}</p>
              <p><strong>Guests:</strong> {selectedReservation.guests}</p>
              <p><strong>Date:</strong> {selectedReservation.date}</p>

              <button
                className={styles.closeBtn}
                onClick={() => setSelectedReservation(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}