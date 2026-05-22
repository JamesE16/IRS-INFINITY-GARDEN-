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
  FaFilter,
  FaPrint,
} from 'react-icons/fa';

const REPORT_TYPE_LABELS = {
  reservations: 'Reservations',
  payments: 'Payments',
  facilities: 'Facilities',
  guests: 'Guests',
};

const FACILITY_TYPES = ['All', 'Room', 'Cottage', 'Gazebo', 'Pavilion'];
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

const formatDateTime = (value = new Date()) =>
  new Date(value).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const getStatusClass = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('confirm') || normalized.includes('paid') || normalized.includes('approved')) {
    return 'status-good';
  }
  if (normalized.includes('pending')) return 'status-waiting';
  if (normalized.includes('cancel') || normalized.includes('reject')) return 'status-bad';
  return 'status-neutral';
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
  const generatedAt = formatDateTime();
  const reportTitle = `Infinity Garden Resort ${REPORT_TYPE_LABELS[filters.reportType]} Report`;
  const generatedBy = role === 'admin' ? 'Admin' : 'Staff';
  const facilityLabel = filters.facilityType === 'All' ? 'All Facilities' : filters.facilityType;

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
              <td><span class="status ${getStatusClass(report.status)}">${escapeHtml(report.status || 'N/A')}</span></td>
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
      padding: 32px;
      color: #172033;
      font-family: Arial, Helvetica, sans-serif;
      background: #eef3f9;
    }
    .page {
      max-width: 1160px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #d8e2f0;
      box-shadow: 0 18px 50px rgba(23, 32, 51, 0.08);
    }
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      gap: 24px;
      padding: 30px 34px 24px;
      border-top: 7px solid #1a3c8f;
      border-bottom: 1px solid #dbe4f0;
    }
    .brand { display: flex; align-items: center; gap: 16px; }
    .logo {
      width: 72px;
      height: 72px;
      object-fit: contain;
    }
    .document-label {
      color: #64748b;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      margin: 0 0 7px;
      text-transform: uppercase;
    }
    h1 {
      margin: 0 0 6px;
      color: #1a3c8f;
      font-size: 25px;
      letter-spacing: 0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0;
      margin: 0;
      border-bottom: 1px solid #dbe4f0;
    }
    .info {
      border-right: 1px solid #dbe4f0;
      padding: 16px 20px;
    }
    .info:last-child { border-right: 0; }
    .info span {
      color: #64748b;
      display: block;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .info strong {
      color: #172033;
      display: block;
      font-size: 13px;
      line-height: 1.35;
    }
    .content { padding: 24px 34px 32px; }
    .meta {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 0 0 24px;
    }
    .metric {
      border: 1px solid #dbe4f0;
      background: #f8fafc;
      padding: 15px;
      border-radius: 4px;
    }
    .metric span {
      display: block;
      color: #667085;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 9px;
      text-transform: uppercase;
    }
    .metric strong {
      display: block;
      color: #172033;
      font-size: 21px;
    }
    .section-title {
      align-items: center;
      display: flex;
      justify-content: space-between;
      gap: 14px;
      margin: 4px 0 12px;
    }
    .section-title h2 {
      color: #172033;
      font-size: 16px;
      margin: 0;
    }
    .section-title span {
      color: #64748b;
      font-size: 12px;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      table-layout: fixed;
    }
    th {
      background: #eff4fb;
      color: #1a3c8f;
      font-size: 11px;
      letter-spacing: 0.04em;
      text-align: left;
      padding: 11px 10px;
      text-transform: uppercase;
      border-bottom: 2px solid #1a3c8f;
      overflow-wrap: anywhere;
      white-space: normal;
    }
    td {
      padding: 11px 10px;
      border-bottom: 1px solid #dbe4f0;
      vertical-align: top;
      overflow-wrap: anywhere;
      white-space: normal;
    }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .status {
      border-radius: 999px;
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      padding: 4px 8px;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .status-good { background: #dcfce7; color: #166534; }
    .status-waiting { background: #fef3c7; color: #92400e; }
    .status-bad { background: #fee2e2; color: #991b1b; }
    .status-neutral { background: #e2e8f0; color: #334155; }
    .empty {
      text-align: center;
      color: #667085;
      padding: 22px;
    }
    .signature {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-top: 30px;
    }
    .signature div {
      border-top: 1px solid #94a3b8;
      color: #64748b;
      font-size: 12px;
      padding-top: 8px;
    }
    @media print {
      @page { margin: 0.5in; size: A4 landscape; }
      body { background: #fff; padding: 0; }
      .page { border: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="header">
      <div class="brand">
        <img class="logo" src="${logoDataUrl}" alt="Infinity Garden Resort Logo" />
        <div>
          <p class="document-label">Official Management Report</p>
          <h1>${escapeHtml(reportTitle)}</h1>
        </div>
      </div>
    </header>

    <section class="info-grid">
      <div class="info"><span>Generated By</span><strong>${escapeHtml(generatedBy)}</strong></div>
      <div class="info"><span>Generated On</span><strong>${escapeHtml(generatedAt)}</strong></div>
      <div class="info"><span>Date Range</span><strong>${escapeHtml(formatDate(filters.startDate))} to ${escapeHtml(formatDate(filters.endDate))}</strong></div>
      <div class="info"><span>Facility Type</span><strong>${escapeHtml(facilityLabel)}</strong></div>
    </section>

    <div class="content">
      <section class="meta">
        <div class="metric"><span>Total Reservations</span><strong>${escapeHtml(summary.total_reservations || 0)}</strong></div>
        <div class="metric"><span>Total Guests</span><strong>${escapeHtml(summary.total_guests || 0)}</strong></div>
        <div class="metric"><span>Total Revenue</span><strong>${escapeHtml(money(summary.total_revenue))}</strong></div>
        <div class="metric"><span>Confirmed</span><strong>${escapeHtml(summary.confirmed_count || 0)}</strong></div>
      </section>

      <div class="section-title">
        <h2>Reservation Details</h2>
        <span>${escapeHtml(rows.length)} record${rows.length === 1 ? '' : 's'}</span>
      </div>

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

      <section class="signature">
        <div>Prepared by ${escapeHtml(generatedBy)}</div>
        <div>Reviewed / Approved by</div>
      </section>
    </div>

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
  const [activeTrendIndex, setActiveTrendIndex] = useState(2);
  const [activeRevenueIndex, setActiveRevenueIndex] = useState(2);

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
  const generatedAtLabel = useMemo(() => formatDateTime(), [showModal]);

  const facilityRankings = useMemo(
    () =>
      [...(reportData.facility_breakdown || [])].sort(
        (a, b) => (b.total_reservations || 0) - (a.total_reservations || 0)
      ),
    [reportData.facility_breakdown]
  );

  const confirmedRate = summary.total_reservations
    ? Math.round(((summary.confirmed_count || 0) / summary.total_reservations) * 100)
    : 0;

  const reservationTrend = useMemo(() => {
    const counts = WEEKDAY_LABELS.map((day) => ({ day, count: 0 }));

    rows.forEach((reservation) => {
      const sourceDate = reservation.check_in || reservation.created_at;
      const date = sourceDate ? new Date(sourceDate) : null;
      if (!date || Number.isNaN(date.getTime())) return;

      const dayIndex = (date.getDay() + 6) % 7;
      counts[dayIndex].count += 1;
    });

    const maxCount = Math.max(...counts.map((item) => item.count), 1);

    return counts.map((item, index) => {
      const percent = item.count ? Math.max(Math.round((item.count / maxCount) * 92), 18) : 0;
      const x = 46 + index * 102;
      const y = 170 - (percent / 100) * 126;

      return { ...item, percent, x, y };
    });
  }, [rows]);

  const revenueTrend = useMemo(() => {
    const totals = WEEKDAY_LABELS.map((day) => ({ day, amount: 0 }));

    rows.forEach((reservation) => {
      const sourceDate = reservation.check_in || reservation.created_at;
      const date = sourceDate ? new Date(sourceDate) : null;
      if (!date || Number.isNaN(date.getTime())) return;

      const dayIndex = (date.getDay() + 6) % 7;
      totals[dayIndex].amount += Number(reservation.total_amount || 0);
    });

    const maxAmount = Math.max(...totals.map((item) => item.amount), 1);

    return totals.map((item, index) => {
      const percent = item.amount ? Math.max(Math.round((item.amount / maxAmount) * 90), 16) : 0;
      const x = 28 + index * 77;
      const y = 126 - (percent / 100) * 96;

      return { ...item, percent, x, y };
    });
  }, [rows]);

  const chartPath = reservationTrend.reduce((path, point, index, points) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, '');
  const revenueChartPath = revenueTrend.reduce((path, point, index, points) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, '');
  const revenueAreaPath = `${revenueChartPath} L ${revenueTrend[revenueTrend.length - 1]?.x || 520} 142 L ${revenueTrend[0]?.x || 0} 142 Z`;
  const activeTrendPoint = reservationTrend[activeTrendIndex] || reservationTrend[2];
  const activeRevenuePoint = revenueTrend[activeRevenueIndex] || revenueTrend[2];
  const trendTooltipLeft = (activeTrendPoint.x / 700) * 100;
  const revenueTooltipLeft = (activeRevenuePoint.x / 520) * 100;

  const closeModal = () => {
    setShowModal(null);
  };

  const openReportPrintWindow = async () => {
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
    window.setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownloadReport = async () => {
    setError('');

    try {
      await openReportPrintWindow();
    } catch (err) {
      setError(err.message || 'Failed to open the report for PDF download.');
    }
  };

  const handlePrint = async () => {
    setError('');

    try {
      await openReportPrintWindow();
    } catch (err) {
      setError(err.message || 'Failed to open the report for printing.');
    }
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
                  : 'Infinity Garden Resort Management System - Staff View'}
              </p>
            </div>
          </div>
        </div>

        <main className={styles.container}>
          <div className={styles.reportLayout}>
            <section className={styles.reportFilters}>
              <div className={styles.filterHeader} />

              <div className={styles.filterGrid}>
                <label className={styles.filterField}>
                  <span>Report Type</span>
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
                </label>

                <label className={styles.filterField}>
                  <span>Facility Type</span>
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
                </label>

                <div className={`${styles.filterField} ${styles.dateFilterField}`}>
                  <span>Date Range</span>
                  <div className={styles.dateRangeFields}>
                    <input
                      aria-label="Start date"
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    />
                    <input
                      aria-label="End date"
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.filterActions}>
                  <button className={styles.generateMainBtn} onClick={() => setShowModal('generate')}>
                    <FaDownload /> Generate Report
                  </button>
                  <button className={styles.printReportBtn} onClick={() => setShowModal('print')}>
                    <FaPrint /> Print
                  </button>
                </div>
              </div>
            </section>

            <div className={styles.analyticsColumn}>
              {error && <div className={styles.reportAlert}>{error}</div>}

              <section className={styles.quickReportDashboard}>
                <div className={styles.dashboardHeader}>
                  <div>
                    <span className={styles.dashboardEyebrow}>Report Overview</span>
                  </div>
                  <span className={styles.dashboardMeta}>
                    {formatDate(filters.startDate)} - {formatDate(filters.endDate)}
                  </span>
                </div>

                <div className={styles.statCardsRow}>
                  <div className={styles.smallStatCard}>
                    <div className={styles.statLabelRow}>
                      <p>Total Reservations</p>
                      <span className={styles.metricIcon}>
                        <FaCalendarAlt />
                      </span>
                    </div>
                    <div className={styles.statMain}>
                      <strong>{summary.total_reservations || 0}</strong>
                    </div>
                    <span className={styles.trendPos}>
                      {loading ? 'Loading database records...' : `${rows.length} matching records`}
                    </span>
                  </div>

                  <div className={styles.smallStatCard}>
                    <div className={styles.statLabelRow}>
                      <p>Total Guests</p>
                      <span className={styles.metricIcon}>
                        <FaUsers />
                      </span>
                    </div>
                    <div className={styles.statMain}>
                      <strong>{summary.total_guests || 0}</strong>
                    </div>
                    <span className={styles.statNote}>Across selected reservations</span>
                  </div>

                  <div className={styles.smallStatCard}>
                    <div className={styles.statLabelRow}>
                      <p>Facility Type Ranking</p>
                      <span className={styles.metricIcon}>
                        <FaChartPie />
                      </span>
                    </div>
                    <div className={styles.facilityRankingList}>
                      {facilityRankings.length > 0 ? (
                        facilityRankings.map((facility, index) => (
                          <div className={styles.facilityRankItem} key={facility.facility_type || index}>
                            <span>
                              {index + 1}. {facility.facility_type || 'Uncategorized'}
                            </span>
                            <strong>{facility.total_reservations || 0}</strong>
                          </div>
                        ))
                      ) : (
                        <span className={styles.statNote}>No facility records found</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.graphsRow}>
                  <div className={styles.graphCard}>
                    <div className={styles.graphCardHeader}>
                      <div>
                        <p>Confirmed Reservations</p>
                        <h3>{summary.confirmed_count || 0}</h3>
                        <span className={styles.statNote}>{confirmedRate}% of selected reservations</span>
                      </div>
                      <FaChartLine />
                    </div>

                    <div className={styles.miniLineChartWrap}>
                      <svg className={styles.lineChart} viewBox="0 0 700 220" role="img" aria-label="Weekly occupancy line chart">
                        <line className={styles.chartGridLine} x1="20" y1="36" x2="684" y2="36" />
                        <line className={styles.chartGridLine} x1="20" y1="82" x2="684" y2="82" />
                        <line className={styles.chartGridLine} x1="20" y1="128" x2="684" y2="128" />
                        <line className={styles.chartGridLine} x1="20" y1="174" x2="684" y2="174" />
                        <line
                          className={styles.chartGuideLine}
                          x1={activeTrendPoint.x}
                          y1="18"
                          x2={activeTrendPoint.x}
                          y2="198"
                        />
                        <path className={styles.chartLine} d={chartPath} />
                        {reservationTrend.map((point, index) => (
                          <circle
                            aria-label={`${point.day}: ${point.count} reservations`}
                            className={index === activeTrendIndex ? styles.chartPointActive : styles.chartPoint}
                            cx={point.x}
                            cy={point.y}
                            key={point.day}
                            onClick={() => setActiveTrendIndex(index)}
                            onFocus={() => setActiveTrendIndex(index)}
                            onMouseEnter={() => setActiveTrendIndex(index)}
                            r={index === activeTrendIndex ? 6 : 5}
                            role="button"
                            tabIndex="0"
                          />
                        ))}
                      </svg>

                      <div
                        className={styles.chartTooltip}
                        data-align={trendTooltipLeft > 72 ? 'left' : 'right'}
                        style={{ left: `${trendTooltipLeft}%`, top: `${Math.max(activeTrendPoint.y - 4, 24)}px` }}
                      >
                        <strong>{activeTrendPoint.day}</strong>
                        <span>
                          <i /> {activeTrendPoint.count} reservation{activeTrendPoint.count === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>

                    <button className={styles.downloadBtn} onClick={() => setShowModal('generate')}>
                      <FaDownload /> Download
                    </button>
                  </div>

                  <div className={styles.graphCard}>
                    <div className={styles.graphCardHeader}>
                      <div>
                        <p>Total Revenue</p>
                        <h3>{money(summary.total_revenue)}</h3>
                        <span className={styles.statNote}>Based on selected reservations</span>
                      </div>
                      <FaChartLine />
                    </div>

                    <div className={styles.revenueLinePanel}>
                      <svg className={styles.revenueLineChart} viewBox="0 0 520 150" role="img" aria-label="Revenue trend line chart">
                        <line className={styles.chartGridLine} x1="12" y1="32" x2="508" y2="32" />
                        <line className={styles.chartGridLine} x1="12" y1="78" x2="508" y2="78" />
                        <line className={styles.chartGridLine} x1="12" y1="124" x2="508" y2="124" />
                        <line
                          className={styles.chartGuideLine}
                          x1={activeRevenuePoint.x}
                          y1="18"
                          x2={activeRevenuePoint.x}
                          y2="138"
                        />
                        <path
                          className={styles.chartArea}
                          d={revenueAreaPath}
                        />
                        <path
                          className={styles.chartLine}
                          d={revenueChartPath}
                        />
                        {revenueTrend.map((point, index) => (
                          <circle
                            aria-label={`${point.day}: ${money(point.amount)}`}
                            className={index === activeRevenueIndex ? styles.chartPointActive : styles.chartPoint}
                            cx={point.x}
                            cy={point.y}
                            key={point.day}
                            onClick={() => setActiveRevenueIndex(index)}
                            onFocus={() => setActiveRevenueIndex(index)}
                            onMouseEnter={() => setActiveRevenueIndex(index)}
                            r={index === activeRevenueIndex ? 5.5 : 4.5}
                            role="button"
                            tabIndex="0"
                          />
                        ))}
                      </svg>

                      <div
                        className={styles.chartTooltip}
                        data-align={revenueTooltipLeft > 72 ? 'left' : 'right'}
                        style={{
                          left: `${revenueTooltipLeft}%`,
                          top: `${Math.max(activeRevenuePoint.y + 8, 24)}px`,
                        }}
                      >
                        <strong>{activeRevenuePoint.day}</strong>
                        <span>
                          <i /> {money(activeRevenuePoint.amount)}
                        </span>
                      </div>
                    </div>

                    <button className={styles.downloadBtn} onClick={() => setShowModal('generate')}>
                      <FaDownload /> Download
                    </button>
                  </div>
                </div>
              </section>

            </div>
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

              <div className={styles.reportTableWrap}>
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
              </div>

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
                  <div className={styles.previewBrand}>
                    <img src={logo} alt="Infinity Garden Resort Logo" />
                    <div>
                      <span>Official Management Report</span>
                      <h2>Infinity Garden Resort {REPORT_TYPE_LABELS[filters.reportType]} Report</h2>
                    </div>
                  </div>
                </div>

                <div className={styles.previewInfoGrid}>
                  <div>
                    <span>Generated By</span>
                    <strong>{role === 'admin' ? 'Admin' : 'Staff'}</strong>
                  </div>
                  <div>
                    <span>Generated On</span>
                    <strong>{generatedAtLabel}</strong>
                  </div>
                  <div>
                    <span>Date Range</span>
                    <strong>
                      {formatDate(filters.startDate)} to {formatDate(filters.endDate)}
                    </strong>
                  </div>
                  <div>
                    <span>Facility Type</span>
                    <strong>{filters.facilityType === 'All' ? 'All Facilities' : filters.facilityType}</strong>
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

                <div className={styles.previewSectionTitle}>
                  <h4>Reservation Details</h4>
                  <span>
                    {rows.length} record{rows.length === 1 ? '' : 's'}
                  </span>
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
                            <td>
                              <span className={`${styles.previewStatus} ${styles[getStatusClass(report.status)]}`}>
                                {report.status || 'N/A'}
                              </span>
                            </td>
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

                <div className={styles.previewSignature}>
                  <div>Prepared by {role === 'admin' ? 'Admin' : 'Staff'}</div>
                  <div>Reviewed / Approved by</div>
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
