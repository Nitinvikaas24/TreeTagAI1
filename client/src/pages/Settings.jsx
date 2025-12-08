import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user } = useAuth(); // We don't have updateUserProfile yet, so we removed it
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    preferredLanguage: localStorage.getItem('treetag-language') || 'en',
    notificationPreferences: {
      push: true
    }
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        notificationPreferences: {
          ...prev.notificationPreferences,
          [name]: checked
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Save language preference
    localStorage.setItem('treetag-language', formData.preferredLanguage);
    
    // In a real app, you would send an API request here to update the name
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Settings</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Profile Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Profile Settings</h2>
            <div className="space-y-4">
              
              {/* Name Field (Editable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500 focus:outline-none"
                />
              </div>

              {/* Phone Number Field (Read Only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (ID)</label>
                <input
                  type="text"
                  value={user?.phoneNumber || ''}
                  disabled
                  className="w-full rounded-md border border-gray-200 bg-gray-100 text-gray-500 px-3 py-2 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Phone number cannot be changed.</p>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Language Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700">App Preferences</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
              <select
                name="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500 focus:outline-none"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
              </select>
            </div>
          </div>

          {/* Notification Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Notifications</h2>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="push"
                id="push"
                checked={formData.notificationPreferences.push}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="push" className="ml-2 block text-sm text-gray-700">
                Enable Push Notifications
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;