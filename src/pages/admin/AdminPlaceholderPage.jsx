import { useNavigate } from 'react-router-dom';
import styles from '../../styles/AdminPlaceholderPage.module.css';
import logo from '../../assets/logo.png';

export default function AdminPlaceholderPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.placeholderPage}>
      <div className={styles.brandHeader}>
        <img src={logo} alt="Infinity Garden Logo" />
        <div>
          <h1>Infinity Garden</h1>
          <p>Resort Hotel & Pavilion</p>
        </div>
      </div>
      <div className={styles.card}>
        <h2>AI DHAI</h2>
        <button className={styles.backBtn} onClick={() => navigate('/admin/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
