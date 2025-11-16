import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for officer-only routes
  const officerOnlyPaths = ['/officer', '/plants', '/reports'];
  if (!user.role === 'officer' && officerOnlyPaths.some(path => location.pathname.startsWith(path))) {
    return <Navigate to="/user" replace />;
  }

  return children;
};

export default ProtectedRoute;