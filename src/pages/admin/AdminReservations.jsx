import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { reservationsAPI } from '../../utils/api';
import styles from '../../styles/AdminReservations.module.css';

const shortenId = (value) => {
  const text = String(value || '');
  if (text.length <= 14) return text;
  return `${text.slice(0, 8)}...${text.slice(-4)}`;
};

const normalizeReservation = (reservation) => ({
  id: reservation.id,
  booking_id: reservation.reservation_id || reservation.id,
  booking_id_short: shortenId(reservation.reservation_id || reservation.id),
  guest_name: reservation.guest_full_name || `${reservation.first_name || ''} ${reservation.last_name || ''}`.trim() || 'Guest',
  facility_name: reservation.facility_name || reservation.facility?.name || 'Facility',
  payment: reservation.payment_method || 'N/A',
  check_in: reservation.check_in,
  check_out: reservation.check_out,
  status: (reservation.status || 'pending').toLowerCase(),
});

export default function AdminReservations({ role = 'admin' }) {
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const isAdmin = role === 'admin';

  useEffect(() => {
    const loadReservations = async () => {
      setIsLoading(true);
      try {
        const data = await reservationsAPI.getAll();
        const list = Array.isArray(data) ? data : data.results ?? [];
        setReservations(list.map(normalizeReservation));
        setError('');
      } catch (err) {
        console.error(err);
        setError('Unable to load reservations from backend.');
      } finally {
        setIsLoading(false);
      }
    };

    loadReservations();
  }, []);

  const filteredReservations = useMemo(() => {
    if (filter === 'all') return reservations;
    return reservations.filter((reservation) => reservation.status === filter);
  }, [filter, reservations]);

  const getCount = (type) => {
    if (type === 'all') return reservations.length;
    return reservations.filter((reservation) => reservation.status === type).length;
  };

  const updateReservationStatus = async (id, status) => {
    try {
      if (status === 'confirmed') {
        await reservationsAPI.approve(id, '', 'confirmed');
      } else if (status === 'cancelled') {
        await reservationsAPI.approve(id, '', 'cancelled');
      }

      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.id === id ? { ...reservation, status } : reservation
        )
      );
    } catch (err) {
      console.error(err);
      setError('Unable to update reservation status.');
    }
  };

  const handleArchive = (id) => {
    setReservations((prev) => prev.filter((reservation) => reservation.id !== id));
  };

  return (
    <div className={styles.adminShell}>
      <Sidebar role={role} />

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.pageHeader}>
            <div>
              <h1>Reservation Management</h1>
              <p>
                {isAdmin
                  ? 'Infinity Garden Resort Reservation Management System'
                  : 'Infinity Garden Resort - Staff View'}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.filterTabs}>
          {['pending', 'confirmed', 'cancelled', 'all'].map((tab) => (
            <button
              key={tab}
              className={`${styles.tab} ${filter === tab ? styles.active : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({getCount(tab)})
            </button>
          ))}
        </div>

        <div className={styles.container}>
          {error && <div className={styles.errorBanner}>{error}</div>}

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Res. ID</th>
                  <th>Guest Name</th>
                  <th>Facility</th>
                  <th>Date</th>
                  <th>Status</th>
                  {filter !== 'all' && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={filter !== 'all' ? 6 : 5}>Loading reservations...</td>
                  </tr>
                ) : filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={filter !== 'all' ? 6 : 5}>No reservations found.</td>
                  </tr>
                ) : (
                  filteredReservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td title={reservation.booking_id}>{reservation.booking_id_short}</td>
                      <td>{reservation.guest_name}</td>
                      <td>{reservation.facility_name}</td>
                      <td>{new Date(reservation.check_in).toLocaleDateString()}</td>
                      <td>
                        <span className={`${styles.status} ${styles[`status_${reservation.status}`]}`}>
                          {reservation.status}
                        </span>
                      </td>

                      {filter !== 'all' && (
                        <td className={styles.actions}>
                          <button
                            className={styles.viewBtn}
                            onClick={() => setSelectedReservation(reservation)}
                          >
                            View
                          </button>

                          {reservation.status === 'confirmed' && (
                            <button
                              className={styles.cancelBtnSmall}
                              onClick={() => handleArchive(reservation.id)}
                            >
                              Archive
                            </button>
                          )}

                          {reservation.status === 'pending' && (
                            <>
                              <button
                                className={styles.approveBtn}
                                onClick={() => updateReservationStatus(reservation.id, 'confirmed')}
                              >
                                Approve
                              </button>
                              <button
                                className={styles.cancelBtnSmall}
                                onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedReservation && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.modalBox} ${styles.largeModal}`}>
              <div className={styles.modalHeader}>
                <h3>Reservation Details</h3>
                <button
                  className={styles.closeBtn}
                  onClick={() => setSelectedReservation(null)}
                >
                  x
                </button>
              </div>

              <div className={styles.modalBody}>
                <label>Guest Name</label>
                <input value={selectedReservation.guest_name} readOnly />

                <label>Facility</label>
                <input value={selectedReservation.facility_name} readOnly />

                <label>Payment Method</label>
                <input value={selectedReservation.payment} readOnly />

                <label>Check-in</label>
                <input value={new Date(selectedReservation.check_in).toLocaleDateString()} readOnly />

                <label>Check-out</label>
                <input value={new Date(selectedReservation.check_out).toLocaleDateString()} readOnly />
              </div>

              <div className={styles.modalFooter}>
                <button
                  onClick={() => setSelectedReservation(null)}
                  className={styles.cancelBtn}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}