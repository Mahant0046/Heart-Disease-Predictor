import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Chip,
    Rating,
    CircularProgress,
} from '@mui/material';
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { debounce } from '../../utils/debounce';

const InfiniteScroll = require('react-infinite-scroll-component');

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
}

interface Locations {
    [city: string]: string[];
}

interface NearbyDoctorsProps {
    specialization?: string;
}

const NearbyDoctors: React.FC<NearbyDoctorsProps> = ({
    specialization,
}) => {
    const { currentUser } = useAuth();
    const { notify } = useNotification();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<Date | null>(null);
    const [reason, setReason] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedArea, setSelectedArea] = useState('');
    const [locations, setLocations] = useState<Locations>({});
    const [loadingLocations, setLoadingLocations] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastDoctorElementRef = useCallback((node: HTMLDivElement) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMore();
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    const debouncedFetchDoctors = useCallback(
        debounce(async (city: string, area: string, spec: string | undefined, pageNum: number) => {
            try {
                setLoading(true);
                setError(null);

                if (!city || !area) {
                    setError('Please select both city and area');
                    return;
                }

                const queryParams = new URLSearchParams();
                queryParams.append('city', city);
                queryParams.append('area', area);
                if (spec) queryParams.append('specialization', spec);
                queryParams.append('page', pageNum.toString());
                queryParams.append('per_page', '10');

                const response = await fetch(`/api/doctors/search?${queryParams}`, {
                    credentials: 'include',
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch doctors');
                }

                if (!data.success) {
                    throw new Error(data.error || 'Failed to fetch doctors');
                }

                if (pageNum === 1) {
                    setDoctors(data.doctors || []);
                } else {
                    setDoctors(prev => [...prev, ...(data.doctors || [])]);
                }
                setTotalPages(data.pages || 1);
                setHasMore(data.has_next || false);
            } catch (err: any) {
                console.error('Error fetching doctors:', err);
                setError(err.message || 'Failed to fetch doctors');
                notify({ message: err.message || 'Failed to fetch doctors', type: 'error' });
            } finally {
                setLoading(false);
            }
        }, 500),
        []
    );

    useEffect(() => {
        fetchLocations();
    }, []);

    useEffect(() => {
        if (selectedCity && selectedArea) {
            setPage(1);
            debouncedFetchDoctors(selectedCity, selectedArea, specialization, 1);
        }
    }, [selectedCity, selectedArea, specialization]);

    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            debouncedFetchDoctors(selectedCity, selectedArea, specialization, nextPage);
        }
    };

    const fetchLocations = async () => {
        try {
            setLoadingLocations(true);
            const response = await fetch('/api/locations', {
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch locations');
            }

            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch locations');
            }

            setLocations(data.locations || {});
        } catch (err: any) {
            console.error('Error fetching locations:', err);
            setError(err.message || 'Failed to fetch locations');
            notify({ message: err.message || 'Failed to fetch locations', type: 'error' });
        } finally {
            setLoadingLocations(false);
        }
    };

    const handleBookAppointment = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setIsBookingModalOpen(true);
    };

    const handleCloseBookingModal = () => {
        setIsBookingModalOpen(false);
        setSelectedDoctor(null);
        setSelectedDate(null);
        setSelectedTime(null);
        setReason('');
    };

    const handleSubmitBooking = async () => {
        if (!selectedDoctor || !selectedDate || !selectedTime || !reason) {
            notify({ message: 'Please fill in all fields', type: 'error' });
            return;
        }

        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    doctorId: selectedDoctor.id,
                    date: format(selectedDate, 'yyyy-MM-dd'),
                    time: format(selectedTime, 'HH:mm'),
                    reason,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to book appointment');
            }

            notify({ message: 'Appointment booked successfully!', type: 'success' });
            handleCloseBookingModal();
        } catch (err: any) {
            notify({ message: err.message || 'Failed to book appointment', type: 'error' });
        }
    };

    if (loadingLocations) {
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
        <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>City</InputLabel>
                        <Select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            label="City"
                        >
                            {Object.keys(locations).map((city) => (
                                <MenuItem key={city} value={city}>
                                    {city}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Area</InputLabel>
                        <Select
                            value={selectedArea}
                            onChange={(e) => setSelectedArea(e.target.value)}
                            label="Area"
                            disabled={!selectedCity}
                        >
                            {selectedCity &&
                                locations[selectedCity]?.map((area) => (
                                    <MenuItem key={area} value={area}>
                                        {area}
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                    {error}
                </Typography>
            )}

            <Grid container spacing={3} sx={{ mt: 2 }}>
                {doctors.map((doctor, index) => (
                    <Grid 
                        item 
                        xs={12} 
                        md={6} 
                        lg={4} 
                        key={doctor.id}
                        ref={index === doctors.length - 1 ? lastDoctorElementRef : null}
                    >
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Dr. {doctor.fullName}
                                </Typography>
                                <Typography color="textSecondary" gutterBottom>
                                    {doctor.specialization}
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    {doctor.hospital}
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    {doctor.address}, {doctor.area}, {doctor.city}
                                </Typography>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <Rating value={doctor.rating} readOnly precision={0.5} />
                                    <Typography variant="body2" sx={{ ml: 1 }}>
                                        ({doctor.reviews} reviews)
                                    </Typography>
                                </Box>
                                <Typography variant="body2" gutterBottom>
                                    Experience: {doctor.experience} years
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    Consultation Fee: ${doctor.consultationFee}
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    onClick={() => handleBookAppointment(doctor)}
                                    sx={{ mt: 2 }}
                                >
                                    Book Appointment
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {loading && (
                <Box display="flex" justifyContent="center" my={2}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && doctors.length === 0 && (
                <Typography align="center" sx={{ mt: 2 }}>
                    No doctors found
                </Typography>
            )}

            <Dialog open={isBookingModalOpen} onClose={handleCloseBookingModal} maxWidth="sm" fullWidth>
                <DialogTitle>Book Appointment</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Date"
                                value={selectedDate}
                                onChange={(newValue) => setSelectedDate(newValue)}
                                sx={{ width: '100%', mb: 2 }}
                            />
                            <TimePicker
                                label="Time"
                                value={selectedTime}
                                onChange={(newValue) => setSelectedTime(newValue)}
                                sx={{ width: '100%', mb: 2 }}
                            />
                        </LocalizationProvider>
                        <TextField
                            fullWidth
                            label="Reason for Visit"
                            multiline
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseBookingModal}>Cancel</Button>
                    <Button onClick={handleSubmitBooking} variant="contained" color="primary">
                        Book
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default NearbyDoctors; 