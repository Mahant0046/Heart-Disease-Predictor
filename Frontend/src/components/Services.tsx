import React from 'react';
import { Link } from 'react-router-dom';

const Services: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Services</h1>
          <p className="text-xl text-red-100 max-w-3xl mx-auto">
            Comprehensive heart health assessment and personalized care solutions
          </p>
        </div>
      </section>

      {/* Main Services Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <i className="fas fa-heartbeat text-red-600 text-2xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Heart Disease Risk Assessment</h2>
              <p className="text-gray-600 mb-6">
                Our AI-powered system analyzes your health data to provide accurate risk assessments for various heart conditions.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span className="text-gray-600">Personalized risk scoring</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span className="text-gray-600">Comprehensive health analysis</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span className="text-gray-600">Early detection capabilities</span>
                </li>
              </ul>
              <Link 
                to="/auth" 
                className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Get Started
              </Link>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <i className="fas fa-chart-line text-red-600 text-2xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Health Monitoring</h2>
              <p className="text-gray-600 mb-6">
                Track your heart health metrics over time and receive personalized insights and recommendations.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span className="text-gray-600">Real-time health tracking</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span className="text-gray-600">Progress visualization</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span className="text-gray-600">Customized health goals</span>
                </li>
              </ul>
              <Link 
                to="/auth" 
                className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Start Monitoring
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Services Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Additional Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <i className="fas fa-book-medical text-red-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Educational Resources</h3>
              <p className="text-gray-600">Access to comprehensive heart health information and preventive care guides.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <i className="fas fa-comments text-red-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Expert Consultation</h3>
              <p className="text-gray-600">Connect with healthcare professionals for personalized advice and guidance.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <i className="fas fa-calendar-check text-red-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Health Planning</h3>
              <p className="text-gray-600">Create and follow personalized health improvement plans with our guidance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Simple Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Basic</h3>
              <p className="text-4xl font-bold text-red-600 mb-6">Free</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span className="text-gray-600">Basic risk assessment</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span className="text-gray-600">Health tracking</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span className="text-gray-600">Educational resources</span>
                </li>
              </ul>
              <Link 
                to="/auth" 
                className="block text-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Get Started
              </Link>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-red-600 transform scale-105">
              <div className="absolute top-0 right-0 bg-red-600 text-white px-4 py-1 rounded-bl-lg">
                Popular
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Premium</h3>
              <p className="text-4xl font-bold text-red-600 mb-6">$9.99<span className="text-lg text-gray-600">/month</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span className="text-gray-600">Advanced risk assessment</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span className="text-gray-600">Detailed health insights</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span className="text-gray-600">Expert consultation</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span className="text-gray-600">Personalized health plans</span>
                </li>
              </ul>
              <Link 
                to="/auth" 
                className="block text-center bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Get Started
              </Link>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise</h3>
              <p className="text-4xl font-bold text-red-600 mb-6">Custom</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span className="text-gray-600">All Premium features</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span className="text-gray-600">Custom integrations</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span className="text-gray-600">Priority support</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                  <span className="text-gray-600">Team management</span>
                </li>
              </ul>
              <Link 
                to="/contact" 
                className="block text-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-red-600">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Improve Your Heart Health?</h2>
          <p className="text-xl text-red-100 mb-8">Choose the plan that's right for you and start your journey today.</p>
          <Link 
            to="/auth" 
            className="bg-white text-red-600 hover:bg-red-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 inline-block"
          >
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Services; 