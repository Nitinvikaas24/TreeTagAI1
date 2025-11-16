import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaLeaf, 
  FaBoxes, 
  FaChartBar, 
  FaShoppingCart, 
  FaCog, 
  FaSignOutAlt, 
  FaUserCircle,
  FaSearch,
  FaCamera,
  FaList,
  FaHistory,
  FaBars,
  FaTimes,
  FaHeart
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

// Design system colors from Design.json
const colors = {
  primary: {
    darkGreen: '#0A3D3D',
    forestGreen: '#1B4D3E',
    tealGreen: '#2C5F5F',
  },
  accent: {
    lightGreen: '#9FD8A4',
    mintGreen: '#C8E6C9',
    limeGreen: '#BFDB38',
  },
  neutral: {
    white: '#FFFFFF',
    lightGray: '#F5F5F5',
    mediumGray: '#E0E0E0',
    darkGray: '#757575',
  },
  semantic: {
    success: '#4CAF50',
    error: '#E57373',
    info: '#64B5F6',
  },
};

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const officerMenuItems = [
    { path: '/dashboard', icon: <FaLeaf />, label: 'Dashboard' },
    { path: '/dashboard/inventory', icon: <FaBoxes />, label: 'Inventory' },
    { path: '/dashboard/orders', icon: <FaShoppingCart />, label: 'Orders' },
    { path: '/dashboard/reports', icon: <FaChartBar />, label: 'Reports' },
  ];

  const customerMenuItems = [
    { path: '/dashboard', icon: <FaLeaf />, label: 'Dashboard' },
    { path: '/dashboard/identify', icon: <FaCamera />, label: 'Identify Plants' },
    { path: '/dashboard/browse', icon: <FaSearch />, label: 'Browse Plants' },
    { path: '/dashboard/wishlist', icon: <FaHeart />, label: 'Wishlist' },
    { path: '/dashboard/history', icon: <FaHistory />, label: 'Purchase History' },
  ];

  const menuItems = user?.role === 'officer' ? officerMenuItems : customerMenuItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colors.neutral.lightGray }}>
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ 
          backgroundColor: colors.primary.darkGreen,
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
        }}
      >
        {/* Logo */}
        <div 
          className="h-24 flex items-center justify-between px-6 border-b border-opacity-20" 
          style={{ borderColor: colors.neutral.white }}
        >
          <Link to="/dashboard" className="flex items-center space-x-3">
            <FaLeaf className="text-3xl" style={{ color: colors.accent.limeGreen }} />
            <div>
              <h1 className="text-2xl font-bold font-['Playfair Display']" style={{ color: colors.neutral.white }}>
                TreeTagAI
              </h1>
              <p className="text-sm font-['Lora']" style={{ color: colors.neutral.mediumGray }}>
                {user?.role === 'officer' ? 'Officer Portal' : 'Customer Portal'}
              </p>
            </div>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden hover:opacity-80 transition-opacity"
            style={{ color: colors.neutral.white }}
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-8 px-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-4 px-6 py-4 rounded-xl mb-2 transition-all duration-200 group`}
              style={{
                backgroundColor: location.pathname === item.path ? colors.primary.tealGreen : 'transparent',
                color: location.pathname === item.path ? colors.accent.limeGreen : colors.neutral.mediumGray,
              }}
            >
              <div className="text-xl group-hover:text-white transition-colors">
                {item.icon}
              </div>
              <span className="font-['Inter'] text-base group-hover:text-white transition-colors">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Link
            to="/dashboard/settings"
            className="flex items-center space-x-4 px-6 py-4 rounded-xl mb-2 transition-all duration-200 group"
            style={{ color: colors.neutral.mediumGray }}
          >
            <FaCog className="text-xl group-hover:text-white transition-colors" />
            <span className="font-['Inter'] text-base group-hover:text-white transition-colors">
              Settings
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-4 px-6 py-4 rounded-xl transition-all duration-200 group"
            style={{ color: colors.semantic.error }}
          >
            <FaSignOutAlt className="text-xl group-hover:opacity-80 transition-opacity" />
            <span className="font-['Inter'] text-base group-hover:opacity-80 transition-opacity">
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${isSidebarOpen ? 'lg:ml-64' : ''} transition-all duration-300`}>
        {/* Top Navigation Bar */}
        <header 
          style={{ 
            backgroundColor: colors.neutral.white,
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
          }} 
          className="sticky top-0 z-20"
        >
          <div className="h-24 px-6 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                style={{ color: colors.primary.darkGreen }}
                className="hover:opacity-80 transition-opacity text-xl"
              >
                <FaBars />
              </button>
              <h2 
                className="text-xl font-['Lora']"
                style={{ color: colors.primary.forestGreen }}
              >
                Welcome back, {user?.name}!
              </h2>
            </div>

            {/* Profile Section */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-3 py-2 px-4 rounded-xl hover:bg-opacity-10 transition-colors"
                style={{ 
                  backgroundColor: isProfileDropdownOpen ? colors.primary.darkGreen + '1A' : 'transparent'
                }}
              >
                <FaUserCircle 
                  className="text-2xl" 
                  style={{ color: colors.primary.tealGreen }} 
                />
              </button>

              {/* Profile Dropdown */}
              {isProfileDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 rounded-xl py-2"
                  style={{ 
                    backgroundColor: colors.neutral.white,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                  }}
                >
                  <div className="px-4 py-2 border-b" style={{ borderColor: colors.neutral.mediumGray }}>
                    <p 
                      className="font-medium font-['Inter']"
                      style={{ color: colors.primary.darkGreen }}
                    >
                      {user?.name}
                    </p>
                    <p 
                      className="text-sm"
                      style={{ color: colors.neutral.darkGray }}
                    >
                      {user?.email}
                    </p>
                  </div>
                  <Link
                    to="/dashboard/settings"
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-opacity-10 transition-colors"
                    style={{ 
                      color: colors.primary.forestGreen,
                    }}
                  >
                    <FaCog />
                    <span className="font-['Inter']">Settings</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-opacity-10 transition-colors"
                    style={{ 
                      color: colors.semantic.error,
                    }}
                  >
                    <FaSignOutAlt />
                    <span className="font-['Inter']">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-8">
          <div 
            className="max-w-7xl mx-auto rounded-xl p-6 lg:p-8" 
            style={{ 
              backgroundColor: colors.neutral.white,
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              fontFamily: 'Inter'
            }}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;