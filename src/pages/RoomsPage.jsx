import { useMemo } from 'react';
import { useBooking } from '../context/BookingContext';
import FilterTabs from '../components/ui/FilterTabs';
import RoomCard from '../components/ui/RoomCard';
import Footer from '../components/layout/Footer';
import styles from "../styles/RoomsPage.module.css";

export default function RoomsPage() {
  const { filter, facilities, facilitiesLoading } = useBooking();

  const filtered = useMemo(() => {
    return filter === 'All' ?
    facilities :
    facilities.filter((facility) => facility.type === filter);
  }, [facilities, filter]);

  return (
    <div className="page">
      <div className={styles.header}>
        <h1>Our Rooms &amp; Pavilion</h1>
        <p>
          Choose from our selection of accommodations, each designed to
          <br />provide the ultimate comfort and relaxation
        </p>
      </div>

      <FilterTabs />

      {facilitiesLoading ?
      <div className={styles.grid}>
          <p>Loading facilities...</p>
        </div> :

      <div className={styles.grid}>
          {filtered.map((room) =>
        <RoomCard key={room.id} room={room} />
        )}
        </div>
      }

      <Footer />
    </div>);

}
