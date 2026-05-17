import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { adminAPI } from "../../utils/api";

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

export default function AdminScheduleManagement({ role = 'admin' }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isAdmin = role === 'admin';

  useEffect(() => {
    const fetchReservations = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAllReservations();
        setReservations(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load reservations:', err);
        setError('Unable to load reservations.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const fetchAllReservations = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/reservations/`,
      {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch reservations');

    const data = await response.json();
    const list = Array.isArray(data) ? data : data.results ?? [];

    const normalized = [];
    list.forEach((r) => {
      const facilityName =
        r.facility_name ||
        r.facility?.name ||
        r.room_name ||
        r.room ||
        'Reserved';

      const customerName =
        r.guest_name ||
        r.customer_name ||
        r.user_name ||
        r.user?.full_name ||
        r.user?.email ||
        'Guest';

      const checkIn  = r.check_in  || r.check_in_date  || r.date;
      const checkOut = r.check_out || r.check_out_date || null;
      const status   = (r.status || 'pending').toLowerCase();
      const guests   = r.guests ?? r.guest_count ?? r.num_guests ?? 1;

      if (!checkIn) return;

      if (checkOut && checkOut !== checkIn) {
        let current = new Date(checkIn);
        const end   = new Date(checkOut);
        while (current < end) {
          normalized.push({
            id: r.id,
            date: current.toISOString().split('T')[0],
            label: facilityName,
            customer: customerName,
            status,
            guests,
          });
          current.setDate(current.getDate() + 1);
        }
      } else {
        normalized.push({
          id: r.id,
          date: checkIn,
          label: facilityName,
          customer: customerName,
          status,
          guests,
        });
      }
    });

    return normalized;
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const filteredReservations = reservations.filter(r => {
    const resDate = new Date(r.date);
    const sameMonth = isSameMonth(resDate, currentDate);
    const statusMatch = activeTab === "all" ? true : r.status === activeTab;
    return sameMonth && statusMatch;
  });

  const getCount = (type) =>
    reservations.filter(r => {
      const resDate = new Date(r.date);
      const sameMonth = isSameMonth(resDate, currentDate);
      return type === "all" ? sameMonth : sameMonth && r.status === type;
    }).length;

  const getStatusClass = (status) => {
    if (['approved', 'confirmed', 'paid'].includes(status)) return styles.statusApproved;
    if (['cancelled', 'canceled', 'declined', 'rejected', 'inactive'].includes(status)) return styles.statusCancelled;
    return styles.statusPending;
  };

  const getStatusGroup = (status) => {
    if (['approved', 'confirmed', 'paid'].includes(status)) return 'confirmed';
    if (['cancelled', 'canceled', 'declined', 'rejected', 'inactive'].includes(status)) return 'cancelled';
    return 'pending';
  };

  const groupReservations = (list) => {
    const grouped = { confirmed: [], pending: [], cancelled: [] };

    list.forEach(r => {
      const group = getStatusGroup(r.status);
      grouped[group].push(r);
    });

    return [
      { key: 'confirmed', label: 'Confirmed', items: grouped.confirmed },
      { key: 'pending',   label: 'Pending',   items: grouped.pending   },
      { key: 'cancelled', label: 'Cancelled', items: grouped.cancelled },
    ].filter(g => g.items.length > 0);
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
    const monthEnd   = endOfMonth(monthStart);
    const startDate  = startOfWeek(monthStart);
    const endDate    = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day  = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dayReservations = filteredReservations.filter(r =>
          isSameDay(new Date(r.date), day)
        );
        const isDisabled = !isSameMonth(day, monthStart);
        const hasEvent   = dayReservations.length > 0;

        days.push(
          <div
            key={day.toString()}
            className={`${styles.cell} ${isDisabled ? styles.disabled : ""} ${hasEvent ? styles.hasEvent : ""}`}
            onClick={() => hasEvent && setSelectedReservation(dayReservations)}
          >
            <span className={styles.date}>{format(day, "d")}</span>
            {dayReservations.slice(0, 2).map((event, idx) => (
              <div key={idx} className={styles.event}>
                <span className={styles.dot}></span>
                {event.label}
              </div>
            ))}
            {dayReservations.length > 2 && (
              <div className={styles.moreEvents}>+{dayReservations.length - 2} more</div>
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

            {error && (
              <div className={styles.errorBanner}>
                <p>{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className={styles.loadingState}>
                <p>Loading reservations...</p>
              </div>
            ) : (
              <div className={styles.calendar}>
                {renderHeader()}
                {renderDays()}
                {renderCells()}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedReservation && selectedReservation.length > 0 && (
        <div className={styles.modalOverlay} onClick={() => setSelectedReservation(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            
            <div className={styles.modalHeader}>
              <h3>Reserved Facilities</h3>
              <p className={styles.modalSubtitle}>
                {format(new Date(selectedReservation[0].date), "MMMM d, yyyy")}
              </p>
            </div>

            <button 
              className={styles.modalClose} 
              onClick={() => setSelectedReservation(null)}
              aria-label="Close Modal"
            >
              ✕
            </button>

            <div className={styles.modalBody}>
              {groupReservations(selectedReservation).map((group) => (
                <div key={group.key} className={styles.modalGroup}>
                  <div className={`${styles.modalGroupLabel} ${styles[`groupLabel_${group.key}`]}`}>
                    {group.label} ({group.items.length})
                  </div>
                  {group.items.map((r, idx) => (
                    <div
                      key={idx}
                      className={`${styles.modalItem} ${styles[`modalItem_${getStatusGroup(r.status)}`]}`}
                    >
                      <div className={styles.modalRow}>
                        <span>Room / Facility</span>
                        <strong>{r.label}</strong>
                      </div>
                      <div className={styles.modalRow}>
                        <span>Status</span>
                        <strong className={getStatusClass(r.status)}>
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <button className={styles.closeBtn} onClick={() => setSelectedReservation(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}