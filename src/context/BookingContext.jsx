import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { facilitiesAPI, reservationsAPI } from '../utils/api';
import { buildGuestFacilities, getCatalogRoom } from '../utils/facilityHelpers';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [facilities, setFacilities] = useState([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [filter, setFilter] = useState('All');
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const normalizeBooking = useCallback(
    (booking) => {
      if (!booking) return booking;

      const roomId = booking.roomId || booking.room || booking.facility || booking.facility_id;
      const matchedFacility = facilities.find(
        (facility) =>
          String(facility.backendId ?? facility.id) === String(roomId) ||
          String(facility.publicId) === String(roomId) ||
          String(facility.externalId) === String(booking.externalId)
      );
      const catalogRoom = getCatalogRoom(matchedFacility || booking);
      const roomPrice = Number(booking.roomPrice ?? matchedFacility?.price ?? catalogRoom?.price ?? 0);
      const checkin = booking.checkin || booking.check_in || '';
      const checkout = booking.checkout || booking.check_out || '';
      const nights = Number(
        booking.nights ??
          (checkin && checkout
            ? Math.max(
                0,
                Math.floor((new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24))
              )
            : 0)
      );
      const subtotal = Number(booking.subtotal ?? roomPrice * nights);
      const tax = Number(booking.tax ?? subtotal * 0.15);
      const total = Number(booking.total ?? subtotal + tax);
      const roomType = booking.roomType || booking.room_type || matchedFacility?.type || catalogRoom?.type || '';
      const isOvernightStay = roomType.toLowerCase().includes('room');

      return {
        ...booking,
        id: booking.id ?? `TEMP-${Date.now()}`,
        reservationId:
          booking.reservationId ||
          booking.reservation_id ||
          booking.booking_id ||
          booking.id ||
          `TEMP-${Date.now()}`,
        roomId: roomId ?? matchedFacility?.id ?? null,
        externalId: matchedFacility?.externalId || catalogRoom?.id || booking.externalId || null,
        roomName:
          booking.roomName ||
          booking.room_name ||
          booking.facility_name ||
          matchedFacility?.name ||
          catalogRoom?.name ||
          'Selected Room',
        roomType,
        roomImg:
          booking.roomImg ||
          booking.room_image ||
          booking.facility_image ||
          matchedFacility?.img ||
          catalogRoom?.img ||
          '',
        roomPrice,
        name: booking.name || booking.guest_full_name || booking.guest_name || '',
        email: booking.email || booking.guest_email || '',
        phone: booking.phone || booking.guest_phone || '',
        checkin,
        checkout,
        guests: Number(booking.guests ?? booking.num_guests ?? matchedFacility?.guests ?? catalogRoom?.guests ?? 1),
        nights,
        unitLabel: booking.unitLabel || (isOvernightStay ? 'night' : 'day'),
        isOvernightStay,
        subtotal,
        tax,
        total,
        status: (booking.status || 'pending').toString().toLowerCase(),
        reviewNotes: booking.reviewNotes || booking.review_notes || '',
      };
    },
    [facilities]
  );

  const loadFacilities = useCallback(async () => {
    setFacilitiesLoading(true);
    try {
      const data = await facilitiesAPI.getAll();
      const list = Array.isArray(data) ? data : data.results ?? [];
        setFacilities(buildGuestFacilities(list));
    } catch (error) {
      console.error('Error loading facilities:', error.message);
      showToast('Failed to load facilities from the booking server.', 'error');
      setFacilities(buildGuestFacilities([]));
    } finally {
      setFacilitiesLoading(false);
    }
  }, [showToast]);

  const loadBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const backendBookings = await reservationsAPI.getMyBookings();
      if (Array.isArray(backendBookings)) {
        setBookings(backendBookings.map(normalizeBooking));
      }
    } catch (error) {
      console.error('Error loading bookings from backend:', error.message);
    }
  }, [normalizeBooking]);

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const addBooking = useCallback(
    (booking) => {
      const normalizedBooking = normalizeBooking(booking);
      setBookings((prev) => [...prev, normalizedBooking]);
      setConfirmedBooking(normalizedBooking);
    },
    [normalizeBooking]
  );

  const cancelBooking = useCallback((id) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b))
    );
  }, []);

  const updateBookingStatus = useCallback((id, newStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
  }, []);

  const submitBooking = useCallback(
    async (reservationData, clientBooking) => {
      try {
        const response = await reservationsAPI.create(reservationData);
        const normalizedBooking = normalizeBooking({
          ...clientBooking,
          ...response,
          status: response.status || clientBooking.status || 'pending',
        });

        setBookings((prev) => [...prev, normalizedBooking]);
        setConfirmedBooking(normalizedBooking);
        return normalizedBooking;
      } catch (error) {
        console.error('Error submitting booking:', error);
        throw error;
      }
    },
    [normalizeBooking]
  );

  const refreshBookings = useCallback(async () => {
    await loadBookings();
  }, [loadBookings]);

  const refreshFacilities = useCallback(async () => {
    await loadFacilities();
  }, [loadFacilities]);

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
        facilities,
        facilitiesLoading,
        refreshFacilities,
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

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used inside <BookingProvider>');
  return ctx;
}
