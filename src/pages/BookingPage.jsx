import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import BookingForm    from '../components/booking/BookingForm';
import BookingSummary from '../components/booking/BookingSummary';
import Footer         from '../components/layout/Footer';
import styles from "../styles/BookingPage.module.css";



export default function BookingPage() {
  const navigate = useNavigate();
  const { selectedRoom, facilitiesLoading } = useBooking();

  const [pricing, setPricing] = useState({
    nights: 0, subtotal: 0, tax: 0, total: 0, guests: 1, unitLabel: 'night',
  });

  if (facilitiesLoading && !selectedRoom) {
    return (
      <div className="page" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h2>Loading booking details...</h2>
      </div>
    );
  }

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
      <div className="back-bar">
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
  <span className={styles.arrow}>←</span>
  <span>Back</span>
</button>
      </div>

      <div className={styles.wrapper}>
        <h1 className={styles.pageTitle}>Complete Your Booking</h1>

        <div className={styles.layout}>
          <BookingForm room={selectedRoom} onPriceChange={setPricing} />
          <BookingSummary room={selectedRoom} pricing={pricing} />
        </div>
      </div>

      <Footer />
    </div>
  );
}
