// Mock for authentication middleware
const mockAuthMiddleware = (req, res, next) => {
  // Add authenticated user to request
  req.user = { userId: 1, username: 'test_user' };
  next();
};

module.exports = mockAuthMiddleware;
