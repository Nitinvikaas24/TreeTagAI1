import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OfficerRoute = ({ children }) => {
  const { user } = useAuth();

  if (user?.role !== 'officer') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default OfficerRoute;