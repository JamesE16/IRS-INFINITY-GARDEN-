import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import styles from "../../styles/NavBar.module.css";
import logo from '../../assets/logo.png';


export default function NavBar() {
  const navigate = useNavigate();

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
      <NavLink to="/" className={styles.brand}>
        <div className={styles.logo}>
          <img src={logo} alt="Infinity Garden Logo" />
        </div>

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
