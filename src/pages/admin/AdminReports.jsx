import React from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import styles from '../../styles/AdminDashboard.module.css';
import { FaPrint, FaChevronRight, FaChartBar, FaCalendarCheck, FaUserFriends, FaRegFileAlt } from 'react-icons/fa';

const AdminReports = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fbff' }}>
      {/* Integrated Sidebar */}
      <AdminSidebar activePage="/admin/reports" />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Header Section from Figma image_8ad06d */}
        <div className={styles.topHeader}>
          <div className={styles.breadcrumb}>
            <span>Admin</span> <FaChevronRight size={10} /> <strong>Reports</strong>
          </div>
          <button className={styles.printBtn} onClick={() => window.print()}>
            <FaPrint /> Export PDF
          </button>
        </div>

        <div className={styles.reportsContent} style={{ padding: '30px' }}>
          
          {/* Statistical Cards matching the Admin Dashboard style */}
          <div className={styles.financialGrid} style={{ marginBottom: '30px' }}>
            <div className={styles.whiteCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.incomeHeading}><FaCalendarCheck /> Monthly Bookings</h3>
              </div>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <h2 style={{ fontSize: '2.5rem', color: '#1e293b' }}>142</h2>
                <p style={{ color: '#64748b' }}>Total confirmed reservations this month</p>
              </div>
            </div>

            <div className={styles.whiteCard}>
              <div className={styles.cardHeader}>
                <h3 style={{ color: '#3b82f6', borderLeft: '4px solid #3b82f6', paddingLeft: '10px' }}>
                  <FaUserFriends /> Guest Traffic
                </h3>
              </div>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <h2 style={{ fontSize: '2.5rem', color: '#1e293b' }}>648</h2>
                <p style={{ color: '#64748b' }}>Total guests hosted in April 2026</p>
              </div>
            </div>

            <div className={styles.whiteCard}>
              <div className={styles.cardHeader}>
                <h3 style={{ color: '#8b5cf6', borderLeft: '4px solid #8b5cf6', paddingLeft: '10px' }}>
                  <FaChartBar /> Occupancy Rate
                </h3>
              </div>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <h2 style={{ fontSize: '2.5rem', color: '#1e293b' }}>78%</h2>
                <p style={{ color: '#64748b' }}>Facility utilization across all rooms</p>
              </div>
            </div>
          </div>

          {/* Detailed Reports Table based on the User Management layout */}
          <div className={styles.tableCard} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div className={styles.tableCardHeader} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3><FaRegFileAlt /> Detailed Occupancy Report</h3>
            </div>
            
            <table className={styles.adminTable} style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                  <th style={{ padding: '12px' }}>Facility Name</th>
                  <th>Total Bookings</th>
                  <th>Total Revenue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px' }}>Barkada Room</td>
                  <td>45</td>
                  <td>₱198,000</td>
                  <td><span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>High Demand</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px' }}>Family Room</td>
                  <td>32</td>
                  <td>₱99,200</td>
                  <td><span style={{ background: '#fef9c3', color: '#854d0e', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>Steady</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px' }}>Pavilion A</td>
                  <td>12</td>
                  <td>₱60,000</td>
                  <td><span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>High Demand</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;