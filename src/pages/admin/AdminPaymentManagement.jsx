import React, { useState, useEffect, useMemo } from 'react';
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

  // ✅ REAL-TIME POLLING
  useEffect(() => {
    let mounted = true;

    const fetchTransactions = async (silent = false) => {
      if (!silent) setIsLoading(true);

      try {
        const data = await paymentAPI.getAllTransactions();
        if (mounted) {
          setTransactions(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError('Failed to load transactions.');
      } finally {
        if (!silent && mounted) setIsLoading(false);
      }
    };

    fetchTransactions();

    const interval = setInterval(() => {
      fetchTransactions(true);
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // FILTER
  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter(
      t => t.status?.toLowerCase() === filter.toLowerCase()
    );
  }, [transactions, filter]);

  // STATS
  const stats = useMemo(() => ({
    total: transactions.length,
    paid: transactions.filter(t => t.status === 'paid').length,
    pending: transactions.filter(t => t.status === 'pending').length,
    failed: transactions.filter(t => t.status === 'failed').length,
    totalAmount: transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
  }), [transactions]);

  // ✅ PRINT RECEIPT FUNCTION
  const handlePrintReceipt = (transaction) => {
    const receiptWindow = window.open('', '_blank');

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
          <div class="row"><span class="label">Email:</span> ${transaction.guest_email}</div>
          <div class="row"><span class="label">Amount:</span> ₱${transaction.amount}</div>
          <div class="row"><span class="label">Method:</span> ${transaction.payment_method}</div>
          <div class="row"><span class="label">Status:</span> ${transaction.status}</div>
          <div class="row"><span class="label">Date:</span> ${new Date(transaction.created_at).toLocaleString()}</div>
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
        {/* HEADER */}
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
            {[
              { label: "Total Transactions", value: stats.total },
              { label: "Paid", value: stats.paid },
              { label: "Pending", value: stats.pending },
              { label: "Failed", value: stats.failed }
            ].map((s, i) => (
              <div key={i} className={styles.statCard}>
                <div className={styles.statContent}>
                  <p className={styles.statLabel}>{s.label}</p>
                  <p className={styles.statValue}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* FILTER */}
          <div className={styles.filterTabs}>
            {['all', 'paid', 'pending', 'failed'].map(status => (
              <button
                key={status}
                className={`${styles.tab} ${filter === status ? styles.active : ''}`}
                onClick={() => setFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

          {/* TABLE */}
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
                  <tr key={i}>
                    <td>TXN-{t.id}</td>
                    <td>{t.guest_name}</td>
                    <td>₱{t.amount}</td>
                    <td>{t.status}</td>

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
        </main>

        {/* MODAL */}
        {showModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>Transaction Details</h3>
                <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.modalRow}>
                  <span>ID</span>
                  <strong>{selectedTransaction?.id}</strong>
                </div>

                <div className={styles.modalRow}>
                  <span>Guest</span>
                  <strong>{selectedTransaction?.guest_name}</strong>
                </div>

                <div className={styles.modalRow}>
                  <span>Amount</span>
                  <strong>₱{selectedTransaction?.amount}</strong>
                </div>

                <div className={styles.modalRow}>
                  <span>Status</span>
                  <strong>{selectedTransaction?.status}</strong>
                </div>
              </div>

              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
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