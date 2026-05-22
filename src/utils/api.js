const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const CSRF_SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

const getCookie = (name) => {
  const match = document.cookie.
  split('; ').
  find((cookie) => cookie.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
};

const ensureCsrfCookie = async () => {
  const existingToken = getCookie('csrftoken');
  if (existingToken) {
    return existingToken;
  }

  const response = await fetch(`${API_BASE_URL}/users/csrf/`, {
    method: 'GET',
    credentials: 'include'
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
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  if (!CSRF_SAFE_METHODS.has(method.toUpperCase())) {
    headers['X-CSRFToken'] = await ensureCsrfCookie();
  }

  return headers;
};

const apiRequest = async (path, options = {}, _isRetry = false) => {
  const method = options.method || 'GET';
  const headers = await getAuthHeaders(method);
  const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (!isFormDataBody && !('Content-Type' in (options.headers || {}))) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    method,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  });


  if (response.status === 401 && !_isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest(path, options, true);
    }
  }

  return response;
};

const readErrorPayload = async (response, fallbackMessage) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const error = await response.json();
    return (
      error?.detail ||
      error?.error ||
      error?.message ||
      JSON.stringify(error) ||
      fallbackMessage);

  }

  const text = await response.text();

  if (text.includes('<!DOCTYPE') || text.includes('<html')) {
    return `${fallbackMessage} The server returned an HTML error page instead of JSON. If you just changed the backend models, run Django migrations and restart the backend server.`;
  }

  return text || fallbackMessage;
};





let _isRefreshing = false;
export const refreshAccessToken = async () => {
  if (_isRefreshing) return false;
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;

  _isRefreshing = true;
  try {
    const res = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken })
    });
    if (!res.ok) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return false;
    }
    const data = await res.json();
    localStorage.setItem('access_token', data.access);
    if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
    return true;
  } catch {
    return false;
  } finally {
    _isRefreshing = false;
  }
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
        role: 'client'
      })
    });

    if (!response.ok) {
      throw new Error(await readErrorPayload(response, 'Registration failed.'));
    }

    return response.json();
  },

  login: async (email, password) => {
    const response = await apiRequest('/users/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error(await readErrorPayload(response, 'Login failed.'));
    }

    const data = await response.json();


    if (data.access) localStorage.setItem('access_token', data.access);
    if (data.refresh) localStorage.setItem('refresh_token', data.refresh);

    return data;
  },

  getCurrentUser: async () => {
    const response = await apiRequest('/users/me/');
    if (!response.ok) throw new Error('Not authenticated');
    return response.json();
  },

  logout: async () => {
    try {
      await apiRequest('/users/logout/', { method: 'POST' });
    } catch {}
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('isStaffLoggedIn');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('staffRole');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('staffEmail');
    return true;
  }
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
      type
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
    const isFormData = typeof FormData !== 'undefined' && facilityData instanceof FormData;
    const response = await apiRequest('/facilities/', {
      method: 'POST',
      body: isFormData ? facilityData : JSON.stringify(facilityData)
    });
    if (!response.ok) {
      throw new Error(await readErrorPayload(response, 'Failed to create facility.'));
    }
    return response.json();
  },

  update: async (id, facilityData) => {
    const isFormData = typeof FormData !== 'undefined' && facilityData instanceof FormData;
    const response = await apiRequest(`/facilities/${id}/`, {
      method: 'PUT',
      body: isFormData ? facilityData : JSON.stringify(facilityData)
    });
    if (!response.ok) {
      throw new Error(await readErrorPayload(response, 'Failed to update facility.'));
    }
    return response.json();
  },

  delete: async (id) => {
    const response = await apiRequest(`/facilities/${id}/`, {
      method: 'DELETE'
    });
    return response.ok;
  }
};

export const reservationsAPI = {
  create: async (reservationData) => {
    const response = await apiRequest('/reservations/', {
      method: 'POST',
      body:
      typeof FormData !== 'undefined' && reservationData instanceof FormData ?
      reservationData :
      JSON.stringify(reservationData)
    });

    if (!response.ok) {
      throw new Error(await readErrorPayload(response, 'Failed to create reservation.'));
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

  getApprovedDates: async (facilityId) => {
    const response = await apiRequest(`/facilities/${facilityId}/reservations/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch facility reservations: ${response.status}`);
    }

    const reservations = await response.json();
    const list = Array.isArray(reservations) ? reservations : reservations.results ?? [];

    return list.filter((reservation) =>
    ['confirmed', 'approved', 'checked_in'].includes(
      (reservation.status || '').toString().toLowerCase()
    )
    );
  },

  getById: async (id) => {
    const response = await apiRequest(`/reservations/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch reservation');
    return response.json();
  },

  trackByReservationId: async (reservationId) => {
    const params = new URLSearchParams({ reservation_id: reservationId });
    const response = await apiRequest(`/reservations/track/?${params}`);
    if (!response.ok) {
      throw new Error(await readErrorPayload(response, 'Reservation not found.'));
    }
    return response.json();
  },

  cancel: async (id) => {
    const response = await apiRequest(`/reservations/${id}/cancel/`, {
      method: 'POST'
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
        review_notes: reviewNotes
      })
    });
    if (!response.ok) throw new Error('Failed to approve reservation');
    return response.json();
  },

  archive: async (id) => {
    const response = await apiRequest(`/reservations/${id}/archive/`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to archive reservation');
    return response.json();
  },

  getByDateRange: async (startDate, endDate) => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });

    const response = await apiRequest(`/reservations/by_date_range/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch reservations');
    return response.json();
  }
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
      body: JSON.stringify(userData)
    });
    if (!response.ok) {
      throw new Error(await readErrorPayload(response, 'Failed to create staff user'));
    }
    return response.json();
  },

  setUserRole: async (userId, role) => {
    const response = await apiRequest(`/users/${userId}/set_role/`, {
      method: 'POST',
      body: JSON.stringify({ role })
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

  getReservationDetailReport: async ({ startDate, endDate, facilityType = 'All', reportType = 'reservations' } = {}) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (facilityType && facilityType !== 'All') params.append('facility_type', facilityType);
    if (reportType) params.append('report_type', reportType);

    const response = await apiRequest(`/reports/reservation_detail/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch reservation report');
    return response.json();
  },

  getPayments: async (status = null) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const response = await apiRequest(`/payments/by_status/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch payments');
    return response.json();
  },

  getNotifications: async (unreadOnly = false) => {
    const params = new URLSearchParams();
    if (unreadOnly) params.append('unread', 'true');

    const response = await apiRequest(`/notifications/?${params}`);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  },

  markNotificationRead: async (id) => {
    const response = await apiRequest(`/notifications/${id}/mark_read/`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    return response.json();
  },

  markAllNotificationsRead: async () => {
    const response = await apiRequest('/notifications/mark_all_read/', {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to mark notifications as read');
    return response.json();
  },

  verifyPayment: async (id) => {
    const response = await apiRequest(`/payments/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({
        verification_status: 'verified'
      })
    });
    if (!response.ok) throw new Error('Failed to verify payment');
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
      body: JSON.stringify(feedbackData)
    });
    if (!response.ok) {
      throw new Error(await readErrorPayload(response, 'Failed to submit feedback'));
    }
    return response.json();
  },

  updateFeedbackStatus: async (id, status) => {
    const response = await apiRequest(`/feedbacks/${id}/update_status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
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


  getCalendarReservations: async () => {
    const response = await apiRequest('/reservations/');
    if (!response.ok) throw new Error('Failed to fetch calendar reservations');

    const data = await response.json();
    const list = Array.isArray(data) ? data : data.results ?? [];


    const active = list.filter((r) =>
    ['approved', 'confirmed', 'checked_in'].includes(
      (r.status || '').toLowerCase()
    )
    );



    const entries = [];
    active.forEach((r) => {
      const facilityName =
      r.facility_name ||
      r.facility?.name ||
      r.room_name ||
      r.room ||
      'Reserved';

      const checkIn = r.check_in || r.check_in_date || r.date;
      const checkOut = r.check_out || r.check_out_date || r.date;

      if (!checkIn) return;

      if (checkOut && checkOut !== checkIn) {

        let current = new Date(checkIn);
        const end = new Date(checkOut);
        while (current < end) {
          entries.push({
            date: current.toISOString().split('T')[0],
            room: facilityName
          });
          current.setDate(current.getDate() + 1);
        }
      } else {
        entries.push({
          date: checkIn,
          room: facilityName
        });
      }
    });

    return entries;
  },


  getAvailability: async () => {
    const response = await apiRequest('/facilities/');
    if (!response.ok) throw new Error('Failed to fetch facilities for availability');

    const data = await response.json();
    const list = Array.isArray(data) ? data : data.results ?? [];

    const available = list.filter((f) => {
      const status =
      f.availability_status?.is_available ??
      f.is_available ??
      f.available ??
      true;

      return status === true;
    });

    const count = (keyword) =>
    available.filter((f) =>
    (f.type || f.name || '').toLowerCase().includes(keyword)
    ).length;

    return {
      availableRooms: count('room'),
      availableCottages: count('cottage'),
      availablePavilion: count('pavilion')
    };
  }
};

export default {
  authAPI,
  facilitiesAPI,
  reservationsAPI,
  adminAPI
};
