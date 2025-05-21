// src/components/auth/LoginForm.tsx
import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login, UserAuthApiResponse } from '../../services/api';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import { useNotification } from '../../context/NotificationContext';

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useAuth(); // Correctly destructure 'loginUser'
  const { notify } = useNotification();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const apiResponse: UserAuthApiResponse = await login(formData);
      if (apiResponse.user && apiResponse.message === 'User login successful') {
        loginUser(apiResponse.user);
        notify({ message: 'Login successful!', type: 'success' });
        const from = location.state?.from?.pathname || "/home";
        navigate(from, { replace: true });
      } else {
        setError(apiResponse.error || 'Login failed: Unexpected server response.');
        notify({ message: apiResponse.error || 'Login failed: Unexpected server response.', type: 'error' });
      }
    } catch (err: any) {
      setError(err.error || err.message || 'Login failed. Please check credentials.');
      notify({ message: err.error || err.message || 'Login failed. Please check credentials.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <Link to="/" className="flex items-center mb-4 sm:mb-0">
              <i className="fas fa-heartbeat text-red-500 text-xl sm:text-2xl mr-2"></i>
              <span className="text-lg sm:text-xl font-semibold text-gray-900">Heart Disease Prediction</span>
            </Link>
            <nav>
              <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">Home</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden md:flex">
          {/* Left Column - Image */}
          <div className="hidden md:block md:w-1/2 overflow-hidden relative bg-blue-50">
            <img
              src="https://public.readdy.ai/ai/img_res/12f8040258cf995131a0c0870d0acec5.jpg" // Ensure this image exists in public/assets
              alt="Heart health illustration"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 text-white bg-gradient-to-t from-blue-900/80 to-transparent">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Predict. Prevent. Protect.</h2>
              <p className="text-sm sm:text-base text-white/90">Early detection is key to heart disease prevention. Join our platform to monitor your heart health.</p>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="p-4 sm:p-6 md:p-8 md:w-1/2 flex flex-col justify-center">
            {error && (
              <div className="mb-4 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <div className="mb-4 sm:mb-6 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                Sign in to your account
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                Welcome back! Please enter your details.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="email-login" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-envelope text-gray-400"></i>
                  </div>
                  <input
                    id="email-login"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password-login" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-lock text-gray-400"></i>
                  </div>
                  <input
                    id="password-login"
                    name="password"
                    type={passwordVisible ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="••••••••"
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
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-gray-700">
                    Remember me
                  </label>
                </div>
                <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex justify-center sm:justify-start space-x-4 sm:space-x-6 mb-4 sm:mb-0">
              {/* Social media icons */}
            </div>
            <div className="text-center sm:text-right">
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} Heart Disease Prediction. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default LoginForm;