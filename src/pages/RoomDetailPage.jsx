import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { ROOMS } from '../data/rooms';
import Footer from '../components/layout/Footer';
import styles from "../styles/RoomDetailPage.module.css";


export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setSelectedRoom } = useBooking();

  // Find room by ID
  const room = ROOMS.find((r) => r.id === id.toString());

  useEffect(() => {
    if (room) setSelectedRoom(room);
  }, [room, setSelectedRoom]);

  if (!room) {
    return (
      <div className="page" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h2>Room not found.</h2>
        <button className="btn-red" onClick={() => navigate('/rooms')} style={{ marginTop: '1rem' }}>
          Back to Rooms
        </button>
      </div>
    );
  }

  const handleBook = () => {
    setSelectedRoom(room);
    navigate('/booking');
  };

  // Split amenities and features into 2 columns
  const half = (arr) => ({
    col1: arr.filter((_, i) => i % 2 === 0),
    col2: arr.filter((_, i) => i % 2 === 1),
  });

  const amenCols = half(room.amenities);
  const featCols = half(room.features);

  const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );

  return (
    <div className="page">
      {/* ── BACK BAR ── */}
      <div className="back-bar">
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <span className={styles.arrow}>←</span>
          <span>Back to Room</span>
        </button>
      </div>

      {/* ── DETAIL BODY ── */}
      <div className={styles.body}>
        {/* Left — image */}
        <div className={styles.imageWrap}>
          <img src={room.img} alt={room.name} />
        </div>

        {/* Right — info */}
        <div className={styles.info}>
          <span className={styles.typeBadge}>{room.type}</span>
          <h1 className={styles.name}>{room.name}</h1>
          <p className={styles.desc}>{room.desc}</p>

          {/* Specs bar */}
          <div className={styles.specs}>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Guests</span>
              <span className={styles.specVal}>Up to {room.guests}</span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Size</span>
              <span className={styles.specVal}>{room.size} m²</span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Beds</span>
              <span className={styles.specVal}>{room.beds}</span>
            </div>
          </div>

          {/* Amenities */}
          <div className={styles.featureSection}>
            <h4>Amenities</h4>
            <div className={styles.featureGrid}>
              <div>
                {amenCols.col1.map((a) => (
                  <div key={a} className={styles.featureItem}>
                    <CheckIcon /> {a}
                  </div>
                ))}
              </div>
              <div>
                {amenCols.col2.map((a) => (
                  <div key={a} className={styles.featureItem}>
                    <CheckIcon /> {a}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className={styles.featureSection}>
            <h4>Features</h4>
            <div className={styles.featureGrid}>
              <div>
                {featCols.col1.map((f) => (
                  <div key={f} className={styles.featureItem}>
                    <CheckIcon /> {f}
                  </div>
                ))}
              </div>
              <div>
                {featCols.col2.map((f) => (
                  <div key={f} className={styles.featureItem}>
                    <CheckIcon /> {f}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <hr className="divider" />

          {/* Price + Book */}
          <div className={styles.price}>
            ₱{room.price}<span> / night</span>
          </div>
          <p className={styles.cancellationNote}>
            Free cancellation up to 48 hours before check-in
          </p>

          <button
            className={`${styles.bookBtn} ${!room.available ? styles.bookBtnDisabled : ''}`}
            onClick={handleBook}
            disabled={!room.available}
          >
            {room.available ? 'Book This Room' : 'Currently Unavailable'}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
