import React, { useState, useEffect, useMemo, useRef } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import styles from '../../styles/AdminPayments.module.css';
import { paymentAPI } from '../../utils/api';

const AdminPaymentManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  // =========================
  // NORMALIZE STATUS (IMPORTANT FIX)
  // =========================
  const normalizeStatus = (status) => {
    const s = (status || '').toLowerCase();

    if (s === 'paid' || s === 'verified') return 'paid';
    if (s === 'pending') return 'pending';
    if (s === 'failed' || s === 'declined') return 'failed';

    return 'unknown';
  };

  // =========================
  // FETCH TRANSACTIONS (REALTIME POLLING)
  // =========================
  useEffect(() => {
    mountedRef.current = true;

    const fetchTransactions = async (silent = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (!silent) setIsLoading(true);

      try {
        const data = await paymentAPI.getAllTransactions();

        if (mountedRef.current) {
          setTransactions(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError('Failed to load transactions.');
        }
      } finally {
        isFetchingRef.current = false;
        if (!silent && mountedRef.current) setIsLoading(false);
      }
    };

    // initial load
    fetchTransactions(false);

    // polling (safe realtime simulation)
    const interval = setInterval(() => {
      fetchTransactions(true);
    }, 5000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  // =========================
  // FILTERED TRANSACTIONS
  // =========================
  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;

    return transactions.filter(
      (t) => normalizeStatus(t.status) === filter
    );
  }, [transactions, filter]);

  // =========================
  // STATS (OPTIMIZED)
  // =========================
  const stats = useMemo(() => {
    let paid = 0;
    let pending = 0;
    let failed = 0;
    let totalAmount = 0;

    for (const t of transactions) {
      const status = normalizeStatus(t.status);

      if (status === 'paid') paid++;
      else if (status === 'pending') pending++;
      else if (status === 'failed') failed++;

      totalAmount += parseFloat(t.amount) || 0;
    }

    return {
      total: transactions.length,
      paid,
      pending,
      failed,
      totalAmount
    };
  }, [transactions]);

  // =========================
  // PRINT RECEIPT
  // =========================
  const handlePrintReceipt = (transaction) => {
    const receiptWindow = window.open('', '_blank');

    const safeDate = transaction?.created_at
      ? new Date(transaction.created_at)
      : new Date();

    receiptWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial; padding: 30px; }
            h2 { color: #1a3c8f; }
            .row { margin: 10px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Infinity Garden Resort</h2>
          <p>Payment Receipt</p>
          <hr/>
          <div class="row"><span class="label">Transaction ID:</span> TXN-${transaction.id}</div>
          <div class="row"><span class="label">Guest:</span> ${transaction.guest_name}</div>
          <div class="row"><span class="label">Amount:</span> ₱${transaction.amount}</div>
          <div class="row"><span class="label">Method:</span> ${transaction.payment_method}</div>
          <div class="row"><span class="label">Status:</span> ${transaction.status}</div>
          <div class="row"><span class="label">Date:</span> ${safeDate.toLocaleString()}</div>
          <hr/>
          <p>Thank you for your payment.</p>
        </body>
      </html>
    `);

    receiptWindow.document.close();
    receiptWindow.print();
  };

  return (
    <div className={styles.adminShell}>
      <AdminSidebar activePage="/admin/payment-management" />

      <div className={styles.mainContent}>
        {/* HEADER (UNCHANGED) */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.title}>
              <h1>Payment Management</h1>
              <p>Infinity Garden Resort Reservation Management System</p>
            </div>
          </div>
        </div>

        <main className={styles.container}>

          {/* STATS */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Total Transactions</p>
                <p className={styles.statValue}>{stats.total}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Paid</p>
                <p className={styles.statValue}>{stats.paid}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Pending</p>
                <p className={styles.statValue}>{stats.pending}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Failed</p>
                <p className={styles.statValue}>{stats.failed}</p>
              </div>
            </div>
          </div>

          {/* FILTER */}
          <div className={styles.filterTabs}>
            {['all', 'paid', 'pending', 'failed'].map((status) => (
              <button
                key={status}
                className={`${styles.tab} ${filter === status ? styles.active : ''}`}
                onClick={() => setFilter(status)}
              >
                {status.toUpperCase()}
              </button>
            ))}
          </div>

          {/* ERROR */}
          {error && (
            <div className={styles.errorBanner}>
              <p>{error}</p>
            </div>
          )}

          {/* LOADING */}
          {isLoading ? (
            <div className={styles.emptyState}>
              <h3>Loading transactions...</h3>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No transactions found</h3>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Guest</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map((t, i) => (
                    <tr key={t.id || t.transaction_id || i}>
                      <td>TXN-{t.id}</td>
                      <td>{t.guest_name}</td>
                      <td>₱{t.amount}</td>
                      <td>{normalizeStatus(t.status)}</td>

                      <td>
                        <button
                          className={styles.actionBtn}
                          onClick={() => {
                            setSelectedTransaction(t);
                            setShowModal(true);
                          }}
                        >
                          View
                        </button>

                        <button
                          className={styles.actionBtn}
                          style={{ marginLeft: 8 }}
                          onClick={() => handlePrintReceipt(t)}
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </main>

        {/* MODAL */}
        {showModal && selectedTransaction && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>Transaction Details</h3>
                <button
                  className={styles.modalClose}
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.modalRow}>
                  <span>ID</span>
                  <strong>{selectedTransaction.id}</strong>
                </div>

                <div className={styles.modalRow}>
                  <span>Guest</span>
                  <strong>{selectedTransaction.guest_name}</strong>
                </div>

                <div className={styles.modalRow}>
                  <span>Amount</span>
                  <strong>₱{selectedTransaction.amount}</strong>
                </div>

                <div className={styles.modalRow}>
                  <span>Status</span>
                  <strong>{normalizeStatus(selectedTransaction.status)}</strong>
                </div>
              </div>

              <button
                className={styles.closeBtn}
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminPaymentManagement;