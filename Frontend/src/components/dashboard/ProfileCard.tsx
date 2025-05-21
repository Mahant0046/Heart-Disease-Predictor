import React from 'react';

interface ProfileCardProps {
  fullName: string;
  email: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  address?: string;
  healthScore: number;
  lastCheckup: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ 
  fullName, 
  email, 
  dateOfBirth, 
  gender, 
  phoneNumber, 
  address, 
  healthScore, 
  lastCheckup 
}) => {
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return 'N/A';
    
    try {
      // Handle ISO date format
      const date = new Date(dateOfBirth);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date format:', dateOfBirth);
        return 'N/A';
      }
      
      const today = new Date();
      let age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      console.error('Error calculating age:', error);
      return 'N/A';
    }
  };

  const formatGender = (gender?: string) => {
    if (!gender) return 'Not specified';
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('Invalid date format:', dateString);
        return 'N/A';
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 w-full max-w-sm mx-auto">
      <div className="flex items-center justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-3xl text-blue-500">{fullName.charAt(0)}</span>
        </div>
      </div>
      
      <h2 className="text-xl font-bold mb-4 text-center text-gray-800">{fullName}</h2>
      
      <div className="space-y-3">
        <div className="flex items-center">
          <i className="fas fa-envelope text-gray-400 w-6"></i>
          <p className="ml-2 text-gray-600">{email}</p>
        </div>
        
        <div className="flex items-center">
          <i className="fas fa-user text-gray-400 w-6"></i>
          <p className="ml-2 text-gray-600">{calculateAge(dateOfBirth)} years old</p>
        </div>
        
        <div className="flex items-center">
          <i className="fas fa-venus-mars text-gray-400 w-6"></i>
          <p className="ml-2 text-gray-600">{formatGender(gender)}</p>
        </div>

        {phoneNumber && (
          <div className="flex items-center">
            <i className="fas fa-phone text-gray-400 w-6"></i>
            <p className="ml-2 text-gray-600">{phoneNumber}</p>
          </div>
        )}

        {address && (
          <div className="flex items-center">
            <i className="fas fa-map-marker-alt text-gray-400 w-6"></i>
            <p className="ml-2 text-gray-600">{address}</p>
          </div>
        )}
        
        <div className="flex items-center">
          <i className="fas fa-calendar-check text-gray-400 w-6"></i>
          <p className="ml-2 text-gray-600">Last checkup: {formatDate(lastCheckup)}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Health Score</span>
          <span className={`font-bold ${getHealthScoreColor(healthScore)}`}>
            {healthScore}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div 
            className={`h-2.5 rounded-full ${getHealthScoreColor(healthScore).replace('text-', 'bg-')}`}
            style={{ width: `${healthScore}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
