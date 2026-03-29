

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { reservationsAPI } from '../../utils/api';
import Modal from '../../components/ui/Modal';
import styles from '../../styles/AdminReservations.module.css';

export default function AdminReservations() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchReservations();
  }, [filter]);

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      let data = [];
      if (filter === 'pending') {
        data = await reservationsAPI.getPending();
      }
      setReservations(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      // Backend offline - show empty list
      console.log('Using demo mode (backend offline)');
      setReservations([]);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReservation) return;

    try {
      const updatedRes = await reservationsAPI.approve(
        selectedReservation.id,
        approvalNotes,
        'approved'
      );

      setReservations(prev => prev.filter(r => r.id !== selectedReservation.id));
      setSelectedReservation(null);
      setApprovalNotes('');
    } catch (err) {
      setError('Failed to approve reservation');
      console.error(err);
    }
  };

  const handleReject = async () => {
    if (!selectedReservation) return;

    try {
      await reservationsAPI.approve(
        selectedReservation.id,
        approvalNotes,
        'cancelled'
      );

      setReservations(prev => prev.filter(r => r.id !== selectedReservation.id));
      setSelectedReservation(null);
      setApprovalNotes('');
    } catch (err) {
      setError('Failed to reject reservation');
      console.error(err);
    }
  };

  return (
    <div className={styles.adminShell}>
      <AdminSidebar />
      <div className={styles.mainContent}>
        {/* Header */}
        <div className={styles.header}>
         <div className={styles.pageHeader}>
          <div>
            <h1>Reservation Management</h1>
            <p>Review and approve pending bookings</p>
          </div>
          <button className={styles.backBtn} onClick={() => navigate('/admin/dashboard')}>
            ← Back to Dashboard
          </button>
         </div>
        </div>

      {/* Filter tabs */}
      <div className={styles.filterTabs}>
        {['pending', 'approved', 'all'].map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${filter === tab ? styles.active : ''}`}
            onClick={() => setFilter(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({
              reservations.length
            })
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles.container}>
        {error && (
          <div className={styles.errorBanner}>
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className={styles.loading}>Loading reservations...</div>
        ) : reservations.length === 0 ? (
          <div className={styles.empty}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <h3>No reservations found</h3>
            <p>There are no {filter} reservations at the moment.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Guest</th>
                  <th>Facility</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map(res => (
                  <tr key={res.id}>
                    <td className={styles.bookingId}>{res.booking_id}</td>
                    <td>
                      <div className={styles.guestInfo}>
                        <strong>{res.guest_name}</strong>
                        <small>{res.guest_email}</small>
                      </div>
                    </td>
                    <td>{res.facility_name}</td>
                    <td>{new Date(res.check_in).toLocaleDateString()}</td>
                    <td>{new Date(res.check_out).toLocaleDateString()}</td>
                    <td className={styles.amount}>₱{parseFloat(res.total_amount).toLocaleString()}</td>
                    <td>
                      <span className={`${styles.status} ${styles[`status_${res.status}`]}`}>
                        {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.actionBtn}
                        onClick={() => setSelectedReservation(res)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedReservation && (
        <ReservationReviewModal
          reservation={selectedReservation}
          notes={approvalNotes}
          onNotesChange={setApprovalNotes}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => {
            setSelectedReservation(null);
            setApprovalNotes('');
          }}
        />
      )}
      </div>
    </div>
  );
}

function ReservationReviewModal({ reservation, notes, onNotesChange, onApprove, onReject, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '600px' }}>
        <h2>Review Reservation</h2>

        {/* Reservation details */}
        <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: 'var(--radius)', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
            <div>
              <strong>Booking ID:</strong>
              <p>{reservation.booking_id}</p>
            </div>
            <div>
              <strong>Guest:</strong>
              <p>{reservation.guest_name}</p>
            </div>
            <div>
              <strong>Facility:</strong>
              <p>{reservation.facility_name}</p>
            </div>
            <div>
              <strong>Total Amount:</strong>
              <p>₱{parseFloat(reservation.total_amount).toLocaleString()}</p>
            </div>
            <div>
              <strong>Check-in:</strong>
              <p>{new Date(reservation.check_in).toLocaleDateString()}</p>
            </div>
            <div>
              <strong>Check-out:</strong>
              <p>{new Date(reservation.check_out).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>
            Review Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Add any notes regarding this reservation..."
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontFamily: 'DM Sans',
              minHeight: '100px',
              fontSize: '0.9rem'
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              padding: '12px',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onReject}
            style={{
              flex: 1,
              background: 'var(--red)',
              color: '#fff',
              border: 'none',
              padding: '12px',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            style={{
              flex: 1,
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              padding: '12px',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
