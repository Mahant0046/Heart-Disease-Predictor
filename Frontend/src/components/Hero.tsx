import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="relative py-20">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="https://public.readdy.ai/ai/img_res/c3fb72b52ab1a44c1b0a5b4219ac7ef6.jpg"
          alt="Medical Background"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/40"></div>
      </div>
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 font-['Libre_Franklin']">
            Check Your Heart Health Risk
          </h2>
          <p className="text-lg text-gray-600 mb-8 font-['Libre_Franklin']">
            Our advanced machine learning system analyzes your symptoms and health data to provide personalized heart disease risk assessment with high accuracy.
          </p>
          <button
            onClick={() => window.scrollTo({top: document.getElementById('assessment-form')?.offsetTop, behavior: 'smooth'})}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-red-200 !rounded-button whitespace-nowrap cursor-pointer"
          >
            Start Assessment <i className="fas fa-arrow-right ml-2 animate-bounce"></i>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero; 