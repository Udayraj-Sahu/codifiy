// middleware/isAdminOrOwnerMiddleware.js
const isAdminOrOwner = (req, res, next) => {
  // Assumes 'protect' middleware has already run and set req.user
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'Owner')) {
    next(); // User is an Admin or Owner, proceed
  } else {
    res.status(403).json({ message: 'Not authorized as an Admin or Owner' }); // Forbidden
  }
};

module.exports = { isAdminOrOwner };