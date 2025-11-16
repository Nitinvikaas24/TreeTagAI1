// Simple auth middleware that doesn't require database connection
// This is a temporary solution for testing the plant identification

export const auth = (req, res, next) => {
  // For testing purposes, we'll just mock a user
  req.user = {
    id: 'test-user-123',
    email: 'test@example.com',
    role: 'user',
    preferredLanguage: 'en'
  };
  next();
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Please log in.' 
      });
    }

    // For testing, allow all roles
    next();
  };
};
