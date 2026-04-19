import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import styles from "../../styles/NavBar.module.css";
import logo from '../../assets/logo.png';


export default function NavBar() {
  const navigate = useNavigate();

// Listen for Ctrl+L keyboard shortcut (hidden login access)
      useEffect(() => {
        const handleKeyDown = (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            navigate('/login');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <nav className={styles.navbar}>
      {/* BRAND */}
      <NavLink to="/" className={styles.brand}>
        {/* Logo Image */}
        <div className={styles.logo}>
          <img src={logo} alt="Infinity Garden Logo" />
        </div>

        {/* Brand Text */}
        <div className={styles.brandText}>
          <span className={styles.brandName}>
            <span className={styles.infinity}>Infinity</span>
            <span className={styles.garden}>Garden</span>
          </span>
          <span className={styles.brandSub}>
            Resort Hotel & Pavilion
          </span>
        </div>
      </NavLink>

      {/* NAV LINKS */}
      <div className={styles.links}>
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ''}`
          }
        >
          Home
        </NavLink>

        <NavLink
          to="/rooms"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ''}`
          }
        >
          Rooms
        </NavLink>

        <NavLink
          to="/my-bookings"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ''}`
          }
        >
          My Bookings
        </NavLink>
      </div>
    </nav>
  );
}