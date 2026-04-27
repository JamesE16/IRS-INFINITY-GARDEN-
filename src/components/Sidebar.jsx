import { NavLink, useNavigate } from 'react-router-dom';
import styles from '../styles/Sidebar.module.css';
import logo from '../assets/logo.png';

import {
  FaTachometerAlt,
  FaUsers,
  FaCalendarCheck,
  FaBuilding,
  FaMoneyBillWave,
  FaClock,
  FaChartBar,
  FaComments,
  FaSignOutAlt,
} from 'react-icons/fa';


const ALL_MODULES = [
  {
    to: '/admin/dashboard',
    staffTo: '/staff/dashboard',
    label: 'Dashboard',
    icon: <FaTachometerAlt />,
    roles: ['admin', 'staff'],
  },
  {
    to: '/admin/users',
    label: 'User Management',
    icon: <FaUsers />,
    roles: ['admin'],
  },
  {
    to: '/staff/guests',
    label: 'Guest Management',
    icon: <FaUsers />,
    roles: ['staff'],
  },
  {
    to: '/admin/reservations',
    staffTo: '/staff/reservations',
    label: 'Reservation Management',
    icon: <FaCalendarCheck />,
    roles: ['admin', 'staff'],
  },
  {
    to: '/admin/facilities',
    label: 'Facilities & Room Management',
    icon: <FaBuilding />,
    roles: ['admin'],
  },
  {
    to: '/staff/facilities',
    label: 'Resort Facilities',
    icon: <FaBuilding />,
    roles: ['staff'],
  },
  {
    to: '/admin/payments',
    staffTo: '/staff/payments',
    label: 'Payment Management',
    icon: <FaMoneyBillWave />,
    roles: ['admin', 'staff'],
  },
  {
    to: '/admin/feedbacks',
    staffTo: '/staff/feedbacks',
    label: 'Feedback Management',
    icon: <FaComments />,
    roles: ['admin', 'staff'],
  },
  {
    to: '/admin/schedule',
    staffTo: '/staff/schedule',
    label: 'Schedule Management',
    icon: <FaClock />,
    roles: ['admin', 'staff'],
  },
  {
    to: '/admin/reports',
    staffTo: '/staff/reports',
    label: 'Reports',
    icon: <FaChartBar />,
    roles: ['admin', 'staff'],  
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
/**
 * @param {{ role: 'admin' | 'staff' }} props
 */
export default function Sidebar({ role = 'staff' }) {
  const navigate = useNavigate();

  // Filter modules by role
  const visibleModules = ALL_MODULES.filter((m) => m.roles.includes(role));

  // Resolve the correct `to` path per role
  const resolveLink = (module) => {
    if (role === 'staff' && module.staffTo) return module.staffTo;
    return module.to;
  };

  const handleLogout = () => {
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminRole');
    navigate('/');
  };

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        <img src={logo} alt="Infinity Garden Logo" />
        <div className={styles.brandText}>
          <span className={styles.brandTitle}>Infinity Garden</span>
          <span className={styles.brandSub}>Resort Hotel &amp; Pavilion</span>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Navigation */}
      <nav className={styles.navList}>
        {visibleModules.map((module) => (
          <NavLink
            key={module.label}
            to={resolveLink(module)}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon}>{module.icon}</span>
            <span className={styles.label}>{module.label}</span>
          </NavLink>
        ))}

        {/* Logout — always visible */}
        <button
          type="button"
          onClick={handleLogout}
          className={`${styles.navItem} ${styles.logoutBtn}`}
        >
          <span className={styles.icon}><FaSignOutAlt /></span>
          <span className={styles.label}>Logout</span>
        </button>
      </nav>
    </aside>
  );
}
