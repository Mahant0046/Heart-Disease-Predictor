// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// Error handling function
const handleApiError = (error: any) => {
    console.error('API Error:', error);
    if (error.response?.data) {
        return error.response.data;
    }
    if (error.code === 'ERR_NETWORK') {
        console.error('Network error details:', error);
        return { error: 'Network error - Please check your connection and ensure the server is running' };
    }
    return { error: error.message || 'An unexpected error occurred' };
};

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // You can add auth token here if needed
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('API Error:', error.response.data);
            return Promise.reject(handleApiError(error));
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Network Error:', error.request);
            return Promise.reject(handleApiError(error));
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Request Error:', error.message);
            return Promise.reject(handleApiError(error));
        }
    }
);

// --- Interfaces (ensure these match your actual data structures) ---
export interface User {
    id: number;
    email: string;
    fullName: string;
    token?: string;
    dateOfBirth: string | null;
    gender?: string;
    phoneNumber?: string;
    address?: string;
    healthScore: number;
    lastCheckup: string | null;
    createdAt?: string;
    updatedAt?: string;
}
export interface AdminUser {
    id: number;
    email: string;
    fullName: string;
    token?: string;
    createdAt?: string;
    lastLogin?: string | null;
}
export interface UserAuthApiResponse { message: string; user?: User; error?: string; }
export interface AdminAuthApiResponse { message: string; admin?: AdminUser; error?: string; }
export interface MessageApiResponse { message?: string; error?: string; }
// ... (Resource, PaginatedResourcesApiResponse, HeartDiseaseInput, PredictionApiResponse as before) ...
export interface Resource {
    id: number; title: string; description: string; category: string; url: string;
    imageUrl?: string; datePublished?: string; content?: string;
}

export interface ResourceFormData {
    title: string;
    description: string;
    category: string;
    url: string;
    imageUrl?: string;
    content?: string;
}

export interface PaginatedResourcesApiResponse<T> {
    success: boolean; resources: T[]; total: number; pages: number;
    currentPage: number; hasNext: boolean; hasPrev: boolean; error?: string;
}
export interface HeartDiseaseInput {
    age: number; sex: number; cp: number; trestbps: number; chol: number;
    fbs: number; restecg: number; thalach: number; exang: number | null;
    oldpeak: number; slope: number;
    systolicBP?: number;
    diastolicBP?: number;
    height?: number;
    weight?: number;
    smokingStatus?: string;
    physicalActivity?: number;
    familyHistory?: string;
    dietQuality?: string;
    alcoholIntake?: number;
    stressLevel?: string;
    sleepHours?: number;
    sleepApnea?: string;
    comorbidities?: string;
}
export interface PredictionApiResponse {
    message: string; prediction: 0 | 1;
    probability_of_heart_disease?: number | null;
    interpretation: string; error?: string;
}
export interface PredictionHistoryRecord {
      id: number; predictionDate: string; predictedClass: 0 | 1;
      probabilityScore?: number | null; riskLevel: string; riskPercentage: number;
      symptoms: string[]; recommendations: string[]; inputFeatures: HeartDiseaseInput;
}
export interface PaginatedHistoryResponse {
    success: boolean; history: PredictionHistoryRecord[]; total: number; pages: number;
    currentPage: number; hasNext: boolean; hasPrev: boolean; error?: string;
}

// Add a new interface for registration
export interface UserRegistrationData extends Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'healthScore' | 'lastCheckup' | 'token'> {
    password: string;
}

// Appointment interfaces
export interface Appointment {
    id: number;
    userId: number;
    doctorId: number;
    date: string;
    time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    reason: string;
    notes?: string;
    doctor?: {
        id: number;
        fullName: string;
        specialization: string;
        hospital: string;
        city: string;
        area: string;
        latitude: number;
        longitude: number;
    };
    user?: {
        id: number;
        fullName: string;
        email: string;
        phoneNumber?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface AppointmentApiResponse {
  success: boolean;
  appointment?: Appointment;
  appointments?: Appointment[];
  error?: string | {
    message: string;
    suggestions?: string[];
  };
  pages?: number;
  currentPage?: number;
}

// Add these interfaces before the doctor-related functions
export interface Doctor {
    id: number;
    email: string;
    fullName: string;
    token?: string;
    specialization: string;
    qualifications: string;
    experience: number;
    hospital: string;
    address: string;
    city: string;
    area: string;
    phoneNumber: string;
    availability: {
        days: string[];
        startTime: string;
        endTime: string;
    };
    rating: number;
    totalAppointments: number;
    reviews: number;
    consultationFee: number;
    latitude: number;
    longitude: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// --- Internal API Functions ---
const registerUserInternalApi = async (userData: UserRegistrationData): Promise<UserAuthApiResponse> => {
    localStorage.removeItem('admin');
    const response = await api.post<UserAuthApiResponse>('/api/register', userData);
    if (response.data.user) localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
};
const loginUserInternalApi = async (credentials: Pick<User, 'email'> & { password: string }): Promise<UserAuthApiResponse> => {
    try {
        localStorage.removeItem('admin');
        const response = await api.post<UserAuthApiResponse>('/api/login', credentials);
        
        if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
            return response.data;
        }
        
        if (response.data.error) {
            throw new Error(response.data.error);
        }
        
        return response.data;
    } catch (error: any) {
        console.error('Login error:', error);
        if (error.response?.data?.error) {
            throw new Error(error.response.data.error);
        }
        throw new Error(error.message || 'An unexpected error occurred during login');
    }
};
const logoutUserInternalApi = async (): Promise<MessageApiResponse> => {
    try {
        const response = await api.post<MessageApiResponse>('/api/logout');
        localStorage.removeItem('user');
        return response.data;
    } catch (error: any) {
        localStorage.removeItem('user');
        throw error;
    }
};
const checkUserAuthInternalApi = async (): Promise<{ authenticated: boolean; user?: User }> => {
    try {
        const response = await api.get<{ authenticated: boolean; user?: User }>('/api/check-user-auth');
        if (response.data.authenticated && response.data.user) localStorage.setItem('user', JSON.stringify(response.data.user));
        else localStorage.removeItem('user');
        return response.data;
    } catch (error: any) {
        localStorage.removeItem('user');
        return { authenticated: false };
    }
};
const getProfileInternalApi = async (): Promise<User> => {
    const response = await api.get<User>('/api/profile');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
};
const updateProfileInternalApi = async (profileData: Partial<User>): Promise<UserAuthApiResponse> => {
    const response = await api.put<UserAuthApiResponse>('/api/profile', profileData);
    if (response.data.user) localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
};
const changePasswordInternalApi = async (passwords: { currentPassword: string; newPassword: string }): Promise<MessageApiResponse> => {
    return (await api.post<MessageApiResponse>('/api/change-password', passwords)).data;
};
const loginAdminInternalApi = async (credentials: Pick<AdminUser, 'email'> & { password: string }): Promise<AdminAuthApiResponse> => {
    localStorage.removeItem('user');
    const response = await api.post<AdminAuthApiResponse>('/api/admin/login', credentials);
    if (response.data.admin) localStorage.setItem('admin', JSON.stringify(response.data.admin));
    else if (response.data.error && response.status === 200) throw response.data;
    return response.data;
};
const logoutAdminInternalApi = async (): Promise<MessageApiResponse> => {
    try {
        const response = await api.post<MessageApiResponse>('/api/admin/logout');
        localStorage.removeItem('admin');
        return response.data;
    } catch (error: any) {
        localStorage.removeItem('admin');
        throw error;
    }
};
const checkAdminAuthInternalApi = async (): Promise<{ authenticated: boolean; admin?: AdminUser }> => {
    try {
        const response = await api.get<{ authenticated: boolean; admin?: AdminUser }>('/api/admin/check-auth');
        if (response.data.authenticated && response.data.admin) localStorage.setItem('admin', JSON.stringify(response.data.admin));
        else localStorage.removeItem('admin');
        return response.data;
    } catch (error: any) {
        localStorage.removeItem('admin');
        return { authenticated: false };
    }
};
const getPublicResourcesInternalApi = async (page = 1, perPage = 10, category?: string): Promise<PaginatedResourcesApiResponse<Resource>> => {
    const params: Record<string, any> = { page, per_page: perPage };
    if (category) params.category = category;
    return (await api.get<PaginatedResourcesApiResponse<Resource>>('/api/resources', { params })).data;
};
const getPublicResourceInternalApi = async (id: number): Promise<{ success: boolean; resource: Resource; error?: string }> => {
    return (await api.get<{ success: boolean; resource: Resource; error?: string }>(`/api/resources/${id}`)).data;
};
const getAdminResourcesInternalApi = async (page = 1, perPage = 10): Promise<PaginatedResourcesApiResponse<Resource>> => {
    return (await api.get<PaginatedResourcesApiResponse<Resource>>('/api/admin/resources', { params: { page, per_page: perPage } })).data;
};
const getAdminResourceInternalApi = async (id: number): Promise<{ success: boolean; resource: Resource; error?: string }> => {
    return (await api.get<{ success: boolean; resource: Resource; error?: string }>(`/api/admin/resources/${id}`)).data;
};
const createAdminResourceInternalApi = async (resourceData: Partial<Omit<Resource, 'id'|'datePublished'>>): Promise<{ success: boolean; resource: Resource; message?: string; error?: string }> => {
    return (await api.post('/api/admin/resources', resourceData)).data;
};
const updateAdminResourceInternalApi = async (id: number, resourceData: Partial<Resource>): Promise<{ success: boolean; resource: Resource; message?: string; error?: string }> => {
    return (await api.put(`/api/admin/resources/${id}`, resourceData)).data;
};
const deleteAdminResourceInternalApi = async (id: number): Promise<{ success: boolean; message: string; error?: string }> => {
    return (await api.delete(`/api/admin/resources/${id}`)).data;
};
const predictHeartDiseaseInternalApi = async (inputData: HeartDiseaseInput): Promise<PredictionApiResponse> => {
    return (await api.post<PredictionApiResponse>('/api/predict-heart-disease', inputData)).data;
};
const getPredictionHistoryInternalApi = async (page = 1, perPage = 5): Promise<PaginatedHistoryResponse> => {
    return (await api.get<PaginatedHistoryResponse>('/api/prediction-history', { params: { page, per_page: perPage }})).data;
};
// src/services/api.ts
// ... (existing interfaces)

export interface AdminStats {
    total_users: number;
    // total_resources?: number; // If you add it on the backend
}

export interface AdminStatsResponse {
    success: boolean;
    stats?: AdminStats;
    error?: string;
}

// ... (existing internal API functions) ...

const getAdminStatsInternalApi = async (): Promise<AdminStatsResponse> => {
    return (await api.get<AdminStatsResponse>('/api/admin/stats')).data;
};


// --- Exported Functions ---
// ... (existing exports) ...
export const getAdminStats = getAdminStatsInternalApi;

// --- Exported Functions ---
export const register = registerUserInternalApi;
export const login = loginUserInternalApi;
export const logout = logoutUserInternalApi;
export const checkAuth = checkUserAuthInternalApi;
export const getCurrentUser = (): User | null => { /* ... */ 
    const userStr = localStorage.getItem('user');
    try { return userStr ? JSON.parse(userStr) : null; }
    catch (e) { localStorage.removeItem('user'); return null; }
};
export const getProfile = getProfileInternalApi;
export const updateProfile = updateProfileInternalApi;
export const changePassword = changePasswordInternalApi;

export const adminLogin = loginAdminInternalApi;
export const adminLogout = logoutAdminInternalApi;
export const checkAdminAuth = checkAdminAuthInternalApi;
export const getCurrentAdmin = (): AdminUser | null => { /* ... */ 
    const adminStr = localStorage.getItem('admin');
    try { return adminStr ? JSON.parse(adminStr) : null; }
    catch (e) { localStorage.removeItem('admin'); return null; }
};

export const getResources = getPublicResourcesInternalApi;
export const getResource = getPublicResourceInternalApi;
export const getAdminResources = getAdminResourcesInternalApi;
export const getAdminResource = getAdminResourceInternalApi;
export const createResource = createAdminResourceInternalApi;
export const updateResource = updateAdminResourceInternalApi;
export const deleteResource = deleteAdminResourceInternalApi;
export const predictHeartDisease = predictHeartDiseaseInternalApi;
export const getPredictionHistory = getPredictionHistoryInternalApi;

export async function uploadBloodReport(file: File): Promise<{ success: boolean; extracted: any }> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/api/upload-blood-report`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        // Don't set Content-Type header - browser will set it with boundary for FormData
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload blood report');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to process blood report');
    }

    return data;
  } catch (error) {
    console.error('Blood report upload error:', error);
    throw error;
  }
}

// Appointment API functions
export const getUserAppointments = async (userId: number) => {
    try {
        const response = await api.get(`/api/appointments?userId=${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user appointments:', error);
        throw error;
    }
};

export const createAppointment = async (appointmentData: {
  doctorId: number;
  date: string;
  time: string;
  reason: string;
}): Promise<AppointmentApiResponse> => {
  try {
    const response = await api.post('/api/appointments', appointmentData);
    return response.data;
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    if (error.response?.status === 409) {
      // Handle conflict errors (slot not available or already booked)
      return {
        success: false,
        error: error.response.data.error || 'Time slot is not available'
      };
    }
    throw handleApiError(error);
  }
};

export const updateAppointment = async (
  appointmentId: number,
  updateData: {
    status?: string;
    note?: string;
    reason?: string;
  }
): Promise<AppointmentApiResponse> => {
  try {
    const response = await api.put(`/api/appointments/${appointmentId}`, updateData);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
};

export const deleteAppointment = async (appointmentId: number): Promise<AppointmentApiResponse> => {
    try {
        const response = await api.delete(`/api/appointments/${appointmentId}`);
        return response.data;
    } catch (error: any) {
        throw handleApiError(error);
    }
};

export const searchDoctors = async (params: {
    specialization?: string;
    city?: string;
    area?: string;
}): Promise<AppointmentApiResponse> => {
    try {
        const queryParams = new URLSearchParams();
        if (params.specialization) queryParams.append('specialization', params.specialization);
        if (params.city) queryParams.append('city', params.city);
        if (params.area) queryParams.append('area', params.area);

        const response = await api.get(`/api/doctors/search?${queryParams.toString()}`);
        return response.data;
    } catch (error: any) {
        throw handleApiError(error);
    }
};

export interface SuggestedDoctor {
    id: number;
    fullName: string;
    specialization: string;
    qualifications: string;
    experience: number;
    hospital: string;
    address: string;
    city: string;
    area: string;
    phoneNumber: string;
    email: string;
    availability: {
        days: string[];
        startTime: string;
        endTime: string;
    };
    rating: number;
    totalAppointments: number;
    reviews: number;
    consultationFee: number;
    latitude: number;
    longitude: number;
    created_at?: string;
    updated_at?: string;
}

export interface DoctorSuggestionResponse {
    success: boolean;
    doctors: SuggestedDoctor[];
    total: number;
    error?: string;
}

export const getSuggestedDoctors = async (params: {
    riskLevel: string;
    city: string;
    area?: string;
    specialization?: string;
}): Promise<DoctorSuggestionResponse> => {
    try {
        const queryParams = new URLSearchParams({
            riskLevel: params.riskLevel,
            city: params.city,
            ...(params.area && { area: params.area }),
            ...(params.specialization && { specialization: params.specialization })
        });

        const response = await api.get<DoctorSuggestionResponse>(`/api/doctors/suggest?${queryParams}`);
        
        // Ensure the response matches the expected type
        if (!response.data || typeof response.data !== 'object') {
            throw new Error('Invalid response format from server');
        }

        const data = response.data;
        if (!Array.isArray(data.doctors)) {
            throw new Error('Invalid doctors data format from server');
        }

        return {
            success: Boolean(data.success),
            doctors: data.doctors,
            total: Number(data.total) || 0,
            error: data.error
        };
    } catch (error: any) {
        console.error('Error in getSuggestedDoctors:', error);
        return {
            success: false,
            doctors: [],
            total: 0,
            error: error.message || 'Failed to fetch suggested doctors'
        };
    }
};

interface Locations {
    [city: string]: string[];
}

export const getLocations = async (): Promise<{ success: boolean; locations: Locations; error?: string }> => {
    try {
        const response = await api.get('/api/locations');
        return response.data;
    } catch (error: any) {
        throw handleApiError(error);
    }
};

// Doctor-related functions
export const checkDoctorAuth = async (): Promise<{ authenticated: boolean; doctor?: Doctor }> => {
  try {
    const response = await api.get<{ authenticated: boolean; doctor?: Doctor }>('/api/doctor/check-auth');
    if (response.data.authenticated && response.data.doctor) {
      localStorage.setItem('doctor', JSON.stringify(response.data.doctor));
    } else {
      localStorage.removeItem('doctor');
    }
    return response.data;
  } catch (error) {
    console.error('Doctor auth check failed:', error);
    localStorage.removeItem('doctor');
    return { authenticated: false };
  }
};

export const getCurrentDoctor = (): Doctor | null => {
  const doctorStr = localStorage.getItem('doctor');
  if (!doctorStr) return null;
  try {
    return JSON.parse(doctorStr);
  } catch (error) {
    console.error('Error parsing stored doctor:', error);
    localStorage.removeItem('doctor');
    return null;
  }
};

export const doctorLogout = async (): Promise<void> => {
  try {
    await api.post('/api/doctor/logout');
  } finally {
    localStorage.removeItem('doctor');
  }
};

export default api;