import React, { useState, useEffect, useMemo } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import styles from '../../styles/AdminDashboard.module.css';
import { reservationsAPI } from '../../utils/api';
import { 
  FaCalendarAlt, FaUsers, FaChartPie, FaChartLine, 
  FaDownload, FaPlus, FaChevronRight 
} from 'react-icons/fa';

const AdminReports = () => {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '2026-03-07', end: '2026-03-10' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await reservationsAPI.getAllReservations();
        setData(res || []);
      } catch (err) { 
        console.error("Fetch error:", err); 
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const itemDate = item.created_at?.split('T')[0];
      return itemDate >= dateRange.start && itemDate <= dateRange.end;
    });
  }, [data, dateRange]);

  const handlePrint = () => {
    setShowModal(false);
    // Timeout ensures the modal is gone before the print dialog captures the screen
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className={styles.adminLayout} style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar activePage="/admin/reports" />

      <main className={styles.mainReportContainer}>
        <header className={styles.topHeader}>
          <div className={styles.breadcrumb}>
            <span>Admin</span> <FaChevronRight size={10} /> <strong>Reports</strong>
          </div>
        </header>

        <div className={styles.reportGridContainer}>
          <div className={styles.analyticsColumn}>
            {/* Quick Report Dashboard */}
            <section className={styles.quickReportDashboard}>
              <h3>Quick Report Dashboard</h3>
              <div className={styles.statCardsRow}>
                <div className={styles.smallStatCard}>
                  <p>Total Reservations</p>
                  <div className={styles.statMain}><strong>120</strong> <FaCalendarAlt /></div>
                  <span className={styles.trendPos}>+20 last week</span>
                </div>
                <div className={styles.smallStatCard}>
                  <p>Total Guests</p>
                  <div className={styles.statMain}><strong>101</strong> <FaUsers /></div>
                </div>
                <div className={styles.smallStatCard}>
                  <p>Facility Usage</p>
                  <div className={styles.chartPlaceholder}><FaChartPie /></div>
                </div>
              </div>

              <div className={styles.graphsRow}>
                <div className={styles.graphCard}>
                  <p>Occupancy Report</p>
                  <h3>78.5%</h3>
                  <div className={styles.miniGraph}><FaChartLine /></div>
                  <button className={styles.downloadBtn} onClick={() => setShowModal(true)}>Download</button>
                </div>
                <div className={styles.graphCard}>
                  <p>Revenue Over Time</p>
                  <h3>₱145,200.00</h3>
                  <div className={styles.barGraphPlaceholder}></div>
                  <button className={styles.downloadBtn} onClick={() => setShowModal(true)}>Download</button>
                </div>
              </div>
            </section>

            {/* Generated Reports Table */}
            <section className={styles.generatedReportsSection}>
              <div className={styles.tableHeader}>
                <h3>Generated Reports</h3>
                <button className={styles.printReportBtn} onClick={() => setShowModal(true)}>
                  <FaPlus /> + Print Report
                </button>
              </div>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>Report ID</th>
                    <th>Type</th>
                    <th>Date Generated</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((report, idx) => (
                    <tr key={idx}>
                      <td>REP-00{idx + 1}</td>
                      <td>{report.facility_name || 'Reservations'}</td>
                      <td>{report.created_at?.split('T')[0] || '2026-03-07'}</td>
                      <td>
                        <div className={styles.actionContainer}>
                          <button className={styles.viewLink} onClick={() => setShowModal(true)}>View</button>
                          <button className={styles.downloadLink} onClick={() => setShowModal(true)}>Download</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          {/* Filter Sidebar */}
          <aside className={styles.reportFilters}>
            <h4>Report Type</h4>
            <select className={styles.sidebarSelect}><option>All Types</option></select>
            <h4>Date Range</h4>
            <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
            <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} />
            <button className={styles.generateMainBtn} onClick={() => setShowModal(true)}>Generate Report</button>
          </aside>
        </div>
      </main>

      {/* Generate Report Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.reportModal}>
            <div className={styles.modalHeader}>
              <h3>Generate Report</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <label>Report Type</label>
              <select><option>Reservations</option></select>
              <label>Facility Type</label>
              <select><option>Room 101</option></select>
              <label>Generated by</label>
              <input type="text" value="Admin" readOnly />
              <label>Date Range</label>
              <div className={styles.modalDates}>
                <input type="text" value={dateRange.start} readOnly />
                <span>—</span>
                <input type="text" value={dateRange.end} readOnly />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles.generateBtn} onClick={handlePrint}>Generate Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;