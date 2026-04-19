import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffSidebar from '../../components/staff/StaffSidebar';
import { adminAPI } from '../../utils/api';
import styles from '../../styles/AdminUserManagement.module.css';

const demoGuests = [
  {
    id: 1,
    firstName: 'Cristalyn Grace',
    lastName: 'Llarenas',
    email: 'cristalgrace@gmail.com',
    phone: '+63 912 345 6789',
    isActive: true
  },
  {
    id: 2,
    firstName: 'James Elmar',
    lastName: 'Higoy',
    email: 'jamelmar@gmail.com',
    phone: '+63 923 456 7890',
    isActive: true
  },
  {
    id: 3,
    firstName: 'Joanna Dane',
    lastName: 'Cooper',
    email: 'joandane@gmail.com',
    phone: '+63 934 567 8901',
    isActive: true
  },
  {
    id: 4,
    firstName: 'Sheena May',
    lastName: 'Emperador',
    email: 'sheenamay@gmail.com',
    phone: '+63 945 678 9012',
    isActive: true
  },
  {
    id: 5,
    firstName: 'Zean',
    lastName: 'Marquez',
    email: 'zeanm@gmail.com',
    phone: '+63 956 789 0123',
    isActive: true
  }
];

const statusTabs = [
  { key: 'all', label: 'All Guests' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' }
];

function normalizeGuest(guest) {
  return {
    id: guest.id ?? guest.pk ?? Math.floor(Math.random() * 100000),
    firstName: guest.first_name || guest.firstName || '',
    lastName: guest.last_name || guest.lastName || '',
    email: guest.email || '',
    phone: guest.phone || guest.phone_number || '',
    isActive: guest.is_active ?? true
  };
}

export default function StaffGuestManagement() {
  const navigate = useNavigate();
  const [guests, setGuests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGuest, setSelectedGuest] = useState(null);

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    setIsLoading(true);
    try {
      const data = await adminAPI.getAllGuests();
      if (Array.isArray(data) && data.length > 0) {
        setGuests(data.map(normalizeGuest));
      } else {
        throw new Error('No guest data returned');
      }
      setError(null);
    } catch (err) {
      console.log('Guest data fallback: backend offline or no guests', err);
      setGuests(demoGuests);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const counts = useMemo(() => {
    const active = guests.filter((guest) => guest.isActive).length;
    return {
      all: guests.length,
      active,
      inactive: guests.length - active
    };
  }, [guests]);

  const filteredGuests = useMemo(() => {
    if (filter === 'all') return guests;
    return guests.filter((guest) => (filter === 'active' ? guest.isActive : !guest.isActive));
  }, [filter, guests]);

  const handleViewGuest = (guest) => {
    setSelectedGuest(guest);
  };

  return (
    <div className={styles.adminShell}>
      <StaffSidebar />
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.pageHeader}>
            <div className={styles.title}>
              <h1>Guest Management</h1>
              <p>Infinity Garden Resort - Staff View</p>
            </div>
          </div>
        </div>

        <div className={styles.actionBar}>
          <p className={styles.summaryText}>
            Showing {filteredGuests.length} of {counts.all} guests — {counts.active} active, {counts.inactive} inactive.
          </p>
        </div>

        <div className={styles.filterTabs}>
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.tab} ${filter === tab.key ? styles.active : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label} ({counts[tab.key]})
            </button>
          ))}
        </div>

        <div className={styles.container}>
          {error && <div className={styles.errorBanner}>{error}</div>}

          {isLoading ? (
            <div className={styles.emptyState}>
              <h3>Loading guests…</h3>
              <p>Please wait while the list is loaded.</p>
            </div>
          ) : filteredGuests.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No guests found</h3>
              <p>Try another filter.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((guest) => (
                    <tr key={guest.id}>
                      <td>{String(guest.id).padStart(2, '0')}</td>
                      <td>
                        <div className={styles.userName}>{guest.firstName} {guest.lastName}</div>
                      </td>
                      <td>
                        <div className={styles.userEmail}>{guest.email}</div>
                      </td>
                      <td>
                        <div className={styles.userPhone}>{guest.phone}</div>
                      </td>
                      <td>
                        <span className={`${styles.status} ${guest.isActive ? styles.statusActive : styles.statusInactive}`}>
                          {guest.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleViewGuest(guest)}
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

        {/* View Guest Modal */}
        {selectedGuest && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalPanel}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Guest Details</h2>
                <button className={styles.modalClose} onClick={() => setSelectedGuest(null)}>
                  ✕
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.guestDetails}>
                  <div className={styles.detailRow}>
                    <span>ID:</span>
                    <strong>{String(selectedGuest.id).padStart(2, '0')}</strong>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Name:</span>
                    <strong>{selectedGuest.firstName} {selectedGuest.lastName}</strong>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Email:</span>
                    <strong>{selectedGuest.email}</strong>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Phone:</span>
                    <strong>{selectedGuest.phone}</strong>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Status:</span>
                    <span className={selectedGuest.isActive ? styles.statusActive : styles.statusInactive}>
                      {selectedGuest.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setSelectedGuest(null)}>
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