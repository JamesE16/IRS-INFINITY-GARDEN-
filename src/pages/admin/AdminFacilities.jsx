import { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
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

export default function AdminFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [editedFacility, setEditedFacility] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState({
    name: '',
    type: 'Room',
    subtype: 'Standard',
    description: '',
    guests: '0',
    size: '0',
    beds: '',
    price: '0',
    available: true,
    amenities: '',
    features: '',
    img: ''
  });

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
      setError('Backend offline or API unavailable. Using local room dataset.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEditedFacility(null);
    setForm({
      name: '',
      type: 'Room',
      subtype: 'Standard',
      description: '',
      guests: '0',
      size: '0',
      beds: '',
      price: '0',
      available: true,
      amenities: '',
      features: '',
      img: ''
    });
  };

  const handleInput = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectFacility = (facility) => {
    setSelectedFacility(facility);
  };

  const handleEditFacility = (facility) => {
    setEditedFacility(facility);
    setShowForm(true);
    setSelectedFacility(null);
    setForm({
      name: facility.name,
      type: facility.type,
      subtype: facility.subtype,
      description: facility.description,
      guests: String(facility.guests),
      size: String(facility.size),
      beds: facility.beds,
      price: String(facility.price),
      available: facility.available,
      amenities: facility.amenities.join(', '),
      features: facility.features.join(', '),
      img: facility.img
    });
  };

  const handleClosePreview = () => {
    setSelectedFacility(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    const payload = {
      name: form.name,
      type: form.type,
      subtype: form.subtype,
      description: form.description,
      guests: Number(form.guests),
      size: Number(form.size),
      beds: form.beds,
      price: Number(form.price),
      available: Boolean(form.available),
      amenities: form.amenities.split(',').map((item) => item.trim()).filter(Boolean),
      features: form.features.split(',').map((item) => item.trim()).filter(Boolean),
      img: form.img
    };

    try {
      let saved;
      if (editedFacility) {
        saved = await facilitiesAPI.update(editedFacility.id, payload);
        setFacilities((prev) => prev.map((facility) =>
          facility.id === editedFacility.id ? normalizeFacility(saved) : facility
        ));
        setSelectedFacility(normalizeFacility(saved));
      } else {
        saved = await facilitiesAPI.create(payload);
        setFacilities((prev) => [normalizeFacility(saved), ...prev]);
      }
      setError(null);
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error(err);
      setError('Unable to save facility. Please check your backend connection or try again later.');
    } finally {
      setIsSaving(false);
    }
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
      <AdminSidebar />

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.pageHeader}>
            <div className={styles.title}>
              <h1>Facilities & Room Management</h1>
              <p>Manage facility listings, room details, and availability for the resort.</p>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.addBtn} onClick={() => { resetForm(); setShowForm(true); }}>
                + Add Facility
              </button>
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
        </div>

        <div className={styles.container}>
          {error && <div className={styles.errorBanner}>{error}</div>}

          <div className={styles.grid}>
            <div className={styles.listPanel}>
              {isLoading ? (
                <div className={styles.emptyState}>
                  <h3>Loading facilities…</h3>
                </div>
              ) : visibleFacilities.length === 0 ? (
                <div className={styles.emptyState}>
                  <h3>No facilities found</h3>
                  <p>Adjust your search or add a new facility.</p>
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
                      <th>Preview</th>
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
                  <button className={styles.editPreviewBtn} onClick={() => handleEditFacility(selectedFacility)}>
                    Edit
                  </button>
                  <button className={styles.cancelBtn} onClick={handleClosePreview}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          {showForm && (
            <div className={styles.modalBackdrop}>
              <div className={styles.modal}>
                <div className={styles.modalHeader}>
                  <h2>{editedFacility ? 'Edit Facility' : 'Add Facility'}</h2>
                  <button className={styles.closeBtn} onClick={() => { setShowForm(false); resetForm(); }}>
                    ×
                  </button>
                </div>
                <form className={styles.formGrid} onSubmit={handleSubmit}>
                  <div className={styles.field}>
                    <label>Name</label>
                    <input value={form.name} onChange={(event) => handleInput('name', event.target.value)} required />
                  </div>
                  <div className={styles.field}>
                    <label>Type</label>
                    <select value={form.type} onChange={(event) => handleInput('type', event.target.value)}>
                      {facilityTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label>Subtype</label>
                    <input value={form.subtype} onChange={(event) => handleInput('subtype', event.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label>Price</label>
                    <input type="number" min="0" value={form.price} onChange={(event) => handleInput('price', event.target.value)} required />
                  </div>
                  <div className={styles.field}>
                    <label>Guests</label>
                    <input type="number" min="1" value={form.guests} onChange={(event) => handleInput('guests', event.target.value)} required />
                  </div>
                  <div className={styles.field}>
                    <label>Size (sqm)</label>
                    <input type="number" min="0" value={form.size} onChange={(event) => handleInput('size', event.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label>Beds</label>
                    <input value={form.beds} onChange={(event) => handleInput('beds', event.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label>Available</label>
                    <select value={String(form.available)} onChange={(event) => handleInput('available', event.target.value === 'true')}>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div className={styles.fieldWide}>
                    <label>Description</label>
                    <textarea rows="3" value={form.description} onChange={(event) => handleInput('description', event.target.value)} />
                  </div>
                  <div className={styles.fieldWide}>
                    <label>Amenities (comma separated)</label>
                    <input value={form.amenities} onChange={(event) => handleInput('amenities', event.target.value)} />
                  </div>
                  <div className={styles.fieldWide}>
                    <label>Features (comma separated)</label>
                    <input value={form.features} onChange={(event) => handleInput('features', event.target.value)} />
                  </div>
                  <div className={styles.fieldWide}>
                    <label>Image URL</label>
                    <input value={form.img} onChange={(event) => handleInput('img', event.target.value)} />
                  </div>
                  <div className={styles.formActions}>
                    <button type="button" className={styles.cancelBtn} onClick={() => { setShowForm(false); resetForm(); }}>
                      Cancel
                    </button>
                    <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                      {isSaving ? 'Saving…' : editedFacility ? 'Save Changes' : 'Add Facility'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
