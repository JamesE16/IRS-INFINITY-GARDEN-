import { NavLink, useNavigate } from 'react-router-dom';
import styles from '../../styles/AdminSidebar.module.css';
import logo from '../../assets/logo.png';

import {
  FaTachometerAlt,
  FaUsers,
  FaCalendarCheck,
  FaBuilding,
  FaMoneyBillWave,
  FaClock,
  FaChartBar,
  FaComments,
  FaSignOutAlt
} from 'react-icons/fa';

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
  { to: '/admin/users', label: 'User Management', icon: <FaUsers /> },
  { to: '/admin/reservations', label: 'Reservation Management', icon: <FaCalendarCheck /> },
  { to: '/admin/facilities', label: 'Facilities & Room Management', icon: <FaBuilding /> },
  { to: '/admin/payments', label: 'Payments & Transaction', icon: <FaMoneyBillWave /> },
  { to: '/admin/feedbacks', label: 'Feedback Management', icon: <FaComments /> },
  { to: '/admin/schedule', label: 'Schedule Management', icon: <FaClock /> },
  { to: '/admin/reports', label: 'Reports', icon: <FaChartBar /> },
];

export default function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminRole');
    navigate('/');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <img src={logo} alt="Infinity Garden Logo" />
        <div className={styles.brandText}>
          <span className={styles.brandTitle}>Infinity Garden</span>
          <span className={styles.brandSub}>Resort Hotel & Pavilion</span>
        </div>
      </div>

      <div className={styles.divider}></div>

      <nav className={styles.navList}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon}>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}

        <NavLink
          to="/"
          onClick={handleLogout}
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          <span className={styles.icon}><FaSignOutAlt /></span>
          <span>Logout</span>
        </NavLink>
      </nav>
    </aside>
  );
}