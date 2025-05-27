// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (e.g., "Bearer eyJhbGci...")
      token = req.headers.authorization.split(' ')[1];

      // Explicitly check if token exists and is not an empty string after split
      if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
        // console.log('Auth Middleware: Token is missing or empty after Bearer split.'); // For debugging
        return res.status(401).json({ message: 'Not authorized, malformed token' });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token's ID and attach to request object
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user for token not found' });
      }

      // If everything is okay, call next() and return to stop execution here
      return next();

    } catch (error) {
      console.error('Token verification failed:', error.message);
      // Handle specific JWT errors differently if needed (e.g., TokenExpiredError)
      // The message 'jwt must be provided' often means the token string was empty.
      // 'invalid signature' or 'jwt malformed' are other common errors.
      return res.status(401).json({ message: 'Not authorized, token failed or invalid' });
    }
  }

  // If we reach here, it means the Authorization header was missing,
  // or it didn't start with 'Bearer '.
  return res.status(401).json({ message: 'Not authorized, no token provided or header is not Bearer type' });
};

module.exports = { protect };