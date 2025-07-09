// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token not found.' });
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      // Phân biệt lỗi token hết hạn và token không hợp lệ
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Access token expired.' });
      }
      return res.status(403).json({ message: 'Invalid access token.' });
    }
    req.user = user; // Gắn thông tin user (payload của JWT) vào request
    next();
  });
};

module.exports = authenticateToken;