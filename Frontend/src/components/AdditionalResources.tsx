import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export interface Resource {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  category: string;
  date?: string;
}

export const getResources = async (): Promise<{ resources: Resource[] }> => {
  const response = await fetch('/api/resources');
  if (!response.ok) {
    throw new Error('Failed to fetch resources');
  }
  return response.json();
};

const AdditionalResources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await getResources();
        setResources(data.resources.map((resource: any) => ({
          ...resource,
          id: resource.id.toString(),
        }))); // Assuming 'resources' is the key in PaginatedResourcesResponse
        setError(null);
      } catch (err) {
        setError('Failed to load resources');
        console.error('Error fetching resources:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Additional Resources
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Explore our collection of articles, videos, and tools to help you maintain a healthy heart.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <div key={resource.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
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
                  {resource.date && (
                    <span className="ml-2 text-sm text-gray-500">
                      {new Date(resource.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {resource.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {resource.description}
                </p>
                <Link
                  to={`/resources/${resource.id}`}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  Learn More
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Stay Updated
          </h2>
          <p className="text-gray-600 mb-6">
            Subscribe to our newsletter for the latest heart health tips and resources.
          </p>
          <div className="max-w-md mx-auto">
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalResources;