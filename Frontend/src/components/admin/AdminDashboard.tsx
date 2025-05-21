// src/components/admin/AdminDashboard.tsx
import React, { useState, useEffect, useCallback, FormEvent, ChangeEvent, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
    checkAdminAuth, // For initial auth check if not solely relying on AdminProtectedRoute
    getAdminResources,
    createResource,
    updateResource,
    deleteResource,
    adminLogout,
    getAdminStats, // API function to get admin stats
    Resource,
    PaginatedResourcesApiResponse,
    AdminStats, // Interface for admin stats
    ResourceFormData
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ResourceFormModal from './ResourceFormModal'; // Assuming this path is correct
import DoctorFormModal, { DoctorFormData } from './DoctorFormModal';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    IconButton,
    Chip,
    Alert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Container,
    Grid,
    Pagination,
    LinearProgress,
} from '@mui/material';
import {
    People as PeopleIcon,
    Assessment as AssessmentIcon,
    MenuBook as MenuBookIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Logout as LogoutIcon,
    LocalHospital as LocalHospitalIcon,
    Star as StarIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import type { GridProps } from '@mui/material';
import { useNotification } from '../../context/NotificationContext';
import axiosInstance from '../../services/api';
import axios from 'axios';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface User {
    id: number;
    email: string;
    fullName: string;
    created_at: string;
    lastCheckup: string | null;
    healthScore: number;
    phoneNumber?: string; // Add optional phoneNumber
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
    latitude: number;
    longitude: number;
    created_at?: string;
    updated_at?: string;
}

interface SystemHealth {
    cpu: {
        usage_percent: number;
        count: number;
    };
    memory: {
        total: number;
        used: number;
        percent: number;
    };
    disk: {
        total: number;
        used: number;
        percent: number;
    };
    application: {
        active_users: number;
        total_users: number;
        total_predictions: number;
        database_status: string;
    };
}

interface DashboardAnalytics {
    users: {
        total: number;
        new_last_30_days: number;
        active_last_30_days: number;
    };
    predictions: {
        total: number;
        last_30_days: number;
    };
    risk_distribution: {
        high: number;
        medium: number;
        low: number;
    };
    doctors: {
        total: number;
        new_last_30_days: number;
    };
}

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { performAdminLogout, isAdminAuthenticated, currentAdmin } = useAuth();
    const { notify } = useNotification();

    const [resources, setResources] = useState<Resource[]>([]);
    const [loadingResources, setLoadingResources] = useState(true);
    const [resourceError, setResourceError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(10); // Items per page is fixed for now

    const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentResourceToEdit, setCurrentResourceToEdit] = useState<Resource | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

    const [activeTab, setActiveTab] = useState('doctors');
    const [users, setUsers] = useState<User[]>([]);
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userDetailsOpen, setUserDetailsOpen] = useState(false);

    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);
    const [doctorError, setDoctorError] = useState<string | null>(null);
    const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
    const [currentDoctorToEdit, setCurrentDoctorToEdit] = useState<Doctor | null>(null);
    const [doctorFormMode, setDoctorFormMode] = useState<'create' | 'edit'>('create');

    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [resourceFormMode, setResourceFormMode] = useState<'create' | 'edit'>('create');

    const fetchAdminStats = useCallback(async () => {
        if (!isAdminAuthenticated) return; // Only fetch if authenticated
        setLoadingStats(true);
        try {
            const response = await getAdminStats();
            if (response.success && response.stats) {
                setAdminStats(response.stats);
            } else {
                console.error("Failed to fetch admin stats:", response.error);
                // Optionally set an error state for stats
            }
        } catch (err) {
            console.error("Error fetching admin stats:", err);
        } finally {
            setLoadingStats(false);
        }
    }, [isAdminAuthenticated]);

    const fetchResources = useCallback(async (page = 1) => {
        if (!isAdminAuthenticated) {
            setLoadingResources(false);
            return;
        }
        
        setLoadingResources(true);
        setResourceError(null);
        
        try {
            const response = await axiosInstance.get('/api/admin/resources', {
                params: {
                    page: page,
                    per_page: itemsPerPage
                }
            });
            
            if (response.data && response.data.resources) {
                setResources(response.data.resources);
                setTotalPages(response.data.pages || 1);
                setCurrentPage(response.data.currentPage || 1);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err: any) {
            console.error('Resources fetch error:', err);
            setResourceError(err?.response?.data?.error || err?.message || 'Failed to fetch resources');
            notify({ message: err?.response?.data?.error || err?.message || 'Failed to fetch resources', type: 'error' });
        } finally {
            setLoadingResources(false);
        }
    }, [isAdminAuthenticated, itemsPerPage, notify]);

    useEffect(() => {
        if (isAdminAuthenticated) {
            fetchResources(currentPage);
        }
    }, [isAdminAuthenticated, currentPage, fetchResources]);

    const openCreateModal = () => {
        setFormMode('create');
        setCurrentResourceToEdit(null);
        setIsModalOpen(true);
    };

    const openEditModal = (resource: Resource) => {
        setFormMode('edit');
        setCurrentResourceToEdit(resource);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentResourceToEdit(null);
    };

    const handleResourceFormSubmit = async (resourceData: ResourceFormData) => {
        setResourceError(null);
        let success = false;
        setLoadingResources(true);
        try {
            if (resourceFormMode === 'create') {
                const response = await createResource(resourceData);
                if (response.success) {
                    success = true;
                    notify({ message: 'Resource created successfully!', type: 'success' });
                } else {
                    setResourceError(response.error || 'Failed to create resource');
                    notify({ message: response.error || 'Failed to create resource', type: 'error' });
                }
            } else if (resourceFormMode === 'edit' && currentResourceToEdit) {
                const response = await updateResource(currentResourceToEdit.id, resourceData);
                if (response.success) {
                    success = true;
                    notify({ message: 'Resource updated successfully!', type: 'success' });
                } else {
                    setResourceError(response.error || 'Failed to update resource');
                    notify({ message: response.error || 'Failed to update resource', type: 'error' });
                }
            }
            if (success) {
                closeResourceModal();
                fetchResources(resourceFormMode === 'create' ? 1 : currentPage);
            }
        } catch (err: any) {
            setResourceError(err.error || err.message || `Failed to ${resourceFormMode} resource`);
            notify({ message: err.error || err.message || `Failed to ${resourceFormMode} resource`, type: 'error' });
        } finally {
            setLoadingResources(false);
        }
    };

    const handleDeleteResource = async (resourceId: number) => {
        if (!window.confirm('Are you sure you want to delete this resource?')) {
            return;
        }

            setLoadingResources(true);
            try {
            const response = await deleteResource(resourceId);
                if (response.success) {
                    notify({ message: 'Resource deleted successfully!', type: 'success' });
                        fetchResources(currentPage);
                } else {
                    notify({ message: response.error || 'Failed to delete resource', type: 'error' });
                }
            } catch (err: any) {
                notify({ message: err.error || err.message || 'Failed to delete resource', type: 'error' });
            } finally {
                setLoadingResources(false);
        }
    };

    const handleAdminLogout = async () => {
        await performAdminLogout();
        navigate('/admin/login'); // Redirect after context state is cleared
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            // setCurrentPage(prev => prev + 1); // fetchResources will be called by useEffect
             fetchResources(currentPage + 1); // Or directly fetch next page
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            // setCurrentPage(prev => prev - 1);
            fetchResources(currentPage - 1);
        }
    };

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [analyticsRes, healthRes, usersRes] = await Promise.all([
                axiosInstance.get('/api/admin/analytics/dashboard'),
                axiosInstance.get('/api/admin/system/health-detailed'),
                axiosInstance.get('/api/admin/users')
            ]);

            setAnalytics(analyticsRes.data.analytics);
            setSystemHealth(healthRes.data.system_health);
            setUsers(usersRes.data.users);
            setError(null);
        } catch (err: any) {
            console.error('Dashboard data fetch error:', err);
            setError(err?.response?.data?.error || err?.message || 'Failed to fetch dashboard data');
            notify({ message: err?.response?.data?.error || err?.message || 'Failed to fetch dashboard data', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        // Refresh data every 5 minutes
        const interval = setInterval(fetchDashboardData, 300000);
        return () => clearInterval(interval);
    }, []);

    // Handle user search
    const handleSearch = async () => {
        try {
            const response = await axiosInstance.get(`/api/admin/users?search=${searchQuery}`);
            setUsers(response.data.users);
        } catch (err: any) {
            console.error('User search error:', err);
            setError(err?.response?.data?.error || err?.message || 'Search failed');
            notify({ message: err?.response?.data?.error || err?.message || 'Search failed', type: 'error' });
        }
    };

    // Handle user details view
    const handleViewUserDetails = (user: User) => {
        setSelectedUser(user);
            setUserDetailsOpen(true);
    };

    const fetchDoctors = useCallback(async (page: number) => {
        if (!isAdminAuthenticated) return;
        
        setLoadingDoctors(true);
        setDoctorError(null);
        
        try {
            const response = await axiosInstance.get('/api/admin/doctors', {
                params: {
                    page: page,
                    per_page: itemsPerPage
                }
            });
            
            if (response.data && response.data.success) {
                setDoctors(response.data.doctors);
                setTotalPages(response.data.pages || 1);
                setCurrentPage(response.data.current_page || page);
            } else {
                throw new Error(response.data?.error || 'Invalid response format');
            }
        } catch (err: any) {
            console.error('Doctors fetch error:', err);
            const errorMessage = err?.response?.data?.error || err?.response?.data?.details || err?.message || 'Failed to fetch doctors';
            setDoctorError(errorMessage);
            notify({ 
                message: errorMessage, 
                type: 'error'
            });
            
            // If there's a pagination error, try to fetch page 1
            if (page > 1 && err?.response?.status === 500) {
                console.log('Attempting to fetch page 1 after error');
                setCurrentPage(1);
            }
        } finally {
            setLoadingDoctors(false);
        }
    }, [isAdminAuthenticated, itemsPerPage, notify]);

    useEffect(() => {
        if (isAdminAuthenticated && !doctorError) {
            fetchDoctors(currentPage);
        }
        // eslint-disable-next-line
    }, [isAdminAuthenticated, currentPage]);

    // Add error handling for doctor form submission
    const handleDoctorFormSubmit = async (formData: DoctorFormData) => {
        try {
            setLoadingDoctors(true);
            let response;
            
            if (doctorFormMode === 'create') {
                // For create mode, ensure password is provided
                if (!formData.password) {
                    throw new Error('Password is required for new doctors');
                }
                response = await axiosInstance.post('/api/admin/doctors', formData);
            } else if (doctorFormMode === 'edit' && currentDoctorToEdit) {
                // For edit mode, remove password field if not provided
                const { password, ...updateData } = formData;
                response = await axiosInstance.put(`/api/admin/doctors/${currentDoctorToEdit.id}`, updateData);
            }
            
            if (response?.data?.success) {
                notify({ 
                    message: `Doctor ${doctorFormMode === 'create' ? 'created' : 'updated'} successfully!`, 
                    type: 'success' 
                });
                closeDoctorModal();
                fetchDoctors(currentPage); // Refresh the doctors list
            } else {
                throw new Error(response?.data?.error || `Failed to ${doctorFormMode} doctor`);
            }
        } catch (error: any) {
            console.error('Error submitting doctor form:', error);
            notify({ 
                message: error?.response?.data?.error || error.message || `Failed to ${doctorFormMode} doctor`, 
                type: 'error' 
            });
        } finally {
            setLoadingDoctors(false);
        }
    };

    // Add error handling for doctor deletion
    const handleDeleteDoctor = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this doctor?')) {
            try {
                setLoadingDoctors(true);
                const response = await axiosInstance.delete(`/api/admin/doctors/${id}`);
                
                if (response.data.success) {
                    notify({ message: 'Doctor deleted successfully!', type: 'success' });
                    fetchDoctors(currentPage); // Refresh the doctors list
                } else {
                    throw new Error(response.data.error || 'Failed to delete doctor');
                }
            } catch (err: any) {
                console.error('Error deleting doctor:', err);
                const errorMessage = err?.response?.data?.error || err?.message || 'Failed to delete doctor';
                setDoctorError(errorMessage);
                notify({ message: errorMessage, type: 'error' });
            } finally {
                setLoadingDoctors(false);
            }
        }
    };

    const openCreateDoctorModal = () => {
        setDoctorFormMode('create');
        setCurrentDoctorToEdit(null);
        setIsDoctorModalOpen(true);
    };

    const openEditDoctorModal = (doctor: Doctor) => {
        setDoctorFormMode('edit');
        setCurrentDoctorToEdit(doctor);
        setIsDoctorModalOpen(true);
    };

    const closeDoctorModal = () => {
        setIsDoctorModalOpen(false);
        setCurrentDoctorToEdit(null);
    };

    // Helper function to get system health status
    const getSystemHealthStatus = (health: SystemHealth | null): 'error' | 'warning' | 'success' => {
        if (!health) return 'error';
        const cpuUsage = health.cpu.usage_percent || 0;
        const memoryUsage = health.memory.percent || 0;
        const diskUsage = health.disk.percent || 0;

        if (cpuUsage > 80 || memoryUsage > 80 || diskUsage > 80) return 'error';
        if (cpuUsage > 60 || memoryUsage > 60 || diskUsage > 60) return 'warning';
        return 'success';
    };

    // Helper function to get system health label
    const getSystemHealthLabel = (health: SystemHealth | null): string => {
        const status = getSystemHealthStatus(health);
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const openCreateResourceModal = () => {
        setResourceFormMode('create');
        setCurrentResourceToEdit(null);
        setIsResourceModalOpen(true);
    };

    const openEditResourceModal = (resource: Resource) => {
        setResourceFormMode('edit');
        setCurrentResourceToEdit(resource);
        setIsResourceModalOpen(true);
    };

    const closeResourceModal = () => {
        setIsResourceModalOpen(false);
        setCurrentResourceToEdit(null);
    };

    // AdminProtectedRoute handles primary auth check and loading state for auth.
    // This component's loading state is for its own data fetching (resources, stats).
    if (!isAdminAuthenticated && !currentAdmin) { // Should be caught by AdminProtectedRoute
        console.warn("[AdminDashboard] Rendered without admin auth. This should be handled by AdminProtectedRoute.");
        return <Navigate to="/admin/login" replace />;
    }

    if (loadingResources && resources.length === 0 && !resourceError) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="ml-4 text-gray-700">Loading Resources...</p>
            </div>
        );
    }

    // Show error message if doctorError is present
    if (doctorError) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Alert severity="error">{doctorError}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            flexGrow: 1, 
            p: 3,
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            minHeight: '100vh',
            fontFamily: 'Libre Franklin, sans-serif'
        }}>
            <Container maxWidth="xl">
                {/* Header Section with enhanced design */}
                <Box sx={{ 
                    mb: 4, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                    p: 3,
                    borderRadius: 2,
                    color: 'white',
                    boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.2), 0 2px 4px -1px rgba(220, 38, 38, 0.1)'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AssessmentIcon sx={{ fontSize: 32 }} />
                        <Box>
                            <Typography variant="h4" sx={{ 
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                Admin Dashboard
                            </Typography>
                            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                                Welcome back, {currentAdmin?.fullName || 'Admin'}
                            </Typography>
                        </Box>
                    </Box>
                    <Button
                        variant="outlined"
                        onClick={handleAdminLogout}
                        startIcon={<LogoutIcon />}
                        sx={{ 
                            borderRadius: 2,
                            borderColor: 'white',
                            color: 'white',
                            '&:hover': {
                                borderColor: 'white',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                        }}
                    >
                        Logout
                    </Button>
                </Box>

                {/* Stats Cards with enhanced design */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ 
                            borderRadius: 2,
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                            transition: 'transform 0.2s',
                            '&:hover': {
                                transform: 'translateY(-4px)'
                            }
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <PeopleIcon sx={{ fontSize: 24, color: '#dc2626', mr: 1 }} />
                                    <Typography variant="h6" color="text.secondary">
                                        Total Users
                                    </Typography>
                                </Box>
                                <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                    {analytics?.users?.total || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Active in the system
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ 
                            borderRadius: 2,
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                            transition: 'transform 0.2s',
                            '&:hover': {
                                transform: 'translateY(-4px)'
                            }
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <TrendingUpIcon sx={{ fontSize: 24, color: '#dc2626', mr: 1 }} />
                                    <Typography variant="h6" color="text.secondary">
                                        New Users
                                    </Typography>
                                </Box>
                                <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                    {analytics?.users?.new_last_30_days || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Last 30 days
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ 
                            borderRadius: 2,
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                            transition: 'transform 0.2s',
                            '&:hover': {
                                transform: 'translateY(-4px)'
                            }
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <StarIcon sx={{ fontSize: 24, color: '#dc2626', mr: 1 }} />
                                    <Typography variant="h6" color="text.secondary">
                                        Active Users
                                    </Typography>
                                </Box>
                                <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                    {analytics?.users?.active_last_30_days || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Last 30 days
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ 
                            borderRadius: 2,
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                            transition: 'transform 0.2s',
                            '&:hover': {
                                transform: 'translateY(-4px)'
                            }
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <LocalHospitalIcon sx={{ fontSize: 24, color: '#dc2626', mr: 1 }} />
                                    <Typography variant="h6" color="text.secondary">
                                        Total Doctors
                                    </Typography>
                                </Box>
                                <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                    {analytics?.doctors?.total || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Registered doctors
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Tabs Section with enhanced design */}
                <Card sx={{ 
                    borderRadius: 2,
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    overflow: 'hidden'
                }}>
                    <Tabs 
                        value={activeTab} 
                        onChange={(e, newValue) => setActiveTab(newValue)}
                        sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 500,
                                fontSize: '1rem',
                                minWidth: 100,
                                '&.Mui-selected': {
                                    color: '#dc2626'
                                }
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: '#dc2626'
                            }
                        }}
                    >
                        <Tab 
                            label="Doctors" 
                            value="doctors" 
                            icon={<LocalHospitalIcon />}
                            iconPosition="start"
                        />
                        <Tab 
                            label="Resources" 
                            value="resources" 
                            icon={<MenuBookIcon />}
                            iconPosition="start"
                        />
                        <Tab 
                            label="Users" 
                            value="users"
                            icon={<PeopleIcon />}
                            iconPosition="start"
                        />
                    </Tabs>

                    {/* Tab Content */}
                        <Box sx={{ p: 3 }}>
                        {activeTab === 'doctors' && (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                <TextField
                                    placeholder="Search doctors..."
                                        variant="outlined"
                                        size="small"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                        sx={{ 
                                            width: 300,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2
                                            }
                                        }}
                                        InputProps={{
                                            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                                        }}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                        onClick={openCreateDoctorModal}
                                    sx={{ 
                                            backgroundColor: '#dc2626',
                                        '&:hover': {
                                                backgroundColor: '#b91c1c'
                                            },
                                            borderRadius: 2
                                    }}
                                >
                                    Add Doctor
                                </Button>
                            </Box>

                                {loadingDoctors ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                        <CircularProgress sx={{ color: '#dc2626' }} />
                                    </Box>
                                ) : (
                                    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                <Table>
                                    <TableHead>
                                                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                                                    <TableCell>Name</TableCell>
                                                    <TableCell>Specialization</TableCell>
                                                    <TableCell>Hospital</TableCell>
                                                    <TableCell>Location</TableCell>
                                                    <TableCell>Contact</TableCell>
                                                    <TableCell>Experience</TableCell>
                                                    <TableCell>Rating</TableCell>
                                                    <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {doctors.map((doctor) => (
                                                    <TableRow key={doctor.id} hover>
                                                <TableCell>{doctor.fullName}</TableCell>
                                                <TableCell>{doctor.specialization}</TableCell>
                                                <TableCell>{doctor.hospital}</TableCell>
                                                        <TableCell>{doctor.city}, {doctor.area}</TableCell>
                                                        <TableCell>{doctor.phoneNumber}</TableCell>
                                                        <TableCell>{doctor.experience} years</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <StarIcon sx={{ color: '#fbbf24', fontSize: 20 }} />
                                                                <Typography>{doctor.rating.toFixed(1)}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <IconButton
                                                                    size="small"
                                                        onClick={() => openEditDoctorModal(doctor)}
                                                                    sx={{ color: '#3b82f6' }}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                                    size="small"
                                                        onClick={() => handleDeleteDoctor(doctor.id)}
                                                                    sx={{ color: '#dc2626' }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                            </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                                )}

                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                <Pagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={(e, page) => setCurrentPage(page)}
                                    sx={{
                                        '& .MuiPaginationItem-root': {
                                            borderRadius: 1,
                                            '&.Mui-selected': {
                                                backgroundColor: '#dc2626',
                                                color: 'white',
                                                '&:hover': {
                                                    backgroundColor: '#b91c1c'
                                                }
                                            }
                                        }
                                    }}
                                />
                            </Box>
                        </Box>
                    )}

                    {activeTab === 'resources' && (
                            <Box sx={{ mt: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="h6">Resources</Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                        onClick={openCreateResourceModal}
                                >
                                    Add Resource
                                </Button>
                            </Box>

                                {loadingResources ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : resourceError ? (
                                    <Alert severity="error" sx={{ mt: 2 }}>{resourceError}</Alert>
                                ) : (
                                    <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                                    <TableCell>Title</TableCell>
                                                    <TableCell>Category</TableCell>
                                                    <TableCell>Description</TableCell>
                                                    <TableCell>Date Published</TableCell>
                                                    <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {resources.map((resource) => (
                                                    <TableRow key={resource.id}>
                                                <TableCell>{resource.title}</TableCell>
                                                        <TableCell>{resource.category}</TableCell>
                                                        <TableCell>{resource.description}</TableCell>
                                                <TableCell>
                                                            {new Date(resource.datePublished || '').toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton
                                                                onClick={() => openEditResourceModal(resource)}
                                                                size="small"
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={() => handleDeleteResource(resource.id)}
                                                                size="small"
                                                                color="error"
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                                
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                    <Pagination
                                        count={totalPages}
                                        page={currentPage}
                                        onChange={(e, page) => setCurrentPage(page)}
                                        color="primary"
                                    />
                                </Box>
                            </Box>
                        )}

                        {activeTab === 'users' && (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                    <TextField
                                        placeholder="Search users..."
                                        variant="outlined"
                                        size="small"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        sx={{ 
                                            width: 300,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2
                                            }
                                        }}
                                        InputProps={{
                                            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                                        }}
                                    />
                                </Box>

                                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                                                <TableCell>Name</TableCell>
                                                <TableCell>Email</TableCell>
                                                <TableCell>Phone</TableCell>
                                                <TableCell>Health Score</TableCell>
                                                <TableCell>Last Checkup</TableCell>
                                                <TableCell>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {users.map((user) => (
                                                <TableRow key={user.id} hover>
                                                    <TableCell>{user.fullName}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>{user.phoneNumber || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={`${user.healthScore}%`}
                                                            color={user.healthScore >= 70 ? 'success' : user.healthScore >= 40 ? 'warning' : 'error'}
                                                            sx={{ fontWeight: 500 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{user.lastCheckup || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleViewUserDetails(user)}
                                                            sx={{ color: '#3b82f6' }}
                                                        >
                                                            <VisibilityIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                <Pagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={(e, page) => setCurrentPage(page)}
                                    sx={{
                                        '& .MuiPaginationItem-root': {
                                            borderRadius: 1,
                                            '&.Mui-selected': {
                                                backgroundColor: '#dc2626',
                                                color: 'white',
                                                '&:hover': {
                                                    backgroundColor: '#b91c1c'
                                                }
                                            }
                                        }
                                    }}
                                />
                            </Box>
                        </Box>
                    )}
                    </Box>
                </Card>
            </Container>

            {/* Doctor Form Modal */}
            <DoctorFormModal
                isOpen={isDoctorModalOpen}
                onClose={closeDoctorModal}
                onSubmit={handleDoctorFormSubmit}
                initialData={currentDoctorToEdit}
                mode={doctorFormMode}
            />

            {/* User Details Modal */}
            <Dialog
                open={userDetailsOpen}
                onClose={() => setUserDetailsOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ 
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                                    display: 'flex', 
                                    alignItems: 'center',
                    gap: 1
                }}>
                    <PeopleIcon sx={{ color: '#dc2626' }} />
                    User Details
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    {selectedUser && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                    Personal Information
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">Full Name</Typography>
                                    <Typography variant="body1">{selectedUser.fullName}</Typography>
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">Email</Typography>
                                    <Typography variant="body1">{selectedUser.email}</Typography>
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">Phone Number</Typography>
                                    <Typography variant="body1">{selectedUser.phoneNumber || 'N/A'}</Typography>
                                </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                    Health Information
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">Health Score</Typography>
                                    <Chip
                                        label={`${selectedUser.healthScore}%`}
                                        color={selectedUser.healthScore >= 70 ? 'success' : selectedUser.healthScore >= 40 ? 'warning' : 'error'}
                                        sx={{ fontWeight: 500 }}
                                    />
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">Last Checkup</Typography>
                                    <Typography variant="body1">{selectedUser.lastCheckup || 'N/A'}</Typography>
                                </Box>
                    </Grid>
                </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
                    <Button
                        onClick={() => setUserDetailsOpen(false)}
                        sx={{ 
                            color: '#64748b',
                            '&:hover': {
                                backgroundColor: '#f1f5f9'
                            }
                        }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Resource Form Modal */}
                <ResourceFormModal
                isOpen={isResourceModalOpen}
                onClose={closeResourceModal}
                    onSubmit={handleResourceFormSubmit}
                    initialData={currentResourceToEdit}
                mode={resourceFormMode}
            />
        </Box>
    );
};

export default AdminDashboard;