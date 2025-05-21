// src/components/dashboard/DashboardPage.tsx
import React, { useEffect, useState, useCallback } from 'react'; // Added useCallback
import { useNavigate } from 'react-router-dom';
import ProfileCard from './ProfileCard';
import PredictionHistory from './PredictionHistory'; // Your history display component
import ProfileSettings from './ProfileSettings';
import { 
    getProfile, 
    updateProfile, 
    User, 
    checkAuth,
    getPredictionHistory, // Import new function
    PredictionHistoryRecord, // Import type for history items
    PaginatedHistoryResponse // Import type for pagination response
} from '../../services/api';

interface DashboardDisplayProfile extends User {
  healthScore: number;  // Required for display
  lastCheckup: string;  // Required for display
}

// PredictionRecord type definition is now in api.ts as PredictionHistoryRecord
// We can use that directly or redefine it here if structure slightly differs for display

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<DashboardDisplayProfile | null>(null);
  const [history, setHistory] = useState<PredictionHistoryRecord[]>([]); // Use PredictionHistoryRecord
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
  const [loading, setLoading] = useState(true); // For profile loading
  const [error, setError] = useState<string | null>(null); // For profile errors

  const fetchPredictionHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
        const response: PaginatedHistoryResponse = await getPredictionHistory(page);
        if (response.success) {
            setHistory(page === 1 ? response.history : prevHistory => [...prevHistory, ...response.history]); // Append for infinite scroll or replace for pagination
            setHistoryCurrentPage(response.currentPage);
            setHistoryTotalPages(response.pages);
        } else {
            setHistoryError(response.error || "Failed to load prediction history.");
        }
    } catch (err: any) {
        console.error("Fetch history error:", err);
        setHistoryError(err.error || "Could not load prediction history.");
    } finally {
        setHistoryLoading(false);
    }
  }, []); // Empty dependency array if itemsPerPage is fixed, or add itemsPerPage

  useEffect(() => {
    const checkAuthenticationAndFetchData = async () => {
      setLoading(true);
      try {
        const authStatus = await checkAuth();
        if (!authStatus.authenticated || !authStatus.user) {
          navigate('/login');
          return;
        }
        
        const userProfile = await getProfile();
        const formattedProfile: DashboardDisplayProfile = {
          ...userProfile,
          dateOfBirth: userProfile.dateOfBirth || null,
          gender: userProfile.gender || undefined,
          healthScore: userProfile.healthScore || 75,
          lastCheckup: userProfile.lastCheckup || new Date().toISOString().split('T')[0],
        };
        setProfile(formattedProfile);
        setError(null);
        
        // Fetch history after profile is loaded and user is authenticated
        fetchPredictionHistory(1); 

      } catch (err: any) {
        console.error('Auth or Profile Fetch Error:', err);
        if (err.status === 401) navigate('/login');
        else setError(err.error || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    checkAuthenticationAndFetchData();
  }, [navigate, fetchPredictionHistory]); // Added fetchPredictionHistory


  const handleProfileUpdate = async (updatedProfileData: Partial<User>) => {
    if (!profile) return;
    const apiUpdateData: Partial<User> = {
        ...updatedProfileData,
        dateOfBirth: updatedProfileData.dateOfBirth 
            ? new Date(updatedProfileData.dateOfBirth).toISOString().split('T')[0] 
            : null,
    };
    try {
      setLoading(true);
      const response = await updateProfile(apiUpdateData);
      if (response.user) {
        setProfile(prev => {
          if (!prev) return null;
          const updatedUser = response.user as User;
          // Ensure required fields are present for DashboardDisplayProfile
          const healthScore = updatedUser.healthScore ?? prev.healthScore ?? 75;
          const lastCheckup = updatedUser.lastCheckup ?? prev.lastCheckup ?? new Date().toISOString().split('T')[0];
          
          return {
            ...prev,
            ...updatedUser,
            dateOfBirth: updatedUser.dateOfBirth || null,
            healthScore,
            lastCheckup
          } as DashboardDisplayProfile;
        });
        setActiveTab('overview'); 
        setError(null);
      } else {
        setError(response.error || 'Profile update failed.');
      }
    } catch (err: any) {
      setError(err.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  // ... (loading, error, !profile return statements as before) ...

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Profile Card */}
          <div className="w-full lg:w-1/3">
            {profile && ( // Ensure profile is loaded before rendering ProfileCard
                <ProfileCard 
                fullName={profile.fullName}
                email={profile.email}
                dateOfBirth={profile.dateOfBirth ? profile.dateOfBirth : undefined} 
                gender={profile.gender}
                phoneNumber={profile.phoneNumber}
                address={profile.address}
                healthScore={profile.healthScore}
                lastCheckup={profile.lastCheckup}
                />
            )}
          </div>

          {/* Right Column - Tabs */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* ... (Tab Navigation as before) ... */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'overview'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Overview & History
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'settings'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Profile Settings
                    </button>
                </nav>
              </div>

              <div className="p-6">
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {activeTab === 'overview' && (
                  <>
                    {historyLoading && <p>Loading history...</p>}
                    {historyError && <p className="text-red-500">{historyError}</p>}
                    {!historyLoading && !historyError && <PredictionHistory history={history} />}
                    {historyTotalPages > 1 && (
                      <div className="mt-4 flex justify-center">
                        <span className="text-gray-600">Page {historyCurrentPage} of {historyTotalPages}</span>
                      </div>
                    )}
                  </>
                )}
                {activeTab === 'settings' && profile && (
                  <ProfileSettings
                    // ... (props as before)
                    fullName={profile.fullName}
                    email={profile.email}
                    dateOfBirth={profile.dateOfBirth ? profile.dateOfBirth : undefined}
                    gender={profile.gender}
                    phoneNumber={profile.phoneNumber}
                    address={profile.address}
                    onUpdate={handleProfileUpdate}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;