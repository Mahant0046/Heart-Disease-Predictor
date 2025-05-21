import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSuggestedDoctors, getLocations, SuggestedDoctor, DoctorSuggestionResponse } from '../../services/api';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    Button,
    Rating,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface DoctorSuggestionsProps {
    riskLevel: string;
    city?: string;
    area?: string;
    specialization?: string;
}

interface Locations {
    [city: string]: string[];
}

const DoctorSuggestions: React.FC<DoctorSuggestionsProps> = ({
    riskLevel,
    city: initialCity,
    area: initialArea,
    specialization,
}) => {
    const [doctors, setDoctors] = useState<SuggestedDoctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCity, setSelectedCity] = useState(initialCity || '');
    const [selectedArea, setSelectedArea] = useState(initialArea || '');
    const [locations, setLocations] = useState<Locations>({});
    const [loadingLocations, setLoadingLocations] = useState(true);
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    useEffect(() => {
        console.log('Initial props:', { riskLevel, initialCity, initialArea, specialization });
        fetchLocations();
    }, []);

    useEffect(() => {
        console.log('State updated:', { selectedCity, selectedArea, riskLevel, specialization });
        if (selectedCity && selectedArea) {
            fetchSuggestedDoctors();
        }
    }, [riskLevel, selectedCity, selectedArea, specialization]);

    const fetchLocations = async () => {
        try {
            setLoadingLocations(true);
            console.log('Fetching locations...');
            const response = await getLocations();
            console.log('Locations response:', response);
            if (response.success) {
                setLocations(response.locations);
            } else {
                throw new Error(response.error || 'Failed to fetch locations');
            }
        } catch (err: any) {
            console.error('Error fetching locations:', err);
            setError(err.message || 'Failed to fetch locations');
        } finally {
            setLoadingLocations(false);
        }
    };

    const fetchSuggestedDoctors = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getSuggestedDoctors({
                riskLevel: riskLevel,
                city: selectedCity,
                area: selectedArea,
                specialization: specialization
            });
            console.log('Suggested doctors response:', response);
            if (response.success) {
                setDoctors(response.doctors);
            } else {
                setError(response.error || 'Failed to fetch suggested doctors');
            }
        } catch (err: any) {
            console.error('Error fetching suggested doctors:', err);
            setError(err.message || 'Failed to fetch suggested doctors');
        } finally {
            setLoading(false);
        }
    };

    const handleBookAppointment = (doctorId: number) => {
        navigate(`/book-appointment/${doctorId}`);
    };

    if (loadingLocations) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
                Recommended Doctors
            </Typography>

            <Box sx={{ mb: 4 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>City</InputLabel>
                            <Select
                                value={selectedCity}
                                label="City"
                                onChange={(e) => {
                                    console.log('City selected:', e.target.value);
                                    setSelectedCity(e.target.value);
                                    setSelectedArea('');
                                }}
                            >
                                {Object.keys(locations).map((city) => (
                                    <MenuItem key={city} value={city}>{city}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Area</InputLabel>
                            <Select
                                value={selectedArea}
                                label="Area"
                                onChange={(e) => {
                                    console.log('Area selected:', e.target.value);
                                    setSelectedArea(e.target.value);
                                }}
                                disabled={!selectedCity}
                            >
                                {selectedCity && locations[selectedCity]?.map((area) => (
                                    <MenuItem key={area} value={area}>{area}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Box>

            {!selectedCity || !selectedArea ? (
                <Typography color="textSecondary" align="center">
                    Please select both city and area to find doctors
                </Typography>
            ) : loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Typography color="error" align="center">
                    {error}
                </Typography>
            ) : doctors.length === 0 ? (
                <Typography align="center" color="textSecondary">
                    No doctors found in your area matching the criteria.
                </Typography>
            ) : (
                <Grid container spacing={3}>
                    {doctors.map((doctor) => (
                        <Grid item xs={12} md={6} key={doctor.id}>
                            <Card>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                        <Typography variant="h6" component="div">
                                            Dr. {doctor.fullName}
                                        </Typography>
                                        <Rating value={doctor.rating} readOnly precision={0.5} />
                                    </Box>
                                    
                                    <Typography color="textSecondary" gutterBottom>
                                        {doctor.specialization}
                                    </Typography>
                                    
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="body2">
                                            <strong>Hospital:</strong> {doctor.hospital}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Location:</strong> {doctor.area}, {doctor.city}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Experience:</strong> {doctor.experience} years
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="body2" gutterBottom>
                                            <strong>Available:</strong>
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {doctor.availability.days.map((day) => (
                                                <Chip
                                                    key={day}
                                                    label={day}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            ))}
                                        </Box>
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            {doctor.availability.startTime} - {doctor.availability.endTime}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mt: 2 }}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            fullWidth
                                            onClick={() => handleBookAppointment(doctor.id)}
                                        >
                                            Book Appointment
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export default DoctorSuggestions; 