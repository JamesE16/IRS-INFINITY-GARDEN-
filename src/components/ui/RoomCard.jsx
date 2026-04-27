import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { facilitiesAPI } from '../../utils/api';
import styles from '../../styles/RoomCard.module.css';

export default function RoomCard({ room }) {
  const navigate = useNavigate();
  const { setSelectedRoom } = useBooking();
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // DYNAMIC: Fetch availability from API
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const facility = await facilitiesAPI.getById(room.id);
        setAvailabilityStatus(facility.availability_status);
      } catch (error) {
        console.error('Error fetching availability:', error);
        setAvailabilityStatus({ is_available: true, current_reservation: null });
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();

    // POLL for updates every 30 seconds (REAL-TIME effect)
    const interval = setInterval(fetchAvailability, 30000);
    
    return () => clearInterval(interval);
  }, [room.id]);

  // DYNAMIC: Determine if reserved
  const isReserved = availabilityStatus && !availabilityStatus.is_available;

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

  if (loading) {
    return <div className={styles.card + ' ' + styles.loading}>Loading...</div>;
  }

  return (
    <div className={`${styles.card} ${isReserved ? styles.unavailable : ''}`}>
      {/* IMAGE */}
      <div className={styles.imgWrapper}>
        <img
          src={room.img}
          alt={room.name}
          className={`${styles.img} ${isReserved ? styles.imgDark : ''}`}
          loading="lazy"
        />

        {/* Badge */}
        <span className={`${styles.typeBadge} ${badgeClass}`}>
          {room.subtype}
        </span>

        {/* DYNAMIC: Reserved Overlay */}
        {isReserved && availabilityStatus?.current_reservation && (
          <div className={styles.reservedOverlay}>
            <span className={styles.reservedLabel}>
              Reserved until {new Date(availabilityStatus.current_reservation.check_out).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* BODY */}
      <div className={styles.body}>
        <h3 className={styles.name}>{room.name}</h3>
        <p className={styles.desc}>{room.desc}</p>

        {/* Meta */}
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            👥 {getCapacityText(room)}
          </span>
          <span className={styles.metaItem}>
            📐 {room.size} m²
          </span>
        </div>

        {/* Tags */}
        <div className={styles.tags}>
          {visibleTags.map((a) => (
            <span key={a} className={styles.tag}>{a}</span>
          ))}
          {extraCount > 0 && (
            <span className={styles.tag}>+{extraCount} more</span>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.price}>
            ₱{room.price}<span> / night</span>
          </div>

          <button
            className={`${styles.viewBtn} ${isReserved ? styles.viewBtnDisabled : ''}`}
            onClick={handleView}
            disabled={isReserved}
            title={isReserved ? `Reserved until ${availabilityStatus?.blocked_until}` : 'View details'}
          >
            {isReserved ? 'Reserved' : 'View Details'}
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