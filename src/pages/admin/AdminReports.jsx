import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/Sidebar';
import styles from '../../styles/AdminReports.module.css';
import { reservationsAPI, facilitiesAPI } from '../../utils/api';
import { 
  FaCalendarAlt, FaUsers, FaChartPie, FaChartLine, 
  FaDownload, FaPlus 
} from 'react-icons/fa';

const AdminReports = ({ role = 'admin' }) => {
  const [data, setData] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [showModal, setShowModal] = useState(null); // "generate" | "print" | null
  const isAdmin = role === 'admin';

  const [filters, setFilters] = useState({
    facilityType: 'All',
    startDate: '2026-03-07',
    endDate: '2026-03-10'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reservationsRes, facilitiesRes] = await Promise.all([
          reservationsAPI.getAllReservations(),
          facilitiesAPI.getAll()
        ]);
        setData(reservationsRes || []);
        setFacilities(facilitiesRes || []);
      } catch (err) { 
        console.error("Fetch error:", err); 
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const itemDate = item.created_at?.split('T')[0];
      const dateMatch = itemDate >= filters.startDate && itemDate <= filters.endDate;
      const facilityMatch = filters.facilityType === 'All' || item.facility_name === filters.facilityType;
      return dateMatch && facilityMatch;
    });
  }, [data, filters]);

  const handlePrint = () => {
    setShowModal(null);
    // Trigger print immediately without changing component state
    setTimeout(() => window.print(), 100);
  };

  const handleGenerate = () => {
    setShowModal(null);
    // Trigger print immediately without changing component state
    setTimeout(() => window.print(), 100);
  };

  return (
    <div className={styles.adminShell}>
      <Sidebar role={role} />

      <div className={styles.mainContent}>
        {/* ===== HEADER (UNCHANGED) ===== */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.title}>
              <h1>Reports</h1>
              <p>
                {isAdmin
                  ? 'Infinity Garden Resort Reservation Management System'
                  : 'Infinity Garden Resort - Staff View'}
              </p>
            </div>
          </div>
        </div>

        <main className={styles.container}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gap: '25px',
            alignItems: 'start'
          }}>

            {/* LEFT SIDE */}
            <div className={styles.analyticsColumn}>

              {/* DASHBOARD */}
              <section className={styles.quickReportDashboard}>
                <h3>Quick Report Dashboard</h3>

                <div className={styles.statCardsRow}>
                  <div className={styles.smallStatCard}>
                    <p>Total Reservations</p>
                    <div className={styles.statMain}>
                      <strong>{filteredData.length}</strong> <FaCalendarAlt />
                    </div>
                    <span className={styles.trendPos}>+20 last week</span>
                  </div>

                  <div className={styles.smallStatCard}>
                    <p>Total Guests</p>
                    <div className={styles.statMain}>
                      <strong>{filteredData.reduce((sum, item) => sum + (item.num_guests || 0), 0)}</strong> <FaUsers />
                    </div>
                  </div>

                  <div className={styles.smallStatCard}>
                    <p>Facility Usage Breakdown</p>
                    <div className={styles.chartPlaceholder}>
                      <FaChartPie />
                    </div>
                  </div>
                </div>

                <div className={styles.graphsRow}>
                  <div className={styles.graphCard}>
                    <p>Occupancy Report</p>
                    <h3>{filteredData.length > 0 ? '78.5%' : '0%'}</h3>
                    <div className={styles.miniGraph}>
                      <FaChartLine />
                    </div>
                    {isAdmin && (
                      <button
                        className={styles.downloadBtn}
                        onClick={() => setShowModal("generate")}
                      >
                        <FaDownload /> Download
                      </button>
                    )}
                  </div>

                  <div className={styles.graphCard}>
                    <p>Revenue Over Time</p>
                    <h3>₱{filteredData.reduce((sum, item) => sum + (item.total_amount || 0), 0).toLocaleString()}</h3>
                    <div className={styles.barGraphPlaceholder}></div>
                    {isAdmin && (
                      <button
                        className={styles.downloadBtn}
                        onClick={() => setShowModal("generate")}
                      >
                        <FaDownload /> Download
                      </button>
                    )}
                  </div>
                </div>
              </section>

              {/* TABLE */}
              <section>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    color: 'var(--navy, #1a3c8f)',
                    margin: 0
                  }}>
                    Generated Reports
                  </h3>

                  {isAdmin && (
                    <button
                      className={styles.printReportBtn}
                      onClick={() => setShowModal("print")}
                    >
                      <FaPlus /> Print Report
                    </button>
                  )}
                </div>

                <table className={styles.reportTable}>
                  <thead>
                    <tr>
                      <th>Report ID</th>
                      <th>Type</th>
                      <th>Date Generated</th>
                      <th>Generated By</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredData.map((report, idx) => (
                      <tr key={idx}>
                        <td>REP-00{idx + 1}</td>
                        <td>{report.facility_name || 'Reservations'}</td>
                        <td>{report.created_at?.split('T')[0]}</td>
                        <td>Admin</td>
                        <td>
                          <div className={styles.actionContainer}>
                            <button className={styles.viewLink}>
                              View
                            </button>

                            {isAdmin && (
                              <button
                                className={styles.downloadLink}
                                onClick={() => setShowModal("generate")}
                              >
                                Download
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>

            {/* RIGHT PANEL */}
            <aside className={styles.reportFilters}>
              <h4>Report Type</h4>
              <select className={styles.sidebarSelect}>
                <option>All Types</option>
                <option>Reservations</option>
                <option>Payments</option>
                <option>Facilities</option>
                <option>Guests</option>
              </select>

              <h4>Facility Type</h4>
              <select
                className={styles.sidebarSelect}
                value={filters.facilityType}
                onChange={(e) => setFilters({
                  ...filters,
                  facilityType: e.target.value
                })}
              >
                <option value="All">All Facilities</option>
                <option value="Room">Room</option>
                <option value="Cottage">Cottage</option>
                <option value="Gazebo">Gazebo</option>
                <option value="Pavilion">Pavilion</option>
              </select>

              <h4>Date Range</h4>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({
                  ...filters,
                  startDate: e.target.value
                })}
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({
                  ...filters,
                  endDate: e.target.value
                })}
              />

              {isAdmin && (
                <button
                  className={styles.generateMainBtn}
                  onClick={handleGenerate}
                >
                  Generate Report
                </button>
              )}
            </aside>

          </div>
        </main>

        {/* PRINT MODAL (TABLE STYLE LIKE FIGMA) */}
        {showModal === "print" && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: '520px' }}>
              
              <div className={styles.modalHeader}>
                <h3>Print Report</h3>
                <button 
                  className={styles.modalClose}
                  onClick={() => setShowModal(null)}
                >✕</button>
              </div>

              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>Report ID</th>
                    <th>Report Type</th>
                    <th>Date Generated</th>
                    <th>Generated By</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, 4).map((r, i) => (
                    <tr key={i}>
                      <td>REP-00{i + 1}</td>
                      <td>Reservations</td>
                      <td>March {7 + i} - March {10 + i}</td>
                      <td>Admin</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.modalFooter}>
                <button 
                  className={styles.cancelBtn}
                  onClick={() => setShowModal(null)}
                >
                  Cancel
                </button>

                <button 
                  className={styles.generateBtn}
                  onClick={handlePrint}
                >
                  Print Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GENERATE MODAL */}
        {showModal === "generate" && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              
              <div className={styles.modalHeader}>
                <h3>Generate Report</h3>
                <button 
                  className={styles.modalClose}
                  onClick={() => setShowModal(null)}
                >✕</button>
              </div>

              <div className={styles.modalBody}>
                <label>Report Type</label>
                <select value="Reservations" readOnly>
                  <option>Reservations</option>
                </select>

                <label>Facility Type</label>
                <select value={filters.facilityType} readOnly>
                  <option value="All">All Facilities</option>
                  <option value="Room">Room</option>
                  <option value="Cottage">Cottage</option>
                  <option value="Gazebo">Gazebo</option>
                  <option value="Pavilion">Pavilion</option>
                </select>

                <label>Generated by</label>
                <input type="text" value="Admin" readOnly />

                <label>Date Range</label>
                <div className={styles.modalDates}>
                  <input type="text" value={new Date(filters.startDate).toLocaleDateString()} readOnly />
                  <span>—</span>
                  <input type="text" value={new Date(filters.endDate).toLocaleDateString()} readOnly />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  className={styles.cancelBtn}
                  onClick={() => setShowModal(null)}
                >
                  Cancel
                </button>

                <button 
                  className={styles.generateBtn}
                  onClick={handleGenerate}
                >
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Print Container */}
        <div className={styles.printContainer} style={{ display: 'none' }}>
          <div className={styles.printHeader}>
            <h1>Infinity Garden Resort - Reports</h1>
            <p>Generated on {new Date().toLocaleDateString()} | Date Range: {filters.startDate} to {filters.endDate}</p>
            <p>Facility Type: {filters.facilityType} | Total Records: {filteredData.length}</p>
          </div>

          <div className={styles.printContent}>
            {/* Quick Report Dashboard */}
            <section className={styles.printSection}>
              <h2>Quick Report Dashboard</h2>

              <div className={styles.printStats}>
                <div className={styles.printStat}>
                  <h3>Total Reservations</h3>
                  <p>{filteredData.length}</p>
                </div>
                <div className={styles.printStat}>
                  <h3>Total Guests</h3>
                  <p>{filteredData.reduce((sum, item) => sum + (item.num_guests || 0), 0)}</p>
                </div>
                <div className={styles.printStat}>
                  <h3>Occupancy Rate</h3>
                  <p>{filteredData.length > 0 ? '78.5%' : '0%'}</p>
                </div>
                <div className={styles.printStat}>
                  <h3>Total Revenue</h3>
                  <p>₱{filteredData.reduce((sum, item) => sum + (item.total_amount || 0), 0).toLocaleString()}</p>
                </div>
              </div>
            </section>

            {/* Generated Reports Table */}
            <section className={styles.printSection}>
              <h2>Generated Reports</h2>
              <table className={styles.printTable}>
                <thead>
                  <tr>
                    <th>Report ID</th>
                    <th>Facility Type</th>
                    <th>Guest Name</th>
                    <th>Check-in Date</th>
                    <th>Check-out Date</th>
                    <th>Guests</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((report, idx) => (
                    <tr key={idx}>
                      <td>{report.reservation_id || `REP-00${idx + 1}`}</td>
                      <td>{report.facility_name || 'N/A'}</td>
                      <td>{report.first_name} {report.last_name}</td>
                      <td>{report.check_in}</td>
                      <td>{report.check_out}</td>
                      <td>{report.num_guests}</td>
                      <td>₱{report.total_amount?.toLocaleString() || '0'}</td>
                      <td>{report.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminReports;
