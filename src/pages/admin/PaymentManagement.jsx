import React, { useState, useEffect, useMemo } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import styles from '../../styles/AdminPayments.module.css';

const PaymentManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await paymentAPI.getAllTransactions();
      setTransactions(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
      setTransactions([]);
      setError('Failed to load transactions. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter(t => t.status?.toLowerCase() === filter.toLowerCase());
  }, [transactions, filter]);

  const stats = useMemo(() => {
    return {
      total: transactions.length,
      paid: transactions.filter(t => t.status === 'paid').length,
      pending: transactions.filter(t => t.status === 'pending').length,
      failed: transactions.filter(t => t.status === 'failed').length,
      totalAmount: transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
    };
  }, [transactions]);

  return (
    <div className={styles.adminShell}>
      <AdminSidebar activePage="/admin/payment-management" />

      <div className={styles.mainContent}>
        {/* ===== ENHANCED HEADER ===== */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.title}>
              <h1>Payment Management</h1>
              <p>Infinity Garden Resort Reservation Management System</p>
            </div>
          </div>
        </div>

        <main className={styles.container}>
          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#dbeafe' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Total Transactions</p>
                <p className={styles.statValue}>{stats.total}</p>
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
                <p className={styles.statLabel}>Paid</p>
                <p className={styles.statValue}>{stats.paid}</p>
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
                <p className={styles.statValue}>{stats.pending}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#fee2e2' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Failed</p>
                <p className={styles.statValue}>{stats.failed}</p>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className={styles.summarySection}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px'
            }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 8px' }}>Total Revenue</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--navy)', margin: 0 }}>
                  ₱{stats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 8px' }}>Average Transaction</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--navy)', margin: 0 }}>
                  ₱{(stats.totalAmount / (stats.total || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className={styles.filterTabs}>
            {['all', 'paid', 'pending', 'failed'].map(status => (
              <button
                key={status}
                className={`${styles.tab} ${filter === status ? styles.active : ''}`}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({
                  status === 'all' ? stats.total :
                  status === 'paid' ? stats.paid :
                  status === 'pending' ? stats.pending :
                  stats.failed
                })
              </button>
            ))}
          </div>

          {/* Transactions Table */}
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

          {isLoading ? (
            <div className={styles.emptyState}>
              <h3>Loading transactions...</h3>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No transactions found</h3>
              <p>Try selecting a different filter or check back later.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Guest Name</th>
                    <th>Email</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction, idx) => (
                    <tr key={idx}>
                      <td className={styles.transactionId}>TXN-{String(transaction.id || idx).padStart(5, '0')}</td>
                      <td className={styles.guestName}>{transaction.guest_name || 'N/A'}</td>
                      <td className={styles.guestEmail}>{transaction.guest_email || '-'}</td>
                      <td className={styles.amount}>₱{parseFloat(transaction.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td>
                        <span className={styles.paymentMethod}>
                          {transaction.payment_method || 'Card'}
                        </span>
                      </td>
                      <td>{new Date(transaction.created_at || Date.now()).toLocaleDateString()}</td>
                      <td>
                        <span className={`${styles.status} ${
                          transaction.status === 'paid' ? styles.statusPaid :
                          transaction.status === 'pending' ? styles.statusPending :
                          styles.statusFailed
                        }`}>
                          {transaction.status?.charAt(0).toUpperCase() + transaction.status?.slice(1) || 'Unknown'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className={styles.actionBtn} 
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowModal(true);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        {/* Transaction Detail Modal */}
        {showModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>Transaction Details</h3>
                <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.modalRow}>
                  <span>Transaction ID</span>
                  <strong>{selectedTransaction?.id || 'TXN-00001'}</strong>
                </div>
                <div className={styles.modalRow}>
                  <span>Guest Name</span>
                  <strong>{selectedTransaction?.guest_name || 'John Doe'}</strong>
                </div>
                <div className={styles.modalRow}>
                  <span>Email</span>
                  <strong>{selectedTransaction?.guest_email || 'john@example.com'}</strong>
                </div>
                <div className={styles.modalRow}>
                  <span>Amount</span>
                  <strong>₱{parseFloat(selectedTransaction?.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className={styles.modalRow}>
                  <span>Payment Method</span>
                  <strong>{selectedTransaction?.payment_method || 'Credit Card'}</strong>
                </div>
                <div className={styles.modalRow}>
                  <span>Date</span>
                  <strong>{new Date(selectedTransaction?.created_at || Date.now()).toLocaleDateString()}</strong>
                </div>
                <div className={styles.modalRow}>
                  <span>Status</span>
                  <strong style={{
                    color: selectedTransaction?.status === 'paid' ? '#16a34a' :
                           selectedTransaction?.status === 'pending' ? '#92400e' :
                           '#991b1b'
                  }}>
                    {selectedTransaction?.status?.charAt(0).toUpperCase() + selectedTransaction?.status?.slice(1) || 'Unknown'}
                  </strong>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentManagement;