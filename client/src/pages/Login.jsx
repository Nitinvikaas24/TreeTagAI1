import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    pin: ''
  });
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.login(formData);
      await login(response.data);
      
      toast.success('Login Successful!');
      
      const role = response.data.user?.role || 'farmer';
      navigate(role === 'officer' ? '/admin' : '/user');
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setFormData({
      phoneNumber: '+919876543210',
      pin: '1234'
    });
    toast.success('Demo credentials filled');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700">TreeTagAI</h1>
          <p className="text-gray-500 mt-2">Sign in with Phone & PIN</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              required
              placeholder="+91 98765 43210"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">4-Digit PIN</label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                required
                maxLength="4"
                pattern="\d{4}"
                placeholder="1234"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none tracking-widest text-lg"
                value={formData.pin}
                onChange={(e) => setFormData({...formData, pin: e.target.value})}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
              >
                {showPin ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all ${loading ? 'opacity-70' : ''}`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <button
            type="button"
            onClick={fillDemo}
            className="w-full py-2 text-blue-600 text-sm hover:underline"
          >
            Use Demo Account (Ramesh)
          </button>

          <div className="text-center mt-4">
            <span className="text-gray-600">New Farmer? </span>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-green-600 font-medium hover:underline"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;