import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Chip,
    Box,
    Typography,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { GridProps } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';

export interface DoctorFormData {
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
    password?: string;
    availability: {
        days: string[];
        startTime: string;
        endTime: string;
    };
    latitude?: number;
    longitude?: number;
}

interface DoctorFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: DoctorFormData) => void;
    initialData?: DoctorFormData | null;
    mode: 'create' | 'edit';
}

const DAYS_OF_WEEK = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
];

const DoctorFormModal: React.FC<DoctorFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode,
}) => {
    const [formData, setFormData] = useState<DoctorFormData>({
        fullName: '',
        specialization: '',
        qualifications: '',
        experience: 0,
        hospital: '',
        address: '',
        city: '',
        area: '',
        phoneNumber: '',
        email: '',
        password: '',
        availability: {
            days: [],
            startTime: '09:00',
            endTime: '17:00',
        },
        latitude: undefined,
        longitude: undefined
    });

    useEffect(() => {
        if (initialData) {
            const { password, ...rest } = initialData;
            setFormData(rest as DoctorFormData);
        }
    }, [initialData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: parseFloat(value) || 0,
        }));
    };

    const handleDayToggle = (day: string) => {
        setFormData((prev) => ({
            ...prev,
            availability: {
                ...prev.availability,
                days: prev.availability.days.includes(day)
                    ? prev.availability.days.filter((d) => d !== day)
                    : [...prev.availability.days, day],
            },
        }));
    };

    const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
        setFormData((prev) => ({
            ...prev,
            availability: {
                ...prev.availability,
                [field]: value,
            },
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {mode === 'create' ? 'Add New Doctor' : 'Edit Doctor Details'}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid2 container spacing={3}>
                        <Grid2 xs={12} sm={6} sx={{ display: 'flex' }}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid2>
                        <Grid2 xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Specialization"
                                name="specialization"
                                value={formData.specialization}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid2>
                        <Grid2 xs={12}>
                            <TextField
                                fullWidth
                                label="Qualifications"
                                name="qualifications"
                                value={formData.qualifications}
                                onChange={handleInputChange}
                                required
                                multiline
                                rows={2}
                            />
                        </Grid2>
                        <Grid2 xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Experience (years)"
                                name="experience"
                                type="number"
                                value={formData.experience}
                                onChange={handleNumberInputChange}
                                required
                            />
                        </Grid2>
                        <Grid2 xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Hospital"
                                name="hospital"
                                value={formData.hospital}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid2>
                        <Grid2 xs={12}>
                            <TextField
                                fullWidth
                                label="Address"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                required
                                multiline
                                rows={2}
                            />
                        </Grid2>
                        <Grid2 xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="City"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid2>
                        <Grid2 xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Area"
                                name="area"
                                value={formData.area}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid2>
                        <Grid2 xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid2>
                        <Grid2 xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid2>
                        <Grid2 xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Latitude"
                                name="latitude"
                                type="number"
                                value={formData.latitude || ''}
                                onChange={handleNumberInputChange}
                                inputProps={{ step: "0.000001" }}
                            />
                        </Grid2>
                        <Grid2 xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Longitude"
                                name="longitude"
                                type="number"
                                value={formData.longitude || ''}
                                onChange={handleNumberInputChange}
                                inputProps={{ step: "0.000001" }}
                            />
                        </Grid2>
                        {mode === 'create' && (
                            <Grid2 xs={12}>
                                <TextField
                                    fullWidth
                                    label="Password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                />
                            </Grid2>
                        )}
                        <Grid2 xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                                Availability
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                {DAYS_OF_WEEK.map((day) => (
                                    <Chip
                                        key={day}
                                        label={day}
                                        onClick={() => handleDayToggle(day)}
                                        color={formData.availability.days.includes(day) ? 'primary' : 'default'}
                                    />
                                ))}
                            </Box>
                            <Grid2 container spacing={2}>
                                <Grid2 xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Start Time"
                                        type="time"
                                        value={formData.availability.startTime}
                                        onChange={(e) => handleTimeChange('startTime', e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ step: 300 }}
                                    />
                                </Grid2>
                                <Grid2 xs={6}>
                                    <TextField
                                        fullWidth
                                        label="End Time"
                                        type="time"
                                        value={formData.availability.endTime}
                                        onChange={(e) => handleTimeChange('endTime', e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ step: 300 }}
                                    />
                                </Grid2>
                            </Grid2>
                        </Grid2>
                    </Grid2>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained" color="primary">
                        {mode === 'create' ? 'Add Doctor' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default DoctorFormModal; 