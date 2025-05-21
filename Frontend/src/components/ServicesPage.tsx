import React from 'react';

const ServicesPage: React.FC = () => {
  const services = [
    {
      title: 'Heart Disease Risk Assessment',
      description: 'Get a comprehensive evaluation of your heart disease risk factors using our advanced AI-powered system.',
      icon: 'fa-heartbeat'
    },
    {
      title: 'Personalized Recommendations',
      description: 'Receive tailored health recommendations based on your risk assessment results and personal health profile.',
      icon: 'fa-user-md'
    },
    {
      title: 'Health Tracking',
      description: 'Monitor your heart health metrics over time and track improvements in your risk factors.',
      icon: 'fa-chart-line'
    },
    {
      title: 'Educational Resources',
      description: 'Access a wealth of information about heart health, prevention strategies, and healthy lifestyle choices.',
      icon: 'fa-book-medical'
    },
    {
      title: 'Regular Updates',
      description: 'Stay informed with regular updates about your heart health status and new prevention strategies.',
      icon: 'fa-bell'
    },
    {
      title: 'Emergency Guidelines',
      description: 'Learn about warning signs and emergency procedures for heart-related conditions.',
      icon: 'fa-exclamation-triangle'
    }
  ];

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Our Services</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {services.map((service, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
            <div className="text-red-600 text-4xl mb-4">
              <i className={`fas ${service.icon}`}></i>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">{service.title}</h2>
            <p className="text-gray-600">{service.description}</p>
          </div>
        ))}
      </div>

      <section className="bg-gray-50 rounded-lg p-8 mt-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-red-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-red-600">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Complete Assessment</h3>
            <p className="text-gray-600">Fill out our comprehensive health questionnaire to evaluate your risk factors.</p>
          </div>
          <div className="text-center">
            <div className="bg-red-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-red-600">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Get Results</h3>
            <p className="text-gray-600">Receive your personalized risk assessment and detailed analysis.</p>
          </div>
          <div className="text-center">
            <div className="bg-red-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-red-600">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Follow Recommendations</h3>
            <p className="text-gray-600">Implement personalized recommendations to improve your heart health.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage; 