import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isUserAuthenticated, isAdminAuthenticated, performUserLogout, performAdminLogout } = useAuth();

  const handleSignOut = async () => {
    try {
      if (isAdminAuthenticated) {
        await performAdminLogout();
      } else {
        await performUserLogout();
      }
      navigate('/welcome', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/welcome', { replace: true });
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getLinkClass = (path: string) => {
    const baseClass = "text-gray-700 hover:text-red-600 font-medium transition-colors";
    return `${baseClass} ${isActive(path) ? 'text-red-600 border-b-2 border-red-600' : ''}`;
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 font-libre-franklin">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <i className="fas fa-heartbeat text-red-600 text-3xl mr-3 animate-pulse"></i>
          <Link to={isUserAuthenticated ? "/home" : "/welcome"} className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
            Heart Disease Prediction System
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          {isUserAuthenticated ? (
            <>
              <Link to="/home" className={getLinkClass('/home')}>Home</Link>
              <Link to="/dashboard" className={getLinkClass('/dashboard')}>Dashboard</Link>
              <Link to="/appointments" className={getLinkClass('/appointments')}>Appointments</Link>
              <Link to="/about" className={getLinkClass('/about')}>About</Link>
              <Link to="/services" className={getLinkClass('/services')}>Services</Link>
              <Link to="/resources" className={getLinkClass('/resources')}>Resources</Link>
              <button
                onClick={handleSignOut}
                className="text-gray-700 hover:text-red-600 font-medium transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/welcome" className={getLinkClass('/welcome')}>Home</Link>
              <Link to="/about" className={getLinkClass('/about')}>About</Link>
              <Link to="/services" className={getLinkClass('/services')}>Services</Link>
              <Link to="/resources" className={getLinkClass('/resources')}>Resources</Link>
              <Link to="/login" className={getLinkClass('/login')}>Sign In</Link>
            </>
          )}
        </nav>
        
        <button className="md:hidden text-gray-700 hover:text-red-600 transition-colors">
          <i className="fas fa-bars text-2xl"></i>
        </button>
      </div>
    </header>
  );
};

export default Header;