// Spring Boot Backend API Client
const API_BASE_URL = 'http://localhost:8080/api';
let csrfToken = null;

const getCsrfToken = async () => {
  if (csrfToken) return csrfToken;

  const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Could not initialize secure session. Please refresh and try again.');
  const body = await response.json();
  csrfToken = body.token;
  return csrfToken;
};

const request = async (path, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  const isUnsafe = !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method);

  if (isUnsafe) {
    headers.set('X-CSRF-TOKEN', await getCsrfToken());
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include'
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || errorBody.message || errorBody.error ||
      (errorBody.details && Object.values(errorBody.details).join(' ')) ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
};

export const api = {
  // Check backend health/availability
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/doctors`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Doctors
  async getDoctors() {
    return request('/doctors');
  },

  // Appointments
  async getAppointments(filters = {}) {
    const params = new URLSearchParams();
    if (filters.date) params.append('date', filters.date);
    if (filters.doctorId) params.append('doctorId', filters.doctorId);
    if (filters.status) params.append('status', filters.status);

    return request(`/appointments${params.toString() ? '?' + params.toString() : ''}`);
  },

  async createAppointment(appointmentData) {
    const appointment = await request('/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointmentData)
    });
    if (!appointment || typeof appointment !== 'object' || !appointment.id || !appointment.tokenNumber) {
      throw new Error('The server response did not include a valid appointment confirmation.');
    }
    return appointment;
  },

  async registerPatient(accountData) {
    return request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accountData)
    });
  },

  async loginPatient(credentials) {
    const account = await request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    csrfToken = null;
    await getCsrfToken();
    return account;
  },

  async getCurrentPatient() {
    return request('/auth/me');
  },

  async logoutPatient() {
    const result = await request('/auth/logout', { method: 'POST' });
    csrfToken = null;
    return result;
  },

  async getMyAppointments() {
    return request('/patient/appointments');
  },

  async cancelMyAppointment(appointmentId) {
    return request(`/patient/appointments/${encodeURIComponent(appointmentId)}/cancel`, {
      method: 'POST'
    });
  },

  async callNextPatient(doctorId = null) {
    return request('/queue/call-next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorId ? { doctorId } : {})
    });
  },

  async startConsultation(appointmentId) {
    return request(`/appointments/${encodeURIComponent(appointmentId)}/start`, {
      method: 'POST'
    });
  },

  async completeConsultation(appointmentId, notes = '') {
    return request(`/appointments/${encodeURIComponent(appointmentId)}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
  },

  async skipPatient(appointmentId, reason = '') {
    return request(`/appointments/${encodeURIComponent(appointmentId)}/skip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
  },

  async cancelAppointment(appointmentId) {
    return request(`/appointments/${encodeURIComponent(appointmentId)}/cancel`, {
      method: 'POST'
    });
  },

  // Payments
  async getDoctorFee(doctorId) {
    return request(`/payments/fee/${encodeURIComponent(doctorId)}`);
  },

  async createPaymentOrder(appointmentId, patientPhone = null) {
    return request('/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId, patientPhone })
    });
  },

  async verifyPayment(verifyPayload) {
    return request('/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verifyPayload)
    });
  },

  async getPaymentReceipt(identifier) {
    return request(`/payments/${encodeURIComponent(identifier)}/receipt`);
  },

  async getAppointmentPayment(appointmentId) {
    return request(`/payments/appointment/${encodeURIComponent(appointmentId)}`);
  },

  /**
   * Patient submits UPI transaction reference after claiming to have paid.
   * Moves payment to PENDING_VERIFICATION — reception staff must still verify.
   */
  async submitPaymentClaim(paymentId, transactionReference, paymentMethod = 'UPI') {
    return request('/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, transactionReference, paymentMethod })
    });
  },

  /**
   * STAFF ONLY: Manually approve or reject a payment after reviewing the UPI transaction reference.
   * approve=true → PAID, approve=false → FAILED.
   */
  async manualVerifyPayment({ paymentId, transactionReference, approve, staffNote }) {
    return request('/payments/manual-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, transactionReference, approve, staffNote })
    });
  }
};

