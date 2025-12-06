import jwt from 'jsonwebtoken';
import User from '../models/user.js'; 

// 1. Protect Middleware (Checks if user is logged in)
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by PhoneNumber (since we switched to ATM-style login)
      const user = await User.findByPhoneNumber(decoded.phoneNumber);

      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      req.user = user;
      next();
      
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// 2. Officer Check Middleware (The missing piece!)
export const officerCheck = (req, res, next) => {
  // Check if the logged-in user has the role 'officer'
  if (req.user && req.user.role === 'officer') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an officer' });
  }
};