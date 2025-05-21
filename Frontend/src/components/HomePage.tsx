import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Dashboard</h1>
        <p className="text-xl text-gray-600">Monitor and manage your heart health</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {/* Quick Assessment Card */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="text-red-600 text-4xl mb-4">
            <i className="fas fa-heartbeat"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Quick Assessment</h2>
          <p className="text-gray-600 mb-4">
            Take a quick assessment to evaluate your current heart health status and get personalized recommendations.
          </p>
          <Link
            to="/assessment"
            className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Start Assessment
          </Link>
        </div>

        {/* View History Card */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="text-blue-600 text-4xl mb-4">
            <i className="fas fa-history"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">View History</h2>
          <p className="text-gray-600 mb-4">
            Access your past assessments and track your heart health progress over time.
          </p>
          <Link
            to="/dashboard"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View History
          </Link>
        </div>

        {/* Health Resources Card */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="text-green-600 text-4xl mb-4">
            <i className="fas fa-book-medical"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Health Resources</h2>
          <p className="text-gray-600 mb-4">
            Explore educational resources and learn more about maintaining a healthy heart.
          </p>
          <Link
            to="/resources"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Browse Resources
          </Link>
        </div>
      </div>

      {/* Health Tips Section */}
      <section className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Daily Health Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-gray-800 mb-2">Stay Active</h3>
            <p className="text-gray-600 text-sm">Aim for at least 30 minutes of moderate exercise daily.</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-gray-800 mb-2">Healthy Diet</h3>
            <p className="text-gray-600 text-sm">Include plenty of fruits, vegetables, and whole grains in your diet.</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-gray-800 mb-2">Manage Stress</h3>
            <p className="text-gray-600 text-sm">Practice stress-reduction techniques like meditation or deep breathing.</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-gray-800 mb-2">Regular Check-ups</h3>
            <p className="text-gray-600 text-sm">Schedule regular health check-ups with your doctor.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 