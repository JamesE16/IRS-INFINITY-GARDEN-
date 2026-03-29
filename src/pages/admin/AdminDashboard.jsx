import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { adminAPI } from '../../utils/api';
import styles from '../../styles/AdminDashboard.module.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const summary = await adminAPI.getReservationSummary();
        const guestReport = await adminAPI.getGuestReport();
        
        setStats({
          ...summary,
          ...guestReport
        });
      } catch (err) {
        // If backend not running, use demo data
        console.log('Using demo data (backend offline)');
        setStats({
          total_reservations: 0,
          approved_count: 0,
          pending_count: 0,
          cancelled_count: 0,
          total_revenue: 0,
          average_booking_value: 0,
          total_guests: 0,
          repeat_guests: 0
        });
      }
    };

    fetchStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminRole');
    navigate('/');
  };

  return (
    <div className={styles.adminShell}>
      <AdminSidebar />
      <div className={styles.mainContent}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.title}>
              <h1>Admin Dashboard</h1>
              <p>Infinity Garden Resort Reservation Management System</p>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Main content */}
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

          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#dbeafe' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Total Reservations</p>
                <p className={styles.statValue}>{stats?.total_reservations || 0}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#dcfce7' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Approved</p>
                <p className={styles.statValue}>{stats?.approved_count || 0}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#fef9c3' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Pending</p>
                <p className={styles.statValue}>{stats?.pending_count || 0}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#fee2e2' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Cancelled</p>
                <p className={styles.statValue}>{stats?.cancelled_count || 0}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#fce7f3' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2">
                  <path d="M12 2v20M2 12h20"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Total Revenue</p>
                <p className={styles.statValue}>₱{(stats?.total_revenue || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


  
