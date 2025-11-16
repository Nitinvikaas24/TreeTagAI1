import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UserRoute = ({ children }) => {
  const { user } = useAuth();

  if (user?.role === 'officer') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default UserRoute;