import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { reservationsAPI } from '../utils/api';

// ============================================================
//  BOOKING CONTEXT — Global state for bookings, room selection,
//  filter, and toast notifications
// ============================================================

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  // ── Bookings (persisted in localStorage) ──────────────────
  const [bookings, setBookings] = useState(() => {
    try {
      const stored = localStorage.getItem('ig_bookings');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('ig_bookings', JSON.stringify(bookings));
  }, [bookings]);

  // ── Selected room (for detail / booking flow) ──────────────
  const [selectedRoom, setSelectedRoom] = useState(null);

  // ── Latest confirmed booking (for confirmed page) ──────────
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // ── Room filter on /rooms page ─────────────────────────────
  const [filter, setFilter] = useState('All');

  // ── Toast notification ─────────────────────────────────────
  const [toast, setToast] = useState(null); // { msg, type: 'success'|'error' }

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  // ── Actions ────────────────────────────────────────���───────
  const addBooking = useCallback((booking) => {
    setBookings((prev) => [...prev, booking]);
    setConfirmedBooking(booking);
  }, []);

  const cancelBooking = useCallback((id) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b))
    );
  }, []);

  // ── Update booking status (for admin/staff approval) ────────
  const updateBookingStatus = useCallback((id, newStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
  }, []);

  // ── Load bookings from backend when available ───────────────
  const loadBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔍 BookingContext: Loading bookings, token exists:', !!token);
      
      if (!token) {
        console.log('⚠️ No token found, skipping backend bookings load');
        return;
      }

      const backendBookings = await reservationsAPI.getMyBookings();
      if (Array.isArray(backendBookings)) {
        console.log('✅ Loaded', backendBookings.length, 'bookings from backend');
        setBookings(backendBookings);
      }
    } catch (error) {
      console.error('❌ Error loading bookings from backend:', error.message);
      // Keep local bookings if backend fails
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const submitBooking = useCallback(async (reservationData, clientBooking) => {
    try {
      console.log('📤 Submitting booking...');
      const response = await reservationsAPI.create(reservationData);
      
      const mergedBooking = {
        ...clientBooking,
        ...response,
        status: response.status || clientBooking.status || 'Pending',
      };

      console.log('✅ Booking submitted successfully:', mergedBooking);
      setBookings((prev) => [...prev, mergedBooking]);
      setConfirmedBooking(mergedBooking);
      return mergedBooking;
    } catch (error) {
      console.error('❌ Error submitting booking:', error);
      throw error;
    }
  }, []);

  const refreshBookings = useCallback(async () => {
    console.log('🔄 Refreshing bookings...');
    await loadBookings();
  }, [loadBookings]);

  // ── Check if room is reserved (USED IN UI) ────────────────
  const isRoomReserved = useCallback(
    (roomId) => {
      return bookings.some((b) => {
        const bookingRoomId = b.room || b.roomId || b.facility || b.facility_id;
        const status = (b.status || '').toString().toLowerCase();

        return (
          parseInt(bookingRoomId, 10) === parseInt(roomId, 10) &&
          (status === 'approved' || status === 'confirmed' || status === 'checked_in')
        );
      });
    },
    [bookings]
  );

  return (
    <BookingContext.Provider
      value={{
        bookings,
        selectedRoom,
        setSelectedRoom,
        confirmedBooking,
        setConfirmedBooking,
        filter,
        setFilter,
        toast,
        showToast,
        addBooking,
        cancelBooking,
        updateBookingStatus,
        submitBooking,
        refreshBookings,
        isRoomReserved,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

// Custom hook — throws if used outside provider
export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used inside <BookingProvider>');
  return ctx;
}