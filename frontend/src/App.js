import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import './App.css';

// Block MetaMask connection attempts
import './utils/blockMetamask';

// Context
const AuthContext = React.createContext();

// Components
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import AgentDashboard from './components/AgentDashboard';
import ClientDashboard from './components/ClientDashboard';
import TripManager from './components/TripManager';
import TripView from './components/TripView';
import TripAdmin from './components/TripAdmin';
import UserManagement from './components/UserManagement';
import CalendarView from './components/CalendarView';
import CommissionCalculator from './components/CommissionCalculator';
import FinancialReports from './components/FinancialReports';
import ItineraryManager from './components/ItineraryManager';
import ClientDetail from './components/ClientDetail';
import NotificationCenter from './components/NotificationCenter';
import QuoteRequests from './components/QuoteRequests';

// Use environment backend URL directly
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

console.log('Backend configuration:', {
  BACKEND_URL,
  API
});

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Configure axios interceptor to always include auth token
  useEffect(() => {
    // Add request interceptor to include token
    const requestInterceptor = axios.interceptors.request.use((config) => {
      const authToken = localStorage.getItem('token');
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }
      return config;
    });

    // Add response interceptor to handle auth errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.error('401 Unauthorized - clearing auth state');
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    // Always check for stored token on app startup
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      getCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const getCurrentUser = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      
      // Ensure token is set in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
      setToken(storedToken); // Ensure state is consistent
    } catch (error) {
      console.error('Failed to get current user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Login attempt with URL:', `${API}/auth/login`);
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { user, token } = response.data;

      console.log('✅ Login successful:', user);
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      toast.success(`Welcome ${user.first_name}!`);
      return true;
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('Error details:', error.response?.data);
      
      let message = 'Login failed - please check your credentials';
      if (error.response?.data?.detail) {
        message = error.response.data.detail;
      } else if (error.code === 'ERR_NETWORK') {
        message = 'Network error - please check your connection';
      }
      
      toast.error(message);
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API}/auth/register`, userData);
      const { user, token } = response.data;

      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed';
      toast.error(message);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App Component
function App() {
  // Add global error handler for MetaMask errors
  useEffect(() => {
    // More aggressive MetaMask blocking
    const blockAllCryptoWallets = () => {
      try {
        // Delete any ethereum references
        delete window.ethereum;
        delete window.web3;

        // Override with permanent blocks
        Object.defineProperty(window, 'ethereum', {
          get: () => {
            console.warn('🛡️ Travel Agency: Crypto wallet access blocked');
            return undefined;
          },
          set: () => {},
          configurable: false
        });

        window.isMetaMask = false;
      } catch (e) {
        console.warn('Travel Agency: Wallet blocking error:', e);
      }
    };

    const handleError = (event) => {
      const error = event.error || event.reason;
      if (error && error.message) {
        const message = error.message.toLowerCase();
        if (message.includes('metamask') ||
            message.includes('ethereum') ||
            message.includes('web3') ||
            message.includes('wallet') ||
            message.includes('chrome-extension')) {
          console.warn('🛡️ Crypto wallet error suppressed:', error.message);
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
      }
    };

    const handleUnhandledRejection = (event) => {
      const error = event.reason;
      if (error && error.message) {
        const message = error.message.toLowerCase();
        if (message.includes('metamask') ||
            message.includes('ethereum') ||
            message.includes('web3') ||
            message.includes('wallet')) {
          console.warn('🛡️ Crypto wallet promise rejection suppressed:', error.message);
          event.preventDefault();
          return false;
        }
      }
    };

    // Block crypto wallets immediately and continuously
    blockAllCryptoWallets();
    const blockInterval = setInterval(blockAllCryptoWallets, 1000);

    // Add error listeners
    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

    // Cleanup
    return () => {
      clearInterval(blockInterval);
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="App min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
              style: {
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#334155'
              }
            }}
          />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/:tripId"
              element={
                <ProtectedRoute>
                  <TripView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-trips"
              element={
                <ProtectedRoute allowedRoles={['admin', 'agent']}>
                  <TripManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute allowedRoles={['admin', 'agent']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <CalendarView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/commission-calculator"
              element={
                <ProtectedRoute allowedRoles={['admin', 'agent']}>
                  <CommissionCalculator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financial-reports"
              element={
                <ProtectedRoute allowedRoles={['admin', 'agent']}>
                  <FinancialReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quote-requests"
              element={
                <ProtectedRoute allowedRoles={['admin', 'agent']}>
                  <QuoteRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trip-admin/:tripId"
              element={
                <ProtectedRoute allowedRoles={['admin', 'agent']}>
                  <TripAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/:tripId/itinerary"
              element={
                <ProtectedRoute allowedRoles={['admin', 'agent']}>
                  <ItineraryManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/:clientId"
              element={
                <ProtectedRoute allowedRoles={['admin', 'agent']}>
                  <ClientDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute allowedRoles={['admin', 'agent']}>
                  <NotificationCenter />
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Login Page Component
const LoginPage = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-slate-50 to-blue-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Travel Agency</h1>
            <p className="text-slate-600">Gestione itinerari di viaggio</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

// Dashboard Router Component
const DashboardRouter = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'agent':
      return <AgentDashboard />;
    case 'client':
      return <ClientDashboard />;
    default:
      return <Dashboard />;
  }
};

export default App;