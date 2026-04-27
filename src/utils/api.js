/**
 * API Service — Handles all communication with Django backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// ✅ Helper function for auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

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
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }
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
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error('Login failed');
    }
    
    const data = await response.json();
    
    // ✅ STORE TOKEN
    if (data.token) {
      localStorage.setItem('access_token', data.token);
    } else if (data.auth_token) {
      localStorage.setItem('access_token', data.auth_token);
    }
    
    console.log('✅ Login successful, token stored:', localStorage.getItem('access_token'));
    
    return data;
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/users/me/`, {
      method: 'GET',
      credentials: 'include',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Not authenticated');
    return response.json();
  },

  logout: async () => {
    localStorage.removeItem('access_token');
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
      credentials: 'include',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch facilities');
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/facilities/${id}/`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch facility');
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
      { 
        credentials: 'include',
        headers: getAuthHeaders()
      }
    );

    if (!response.ok) throw new Error('Failed to fetch available facilities');
    return response.json();
  },

  checkAvailability: async (id, checkIn, checkOut) => {
    const response = await fetch(
      `${API_BASE_URL}/facilities/${id}/?check_in=${checkIn}&check_out=${checkOut}`,
      { 
        credentials: 'include',
        headers: getAuthHeaders()
      }
    );
    if (!response.ok) throw new Error('Failed to check availability');
    return response.json();
  },

  create: async (facilityData) => {
    const response = await fetch(`${API_BASE_URL}/facilities/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(facilityData)
    });
    if (!response.ok) throw new Error('Failed to create facility');
    return response.json();
  },

  update: async (id, facilityData) => {
    const response = await fetch(`${API_BASE_URL}/facilities/${id}/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(facilityData)
    });
    if (!response.ok) throw new Error('Failed to update facility');
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/facilities/${id}/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders()
    });
    return response.ok;
  }
};

// ============================================================
// RESERVATIONS
// ============================================================

export const reservationsAPI = {
  create: async (reservationData) => {
    console.log('📤 Creating reservation with data:', reservationData);
    const response = await fetch(`${API_BASE_URL}/reservations/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(reservationData)
    });
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Reservation error:', error);
      throw new Error(error.error || JSON.stringify(error) || 'Failed to create reservation');
    }
    const data = await response.json();
    console.log('✅ Reservation created:', data);
    return data;
  },

  getMyBookings: async () => {
    const token = localStorage.getItem('access_token');
    console.log('🔍 Getting my bookings with token:', token ? 'EXISTS' : 'MISSING');
    
    const response = await fetch(`${API_BASE_URL}/reservations/my_bookings/`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      console.error('❌ My bookings error:', response.status, response.statusText);
      throw new Error(`Failed to fetch bookings: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ My bookings:', data);
    return data;
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch reservation');
    return response.json();
  },

  cancel: async (id) => {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/cancel/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to cancel reservation');
    return response.json();
  },

  getPending: async () => {
    const response = await fetch(`${API_BASE_URL}/reservations/pending/`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch pending reservations');
    return response.json();
  },

  approve: async (id, reviewNotes, status = 'approved') => {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/approve/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        status,
        review_notes: reviewNotes
      })
    });
    if (!response.ok) throw new Error('Failed to approve reservation');
    return response.json();
  },

  getByDateRange: async (startDate, endDate) => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    const response = await fetch(`${API_BASE_URL}/reservations/by_date_range/?${params}`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch reservations');
    return response.json();
  }
};

// ============================================================
// ADMIN FEATURES
// ============================================================

export const adminAPI = {
  getAllUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  createStaffUser: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/users/create_staff/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Failed to create staff user');
    return response.json();
  },

  setUserRole: async (userId, role) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/set_role/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ role })
    });
    if (!response.ok) throw new Error('Failed to set user role');
    return response.json();
  },

  getReservationSummary: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await fetch(`${API_BASE_URL}/reports/reservation_summary/?${params}`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch reservation summary');
    return response.json();
  },

  getFacilityUtilization: async () => {
    const response = await fetch(`${API_BASE_URL}/reports/facility_utilization/`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch facility utilization');
    return response.json();
  },

  getGuestReport: async () => {
    const response = await fetch(`${API_BASE_URL}/reports/guest_report/`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch guest report');
    return response.json();
  },

  getPayments: async (status = null) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    const response = await fetch(`${API_BASE_URL}/payments/by_status/?${params}`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch payments');
    return response.json();
  },

  getFeedbacks: async (status = 'all', search = '') => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const response = await fetch(`${API_BASE_URL}/feedbacks/?${params}`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch feedbacks');
    return response.json();
  },

  getFeedbackById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/feedbacks/${id}/`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch feedback');
    return response.json();
  },

  createFeedback: async (feedbackData) => {
    const response = await fetch(`${API_BASE_URL}/feedbacks/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(feedbackData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to submit feedback');
    }
    return response.json();
  },

  updateFeedbackStatus: async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/feedbacks/${id}/update_status/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update feedback status');
    return response.json();
  },

  getTransactionLogs: async (action = null) => {
    const params = new URLSearchParams();
    if (action) params.append('action', action);
    
    const response = await fetch(`${API_BASE_URL}/transactions/by_action/?${params}`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch transaction logs');
    return response.json();
  }
};

export default {
  authAPI,
  facilitiesAPI,
  reservationsAPI,
  adminAPI
};