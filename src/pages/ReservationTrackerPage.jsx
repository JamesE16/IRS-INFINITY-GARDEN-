import { useState } from 'react';
import { reservationsAPI } from '../utils/api';
import styles from '../styles/ReservationTrackerPage.module.css';

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString();
};

const formatStatus = (status) => {
  const text = status || 'pending';
  if (text === 'cancelled') return 'Rejected';
  return text.charAt(0).toUpperCase() + text.slice(1).replace('_', ' ');
};

const getFacilityName = (reservation) => {
  return reservation?.facility?.name || reservation?.facility_name || 'Facility';
};

export default function ReservationTrackerPage() {
  const [reservationId, setReservationId] = useState('');
  const [reservation, setReservation] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const query = reservationId.trim();

    if (!query) {
      setError('Please enter your reservation ID.');
      setReservation(null);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await reservationsAPI.trackByReservationId(query);
      setReservation(data);
    } catch (err) {
      setReservation(null);
      setError(err.message || 'Reservation not found.');
    } finally {
      setIsLoading(false);
    }
  };

  const status = (reservation?.status || '').toLowerCase();
  const showRejectionMessage = status === 'cancelled' && reservation?.review_notes;

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div>
          <h1>My Bookings</h1>
          <p>Search any reservation using the reservation ID from your booking confirmation.</p>
        </div>
      </section>

      <section className={styles.panel}>
        <form className={styles.searchForm} onSubmit={handleSubmit}>
          <label htmlFor="reservationId">Find Your Reservation</label>
          <p className={styles.formHint}>
            This lookup works for current, pending, confirmed, and past reservation records.
          </p>
          <div className={styles.searchRow}>
            <input
              id="reservationId"
              value={reservationId}
              onChange={(event) => setReservationId(event.target.value)}
              placeholder="Enter your reservation ID" />
            
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {error && <div className={styles.error}>{error}</div>}

        {reservation &&
        <article className={styles.result}>
            <div className={styles.resultHeader}>
              <div>
                <span className={styles.resultLabel}>Reservation ID</span>
                <strong>{reservation.reservation_id}</strong>
              </div>
              <span className={`${styles.status} ${styles[`status_${status}`] || ''}`}>
                {formatStatus(status)}
              </span>
            </div>

            <div className={styles.detailGrid}>
              <div>
                <span>Guest</span>
                <strong>{`${reservation.first_name || ''} ${reservation.last_name || ''}`.trim() || 'Guest'}</strong>
              </div>
              <div>
                <span>Facility</span>
                <strong>{getFacilityName(reservation)}</strong>
              </div>
              <div>
                <span>Check-in</span>
                <strong>{formatDate(reservation.check_in)}</strong>
              </div>
              <div>
                <span>Check-out</span>
                <strong>{formatDate(reservation.check_out)}</strong>
              </div>
              <div>
                <span>Guests</span>
                <strong>{reservation.num_guests || 'N/A'}</strong>
              </div>
              <div>
                <span>Total Amount</span>
                <strong>PHP {Number(reservation.total_amount || 0).toLocaleString()}</strong>
              </div>
            </div>

            {showRejectionMessage &&
          <div className={styles.messageBox}>
                <span>Message from Staff</span>
                <p>{reservation.review_notes}</p>
              </div>
          }
          </article>
        }
      </section>
    </main>);

}
