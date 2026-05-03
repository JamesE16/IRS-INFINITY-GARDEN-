import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { calcNights, calcTotal, todayStr, minCheckout } from '../../utils/helpers';
import styles from "../../styles/BookingForm.module.css";


export default function BookingForm({ room, onPriceChange }) {
  const navigate = useNavigate();
  const { submitBooking, addBooking, showToast } = useBooking();

  const [form, setForm] = useState({
    name:     '',
    email:    '',
    phone:    '',
    address:  '',
    validId:  '',
    checkin:  '',
    checkout: '',
    guests:   '1',
    special:  '',
  });

  const [errors, setErrors] = useState({});

  const fieldLabels = {
    name: 'Full Name',
    email: 'Email Address',
    phone: 'Phone Number',
    address: 'Address',
    validId: 'Valid ID',
    checkin: 'Check-in Date',
    checkout: 'Check-out Date',
    guests: 'Number of Guests',
  };

  // Update field + notify parent of price change
  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);

    // Recalculate summary for parent
    const nights = calcNights(updated.checkin, updated.checkout);
    const { subtotal, tax, total } = calcTotal(room.price, nights);
    onPriceChange({ nights, subtotal, tax, total, guests: updated.guests });
  };

  // Validation
  const validate = () => {
    const errs = {};
    if (!form.name.trim())  errs.name  = 'Full name is required.';
    if (!form.email.trim()) errs.email = 'Email address is required.';
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email.';
    if (!form.phone.trim()) errs.phone = 'Phone number is required.';
    if (!form.address.trim()) errs.address = 'Address is required.';
    if (!form.validId.trim()) errs.validId = 'Valid ID is required.';
    if (!form.checkin)      errs.checkin  = 'Check-in date is required.';
    if (!form.checkout)     errs.checkout = 'Check-out date is required.';
    if (!form.guests)       errs.guests = 'Number of guests is required.';
    if (form.checkin && form.checkout && new Date(form.checkout) <= new Date(form.checkin)) {
      errs.checkout = 'Check-out must be after check-in.';
    }
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const missingFields = Object.keys(errs).map((key) => fieldLabels[key] || key);
      showToast(`Please complete: ${missingFields.join(', ')}`, 'error');
      return;
    }

    const nights = calcNights(form.checkin, form.checkout);
    const { subtotal, tax, total } = calcTotal(room.price, nights);
    const trimmedName = form.name.trim();
    const nameParts = trimmedName.split(/\s+/);
    const firstName = nameParts[0] || trimmedName;
    const lastName = nameParts.slice(1).join(' ') || '-';
    const backendFacilityId =
      typeof room.backendId === 'number'
        ? room.backendId
        : typeof room.backendId === 'string' && /^\d+$/.test(room.backendId)
          ? parseInt(room.backendId, 10)
          : null;

    const clientBooking = {
      roomId:    backendFacilityId ?? room.publicId ?? room.externalId ?? room.id,
      publicId: room.publicId,
      externalId: room.externalId,
      roomName:  room.name,
      roomType:  room.type,
      roomImg:   room.img,
      roomPrice: room.price,
      name:      form.name,
      email:     form.email,
      phone:     form.phone,
      address:   form.address,
      validId:   form.validId,
      checkin:   form.checkin,
      checkout:  form.checkout,
      guests:    parseInt(form.guests, 10),
      nights,
      subtotal,
      tax,
      total,
      special:   form.special,
      status:    'Pending',
      createdAt: new Date().toISOString(),
    };

    if (!backendFacilityId) {
      addBooking(clientBooking);
      showToast('Booking saved locally for this room.', 'success');
      navigate('/booking/confirmed');
      return;
    }

    const reservationPayload = {
      facility: backendFacilityId,
      first_name: firstName,
      last_name: lastName,
      contact: form.phone,
      email: form.email,
      address: form.address,
      valid_id: form.validId,
      check_in: form.checkin,
      check_out: form.checkout,
      num_guests: parseInt(form.guests, 10),
      special_requests: form.special,
      total_amount: total.toFixed(2),
    };

    try {
      await submitBooking(reservationPayload, clientBooking);
      showToast('Booking request submitted. Awaiting admin approval.', 'success');
      navigate('/booking/confirmed');
    } catch (error) {
      showToast(error.message || 'Booking submission failed.', 'error');
    }
  };

  return (
    <div className={styles.card}>
      {/* ── GUEST INFORMATION ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Guest Information</h3>

        <div className={styles.formGroup}>
          <label className={styles.label}>Full Name <span>*</span></label>
          <input
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            type="text"
            name="name"
            placeholder="Justin De Dios"
            value={form.name}
            onChange={handleChange}
          />
          {errors.name && <p className={styles.errorMsg}>{errors.name}</p>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Email Address <span>*</span></label>
          <input
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            type="email"
            name="email"
            placeholder="jahdedios@example.com"
            value={form.email}
            onChange={handleChange}
          />
          {errors.email && <p className={styles.errorMsg}>{errors.email}</p>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Phone Number <span>*</span></label>
          <input
            className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
            type="tel"
            name="phone"
            placeholder="+63 939 043 1835"
            value={form.phone}
            onChange={handleChange}
          />
          {errors.phone && <p className={styles.errorMsg}>{errors.phone}</p>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Address <span>*</span></label>
          <textarea
            className={`${styles.textarea} ${errors.address ? styles.inputError : ''}`}
            name="address"
            placeholder="Street, barangay, city, province"
            rows={3}
            value={form.address}
            onChange={handleChange}
          />
          {errors.address && <p className={styles.errorMsg}>{errors.address}</p>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Valid ID <span>*</span></label>
          <input
            className={`${styles.input} ${errors.validId ? styles.inputError : ''}`}
            type="text"
            name="validId"
            placeholder="Passport, Driver's License, National ID"
            value={form.validId}
            onChange={handleChange}
          />
          {errors.validId && <p className={styles.errorMsg}>{errors.validId}</p>}
        </div>
      </section>

      {/* ── STAY DETAILS ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Stay Details</h3>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Check-in Date <span>*</span></label>
            <div className={styles.inputWrapper}>
              <input
                className={`${styles.input} ${errors.checkin ? styles.inputError : ''}`}
                type="date"
                name="checkin"
                min={todayStr()}
                value={form.checkin}
                onChange={handleChange}
              />
              <span className={styles.inputIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8"  y1="2" x2="8"  y2="6"/>
                  <line x1="3"  y1="10" x2="21" y2="10"/>
                </svg>
              </span>
            </div>
            {errors.checkin && <p className={styles.errorMsg}>{errors.checkin}</p>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Check-out Date <span>*</span></label>
            <div className={styles.inputWrapper}>
              <input
                className={`${styles.input} ${errors.checkout ? styles.inputError : ''}`}
                type="date"
                name="checkout"
                min={minCheckout(form.checkin)}
                value={form.checkout}
                onChange={handleChange}
              />
              <span className={styles.inputIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8"  y1="2" x2="8"  y2="6"/>
                  <line x1="3"  y1="10" x2="21" y2="10"/>
                </svg>
              </span>
            </div>
            {errors.checkout && <p className={styles.errorMsg}>{errors.checkout}</p>}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Number of Guests <span>*</span></label>
          <div className={styles.inputWrapper}>
            <select
              className={`${styles.select} ${errors.guests ? styles.inputError : ''}`}
              name="guests"
              value={form.guests}
              onChange={handleChange}
            >
              {Array.from({ length: room.guests }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} Guest{i > 0 ? 's' : ''}
                </option>
              ))}
            </select>
            <span className={styles.inputIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </span>
          </div>
          {errors.guests && <p className={styles.errorMsg}>{errors.guests}</p>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Special Requests <span className={styles.optional}>(Optional)</span></label>
          <textarea
            className={styles.textarea}
            name="special"
            placeholder="Any special requests or requirements..."
            rows={4}
            value={form.special}
            onChange={handleChange}
          />
        </div>
      </section>

      {/* ── CANCELLATION NOTICE ── */}
      <div className={styles.notice}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9"  x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div>
          <strong>Cancellation Policy</strong>
          <p>Free cancellation up to 48 hours before check-in. After that, a cancellation fee of one night's stay will be charged.</p>
        </div>
      </div>

      {/* ── SUBMIT ── */}
      <button className={styles.confirmBtn} onClick={handleSubmit}>
        Confirm Booking
      </button>
    </div>
  );
}
