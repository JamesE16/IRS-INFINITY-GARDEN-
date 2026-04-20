import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import styles from '../../styles/AdminReservations.module.css';

export default function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState('pending');

  const [form, setForm] = useState({
    guest_name: '',
    facility_name: '',
    payment: 'GCash',
    date: ''
  });

  useEffect(() => {
    const demo = [
      { id: 1, booking_id: "1001", guest_name: "Maria Santos", facility_name: "Deluxe Room", payment: "GCash", check_in: "2026-03-15", status: "pending" },
      { id: 2, booking_id: "1002", guest_name: "John Reyes", facility_name: "Standard Room", payment: "Cash", check_in: "2026-03-22", status: "approved" },
      { id: 3, booking_id: "1003", guest_name: "Anna Dela Cruz", facility_name: "Family Room", payment: "Card", check_in: "2026-03-12", status: "approved" },
      { id: 4, booking_id: "1004", guest_name: "Sophia Fernandez", facility_name: "Executive Room", payment: "GCash", check_in: "2026-03-19", status: "approved" },
      { id: 5, booking_id: "1005", guest_name: "Gerald Ochavido", facility_name: "Couple Room", payment: "Cash", check_in: "2026-03-04", status: "approved" },
      { id: 6, booking_id: "1006", guest_name: "Nicole Aquino", facility_name: "Pavilion", payment: "GCash", check_in: "2026-03-24", status: "pending" },
      { id: 7, booking_id: "1007", guest_name: "Alvin Bernardo", facility_name: "Pool View Room", payment: "Card", check_in: "2026-03-06", status: "approved" },
      { id: 8, booking_id: "1008", guest_name: "Atasha Cardinez", facility_name: "Deluxe Room", payment: "GCash", check_in: "2026-03-18", status: "pending" },
      { id: 9, booking_id: "1009", guest_name: "Joshua Gonzales", facility_name: "Garden View Room", payment: "Cash", check_in: "2026-03-27", status: "cancelled" },
      { id: 10, booking_id: "1010", guest_name: "Joyce Cabral", facility_name: "Single Room", payment: "Card", check_in: "2026-03-02", status: "approved" }
    ];
    setReservations(demo);
  }, []);

  useEffect(() => {
    if (filter === 'all') setFilteredReservations(reservations);
    else setFilteredReservations(reservations.filter(r => r.status === filter));
  }, [reservations, filter]);

  const getCount = (type) => {
    if (type === 'all') return reservations.length;
    return reservations.filter(r => r.status === type).length;
  };

  const handleAdd = () => {
    const newRes = {
      id: Date.now(),
      booking_id: String(Math.floor(1000 + Math.random() * 9000)),
      guest_name: form.guest_name,
      facility_name: form.facility_name,
      payment: form.payment,
      check_in: form.date,
      status: 'pending'
    };

    setReservations(prev => [newRes, ...prev]);
    setIsAdding(false);

    setForm({
      guest_name: '',
      facility_name: '',
      payment: 'GCash',
      date: ''
    });
  };

  const handleApprove = (id) => {
    setReservations(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'approved' } : r)
    );
  };

  const handleCancel = (id) => {
    setReservations(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r)
    );
  };

  // ✅ ARCHIVE FUNCTION
  const handleArchive = (id) => {
    setReservations(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'archived' } : r)
    );
  };

  return (
    <div className={styles.adminShell}>
      <AdminSidebar />

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.pageHeader}>
            <div>
              <h1>Reservation Management</h1>
              <p>Infinity Garden Resort Reservation Management System</p>
            </div>

            <button className={styles.addBtn} onClick={() => setIsAdding(true)}>
              <span className={styles.plus}>+</span>
              Add Reservation
            </button>
          </div>
        </div>

        <div className={styles.filterTabs}>
          {['pending', 'approved', 'cancelled', 'all'].map(tab => (
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
                {filteredReservations.map(res => (
                  <tr key={res.id}>
                    <td>{res.booking_id}</td>
                    <td>{res.guest_name}</td>
                    <td>{res.facility_name}</td>
                    <td>{new Date(res.check_in).toLocaleDateString()}</td>

                    <td>
                      <span className={`${styles.status} ${styles[`status_${res.status}`]}`}>
                        {res.status}
                      </span>
                    </td>

                    {filter !== 'all' && (
                      <td className={styles.actions}>
                        <button
                          className={styles.viewBtn}
                          onClick={() => setSelectedReservation(res)}
                        >
                          View
                        </button>

                        {/* ✅ SHOW ARCHIVE ONLY IN APPROVED */}
                        {res.status === 'approved' && (
                          <button
                            className={styles.cancelBtnSmall}
                            onClick={() => handleArchive(res.id)}
                          >
                            Archive
                          </button>
                        )}

                        {res.status === 'pending' && (
                          <>
                            <button
                              className={styles.approveBtn}
                              onClick={() => handleApprove(res.id)}
                            >
                              Approve
                            </button>
                            <button
                              className={styles.cancelBtnSmall}
                              onClick={() => handleCancel(res.id)}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* VIEW MODAL */}
        {selectedReservation && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.modalBox} ${styles.largeModal}`}>
              <div className={styles.modalHeader}>
                <h3>Reservation Details</h3>
                <span
                  className={styles.closeBtn}
                  onClick={() => setSelectedReservation(null)}
                >
                  ×
                </span>
              </div>

              <div className={styles.modalBody}>
                <label>Guest Name</label>
                <input value={selectedReservation.guest_name} readOnly />

                <label>Facility</label>
                <input value={selectedReservation.facility_name} readOnly />

                <label>Payment Method</label>
                <input value={selectedReservation.payment} readOnly />

                <label>Date</label>
                <input
                  value={new Date(selectedReservation.check_in).toLocaleDateString()}
                  readOnly
                />
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

        {/* ADD RESERVATION */}
        {isAdding && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.modalBox} ${styles.largeModal}`}>
              <div className={styles.modalHeader}>
                <h3>Add Reservation</h3>
                <span
                  className={styles.closeBtn}
                  onClick={() => setIsAdding(false)}
                >
                  ×
                </span>
              </div>

              <div className={styles.modalBody}>
                <label>Guest Name</label>
                <input
                  value={form.guest_name}
                  onChange={e =>
                    setForm({ ...form, guest_name: e.target.value })
                  }
                />

                <label>Facility</label>
                <input
                  value={form.facility_name}
                  onChange={e =>
                    setForm({ ...form, facility_name: e.target.value })
                  }
                />

                <label>Payment Method</label>
                <select
                  value={form.payment}
                  onChange={e =>
                    setForm({ ...form, payment: e.target.value })
                  }
                  className={styles.paymentSelect}
                >
                  <option>GCash</option>
                  <option>Cash</option>
                  <option>Card</option>
                </select>

                <label>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e =>
                    setForm({ ...form, date: e.target.value })
                  }
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  onClick={() => setIsAdding(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  className={styles.submitBtn}
                >
                  Add Reservation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}