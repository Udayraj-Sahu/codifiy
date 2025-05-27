// middleware/ownerMiddleware.js
const isOwner = (req, res, next) => {
  // Assumes 'protect' middleware has already run and set req.user
  if (req.user && req.user.role === 'Owner') {
    next(); // User is an Owner, proceed
  } else {
    res.status(403).json({ message: 'Not authorized as an Owner' }); // Forbidden
  }
};

module.exports = { isOwner };