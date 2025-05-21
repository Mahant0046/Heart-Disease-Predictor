import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// Define interfaces for API responses
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Add specific response types
export interface AppointmentsResponse {
    success: boolean;
    appointments: Appointment[];
    total: number;
    pages: number;
    current_page: number;
    error?: string;
}

interface User {
    id: number;
    email: string;
    fullName: string;
    dateOfBirth?: string;
    gender?: string;
    phoneNumber?: string;
    address?: string;
    healthScore: number;
    lastCheckup?: string;
}

interface Doctor {
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
    latitude?: number;
    longitude?: number;
}

interface Appointment {
    id: number;
    userId: number;
    doctorId: number;
    date: string;
    time: string;
    reason: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    doctor?: Doctor;
    user?: User;
}

// Create axios instance with default config
const api: AxiosInstance = axios.create({
    baseURL: 'http://localhost:5000',
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
    (error: AxiosError) => {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('API Error:', error.response.data);
            return Promise.reject(error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Network Error:', error.request);
            return Promise.reject({ error: 'Network error - no response received' });
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Request Error:', error.message);
            return Promise.reject({ error: error.message });
        }
    }
);

// Admin API endpoints
export const adminApi = {
    login: (email: string, password: string): Promise<AxiosResponse<ApiResponse<User>>> => 
        api.post('/api/admin/login', { email, password }),
    
    logout: (): Promise<AxiosResponse<ApiResponse<void>>> => 
        api.post('/api/admin/logout'),
    
    checkAuth: (): Promise<AxiosResponse<ApiResponse<User>>> => 
        api.get('/api/admin/check-auth'),
    
    getUsers: (page = 1, perPage = 10): Promise<AxiosResponse<ApiResponse<{ users: User[], total: number, pages: number }>>> => 
        api.get(`/api/admin/users?page=${page}&per_page=${perPage}`),
    
    getDoctors: (page = 1, perPage = 10): Promise<AxiosResponse<ApiResponse<{ doctors: Doctor[], total: number, pages: number }>>> => 
        api.get(`/api/admin/doctors?page=${page}&per_page=${perPage}`),
    
    getAnalytics: (): Promise<AxiosResponse<ApiResponse<any>>> => 
        api.get('/api/admin/analytics/dashboard'),
    
    // Doctor management endpoints
    createDoctor: (doctorData: Partial<Doctor>): Promise<AxiosResponse<ApiResponse<Doctor>>> =>
        api.post('/api/admin/doctors', doctorData),
    
    updateDoctor: (doctorId: number, doctorData: Partial<Doctor>): Promise<AxiosResponse<ApiResponse<Doctor>>> =>
        api.put(`/api/admin/doctors/${doctorId}`, doctorData),
    
    deleteDoctor: (doctorId: number): Promise<AxiosResponse<ApiResponse<void>>> =>
        api.delete(`/api/admin/doctors/${doctorId}`),
    
    getDoctorDetails: (doctorId: number): Promise<AxiosResponse<ApiResponse<Doctor>>> =>
        api.get(`/api/admin/doctors/${doctorId}`),
    
    getDoctorStats: (): Promise<AxiosResponse<ApiResponse<any>>> =>
        api.get('/api/admin/doctors/stats')
};

// Doctor API endpoints
export const doctorApi = {
    login: (email: string, password: string): Promise<AxiosResponse<ApiResponse<Doctor>>> => 
        api.post('/api/doctor/login', { email, password }),
    
    logout: (): Promise<AxiosResponse<ApiResponse<void>>> => 
        api.post('/api/doctor/logout'),
    
    checkAuth: (): Promise<AxiosResponse<ApiResponse<Doctor>>> => 
        api.get('/api/doctor/check-auth'),
    
    getAppointments: (): Promise<AxiosResponse<AppointmentsResponse>> => 
        api.get('/api/appointments/doctor'),
    
    updateAppointment: (appointmentId: number, status: string): Promise<AxiosResponse<ApiResponse<Appointment>>> => 
        api.put(`/api/appointments/${appointmentId}`, { status }),
    
    changePassword: (currentPassword: string, newPassword: string): Promise<AxiosResponse<ApiResponse<void>>> => 
        api.post('/api/doctor/change-password', { currentPassword, newPassword })
};

// User API endpoints
export const userApi = {
    login: (email: string, password: string): Promise<AxiosResponse<ApiResponse<User>>> => 
        api.post('/api/login', { email, password }),
    
    register: (userData: Partial<User>): Promise<AxiosResponse<ApiResponse<User>>> => 
        api.post('/api/register', userData),
    
    logout: (): Promise<AxiosResponse<ApiResponse<void>>> => 
        api.post('/api/logout'),
    
    checkAuth: (): Promise<AxiosResponse<ApiResponse<User>>> => 
        api.get('/api/check-user-auth'),
    
    getProfile: (): Promise<AxiosResponse<ApiResponse<User>>> => 
        api.get('/api/profile'),
    
    updateProfile: (profileData: Partial<User>): Promise<AxiosResponse<ApiResponse<User>>> => 
        api.put('/api/profile', profileData),
    
    changePassword: (currentPassword: string, newPassword: string): Promise<AxiosResponse<ApiResponse<void>>> => 
        api.post('/api/change-password', { currentPassword, newPassword }),
    
    getAppointments: (): Promise<AxiosResponse<ApiResponse<Appointment[]>>> => 
        api.get('/api/appointments'),
    
    createAppointment: (appointmentData: Partial<Appointment>): Promise<AxiosResponse<ApiResponse<Appointment>>> => 
        api.post('/api/appointments', appointmentData),
    
    getPredictionHistory: (): Promise<AxiosResponse<ApiResponse<any>>> => 
        api.get('/api/prediction-history')
};

export default api; 