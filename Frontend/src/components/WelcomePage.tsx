import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header - You might want to extract this into a separate Header component later */}
      <header className="py-4 px-6 shadow-sm bg-white">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <i className="fas fa-heartbeat text-red-500 text-2xl mr-2"></i>
            <span className="text-xl font-semibold text-gray-900">Heart Health AI</span>
          </Link>
          <nav className="space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="text-gray-600 hover:text-red-600 font-medium transition-colors"
            >
              User Login
            </button>
            <button
              onClick={() => navigate('/doctor/login')}
              className="text-gray-600 hover:text-red-600 font-medium transition-colors"
            >
              Doctor Login
            </button>
            <button
              onClick={() => navigate('/admin/login')} // Link to Admin Login
              className="text-gray-600 hover:text-red-600 font-medium transition-colors"
            >
              Admin Login
            </button>
            {/* You can add other links like 'About Us', 'Contact' here */}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Predict Your Heart Health with <span className="text-red-500">AI</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Our advanced machine learning system helps you understand your heart disease risk factors and provides personalized recommendations for a healthier life.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/register')} // Changed to /register for new users
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 text-center"
                >
                  Get Started (Register)
                </button>
                <Link
                  to="/#features" // Example: link to features section on the same page
                  className="bg-white border-2 border-red-600 text-red-600 hover:bg-red-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 text-center"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://public.readdy.ai/ai/img_res/12f8040258cf995131a0c0870d0acec5.jpg" // Replace with your actual image path or URL
                alt="Heart health illustration"
                className="rounded-lg shadow-xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-lg shadow-lg">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <i className="fas fa-shield-alt text-green-600 text-2xl"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Model Accuracy</p>
                    <p className="text-2xl font-bold text-gray-900">98%</p> {/* Updated to your model accuracy */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50"> {/* Added id for Learn More link */}
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose Our System?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md text-center"> {/* Added text-center */}
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto"> {/* Added mx-auto */}
                <i className="fas fa-brain text-red-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Advanced AI Technology</h3>
              <p className="text-gray-600">Utilizing state-of-the-art machine learning algorithms for accurate predictions.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center"> {/* Added text-center */}
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto"> {/* Added mx-auto */}
                <i className="fas fa-user-md text-red-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Personalized Insights</h3>
              <p className="text-gray-600">Get customized recommendations based on your unique health profile.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center"> {/* Added text-center */}
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto"> {/* Added mx-auto */}
                <i className="fas fa-lock text-red-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Secure & Private</h3>
              <p className="text-gray-600">Your health data is protected with enterprise-grade security measures.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-red-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Register/Sign In</h3>
              <p className="text-gray-600">Create an account or sign in to access our assessment tool.</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Enter Your Data</h3>
              <p className="text-gray-600">Provide your health information through our guided form.</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get AI Prediction</h3>
              <p className="text-gray-600">Receive your personalized risk assessment instantly.</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">4</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Follow Plan</h3>
              <p className="text-gray-600">Use insights & recommendations for better heart health.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-600">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Take Control of Your Heart Health?</h2>
          <p className="text-xl text-red-100 mb-8">Our AI-powered assessment provides valuable insights in minutes.</p>
          <button
            onClick={() => navigate('/register')} // Changed to /register
            className="bg-white text-red-600 hover:bg-red-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 inline-block"
          >
            Register Now to Get Started
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 bg-gray-100">
        <p>© {new Date().getFullYear()} Heart Health AI. All rights reserved.</p>
        {/* Add links to privacy policy, terms, etc. if needed */}
      </footer>
    </div>
  );
};

export default WelcomePage;