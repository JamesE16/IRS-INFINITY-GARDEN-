import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { adminAPI } from '../../utils/api';
import styles from '../../styles/AdminUserManagement.module.css';

const demoUsers = [
  {
    id: 1,
    firstName: 'Cristalyn Grace',
    lastName: 'Llarenas',
    email: 'cristalgrace@gmail.com',
    role: 'Admin',
    isActive: true
  },
  {
    id: 2,
    firstName: 'Eigmar Clarence',
    lastName: 'Zamora',
    email: 'eigclarence@gmail.com',
    role: 'Staff',
    isActive: true
  },
  {
    id: 3,
    firstName: 'James Elmar',
    lastName: 'Higoy',
    email: 'jamelmar@gmail.com',
    role: 'Staff',
    isActive: true
  },
  {
    id: 4,
    firstName: 'Joanna Dane',
    lastName: 'Cooper',
    email: 'joandane@gmail.com',
    role: 'Staff',
    isActive: true
  },
  {
    id: 5,
    firstName: 'Sheena May',
    lastName: 'Emperador',
    email: 'sheenamay@gmail.com',
    role: 'Staff',
    isActive: true
  },
  {
    id: 6,
    firstName: 'Zean',
    lastName: 'Marquez',
    email: 'zeanm@gmail.com',
    role: 'Staff',
    isActive: true
  }
];

const demoGuests = [
  { id: 1, firstName: 'Cristalyn Grace', lastName: 'Llarenas', email: 'cristalgrace@gmail.com', phone: '+63 912 345 6789', isActive: true },
  { id: 2, firstName: 'James Elmar', lastName: 'Higoy', email: 'jamelmar@gmail.com', phone: '+63 923 456 7890', isActive: true },
  { id: 3, firstName: 'Joanna Dane', lastName: 'Cooper', email: 'joandane@gmail.com', phone: '+63 934 567 8901', isActive: true },
  { id: 4, firstName: 'Sheena May', lastName: 'Emperador', email: 'sheenamay@gmail.com', phone: '+63 945 678 9012', isActive: true },
  { id: 5, firstName: 'Zean', lastName: 'Marquez', email: 'zeanm@gmail.com', phone: '+63 956 789 0123', isActive: true }
];

const statusTabs = [
  { key: 'all', label: 'All Users' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' }
];

function normalizeUser(user) {
  return {
    id: user.id ?? user.pk ?? Math.floor(Math.random() * 100000),
    firstName: user.first_name || user.firstName || '',
    lastName: user.last_name || user.lastName || '',
    email: user.email || '',
    role: user.role
      ? String(user.role).charAt(0).toUpperCase() + String(user.role).slice(1)
      : user.is_superuser
      ? 'Admin'
      : user.is_staff
      ? 'Staff'
      : 'Client',
    isActive: user.is_active ?? true
  };
}

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

export default function AdminUserManagement({ role = 'admin', mode = 'users' }) {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Staff'
  });
  const isAdmin = role === 'admin';
  const isGuestMode = mode === 'guests';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = isGuestMode ? await adminAPI.getAllGuests() : await adminAPI.getAllUsers();
      if (Array.isArray(data) && data.length > 0) {
        setUsers(data.map(isGuestMode ? normalizeGuest : normalizeUser));
      } else {
        throw new Error('No data returned');
      }
      setError(null);
    } catch (err) {
      console.log('User management fallback: backend offline or no data', err);
      setUsers(isGuestMode ? demoGuests : demoUsers);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const counts = useMemo(() => {
    const active = users.filter((user) => user.isActive).length;
    return {
      all: users.length,
      active,
      inactive: users.length - active
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (filter === 'all') return users;
    return users.filter((user) => (filter === 'active' ? user.isActive : !user.isActive));
  }, [filter, users]);

  const handleInput = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    const userPayload = {
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email,
      password: form.password,
      role: form.role.toLowerCase()
    };

    try {
      const created = await adminAPI.createStaffUser(userPayload);
      setUsers((prev) => [normalizeUser(created), ...prev]);
      setShowModal(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', role: 'Staff' });
      setError(null);
    } catch (err) {
      console.error('Create user failed', err);
      setError('Could not create user right now. Please try again later.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = (userId) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, isActive: !user.isActive } : user
      )
    );
  };

  const handleRowAction = (user) => {
    if (isAdmin && !isGuestMode) {
      handleToggleStatus(user.id);
      return;
    }

    setSelectedUser(user);
  };

  return (
    <div className={styles.adminShell}>
      <Sidebar role={role} />
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.pageHeader}>
            <div className={styles.title}>
              <h1>{isGuestMode ? 'Guest Management' : 'User Management'}</h1>
              <p>
                {isAdmin
                  ? 'Infinity Garden Resort Reservation Management System'
                  : 'Infinity Garden Resort - Staff View'}
              </p>
            </div>
            {isAdmin && !isGuestMode && (
              <button className={styles.headerBtn} onClick={() => setShowModal(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add User
              </button>
            )}
          </div>
        </div>

        <div className={styles.actionBar}>
          <p className={styles.summaryText}>
            Showing {filteredUsers.length} of {counts.all} {isGuestMode ? 'guests' : 'users'} - {counts.active} active, {counts.inactive} inactive.
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
              <h3>Loading users…</h3>
              <p>Please wait while the list is loaded.</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No users found</h3>
              <p>Try another filter or add a new user.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    {isGuestMode ? <th>Phone</th> : <th>Role</th>}
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{String(user.id).padStart(2, '0')}</td>
                      <td>
                        <div className={styles.userName}>{user.firstName} {user.lastName}</div>
                      </td>
                      <td>
                        <div className={styles.userEmail}>{user.email}</div>
                      </td>
                      <td>
                        {isGuestMode ? (
                          <div className={styles.userPhone}>{user.phone}</div>
                        ) : (
                          <span className={styles.roleBadge}>{user.role}</span>
                        )}
                      </td>
                      <td>
                        <span className={`${styles.status} ${user.isActive ? styles.statusActive : styles.statusInactive}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleRowAction(user)}
                        >
                          {isAdmin && !isGuestMode ? (user.isActive ? 'Deactivate' : 'Activate') : 'View Details'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalPanel}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Add User</h2>
                <button className={styles.modalClose} onClick={() => setShowModal(false)}>
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreateUser}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName">First name</label>
                  <input
                    id="firstName"
                    className={styles.input}
                    type="text"
                    value={form.firstName}
                    onChange={(event) => handleInput('firstName', event.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="lastName">Last name</label>
                  <input
                    id="lastName"
                    className={styles.input}
                    type="text"
                    value={form.lastName}
                    onChange={(event) => handleInput('lastName', event.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    className={styles.input}
                    type="email"
                    value={form.email}
                    onChange={(event) => handleInput('email', event.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    className={styles.input}
                    type="password"
                    value={form.password}
                    onChange={(event) => handleInput('password', event.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    className={styles.select}
                    value={form.role}
                    onChange={(event) => handleInput('role', event.target.value)}
                  >
                    <option value="Staff">Staff</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitBtn} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedUser && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalPanel}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>{isGuestMode ? 'Guest Details' : 'User Details'}</h2>
                <button className={styles.modalClose} onClick={() => setSelectedUser(null)}>
                  x
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Name</label>
                  <input className={styles.input} value={`${selectedUser.firstName} ${selectedUser.lastName}`} readOnly />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input className={styles.input} value={selectedUser.email} readOnly />
                </div>
                {isGuestMode ? (
                  <div className={styles.formGroup}>
                    <label>Phone</label>
                    <input className={styles.input} value={selectedUser.phone || 'N/A'} readOnly />
                  </div>
                ) : (
                  <div className={styles.formGroup}>
                    <label>Role</label>
                    <input className={styles.input} value={selectedUser.role} readOnly />
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label>Status</label>
                  <input className={styles.input} value={selectedUser.isActive ? 'Active' : 'Inactive'} readOnly />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setSelectedUser(null)}>
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
