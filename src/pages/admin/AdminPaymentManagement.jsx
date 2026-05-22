import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import styles from '../../styles/AdminPayments.module.css';
import { adminAPI } from '../../utils/api';

import resortLogo from '../../assets/logo.png';

import {
  FaCheckCircle,
  FaClock,
  FaCreditCard,
  FaEye,
  FaMoneyBillWave,
  FaPrint,
  FaTimesCircle } from
'react-icons/fa';



const shortenId = (value) => {
  const text = String(value ?? '');
  if (!text) return 'N/A';
  if (text.length <= 14) return text;
  return `${text.slice(0, 8)}...${text.slice(-4)}`;
};

const formatPaymentMethod = (value, fallbackLabel = '') => {
  if (fallbackLabel) return fallbackLabel;
  if (!value) return 'N/A';
  return value.
  split('_').
  map((part) => part.charAt(0).toUpperCase() + part.slice(1)).
  join(' ');
};

const normalizeTransaction = (payment) => ({
  id: payment.id,
  transaction_id: payment.reference_number || `TXN-${payment.id}`,
  transaction_id_short: shortenId(payment.reference_number || `TXN-${payment.id}`),
  guest_name: payment.guest_name || 'Guest',
  amount: Number(payment.amount || 0),
  status: payment.verification_status || 'pending',
  date: payment.paid_at || payment.created_at,
  payment_method: formatPaymentMethod(
    payment.payment_method,
    payment.payment_method_display
  ),
  proof_of_payment: payment.proof_of_payment || '',
  reservation_id: payment.reservation_reservation_id || '',
  reservation_id_short: shortenId(payment.reservation_reservation_id || '')
});

const normalizeStatus = (status) => {
  const value = (status ?? '').toLowerCase();
  if (value === 'paid' || value === 'verified') return 'paid';
  if (value === 'pending') return 'pending';
  if (value === 'failed' || value === 'declined' || value === 'rejected') return 'declined';
  return 'unknown';
};


const generateReceiptHTML = (transaction) => {
  const now = new Date();
  const topBarTime = now.toLocaleString('en-US', {
    month: 'numeric', day: 'numeric', year: '2-digit',
    hour: 'numeric', minute: '2-digit', hour12: true
  });

  const generatedOnTime = now.toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  });

  const transactionDate = transaction.date ?
  new Date(transaction.date).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  }) :
  'N/A';

  const status = normalizeStatus(transaction.status);
  const amount = Number(transaction.amount || 0).toLocaleString();

  const statusColor =
  status === 'paid' ? '#166534' : status === 'pending' ? '#92400e' : '#991b1b';
  const statusBg =
  status === 'paid' ? '#dcfce7' : status === 'pending' ? '#fef9c3' : '#fee2e2';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Payment Receipt – ${transaction.transaction_id_short}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      background: #f4f4f5; 
      color: #1a1a1a;
      font-family: 'Segoe UI', Arial, sans-serif;
    }

    body {
      padding: 20px;
    }

    @page {
      size: auto;
      margin: 0; 
    }

    .receipt-container {
      background: #fff;
      width: 100%;
      max-width: 850px;
      margin: 0 auto;
      padding-bottom: 45px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }

    .receipt-content {
      padding: 30px 45px 0 45px;
    }

    /* Top layout browser info bar */
    .print-topbar {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
      padding-bottom: 8px;
      margin-bottom: 25px;
      border-bottom: 1px solid #e2e8f0;
    }

    /* Brand Section Layout */
    .brand-section {
      display: flex;
      align-items: center; 
      gap: 20px;
      margin-bottom: 15px;
    }

    .brand-logo {
      flex-shrink: 0;
      width: 125px;
      height: auto;
      display: block;
      object-fit: contain;
    }

    .brand-text {
      flex-grow: 1;
    }

    .brand-tagline {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #475569;
      letter-spacing: 0.08em;
      margin-bottom: 4px;
    }

    /* Side-by-side layout title container */
    .title-row-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      gap: 20px;
      margin-bottom: 4px;
    }

    .title-row-container h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1a3c8f;
      letter-spacing: -0.2px;
      line-height: 1.15;
    }

    .receipt-title-label {
      border: 1px solid #cbd5e1;
      padding: 10px 18px;
      font-size: 13px;
      font-weight: 700;
      color: #1a3c8f;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-radius: 4px;
      white-space: nowrap;
      background-color: #fff;
    }

    .system-meta {
      font-size: 13px;
      color: #475569;
      line-height: 1.5;
      margin-bottom: 15px;
    }

    /* Thick deep solid navy line now placed exactly below system-meta */
    .divider-line {
      border-top: 4px solid #1a3c8f;
      margin-bottom: 25px;
      width: 100%;
    }

    .section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .05em;
      color: #1a3c8f;
      margin-bottom: 12px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    tr { 
      border-bottom: 1px solid #e2e8f4; 
    }

    tr:last-child {
      border-bottom: 2px solid #1a3c8f; 
    }

    td {
      padding: 12px 8px;
      font-size: 13px;
      vertical-align: middle;
    }

    td:first-child {
      color: #4a5568;
      width: 35%;
      font-weight: 500;
    }

    td:last-child {
      color: #0f172a;
      font-weight: 600;
      text-align: left;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: capitalize;
      background: ${statusBg};
      color: ${statusColor};
    }

    .amount-row td:last-child {
      font-size: 15px;
      color: #1a3c8f;
      font-weight: 800;
    }

    .footer {
      margin-top: 20px;
      font-size: 13.5px; 
      font-weight: 500;
      color: #334155;
      text-align: center;
      line-height: 1.6;
    }

    @media print {
      body { padding: 0; background: #fff; }
      .receipt-container { box-shadow: none; max-width: 100%; padding-bottom: 0; }
    }
  </style>
</head>
<body>

  <div class="receipt-container">
    <div class="receipt-content">
      <div class="print-topbar">
        <span>${topBarTime}</span>
        <span>Infinity Garden Resort – Official Payment Receipt</span>
      </div>

      <div class="brand-section">
        <img src="${resortLogo}" alt="Infinity Garden Resort" class="brand-logo" />
        <div class="brand-text">
          <div class="brand-tagline">Official Management Receipt</div>
          
          <div class="title-row-container">
            <h1>Infinity Garden Resort Official Payment Receipt</h1>
            <div class="receipt-title-label">Payment Receipt</div>
          </div>
          
          <div class="system-meta">Infinity Garden Resort Hotel and Pavilion Reservation System</div>
        </div>
      </div>

      <div class="divider-line"></div>

      <div class="section-title">Transaction Details</div>
      <table>
        <tr>
          <td>Transaction ID</td>
          <td>${transaction.transaction_id}</td>
        </tr>
        <tr>
          <td>Reservation ID</td>
          <td>${transaction.reservation_id || 'N/A'}</td>
        </tr>
        <tr>
          <td>Guest Name</td>
          <td>${transaction.guest_name}</td>
        </tr>
        <tr>
          <td>Payment Method</td>
          <td>${transaction.payment_method}</td>
        </tr>
        <tr>
          <td>Payment Status</td>
          <td><span class="badge">${status}</span></td>
        </tr>
        <tr>
          <td>Date &amp; Time</td>
          <td>${transactionDate}</td>
        </tr>
        <tr class="amount-row">
          <td>Amount Paid</td>
          <td>PHP ${amount}</td>
        </tr>
      </table>

      <div class="footer">
        Thank you for choosing Infinity Garden Resort &amp; Pavilion.<br/>
        Please keep this receipt for your records. For concerns, contact our front desk.
      </div>
    </div>
  </div>

</body>
</html>`;
};



const printReceiptAsPDF = (transaction) => {
  const printWindow = window.open('', '_blank', 'width=850,height=1100');

  if (!printWindow) {
    alert('Pop-up blocked! Please allow pop-ups for this site in your browser settings.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(generateReceiptHTML(transaction));
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };

  setTimeout(() => {
    if (!printWindow.closed) {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    }
  }, 500);
};



const StatCard = ({ icon, label, value, iconBg, iconColor }) =>
<div className={styles.statCard}>
    <div className={styles.statIcon} style={{ background: iconBg }}>
      {React.cloneElement(icon, { color: iconColor })}
    </div>
    <div className={styles.statContent}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
    </div>
  </div>;


const StatusBadge = ({ status }) => {
  const normalized = normalizeStatus(status);
  const classMap = {
    paid: styles.statusPaid,
    pending: styles.statusPending,
    declined: styles.statusDeclined,
    unknown: styles.statusDeclined
  };
  return (
    <span className={`${styles.status} ${classMap[normalized] ?? ''}`}>
      {normalized}
    </span>);

};



const TransactionModal = ({ transaction, onClose }) => {
  const status = normalizeStatus(transaction.status);
  const isVerified = status === 'paid';

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const rows = [
  {
    label: 'Transaction ID',
    value: transaction.transaction_id_short,
    title: transaction.transaction_id
  },
  {
    label: 'Reservation ID',
    value: transaction.reservation_id_short || 'N/A',
    title: transaction.reservation_id
  },
  { label: 'Guest', value: transaction.guest_name },
  { label: 'Amount', value: `PHP ${Number(transaction.amount || 0).toLocaleString()}` },
  { label: 'Payment Method', value: transaction.payment_method },
  { label: 'Status', value: <StatusBadge status={transaction.status} /> },
  {
    label: 'Date',
    value: transaction.date ?
    new Date(transaction.date).toLocaleString() :
    'N/A'
  }];


  return (
    <div
      className={styles.modalOverlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title">
      
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 id="modal-title">Transaction Details</h3>
          <button
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Close modal">
            
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {rows.map(({ label, value, title }) =>
          <div className={styles.modalRow} key={label}>
              <span>{label}</span>
              <strong title={title}>{value}</strong>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.closeBtn} onClick={onClose}>
            Close
          </button>
          <button
            className={`${styles.printBtn} ${!isVerified ? styles.disabledBtn : ''}`}
            onClick={() => isVerified && printReceiptAsPDF(transaction)}
            disabled={!isVerified}
            title={
            !isVerified ?
            'Receipt only available for verified payments' :
            'Print / Save as PDF'
            }>
            
            <FaPrint />
            {isVerified ? 'Print Receipt' : 'Not Yet Verified'}
          </button>
        </div>
      </div>
    </div>);

};


const FILTER_OPTIONS = [
{ key: 'all', label: 'All' },
{ key: 'paid', label: 'Verified' },
{ key: 'pending', label: 'Pending' },
{ key: 'declined', label: 'Declined' }];


const AdminPaymentManagement = ({ role = 'admin' }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const isAdmin = role === 'admin';

  useEffect(() => {
    let cancelled = false;

    const loadPayments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await adminAPI.getPayments();
        const list = Array.isArray(data) ? data : data.results ?? [];
        if (!cancelled) {
          setTransactions(list.map(normalizeTransaction));
        }
      } catch (err) {
        console.error('[AdminPaymentManagement] Failed to load payments:', err);
        if (!cancelled) setError('Unable to load payments. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadPayments();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(
    () =>
    transactions.reduce(
      (acc, t) => {
        const s = normalizeStatus(t.status);
        return {
          total: acc.total + 1,
          paid: acc.paid + (s === 'paid' ? 1 : 0),
          pending: acc.pending + (s === 'pending' ? 1 : 0),
          failed: acc.failed + (s === 'declined' ? 1 : 0),
          totalAmount: acc.totalAmount + (Number(t.amount) || 0)
        };
      },
      { total: 0, paid: 0, pending: 0, failed: 0, totalAmount: 0 }
    ),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter((t) => normalizeStatus(t.status) === filter);
  }, [transactions, filter]);

  const filterCount = useCallback(
    (key) => {
      if (key === 'all') return stats.total;
      if (key === 'paid') return stats.paid;
      if (key === 'pending') return stats.pending;
      if (key === 'declined') return stats.failed;
      return 0;
    },
    [stats]
  );

  const handleView = useCallback((transaction) => {
    setSelectedTransaction(transaction);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedTransaction(null);
  }, []);

  return (
    <div className={styles.adminShell}>
      <Sidebar role={role} />

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.title}>
              <h1>Payment Management</h1>
              <p>
                {isAdmin ?
                'Infinity Garden Resort Reservation Management System' :
                'Infinity Garden Resort – Staff View'}
              </p>
            </div>
          </div>
        </div>

        <main className={styles.container}>
          <div className={styles.statsGrid}>
            <StatCard
              icon={<FaCreditCard />}
              label="Total Transactions"
              value={stats.total}
              iconBg="#dcfce7"
              iconColor="#10b981" />
            
            <StatCard
              icon={<FaCheckCircle />}
              label="Verified Payments"
              value={stats.paid}
              iconBg="#d1fae5"
              iconColor="#059669" />
            
            <StatCard
              icon={<FaClock />}
              label="Pending"
              value={stats.pending}
              iconBg="#fef3c7"
              iconColor="#d97706" />
            
            <StatCard
              icon={<FaMoneyBillWave />}
              label="Total Amount"
              value={`PHP ${stats.totalAmount.toLocaleString()}`}
              iconBg="#ede9fe"
              iconColor="#7c3aed" />
            
          </div>

          <div className={styles.filterTabs}>
            {FILTER_OPTIONS.map(({ key, label }) =>
            <button
              key={key}
              className={`${styles.tab} ${filter === key ? styles.active : ''}`}
              onClick={() => setFilter(key)}>
              
                {label} ({filterCount(key)})
              </button>
            )}
          </div>

          {error &&
          <div className={styles.errorBanner} role="alert">
              <FaTimesCircle />
              <p>{error}</p>
            </div>
          }

          {isLoading ?
          <div className={styles.emptyState}>
              <h3>Loading transactions…</h3>
            </div> :
          filteredTransactions.length === 0 ?
          <div className={styles.emptyState}>
              <h3>No transactions found</h3>
              <p>Try a different filter or check back later.</p>
            </div> :

          <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Guest</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) =>
                <tr key={transaction.id}>
                      <td title={transaction.transaction_id}>
                        {transaction.transaction_id_short}
                      </td>
                      <td>{transaction.guest_name}</td>
                      <td>PHP {Number(transaction.amount || 0).toLocaleString()}</td>
                      <td>
                        <StatusBadge status={transaction.status} />
                      </td>
                      <td>
                        {transaction.date ?
                    new Date(transaction.date).toLocaleDateString() :
                    'N/A'}
                      </td>
                      <td>
                        <button
                      className={styles.viewBtn}
                      onClick={() => handleView(transaction)}
                      aria-label={`View details for ${transaction.guest_name}`}>
                      
                          <FaEye /> View
                        </button>
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
          }
        </main>
      </div>

      {selectedTransaction &&
      <TransactionModal
        transaction={selectedTransaction}
        onClose={handleCloseModal} />

      }
    </div>);

};

export default AdminPaymentManagement;