import { useCallback, useEffect, useRef, useState } from 'react';
import { adminAPI, reservationsAPI } from '../../utils/api';
import styles from '../../styles/FeedbackModal.module.css';

const getFacilityName = (reservationData) =>
reservationData?.facility?.name || reservationData?.facility_name || 'Reserved facility';

const canReviewReservation = (reservationData) =>
(reservationData?.status || '').toLowerCase() === 'confirmed';

const alreadyHasFeedback = (reservationData) => Boolean(reservationData?.has_feedback);

export default function FeedbackModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    reservation_id: '',
    rating: 5,
    comment: ''
  });

  const [reservation, setReservation] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const verificationRequestRef = useRef(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value) : value
    }));
    if (name === 'reservation_id') {
      setReservation(null);
    }
    setError('');
  };

  const handleRatingChange = (rating) => {
    setFormData((prev) => ({
      ...prev,
      rating
    }));
    setError('');
  };

  const verifyReservation = useCallback(async (reservationId) => {
    const query = reservationId.trim();

    if (!query) {
      setError('Please enter your reservation ID.');
      return;
    }

    const requestId = ++verificationRequestRef.current;
    setIsVerifying(true);
    setError('');

    try {
      const data = await reservationsAPI.trackByReservationId(query);
      if (requestId !== verificationRequestRef.current) return;
      if (!canReviewReservation(data)) {
        setReservation(null);
        setError('Only confirmed reservations can submit feedback.');
        return;
      }
      setReservation(data);
      if (alreadyHasFeedback(data)) {
        setError('Feedback has already been submitted for this reservation.');
      }
    } catch (err) {
      if (requestId !== verificationRequestRef.current) return;
      setReservation(null);
      setError(err.message || 'Reservation ID was not found.');
    } finally {
      if (requestId === verificationRequestRef.current) {
        setIsVerifying(false);
      }
    }
  }, []);

  useEffect(() => {
    const reservationId = formData.reservation_id.trim();

    verificationRequestRef.current += 1;
    setReservation(null);

    if (!reservationId) {
      setIsVerifying(false);
      setError('');
      return;
    }

    if (reservationId.length < 8) {
      setIsVerifying(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      verifyReservation(reservationId);
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [formData.reservation_id, verifyReservation]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.reservation_id.trim()) {
      setError('Please enter your reservation ID.');
      return;
    }
    if (!formData.comment.trim()) {
      setError('Please share your feedback');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const linkedReservation = reservation || (await reservationsAPI.trackByReservationId(formData.reservation_id.trim()));
      if (!canReviewReservation(linkedReservation)) {
        setError('Only confirmed reservations can submit feedback.');
        return;
      }
      if (alreadyHasFeedback(linkedReservation)) {
        setError('Feedback has already been submitted for this reservation.');
        return;
      }
      await adminAPI.createFeedback({
        reservation_id: linkedReservation.reservation_id || formData.reservation_id.trim(),
        rating: formData.rating,
        comment: formData.comment.trim()
      });
      onSubmit && onSubmit();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleBackdrop} role="dialog" aria-modal="true">
      <div className={styles.box}>
        <div className={styles.header}>
          <h3 className={styles.title}>Share Your Feedback</h3>
          <p className={styles.subtitle}>Paste your reservation ID so we can connect your feedback to the facility you reserved.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="reservation_id">Reservation ID</label>
            <input
              type="text"
              id="reservation_id"
              name="reservation_id"
              value={formData.reservation_id}
              onChange={handleChange}
              placeholder="Paste your reservation ID"
              disabled={isSubmitting} />
            
            {isVerifying && <div className={styles.lookupStatus}>Checking reservation...</div>}
            {reservation &&
            <div className={alreadyHasFeedback(reservation) ? styles.reservationBlocked : styles.reservationMatch}>
                <span>Feedback for</span>
                <strong>{getFacilityName(reservation)}</strong>
                {alreadyHasFeedback(reservation) &&
              <em>This reservation already has recorded feedback.</em>
              }
              </div>
            }
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="rating">Rating</label>
            <div className={styles.ratingContainer}>
              <div className={styles.stars} id="rating" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((star) =>
                <button
                  key={star}
                  type="button"
                  className={`${styles.star} ${star <= formData.rating ? styles.filled : ''}`}
                  onClick={() => handleRatingChange(star)}
                  disabled={isSubmitting}
                  role="radio"
                  aria-checked={formData.rating === star}
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}>
                  
                    ★
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="comment">Your Feedback</label>
            <textarea
              id="comment"
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              placeholder="Tell us about your experience..."
              rows="5"
              disabled={isSubmitting} />
            
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting}>
              
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || isVerifying || alreadyHasFeedback(reservation)}>
              
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>);

}
