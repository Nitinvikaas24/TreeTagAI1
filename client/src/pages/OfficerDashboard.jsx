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
      { id: 1, name: 'John Smith', farmerId: 'F001', location: 'Delhi', plants: 25, status: 'Active' },
      { id: 2, name: 'Sarah Johnson', farmerId: 'F002', location: 'Mumbai', plants: 18, status: 'Active' },
      { id: 3, name: 'Mike Brown', farmerId: 'F003', location: 'Bangalore', plants: 32, status: 'Inactive' }
    ]);
    
    setNurseries([
      { id: 1, name: 'Green Valley Nursery', location: 'Delhi', farmers: 15, revenue: 50000 },
      { id: 2, name: 'Nature\'s Best', location: 'Mumbai', farmers: 12, revenue: 35000 }
    ]);

    setReports([
      { id: 1, title: 'Monthly Sales Report', date: '2025-10-01', status: 'Generated' },
      { id: 2, title: 'Inventory Analysis', date: '2025-09-30', status: 'Pending' }
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
              <span className="text-gray-700">Welcome, Officer {user?.fullName}</span>
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
              { id: 'analytics', name: 'Analytics' },
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
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Total Farmers</h3>
                <p className="text-3xl font-bold text-green-600">{farmers.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Active Nurseries</h3>
                <p className="text-3xl font-bold text-blue-600">{nurseries.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Total Revenue</h3>
                <p className="text-3xl font-bold text-purple-600">
                  ₹{nurseries.reduce((sum, nursery) => sum + nursery.revenue, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Reports Generated</h3>
                <p className="text-3xl font-bold text-yellow-600">{reports.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span>New farmer registered: John Smith</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span>Report generated: Monthly Sales</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                    <span>Nursery inspection completed</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-3 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors">
                    Add Farmer
                  </button>
                  <button className="p-3 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors">
                    Generate Report
                  </button>
                  <button className="p-3 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors">
                    View Analytics
                  </button>
                  <button className="p-3 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors">
                    Inspect Nursery
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'farmers' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Registered Farmers</h2>
              <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                Add New Farmer
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plants</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {farmers.map((farmer) => (
                    <tr key={farmer.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{farmer.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{farmer.farmerId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{farmer.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{farmer.plants}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          farmer.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {farmer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-4">View</button>
                        <button className="text-green-600 hover:text-green-900 mr-4">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Suspend</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'nurseries' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Nursery Management</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {nurseries.map((nursery) => (
                  <div key={nursery.id} className="border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{nursery.name}</h3>
                    <p className="text-gray-600 mb-4">{nursery.location}</p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Registered Farmers</p>
                        <p className="text-xl font-bold text-blue-600">{nursery.farmers}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Monthly Revenue</p>
                        <p className="text-xl font-bold text-green-600">₹{nursery.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                        View Details
                      </button>
                      <button className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Reports & Analytics</h2>
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Generate New Report
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">{report.title}</h3>
                      <p className="text-sm text-gray-500">Generated on {report.date}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        report.status === 'Generated' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {report.status}
                      </span>
                      <button className="text-blue-600 hover:text-blue-900">Download</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics Dashboard</h2>
            <p className="text-gray-600 mb-6">Advanced analytics and AI insights coming soon...</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                <h3 className="font-semibold">Plant Recognition</h3>
                <p className="text-sm mt-2">AI-powered plant identification</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                <h3 className="font-semibold">Market Trends</h3>
                <p className="text-sm mt-2">Real-time market analysis</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                <h3 className="font-semibold">Predictive Analytics</h3>
                <p className="text-sm mt-2">Future demand forecasting</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Officer Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <p className="text-gray-900">{user?.fullName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Officer ID</label>
                <p className="text-gray-900">{user?.farmerId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <p className="text-gray-900 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default OfficerDashboard;