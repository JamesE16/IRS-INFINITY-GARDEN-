import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import styles from '../../styles/AdminPayments.module.css';
import { adminAPI } from '../../utils/api';
import { FaCheckCircle, FaClock, FaCreditCard, FaEye, FaMoneyBillWave, FaPrint } from 'react-icons/fa';

const shortenId = (value) => {
  const text = String(value || '');
  if (!text) return 'N/A';
  if (text.length <= 14) return text;
  return `${text.slice(0, 8)}...${text.slice(-4)}`;
};

const formatPaymentMethod = (value, fallbackLabel = '') => {
  if (fallbackLabel) return fallbackLabel;
  if (!value) return 'N/A';

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const normalizeTransaction = (payment) => ({
  id: payment.id,
  transaction_id: payment.reference_number || `TXN-${payment.id}`,
  transaction_id_short: shortenId(payment.reference_number || `TXN-${payment.id}`),
  guest_name: payment.guest_name || 'Guest',
  amount: Number(payment.amount || 0),
  status: payment.verification_status || 'pending',
  date: payment.paid_at || payment.created_at,
  payment_method: formatPaymentMethod(payment.payment_method, payment.payment_method_display),
  proof_of_payment: payment.proof_of_payment || '',
  reservation_id: payment.reservation_reservation_id || '',
  reservation_id_short: shortenId(payment.reservation_reservation_id || ''),
});

const AdminPaymentManagement = ({ role = 'admin' }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const isAdmin = role === 'admin';

  useEffect(() => {
    const loadPayments = async () => {
      setIsLoading(true);
      try {
        const data = await adminAPI.getPayments();
        const list = Array.isArray(data) ? data : data.results ?? [];
        setTransactions(list.map(normalizeTransaction));
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Unable to load payments from backend.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPayments();
  }, []);

  const normalizeStatus = (status) => {
    const value = (status || '').toLowerCase();
    if (value === 'paid' || value === 'verified') return 'paid';
    if (value === 'pending') return 'pending';
    if (value === 'failed' || value === 'declined' || value === 'rejected') return 'declined';
    return 'unknown';
  };

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter((transaction) => normalizeStatus(transaction.status) === filter);
  }, [transactions, filter]);

  const stats = useMemo(() => {
    return transactions.reduce((summary, transaction) => {
      const status = normalizeStatus(transaction.status);
      return {
        total: summary.total + 1,
        paid: summary.paid + (status === 'paid' ? 1 : 0),
        pending: summary.pending + (status === 'pending' ? 1 : 0),
        failed: summary.failed + (status === 'declined' ? 1 : 0),
        totalAmount: summary.totalAmount + (Number(transaction.amount) || 0),
      };
    }, { total: 0, paid: 0, pending: 0, failed: 0, totalAmount: 0 });
  }, [transactions]);

  const handleView = (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const handlePrintReceipt = (transaction) => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;

    const transactionDate = new Date(transaction.date || Date.now());
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; }
            h2 { color: #1a3c8f; }
            .row { margin: 10px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Infinity Garden Resort</h2>
          <p>Payment Receipt</p>
          <hr />
          <div class="row"><span class="label">Transaction ID:</span> ${transaction.transaction_id_short}</div>
          <div class="row"><span class="label">Reservation ID:</span> ${transaction.reservation_id_short}</div>
          <div class="row"><span class="label">Guest:</span> ${transaction.guest_name}</div>
          <div class="row"><span class="label">Amount:</span> PHP ${Number(transaction.amount || 0).toLocaleString()}</div>
          <div class="row"><span class="label">Method:</span> ${transaction.payment_method}</div>
          <div class="row"><span class="label">Status:</span> ${normalizeStatus(transaction.status)}</div>
          <div class="row"><span class="label">Date:</span> ${transactionDate.toLocaleString()}</div>
          <hr />
          <p>Thank you for your payment.</p>
        </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  return (
    <div className={styles.adminShell}>
      <Sidebar role={role} />
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.title}>
              <h1>Payment Management</h1>
              <p>
                {isAdmin
                  ? 'Infinity Garden Resort Reservation Management System'
                  : 'Infinity Garden Resort - Staff View'}
              </p>
            </div>
          </div>
        </div>

        <main className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#dcfce7' }}>
                <FaCreditCard color="#10b981" />
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Total Transactions</p>
                <p className={styles.statValue}>{stats.total}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#d1fae5' }}>
                <FaCheckCircle color="#059669" />
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Verified Payments</p>
                <p className={styles.statValue}>{stats.paid}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#fef3c7' }}>
                <FaClock color="#d97706" />
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Pending</p>
                <p className={styles.statValue}>{stats.pending}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#ede9fe' }}>
                <FaMoneyBillWave color="#7c3aed" />
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Total Amount</p>
                <p className={styles.statValue}>PHP {stats.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className={styles.filterTabs}>
            {[
              { key: 'all', label: 'All' },
              { key: 'paid', label: 'Verified' },
              { key: 'pending', label: 'Pending' },
            ].map((status) => (
              <button
                key={status.key}
                className={`${styles.tab} ${filter === status.key ? styles.active : ''}`}
                onClick={() => setFilter(status.key)}
              >
                {status.label} ({
                  status.key === 'all' ? stats.total :
                  status.key === 'paid' ? stats.paid : stats.pending
                })
              </button>
            ))}
          </div>

          {error && <div className={styles.errorBanner}><p>{error}</p></div>}

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
                    <th>Transaction ID</th>
                    <th>Guest</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => {
                    const status = normalizeStatus(transaction.status);
                    const isVerified = status === 'paid';
                    const isDeclined = status === 'declined';

                    return (
                      <tr key={transaction.id}>
                        <td title={transaction.transaction_id}>{transaction.transaction_id_short}</td>
                        <td>{transaction.guest_name}</td>
                        <td>PHP {Number(transaction.amount || 0).toLocaleString()}</td>
                        <td>
                          <span className={`${styles.status} ${styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`]}`}>
                            {status}
                          </span>
                        </td>
                        <td>{new Date(transaction.date).toLocaleDateString()}</td>
                        <td>
                          <div className={styles.actions}>
                            <button className={styles.viewBtn} onClick={() => handleView(transaction)}>
                              <FaEye /> View
                            </button>
                            {!isDeclined && (
                              <>
                                <span
                                  className={`${styles.paymentState} ${isVerified ? styles.verifiedState : styles.pendingState}`}
                                >
                                  {isVerified ? <FaCheckCircle /> : <FaClock />}
                                  {isVerified ? 'Verified' : 'Awaiting Confirmation'}
                                </span>
                                <button
                                  className={`${styles.printBtn} ${!isVerified ? styles.disabledBtn : ''}`}
                                  onClick={() => isVerified && handlePrintReceipt(transaction)}
                                  disabled={!isVerified}
                                >
                                  <FaPrint /> Print Receipt
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>

        {showModal && selectedTransaction && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>Transaction Details</h3>
                <button className={styles.modalClose} onClick={() => setShowModal(false)}>
                  x
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.modalRow}><span>Transaction ID</span><strong title={selectedTransaction.transaction_id}>{selectedTransaction.transaction_id_short}</strong></div>
                <div className={styles.modalRow}><span>Reservation ID</span><strong title={selectedTransaction.reservation_id || 'N/A'}>{selectedTransaction.reservation_id_short}</strong></div>
                <div className={styles.modalRow}><span>Guest</span><strong>{selectedTransaction.guest_name}</strong></div>
                <div className={styles.modalRow}><span>Amount</span><strong>PHP {Number(selectedTransaction.amount || 0).toLocaleString()}</strong></div>
                <div className={styles.modalRow}><span>Status</span><strong>{normalizeStatus(selectedTransaction.status)}</strong></div>
                <div className={styles.modalRow}><span>Payment Method</span><strong>{selectedTransaction.payment_method}</strong></div>
                <div className={styles.modalRow}><span>Date</span><strong>{new Date(selectedTransaction.date).toLocaleString()}</strong></div>
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
