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

  // ── Actions ────────────────────────────────────────────────
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
      const backendBookings = await reservationsAPI.getMyBookings();
      if (Array.isArray(backendBookings)) {
        setBookings(backendBookings);
      }
    } catch {
      // Backend unavailable or user not authenticated, keep local bookings
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const submitBooking = useCallback(async (reservationData, clientBooking) => {
    try {
      const response = await reservationsAPI.create(reservationData);
      const mergedBooking = {
        ...clientBooking,
        ...response,
        status: response.status || clientBooking.status || 'Pending',
      };

      setBookings((prev) => [...prev, mergedBooking]);
      setConfirmedBooking(mergedBooking);
      return mergedBooking;
    } catch (error) {
      throw error;
    }
  }, []);

  const refreshBookings = useCallback(async () => {
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
          status === 'approved'
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



//WITH BACKEND (Dynamic Reserved State) — replace bookings state with API calls
/*import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {

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

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [filter, setFilter] = useState('All');
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const isRoomAvailable = (roomId, checkIn, checkOut) => {
    return !bookings.some(b => {
      if (b.room !== roomId || b.status !== "Approved") return false;

      const existingStart = new Date(b.checkIn);
      const existingEnd = new Date(b.checkOut);
      const newStart = new Date(checkIn);
      const newEnd = new Date(checkOut);

      return newStart <= existingEnd && newEnd >= existingStart;
    });
  };

  const calculateTotal = (price, checkIn, checkOut) => {
    const days =
      (new Date(checkOut) - new Date(checkIn)) /
      (1000 * 60 * 60 * 24);

    return days * price;
  };

  const addBooking = (booking) => {
    const newBooking = {
      ...booking,
      id: Date.now(),
      status: "Pending"
    };

    setBookings(prev => [...prev, newBooking]);
    setConfirmedBooking(newBooking);
  };

  const cancelBooking = (id) => {
    setBookings(prev =>
      prev.map(b =>
        b.id === id ? { ...b, status: "Cancelled" } : b
      )
    );
  };

  const isRoomReserved = (roomId) => {
    return bookings.some(
      b => b.room === roomId && b.status === "Approved"
    );
  };

  const submitBooking = async (bookingData) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/reservations/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bookingData)
      });

      const data = await res.json();

      addBooking(data);
      showToast("Booking submitted!");
    } catch {
      showToast("Booking failed", "error");
    }
  };

  return (
    <BookingContext.Provider value={{
      bookings,
      selectedRoom,
      setSelectedRoom,
      confirmedBooking,
      filter,
      setFilter,
      toast,
      showToast,
      addBooking,
      cancelBooking,
      isRoomAvailable,
      calculateTotal,
      isRoomReserved,
      submitBooking
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export const useBooking = () => useContext(BookingContext);*/ 