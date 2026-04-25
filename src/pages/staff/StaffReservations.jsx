import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { reservationsAPI } from '../../utils/api';
import Modal from '../../components/ui/Modal';
import styles from '../../styles/AdminReservations.module.css';

export default function StaffReservations() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReservations();
  }, [filter]);

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      let data = [];
      if (filter === 'pending') {
        data = await reservationsAPI.getPending();
      } else if (filter === 'approved') {
        data = await reservationsAPI.getApproved();
      } else {
        data = await reservationsAPI.getAll();
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

  const handleViewReservation = (reservation) => {
    setSelectedReservation(reservation);
  };

  return (
    <div className={styles.adminShell}>
      <Sidebar role="staff" />
      <div className={styles.mainContent}>
        {/* Header */}
        <div className={styles.header}>
         <div className={styles.pageHeader}>
          <div className={styles.title}>
            <h1>Reservation Management</h1>
            <p>Infinity Garden Resort - Staff View</p>
          </div>
         </div>
        </div>

       {/* Filter tabs */}
       <div className={styles.filterTabs}>
         {['all', 'pending', 'approved'].map(tab => (
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
                         onClick={() => handleViewReservation(res)}
                       >
                         View Details
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         )}
       </div>

       {/* View Modal */}
       {selectedReservation && (
         <div className="modal-overlay">
           <div className="modal-box" style={{ maxWidth: '600px' }}>
             <h2>Reservation Details</h2>

             {/* Reservation details */}
             <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: 'var(--radius)', marginBottom: '16px' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
                 <div>
                   <strong>Booking ID:</strong>
                   <p>{selectedReservation.booking_id}</p>
                 </div>
                 <div>
                   <strong>Guest:</strong>
                   <p>{selectedReservation.guest_name}</p>
                 </div>
                 <div>
                   <strong>Facility:</strong>
                   <p>{selectedReservation.facility_name}</p>
                 </div>
                 <div>
                   <strong>Total Amount:</strong>
                   <p>₱{parseFloat(selectedReservation.total_amount).toLocaleString()}</p>
                 </div>
                 <div>
                   <strong>Check-in:</strong>
                   <p>{new Date(selectedReservation.check_in).toLocaleDateString()}</p>
                 </div>
                 <div>
                   <strong>Check-out:</strong>
                   <p>{new Date(selectedReservation.check_out).toLocaleDateString()}</p>
                 </div>
               </div>
             </div>

             {/* Close button */}
             <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
               <button
                 onClick={() => setSelectedReservation(null)}
                 style={{
                   background: 'var(--bg)',
                   border: '1px solid var(--border)',
                   padding: '12px 24px',
                   borderRadius: 'var(--radius)',
                   cursor: 'pointer',
                   fontWeight: '600'
                 }}
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