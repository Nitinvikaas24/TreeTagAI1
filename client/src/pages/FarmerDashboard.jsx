import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// 1. IMPORT THE SCANNER COMPONENT
import PlantIdentification from './user/PlantIdentification';

const FarmerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [plants, setPlants] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // 2. SET DEFAULT TAB TO 'identify' (So you see the scanner immediately)
  const [activeTab, setActiveTab] = useState('identify');

  useEffect(() => {
    // Mock data
    setPlants([
      { id: 1, name: 'Rose Plant', price: 25, stock: 50, category: 'Flowering' },
      { id: 2, name: 'Mango Sapling', price: 150, stock: 25, category: 'Fruit Trees' }
    ]);
    setOrders([
      { id: 1, customer: 'John Doe', items: 3, total: 200, status: 'Pending' }
    ]);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-800">TreeTagAI</h1>
              <span className="hidden sm:block ml-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Farmer Dashboard
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 hidden sm:block">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 overflow-x-auto py-3 no-scrollbar">
            
            {/* 3. ADDED THE IDENTIFY TAB BUTTON */}
            <button
              onClick={() => setActiveTab('identify')}
              className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'identify'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-green-700 border border-green-200 hover:bg-green-50'
              }`}
            >
              📸 Identify Plant
            </button>

            {['overview', 'plants', 'orders', 'billing', 'profile'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* 4. RENDER THE SCANNER COMPONENT */}
        {activeTab === 'identify' && (
          <div className="animate-fade-in">
            <PlantIdentification />
          </div>
        )}

        {activeTab === 'overview' && (
          <div>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-lg flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-green-800">Quick Action</h3>
                <p className="text-green-700 text-sm">Scan a plant to detect diseases instantly.</p>
              </div>
              <button 
                onClick={() => setActiveTab('identify')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700"
              >
                Start Scan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Total Plants</h3>
                <p className="text-3xl font-bold text-green-600">{plants.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Revenue</h3>
                <p className="text-3xl font-bold text-yellow-600">
                  ₹{orders.reduce((sum, order) => sum + order.total, 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs placeholders */}
        {activeTab === 'plants' && (
          <div className="bg-white shadow rounded-lg p-6">
             <h2 className="text-xl font-semibold mb-4">My Plants</h2>
             <p className="text-gray-500">Plant list coming soon...</p>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white shadow rounded-lg p-6">
             <h2 className="text-xl font-semibold mb-4">Orders</h2>
             <p className="text-gray-500">Order history coming soon...</p>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Smart Billing</h2>
            <button className="bg-green-500 text-white px-6 py-2 rounded-lg">Generate Bill</button>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Name</label>
                <p className="font-medium text-lg">{user?.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Phone Number</label>
                <p className="font-mono text-lg bg-gray-100 p-2 rounded inline-block">
                  {user?.phoneNumber}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Role</label>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-bold uppercase">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FarmerDashboard;