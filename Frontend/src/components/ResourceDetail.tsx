// src/components/ResourceDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Use the EXPORTED name from api.ts
import { getResource, Resource } from '../services/api';

const ResourceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResourceDetails = async () => { // Renamed function for clarity
      setLoading(true);
      setError(null);
      try {
        if (!id) {
          setError('Resource ID is missing.');
          setLoading(false);
          return;
        }
        // Call the exported getResource function from api.ts
        const response = await getResource(parseInt(id, 10));

        if (response.success && response.resource) {
          setResource(response.resource);
        } else {
          setError(response.error || 'Resource not found or failed to load.');
          setResource(null);
        }
      } catch (err: any) {
        // err might be the processed error object from the axios interceptor
        setError(err.error || err.message || 'An unexpected error occurred while fetching the resource.');
        console.error('Error fetching resource:', err);
        setResource(null);
      } finally {
        setLoading(false);
      }
    };

    fetchResourceDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-red-500 text-lg mb-4">{error || 'Resource not found.'}</p>
          <button
            onClick={() => navigate('/resources')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Resources
          </button>
        </div>
      </div>
    );
  }

  // All other parts of the component (return statement for displaying the resource)
  // remain the same as the previous correct version, using resource.datePublished
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/resources')}
          className="mb-8 flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-150"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Resources
        </button>

        <article className="bg-white rounded-lg shadow-xl overflow-hidden">
          {resource.imageUrl && (
            <div className="h-72 sm:h-80 md:h-96 overflow-hidden">
              <img
                src={resource.imageUrl}
                alt={resource.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center mb-4 text-sm">
              <span className={`px-3 py-1 font-semibold rounded-full mr-3 mb-2 sm:mb-0 ${
                resource.category === 'blog' ? 'bg-blue-100 text-blue-800' :
                resource.category === 'video' ? 'bg-red-100 text-red-800' :
                resource.category === 'article' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {resource.category.charAt(0).toUpperCase() + resource.category.slice(1)}
              </span>
              {resource.datePublished ? (
                <span className="text-gray-500">
                  Published: {new Date(resource.datePublished).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              ) : (
                <span className="text-gray-500">Date not available</span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {resource.title}
            </h1>

            <p className="text-md sm:text-lg text-gray-700 mb-6 leading-relaxed">
              {resource.description}
            </p>

            {resource.content && (
              <div className="prose max-w-none text-gray-800 leading-loose">
                <p>{resource.content}</p>
              </div>
            )}

            {resource.url && (
              <div className="mt-8">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                >
                  View Original Source
                  <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5zM5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
};

export default ResourceDetail;