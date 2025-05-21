import React from 'react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Heart Disease Prediction</h1>
          <p className="text-xl text-red-100 max-w-3xl mx-auto">
            Our mission is to make heart health assessment accessible to everyone through advanced AI technology.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                Heart disease is the leading cause of death worldwide. We're committed to changing this by providing accessible, accurate, and early detection tools powered by artificial intelligence.
              </p>
              <p className="text-lg text-gray-600">
                Our platform combines cutting-edge machine learning algorithms with medical expertise to help individuals understand their heart health risks and take proactive steps towards prevention.
              </p>
            </div>
            <div className="relative">
              <img 
                src="https://public.readdy.ai/ai/img_res/12f8040258cf995131a0c0870d0acec5.jpg" 
                alt="Heart health mission" 
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                <i className="fas fa-user-md text-red-600 text-4xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">Dr. Sarah Johnson</h3>
              <p className="text-gray-600 mb-4">Medical Director</p>
              <p className="text-gray-600">Cardiologist with 15+ years of experience in preventive cardiology.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                <i className="fas fa-laptop-code text-red-600 text-4xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">Michael Chen</h3>
              <p className="text-gray-600 mb-4">AI Lead</p>
              <p className="text-gray-600">Machine learning expert specializing in healthcare applications.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                <i className="fas fa-chart-line text-red-600 text-4xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">Emily Rodriguez</h3>
              <p className="text-gray-600 mb-4">Data Scientist</p>
              <p className="text-gray-600">Expert in health data analysis and predictive modeling.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <i className="fas fa-heart text-red-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Patient-Centered Care</h3>
              <p className="text-gray-600">We prioritize your health and well-being above all else.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <i className="fas fa-shield-alt text-red-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Data Privacy</h3>
              <p className="text-gray-600">Your health information is protected with the highest security standards.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <i className="fas fa-lightbulb text-red-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Innovation</h3>
              <p className="text-gray-600">We continuously improve our technology to provide better care.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-red-600">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Start Your Heart Health Journey?</h2>
          <p className="text-xl text-red-100 mb-8">Join thousands of users who have already discovered their heart health status.</p>
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

export default About; 