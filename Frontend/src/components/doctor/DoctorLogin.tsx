import React, { useState } from 'react';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DoctorLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [openResetDialog, setOpenResetDialog] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetPassword, setResetPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState<string | null>(null);
    const navigate = useNavigate();
    const { loginDoctor } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await axiosInstance.post('/api/doctor/login', {
                email,
                password
            });

            if (response.data.doctor) {
                loginDoctor(response.data.doctor);
                navigate('/doctor/dashboard');
            }
        } catch (error: any) {
            setError(error.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        setResetLoading(true);
        setError(null);
        setResetSuccess(null);

        try {
            const response = await axiosInstance.post('/api/doctor/simple-reset-password', {
                email: resetEmail,
                newPassword: resetPassword
            });
            setResetSuccess('Password has been reset successfully. You can now login with your new password.');
            setOpenResetDialog(false);
            setResetEmail('');
            setResetPassword('');
        } catch (error: any) {
            setError(error.response?.data?.error || 'Failed to reset password');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        width: '100%',
                        borderRadius: 2
                    }}
                >
                    <Typography variant="h4" component="h1" gutterBottom align="center">
                        Doctor Login
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            autoFocus
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{
                                mt: 3,
                                mb: 2,
                                py: 1.5,
                                background: 'linear-gradient(to right, #dc2626, #ef4444)',
                                '&:hover': {
                                    background: 'linear-gradient(to right, #b91c1c, #dc2626)'
                                }
                            }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Login'}
                        </Button>
                        <Button
                            fullWidth
                            variant="text"
                            onClick={() => setOpenResetDialog(true)}
                            sx={{ mb: 2 }}
                        >
                            Forgot Password?
                        </Button>
                    </form>
                </Paper>
            </Box>

            {/* Password Reset Dialog */}
            <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Email Address"
                        type="email"
                        fullWidth
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="New Password"
                        type="password"
                        fullWidth
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                    />
                    {resetSuccess && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                            {resetSuccess}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenResetDialog(false)}>Cancel</Button>
                    <Button 
                        onClick={handleResetPassword} 
                        variant="contained" 
                        disabled={resetLoading || !resetEmail || !resetPassword}
                        sx={{
                            background: 'linear-gradient(to right, #dc2626, #ef4444)',
                            '&:hover': {
                                background: 'linear-gradient(to right, #b91c1c, #dc2626)'
                            }
                        }}
                    >
                        {resetLoading ? <CircularProgress size={24} /> : 'Reset Password'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default DoctorLogin; 