// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import WelcomePage from './components/WelcomePage';
import LoginForm from './components/auth/LoginForm';
import RegistrationForm from './components/auth/RegistrationForm';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './components/dashboard/DashboardPage';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import AboutPage from './components/AboutPage';
import ServicesPage from './components/ServicesPage';
import ResourcesPage from './components/ResourcesPage';
import HomePage from './components/HomePage';
import UserAppointments from './components/appointments/UserAppointments';
import DoctorAppointments from './components/doctor/DoctorAppointments';
import DoctorLogin from './components/doctor/DoctorLogin';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import { useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

const UserProtectedRoute: React.FC = () => {
  const { isUserAuthenticated, isLoadingAuth } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return <div className="flex justify-center items-center min-h-screen">Verifying authentication...</div>;
  }

  if (!isUserAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

const AdminProtectedRoute: React.FC = () => {
  const { isAdminAuthenticated, isLoadingAuth } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return <div className="flex justify-center items-center min-h-screen">Verifying admin authentication...</div>;
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

const DoctorProtectedRoute: React.FC = () => {
  const { isDoctorAuthenticated, isLoadingAuth } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return <div className="flex justify-center items-center min-h-screen">Verifying authentication...</div>;
  }

  if (!isDoctorAuthenticated) {
    return <Navigate to="/doctor/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

const AppContent: React.FC = () => {
  const { isUserAuthenticated, isAdminAuthenticated, isDoctorAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return <div className="flex justify-center items-center min-h-screen">Initializing Application...</div>;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/login" element={
        isUserAuthenticated ? <Navigate to="/home" replace /> : 
        isAdminAuthenticated ? <Navigate to="/admin/dashboard" replace /> : 
        <LoginForm />
      } />
      <Route path="/register" element={
        isUserAuthenticated ? <Navigate to="/home" replace /> : 
        isAdminAuthenticated ? <Navigate to="/admin/dashboard" replace /> : 
        <RegistrationForm />
      } />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin/login" element={
        isAdminAuthenticated ? <Navigate to="/admin/dashboard" replace /> : 
        <AdminLogin />
      } />
      <Route path="/doctor/login" element={
        isDoctorAuthenticated ? <Navigate to="/doctor/dashboard" replace /> : 
        <DoctorLogin />
      } />

      {/* Protected User Routes */}
      <Route element={<UserProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/appointments" element={<UserAppointments />} />
        </Route>
      </Route>

      {/* Protected Admin Routes */}
      <Route element={<AdminProtectedRoute />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/appointments" element={<DoctorAppointments />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* Protected Doctor Routes */}
      <Route element={<DoctorProtectedRoute />}>
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/appointments" element={<DoctorAppointments />} />
        <Route path="/doctor" element={<Navigate to="/doctor/dashboard" replace />} />
      </Route>

      {/* Fallback Routes */}
      <Route path="/" element={
        isUserAuthenticated ? <Navigate to="/home" replace /> : 
        isAdminAuthenticated ? <Navigate to="/admin/dashboard" replace /> : 
        <Navigate to="/welcome" replace />
      } />
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
};

export default App;