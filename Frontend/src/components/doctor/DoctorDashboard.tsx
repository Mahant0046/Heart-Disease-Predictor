import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import axiosInstance from '../../services/api';
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Avatar,
    Chip,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    useTheme,
    Tab,
    Tabs,
    Paper,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Logout as LogoutIcon,
    LocalHospital as LocalHospitalIcon,
    Work as WorkIcon,
    School as SchoolIcon,
    Phone,
    Email,
    LocationOn,
    Edit as EditIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Star as StarIcon,
    AccessTime as AccessTimeIcon,
    AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { doctorApi, AppointmentsResponse } from '../../api/api';
import { ApiResponse } from '../../services/api';

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
    user?: {
        id: number;
        fullName: string;
        email: string;
        phoneNumber?: string;
    };
}

interface Doctor {
    id: number;
    fullName: string;
    specialization: string;
    hospital: string;
    email: string;
    phoneNumber: string;
    availability: {
        days: string[];
        startTime: string;
        endTime: string;
    };
    rating: number;
    totalAppointments: number;
    consultationFee: number;
    experience: number;
    qualifications: string;
    address: string;
    city: string;
    area: string;
    reviews: number;
}

const DoctorDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { performDoctorLogout, isDoctorAuthenticated, currentDoctor } = useAuth();
    const { notify } = useNotification();
    const theme = useTheme();

    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [profileForm, setProfileForm] = useState({
        fullName: '',
        phoneNumber: '',
        address: '',
        city: '',
        area: '',
        consultationFee: 0
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchDoctorData();
        fetchAppointments();
    }, []);

    useEffect(() => {
        if (doctor) {
            setProfileForm({
                fullName: doctor.fullName || '',
                phoneNumber: doctor.phoneNumber || '',
                address: doctor.address || '',
                city: doctor.city || '',
                area: doctor.area || '',
                consultationFee: doctor.consultationFee || 0
            });
        }
    }, [doctor]);

    const fetchDoctorData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosInstance.get('/api/doctor/check-auth');
            if (response.data.authenticated && response.data.doctor) {
                setDoctor(response.data.doctor);
                setProfileForm({
                    fullName: response.data.doctor.fullName || '',
                    phoneNumber: response.data.doctor.phoneNumber || '',
                    address: response.data.doctor.address || '',
                    city: response.data.doctor.city || '',
                    area: response.data.doctor.area || '',
                    consultationFee: response.data.doctor.consultationFee || 0
                });
            } else {
                setError('Not authenticated');
                navigate('/doctor/login');
            }
        } catch (error: any) {
            console.error('Error fetching doctor data:', error);
            setError(error.response?.data?.error || 'Failed to fetch doctor data');
            if (error.response?.status === 401) {
                navigate('/doctor/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointments = async () => {
        try {
            const response = await doctorApi.getAppointments();
            const data = response.data;
            if (data.success && data.appointments) {
                setAppointments(data.appointments);
            } else {
                throw new Error(data.error || 'Failed to fetch appointments');
            }
        } catch (error: any) {
            setError(error.message || 'Failed to fetch appointments');
            notify({ message: error.message || 'Failed to fetch appointments', type: 'error' });
        }
    };

    const handleAppointmentStatus = async (appointmentId: number, status: string) => {
        try {
            setLoading(true);
            const response = await axiosInstance.put(`/api/appointments/${appointmentId}`, {
                status: status
            });
            
            if (response.data.success) {
                notify({ message: 'Appointment status updated successfully', type: 'success' });
                // Refresh appointments list
                await fetchAppointments();
            } else {
                throw new Error(response.data.error || 'Failed to update appointment status');
            }
        } catch (error: any) {
            console.error('Error updating appointment status:', error);
            const errorMessage = error.response?.data?.error || 'Failed to update appointment status';
            notify({ message: errorMessage, type: 'error' });
            
            // If unauthorized, redirect to login
            if (error.response?.status === 401) {
                navigate('/doctor/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        try {
            const response = await axiosInstance.post('/api/doctor/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            const data = response.data as ApiResponse<void>;
            if (data.success) {
                setIsPasswordModalOpen(false);
                setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            }
        } catch (error) {
            setError('Failed to change password');
        }
    };

    const handleProfileUpdate = async () => {
        try {
            const response = await axiosInstance.put('/api/doctor/profile', profileForm);
            const data = response.data as ApiResponse<Doctor>;
            if (data.success && data.data) {
                setDoctor(data.data);
                setIsProfileModalOpen(false);
                notify({ message: 'Profile updated successfully', type: 'success' });
            }
        } catch (error: any) {
            notify({ message: error.message || 'Failed to update profile', type: 'error' });
        }
    };

    const formatTime = (time: string) => {
        try {
            return format(parseISO(time), 'HH:mm');
        } catch {
            return time;
        }
    };

    const handleLogout = async () => {
        try {
            await doctorApi.logout();
            await performDoctorLogout();
            navigate('/doctor/login');
            notify({ message: 'Logged out successfully', type: 'success' });
        } catch (error) {
            notify({ message: 'Failed to logout', type: 'error' });
        }
    };

    if (loading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)'
            }}>
                <CircularProgress sx={{ color: '#dc2626' }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)'
            }}>
                <Alert severity="error" sx={{ maxWidth: 400 }}>
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
            py: 4
        }}>
            <Container maxWidth="lg">
                {/* Header Section */}
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
                        <LocalHospitalIcon sx={{ fontSize: 32 }} />
                        <Box>
                            <Typography variant="h4" sx={{ 
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                Doctor Dashboard
                            </Typography>
                            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                                Welcome back, {doctor?.fullName || 'Doctor'}
                            </Typography>
                        </Box>
                    </Box>
                    <Button
                        variant="outlined"
                        onClick={handleLogout}
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

                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
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
                                        Rating
                                    </Typography>
                                </Box>
                                <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                    {doctor?.rating || 0}/5
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Based on {doctor?.reviews || 0} reviews
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
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
                                    <AccessTimeIcon sx={{ fontSize: 24, color: '#dc2626', mr: 1 }} />
                                    <Typography variant="h6" color="text.secondary">
                                        Total Appointments
                                    </Typography>
                                </Box>
                                <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                    {doctor?.totalAppointments || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Lifetime appointments
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
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
                                    <AttachMoneyIcon sx={{ fontSize: 24, color: '#dc2626', mr: 1 }} />
                                    <Typography variant="h6" color="text.secondary">
                                        Consultation Fee
                                    </Typography>
                                </Box>
                                <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                    ${doctor?.consultationFee || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Per consultation
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    {/* Doctor Profile Card */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ 
                            height: '100%', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            borderRadius: 3,
                            background: 'white',
                            transition: 'transform 0.2s',
                            '&:hover': {
                                transform: 'translateY(-5px)'
                            }
                        }}>
                            <CardContent>
                                <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    mb: 3 
                                }}>
                                    <Avatar 
                                        sx={{ 
                                            width: 120, 
                                            height: 120, 
                                            mb: 2, 
                                            bgcolor: '#dc2626',
                                            fontSize: '3rem',
                                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        {doctor?.fullName.charAt(0)}
                                    </Avatar>
                                    <Typography variant="h5" sx={{ 
                                        fontWeight: 'bold', 
                                        mb: 1,
                                        color: '#dc2626',
                                        fontFamily: '"Poppins", sans-serif'
                                    }}>
                                        {doctor?.fullName}
                                    </Typography>
                                    <Chip 
                                        label={doctor?.specialization}
                                        sx={{ 
                                            mb: 2,
                                            px: 2,
                                            py: 1,
                                            fontSize: '0.9rem',
                                            bgcolor: '#dc2626',
                                            color: 'white'
                                        }}
                                    />
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        p: 1,
                                        borderRadius: 1,
                                        '&:hover': {
                                            bgcolor: 'rgba(0,0,0,0.02)'
                                        }
                                    }}>
                                        <LocalHospitalIcon sx={{ mr: 2, color: '#dc2626' }} />
                                        <Typography sx={{ color: 'text.secondary' }}>{doctor?.hospital}</Typography>
                                    </Box>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        p: 1,
                                        borderRadius: 1,
                                        '&:hover': {
                                            bgcolor: 'rgba(0,0,0,0.02)'
                                        }
                                    }}>
                                        <WorkIcon sx={{ mr: 2, color: '#dc2626' }} />
                                        <Typography sx={{ color: 'text.secondary' }}>{doctor?.experience} years experience</Typography>
                                    </Box>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        p: 1,
                                        borderRadius: 1,
                                        '&:hover': {
                                            bgcolor: 'rgba(0,0,0,0.02)'
                                        }
                                    }}>
                                        <SchoolIcon sx={{ mr: 2, color: '#dc2626' }} />
                                        <Typography sx={{ color: 'text.secondary' }}>{doctor?.qualifications}</Typography>
                                    </Box>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        p: 1,
                                        borderRadius: 1,
                                        '&:hover': {
                                            bgcolor: 'rgba(0,0,0,0.02)'
                                        }
                                    }}>
                                        <Phone sx={{ mr: 2, color: '#dc2626' }} />
                                        <Typography sx={{ color: 'text.secondary' }}>{doctor?.phoneNumber}</Typography>
                                    </Box>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        p: 1,
                                        borderRadius: 1,
                                        '&:hover': {
                                            bgcolor: 'rgba(0,0,0,0.02)'
                                        }
                                    }}>
                                        <Email sx={{ mr: 2, color: '#dc2626' }} />
                                        <Typography sx={{ color: 'text.secondary' }}>{doctor?.email}</Typography>
                                    </Box>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        p: 1,
                                        borderRadius: 1,
                                        '&:hover': {
                                            bgcolor: 'rgba(0,0,0,0.02)'
                                        }
                                    }}>
                                        <LocationOn sx={{ mr: 2, color: '#dc2626' }} />
                                        <Typography sx={{ color: 'text.secondary' }}>{doctor?.address}, {doctor?.city}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={() => setIsProfileModalOpen(true)}
                                        startIcon={<EditIcon />}
                                        sx={{ 
                                            bgcolor: '#dc2626',
                                            '&:hover': {
                                                bgcolor: '#b91c1c'
                                            }
                                        }}
                                    >
                                        Edit Profile
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => setIsPasswordModalOpen(true)}
                                        sx={{ 
                                            borderColor: '#dc2626',
                                            color: '#dc2626',
                                            '&:hover': {
                                                borderColor: '#b91c1c',
                                                bgcolor: 'rgba(220, 38, 38, 0.04)'
                                            }
                                        }}
                                    >
                                        Change Password
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Appointments Section */}
                    <Grid item xs={12} md={8}>
                        <Card sx={{ 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            borderRadius: 3,
                            height: '100%'
                        }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                                    Appointments
                                </Typography>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ 
                                                backgroundColor: '#dc2626',
                                                '& th': {
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }
                                            }}>
                                                <TableCell>Patient</TableCell>
                                                <TableCell>Date</TableCell>
                                                <TableCell>Time</TableCell>
                                                <TableCell>Reason</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {appointments.map((appointment) => (
                                                <TableRow key={appointment.id} hover>
                                                    <TableCell>{appointment.user?.fullName}</TableCell>
                                                    <TableCell>{new Date(appointment.date).toLocaleDateString()}</TableCell>
                                                    <TableCell>{formatTime(appointment.time)}</TableCell>
                                                    <TableCell>{appointment.reason}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={appointment.status}
                                                            color={
                                                                appointment.status === 'completed' ? 'success' :
                                                                appointment.status === 'cancelled' ? 'error' : 'primary'
                                                            }
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {appointment.status === 'scheduled' && (
                                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleAppointmentStatus(appointment.id, 'completed')}
                                                                    sx={{ color: '#22c55e' }}
                                                                >
                                                                    <CheckIcon />
                                                                </IconButton>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleAppointmentStatus(appointment.id, 'cancelled')}
                                                                    sx={{ color: '#ef4444' }}
                                                                >
                                                                    <CloseIcon />
                                                                </IconButton>
                                                            </Box>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>

            {/* Profile Edit Modal */}
            <Dialog 
                open={isProfileModalOpen} 
                onClose={() => setIsProfileModalOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ 
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 1
                }}>
                    <EditIcon sx={{ color: '#dc2626' }} />
                    Edit Profile
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                value={profileForm.fullName}
                                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                value={profileForm.phoneNumber}
                                onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Address"
                                value={profileForm.address}
                                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="City"
                                value={profileForm.city}
                                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Area"
                                value={profileForm.area}
                                onChange={(e) => setProfileForm({ ...profileForm, area: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Consultation Fee"
                                type="number"
                                value={profileForm.consultationFee}
                                onChange={(e) => setProfileForm({ ...profileForm, consultationFee: Number(e.target.value) })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
                    <Button
                        onClick={() => setIsProfileModalOpen(false)}
                        sx={{ 
                            color: '#64748b',
                            '&:hover': {
                                backgroundColor: '#f1f5f9'
                            }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleProfileUpdate}
                        variant="contained"
                        sx={{ 
                            bgcolor: '#dc2626',
                            '&:hover': {
                                bgcolor: '#b91c1c'
                            }
                        }}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Password Change Modal */}
            <Dialog 
                open={isPasswordModalOpen} 
                onClose={() => setIsPasswordModalOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ 
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 1
                }}>
                    <EditIcon sx={{ color: '#dc2626' }} />
                    Change Password
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Current Password"
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="New Password"
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Confirm New Password"
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
                    <Button
                        onClick={() => setIsPasswordModalOpen(false)}
                        sx={{ 
                            color: '#64748b',
                            '&:hover': {
                                backgroundColor: '#f1f5f9'
                            }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePasswordChange}
                        variant="contained"
                        sx={{ 
                            bgcolor: '#dc2626',
                            '&:hover': {
                                bgcolor: '#b91c1c'
                            }
                        }}
                    >
                        Change Password
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DoctorDashboard; 