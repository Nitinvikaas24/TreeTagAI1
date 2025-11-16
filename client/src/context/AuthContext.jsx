import { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          // Use stored user data if available, otherwise fetch from API
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              setUser(userData);
              setLoading(false);
            } catch (parseError) {
              // If stored user data is invalid, use mock data
              console.log('Invalid stored user data, using mock fallback');
              setUser({
                id: decoded.id,
                farmerId: decoded.id,
                fullName: decoded.role === 'farmer' ? 'Demo Farmer' : 'Demo Officer',
                email: decoded.email,
                role: decoded.role
              });
              setLoading(false);
            }
          } else {
            // Try to fetch from API, fallback to mock data
            fetchUserProfile().catch(error => {
              console.log('API not available, using token data');
              setUser({
                id: decoded.id,
                farmerId: decoded.id,
                fullName: decoded.role === 'farmer' ? 'Demo Farmer' : 'Demo Officer',
                email: decoded.email,
                role: decoded.role
              });
              setLoading(false);
            });
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setLoading(false);
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await authService.getProfile();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authService.register(userData);
      const { token, user: userResponse } = response.data;
      localStorage.setItem('token', token);
      setUser(userResponse);
      return response;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      
      // Handle direct data object (from Login component) vs API call
      if (typeof credentials === 'object' && credentials.token) {
        // Direct data object from Login component
        const { token, user: userData } = credentials;
        // Store token with multiple keys for reliability
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token);
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        }
        console.log('Token stored successfully:', token ? 'Yes' : 'No');
        return credentials;
      } else {
        // API call via authService
        const response = await authService.login(credentials);
        const { token, user: userData } = response.data;
        // Store token with multiple keys for reliability
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        console.log('Token stored from API:', token ? 'Yes' : 'No');
        return response;
      }
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateProfile = async () => {
    try {
      setError(null);
      const response = await authService.getProfile();
      setUser(response.data.user);
      return response;
    } catch (err) {
      setError(err.message || 'Profile update failed');
      throw err;
    }
  };

  // Get token with fallbacks
  const getToken = () => {
    return localStorage.getItem('token') || 
           localStorage.getItem('authToken') || 
           null;
  };

  const value = {
    user,
    loading,
    error,
    token: getToken(),
    getToken,
    register,
    login,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isOfficer: user?.role === 'OFFICER'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;