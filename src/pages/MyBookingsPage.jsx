import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { formatDate } from '../utils/helpers';
import Modal  from '../components/ui/Modal';
import Footer from '../components/layout/Footer';
import styles from "../styles/MyBookingsPage.module.css";



export default function MyBookingsPage() {
  const navigate = useNavigate();
  const { bookings, cancelBooking, setConfirmedBooking, showToast } = useBooking();

  // Modal state: null | bookingId to cancel
  const [cancelId, setCancelId] = useState(null);

  const sorted = [...bookings].reverse(); // newest first

  const handleViewDetail = (b) => {
    setConfirmedBooking(b);
    navigate('/booking/confirmed');
  };

  const handleCancelConfirm = () => {
    cancelBooking(cancelId);
    setCancelId(null);
    showToast('Booking cancelled successfully.', 'success');
  };

  return (
    <div className="page">
      <div className={styles.wrapper}>
        <h1 className={styles.pageTitle}>My Bookings</h1>

        {sorted.length === 0 ? (
          /* ── EMPTY STATE ── */
          <div className={styles.empty}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8"  y1="2" x2="8"  y2="6"/>
              <line x1="3"  y1="10" x2="21" y2="10"/>
            </svg>
            <h3>No bookings yet</h3>
            <p>You haven't made any reservations yet.<br />Explore our rooms and book your perfect stay.</p>
            <button className="btn-red" onClick={() => navigate('/rooms')}>
              Browse Rooms
            </button>
          </div>
        ) : (
          /* ── BOOKING LIST ── */
          <div className={styles.list}>
            {sorted.map((b) => (
              <div key={b.id} className={styles.item}>
                {/* Thumbnail */}
                <img src={b.roomImg} alt={b.roomName} className={styles.thumb} />

                {/* Info */}
                <div className={styles.info}>
                  <h3 className={styles.roomName}>{b.roomName}</h3>
                  <p className={styles.bookingId}>Booking ID: {b.id}</p>
                  <div className={styles.metaGrid}>
                    <div className={styles.metaEntry}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8"  y1="2" x2="8"  y2="6"/>
                        <line x1="3"  y1="10" x2="21" y2="10"/>
                      </svg>
                      <span>Check-in: <strong>{formatDate(b.checkin)}</strong></span>
                    </div>
                    <div className={styles.metaEntry}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8"  y1="2" x2="8"  y2="6"/>
                        <line x1="3"  y1="10" x2="21" y2="10"/>
                      </svg>
                      <span>Check-out: <strong>{formatDate(b.checkout)}</strong></span>
                    </div>
                    <div className={styles.metaEntry}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                      </svg>
                      <span>Guests: <strong>{b.guests}</strong></span>
                    </div>
                    <div className={styles.metaEntry}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span>Duration: <strong>{b.nights} Night{b.nights !== 1 ? 's' : ''}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Actions column */}
                <div className={styles.actions}>
                  <span className={`${styles.status} ${styles['status_' + b.status]}`}>
                    {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                  </span>
                  <p className={styles.amount}>₱{b.total.toFixed(2)}</p>
                  <div className={styles.btnGroup}>
                    <button
                      className={styles.viewBtn}
                      onClick={() => handleViewDetail(b)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      View Details
                    </button>
                    {b.status === 'confirmed' && (
                      <button
                        className={styles.cancelBtn}
                        onClick={() => setCancelId(b.id)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CANCEL MODAL ── */}
      {cancelId && (
        <Modal
          title="Cancel Booking?"
          message="Are you sure you want to cancel this booking? This action cannot be undone."
          confirmLabel="Yes, Cancel"
          onConfirm={handleCancelConfirm}
          onCancel={() => setCancelId(null)}
        />
      )}

      <Footer />
    </div>
  );
}
