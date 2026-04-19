import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffSidebar from '../../components/staff/StaffSidebar';
import Modal from '../../components/ui/Modal';
import styles from '../../styles/AdminReservations.module.css';

const mockReservations = [
  {
    id: 1,
    booking_id: 'BK001',
    guest_name: 'Cristalyn Llarenas',
    facility: 'Pavilion A',
    check_in: '2026-04-07',
    check_out: '2026-04-09',
    amount: 15000,
    status: 'confirmed',
    guests: 5
  },
  {
    id: 2,
    booking_id: 'BK002',
    guest_name: 'James Higoy',
    facility: 'Cottage 3',
    check_in: '2026-04-11',
    check_out: '2026-04-13',
    amount: 8000,
    status: 'pending',
    guests: 3
  },
  {
    id: 3,
    booking_id: 'BK003',
    guest_name: 'Joanna Cooper',
    facility: 'Pavilion B',
    check_in: '2026-04-20',
    check_out: '2026-04-22',
    amount: 20000,
    status: 'confirmed',
    guests: 8
  }
];

export default function StaffReservations() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    guest_name: '',
    facility: '',
    check_in: '',
    check_out: '',
    amount: '',
    guests: ''
  });

  useEffect(() => {
    fetchReservations();
  }, [filter]);

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      // Mock data
      let data = mockReservations;
      if (filter !== 'all') {
        data = mockReservations.filter(r => r.status === filter);
      }
      setReservations(data);
      setError(null);
    } catch (err) {
      setReservations([]);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (reservation) => {
    setSelectedReservation(reservation);
  };

  const handleAdd = () => {
    setForm({
      guest_name: '',
      facility: '',
      check_in: '',
      check_out: '',
      amount: '',
      guests: ''
    });
    setShowAddModal(true);
  };

  const handleEdit = (reservation) => {
    setForm({
      guest_name: reservation.guest_name,
      facility: reservation.facility,
      check_in: reservation.check_in,
      check_out: reservation.check_out,
      amount: reservation.amount,
      guests: reservation.guests
    });
    setSelectedReservation(reservation);
    setShowEditModal(true);
  };

  const handleSaveAdd = () => {
    const newRes = {
      ...form,
      id: Date.now(),
      booking_id: `BK${Date.now()}`,
      status: 'pending'
    };
    setReservations(prev => [...prev, newRes]);
    setShowAddModal(false);
  };

  const handleSaveEdit = () => {
    setReservations(prev => prev.map(r => r.id === selectedReservation.id ? { ...r, ...form } : r));
    setShowEditModal(false);
    setSelectedReservation(null);
  };

  return (
    <div className={styles.adminShell}>
      <StaffSidebar />
      <div className={styles.mainContent}>
        {/* Header */}
        <div className={styles.header}>
         <div className={styles.pageHeader}>
          <div className={styles.title}>
            <h1>Reservation Management</h1>
            <p>Infinity Garden Resort Reservation Management System</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.primaryBtn} onClick={handleAdd}>
              Add Reservation
            </button>
          </div>
         </div>
        </div>

       {/* Filter tabs */}
       <div className={styles.filterTabs}>
         {['all', 'pending', 'confirmed'].map(tab => (
           <button
             key={tab}
             className={`${styles.tab} ${filter === tab ? styles.active : ''}`}
             onClick={() => setFilter(tab)}
           >
             {tab.charAt(0).toUpperCase() + tab.slice(1)} ({
               reservations.filter(r => tab === 'all' || r.status === tab).length
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
                         <small>{res.guests} guests</small>
                       </div>
                     </td>
                     <td>{res.facility}</td>
                     <td>{res.check_in}</td>
                     <td>{res.check_out}</td>
                     <td>₱{res.amount.toLocaleString()}</td>
                     <td>
                       <span className={`${styles.status} ${styles[res.status]}`}>
                         {res.status}
                       </span>
                     </td>
                     <td>
                       <div className={styles.actions}>
                         <button
                           className={styles.viewBtn}
                           onClick={() => handleView(res)}
                         >
                           View
                         </button>
                         <button
                           className={styles.editBtn}
                           onClick={() => handleEdit(res)}
                         >
                           Edit
                         </button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         )}
       </div>
      </div>

      {/* View Modal */}
      {selectedReservation && !showEditModal && (
        <Modal onClose={() => setSelectedReservation(null)}>
          <div className={styles.modalContent}>
            <h3>Reservation Details</h3>
            <div className={styles.details}>
              <p><strong>Booking ID:</strong> {selectedReservation.booking_id}</p>
              <p><strong>Guest:</strong> {selectedReservation.guest_name}</p>
              <p><strong>Facility:</strong> {selectedReservation.facility}</p>
              <p><strong>Check-in:</strong> {selectedReservation.check_in}</p>
              <p><strong>Check-out:</strong> {selectedReservation.check_out}</p>
              <p><strong>Guests:</strong> {selectedReservation.guests}</p>
              <p><strong>Amount:</strong> ₱{selectedReservation.amount.toLocaleString()}</p>
              <p><strong>Status:</strong> {selectedReservation.status}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <div className={styles.modalContent}>
            <h3>Add New Reservation</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveAdd(); }}>
              <div className={styles.formGroup}>
                <label>Guest Name</label>
                <input
                  type="text"
                  value={form.guest_name}
                  onChange={(e) => setForm(prev => ({ ...prev, guest_name: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Facility</label>
                <input
                  type="text"
                  value={form.facility}
                  onChange={(e) => setForm(prev => ({ ...prev, facility: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Check-in</label>
                <input
                  type="date"
                  value={form.check_in}
                  onChange={(e) => setForm(prev => ({ ...prev, check_in: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Check-out</label>
                <input
                  type="date"
                  value={form.check_out}
                  onChange={(e) => setForm(prev => ({ ...prev, check_out: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Amount</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Guests</label>
                <input
                  type="number"
                  value={form.guests}
                  onChange={(e) => setForm(prev => ({ ...prev, guests: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit">Add Reservation</button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <Modal onClose={() => { setShowEditModal(false); setSelectedReservation(null); }}>
          <div className={styles.modalContent}>
            <h3>Edit Reservation</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
              <div className={styles.formGroup}>
                <label>Guest Name</label>
                <input
                  type="text"
                  value={form.guest_name}
                  onChange={(e) => setForm(prev => ({ ...prev, guest_name: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Facility</label>
                <input
                  type="text"
                  value={form.facility}
                  onChange={(e) => setForm(prev => ({ ...prev, facility: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Check-in</label>
                <input
                  type="date"
                  value={form.check_in}
                  onChange={(e) => setForm(prev => ({ ...prev, check_in: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Check-out</label>
                <input
                  type="date"
                  value={form.check_out}
                  onChange={(e) => setForm(prev => ({ ...prev, check_out: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Amount</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Guests</label>
                <input
                  type="number"
                  value={form.guests}
                  onChange={(e) => setForm(prev => ({ ...prev, guests: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => { setShowEditModal(false); setSelectedReservation(null); }}>Cancel</button>
                <button type="submit">Update Reservation</button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}