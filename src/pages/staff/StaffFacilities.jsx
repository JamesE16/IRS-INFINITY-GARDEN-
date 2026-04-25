import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { facilitiesAPI } from '../../utils/api';
import { ROOMS } from '../../data/rooms';
import styles from '../../styles/AdminFacilities.module.css';

const facilityTypes = ['Room', 'Cottage', 'Gazebo', 'Pavilion'];

function normalizeFacility(item) {
  return {
    id: item.id ?? item.pk ?? item.id?.toString() ?? String(Date.now()),
    name: item.name ?? item.title ?? 'Unnamed Facility',
    type: item.type ?? item.category ?? 'Room',
    subtype: item.subtype ?? item.room_type ?? 'Standard',
    description: item.desc ?? item.description ?? '',
    guests: item.guests ?? item.capacity ?? 0,
    size: item.size ?? item.area ?? 0,
    beds: item.beds ?? item.bed_config ?? '',
    price: item.price ?? item.rate ?? 0,
    available: item.available ?? true,
    amenities: Array.isArray(item.amenities) ? item.amenities : (item.amenities || []).split?.(',').map((value) => value.trim()).filter(Boolean) ?? [],
    features: Array.isArray(item.features) ? item.features : (item.features || []).split?.(',').map((value) => value.trim()).filter(Boolean) ?? [],
    img: item.img ?? item.image_url ?? '',
  };
}

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
      const data = await facilitiesAPI.getAll();
      const list = Array.isArray(data) ? data : data.results ?? [];
      if (!list.length) throw new Error('No facilities returned');
      setFacilities(list.map(normalizeFacility));
      setError(null);
    } catch (err) {
      console.warn('Facilities fallback loaded from local room data', err);
      setFacilities(ROOMS.map(normalizeFacility));
      // Silently fall back to local data without showing error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFacility = (facility) => {
    setSelectedFacility(facility);
  };

  const handleClosePreview = () => {
    setSelectedFacility(null);
  };

  const facilityCounts = useMemo(() => {
    const filtered = facilities.filter((facility) =>
      (filterType === 'All' || facility.type === filterType) &&
      facility.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return {
      all: facilities.length,
      filtered: filtered.length
    };
  }, [facilities, filterType, searchQuery]);

  const visibleFacilities = useMemo(() => {
    return facilities.filter((facility) => {
      const matchesType = filterType === 'All' || facility.type === filterType;
      const matchesQuery = facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        facility.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesQuery;
    });
  }, [facilities, filterType, searchQuery]);

  return (
    <div className={styles.adminShell}>
      <Sidebar role="staff" />

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.title}>
              <h1>Facilities & Rooms</h1>
              <p>Infinity Garden Resort - Staff View</p>
            </div>
          </div>
        </div>

        <div className={styles.actionBar}>
            <div>
              <span>{facilityCounts.filtered} of {facilityCounts.all} facilities</span>
            </div>
            <div className={styles.filters}>
              <select value={filterType} onChange={(event) => setFilterType(event.target.value)}>
                <option value="All">All Types</option>
                {facilityTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Search facility or room"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>

        <div className={styles.container}>
          {error && <div className={styles.errorBanner}>{error}</div>}

          <div className={styles.grid}>
            <div className={styles.listPanel}>
              {isLoading ? (
                <div className={styles.emptyState}>
                  <h3>Loading facilities...</h3>
                </div>
              ) : visibleFacilities.length === 0 ? (
                <div className={styles.emptyState}>
                  <h3>No facilities found</h3>
                  <p>Adjust your search or filters.</p>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Guests</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleFacilities.map((facility) => (
                      <tr key={facility.id} className={selectedFacility?.id === facility.id ? styles.selectedRow : ''}>
                        <td>
                          <button className={styles.tableLink} onClick={() => handleSelectFacility(facility)}>
                            {facility.name}
                          </button>
                        </td>
                        <td>{facility.type}</td>
                        <td>{facility.guests}</td>
                        <td>₱{facility.price.toLocaleString()}</td>
                        <td>
                          <span className={`${styles.statusTag} ${facility.available ? styles.available : styles.unavailable}`}>
                            {facility.available ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                        <td>
                          <button className={styles.previewBtn} onClick={() => handleSelectFacility(facility)}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
          {selectedFacility && (
            <div className={styles.previewBackdrop}>
              <div className={styles.previewModal}>
                <div className={styles.previewHeader}>
                  <div>
                    <p className={styles.previewLabel}>{selectedFacility.type}</p>
                    <h2>{selectedFacility.name}</h2>
                  </div>
                </div>
                <div className={styles.previewContent}>
                  {selectedFacility.img ? (
                    <div className={styles.previewImageWrapper}>
                      <img src={selectedFacility.img} alt={selectedFacility.name} />
                    </div>
                  ) : (
                    <div className={styles.previewNoImage}>No image available</div>
                  )}
                  <div className={styles.previewDetails}>
                    <p>{selectedFacility.description}</p>
                    <div className={styles.previewGrid}>
                    <div><strong>Subtype</strong><span>{selectedFacility.subtype}</span></div>
                    <div><strong>Guests</strong><span>{selectedFacility.guests}</span></div>
                    <div><strong>Size</strong><span>{selectedFacility.size} sqm</span></div>
                    <div><strong>Price</strong><span>₱{selectedFacility.price.toLocaleString()}</span></div>
                    <div><strong>Status</strong><span>{selectedFacility.available ? 'Available' : 'Unavailable'}</span></div>
                    <div><strong>Beds</strong><span>{selectedFacility.beds || 'N/A'}</span></div>
                    <div><strong>Amenities</strong><span>{selectedFacility.amenities.join(', ') || 'None'}</span></div>
                    <div><strong>Features</strong><span>{selectedFacility.features.join(', ') || 'None'}</span></div>
                  </div>
                  </div>
                </div>
                <div className={styles.previewFooter}>
                  <button className={styles.cancelBtn} onClick={handleClosePreview}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
