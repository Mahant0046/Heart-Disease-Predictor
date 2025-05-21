import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../services/api';
import { format, parseISO } from 'date-fns';
import { Appointment } from '../../services/api';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Chip,
} from '@mui/material';

interface AppointmentWithDoctor extends Appointment {
    doctor: NonNullable<Appointment['doctor']>;
}

const UserAppointments: React.FC = () => {
    const { currentUser } = useAuth();
    const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (currentUser?.id) {
            fetchAppointments();
        }
    }, [currentUser?.id]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axiosInstance.get(`/api/appointments?userId=${currentUser?.id}`);
            if (response.data.appointments) {
                // Filter out appointments without doctor data and assert type
                const validAppointments = response.data.appointments
                    .filter((app: Appointment): app is AppointmentWithDoctor => !!app.doctor);
                setAppointments(validAppointments);
            }
        } catch (err) {
            setError('Failed to fetch appointments');
            console.error('Error fetching appointments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAppointment = async (appointmentId: number) => {
        try {
            await axiosInstance.put(`/api/appointments/${appointmentId}`, {
                status: 'cancelled'
            });
            fetchAppointments();
        } catch (err) {
            setError('Failed to cancel appointment');
            console.error('Error cancelling appointment:', err);
        }
    };

    const getStatusColor = (status: Appointment['status']) => {
        switch (status) {
            case 'confirmed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'cancelled':
                return 'error';
            case 'completed':
                return 'info';
            default:
                return 'default';
        }
    };

    const formatTime = (timeStr: string) => {
        try {
            // If time is already in HH:mm format, just return it
            if (/^\d{2}:\d{2}$/.test(timeStr)) {
                return timeStr;
            }
            // Otherwise try to parse it as ISO string
            return format(parseISO(timeStr), 'HH:mm');
        } catch (err) {
            console.error('Error formatting time:', err);
            return timeStr; // Return original string if parsing fails
        }
    };

    if (loading) {
        return <Typography>Loading appointments...</Typography>;
    }

    if (error) {
        return <Typography color="error">{error}</Typography>;
    }

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, p: 2 }}>
            <Typography variant="h5" gutterBottom>
                My Appointments
            </Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Time</TableCell>
                            <TableCell>Doctor</TableCell>
                            <TableCell>Specialization</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {appointments.map((appointment) => (
                            <TableRow key={appointment.id}>
                                <TableCell>
                                    {format(parseISO(appointment.date), 'MMM dd, yyyy')}
                                </TableCell>
                                <TableCell>
                                    {formatTime(appointment.time)}
                                </TableCell>
                                <TableCell>{appointment.doctor.fullName}</TableCell>
                                <TableCell>{appointment.doctor.specialization}</TableCell>
                                <TableCell>
                                    {appointment.doctor.hospital}, {appointment.doctor.city}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={appointment.status}
                                        color={getStatusColor(appointment.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {appointment.status === 'pending' && (
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            onClick={() => handleCancelAppointment(appointment.id)}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default UserAppointments; 