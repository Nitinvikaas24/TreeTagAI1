import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Component to handle role-based dashboard rendering
export const RoleBasedDashboard = () => {
    const { user } = useAuth();
    
    if (user?.role === 'officer') {
        return <OfficerDashboard />;
    } else {
        return <UserDashboard />;
    }
};

// Officer Route Guard
export const OfficerRoute = ({ children }) => {
    const { user } = useAuth();
    
    if (user?.role !== 'officer') {
        return <Navigate to="/dashboard" replace />;
    }
    
    return children;
};

// User Route Guard
export const UserRoute = ({ children }) => {
    const { user } = useAuth();
    
    if (user?.role !== 'user') {
        return <Navigate to="/dashboard" replace />;
    }
    
    return children;
};