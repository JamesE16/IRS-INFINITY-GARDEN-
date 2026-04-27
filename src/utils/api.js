/**
 * API Service — Handles all communication with Django backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// ============================================================
// AUTHENTICATION
// ============================================================

export const authAPI = {
  register: async (email, password, firstName, lastName) => {
    const response = await fetch(`${API_BASE_URL}/users/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        role: 'client'
      })
    });
    return response.json();
  },

  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/users/me/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${email}:${password}`)}`
      }
    });
    return response.json();
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/users/me/`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Not authenticated');
    return response.json();
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/api-auth/logout/`, {
      method: 'POST',
      credentials: 'include'
    });
    return response.ok;
  }
};

// ============================================================
// FACILITIES / ROOMS
// ============================================================

export const facilitiesAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/facilities/`, {
      credentials: 'include'
    });
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/facilities/${id}/`, {
      credentials: 'include'
    });
    return response.json();
  },

  getAvailable: async (checkIn, checkOut, type = 'All') => {
    const params = new URLSearchParams({
      check_in: checkIn,
      check_out: checkOut,
      type: type
    });

    const response = await fetch(
      `${API_BASE_URL}/facilities/available/?${params}`,
      { credentials: 'include' }
    );

    return response.json();
  },

  // NEW: Check availability for a single facility (real-time)
  checkAvailability: async (id, checkIn, checkOut) => {
    const response = await fetch(
      `${API_BASE_URL}/facilities/${id}/?check_in=${checkIn}&check_out=${checkOut}`,
      { credentials: 'include' }
    );
    return response.json();
  },

  // NEW: Batch check multiple facilities
  checkMultipleAvailability: async (facilityIds) => {
    const response = await fetch(
      `${API_BASE_URL}/facilities/check_availability/?ids=${facilityIds.join(',')}`,
      { credentials: 'include' }
    );
    return response.json();
  },

  create: async (facilityData) => {
    const response = await fetch(`${API_BASE_URL}/facilities/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(facilityData)
    });
    return response.json();
  },

  update: async (id, facilityData) => {
    const response = await fetch(`${API_BASE_URL}/facilities/${id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(facilityData)
    });
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/facilities/${id}/`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return response.ok;
  }
};


// ============================================================
// RESERVATIONS
// ============================================================

export const reservationsAPI = {
  create: async (reservationData) => {
    const response = await fetch(`${API_BASE_URL}/reservations/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(reservationData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create reservation');
    }
    return response.json();
  },

  getMyBookings: async () => {
    const response = await fetch(`${API_BASE_URL}/reservations/my_bookings/`, {
      credentials: 'include'
    });
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/`, {
      credentials: 'include'
    });
    return response.json();
  },

  cancel: async (id) => {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/cancel/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return response.json();
  },

  // Admin endpoints
  getPending: async () => {
    const response = await fetch(`${API_BASE_URL}/reservations/pending/`, {
      credentials: 'include'
    });
    return response.json();
  },

  approve: async (id, reviewNotes, status = 'approved') => {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/approve/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        status,
        review_notes: reviewNotes
      })
    });
    return response.json();
  },

  getByDateRange: async (startDate, endDate) => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    const response = await fetch(`${API_BASE_URL}/reservations/by_date_range/?${params}`, {
      credentials: 'include'
    });
    return response.json();
  }
};

// ============================================================
// ADMIN FEATURES
// ============================================================

export const adminAPI = {
  // User Management
  getAllUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      credentials: 'include'
    });
    return response.json();
  },

  createStaffUser: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/users/create_staff/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  setUserRole: async (userId, role) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/set_role/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role })
    });
    return response.json();
  },

  // Reports
  getReservationSummary: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await fetch(`${API_BASE_URL}/reports/reservation_summary/?${params}`, {
      credentials: 'include'
    });
    return response.json();
  },

  getFacilityUtilization: async () => {
    const response = await fetch(`${API_BASE_URL}/reports/facility_utilization/`, {
      credentials: 'include'
    });
    return response.json();
  },

  getGuestReport: async () => {
    const response = await fetch(`${API_BASE_URL}/reports/guest_report/`, {
      credentials: 'include'
    });
    return response.json();
  },

  // Payments
  getPayments: async (status = null) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    const response = await fetch(`${API_BASE_URL}/payments/by_status/?${params}`, {
      credentials: 'include'
    });
    return response.json();
  },

  getFeedbacks: async (status = 'all', search = '') => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const response = await fetch(`${API_BASE_URL}/feedbacks/?${params}`, {
      credentials: 'include'
    });
    return response.json();
  },

  getFeedbackById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/feedbacks/${id}/`, {
      credentials: 'include'
    });
    return response.json();
  },

  updateFeedbackStatus: async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/feedbacks/${id}/update_status/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    return response.json();
  }
,
  // Transaction Logs
  getTransactionLogs: async (action = null) => {
    const params = new URLSearchParams();
    if (action) params.append('action', action);
    
    const response = await fetch(`${API_BASE_URL}/transactions/by_action/?${params}`, {
      credentials: 'include'
    });
    return response.json();
  }
};

export default {
  authAPI,
  facilitiesAPI,
  reservationsAPI,
  adminAPI
};
