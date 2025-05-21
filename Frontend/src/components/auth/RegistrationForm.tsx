// src/components/auth/RegistrationForm.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Added Link
import PasswordStrength from './PasswordStrength';
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateFullName,
  validateDateOfBirth,
  validateGender,
  validateTerms,
  validatePhoneNumber,
  validateAddress,
  calculatePasswordStrength
} from './validation';
import { register, UserAuthApiResponse, UserRegistrationData } from '../../services/api'; // Import named export and type

const RegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    dateOfBirth: '', // Expects YYYY-MM-DD from date input
    gender: '',
    phoneNumber: '',
    address: '',
    agreeTerms: false
  });
  const [error, setError] = useState<string | null>(null); // Allow null
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { // Added HTMLTextAreaElement
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // No need for handleTextareaChange, merged into handleChange

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous error

    // Validate all fields
    const validations = [
      validateEmail(formData.email),
      validatePassword(formData.password),
      validateConfirmPassword(formData.password, formData.confirmPassword),
      validateFullName(formData.fullName),
      validateDateOfBirth(formData.dateOfBirth),
      validateGender(formData.gender), // Ensure gender is required if it should be
      validatePhoneNumber(formData.phoneNumber),
      validateAddress(formData.address),
      validateTerms(formData.agreeTerms)
    ];

    const invalidField = validations.find(v => !v.isValid);
    if (invalidField) {
      setError(invalidField.message || 'Validation failed. Please check all fields.');
      setIsLoading(false);
      return;
    }

    const strength = calculatePasswordStrength(formData.password);
    if (strength < 3) { // Example: require at least medium strength
      setError('Password is too weak. Please use a stronger password.');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // Prepare data for the API
      const apiData: UserRegistrationData = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender,
        phoneNumber: formData.phoneNumber,
        address: formData.address
      };

      const response: UserAuthApiResponse = await register(apiData); // Use correct function
      
      if (response.user && response.message === 'User registered successfully') {
        // Decide if you want to auto-login or redirect to login page
        // For now, redirecting to login.
        navigate('/login?registered=true'); 
      } else {
        setError(response.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Registration error in component:', err);
      setError(err.error || err.message || 'An error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // ... (rest of the JSX return statement remains the same as your provided code) ...
  // Ensure input IDs are unique if this form and LoginForm are on the same page (not typical for SPA routes)
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
              src="https://public.readdy.ai/ai/img_res/12f8040258cf995131a0c0870d0acec5.jpg" // Example, use a relevant image
              alt="Heart health illustration"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 text-white bg-gradient-to-t from-blue-900/80 to-transparent">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Join Our Community</h2>
              <p className="text-sm sm:text-base text-white/90">Take the first step towards proactive heart health management.</p>
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
                Create Your Account
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                Start your heart health journey today.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="reg-fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-user text-gray-400"></i>
                  </div>
                  <input id="reg-fullName" name="fullName" type="text" autoComplete="name" required value={formData.fullName} onChange={handleChange}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="John Doe" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-envelope text-gray-400"></i>
                  </div>
                  <input id="reg-email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="you@example.com" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-lock text-gray-400"></i>
                  </div>
                  <input id="reg-password" name="password" type={passwordVisible ? "text" : "password"} autoComplete="new-password" required value={formData.password} onChange={handleChange}
                    className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500">
                    <i className={`fas ${passwordVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                <PasswordStrength password={formData.password} />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="reg-confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-lock text-gray-400"></i>
                  </div>
                  <input id="reg-confirmPassword" name="confirmPassword" type={confirmPasswordVisible ? "text" : "password"} autoComplete="new-password" required value={formData.confirmPassword} onChange={handleChange}
                    className={`appearance-none block w-full pl-10 pr-10 py-2 border rounded-lg placeholder-gray-400 focus:outline-none sm:text-sm ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="••••••••" />
                   <button type="button" onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500">
                    <i className={`fas ${confirmPasswordVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">Passwords do not match.</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                  <label htmlFor="reg-dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input id="reg-dateOfBirth" name="dateOfBirth" type="date" required value={formData.dateOfBirth} onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>

              {/* Gender */}
              <div>
                  <label htmlFor="reg-gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select id="reg-gender" name="gender" required value={formData.gender} onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
              </div>

              {/* Phone Number */}
               <div>
                  <label htmlFor="reg-phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input id="reg-phoneNumber" name="phoneNumber" type="tel" required value={formData.phoneNumber} onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="+1 (555) 000-0000" />
              </div>
              
              {/* Address */}
              <div>
                  <label htmlFor="reg-address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea id="reg-address" name="address" required value={formData.address} onChange={handleChange} rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="123 Main St, Anytown, USA" />
              </div>


              <div className="flex items-start">
                <div className="flex items-center h-5">
                    <input id="agreeTerms" name="agreeTerms" type="checkbox" required checked={formData.agreeTerms} onChange={handleChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded" />
                </div>
                <div className="ml-3 text-sm">
                    <label htmlFor="agreeTerms" className="font-medium text-gray-700">
                        I agree to the{' '}
                        <Link to="/terms" className="text-blue-600 hover:text-blue-500">Terms and Conditions</Link>
                    </label>
                </div>
              </div>

              <div>
                <button type="submit" disabled={isLoading}
                  className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Create Account'}
                </button>
              </div>
            </form>

            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
         {/* ... Footer content ... */}
      </footer>
    </div>
  );
};

export default RegistrationForm;