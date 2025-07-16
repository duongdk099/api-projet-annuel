const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('../routes/authRoutes');
const bookRoutes = require('../src/routes/bookRoutes');
const chapterRoutes = require('../src/routes/chapterRoutes');

// Create Express app for testing
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes for testing
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/books/:bookId/chapters', (req, res, next) => {
  req.params.bookId = req.params.bookId;
  chapterRoutes.handle(req, res, next);
});

module.exports = app;
