import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Hero from '../components/Hero';
import AssessmentForm from '../components/AssessmentForm';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import { resources } from '../data/resources';

const MainLayout: React.FC = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if we're on the home page
  const isHomePage = location.pathname === '/home';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 font-libre-franklin">
      <Header />
      
      {/* Show Hero and AssessmentForm only on the home page */}
      {isHomePage ? (
        <>
          <Hero />
          <AssessmentForm />
          
          {/* Additional Resources section */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-4 font-['Libre_Franklin']">Additional Resources</h2>
                <p className="text-gray-600 max-w-2xl mx-auto font-['Libre_Franklin']">
                  Learn more about heart disease, prevention strategies, and emergency guidelines.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {resources.slice(0, 3).map((resource) => (
                  <a
                    href={`/resources/${resource.id}`}
                    key={resource.id}
                    className="block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  >
                    {resource.imageUrl && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={resource.imageUrl}
                          alt={resource.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center mb-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          resource.category === 'blog' ? 'bg-blue-100 text-blue-800' :
                          resource.category === 'video' ? 'bg-red-100 text-red-800' :
                          resource.category === 'article' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {resource.category.charAt(0).toUpperCase() + resource.category.slice(1)}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                        {resource.title}
                      </h3>
                      <p className="text-gray-600 mb-4 text-sm line-clamp-3">
                        {resource.description}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
              <div className="text-center mt-12">
                <a
                  href="/resources"
                  className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg transition-all"
                >
                  View All Resources
                  <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </section>
        </>
      ) : (
        // For all other pages, render the Outlet (dashboard, about, services, etc.)
        <main className="flex-grow">
          <Outlet />
        </main>
      )}

      {showScrollTop && <ScrollToTop />}
      <Footer />
    </div>
  );
};

export default MainLayout; 