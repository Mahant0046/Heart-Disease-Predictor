import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">About Our System</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <section className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Mission</h2>
          <p className="text-gray-600 mb-6">
            We are dedicated to providing accurate and accessible heart disease risk assessment
            using advanced machine learning technology. Our goal is to empower individuals
            with knowledge about their heart health and provide actionable insights for
            prevention and management.
          </p>
        </section>

        <section className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Technology</h2>
          <p className="text-gray-600 mb-6">
            Our system utilizes state-of-the-art machine learning algorithms trained on
            extensive medical data to provide accurate risk assessments. We continuously
            update our models to incorporate the latest medical research and improve
            prediction accuracy.
          </p>
        </section>

        <section className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Team</h2>
          <p className="text-gray-600 mb-6">
            Our team consists of healthcare professionals, data scientists, and software
            engineers working together to create a reliable and user-friendly platform
            for heart disease risk assessment.
          </p>
        </section>

        <section className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Commitment</h2>
          <p className="text-gray-600 mb-6">
            We are committed to:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Providing accurate and reliable risk assessments</li>
            <li>Maintaining the highest standards of data privacy and security</li>
            <li>Supporting users with comprehensive health recommendations</li>
            <li>Continuously improving our system based on user feedback</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AboutPage; 