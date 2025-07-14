// middleware/adminMiddleware.js
// Ensures the authenticated user has admin privileges
function authorizeAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
}

module.exports = authorizeAdmin;
