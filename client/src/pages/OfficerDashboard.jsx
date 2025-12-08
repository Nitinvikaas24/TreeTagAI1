import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const OfficerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);
  const [nurseries, setNurseries] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Mock data - replace with actual API calls
    setFarmers([
      { id: 1, name: 'John Smith', phone: '+919876543210', location: 'Delhi', plants: 25, status: 'Active' },
      { id: 2, name: 'Sarah Johnson', phone: '+918765432109', location: 'Mumbai', plants: 18, status: 'Active' },
    ]);
    
    setNurseries([
      { id: 1, name: 'Green Valley Nursery', location: 'Delhi', farmers: 15, revenue: 50000 },
      { id: 2, name: 'Nature\'s Best', location: 'Mumbai', farmers: 12, revenue: 35000 }
    ]);

    setReports([
      { id: 1, title: 'Monthly Sales Report', date: '2025-10-01', status: 'Generated' },
    ]);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    setTimeout(() => navigate('/login'), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-800">TreeTagAI</h1>
              <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Officer Dashboard
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, Officer {user?.name || 'User'}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'farmers', name: 'Manage Farmers' },
              { id: 'nurseries', name: 'Nurseries' },
              { id: 'reports', name: 'Reports' },
              { id: 'profile', name: 'Profile' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Overview Tab (Simplified for brevity) */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Total Farmers</h3>
                <p className="text-3xl font-bold text-green-600">{farmers.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Nurseries</h3>
                <p className="text-3xl font-bold text-blue-600">{nurseries.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Farmers Tab */}
        {activeTab === 'farmers' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Farmer Management</h2>
            <p className="text-gray-500">List of farmers will appear here.</p>
          </div>
        )}

        {/* Nurseries Tab */}
        {activeTab === 'nurseries' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Nursery Management</h2>
            <p className="text-gray-500">Nursery list goes here.</p>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Reports</h2>
            <p className="text-gray-500">Reports section.</p>
          </div>
        )}

        {/* UPDATED PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Officer Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <p className="text-gray-900 text-lg">{user?.name || 'Officer Name'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <p className="text-gray-900 text-lg font-mono">{user?.phoneNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                  {user?.role || 'Officer'}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default OfficerDashboard;