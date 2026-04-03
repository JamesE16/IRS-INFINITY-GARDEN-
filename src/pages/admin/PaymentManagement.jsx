import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { reservationsAPI } from '../../utils/api'; // Connecting to your existing API
import styles from '../../styles/AdminDashboard.module.css';
import { FaPlus, FaPrint, FaChevronRight, FaWallet } from 'react-icons/fa';

const PaymentManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const data = await reservationsAPI.getAllReservations();
        // Filter for 'confirmed' or 'approved' status for Income
        setReservations(data);
      } catch (error) {
        console.error("Error fetching reservations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
  }, []);

  // Calculate totals based on live data
  const totalIncome = reservations
    .filter(res => res.status === 'confirmed' || res.status === 'approved')
    .reduce((sum, res) => sum + parseFloat(res.total_price || 0), 0);

  // For now, expenses remain static unless you have an Expense API
  const totalExpense = 2750; 

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fbff' }}>
      <AdminSidebar activePage="/admin/logs" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className={styles.topHeader}>
          <div className={styles.breadcrumb}>
            <span>Admin</span> <FaChevronRight size={10} /> <strong>Payments & Transaction</strong>
          </div>
          <button className={styles.printBtn} onClick={() => window.print()}><FaPrint /> Print Report</button>
        </div>

        <div className={styles.financialGrid}>
          {/* LIVE INCOME CARD */}
          <div className={styles.whiteCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.incomeHeading}>Income</h3>
              <button className={styles.addBtnSmall}><FaPlus /> Add Income</button>
            </div>
            <div className={styles.listArea}>
              {loading ? <p>Loading transactions...</p> : 
                reservations.map(res => (
                  <div key={res.id} className={styles.transactionRow}>
                    <div className={styles.rowInfo}>
                      <span className={styles.rowDate}>{new Date(res.created_at).toLocaleDateString()}</span>
                      <span className={styles.rowLabel}>{res.facility_name} ({res.user_email})</span>
                    </div>
                    <span className={styles.amtPositive}>+ ₱{parseFloat(res.total_price).toLocaleString()}</span>
                  </div>
                ))
              }
            </div>
            <div className={styles.cardFooter}>
              <span>Sub-total:</span> <strong>₱{totalIncome.toLocaleString()}</strong>
            </div>
          </div>

          {/* EXPENSE CARD */}
          <div className={styles.whiteCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.expenseHeading}>Expense</h3>
              <button className={styles.addBtnSmall}><FaPlus /> Add Expense</button>
            </div>
            <div className={styles.listArea}>
               <div className={styles.transactionRow}>
                <div className={styles.rowInfo}>
                  <span className={styles.rowDate}>Fixed Monthly</span>
                  <span className={styles.rowLabel}>Operating Costs</span>
                </div>
                <span className={styles.amtNegative}>- ₱{totalExpense.toLocaleString()}</span>
              </div>
            </div>
            <div className={styles.cardFooter}>
              <span>Sub-total:</span> <strong>₱{totalExpense.toLocaleString()}</strong>
            </div>
          </div>

          {/* DYNAMIC SUMMARY CARD */}
          <div className={styles.whiteCard}>
            <div className={styles.cardHeader}><h3>Financial Summary</h3></div>
            <div className={styles.summaryBox}>
              <div className={styles.summaryRow}>
                <span>Gross Revenue</span>
                <span className={styles.amtPositive}>₱{totalIncome.toLocaleString()}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Operating Expenses</span>
                <span className={styles.amtNegative}>₱{totalExpense.toLocaleString()}</span>
              </div>
              <hr className={styles.cardDivider} />
              <div className={styles.netProfitRow}>
                <span>Net Profit</span>
                <strong className={styles.totalAmt}>₱{(totalIncome - totalExpense).toLocaleString()}</strong>
              </div>
              <div style={{ marginTop: '15px', fontSize: '0.85rem', color: '#64748b' }}>
                <FaWallet /> Primary Method: GCash / On-site
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentManagement;