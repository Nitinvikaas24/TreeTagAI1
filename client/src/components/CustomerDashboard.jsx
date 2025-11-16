import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FaLeaf, FaShoppingBag, FaHistory } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Plant Identification',
      description: 'Identify plants and get their details',
      icon: <FaLeaf className="w-6 h-6 text-green-600" />,
      link: '/user/identify'
    },
    {
      title: 'My Orders',
      description: 'View your order history',
      icon: <FaShoppingBag className="w-6 h-6 text-blue-600" />,
      link: '/user/orders'
    },
    {
      title: 'Transaction History',
      description: 'View your transaction history',
      icon: <FaHistory className="w-6 h-6 text-purple-600" />,
      link: '/user/transactions'
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Welcome back, {user?.name}!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.link}
            className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              {item.icon}
              <h3 className="text-lg font-semibold ml-3">{item.title}</h3>
            </div>
            <p className="text-gray-600">{item.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            className="p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            onClick={() => navigate('/user/identify')}
          >
            Start Plant Identification
          </button>
          <button
            className="p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            onClick={() => navigate('/user/orders')}
          >
            View Recent Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;