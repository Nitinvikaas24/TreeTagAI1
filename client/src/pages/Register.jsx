import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    pin: '',
    confirmPin: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.pin !== formData.confirmPin) {
      return toast.error('PINs do not match');
    }
    if (formData.pin.length !== 4) {
      return toast.error('PIN must be 4 digits');
    }

    setLoading(true);

    try {
      // Calls /api/auth/signup
      await authService.register({
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        pin: formData.pin
      });
      
      toast.success('Registration Successful!');
      navigate('/login');
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700">Join TreeTagAI</h1>
          <p className="text-gray-500 mt-2">Create Farmer Account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500"
              placeholder="Ramesh Kumar"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500"
              placeholder="+91 98765 43210"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Set PIN</label>
              <input
                type="password"
                required
                maxLength="4"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 text-center tracking-widest"
                placeholder="1234"
                value={formData.pin}
                onChange={(e) => setFormData({...formData, pin: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm PIN</label>
              <input
                type="password"
                required
                maxLength="4"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 text-center tracking-widest"
                placeholder="1234"
                value={formData.confirmPin}
                onChange={(e) => setFormData({...formData, confirmPin: e.target.value})}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all ${loading ? 'opacity-70' : ''}`}
          >
            {loading ? 'Creating...' : 'Register'}
          </button>

          <div className="text-center mt-4">
            <span className="text-gray-600">Already registered? </span>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-green-600 font-medium hover:underline"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;