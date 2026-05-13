import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useBooking } from '../../context/BookingContext';
import { calcNights, calcTotal } from '../../utils/helpers';
import { reservationsAPI } from '../../utils/api';
import styles from '../../styles/BookingForm.module.css';

function expandBlockedDates(ranges) {
  const blocked = [];
  for (const { check_in, check_out } of ranges) {
    const start = new Date(check_in + 'T00:00:00');
    const end   = new Date(check_out + 'T00:00:00');
    const cur   = new Date(start);
    while (cur < end) {
      blocked.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
  }
  return blocked;
}

// ─── Receipt Uploader ─────────────────────────────────────────────────────────
function ReceiptUploader({ value, onChange, error }) {
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) { alert('Please upload JPG, PNG, WEBP, or PDF.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('File must be under 5 MB.'); return; }
    onChange(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview('pdf');
    }
  };

  return (
    <div
      className={`${styles.receiptZone} ${dragging ? styles.receiptZoneDrag : ''} ${error ? styles.inputError : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
    >
      {preview ? (
        <div className={styles.receiptPreview}>
          {preview === 'pdf' ? (
            <div className={styles.pdfBadge}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span>{value?.name}</span>
            </div>
          ) : (
            <img src={preview} alt="Receipt" className={styles.receiptImg} />
          )}
          <button type="button" className={styles.receiptRemove}
            onClick={() => { onChange(null); setPreview(null); }}>
            Remove
          </button>
        </div>
      ) : (
        <label className={styles.receiptLabel}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span className={styles.receiptText}>
            <strong>Upload receipt</strong><br />Drag & drop or <u>browse</u>
          </span>
          <span className={styles.receiptHint}>JPG, PNG, WEBP or PDF — max 5 MB</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
            style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
        </label>
      )}
    </div>
  );
}

// ─── Main BookingForm ─────────────────────────────────────────────────────────
export default function BookingForm({ room, onPriceChange }) {
  const navigate = useNavigate();
  const { submitBooking, addBooking, showToast } = useBooking();
  const isOvernightStay = (room.type || '').toLowerCase().includes('room');
  const stayUnitLabel = isOvernightStay ? 'night' : 'day';

  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    guests: '1', special: '', paymentMethod: '',
  });

  const [checkinDate,  setCheckinDate]  = useState(null);
  const [checkoutDate, setCheckoutDate] = useState(null);
  const [blockedDates, setBlockedDates] = useState([]);
  const [receiptFile,  setReceiptFile]  = useState(null);
  const [errors,       setErrors]       = useState({});

  // Fetch approved reservations and expand into blocked dates
  useEffect(() => {
    if (!room?.backendId) return;
    reservationsAPI
      .getApprovedDates(room.backendId)
      .then((data) => setBlockedDates(expandBlockedDates(Array.isArray(data) ? data : data.results ?? [])))
      .catch(() => setBlockedDates([]));
  }, [room?.backendId]);

  const toDateStr = (d) => (d ? d.toISOString().split('T')[0] : '');
  const addDays = (date, days) => {
    if (!date) return null;
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  };

  const recalc = (cin, cout, guests) => {
    const nights = isOvernightStay
      ? calcNights(toDateStr(cin), toDateStr(cout))
      : cin ? 1 : 0;
    const { subtotal, tax, total } = calcTotal(room.price, nights);
    onPriceChange({ nights, subtotal, tax, total, guests, unitLabel: stayUnitLabel });
  };

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    recalc(checkinDate, checkoutDate, updated.guests);
  };

  const handleCheckinChange = (date) => {
    setCheckinDate(date);
    if (!isOvernightStay) {
      setCheckoutDate(date ? addDays(date, 1) : null);
      recalc(date, date ? addDays(date, 1) : null, form.guests);
      setErrors((p) => ({ ...p, checkin: null, checkout: null }));
      return;
    }

    if (checkoutDate && date && checkoutDate <= date) {
      setCheckoutDate(null);
      onPriceChange({ nights: 0, subtotal: 0, tax: 0, total: 0, guests: form.guests });
    } else {
      recalc(date, checkoutDate, form.guests);
    }
    setErrors((p) => ({ ...p, checkin: null }));
  };

  const handleCheckoutChange = (date) => {
    setCheckoutDate(date);
    recalc(checkinDate, date, form.guests);
    setErrors((p) => ({ ...p, checkout: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())    errs.name          = 'Full name is required.';
    if (!form.email.trim())   errs.email         = 'Email address is required.';
    if (!form.phone.trim())   errs.phone         = 'Phone number is required.';
    if (!form.address.trim()) errs.address       = 'Address is required.';
    if (!checkinDate)         errs.checkin       = isOvernightStay ? 'Check-in date is required.' : 'Booking date is required.';
    if (isOvernightStay && !checkoutDate) errs.checkout = 'Check-out date is required.';
    if (!form.guests)         errs.guests        = 'Number of guests is required.';
    if (!form.paymentMethod)  errs.paymentMethod = 'Please select a payment method.';
    if (!receiptFile)         errs.receipt       = 'Please upload your payment receipt.';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const labels = {
        name: 'Full Name', email: 'Email', phone: 'Phone', address: 'Address',
        checkin: isOvernightStay ? 'Check-in' : 'Booking Date', checkout: 'Check-out',
        guests: 'Guests', paymentMethod: 'Payment Method', receipt: 'Receipt',
      };
      showToast(`Please complete: ${Object.keys(errs).map((k) => labels[k]).join(', ')}`, 'error');
      return;
    }

    const checkin  = toDateStr(checkinDate);
    const checkout = toDateStr(isOvernightStay ? checkoutDate : addDays(checkinDate, 1));
    const nights   = isOvernightStay ? calcNights(checkin, checkout) : 1;
    const { subtotal, tax, total } = calcTotal(room.price, nights);
    const nameParts = form.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName  = nameParts.slice(1).join(' ') || '-';

    const backendFacilityId =
      typeof room.backendId === 'number' ? room.backendId
      : typeof room.backendId === 'string' && /^\d+$/.test(room.backendId)
        ? parseInt(room.backendId, 10) : null;

    const clientBooking = {
      roomId: backendFacilityId ?? room.publicId ?? room.id,
      publicId: room.publicId, externalId: room.externalId,
      roomName: room.name, roomType: room.type, roomImg: room.img, roomPrice: room.price,
      name: form.name, email: form.email, phone: form.phone, address: form.address,
      checkin, checkout,
      guests: parseInt(form.guests, 10), nights, subtotal, tax, total,
      special: form.special, paymentMethod: form.paymentMethod,
      status: 'Pending', createdAt: new Date().toISOString(),
    };

    if (!backendFacilityId) {
      addBooking(clientBooking);
      showToast('Booking saved locally.', 'success');
      navigate('/booking/confirmed');
      return;
    }

    const formData = new FormData();
    formData.append('facility',         backendFacilityId);
    formData.append('first_name',       firstName);
    formData.append('last_name',        lastName);
    formData.append('email',            form.email);
    formData.append('contact',          form.phone);
    formData.append('address',          form.address);
    formData.append('check_in',         checkin);
    formData.append('check_out',        checkout);
    formData.append('num_guests',       parseInt(form.guests, 10));
    formData.append('special_requests', form.special);
    formData.append('total_amount',     total.toFixed(2));
    formData.append('payment_method',   form.paymentMethod);
    formData.append('receipt_image',    receiptFile);

    try {
      await submitBooking(formData, clientBooking);
      showToast('Booking submitted. Awaiting admin approval.', 'success');
      navigate('/booking/confirmed');
    } catch (error) {
      showToast(error.message || 'Booking submission failed.', 'error');
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minCheckoutDate = checkinDate
    ? new Date(checkinDate.getTime() + 86400000)
    : new Date(today.getTime() + 86400000);

  return (
    <div className={styles.card}>

      {/* ── GUEST INFORMATION ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Guest Information</h3>

        <div className={styles.formGroup}>
          <label className={styles.label}>Full Name <span>*</span></label>
          <input className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            type="text" name="name" placeholder="Justin De Dios"
            value={form.name} onChange={handleChange} />
          {errors.name && <p className={styles.errorMsg}>{errors.name}</p>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Email Address <span>*</span></label>
          <input className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            type="email" name="email" placeholder="jahdedios@example.com"
            value={form.email} onChange={handleChange} />
          {errors.email && <p className={styles.errorMsg}>{errors.email}</p>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Phone Number <span>*</span></label>
          <input className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
            type="tel" name="phone" placeholder="+63 939 043 1835"
            value={form.phone} onChange={handleChange} />
          {errors.phone && <p className={styles.errorMsg}>{errors.phone}</p>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Address <span>*</span></label>
          <textarea className={`${styles.textarea} ${errors.address ? styles.inputError : ''}`}
            name="address" placeholder="Street, barangay, city, province"
            rows={3} value={form.address} onChange={handleChange} />
          {errors.address && <p className={styles.errorMsg}>{errors.address}</p>}
        </div>

      </section>

      {/* ── STAY DETAILS ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Stay Details</h3>

        <div className={`${styles.row} ${!isOvernightStay ? styles.singleDateRow : ''}`}>
          <div className={styles.formGroup}>
            <label className={styles.label}>{isOvernightStay ? 'Check-in Date' : 'Booking Date'} <span>*</span></label>
            <div className={`${styles.datePickerWrapper} ${errors.checkin ? styles.datePickerError : ''}`}>
              <DatePicker
                selected={checkinDate}
                onChange={handleCheckinChange}
                minDate={today}
                excludeDates={blockedDates}
                placeholderText={isOvernightStay ? 'Select check-in' : 'Select booking date'}
                dateFormat="MMM dd, yyyy"
                className={styles.datePickerInput}
                wrapperClassName={styles.datePickerOuter}
                showPopperArrow={false}
                autoComplete="off"
              />
              <span className={styles.inputIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </span>
            </div>
            {errors.checkin && <p className={styles.errorMsg}>{errors.checkin}</p>}
          </div>

          {isOvernightStay && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Check-out Date <span>*</span></label>
              <div className={`${styles.datePickerWrapper} ${errors.checkout ? styles.datePickerError : ''}`}>
                <DatePicker
                  selected={checkoutDate}
                  onChange={handleCheckoutChange}
                  minDate={minCheckoutDate}
                  excludeDates={blockedDates}
                  placeholderText="Select check-out"
                  dateFormat="MMM dd, yyyy"
                  className={styles.datePickerInput}
                  wrapperClassName={styles.datePickerOuter}
                  showPopperArrow={false}
                  autoComplete="off"
                  disabled={!checkinDate}
                />
                <span className={styles.inputIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </span>
              </div>
              {errors.checkout && <p className={styles.errorMsg}>{errors.checkout}</p>}
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Number of Guests <span>*</span></label>
          <div className={styles.inputWrapper}>
            <select className={`${styles.select} ${errors.guests ? styles.inputError : ''}`}
              name="guests" value={form.guests} onChange={handleChange}>
              {Array.from({ length: room.guests }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1} Guest{i > 0 ? 's' : ''}</option>
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
          <label className={styles.label}>
            Special Requests <span className={styles.optional}>(Optional)</span>
          </label>
          <textarea className={styles.textarea} name="special"
            placeholder="Any special requests or requirements..."
            rows={4} value={form.special} onChange={handleChange} />
        </div>
      </section>

      {/* ── PAYMENT ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Payment</h3>

        <div className={styles.formGroup}>
          <label className={styles.label}>Payment Method <span>*</span></label>
          <div className={styles.paymentOptions}>
            {[
              { value: 'gcash', label: 'GCash', detail: 'Send to 0939 043 1835',
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg> },
              { value: 'bank_transfer', label: 'Bank Transfer', detail: 'BDO / BPI — details sent via email',
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
            ].map(({ value, label, detail, icon }) => (
              <label key={value}
                className={`${styles.paymentCard} ${form.paymentMethod === value ? styles.paymentCardActive : ''}`}>
                <input type="radio" name="paymentMethod" value={value}
                  checked={form.paymentMethod === value} onChange={handleChange}
                  style={{ display: 'none' }} />
                <span className={styles.paymentCardIcon}>{icon}</span>
                <span className={styles.paymentCardContent}>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
                {form.paymentMethod === value && <span className={styles.paymentCheck}>✓</span>}
              </label>
            ))}
          </div>
          {errors.paymentMethod && <p className={styles.errorMsg}>{errors.paymentMethod}</p>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Payment Receipt <span>*</span>
            <span className={styles.optional}> — screenshot or PDF of your payment</span>
          </label>
          <ReceiptUploader value={receiptFile} onChange={setReceiptFile} error={!!errors.receipt} />
          {errors.receipt && <p className={styles.errorMsg}>{errors.receipt}</p>}
        </div>
      </section>

      {/* ── CANCELLATION NOTICE ── */}
      <div className={styles.notice}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div>
          <strong>Cancellation Policy</strong>
          <p>Free cancellation up to 48 hours before check-in. After that, a cancellation fee of one night's stay will be charged.</p>
        </div>
      </div>

      <button className={styles.confirmBtn} onClick={handleSubmit}>
        Confirm Booking
      </button>
    </div>
  );
}
