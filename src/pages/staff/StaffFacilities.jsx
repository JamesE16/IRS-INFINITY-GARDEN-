import { useEffect, useMemo, useState } from 'react';
import StaffSidebar from '../../components/staff/StaffSidebar';
import { ROOMS } from '../../data/rooms';
import styles from '../../styles/AdminFacilities.module.css';

const mockFacilities = [
  {
    id: 1,
    name: 'Pavilion A',
    type: 'Pavilion',
    subtype: 'Wedding',
    description: 'Spacious pavilion perfect for weddings',
    guests: 100,
    size: 500,
    beds: 'N/A',
    price: 25000,
    available: true,
    amenities: ['Sound System', 'Lighting', 'Tables & Chairs'],
    features: ['Garden View', 'Dance Floor'],
    img: ''
  },
  {
    id: 2,
    name: 'Cottage 3',
    type: 'Cottage',
    subtype: 'Deluxe',
    description: 'Cozy cottage with modern amenities',
    guests: 4,
    size: 80,
    beds: '2 Queen Beds',
    price: 5000,
    available: true,
    amenities: ['Air Conditioning', 'WiFi', 'Mini Fridge'],
    features: ['Private Balcony', 'Garden Access'],
    img: ''
  },
  {
    id: 3,
    name: 'Room 201',
    type: 'Room',
    subtype: 'Standard',
    description: 'Comfortable standard room',
    guests: 2,
    size: 25,
    beds: '1 King Bed',
    price: 3000,
    available: true,
    amenities: ['Air Conditioning', 'TV', 'WiFi'],
    features: ['City View'],
    img: ''
  }
];

const facilityTypes = ['All', 'Room', 'Cottage', 'Pavilion'];

export default function StaffFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    setIsLoading(true);
    try {
      // Mock data
      setFacilities(mockFacilities);
      setError(null);
    } catch (err) {
      setFacilities([]);
      setError('Failed to load facilities.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFacilities = useMemo(() => {
    let filtered = facilities;
    if (filterType !== 'All') {
      filtered = filtered.filter(f => f.type === filterType);
    }
    if (searchQuery) {
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [facilities, filterType, searchQuery]);

  const handleView = (facility) => {
    setSelectedFacility(facility);
  };

  return (
    <div className={styles.adminShell}>
      <StaffSidebar />

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.title}>
              <h1>Resort Facilities</h1>
              <p>View available facilities and accommodations</p>
            </div>
          </div>
        </div>

        <div className={styles.container}>
          {error && (
            <div className={styles.errorBanner}>
              <p>{error}</p>
            </div>
          )}

          <div className={styles.controls}>
            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="Search facilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.filterTabs}>
              {facilityTypes.map((type) => (
                <button
                  key={type}
                  className={`${styles.tab} ${filterType === type ? styles.active : ''}`}
                  onClick={() => setFilterType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading facilities...</p>
            </div>
          ) : filteredFacilities.length === 0 ? (
            <div className={styles.empty}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
              <h3>No facilities found</h3>
              <p>No facilities match your current filters.</p>
            </div>
          ) : (
            <div className={styles.facilitiesGrid}>
              {filteredFacilities.map((facility) => (
                <div key={facility.id} className={styles.facilityCard}>
                  <div className={styles.facilityImage}>
                    {facility.img ? (
                      <img src={facility.img} alt={facility.name} />
                    ) : (
                      <div className={styles.placeholderImage}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <circle cx="9" cy="9" r="2"/>
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className={styles.facilityContent}>
                    <div className={styles.facilityHeader}>
                      <h3 className={styles.facilityName}>{facility.name}</h3>
                      <span className={`${styles.facilityType} ${styles[facility.type.toLowerCase()]}`}>
                        {facility.type}
                      </span>
                    </div>

                    <p className={styles.facilityDescription}>
                      {facility.description || 'No description available'}
                    </p>

                    <div className={styles.facilityDetails}>
                      <div className={styles.detailItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M22 2 2 22"/>
                        </svg>
                        <span>{facility.guests} guests</span>
                      </div>

                      <div className={styles.detailItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <path d="M3 9h18"/>
                          <path d="M9 21V9"/>
                        </svg>
                        <span>{facility.size} sqm</span>
                      </div>

                      <div className={styles.detailItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="1" x2="12" y2="23"/>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                        <span>₱{facility.price.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className={styles.facilityActions}>
                      <button
                        className={styles.viewBtn}
                        onClick={() => handleView(facility)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedFacility && (
        <div className={styles.modalOverlay} onClick={() => setSelectedFacility(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{selectedFacility.name}</h3>
              <button className={styles.modalClose} onClick={() => setSelectedFacility(null)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.facilityDetails}>
                <div className={styles.detailRow}>
                  <span>Type:</span>
                  <strong>{selectedFacility.type} - {selectedFacility.subtype}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Description:</span>
                  <p>{selectedFacility.description}</p>
                </div>
                <div className={styles.detailRow}>
                  <span>Capacity:</span>
                  <strong>{selectedFacility.guests} guests</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Size:</span>
                  <strong>{selectedFacility.size} sqm</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Beds:</span>
                  <strong>{selectedFacility.beds}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Price:</span>
                  <strong>₱{selectedFacility.price.toLocaleString()}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Availability:</span>
                  <span className={selectedFacility.available ? styles.available : styles.unavailable}>
                    {selectedFacility.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                {selectedFacility.amenities.length > 0 && (
                  <div className={styles.detailRow}>
                    <span>Amenities:</span>
                    <div className={styles.amenitiesList}>
                      {selectedFacility.amenities.map((amenity, index) => (
                        <span key={index} className={styles.amenityTag}>{amenity}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedFacility.features.length > 0 && (
                  <div className={styles.detailRow}>
                    <span>Features:</span>
                    <div className={styles.featuresList}>
                      {selectedFacility.features.map((feature, index) => (
                        <span key={index} className={styles.featureTag}>{feature}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}