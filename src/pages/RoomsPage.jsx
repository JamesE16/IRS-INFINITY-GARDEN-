import { useMemo } from 'react';
import { useBooking } from '../context/BookingContext';
import { ROOMS } from '../data/rooms';
import FilterTabs from '../components/ui/FilterTabs';
import RoomCard   from '../components/ui/RoomCard';
import Footer     from '../components/layout/Footer';
import styles from "../styles/RoomsPage.module.css";


export default function RoomsPage() {
  const { filter, bookings } = useBooking();

  const roomsWithStatus = useMemo(() => {
    return ROOMS.map((room) => {
      const isReserved = bookings.some((b) => {
        const bookingRoomId = b.room || b.roomId || b.facility || b.facility_id;
        const status = (b.status || '').toString().toLowerCase();
        return (
          parseInt(bookingRoomId, 10) === parseInt(room.id, 10) &&
          status === 'approved'
        );
      });

      return {
        ...room,
        available: !isReserved,
      };
    });
  }, [bookings]);

  const filtered = useMemo(() => {
    return filter === 'All'
      ? roomsWithStatus
      : roomsWithStatus.filter((r) => r.type === filter);
  }, [roomsWithStatus, filter]);

  return (
    <div className="page">
      {/* ── PAGE HEADER ── */}
      <div className={styles.header}>
        <h1>Our Rooms &amp; Pavilion</h1>
        <p>
          Choose from our selection of accommodations, each designed to
          <br />provide the ultimate comfort and relaxation
        </p>
      </div>

      {/* ── FILTER TABS ── */}
      <FilterTabs />

      {/* ── GRID ── */}
      <div className={styles.grid}>
        {filtered.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>

      <Footer />
    </div>
  );
}


