import { useState, useEffect } from 'react';
import { reservationsAPI } from '../../utils/api';
import styles from '../../styles/AdminDashboard.module.css';
import { FaFileInvoiceDollar, FaSearch, FaDownload, FaCheckCircle, FaClock } from 'react-icons/fa';

export default function AdminPaymentManagement() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // Fetching all reservations to extract payment data
        const data = await reservationsAPI.getAllReservations();
        setTransactions(data);
      } catch (err) {
        console.error("Failed to fetch transactions", err);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(t => 
    t.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.facility_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <div className={styles.titleArea}>
          <h2><FaFileInvoiceDollar /> Payments & Transactions</h2>
          <p>Monitor and verify GCash payments for Infinity Garden reservations.</p>
        </div>
        <div className={styles.tableActions}>
          <div className={styles.searchBar}>
            <FaSearch />
            <input 
              type="text" 
              placeholder="Search by email or room..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className={styles.exportBtn}>
            <FaDownload /> Export CSV
          </button>
        </div>
      </div>

      <table className={styles.adminTable}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Customer</th>
            <th>Facility</th>
            <th>Method</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.map((t) => (
            <tr key={t.id}>
              <td>{new Date(t.created_at).toLocaleDateString()}</td>
              <td>{t.user_email}</td>
              <td>{t.facility_name}</td>
              <td>
                <span className={styles.paymentMethod}>GCash</span>
              </td>
              <td className={styles.priceCell}>₱{t.total_price?.toLocaleString()}</td>
              <td>
                <span className={t.status === 'approved' ? styles.statusPaid : styles.statusPending}>
                  {t.status === 'approved' ? <FaCheckCircle /> : <FaClock />} 
                  {t.status === 'approved' ? ' Verified' : ' Pending'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}