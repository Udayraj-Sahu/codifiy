// middleware/adminMiddleware.js
const isAdmin = (req, res, next) => {
  // Assumes 'protect' middleware has already run and set req.user
  if (req.user && req.user.role === 'Admin') {
    next(); // User is an Admin, proceed
  } else {
    res.status(403).json({ message: 'Not authorized as an Admin' }); // Forbidden
  }
};

module.exports = { isAdmin };