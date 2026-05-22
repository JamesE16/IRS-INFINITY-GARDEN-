import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
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
  isSameDay } from
"date-fns";

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
    </div>);

}

export default function AdminDashboard({ role = 'admin' }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [availability, setAvailability] = useState({
    availableRooms: 0,
    availableCottages: 0,
    availablePavilion: 0
  });
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const summary = await adminAPI.getReservationSummary();
        const guestReport = await adminAPI.getGuestReport();
        setStats({ ...summary, ...guestReport });
      } catch (err) {
        console.error('Failed to load stats:', err);
        setError('Unable to load dashboard stats.');
      }

      try {
        const calendarData = await adminAPI.getCalendarReservations();
        setReservations(Array.isArray(calendarData) ? calendarData : calendarData.results ?? []);
      } catch (err) {
        console.error('Failed to load calendar reservations:', err);
      }

      try {
        const avail = await adminAPI.getAvailability();
        setAvailability({
          availableRooms: avail.availableRooms ?? 0,
          availableCottages: avail.availableCottages ?? 0,
          availablePavilion: avail.availablePavilion ?? 0
        });
      } catch (err) {
        console.error('Failed to load availability:', err);
      }

      try {
        const notificationData = await adminAPI.getNotifications(true);
        const unread = Array.isArray(notificationData) ?
        notificationData :
        notificationData.results ?? [];
        setNotificationCount(unread.length);
        setNotifications(unread);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };

    fetchData();
  }, []);

  const isAdmin = role === 'admin';
  const approvedCount = stats?.approved_count ?? stats?.confirmed_count ?? 0;
  const reservationPath = isAdmin ? '/admin/reservations' : '/staff/reservations';
  const handleNotifications = () => setShowNotifications(true);
  const proceedToReservations = () => navigate(reservationPath);

  const reservationsByDate = reservations.reduce((acc, r) => {
    const key = format(new Date(r.date), 'yyyy-MM-dd');
    if (!acc[key]) acc[key] = [];
    acc[key].push(r.room);
    return acc;
  }, {});

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const renderHeader = () =>
  <div className={styles.calendarHeader}>
      <button className={styles.calNavBtn} onClick={prevMonth}>◀</button>
      <h3 className={styles.calMonthLabel}>{format(currentDate, "MMMM yyyy")}</h3>
      <button className={styles.calNavBtn} onClick={nextMonth}>▶</button>
    </div>;


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
        const key = format(day, 'yyyy-MM-dd');
        const rooms = reservationsByDate[key] || [];
        const hasReservation = rooms.length > 0;
        const isToday = isSameDay(day, new Date());
        const notThisMonth = !isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            className={[
            styles.cell,
            notThisMonth ? styles.disabled : "",
            hasReservation ? styles.reserved : "",
            isToday && !hasReservation ? styles.today : ""].
            join(" ")}
            onClick={() => hasReservation && setSelectedDay(rooms)}>
            
            <span className={styles.cellDay}>{format(day, "d")}</span>
            {hasReservation &&
            <span className={styles.cellEvent}>
                <span className={styles.cellEventDot} />
                {rooms[0]}{rooms.length > 1 ? ` +${rooms.length - 1}` : ''}
              </span>
            }
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
      <Sidebar role={role} />

      <div className={styles.mainContent}>

        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.title}>
              <h1>{isAdmin ? 'Admin Dashboard' : 'Staff Dashboard'}</h1>
              <p>
                {isAdmin ?
                'Infinity Garden Resort Reservation Management System' :
                'Infinity Garden Resort Management System - Staff View'}
              </p>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.notifyBtn}
                onClick={handleNotifications}
                aria-label="View booking notifications">
                
                <FaBell />
                {notificationCount > 0 &&
                <span className={styles.notifyBadge}>{notificationCount}</span>
                }
              </button>
            </div>
          </div>
        </div>

        <div className={styles.container}>

          {error &&
          <div className={styles.errorBanner}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <p>{error}</p>
            </div>
          }

          <div className={styles.statsGrid}>

            <StatCard label="Total Reservations Today" value={stats?.total_reservations ?? 0}
            iconBg="#dbeafe" iconStroke="#0284c7">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </StatCard>

            <StatCard label="Total Guests" value={stats?.total_guests ?? 0}
            iconBg="#e0f2fe" iconStroke="#0369a1">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </StatCard>

            <StatCard label="Approved" value={approvedCount}
            iconBg="#dcfce7" iconStroke="#16a34a">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </StatCard>

            <StatCard label="Pending" value={stats?.pending_count ?? 0}
            iconBg="#fef9c3" iconStroke="#eab308">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </StatCard>

            <StatCard label="Declined" value={stats?.cancelled_count ?? 0}
            iconBg="#fee2e2" iconStroke="#dc2626">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </StatCard>

            <StatCard
              label="Revenue Today"
              value={`₱${(stats?.total_revenue ?? 0).toLocaleString()}`}
              iconBg="#fce7f3" iconStroke="#db2777">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </StatCard>

          </div>

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
                  <strong>{approvedCount}</strong>
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
                  <strong>{availability.availableRooms}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Available Cottage</span>
                  <strong>{availability.availableCottages}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Available Pavilion</span>
                  <strong className={availability.availablePavilion === 0 ? styles.summaryRed : ""}>
                    {availability.availablePavilion}
                  </strong>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {showNotifications &&
      <div className={styles.modalOverlay} onClick={() => setShowNotifications(false)}>
          <div
          className={`${styles.modal} ${styles.notificationModal}`}
          onClick={(e) => e.stopPropagation()}>
          
            <div className={styles.modalHeader}>
              <h3>Notifications</h3>
              <button className={styles.modalClose} onClick={() => setShowNotifications(false)}>✕</button>
            </div>

            <div className={styles.notificationList}>
              {notifications.length > 0 ?
            notifications.map((notification) =>
            <div className={styles.notificationItem} key={notification.id}>
                    <div className={styles.notificationDot} />
                    <div>
                      <strong>{notification.guest_name || 'New guest booking'}</strong>
                      <p>{notification.message}</p>
                      <span>
                        {notification.facility_name || 'Reservation'} -{' '}
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
            ) :

            <div className={styles.emptyNotifications}>
                  <strong>No new notifications</strong>
                  <p>New guest bookings will appear here.</p>
                </div>
            }
            </div>

            <button className={styles.proceedBtn} onClick={proceedToReservations}>
              Proceed to Reservation Management
            </button>
          </div>
        </div>
      }

      {selectedDay &&
      <div className={styles.modalOverlay} onClick={() => setSelectedDay(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Reserved Facilities</h3>
              <button className={styles.modalClose} onClick={() => setSelectedDay(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              {selectedDay.map((room, index) =>
            <div className={styles.modalRow} key={index}>
                  <span>Room / Facility</span>
                  <strong>{room}</strong>
                </div>
            )}
            </div>
            <button className={styles.closeBtn} onClick={() => setSelectedDay(null)}>Close</button>
          </div>
        </div>
      }

    </div>);

}
