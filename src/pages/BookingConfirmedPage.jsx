import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { formatDate } from '../utils/helpers';
import Footer from '../components/layout/Footer';
import styles from "../styles/BookingConfirmedPage.module.css";



export default function BookingConfirmedPage() {
  const navigate = useNavigate();
  const { confirmedBooking } = useBooking();

  // Guard
  if (!confirmedBooking) {
    return (
      <div className="page" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h2>No confirmed booking found.</h2>
        <button
          className="btn-red"
          onClick={() => navigate('/rooms')}
          style={{ marginTop: '1rem' }}
        >
          Browse Rooms
        </button>
      </div>
    );
  }

  const b = confirmedBooking;

  return (
    <div className="page">
      <div className={styles.wrapper}>

        {/* ── SUCCESS CARD ── */}
        <div className={styles.successCard}>
          <div className={styles.checkIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h1>Booking Confirmed!</h1>
          <p>Your reservation has been successfully confirmed</p>
          <div className={styles.refBox}>
            <span className={styles.refLabel}>Booking Reference</span>
            <span className={styles.refId}>{b.id}</span>
          </div>
        </div>

        {/* ── BOOKING DETAILS ── */}
        <div className={styles.detailCard}>
          <h2>Booking Details</h2>

          {/* Room row */}
          <div className={styles.roomRow}>
            <img src={b.roomImg} alt={b.roomName} className={styles.roomThumb} />
            <div>
              <h3 className={styles.roomName}>{b.roomName}</h3>
              <p className={styles.roomMeta}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
                {b.guests} Guest{b.guests > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Check-in / Check-out */}
          <div className={styles.datesGrid}>
            <div className={styles.dateItem}>
              <span className={styles.dateLabel}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8"  y1="2" x2="8"  y2="6"/>
                  <line x1="3"  y1="10" x2="21" y2="10"/>
                </svg>
                Check-in
              </span>
              <p className={styles.dateVal}>{formatDate(b.checkin)}</p>
              <p className={styles.dateSub}>After 3:00 PM</p>
            </div>
            <div className={styles.dateItem}>
              <span className={styles.dateLabel}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8"  y1="2" x2="8"  y2="6"/>
                  <line x1="3"  y1="10" x2="21" y2="10"/>
                </svg>
                Check-out
              </span>
              <p className={styles.dateVal}>{formatDate(b.checkout)}</p>
              <p className={styles.dateSub}>Before 12:00 PM</p>
            </div>
          </div>

          {/* Price breakdown */}
          <div className={styles.priceBreakdown}>
            <div className={styles.priceRow}>
              <span>{b.nights} Night{b.nights !== 1 ? 's' : ''}</span>
              <span>₱{b.subtotal.toFixed(0)}</span>
            </div>
            <div className={styles.priceRow}>
              <span>Taxes &amp; Fees (15%)</span>
              <span>₱{b.tax.toFixed(2)}</span>
            </div>
            <div className={`${styles.priceRow} ${styles.priceTotal}`}>
              <span>Total Paid</span>
              <span>₱{b.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Guest info */}
          <div className={styles.guestSection}>
            <h3>Guest Information</h3>
            <div className={styles.guestItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <div>
                <span className={styles.guestLabel}>Name</span>
                <span className={styles.guestVal}>{b.name}</span>
              </div>
            </div>
            <div className={styles.guestItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <div>
                <span className={styles.guestLabel}>Email</span>
                <span className={styles.guestVal}>{b.email}</span>
              </div>
            </div>
            <div className={styles.guestItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.64 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l1.17-1.17a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <div>
                <span className={styles.guestLabel}>Phone</span>
                <span className={styles.guestVal}>{b.phone}</span>
              </div>
            </div>
          </div>

          {/* What's next */}
          <div className={styles.whatsNext}>
            <h4>What's Next?</h4>
            <ul>
              <li>A confirmation email has been sent to {b.email}</li>
              <li>You can view and manage your booking in the "My Bookings" section</li>
              <li>Free cancellation is available up to 48 hours before check-in</li>
              <li>Check-in starts at 3:00 PM on your arrival date</li>
            </ul>
          </div>
        </div>

        {/* ── ACTIONS ── */}
        <div className={styles.actions}>
          <button className={styles.viewBtn} onClick={() => navigate('/my-bookings')}>
            View My Bookings
          </button>
          <button className="btn-outline-navy" onClick={() => navigate('/')}>
            Return to Home
          </button>
        </div>

      </div>
      <Footer />
    </div>
  );
}
