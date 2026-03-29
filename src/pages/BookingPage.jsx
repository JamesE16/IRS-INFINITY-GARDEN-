import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import BookingForm    from '../components/booking/BookingForm';
import BookingSummary from '../components/booking/BookingSummary';
import Footer         from '../components/layout/Footer';
import styles from "../styles/BookingPage.module.css";



export default function BookingPage() {
  const navigate = useNavigate();
  const { selectedRoom } = useBooking();

  // Pricing state — updated live by BookingForm
  const [pricing, setPricing] = useState({
    nights: 0, subtotal: 0, tax: 0, total: 0, guests: 1,
  });

  // Guard: if no room selected, redirect to /rooms
  if (!selectedRoom) {
    return (
      <div className="page" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h2>No room selected.</h2>
        <button
          className="btn-red"
          onClick={() => navigate('/rooms')}
          style={{ marginTop: '1rem' }}
        >
          Browse Rooms
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      {/* ── BACK BAR ── */}
      <div className="back-bar">
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
  <span className={styles.arrow}>←</span>
  <span>Back to Room</span>
</button>
      </div>

      <div className={styles.wrapper}>
        <h1 className={styles.pageTitle}>Complete Your Booking</h1>

        <div className={styles.layout}>
          {/* ── LEFT: Form ── */}
          <BookingForm room={selectedRoom} onPriceChange={setPricing} />

          {/* ── RIGHT: Summary ── */}
          <BookingSummary room={selectedRoom} pricing={pricing} />
        </div>
      </div>

      <Footer />
    </div>
  );
}
