const API_BASE_URL = 'http://localhost:5000';  // Flask backend default port

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    CHECK_AUTH: `${API_BASE_URL}/api/auth/check-auth`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
    PROFILE: `${API_BASE_URL}/api/auth/profile`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`
  },
  ADMIN: {
    LOGIN: `${API_BASE_URL}/api/admin/login`,
    LOGOUT: `${API_BASE_URL}/api/admin/logout`,
    CHECK_AUTH: `${API_BASE_URL}/api/admin/check-auth`,
    DOCTORS: {
      LIST: `${API_BASE_URL}/api/admin/doctors`,
      CREATE: `${API_BASE_URL}/api/admin/doctors`,
      UPDATE: (id: number) => `${API_BASE_URL}/api/admin/doctors/${id}`,
      DELETE: (id: number) => `${API_BASE_URL}/api/admin/doctors/${id}`,
    }
  },
  APPOINTMENTS: {
    LIST: `${API_BASE_URL}/api/appointments`,
    CREATE: `${API_BASE_URL}/api/appointments`,
    UPDATE: (id: number) => `${API_BASE_URL}/api/appointments/${id}`,
    DELETE: (id: number) => `${API_BASE_URL}/api/appointments/${id}`,
    SEARCH: `${API_BASE_URL}/api/doctors/search`,
  }
}; 