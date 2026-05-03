import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import styles from '../../styles/RoomCard.module.css';

export default function RoomCard({ room }) {
  const navigate = useNavigate();
  const { setSelectedRoom } = useBooking();

  const isReserved = room.availability_status && !room.availability_status.is_available;

  const handleView = () => {
    if (isReserved) return;
    setSelectedRoom(room);
    navigate(`/rooms/${room.publicId || room.externalId || room.id}`);
  };

  const getCapacityText = () => `Up to ${room.guests} guests`;

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

        {isReserved && room.availability_status?.current_reservation && (
          <div className={styles.reservedOverlay}>
            <span className={styles.reservedLabel}>
              Reserved until {new Date(room.availability_status.current_reservation.check_out).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{room.name}</h3>
        <p className={styles.desc}>{room.desc}</p>

        <div className={styles.meta}>
          <span className={styles.metaItem}>
            👥 {getCapacityText()}
          </span>
          <span className={styles.metaItem}>
            📐 {room.size || 'N/A'} m²
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
            title={isReserved ? `Reserved until ${room.availability_status?.blocked_until}` : 'View details'}
          >
            {isReserved ? 'Reserved' : 'View Details'}
          </button>
        </div>
      </div>
    </div>
  );
}
