import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from './auth/LoginForm';

const Auth: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <i className="fas fa-heartbeat text-red-500 text-xl sm:text-2xl mr-2"></i>
              <Link to="/" className="text-lg sm:text-xl font-semibold text-gray-900">Heart Disease Prediction</Link>
            </div>
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
              src="https://public.readdy.ai/ai/img_res/12f8040258cf995131a0c0870d0acec5.jpg"
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
          <LoginForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex justify-center sm:justify-start space-x-4 sm:space-x-6 mb-4 sm:mb-0">
              <button className="text-gray-400 hover:text-gray-500 focus:outline-none">
                <i className="fab fa-facebook text-lg sm:text-xl"></i>
              </button>
              <button className="text-gray-400 hover:text-gray-500 focus:outline-none">
                <i className="fab fa-twitter text-lg sm:text-xl"></i>
              </button>
              <button className="text-gray-400 hover:text-gray-500 focus:outline-none">
                <i className="fab fa-instagram text-lg sm:text-xl"></i>
              </button>
              <button className="text-gray-400 hover:text-gray-500 focus:outline-none">
                <i className="fab fa-linkedin text-lg sm:text-xl"></i>
              </button>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-sm text-gray-500">
                &copy; 2025 Heart Disease Prediction. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Auth; 