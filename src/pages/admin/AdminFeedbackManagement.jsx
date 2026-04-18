import { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { adminAPI } from '../../utils/api';
import styles from '../../styles/AdminFeedbackManagement.module.css';

const statusTabs = [
  { key: 'all', label: 'All Feedback' },
  { key: 'new', label: 'New' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'archived', label: 'Archived' }
];

const statusLabel = {
  new: 'New',
  reviewed: 'Reviewed',
  resolved: 'Resolved',
  archived: 'Archived'
};

const badgeStyle = {
  new: styles.statusNew,
  reviewed: styles.statusReviewed,
  resolved: styles.statusResolved,
  archived: styles.statusArchived
};

export default function AdminFeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState('new');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setIsLoading(true);
    try {
      const data = await adminAPI.getFeedbacks();
      setFeedbacks(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch feedback', err);
      setFeedbacks([]);
      setError('Unable to load feedback submissions. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFeedback = useMemo(() => {
    return feedbacks.filter((item) => {
      const matchesStatus = filter === 'all' ? true : item.status === filter;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || [
        item.feedback_id,
        item.first_name,
        item.last_name,
        item.email,
        item.comment,
        item.reservation_reference
      ].some((value) => String(value || '').toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [feedbacks, filter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: feedbacks.length,
      new: feedbacks.filter((item) => item.status === 'new').length,
      reviewed: feedbacks.filter((item) => item.status === 'reviewed').length,
      resolved: feedbacks.filter((item) => item.status === 'resolved').length,
      archived: feedbacks.filter((item) => item.status === 'archived').length
    };
  }, [feedbacks]);

  const handleStatusSave = async () => {
    if (!selectedFeedback) return;
    setIsSaving(true);
    try {
      const updated = await adminAPI.updateFeedbackStatus(selectedFeedback.id, statusUpdate);
      setFeedbacks((prev) => prev.map((item) => item.id === updated.id ? updated : item));
      setSelectedFeedback(updated);
      setError(null);
    } catch (err) {
      console.error('Failed to update feedback status', err);
      setError('Could not update status. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setStatusUpdate(feedback.status || 'new');
    setError(null);
  };

  return (
    <div className={styles.adminShell}>
      <AdminSidebar />

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.title}>
              <h1>Feedback Management</h1>
              <p>Infinity Garden Resort Reservation Management System</p>
            </div>
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#dbeafe' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
                  <path d="M4 19h16" />
                  <path d="M4 7h16" />
                  <path d="M8 12h8" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Total Feedback</p>
                <p className={styles.statValue}>{counts.all}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#d1fae5' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>New Feedback</p>
                <p className={styles.statValue}>{counts.new}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#fef3c7' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l2 2" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Reviewed</p>
                <p className={styles.statValue}>{counts.reviewed}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#ede9fe' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#5b21b6" strokeWidth="2">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>Resolved</p>
                <p className={styles.statValue}>{counts.resolved}</p>
              </div>
            </div>
          </div>

          <div className={styles.actionBar}>
            <div className={styles.searchWrapper}>
              <input
                type="search"
                placeholder="Search feedback, guest, reservation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <p className={styles.summaryText}>
              Showing {filteredFeedback.length} of {feedbacks.length} entries.
            </p>
          </div>

          <div className={styles.filterTabs}>
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                className={`${styles.tab} ${filter === tab.key ? styles.active : ''}`}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label} ({counts[tab.key]})
              </button>
            ))}
          </div>

          {error && <div className={styles.errorBanner}><p>{error}</p></div>}

          {isLoading ? (
            <div className={styles.emptyState}>
              <h3>Loading feedback submissions...</h3>
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No feedback found</h3>
              <p>Try a different search term or refresh the page.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Guest</th>
                    <th>Reservation</th>
                    <th>Rating</th>
                    <th>Feedback</th>
                    <th>Date Submitted</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedback.map((item) => (
                    <tr key={item.id}>
                      <td>{item.feedback_id}</td>
                      <td>
                        <div className={styles.guestInfo}>
                          <strong>{item.guest_name}</strong>
                          <small>{item.email}</small>
                        </div>
                      </td>
                      <td>{item.reservation_reference || 'N/A'}</td>
                      <td>{item.rating} / 5</td>
                      <td>{item.comment.length > 60 ? `${item.comment.slice(0, 60)}...` : item.comment}</td>
                      <td>{new Date(item.submitted_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`${styles.status} ${badgeStyle[item.status] || ''}`}>
                          {statusLabel[item.status] || item.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleOpenFeedback(item)}
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
        </div>

        {selectedFeedback && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalPanel}>
              <div className={styles.modalHeader}>
                <h3>Feedback Details</h3>
                <button className={styles.modalClose} onClick={() => setSelectedFeedback(null)}>✕</button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.modalRow}>
                  <span>Reference</span>
                  <strong>{selectedFeedback.feedback_id}</strong>
                </div>
                <div className={styles.modalRow}>
                  <span>Guest</span>
                  <strong>{selectedFeedback.guest_name}</strong>
                </div>
                <div className={styles.modalRow}>
                  <span>Email</span>
                  <strong>{selectedFeedback.email}</strong>
                </div>
                <div className={styles.modalRow}>
                  <span>Reservation Reference</span>
                  <strong>{selectedFeedback.reservation_reference || 'None'}</strong>
                </div>
                <div className={styles.modalRow}>
                  <span>Rating</span>
                  <strong>{selectedFeedback.rating} / 5</strong>
                </div>
                <div className={styles.modalRow}>
                  <span>Submitted</span>
                  <strong>{new Date(selectedFeedback.submitted_at).toLocaleString()}</strong>
                </div>
                <div className={styles.formGroup}>
                  <label>Status</label>
                  <select
                    className={styles.select}
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                  >
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Comment</label>
                  <textarea
                    className={styles.input}
                    readOnly
                    value={selectedFeedback.comment}
                    rows={6}
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setSelectedFeedback(null)}>
                  Close
                </button>
                <button
                  className={styles.submitBtn}
                  disabled={isSaving || selectedFeedback.status === statusUpdate}
                  onClick={handleStatusSave}
                >
                  {isSaving ? 'Saving…' : 'Save Status'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
