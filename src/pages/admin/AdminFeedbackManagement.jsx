import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/Sidebar';


import { adminAPI } from '../../utils/api';
import styles from '../../styles/AdminFeedbackManagement.module.css';

const statusTabs = [
{ key: 'active', label: 'All' },
{ key: 'archived', label: 'Archive' }];


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

const shortenReference = (value, start = 8, end = 4) => {
  if (!value) return 'N/A';
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
};

const shortenText = (value, maxLength = 35) => {
  if (!value) return '';
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
};

export default function AdminFeedbackManagement({ role = 'admin' }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('active');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState('new');
  const [isSaving, setIsSaving] = useState(false);
  const isAdmin = role === 'admin';

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
      const matchesStatus = filter === 'active' ? item.status !== 'archived' : item.status === filter;
      const matchesRating = ratingFilter === 'all' || item.rating === parseInt(ratingFilter);
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || [
      item.feedback_id,
      item.first_name,
      item.last_name,
      item.email,
      item.comment,
      item.reservation_reference,
      item.facility_name].
      some((value) => String(value || '').toLowerCase().includes(query));
      return matchesStatus && matchesRating && matchesSearch;
    });
  }, [feedbacks, filter, ratingFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      active: feedbacks.filter((item) => item.status !== 'archived').length,
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
      const updated = await adminAPI.updateFeedbackStatus(selectedFeedback.id, 'archived');
      setFeedbacks((prev) => prev.map((item) => item.id === updated.id ? updated : item));
      setSelectedFeedback(null);
      setError(null);
    } catch (err) {
      console.error('Failed to update feedback status', err);
      setError('Could not archive feedback. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setStatusUpdate('archived');
    setError(null);
  };

  return (
    <div className={styles.adminShell}>
      <Sidebar role={role} />

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.title}>
              <h1>Feedback Management</h1>
              <p>
                {isAdmin ?
                'Infinity Garden Resort Reservation Management System' :
                'Infinity Garden Resort Management System - Staff View'}
              </p>
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
                <p className={styles.statLabel}>Active Feedback</p>
                <p className={styles.statValue}>{counts.active}</p>
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
                <p className={styles.statLabel}>Archived</p>
                <p className={styles.statValue}>{counts.archived}</p>
              </div>
            </div>
          </div>

          <div className={styles.actionBar}>
            <div className={styles.searchWrapper}>
              <input
                type="search"
                placeholder="Search feedback, guest, facility..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput} />
              
            </div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className={styles.filterSelect}
              title="Filter by rating">
              
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            <p className={styles.summaryText}>
              Showing {filteredFeedback.length} of {feedbacks.length} entries.
            </p>
          </div>

          <div className={styles.filterTabs}>
            {statusTabs.map((tab) =>
            <button
              key={tab.key}
              className={`${styles.tab} ${filter === tab.key ? styles.active : ''}`}
              onClick={() => setFilter(tab.key)}>
              
                {tab.label} ({counts[tab.key]})
              </button>
            )}
          </div>

          {error && <div className={styles.errorBanner}><p>{error}</p></div>}

          {isLoading ?
          <div className={styles.emptyState}>
              <h3>Loading feedback submissions...</h3>
            </div> :
          filteredFeedback.length === 0 ?
          <div className={styles.emptyState}>
              <h3>No feedback found</h3>
              <p>Try a different search term or refresh the page.</p>
            </div> :

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
                  {filteredFeedback.map((item) =>
                <tr key={item.id}>
                      <td title={item.feedback_id}>{shortenReference(item.feedback_id)}</td>
                      <td>
                        <div className={styles.guestInfo}>
                          <strong>{item.guest_name}</strong>
                          <small>{item.email}</small>
                        </div>
                      </td>
                      <td title={item.facility_name || 'No linked facility'}>
                        {item.facility_name || 'No facility link'}
                      </td>
                      <td>{item.rating} / 5</td>
                      <td title={item.comment}>{shortenText(item.comment)}</td>
                      <td>{new Date(item.submitted_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`${styles.status} ${badgeStyle[item.status] || ''}`}>
                          {statusLabel[item.status] || item.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                      className={styles.actionBtn}
                      onClick={() => handleOpenFeedback(item)}>
                      
                          View
                        </button>
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
          }
        </div>

        {selectedFeedback &&
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
                  <strong>{selectedFeedback.facility_name || 'None'}</strong>
                </div>
                <div className={styles.modalRow}>
                  <span>Rating</span>
                  <strong>{selectedFeedback.rating} / 5</strong>
                </div>
                <div className={styles.modalRow}>
                  <span>Submitted</span>
                  <strong>{new Date(selectedFeedback.submitted_at).toLocaleString()}</strong>
                </div>
                {!isAdmin &&
              <div className={styles.modalRow}>
                    <span>Status</span>
                    <strong>{statusLabel[selectedFeedback.status] || selectedFeedback.status}</strong>
                  </div>
              }
                <div className={styles.formGroup}>
                  <label>Comment</label>
                  <textarea
                  className={styles.input}
                  readOnly
                  value={selectedFeedback.comment}
                  rows={6} />
                
                </div>
              </div>

              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setSelectedFeedback(null)}>
                  Close
                </button>
                {isAdmin &&
              <button
                className={styles.submitBtn}
                disabled={isSaving}
                onClick={handleStatusSave}>
                
                    {isSaving ? 'Archiving...' : 'Archive'}
                  </button>
              }
              </div>
            </div>
          </div>
        }
      </div>
    </div>);

}
