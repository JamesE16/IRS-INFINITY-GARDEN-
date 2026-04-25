import React, { useMemo, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import styles from '../../styles/AdminPayments.module.css';
import { FaCheckCircle, FaClock, FaCreditCard, FaEye, FaMoneyBillWave, FaPrint } from 'react-icons/fa';

const mockTransactions = [
  { id: 1, transaction_id: 'TXN001', guest_name: 'Cristalyn Llarenas', amount: 15000, status: 'verified', date: '2026-04-07', payment_method: 'Cash' },
  { id: 2, transaction_id: 'TXN002', guest_name: 'James Higoy', amount: 8000, status: 'pending', date: '2026-04-11', payment_method: 'Card' },
  { id: 3, transaction_id: 'TXN003', guest_name: 'Joanna Cooper', amount: 20000, status: 'verified', date: '2026-04-20', payment_method: 'Bank Transfer' }
];

const AdminPaymentManagement = ({ role = 'admin' }) => {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [isLoading] = useState(false);
  const [error] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [form, setForm] = useState({
    guest_name: '',
    amount: '',
    payment_method: ''
  });
  const isAdmin = role === 'admin';

  const normalizeStatus = (status) => {
    const value = (status || '').toLowerCase();
    if (value === 'paid' || value === 'verified') return 'paid';
    if (value === 'pending') return 'pending';
    if (value === 'failed' || value === 'declined') return 'failed';
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
        failed: summary.failed + (status === 'failed' ? 1 : 0),
        totalAmount: summary.totalAmount + (Number(transaction.amount) || 0)
      };
    }, { total: 0, paid: 0, pending: 0, failed: 0, totalAmount: 0 });
  }, [transactions]);

  const handleView = (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const handleVerify = (transaction) => {
    setTransactions((prev) =>
      prev.map((item) =>
        item.id === transaction.id ? { ...item, status: 'verified' } : item
      )
    );
  };

  const handleAdd = () => {
    setForm({ guest_name: '', amount: '', payment_method: '' });
    setShowAddModal(true);
  };

  const handleSaveAdd = () => {
    const newTransaction = {
      ...form,
      id: Date.now(),
      transaction_id: `TXN${Date.now()}`,
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    };

    setTransactions((prev) => [...prev, newTransaction]);
    setShowAddModal(false);
  };

  const handlePrintReceipt = (transaction) => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;

    const transactionDate = new Date(transaction.created_at || transaction.date || Date.now());
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
          <div class="row"><span class="label">Transaction ID:</span> ${transaction.transaction_id || `TXN-${transaction.id}`}</div>
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
            <div className={styles.headerActions}>
              <button className={styles.primaryBtn} onClick={handleAdd}>
                Add Payment
              </button>
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
              { key: 'pending', label: 'Pending' }
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
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{transaction.transaction_id || `TXN-${transaction.id}`}</td>
                      <td>{transaction.guest_name}</td>
                      <td>PHP {Number(transaction.amount || 0).toLocaleString()}</td>
                      <td>
                        <span className={`${styles.status} ${styles[`status${normalizeStatus(transaction.status).charAt(0).toUpperCase() + normalizeStatus(transaction.status).slice(1)}`]}`}>
                          {normalizeStatus(transaction.status)}
                        </span>
                      </td>
                      <td>{transaction.date}</td>
                      <td>
                        <div className={styles.actions}>
                          <button className={styles.viewBtn} onClick={() => handleView(transaction)}>
                            <FaEye /> View
                          </button>
                          {normalizeStatus(transaction.status) === 'pending' && (
                            <button className={styles.verifyBtn} onClick={() => handleVerify(transaction)}>
                              <FaCheckCircle /> Verify
                            </button>
                          )}
                          <button className={styles.printBtn} onClick={() => handlePrintReceipt(transaction)}>
                            <FaPrint /> Print Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                <div className={styles.modalRow}><span>Transaction ID</span><strong>{selectedTransaction.transaction_id}</strong></div>
                <div className={styles.modalRow}><span>Guest</span><strong>{selectedTransaction.guest_name}</strong></div>
                <div className={styles.modalRow}><span>Amount</span><strong>PHP {Number(selectedTransaction.amount || 0).toLocaleString()}</strong></div>
                <div className={styles.modalRow}><span>Status</span><strong>{normalizeStatus(selectedTransaction.status)}</strong></div>
                <div className={styles.modalRow}><span>Payment Method</span><strong>{selectedTransaction.payment_method}</strong></div>
                <div className={styles.modalRow}><span>Date</span><strong>{selectedTransaction.date}</strong></div>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        )}

        {showAddModal && (
          <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
            <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Add New Payment</h3>
                <button className={styles.modalClose} onClick={() => setShowAddModal(false)}>
                  x
                </button>
              </div>
              <form className={styles.modalForm} onSubmit={(event) => { event.preventDefault(); handleSaveAdd(); }}>
                <div className={styles.formGroup}>
                  <label>Guest Name</label>
                  <input
                    type="text"
                    value={form.guest_name}
                    onChange={(event) => setForm((prev) => ({ ...prev, guest_name: event.target.value }))}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Amount</label>
                  <input
                    type="number"
                    min="0"
                    value={form.amount}
                    onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Payment Method</label>
                  <select
                    value={form.payment_method}
                    onChange={(event) => setForm((prev) => ({ ...prev, payment_method: event.target.value }))}
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
    </div>
  );
};

export default AdminPaymentManagement;
