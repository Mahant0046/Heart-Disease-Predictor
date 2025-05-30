import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Chip,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Tabs,
    Tab,
} from '@mui/material';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import type { GridProps } from '@mui/material';

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
    user: {
        id: number;
        fullName: string;
        email: string;
        phoneNumber: string;
    };
}

const DoctorAppointments: React.FC = () => {
    const { currentUser } = useAuth();
    const { notify } = useNotification();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState<'complete' | 'cancel' | null>(null);
    const [actionNote, setActionNote] = useState('');
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/appointments?doctorId=' + currentUser?.id, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch appointments');
            }

            const data = await response.json();
            setAppointments(data.appointments);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch appointments');
            notify({ message: err.message || 'Failed to fetch appointments', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (appointment: Appointment, type: 'complete' | 'cancel') => {
        setSelectedAppointment(appointment);
        setActionType(type);
        setIsActionModalOpen(true);
    };

    const handleCloseActionModal = () => {
        setIsActionModalOpen(false);
        setSelectedAppointment(null);
        setActionType(null);
        setActionNote('');
    };

    const handleSubmitAction = async () => {
        if (!selectedAppointment || !actionType) {
            return;
        }

        try {
            const response = await fetch(`/api/appointments/${selectedAppointment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    status: actionType === 'complete' ? 'completed' : 'cancelled',
                    note: actionNote,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to ${actionType} appointment`);
            }

            notify({
                message: `Appointment ${actionType}d successfully`,
                type: 'success',
            });
            handleCloseActionModal();
            fetchAppointments();
        } catch (err: any) {
            notify({
                message: err.message || `Failed to ${actionType} appointment`,
                type: 'error',
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled':
                return 'primary';
            case 'completed':
                return 'success';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    const filteredAppointments = appointments.filter((appointment) => {
        switch (activeTab) {
            case 0:
                return appointment.status === 'scheduled';
            case 1:
                return appointment.status === 'completed';
            case 2:
                return appointment.status === 'cancelled';
            default:
                return true;
        }
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Typography variant="h5" component="h2" className="font-semibold">
                My Appointments
            </Typography>

            <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                className="mb-4"
            >
                <Tab label="Scheduled" />
                <Tab label="Completed" />
                <Tab label="Cancelled" />
            </Tabs>

            {filteredAppointments.length === 0 ? (
                <div className="text-center py-8">
                    <Typography variant="body1" color="textSecondary">
                        No {['scheduled', 'completed', 'cancelled'][activeTab]} appointments found.
                    </Typography>
                </div>
            ) : (
                <Grid spacing={3}>
                    {filteredAppointments.map((appointment) => (
                        <Grid xs={12} md={6} key={appointment.id}>
                            <Card className="h-full">
                                <CardContent>
                                    <Box className="flex justify-between items-start mb-4">
                                        <Typography variant="h6" component="h3" className="font-semibold">
                                            {appointment.user.fullName}
                                        </Typography>
                                        <Chip
                                            label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                            color={getStatusColor(appointment.status)}
                                            size="small"
                                        />
                                    </Box>

                                    <Box className="space-y-2">
                                        <Typography variant="body2">
                                            <strong>Email:</strong> {appointment.user.email}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Phone:</strong> {appointment.user.phoneNumber}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Date:</strong>{' '}
                                            {format(parseISO(appointment.date), 'MMMM d, yyyy')}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Time:</strong> {appointment.time}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Reason:</strong> {appointment.reason}
                                        </Typography>
                                    </Box>

                                    {appointment.status === 'scheduled' && (
                                        <Box className="mt-4 space-x-2">
                                            <Button
                                                variant="contained"
                                                color="success"
                                                onClick={() => handleAction(appointment, 'complete')}
                                            >
                                                Complete
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                onClick={() => handleAction(appointment, 'cancel')}
                                            >
                                                Cancel
                                            </Button>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Dialog open={isActionModalOpen} onClose={handleCloseActionModal} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {actionType === 'complete' ? 'Complete Appointment' : 'Cancel Appointment'}
                </DialogTitle>
                <DialogContent>
                    {selectedAppointment && (
                        <div className="space-y-4 mt-4">
                            <Typography variant="body1">
                                Are you sure you want to {actionType} the appointment with{' '}
                                {selectedAppointment.user.fullName} on{' '}
                                {format(parseISO(selectedAppointment.date), 'MMMM d, yyyy')} at{' '}
                                {selectedAppointment.time}?
                            </Typography>

                            <TextField
                                fullWidth
                                label={`${actionType === 'complete' ? 'Notes' : 'Reason'}`}
                                multiline
                                rows={3}
                                value={actionNote}
                                onChange={(e) => setActionNote(e.target.value)}
                                required
                            />
                        </div>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseActionModal}>Cancel</Button>
                    <Button
                        onClick={handleSubmitAction}
                        variant="contained"
                        color={actionType === 'complete' ? 'success' : 'error'}
                    >
                        {actionType === 'complete' ? 'Complete' : 'Cancel'} Appointment
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default DoctorAppointments; 