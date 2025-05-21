import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiService from '../../services/api'; // Import the configured axios instance
import { API_ENDPOINTS } from '../../config/api'; // Import endpoint constants
import PasswordStrength from './PasswordStrength'; // For password strength UI
import { validatePassword, validateConfirmPassword, calculatePasswordStrength } from './validation';


const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Added loading state
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message || 'Invalid password.');
      return;
    }

    const confirmPasswordValidation = validateConfirmPassword(formData.newPassword, formData.confirmPassword);
    if (!confirmPasswordValidation.isValid) {
      setError(confirmPasswordValidation.message || 'Passwords do not match.');
      return;
    }

    const strength = calculatePasswordStrength(formData.newPassword);
    if (strength < 3) { // Enforce at least medium strength
        setError('Password is too weak. Please use a stronger password.');
        return;
    }

    setLoading(true);
    try {
      // Use the configured apiService and endpoint constant
      // The path is relative to API_BASE_URL in services/api.ts
      await apiService.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        token,
        newPassword: formData.newPassword
      });
      
      setMessage('Password has been reset successfully. You can now log in with your new password.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error("Reset Password Error:", err);
      setError(err.error || err.message || 'Failed to reset password. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    // ... (Invalid link display remains the same)
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Invalid Reset Link
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                This password reset link is invalid or has expired.
              </p>
              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Request a new password reset link
                </button>
              </div>
            </div>
          </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your new password.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4"> {/* Adjusted for spacing */}
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  name="newPassword"
                  type={passwordVisible ? "text" : "password"}
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="New Password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
                <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 focus:outline-none"
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                >
                    <i className={`fas ${passwordVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              <PasswordStrength password={formData.newPassword} />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={confirmPasswordVisible ? "text" : "password"}
                  required
                  className={`appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:z-10 sm:text-sm ${
                    formData.confirmPassword && formData.newPassword !== formData.confirmPassword
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
                 <button
                    type="button"
                    onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 focus:outline-none"
                    aria-label={confirmPasswordVisible ? "Hide password" : "Show password"}
                >
                    <i className={`fas ${confirmPasswordVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
               {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
                )}
            </div>
          </div>

          {message && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">{message}</div>
          )}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
         <div className="text-sm text-center mt-4">
            <button
                onClick={() => navigate('/login')}
                className="font-medium text-indigo-600 hover:text-indigo-500"
            >
                Back to Login
            </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;