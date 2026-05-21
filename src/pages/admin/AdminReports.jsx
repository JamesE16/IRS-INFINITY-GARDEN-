import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import styles from '../../styles/AdminReports.module.css';
import { adminAPI } from '../../utils/api';
import logo from '../../assets/logo.png';
import {
  FaCalendarAlt,
  FaUsers,
  FaChartPie,
  FaChartLine,
  FaDownload,
  FaPlus,
} from 'react-icons/fa';

const REPORT_TYPE_LABELS = {
  reservations: 'Reservations',
  payments: 'Payments',
  facilities: 'Facilities',
  guests: 'Guests',
};

const FACILITY_TYPES = ['All', 'Room', 'Cottage', 'Gazebo', 'Pavilion'];

const money = (value) =>
  `PHP ${Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return 'All dates';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const imageToDataUrl = async (src) => {
  const response = await fetch(src);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const buildReportHtml = ({ logoDataUrl, rows, summary, filters, role }) => {
  const generatedAt = new Date().toLocaleString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const reportTitle = `Infinity Garden Resort ${REPORT_TYPE_LABELS[filters.reportType]} Report`;

  const tableRows = rows.length
    ? rows
        .map(
          (report, index) => `
            <tr>
              <td>${escapeHtml(report.reservation_id || `REP-${String(index + 1).padStart(4, '0')}`)}</td>
              <td>${escapeHtml(report.facility_type || 'N/A')}</td>
              <td>${escapeHtml(report.facility_name || 'N/A')}</td>
              <td>${escapeHtml(report.guest_full_name || `${report.first_name || ''} ${report.last_name || ''}`.trim())}</td>
              <td>${escapeHtml(formatDate(report.check_in))}</td>
              <td>${escapeHtml(formatDate(report.check_out))}</td>
              <td>${escapeHtml(report.num_guests || 0)}</td>
              <td>${escapeHtml(money(report.total_amount))}</td>
              <td>${escapeHtml(report.status || 'N/A')}</td>
            </tr>
          `
        )
        .join('')
    : '<tr><td colspan="9" class="empty">No records found for the selected filters.</td></tr>';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(reportTitle)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 36px;
      color: #172033;
      font-family: Arial, Helvetica, sans-serif;
      background: #f5f7fb;
    }
    .page {
      max-width: 1120px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #d9e2f2;
      padding: 34px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 18px;
      padding-bottom: 20px;
      border-bottom: 3px solid #1a3c8f;
    }
    .logo {
      width: 82px;
      height: 82px;
      object-fit: contain;
    }
    h1 {
      margin: 0 0 6px;
      color: #1a3c8f;
      font-size: 28px;
      letter-spacing: 0;
    }
    .subtle {
      margin: 2px 0;
      color: #5f6d83;
      font-size: 13px;
    }
    .meta {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 24px 0;
    }
    .metric {
      border: 1px solid #dbe4f0;
      background: #f8fafc;
      padding: 14px;
    }
    .metric span {
      display: block;
      color: #667085;
      font-size: 12px;
      margin-bottom: 8px;
    }
    .metric strong {
      display: block;
      color: #1a3c8f;
      font-size: 21px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 12px;
    }
    th {
      background: #1a3c8f;
      color: #fff;
      text-align: left;
      padding: 10px;
      border: 1px solid #1a3c8f;
    }
    td {
      padding: 10px;
      border: 1px solid #dbe4f0;
      vertical-align: top;
    }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .empty {
      text-align: center;
      color: #667085;
      padding: 22px;
    }
    .footer {
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px solid #dbe4f0;
      color: #667085;
      font-size: 12px;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .page { border: 0; }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="header">
      <img class="logo" src="${logoDataUrl}" alt="Infinity Garden Resort Logo" />
      <div>
        <h1>${escapeHtml(reportTitle)}</h1>
        <p class="subtle">Infinity Garden Resort Reservation Management System</p>
        <p class="subtle">Generated by: ${escapeHtml(role === 'admin' ? 'Admin' : 'Staff')} | Generated on: ${escapeHtml(generatedAt)}</p>
        <p class="subtle">Date range: ${escapeHtml(formatDate(filters.startDate))} to ${escapeHtml(formatDate(filters.endDate))} | Facility type: ${escapeHtml(filters.facilityType)}</p>
      </div>
    </header>

    <section class="meta">
      <div class="metric"><span>Total Reservations</span><strong>${escapeHtml(summary.total_reservations || 0)}</strong></div>
      <div class="metric"><span>Total Guests</span><strong>${escapeHtml(summary.total_guests || 0)}</strong></div>
      <div class="metric"><span>Total Revenue</span><strong>${escapeHtml(money(summary.total_revenue))}</strong></div>
      <div class="metric"><span>Confirmed</span><strong>${escapeHtml(summary.confirmed_count || 0)}</strong></div>
    </section>

    <table>
      <thead>
        <tr>
          <th>Reservation ID</th>
          <th>Type</th>
          <th>Facility</th>
          <th>Guest</th>
          <th>Check-in</th>
          <th>Check-out</th>
          <th>Guests</th>
          <th>Total Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>

    <footer class="footer">
      This report was generated from the current Infinity Garden Resort database records.
    </footer>
  </main>
</body>
</html>`;
};

const AdminReports = ({ role = 'admin' }) => {
  const [reportData, setReportData] = useState({
    summary: {},
    reservations: [],
    facility_breakdown: [],
  });
  const [showModal, setShowModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    reportType: 'reservations',
    facilityType: 'All',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    let ignore = false;

    const fetchReport = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await adminAPI.getReservationDetailReport(filters);
        if (!ignore) {
          setReportData({
            summary: response.summary || {},
            reservations: response.reservations || [],
            facility_breakdown: response.facility_breakdown || [],
          });
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to load report data.');
          setReportData({ summary: {}, reservations: [], facility_breakdown: [] });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchReport();

    return () => {
      ignore = true;
    };
  }, [filters]);

  const rows = reportData.reservations;
  const summary = reportData.summary;

  const topFacilityType = useMemo(() => {
    const top = [...(reportData.facility_breakdown || [])].sort(
      (a, b) => (b.total_reservations || 0) - (a.total_reservations || 0)
    )[0];

    return top ? `${top.facility_type} (${top.total_reservations})` : 'No records';
  }, [reportData.facility_breakdown]);

  const closeModal = () => {
    setShowModal(null);
  };

  const downloadReportFile = async () => {
    const logoDataUrl = await imageToDataUrl(logo);
    const html = buildReportHtml({
      logoDataUrl,
      rows,
      summary,
      filters,
      role,
    });
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const dateLabel = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.download = `infinity-garden-${filters.reportType}-report-${dateLabel}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadReport = async () => {
    setError('');

    try {
      await downloadReportFile();
    } catch (err) {
      setError(err.message || 'Failed to generate the report file.');
    }
  };

  const handlePrint = async () => {
    setShowModal(null);
    const logoDataUrl = await imageToDataUrl(logo);
    const html = buildReportHtml({ logoDataUrl, rows, summary, filters, role });
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      setError('The print window was blocked by the browser.');
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className={styles.adminShell}>
      <Sidebar role={role} />

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.title}>
              <h1>Reports</h1>
              <p>
                {role === 'admin'
                  ? 'Infinity Garden Resort Reservation Management System'
                  : 'Infinity Garden Resort - Staff View'}
              </p>
            </div>
          </div>
        </div>

        <main className={styles.container}>
          <div className={styles.reportLayout}>
            <div className={styles.analyticsColumn}>
              {error && <div className={styles.reportAlert}>{error}</div>}

              <section className={styles.quickReportDashboard}>
                <h3>Quick Report Dashboard</h3>

                <div className={styles.statCardsRow}>
                  <div className={styles.smallStatCard}>
                    <p>Total Reservations</p>
                    <div className={styles.statMain}>
                      <strong>{summary.total_reservations || 0}</strong> <FaCalendarAlt />
                    </div>
                    <span className={styles.trendPos}>
                      {loading ? 'Loading database records...' : `${rows.length} matching records`}
                    </span>
                  </div>

                  <div className={styles.smallStatCard}>
                    <p>Total Guests</p>
                    <div className={styles.statMain}>
                      <strong>{summary.total_guests || 0}</strong> <FaUsers />
                    </div>
                  </div>

                  <div className={styles.smallStatCard}>
                    <p>Facility Usage Breakdown</p>
                    <div className={styles.statMain}>
                      <strong>{topFacilityType}</strong> <FaChartPie />
                    </div>
                  </div>
                </div>

                <div className={styles.graphsRow}>
                  <div className={styles.graphCard}>
                    <p>Confirmed Reservations</p>
                    <h3>{summary.confirmed_count || 0}</h3>
                    <div className={styles.miniGraph}>
                      <FaChartLine />
                    </div>
                    <button className={styles.downloadBtn} onClick={() => setShowModal('generate')}>
                      <FaDownload /> Download
                    </button>
                  </div>

                  <div className={styles.graphCard}>
                    <p>Revenue Over Time</p>
                    <h3>{money(summary.total_revenue)}</h3>
                    <div className={styles.barGraphPlaceholder}></div>
                    <button className={styles.downloadBtn} onClick={() => setShowModal('generate')}>
                      <FaDownload /> Download
                    </button>
                  </div>
                </div>
              </section>

              <section className={styles.tableSection}>
                <div className={styles.tableHeader}>
                  <h3>Generated Reports</h3>

                  <button className={styles.printReportBtn} onClick={() => setShowModal('print')}>
                    <FaPlus /> Print Report
                  </button>
                </div>

                <div className={styles.tableWrapper}>
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
                      {rows.length > 0 ? (
                        rows.map((report, idx) => (
                          <tr key={report.id || idx}>
                            <td>{report.reservation_id || `REP-${String(idx + 1).padStart(4, '0')}`}</td>
                            <td>{report.facility_type || report.facility_name || 'Reservations'}</td>
                            <td>{formatDate(report.created_at)}</td>
                            <td>{role === 'admin' ? 'Admin' : 'Staff'}</td>
                            <td>
                              <div className={styles.actionContainer}>
                                <button className={styles.viewLink} onClick={() => setShowModal('print')}>
                                  View
                                </button>

                                <button className={styles.downloadLink} onClick={() => setShowModal('generate')}>
                                  Download
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5">{loading ? 'Loading report data...' : 'No records found.'}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <aside className={styles.reportFilters}>
              <h4>Report Type</h4>
              <select
                className={styles.sidebarSelect}
                value={filters.reportType}
                onChange={(e) => setFilters({ ...filters, reportType: e.target.value })}
              >
                {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <h4>Facility Type</h4>
              <select
                className={styles.sidebarSelect}
                value={filters.facilityType}
                onChange={(e) => setFilters({ ...filters, facilityType: e.target.value })}
              >
                {FACILITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type === 'All' ? 'All Facilities' : type}
                  </option>
                ))}
              </select>

              <h4>Date Range</h4>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />

              <button className={styles.generateMainBtn} onClick={() => setShowModal('generate')}>
                Generate Report
              </button>
            </aside>
          </div>
        </main>

        {showModal === 'print' && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: '520px' }}>
              <div className={styles.modalHeader}>
                <h3>Print Report</h3>
                <button className={styles.modalClose} onClick={closeModal}>
                  x
                </button>
              </div>

              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>Reservation ID</th>
                    <th>Report Type</th>
                    <th>Date Generated</th>
                    <th>Generated By</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 4).map((r, i) => (
                    <tr key={r.id || i}>
                      <td>{r.reservation_id}</td>
                      <td>{REPORT_TYPE_LABELS[filters.reportType]}</td>
                      <td>{formatDate(r.created_at)}</td>
                      <td>{role === 'admin' ? 'Admin' : 'Staff'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.modalFooter}>
                <button className={styles.cancelBtn} onClick={closeModal}>
                  Cancel
                </button>

                <button className={styles.generateBtn} onClick={handlePrint}>
                  Print Report
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal === 'generate' && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.modal} ${styles.reportPreviewModal}`}>
              <div className={styles.modalHeader}>
                <h3>Report Preview</h3>
                <button className={styles.modalClose} onClick={closeModal}>
                  x
                </button>
              </div>

              <div className={styles.reportPreviewPaper}>
                <div className={styles.previewHeader}>
                  <img src={logo} alt="Infinity Garden Resort Logo" />
                  <div>
                    <h2>Infinity Garden Resort {REPORT_TYPE_LABELS[filters.reportType]} Report</h2>
                    <p>Infinity Garden Resort Reservation Management System</p>
                    <p>
                      Generated by: {role === 'admin' ? 'Admin' : 'Staff'} | Date range:{' '}
                      {formatDate(filters.startDate)} to {formatDate(filters.endDate)}
                    </p>
                    <p>Facility type: {filters.facilityType === 'All' ? 'All Facilities' : filters.facilityType}</p>
                  </div>
                </div>

                <div className={styles.previewStats}>
                  <div>
                    <span>Total Reservations</span>
                    <strong>{summary.total_reservations || 0}</strong>
                  </div>
                  <div>
                    <span>Total Guests</span>
                    <strong>{summary.total_guests || 0}</strong>
                  </div>
                  <div>
                    <span>Total Revenue</span>
                    <strong>{money(summary.total_revenue)}</strong>
                  </div>
                  <div>
                    <span>Confirmed</span>
                    <strong>{summary.confirmed_count || 0}</strong>
                  </div>
                </div>

                <div className={styles.previewTableWrap}>
                  <table className={styles.previewTable}>
                    <thead>
                      <tr>
                        <th>Reservation ID</th>
                        <th>Type</th>
                        <th>Facility</th>
                        <th>Guest</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Guests</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length > 0 ? (
                        rows.map((report, index) => (
                          <tr key={report.id || index}>
                            <td>{report.reservation_id || `REP-${String(index + 1).padStart(4, '0')}`}</td>
                            <td>{report.facility_type || 'N/A'}</td>
                            <td>{report.facility_name || 'N/A'}</td>
                            <td>{report.guest_full_name || `${report.first_name || ''} ${report.last_name || ''}`.trim()}</td>
                            <td>{formatDate(report.check_in)}</td>
                            <td>{formatDate(report.check_out)}</td>
                            <td>{report.num_guests || 0}</td>
                            <td>{money(report.total_amount)}</td>
                            <td>{report.status || 'N/A'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9">No records found for the selected filters.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button className={styles.cancelBtn} onClick={closeModal}>
                  Cancel
                </button>

                <button className={styles.cancelBtn} onClick={handlePrint}>
                  Print
                </button>

                <button className={styles.generateBtn} onClick={handleDownloadReport}>
                  Download Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
