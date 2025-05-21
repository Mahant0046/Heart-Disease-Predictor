import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, Paper } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../services/api';

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

const DoctorProfile: React.FC = () => {
  const { currentUser } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    specialization: '',
    qualifications: '',
    experience: 0,
    hospital: '',
    address: '',
    phoneNumber: '',
    email: '',
    availability: {
      days: [] as string[],
      startTime: '',
      endTime: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const response = await axiosInstance.get(`/api/doctors/${currentUser?.id}`);
        setDoctor(response.data);
        setFormData({
          fullName: response.data.fullName,
          specialization: response.data.specialization,
          qualifications: response.data.qualifications,
          experience: response.data.experience,
          hospital: response.data.hospital,
          address: response.data.address,
          phoneNumber: response.data.phoneNumber,
          email: response.data.email,
          availability: response.data.availability
        });
      } catch (err) {
        setError('Failed to fetch doctor profile');
        console.error('Error fetching doctor profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.id) {
      fetchDoctorProfile();
    }
  }, [currentUser?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await axiosInstance.put(`/api/doctors/${currentUser?.id}`, formData);
      setDoctor(response.data);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Doctor Profile
        </Typography>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        {success && (
          <Typography color="success.main" sx={{ mb: 2 }}>
            {success}
          </Typography>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Specialization"
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Qualifications"
            name="qualifications"
            value={formData.qualifications}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Experience (years)"
            name="experience"
            type="number"
            value={formData.experience}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Hospital"
            name="hospital"
            value={formData.hospital}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Phone Number"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            Update Profile
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default DoctorProfile; 