import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { adminAPI, API_ORIGIN, reservationsAPI } from '../../utils/api';
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
  payment_status: reservation.payment_status || 'pending',
  receipt_url: reservation.proof_of_payment || '',
  contact: reservation.contact || '',
  email: reservation.email || '',
  address: reservation.address || '',
  valid_id: reservation.valid_id || '',
  check_in: reservation.check_in,
  check_out: reservation.check_out,
  guests: reservation.num_guests || 0,
  nights: reservation.nights || 0,
  total_amount: reservation.total_amount || 0,
  special_requests: reservation.special_requests || '',
  created_at: reservation.created_at,
  status: (reservation.status || 'pending').toLowerCase(),
});

const toReceiptSrc = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
};

const isPdfReceipt = (url) => /\.pdf($|\?)/i.test(url || '');

export default function AdminReservations({ role = 'admin' }) {
  const [reservations, setReservations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const isAdmin = role === 'admin';

  useEffect(() => {
    const loadReservations = async () => {
      setIsLoading(true);
      try {
        const [data, notificationData] = await Promise.all([
          reservationsAPI.getAll(),
          adminAPI.getNotifications(true),
        ]);
        const list = Array.isArray(data) ? data : data.results ?? [];
        setReservations(list.map(normalizeReservation));
        const unread = Array.isArray(notificationData)
          ? notificationData
          : notificationData.results ?? [];
        setNotifications(unread);
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

  const unreadByReservation = useMemo(() => {
    return notifications.reduce((acc, notification) => {
      acc[notification.reservation] = notification;
      return acc;
    }, {});
  }, [notifications]);

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

  const handleViewReservation = async (reservation) => {
    setSelectedReservation(reservation);
    const notification = unreadByReservation[reservation.id];
    if (!notification) return;

    try {
      await adminAPI.markNotificationRead(notification.id);
      setNotifications((prev) => prev.filter((item) => item.id !== notification.id));
    } catch (err) {
      console.error('Unable to mark notification as read:', err);
    }
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
                      <td title={reservation.booking_id}>
                        <div className={styles.idCell}>
                          {unreadByReservation[reservation.id] && <span className={styles.unreadDot} />}
                          <span>{reservation.booking_id_short}</span>
                        </div>
                      </td>
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
                            onClick={() => handleViewReservation(reservation)}
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
                <div className={styles.detailGrid}>
                  <div>
                    <label>Guest Name</label>
                    <input value={selectedReservation.guest_name} readOnly />
                  </div>
                  <div>
                    <label>Contact</label>
                    <input value={selectedReservation.contact || 'N/A'} readOnly />
                  </div>
                  <div>
                    <label>Email</label>
                    <input value={selectedReservation.email || 'N/A'} readOnly />
                  </div>
                  <div>
                    <label>Valid ID</label>
                    <input value={selectedReservation.valid_id || 'N/A'} readOnly />
                  </div>
                  <div className={styles.fullRow}>
                    <label>Address</label>
                    <input value={selectedReservation.address || 'N/A'} readOnly />
                  </div>
                  <div>
                    <label>Facility</label>
                    <input value={selectedReservation.facility_name} readOnly />
                  </div>
                  <div>
                    <label>Guests</label>
                    <input value={selectedReservation.guests || 'N/A'} readOnly />
                  </div>
                  <div>
                    <label>Check-in</label>
                    <input value={new Date(selectedReservation.check_in).toLocaleDateString()} readOnly />
                  </div>
                  <div>
                    <label>Check-out</label>
                    <input value={new Date(selectedReservation.check_out).toLocaleDateString()} readOnly />
                  </div>
                  <div>
                    <label>Nights</label>
                    <input value={selectedReservation.nights || 'N/A'} readOnly />
                  </div>
                  <div>
                    <label>Total Amount</label>
                    <input value={`PHP ${Number(selectedReservation.total_amount || 0).toLocaleString()}`} readOnly />
                  </div>
                  <div>
                    <label>Payment Method</label>
                    <input value={selectedReservation.payment} readOnly />
                  </div>
                  <div>
                    <label>Payment Status</label>
                    <input value={selectedReservation.payment_status} readOnly />
                  </div>
                  <div className={styles.fullRow}>
                    <label>Special Requests</label>
                    <input value={selectedReservation.special_requests || 'None'} readOnly />
                  </div>
                </div>

                <div className={styles.receiptPanel}>
                  <div className={styles.receiptHeader}>
                    <strong>Attached Payment Receipt</strong>
                    {selectedReservation.receipt_url && (
                      <a href={toReceiptSrc(selectedReservation.receipt_url)} target="_blank" rel="noreferrer">
                        Open file
                      </a>
                    )}
                  </div>
                  {selectedReservation.receipt_url ? (
                    isPdfReceipt(selectedReservation.receipt_url) ? (
                      <iframe
                        className={styles.receiptFrame}
                        src={toReceiptSrc(selectedReservation.receipt_url)}
                        title="Payment receipt"
                      />
                    ) : (
                      <img
                        className={styles.receiptImage}
                        src={toReceiptSrc(selectedReservation.receipt_url)}
                        alt="Payment receipt"
                      />
                    )
                  ) : (
                    <p className={styles.noReceipt}>No receipt image was attached to this reservation.</p>
                  )}
                </div>
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
