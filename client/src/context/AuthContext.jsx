import { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check expiry
        if (decoded.exp * 1000 > Date.now()) {
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            // Reconstruct basic user from token if storage is empty
            setUser({
              phoneNumber: decoded.phoneNumber,
              role: decoded.role,
              name: "User" // Fallback
            });
          }
        } else {
          authService.logout();
        }
      } catch (error) {
        console.error("Invalid token:", error);
        authService.logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (data) => {
    // Determine if data comes from API response or direct object
    const userData = data.user || data; 
    const token = data.token;

    if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;