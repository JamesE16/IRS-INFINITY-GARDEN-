import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import styles from '../../styles/RoomCard.module.css';


export default function RoomCard({ room }) {
  const navigate = useNavigate();
  const { setSelectedRoom, isRoomReserved } = useBooking();

  const isReserved = isRoomReserved(room.id) || !room.available;

  const handleView = () => {
    if (isReserved) return;
    
    setSelectedRoom(room);
    navigate(`/rooms/${room.id}`);
  };

  // Helper for capacity text
  const getCapacityText = (room) => {
    if (room.type === 'Gazebo' || room.type === 'Pavilion') {
      return `Up to ${room.guests} guests`;
    }
    return `Up to ${room.guests} guests`;
  };

  // Badge color per type
  const badgeClass = {
    Room:    styles.badgeRoom,
    Cottage: styles.badgeCottage,
    Gazebo:  styles.badgeGazebo,
    Pavilion:styles.badgePavilion,
  }[room.type] || styles.badgeRoom;

  // Show first 4 amenities + overflow count
  const visibleTags = room.amenities.slice(0, 4);
  const extraCount  = room.amenities.length - 4;

  return (
    <div className={`${styles.card} ${isReserved ? styles.unavailable : ''}`}>
      {/* ── IMAGE ── */}
      <div className={styles.imgWrapper}>
        <img
          src={room.img}
          alt={room.name}
          className={`${styles.img} ${isReserved ? styles.imgDark : ''}`}
          loading="lazy"
        />

        {/* Type badge */}
        <span className={`${styles.typeBadge} ${badgeClass}`}>{room.subtype}</span>

        {/* Reserved overlay — shown when API indicates unavailability */}
        {isReserved && (
          <div className={styles.reservedOverlay}>
            <span className={styles.reservedLabel}>Reserved / Unavailable</span>
          </div>
        )}
      </div>

      {/* ── BODY ── */}
      <div className={styles.body}>
        <h3 className={styles.name}>{room.name}</h3>
        <p className={styles.desc}>{room.desc}</p>

        {/* Meta: guests + size */}
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {getCapacityText(room)}
          </span>
          <span className={styles.metaItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 3 21 3 21 9"/>
              <polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/>
              <line x1="3"  y1="21" x2="10" y2="14"/>
            </svg>
            {room.size} m²
          </span>
        </div>

        {/* Amenity tags */}
        <div className={styles.tags}>
          {visibleTags.map((a) => (
            <span key={a} className={styles.tag}>{a}</span>
          ))}
          {extraCount > 0 && (
            <span className={styles.tag}>+{extraCount} more</span>
          )}
        </div>

        {/* Price + CTA */}
        <div className={styles.footer}>
          <div className={styles.price}>
            ₱{room.price}<span> / night</span>
          </div>
          <button
            className={`${styles.viewBtn} ${isReserved ? styles.viewBtnDisabled : ''}`}
            onClick={handleView}
            disabled={isReserved}
            aria-label={!isReserved ? `View details for ${room.name}` : 'Room unavailable'}
          >
            {!isReserved ? (
              <>
                View Details
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </>
            ) : (
              'Unavailable'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


//UPDATED (Dynamic Reserved State from backend)
/*import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import styles from '../../styles/RoomCard.module.css';

export default function RoomCard({ room }) {
  const navigate = useNavigate();
  const { setSelectedRoom, isRoomReserved } = useBooking();

  const isReserved = isRoomReserved(room.id);

  const handleView = () => {
    if (isReserved) return;
    setSelectedRoom(room);
    navigate(`/rooms/${room.id}`);
  };

  const getCapacityText = (room) => {
    return `Up to ${room.guests} guests`;
  };

  const badgeClass = {
    Room: styles.badgeRoom,
    Cottage: styles.badgeCottage,
    Gazebo: styles.badgeGazebo,
    Pavilion: styles.badgePavilion,
  }[room.type] || styles.badgeRoom;

  const visibleTags = room.amenities.slice(0, 4);
  const extraCount = room.amenities.length - 4;

  return (
    <div className={`${styles.card} ${isReserved ? styles.unavailable : ''}`}>
      
      <div className={styles.imgWrapper}>
        <img
          src={room.img}
          alt={room.name}
          className={`${styles.img} ${isReserved ? styles.imgDark : ''}`}
          loading="lazy"
        />

        <span className={`${styles.typeBadge} ${badgeClass}`}>
          {room.subtype}
        </span>

        {isReserved && (
          <div className={styles.reservedOverlay}>
            <span className={styles.reservedLabel}>Reserved</span>
          </div>
        )}
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{room.name}</h3>
        <p className={styles.desc}>{room.desc}</p>

        <div className={styles.meta}>
          <span className={styles.metaItem}>
            👥 {getCapacityText(room)}
          </span>
          <span className={styles.metaItem}>
            📐 {room.size} m²
          </span>
        </div>

        <div className={styles.tags}>
          {visibleTags.map((a) => (
            <span key={a} className={styles.tag}>{a}</span>
          ))}
          {extraCount > 0 && (
            <span className={styles.tag}>+{extraCount} more</span>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.price}>
            ₱{room.price}<span> / night</span>
          </div>

          <button
            className={`${styles.viewBtn} ${isReserved ? styles.viewBtnDisabled : ''}`}
            onClick={handleView}
            disabled={isReserved}
          >
            {isReserved ? 'Reserved' : 'View Details'}
          </button>
        </div>
      </div>
    </div>
  );
} 
*/