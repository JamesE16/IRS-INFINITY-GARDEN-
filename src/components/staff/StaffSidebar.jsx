import { NavLink } from 'react-router-dom';
import styles from '../../styles/AdminSidebar.module.css';
import logo from '../../assets/logo.png';

import {
  FaTachometerAlt,
  FaUsers,
  FaCalendarCheck,
  FaBuilding,
  FaMoneyBillWave,
  FaClock,
  FaComments
} from 'react-icons/fa';

const links = [
  { to: '/staff/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
  { to: '/staff/guests', label: 'Guest Management', icon: <FaUsers /> },
  { to: '/staff/reservations', label: 'Reservation Management', icon: <FaCalendarCheck /> },
  { to: '/staff/facilities', label: 'Resort Facilities', icon: <FaBuilding /> },
  { to: '/staff/payments', label: 'Payment Management', icon: <FaMoneyBillWave /> },
  { to: '/staff/feedbacks', label: 'Feedback Management', icon: <FaComments /> },
  { to: '/staff/schedule', label: 'Schedule Monitoring', icon: <FaClock /> },
];

export default function StaffSidebar() {
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
      </nav>
    </aside>
  );
}