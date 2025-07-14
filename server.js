const express = require('express');
const cookieParser = require('cookie-parser'); // Cần để đọc cookie cho refresh token
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./src/routes/bookRoutes'); // Import book routes
const chapterRoutes = require('./src/routes/chapterRoutes'); // Import chapter routes
const noteRoutes = require('./src/routes/noteRoutes'); // Import note routes
const commentRoutes = require('./src/routes/commentRoutes'); // Import comment routes
const characterRoutes = require('./src/routes/characterRoutes'); // Import character routes
const mapItemRoutes = require('./src/routes/mapItemRoutes'); // Import map item routes
const statRoutes = require('./src/routes/statRoutes'); // Import stat routes
const adminBookRoutes = require('./src/routes/adminBookRoutes');
const adminChapterRoutes = require('./src/routes/adminChapterRoutes');
const adminNoteRoutes = require('./src/routes/adminNoteRoutes');
const adminCommentRoutes = require('./src/routes/adminCommentRoutes');
const adminCharacterRoutes = require('./src/routes/adminCharacterRoutes');
const adminMapItemRoutes = require('./src/routes/adminMapItemRoutes');
const adminStatRoutes = require('./src/routes/adminStatRoutes');
// const pool = require('./config/db'); // Đảm bảo DB được kết nối khi khởi động

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json()); // Để parse JSON body
app.use(express.urlencoded({ extended: true })); // Để parse URL-encoded body
app.use(cookieParser()); // Để parse cookies

// Routes
app.use('/api/auth', authRoutes); // Prefix cho các auth routes
app.use('/api/books', bookRoutes); // Mount book routes
app.use('/api/chapters', chapterRoutes); // Mount chapter routes
app.use('/api/notes', noteRoutes); // Mount note routes
app.use('/api/comments', commentRoutes); // Mount comment routes
app.use('/api/characters', characterRoutes); // Mount character routes
app.use('/api/map-items', mapItemRoutes); // Mount map item routes
app.use('/api/stats', statRoutes); // Mount stat routes
app.use('/api/admin/books', adminBookRoutes);
app.use('/api/admin/chapters', adminChapterRoutes);
app.use('/api/admin/notes', adminNoteRoutes);
app.use('/api/admin/comments', adminCommentRoutes);
app.use('/api/admin/characters', adminCharacterRoutes);
app.use('/api/admin/map-items', adminMapItemRoutes);
app.use('/api/admin/stats', adminStatRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Auth API is running!');
});

// Global error handler (đơn giản)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;