import { useBooking } from '../../context/BookingContext';
import { ROOMS } from '../../data/rooms';
import styles from "../../styles/FilterTabs.module.css";

const TABS = [
  {
    key: 'All',
    label: 'All Accommodations',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    key: 'Room',
    label: 'Rooms',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    key: 'Cottage',
    label: 'Cottages',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    key: 'Gazebo',
    label: 'Gazebos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    key: 'Pavilion',
    label: 'Pavilions',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        <path d="M1 7l11-4 11 4"/>
      </svg>
    ),
  },
];

export default function FilterTabs() {
  const { filter, setFilter } = useBooking();

  const countFor = (key) =>
    key === 'All' ? ROOMS.length : ROOMS.filter((r) => r.type === key).length;

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            className={`${styles.tab} ${filter === key ? styles.active : ''}`}
            onClick={() => setFilter(key)}
          >
            <span className={styles.tabIcon}>{icon}</span>
            {label}
            <span className={styles.count}>{countFor(key)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
