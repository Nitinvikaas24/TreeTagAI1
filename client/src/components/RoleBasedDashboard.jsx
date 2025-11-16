import React from 'react';
import { useAuth } from '../context/AuthContext';
import OfficerDashboard from './OfficerDashboard';
import CustomerDashboard from './CustomerDashboard';

const RoleBasedDashboard = () => {
  const { user } = useAuth();

  // Return different dashboard based on user role
  if (user?.role === 'officer') {
    return <OfficerDashboard />;
  }

  // Default to customer dashboard
  return <CustomerDashboard />;
};

export default RoleBasedDashboard;