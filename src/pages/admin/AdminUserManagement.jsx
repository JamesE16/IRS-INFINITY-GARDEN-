import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function AdminUserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Staff'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminAPI.getAllUsers();
      if (Array.isArray(data) && data.length > 0) {
        setUsers(data.map(normalizeUser));
      } else {
        throw new Error('No user data returned');
      }
      setError(null);
    } catch (err) {
      console.log('Admin users fallback: backend offline or no users', err);
      setUsers(demoUsers);
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

  return (
    <div className={styles.adminShell}>
      <Sidebar role="admin" />
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.pageHeader}>
            <div className={styles.title}>
              <h1>User Management</h1>
              <p>Infinity Garden Resort Reservation Management System</p>
            </div>
            {/* EXACT LOGOUT BUTTON STYLE */}
            <button className={styles.headerBtn} onClick={() => setShowModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add User
            </button>
          </div>
        </div>

        <div className={styles.actionBar}>
          <p className={styles.summaryText}>
            Showing {filteredUsers.length} of {counts.all} users — {counts.active} active, {counts.inactive} inactive.
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
                    <th>Role</th>
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
                        <span className={styles.roleBadge}>{user.role}</span>
                      </td>
                      <td>
                        <span className={`${styles.status} ${user.isActive ? styles.statusActive : styles.statusInactive}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleToggleStatus(user.id)}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
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
      </div>
    </div>
  );
}