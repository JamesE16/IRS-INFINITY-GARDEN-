import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import styles from '../../styles/AdminFeedbackManagement.module.css';

const mockFeedbacks = [
  {
    id: 1,
    guest_name: 'Cristalyn Llarenas',
    email: 'cristalgrace@gmail.com',
    rating: 5,
    comment: 'Excellent service and beautiful resort!',
    date: '2026-04-07',
    status: 'reviewed'
  },
  {
    id: 2,
    guest_name: 'James Higoy',
    email: 'jamelmar@gmail.com',
    rating: 4,
    comment: 'Great experience, but room could be cleaner.',
    date: '2026-04-11',
    status: 'reviewed'
  },
  {
    id: 3,
    guest_name: 'Joanna Cooper',
    email: 'joandane@gmail.com',
    rating: 5,
    comment: 'Perfect wedding venue!',
    date: '2026-04-20',
    status: 'reviewed'
  }
];

const statusTabs = [
  { key: 'all', label: 'All Feedback' },
  { key: 'reviewed', label: 'Reviewed' }
];

export default function StaffFeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setIsLoading(true);
    try {
      // Mock data
      setFeedbacks(mockFeedbacks);
      setError(null);
    } catch {
      setFeedbacks([]);
      setError('Failed to load feedback.');
    } finally {
      setIsLoading(false);
    }
  };

  const counts = useMemo(() => {
    const reviewed = feedbacks.filter(f => f.status === 'reviewed').length;
    return {
      all: feedbacks.length,
      reviewed
    };
  }, [feedbacks]);

  const filteredFeedbacks = useMemo(() => {
    let filtered = feedbacks;
    if (filter !== 'all') {
      filtered = filtered.filter(f => f.status === filter);
    }
    if (searchQuery) {
      filtered = filtered.filter(f =>
        f.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.comment.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [feedbacks, filter, searchQuery]);

  const handleView = (feedback) => {
    setSelectedFeedback(feedback);
  };

  return (
    <div className={styles.adminShell}>
      <Sidebar role="staff" />

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.title}>
              <h1>Feedback Management</h1>
              <p>View guest feedback and reviews</p>
            </div>
          </div>
        </div>

        <div className={styles.container}>
          {error && (
            <div className={styles.errorBanner}>
              <p>{error}</p>
            </div>
          )}

          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterTabs}>
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                className={`${styles.tab} ${filter === tab.key ? styles.active : ''}`}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label} ({counts[tab.key] || 0})
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading feedback...</p>
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className={styles.empty}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <h3>No feedback found</h3>
              <p>There are no {filter} feedback items at the moment.</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedbacks.map((feedback) => (
                    <tr key={feedback.id}>
                      <td>
                        <div className={styles.guestInfo}>
                          <strong>{feedback.guest_name}</strong>
                          <small>{feedback.email}</small>
                        </div>
                      </td>
                      <td>
                        <div className={styles.rating}>
                          {'★'.repeat(feedback.rating)}{'☆'.repeat(5 - feedback.rating)}
                        </div>
                      </td>
                      <td className={styles.comment}>
                        {feedback.comment.length > 50
                          ? `${feedback.comment.substring(0, 50)}...`
                          : feedback.comment
                        }
                      </td>
                      <td>{feedback.date}</td>
                      <td>
                        <span className={`${styles.status} ${styles[feedback.status]}`}>
                          {feedback.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.viewBtn}
                          onClick={() => handleView(feedback)}
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
      </div>

      {selectedFeedback && (
        <div className={styles.modalOverlay} onClick={() => setSelectedFeedback(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Feedback Details</h3>
              <button className={styles.modalClose} onClick={() => setSelectedFeedback(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.feedbackDetails}>
                <div className={styles.detailRow}>
                  <span>Guest Name:</span>
                  <strong>{selectedFeedback.guest_name}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Email:</span>
                  <strong>{selectedFeedback.email}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Rating:</span>
                  <div className={styles.rating}>
                    {'★'.repeat(selectedFeedback.rating)}{'☆'.repeat(5 - selectedFeedback.rating)}
                  </div>
                </div>
                <div className={styles.detailRow}>
                  <span>Date:</span>
                  <strong>{selectedFeedback.date}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Status:</span>
                  <span className={`${styles.status} ${styles[selectedFeedback.status]}`}>
                    {selectedFeedback.status}
                  </span>
                </div>
                <div className={styles.commentSection}>
                  <span>Comment:</span>
                  <p className={styles.fullComment}>{selectedFeedback.comment}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}