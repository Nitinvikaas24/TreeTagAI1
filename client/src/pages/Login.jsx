import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const checkPasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
};

const getStrengthColor = (strength) => {
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  return colors[strength - 1] || '';
};

const formatLastLogin = (date) => {
  return new Date(date).toLocaleString();
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('farmer');
  const [formData, setFormData] = useState({
    farmerId: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [autoLogoutTime, setAutoLogoutTime] = useState(30);
  const [lastLoginTime, setLastLoginTime] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showTooltip, setShowTooltip] = useState('');

  useEffect(() => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      const { farmerId, role, lastLoginTime: savedLoginTime } = JSON.parse(rememberedUser);
      setFormData(prev => ({ ...prev, farmerId }));
      setMode(role);
      setRememberMe(true);
      setLastLoginTime(savedLoginTime);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLocked) {
      toast.error('Account is locked due to too many failed attempts. Please try again later.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email || undefined,
          farmerId: formData.farmerId.trim(),
          password: formData.password
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      const { token, user } = result;

      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      setFailedAttempts(0);
      setIsLocked(false);

      const normalizedRole = (user.role || '').toLowerCase();
      const uiRole = ['admin', 'officer', 'cashier'].includes(normalizedRole) ? 'officer' : 'farmer';

      const rememberedFarmerId = user.farmerId || formData.farmerId;

      if (rememberMe && rememberedFarmerId) {
        localStorage.setItem('rememberedUser', JSON.stringify({
          farmerId: rememberedFarmerId,
          role: uiRole,
          lastLoginTime: new Date().toISOString()
        }));
      } else {
        localStorage.removeItem('rememberedUser');
      }

      if (uiRole !== mode) {
        setMode(uiRole);
      }
      setLastLoginTime(new Date().toISOString());

      if (autoLogoutTime) {
        setTimeout(() => {
          logout();
          toast.info('You have been automatically logged out due to inactivity.');
          navigate('/login');
        }, autoLogoutTime * 60 * 1000);
      }

      await login({ token, user });
      toast.success('Welcome back!');

      const destination = location.state?.from?.pathname || (['admin', 'officer', 'cashier'].includes(normalizedRole) ? '/admin' : '/user');
      navigate(destination, { replace: true });
    } catch (error) {
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      if (newFailedAttempts >= 5) {
        setIsLocked(true);
        setTimeout(() => {
          setIsLocked(false);
          setFailedAttempts(0);
        }, 30 * 60 * 1000);
      }

      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginFarmer = () => {
    setFormData({
      farmerId: 'farmer123',
      password: 'FarmerDemo@123'
    });
    setMode('farmer');
    toast.success('Filled farmer credentials! Click Login to continue.');
  };

  const quickLoginOfficer = () => {
    setFormData({
      farmerId: 'officer123',
      password: 'OfficerDemo@123'
    });
    setMode('officer');
    toast.success('Filled officer credentials! Click Login to continue.');
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="flex items-center justify-center min-h-full">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg px-8 py-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-green-600 p-3 rounded-full">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TreeTagAI</h1>
            <p className="text-gray-600">Smart Plant Identification & Nursery Billing</p>
          </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
          <button
            type="button"
            onClick={() => {
              setMode('farmer');
              toast.success('Switched to Farmer Mode');
            }}
            onKeyPress={(e) => handleKeyPress(e, () => setMode('farmer'))}
            aria-label="Switch to Farmer Mode"
            title="Access as a farmer to manage your plant inventory and orders"
            className={`flex-1 sm:w-auto py-3 px-6 rounded-lg text-sm font-medium transition-all transform hover:scale-105 ${
              mode === 'farmer'
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
              </svg>
              Farmer Mode
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('officer');
              toast.success('Switched to Officer Mode');
            }}
            onKeyPress={(e) => handleKeyPress(e, () => setMode('officer'))}
            aria-label="Switch to Officer Mode"
            title="Access as an officer to manage and oversee nursery operations"
            className={`flex-1 sm:w-auto py-3 px-6 rounded-lg text-sm font-medium transition-all transform hover:scale-105 ${
              mode === 'officer'
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
              </svg>
              Officer Mode
            </span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="text-center">
            <label className="block text-base text-gray-700 mb-2 text-center">
              {mode === 'officer' ? 'Officer ID' : 'Farmer ID'}
            </label>
            <input
              type="text"
              name="farmerId"
              required
              value={formData.farmerId}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={mode === 'officer' ? 'Enter Officer ID' : 'Enter Farmer ID'}
            />
          </div>

          <div className="text-center">
            <label className="block text-base text-gray-700 mb-2 text-center">
              Password
              <span 
                className="ml-1 text-gray-500 cursor-help relative group"
                role="tooltip"
                aria-label="Password requirements"
                onMouseEnter={() => setShowTooltip('password')}
                onMouseLeave={() => setShowTooltip('')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {showTooltip === 'password' && (
                  <div className="absolute z-10 w-64 p-2 mt-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg -left-28 top-full">
                    Password must contain:
                    <ul className="list-disc list-inside mt-1">
                      <li>At least 8 characters</li>
                      <li>One uppercase letter</li>
                      <li>One lowercase letter</li>
                      <li>One number</li>
                      <li>One special character</li>
                    </ul>
                  </div>
                )}
              </span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                onKeyPress={(e) => handleKeyPress(e, () => setShowPassword(!showPassword))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-all hover:scale-110"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
            </div>
            {formData.password && (
              <div className="mt-2">
                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStrengthColor(passwordStrength)} transition-all`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Password Strength: {['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'][passwordStrength - 1] || 'Very Weak'}
                </p>
              </div>
            )}
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              onKeyPress={(e) => handleKeyPress(e, () => navigate('/forgot-password'))}
              className="text-sm text-green-500 hover:text-green-600 focus:outline-none transition-all hover:underline transform hover:scale-105"
              aria-label="Reset your password"
              title="Click here if you forgot your password"
            >
              Forgot Password?
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <label className="flex items-center text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-green-500 rounded border-gray-300 focus:ring-green-500"
                  aria-label="Remember me on this device"
                />
                <span className="ml-2">Remember me</span>
              </label>
            </div>
            <div className="flex items-center">
              <div className="relative group">
                <select
                  value={autoLogoutTime}
                  onChange={(e) => setAutoLogoutTime(Number(e.target.value))}
                  className="ml-2 border border-gray-300 rounded-lg text-sm p-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                  aria-label="Select auto logout time"
                  title="Select when to automatically log out due to inactivity"
                >
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                </select>
                <div className="invisible group-hover:visible absolute z-10 w-48 p-2 mt-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg -left-20 top-full">
                  Select when to automatically log out due to inactivity
                </div>
              </div>
            </div>
          </div>

          {/* Quick Login Buttons */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h3 className="text-sm font-medium text-blue-800 mb-3 text-center">Quick Login (Demo)</h3>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={quickLoginFarmer}
                className="flex-1 sm:max-w-[140px] py-2 px-4 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-all transform hover:scale-105"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Demo Farmer
                </div>
              </button>
              <button
                type="button"
                onClick={quickLoginOfficer}
                className="flex-1 sm:max-w-[140px] py-2 px-4 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-all transform hover:scale-105"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Demo Officer
                </div>
              </button>
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-6 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {lastLoginTime && (
            <div className="text-center mt-2">
              <p className="text-xs text-gray-500">
                Last login: {formatLastLogin(lastLoginTime)}
              </p>
            </div>
          )}

          <div className="text-center mt-4">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                onKeyPress={(e) => handleKeyPress(e, () => navigate('/register'))}
                className="text-green-500 hover:text-green-600 font-medium focus:outline-none transition-all hover:underline transform hover:scale-105"
                aria-label="Create a new account"
                title="Sign up for a new account"
              >
                Create Account
              </button>
            </p>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default Login;