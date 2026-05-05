const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const CSRF_SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

const getCookie = (name) => {
  const match = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
};

const ensureCsrfCookie = async () => {
  const existingToken = getCookie('csrftoken');
  if (existingToken) {
    return existingToken;
  }

  const response = await fetch(`${API_BASE_URL}/users/csrf/`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to initialize CSRF protection');
  }

  const csrfToken = getCookie('csrftoken');
  if (!csrfToken) {
    throw new Error('CSRF token cookie was not set by the server');
  }

  return csrfToken;
};

const getAuthHeaders = async (method = 'GET') => {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!CSRF_SAFE_METHODS.has(method.toUpperCase())) {
    headers['X-CSRFToken'] = await ensureCsrfCookie();
  }

  return headers;
};

const apiRequest = async (path, options = {}) => {
  const method = options.method || 'GET';
  const headers = await getAuthHeaders(method);

  return fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    method,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });
};

export const authAPI = {
  register: async (email, password, firstName, lastName) => {
    const response = await apiRequest('/users/register/', {
      method: 'POST',
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        role: 'client',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
  },

  login: async (email, password) => {
    const response = await apiRequest('/users/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();

    if (data.token) {
      localStorage.setItem('access_token', data.token);
    } else if (data.auth_token) {
      localStorage.setItem('access_token', data.auth_token);
    }

    return data;
  },

  getCurrentUser: async () => {
    const response = await apiRequest('/users/me/');
    if (!response.ok) throw new Error('Not authenticated');
    return response.json();
  },

  logout: async () => {
    const response = await apiRequest('/users/logout/', {
      method: 'POST',
    });
    localStorage.removeItem('access_token');
    return response.ok;
  },
};

export const facilitiesAPI = {
  getAll: async () => {
    const response = await apiRequest('/facilities/');
    if (!response.ok) throw new Error('Failed to fetch facilities');
    return response.json();
  },

  getById: async (id) => {
    const response = await apiRequest(`/facilities/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch facility');
    return response.json();
  },

  getAvailable: async (checkIn, checkOut, type = 'All') => {
    const params = new URLSearchParams({
      check_in: checkIn,
      check_out: checkOut,
      type,
    });

    const response = await apiRequest(`/facilities/available/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch available facilities');
    return response.json();
  },

  checkAvailability: async (id, checkIn, checkOut) => {
    const response = await apiRequest(
      `/facilities/${id}/?check_in=${checkIn}&check_out=${checkOut}`
    );
    if (!response.ok) throw new Error('Failed to check availability');
    return response.json();
  },

  create: async (facilityData) => {
    const response = await apiRequest('/facilities/', {
      method: 'POST',
      body: JSON.stringify(facilityData),
    });
    if (!response.ok) throw new Error('Failed to create facility');
    return response.json();
  },

  update: async (id, facilityData) => {
    const response = await apiRequest(`/facilities/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(facilityData),
    });
    if (!response.ok) throw new Error('Failed to update facility');
    return response.json();
  },

  delete: async (id) => {
    const response = await apiRequest(`/facilities/${id}/`, {
      method: 'DELETE',
    });
    return response.ok;
  },
};

export const reservationsAPI = {
  create: async (reservationData) => {
    const response = await apiRequest('/reservations/', {
      method: 'POST',
      body: JSON.stringify(reservationData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || JSON.stringify(error) || 'Failed to create reservation');
    }

    return response.json();
  },

  getAll: async () => {
    const response = await apiRequest('/reservations/');
    if (!response.ok) {
      throw new Error(`Failed to fetch reservations: ${response.status}`);
    }
    return response.json();
  },

  getMyBookings: async () => {
    const response = await apiRequest('/reservations/my_bookings/');
    if (!response.ok) {
      throw new Error(`Failed to fetch bookings: ${response.status}`);
    }
    return response.json();
  },

  getById: async (id) => {
    const response = await apiRequest(`/reservations/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch reservation');
    return response.json();
  },

  cancel: async (id) => {
    const response = await apiRequest(`/reservations/${id}/cancel/`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to cancel reservation');
    return response.json();
  },

  getPending: async () => {
    const response = await apiRequest('/reservations/pending/');
    if (!response.ok) throw new Error('Failed to fetch pending reservations');
    return response.json();
  },

  approve: async (id, reviewNotes, status = 'approved') => {
    const response = await apiRequest(`/reservations/${id}/approve/`, {
      method: 'POST',
      body: JSON.stringify({
        status,
        review_notes: reviewNotes,
      }),
    });
    if (!response.ok) throw new Error('Failed to approve reservation');
    return response.json();
  },

  getByDateRange: async (startDate, endDate) => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });

    const response = await apiRequest(`/reservations/by_date_range/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch reservations');
    return response.json();
  },
};

export const adminAPI = {
  getAllUsers: async () => {
    const response = await apiRequest('/users/');
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  createStaffUser: async (userData) => {
    const response = await apiRequest('/users/create_staff/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Failed to create staff user');
    return response.json();
  },

  setUserRole: async (userId, role) => {
    const response = await apiRequest(`/users/${userId}/set_role/`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    if (!response.ok) throw new Error('Failed to set user role');
    return response.json();
  },

  getReservationSummary: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await apiRequest(`/reports/reservation_summary/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch reservation summary');
    return response.json();
  },

  getFacilityUtilization: async () => {
    const response = await apiRequest('/reports/facility_utilization/');
    if (!response.ok) throw new Error('Failed to fetch facility utilization');
    return response.json();
  },

  getGuestReport: async () => {
    const response = await apiRequest('/reports/guest_report/');
    if (!response.ok) throw new Error('Failed to fetch guest report');
    return response.json();
  },

  getPayments: async (status = null) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const response = await apiRequest(`/payments/by_status/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch payments');
    return response.json();
  },

  getFeedbacks: async (status = 'all', search = '') => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const response = await apiRequest(`/feedbacks/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch feedbacks');
    return response.json();
  },

  getFeedbackById: async (id) => {
    const response = await apiRequest(`/feedbacks/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch feedback');
    return response.json();
  },

  createFeedback: async (feedbackData) => {
    const response = await apiRequest('/feedbacks/', {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to submit feedback');
    }
    return response.json();
  },

  updateFeedbackStatus: async (id, status) => {
    const response = await apiRequest(`/feedbacks/${id}/update_status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update feedback status');
    return response.json();
  },

  getTransactionLogs: async (action = null) => {
    const params = new URLSearchParams();
    if (action) params.append('action', action);

    const response = await apiRequest(`/transactions/by_action/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch transaction logs');
    return response.json();
  },
};

export default {
  authAPI,
  facilitiesAPI,
  reservationsAPI,
  adminAPI,
};
