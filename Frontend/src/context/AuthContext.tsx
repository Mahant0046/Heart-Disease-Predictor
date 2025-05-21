// src/context/AuthContext.tsx
import React, {
    createContext, useState, useContext, useEffect, ReactNode, useCallback
} from 'react';
import {
    checkAuth, checkAdminAuth, checkDoctorAuth,
    getCurrentUser, getCurrentAdmin, getCurrentDoctor,
    User, AdminUser, Doctor,
    logout, adminLogout, doctorLogout // These are the API call functions
} from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  currentAdmin: AdminUser | null;
  currentDoctor: Doctor | null;
  isUserAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  isDoctorAuthenticated: boolean;
  isLoadingAuth: boolean;
  loginUser: (userData: User) => void;
  loginAdmin: (adminData: AdminUser) => void;
  loginDoctor: (doctorData: Doctor) => void;
  performUserLogout: () => Promise<void>;
  performAdminLogout: () => Promise<void>;
  performDoctorLogout: () => Promise<void>;
  verifyAuthStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => getCurrentAdmin());
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(() => getCurrentDoctor());
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const verifyAuthStatus = useCallback(async (): Promise<boolean> => {
    console.log("[AuthContext] Verifying auth status...");
    let authenticatedAsSomeone = false;
    
    try {
      // First check if we have a stored user, admin, or doctor
      const storedUser = getCurrentUser();
      const storedAdmin = getCurrentAdmin();
      const storedDoctor = getCurrentDoctor();

      if (storedAdmin) {
        // If we have a stored admin, verify admin auth
        try {
          const adminAuthResponse = await checkAdminAuth();
          if (adminAuthResponse.authenticated && adminAuthResponse.admin) {
            setCurrentAdmin(adminAuthResponse.admin);
            setCurrentUser(null);
            setCurrentDoctor(null);
            authenticatedAsSomeone = true;
            console.log("[AuthContext] Admin session verified.");
          } else {
            setCurrentAdmin(null);
            localStorage.removeItem('admin');
          }
        } catch (error) {
          console.warn("[AuthContext] Admin auth check failed:", error);
          setCurrentAdmin(null);
          localStorage.removeItem('admin');
        }
      } else if (storedDoctor) {
        // If we have a stored doctor, verify doctor auth
        try {
          const doctorAuthResponse = await checkDoctorAuth();
          if (doctorAuthResponse.authenticated && doctorAuthResponse.doctor) {
            setCurrentDoctor(doctorAuthResponse.doctor);
            setCurrentUser(null);
            setCurrentAdmin(null);
            authenticatedAsSomeone = true;
            console.log("[AuthContext] Doctor session verified.");
          } else {
            setCurrentDoctor(null);
            localStorage.removeItem('doctor');
          }
        } catch (error) {
          console.warn("[AuthContext] Doctor auth check failed:", error);
          setCurrentDoctor(null);
          localStorage.removeItem('doctor');
        }
      } else if (storedUser) {
        // If we have a stored user, verify user auth
        try {
          const userAuthResponse = await checkAuth();
          if (userAuthResponse.authenticated && userAuthResponse.user) {
            setCurrentUser(userAuthResponse.user);
            setCurrentAdmin(null);
            setCurrentDoctor(null);
            authenticatedAsSomeone = true;
            console.log("[AuthContext] User session verified.");
          } else {
            setCurrentUser(null);
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.warn("[AuthContext] User auth check failed:", error);
          setCurrentUser(null);
          localStorage.removeItem('user');
        }
      } else {
        // No stored credentials, clear everything
        setCurrentUser(null);
        setCurrentAdmin(null);
        setCurrentDoctor(null);
        localStorage.removeItem('user');
        localStorage.removeItem('admin');
        localStorage.removeItem('doctor');
      }
    } catch (error) {
      console.error("[AuthContext] Auth verification failed:", error);
      setCurrentUser(null);
      setCurrentAdmin(null);
      setCurrentDoctor(null);
      localStorage.removeItem('user');
      localStorage.removeItem('admin');
      localStorage.removeItem('doctor');
    } finally {
      setIsLoadingAuth(false);
    }
    return authenticatedAsSomeone;
  }, []);

  useEffect(() => {
    verifyAuthStatus();
  }, [verifyAuthStatus]);

  const loginUser = (userData: User) => {
    setCurrentUser(userData);
    setCurrentAdmin(null);
    setCurrentDoctor(null);
    console.log("[AuthContext] User context set by loginUser.");
  };

  const loginAdmin = (adminData: AdminUser) => {
    setCurrentAdmin(adminData);
    setCurrentUser(null);
    setCurrentDoctor(null);
    console.log("[AuthContext] Admin context set by loginAdmin.");
  };

  const loginDoctor = (doctorData: Doctor) => {
    setCurrentDoctor(doctorData);
    setCurrentUser(null);
    setCurrentAdmin(null);
    console.log("[AuthContext] Doctor context set by loginDoctor.");
  };

  const performUserLogout = async () => {
    console.log("[AuthContext] performUserLogout called.");
    try {
      await logout();
    } catch (error) {
      console.error("[AuthContext] User logout API call failed:", error);
      localStorage.removeItem('user');
    } finally {
      setCurrentUser(null);
      console.log("[AuthContext] User context cleared.");
    }
  };

  const performAdminLogout = async () => {
    console.log("[AuthContext] performAdminLogout called.");
    try {
      await adminLogout();
    } catch (error) {
      console.error("[AuthContext] Admin logout API call failed:", error);
      localStorage.removeItem('admin');
    } finally {
      setCurrentAdmin(null);
      console.log("[AuthContext] Admin context cleared.");
    }
  };

  const performDoctorLogout = async () => {
    console.log("[AuthContext] performDoctorLogout called.");
    try {
      await doctorLogout();
    } catch (error) {
      console.error("[AuthContext] Doctor logout API call failed:", error);
      localStorage.removeItem('doctor');
    } finally {
      setCurrentDoctor(null);
      console.log("[AuthContext] Doctor context cleared.");
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      currentAdmin,
      currentDoctor,
      isUserAuthenticated: !!currentUser,
      isAdminAuthenticated: !!currentAdmin,
      isDoctorAuthenticated: !!currentDoctor,
      isLoadingAuth,
      loginUser,
      loginAdmin,
      loginDoctor,
      performUserLogout,
      performAdminLogout,
      performDoctorLogout,
      verifyAuthStatus
    }}>
      {isLoadingAuth ? <div className="flex justify-center items-center min-h-screen font-semibold text-gray-600">Initializing Application...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};