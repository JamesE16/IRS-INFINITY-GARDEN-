import { NavLink, useNavigate } from 'react-router-dom'; // 1. Added useNavigate
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
  FaListAlt,      // 2. Added icon for Logs
  FaSignOutAlt    // 3. Added icon for Logout
} from 'react-icons/fa';

// 4. Added the missing '/admin/logs' to your links array
const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
  { to: '/admin/users', label: 'User Management', icon: <FaUsers /> },
  { to: '/admin/reservations', label: 'Reservation Management', icon: <FaCalendarCheck /> },
  { to: '/admin/facilities', label: 'Facilities & Room Management', icon: <FaBuilding /> },
  { to: '/admin/payments', label: 'Payments & Transaction', icon: <FaMoneyBillWave /> },
  { to: '/admin/schedule', label: 'Schedule Management', icon: <FaClock /> },
  { to: '/admin/reports', label: 'Reports', icon: <FaChartBar /> },
  { to: '/admin/logs', label: 'System Logs', icon: <FaListAlt /> }, 
];

export default function AdminSidebar() {
  const navigate = useNavigate(); // 5. Initialize the navigation hook

  // 6. Create the logout function
  const handleLogout = () => {
    // Later, you will clear user tokens/context here
    alert("Logging out of Admin Dashboard...");
    navigate('/admin/login'); // Redirect back to login page
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

      {/* Main Navigation Links */}
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

      {/* 7. ADDED: Logout Section at the bottom */}
      <div className={styles.bottomSection}>
        <div className={styles.divider}></div>
        <button onClick={handleLogout} className={styles.logoutButton}>
          <span className={styles.icon}><FaSignOutAlt /></span>
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
