import React, { useState, useEffect, useMemo } from 'react';
import StaffSidebar from '../../components/staff/StaffSidebar';
import styles from '../../styles/AdminPayments.module.css';

const mockTransactions = [
  {
    id: 1,
    transaction_id: 'TXN001',
    guest_name: 'Cristalyn Llarenas',
    amount: 15000,
    status: 'verified',
    date: '2026-04-07',
    payment_method: 'Cash'
  },
  {
    id: 2,
    transaction_id: 'TXN002',
    guest_name: 'James Higoy',
    amount: 8000,
    status: 'pending',
    date: '2026-04-11',
    payment_method: 'Card'
  },
  {
    id: 3,
    transaction_id: 'TXN003',
    guest_name: 'Joanna Cooper',
    amount: 20000,
    status: 'verified',
    date: '2026-04-20',
    payment_method: 'Bank Transfer'
  }
];

const PaymentManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [form, setForm] = useState({
    guest_name: '',
    amount: '',
    payment_method: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      // Mock data
      setTransactions(mockTransactions);
      setError(null);
    } catch (err) {
      setTransactions([]);
      setError('Failed to load transactions.');
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
      verified: transactions.filter(t => t.status === 'verified').length,
      pending: transactions.filter(t => t.status === 'pending').length,
      totalAmount: transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
    };
  }, [transactions]);

  const handleView = (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const handleVerify = (transaction) => {
    setTransactions(prev => prev.map(t => t.id === transaction.id ? { ...t, status: 'verified' } : t));
  };

  const handleAdd = () => {
    setForm({ guest_name: '', amount: '', payment_method: '' });
    setShowAddModal(true);
  };

  const handleSaveAdd = () => {
    const newTxn = {
      ...form,
      id: Date.now(),
      transaction_id: `TXN${Date.now()}`,
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    };
    setTransactions(prev => [...prev, newTxn]);
    setShowAddModal(false);
  };

  const handlePrintReceipt = (transaction) => {
    // Mock print
    alert(`Printing receipt for ${transaction.transaction_id}`);
  };

  return (
    <div className={styles.adminShell}>
      <StaffSidebar />

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.title}>
              <h1>Payment Management</h1>
              <p>Manage payments and transactions</p>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.primaryBtn} onClick={handleAdd}>
                Add Payment
              </button>
            </div>
          </div>
        </div>

        <div className={styles.container}>
          {error && (
            <div className={styles.errorBanner}>
              <p>{error}</p>
            </div>
          )}

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Total Transactions</p>
                <p className={styles.statValue}>{stats.total}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Verified Payments</p>
                <p className={styles.statValue}>{stats.verified}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
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
              <div className={styles.statIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Total Amount</p>
                <p className={styles.statValue}>₱{stats.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className={styles.filterTabs}>
            {['all', 'verified', 'pending'].map(status => (
              <button
                key={status}
                className={`${styles.tab} ${filter === status ? styles.active : ''}`}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({
                  status === 'all' ? stats.total :
                  status === 'verified' ? stats.verified : stats.pending
                })
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading transactions...</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
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
                  {filteredTransactions.map(transaction => (
                    <tr key={transaction.id}>
                      <td>{transaction.transaction_id}</td>
                      <td>{transaction.guest_name}</td>
                      <td>₱{transaction.amount.toLocaleString()}</td>
                      <td>
                        <span className={`${styles.status} ${styles[transaction.status]}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td>{transaction.date}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.viewBtn}
                            onClick={() => handleView(transaction)}
                          >
                            View
                          </button>
                          {transaction.status === 'pending' && (
                            <button
                              className={styles.verifyBtn}
                              onClick={() => handleVerify(transaction)}
                            >
                              Verify
                            </button>
                          )}
                          <button
                            className={styles.printBtn}
                            onClick={() => handlePrintReceipt(transaction)}
                          >
                            Print Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedTransaction && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Transaction Details</h3>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p><strong>Transaction ID:</strong> {selectedTransaction.transaction_id}</p>
              <p><strong>Guest:</strong> {selectedTransaction.guest_name}</p>
              <p><strong>Amount:</strong> ₱{selectedTransaction.amount.toLocaleString()}</p>
              <p><strong>Status:</strong> {selectedTransaction.status}</p>
              <p><strong>Date:</strong> {selectedTransaction.date}</p>
              <p><strong>Payment Method:</strong> {selectedTransaction.payment_method}</p>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add New Payment</h3>
              <button className={styles.modalClose} onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form className={styles.modalForm} onSubmit={(e) => { e.preventDefault(); handleSaveAdd(); }}>
              <div className={styles.formGroup}>
                <label>Guest Name</label>
                <input
                  type="text"
                  value={form.guest_name}
                  onChange={(e) => setForm(prev => ({ ...prev, guest_name: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Amount</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Payment Method</label>
                <select
                  value={form.payment_method}
                  onChange={(e) => setForm(prev => ({ ...prev, payment_method: e.target.value }))}
                  required
                >
                  <option value="">Select Method</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit">Add Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;