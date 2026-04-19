import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffSidebar from '../../components/staff/StaffSidebar';
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

export default function StaffGuestManagement() {
  const navigate = useNavigate();
  const [guests, setGuests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    setIsLoading(true);
    try {
      // Mock data
      setGuests(demoGuests);
      setError(null);
    } catch (err) {
      console.log('Using demo data');
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

  const handleInput = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateGuest = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    const guestPayload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      isActive: true
    };

    try {
      // Mock add
      const newGuest = { ...guestPayload, id: Date.now() };
      setGuests(prev => [...prev, newGuest]);
      setShowModal(false);
      setForm({ firstName: '', lastName: '', email: '', phone: '' });
    } catch (err) {
      console.error('Error adding guest:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditGuest = (guest) => {
    setEditingGuest(guest);
    setForm({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone
    });
    setShowModal(true);
  };

  const handleUpdateGuest = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    const updatedGuest = {
      ...editingGuest,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone
    };

    try {
      // Mock update
      setGuests(prev => prev.map(g => g.id === editingGuest.id ? updatedGuest : g));
      setShowModal(false);
      setEditingGuest(null);
      setForm({ firstName: '', lastName: '', email: '', phone: '' });
    } catch (err) {
      console.error('Error updating guest:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewGuest = (guest) => {
    // Mock view - could open a modal or navigate
    alert(`Viewing guest: ${guest.firstName} ${guest.lastName}`);
  };

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', email: '', phone: '' });
    setEditingGuest(null);
    setShowModal(false);
  };

  return (
    <div className={styles.adminShell}>
      <StaffSidebar />

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.title}>
              <h1>Guest Management</h1>
              <p>Manage guest information and profiles</p>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.primaryBtn}
                onClick={() => setShowModal(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Guest
              </button>
            </div>
          </div>
        </div>

        <div className={styles.container}>
          {error && (
            <div className={styles.errorBanner}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <p>{error}</p>
            </div>
          )}

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

          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading guests...</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((guest) => (
                    <tr key={guest.id}>
                      <td>{guest.firstName} {guest.lastName}</td>
                      <td>{guest.email}</td>
                      <td>{guest.phone}</td>
                      <td>
                        <span className={`${styles.status} ${guest.isActive ? styles.active : styles.inactive}`}>
                          {guest.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.viewBtn}
                            onClick={() => handleViewGuest(guest)}
                          >
                            View
                          </button>
                          <button
                            className={styles.editBtn}
                            onClick={() => handleEditGuest(guest)}
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

      {showModal && (
        <div className={styles.modalOverlay} onClick={resetForm}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingGuest ? 'Edit Guest' : 'Add New Guest'}</h3>
              <button className={styles.modalClose} onClick={resetForm}>✕</button>
            </div>
            <form className={styles.modalForm} onSubmit={editingGuest ? handleUpdateGuest : handleCreateGuest}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName" className={styles.label}>First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    className={styles.input}
                    value={form.firstName}
                    onChange={(e) => handleInput('firstName', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="lastName" className={styles.label}>Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    className={styles.input}
                    value={form.lastName}
                    onChange={(e) => handleInput('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>Email</label>
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  value={form.email}
                  onChange={(e) => handleInput('email', e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>Phone</label>
                <input
                  id="phone"
                  type="tel"
                  className={styles.input}
                  value={form.phone}
                  onChange={(e) => handleInput('phone', e.target.value)}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={resetForm} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingGuest ? 'Update Guest' : 'Add Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}