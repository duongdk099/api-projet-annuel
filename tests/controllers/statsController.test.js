const request = require('supertest');
const app = require('../../server');
const prisma = require('../../config/db');

// Mock prisma client
jest.mock('../../config/db', () => {
  return {
    stat: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    book: {
      findUnique: jest.fn(),
      aggregate: jest.fn(),
    },
    chapter: {
      aggregate: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    }
  };
});

// Mock authentication middleware
jest.mock('../../middleware/authMiddleware', () => {
  return (req, res, next) => {
    req.user = { userId: 1, email: 'test@example.com', role: 'member' };
    next();
  };
});

describe('Stats Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/stats', () => {
    it('should return all stats for the authenticated user', async () => {
      const mockStats = [
        { id: 1, user_id: 1, book_id: 1, word_count: 5000, chapter_count: 5, last_updated: '2023-01-01T00:00:00Z' },
        { id: 2, user_id: 1, book_id: 2, word_count: 8000, chapter_count: 8, last_updated: '2023-01-02T00:00:00Z' }
      ];
      
      prisma.stat.findMany.mockResolvedValue(mockStats);
      
      const res = await request(app).get('/api/stats');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Stats fetched successfully.');
      expect(res.body.data).toEqual(mockStats);
      expect(prisma.stat.findMany).toHaveBeenCalledWith({
        where: { user_id: 1 },
        orderBy: { last_updated: 'desc' }
      });
    });
  });

  describe('GET /api/stats/:id', () => {
    it('should return stats by ID when it belongs to the user', async () => {
      const mockStat = { 
        id: 1, 
        user_id: 1, 
        book_id: 1, 
        word_count: 5000, 
        chapter_count: 5, 
        last_updated: '2023-01-01T00:00:00Z' 
      };
      
      prisma.stat.findUnique.mockResolvedValue(mockStat);
      
      const res = await request(app).get('/api/stats/1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Stats fetched successfully.');
      expect(res.body.data).toEqual(mockStat);
      expect(prisma.stat.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 400 for invalid stats ID', async () => {
      const res = await request(app).get('/api/stats/invalid');
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid stat ID.');
    });

    it('should return 404 if stats not found', async () => {
      prisma.stat.findUnique.mockResolvedValue(null);
      
      const res = await request(app).get('/api/stats/1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Stats not found.');
    });

    it('should return 404 if stats do not belong to user', async () => {
      const mockStat = { id: 1, user_id: 2, book_id: 1 };
      
      prisma.stat.findUnique.mockResolvedValue(mockStat);
      
      const res = await request(app).get('/api/stats/1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Stats not found or not owned by user.');
    });
  });

  describe('GET /api/stats/book/:bookId', () => {
    it('should return stats for a specific book owned by the user', async () => {
      const mockBook = { id: 1, user_id: 1, title: 'Test Book' };
      const mockStat = { 
        id: 1, 
        user_id: 1, 
        book_id: 1, 
        word_count: 5000, 
        chapter_count: 5, 
        last_updated: '2023-01-01T00:00:00Z' 
      };
      
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.stat.findUnique.mockResolvedValue(mockStat);
      
      const res = await request(app).get('/api/stats/book/1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Stats fetched successfully.');
      expect(res.body.data).toEqual(mockStat);
      expect(prisma.book.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(prisma.stat.findUnique).toHaveBeenCalledWith({
        where: { book_id: 1 }
      });
    });

    it('should return 404 if book not found or not owned by user', async () => {
      prisma.book.findUnique.mockResolvedValue({ id: 1, user_id: 2 });
      
      const res = await request(app).get('/api/stats/book/1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Book not found or not owned by user.');
    });

    it('should return 404 if no stats exist for the book', async () => {
      const mockBook = { id: 1, user_id: 1, title: 'Test Book' };
      
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.stat.findUnique.mockResolvedValue(null);
      
      const res = await request(app).get('/api/stats/book/1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('No stats found for this book.');
    });
  });

  describe('POST /api/stats/calculate/:bookId', () => {
    it('should calculate and update stats for a specific book', async () => {
      const mockBook = { id: 1, user_id: 1, title: 'Test Book' };
      
      // Mock word count calculation
      prisma.chapter.aggregate.mockResolvedValue({ _sum: { word_count: 5000 } });
      
      // Mock chapter count
      prisma.book.aggregate.mockResolvedValue({ _count: { id: 5 } });
      
      // Mock existing or new stats
      const createdStat = { 
        id: 1, 
        user_id: 1, 
        book_id: 1, 
        word_count: 5000, 
        chapter_count: 5, 
        last_updated: '2023-01-01T00:00:00Z' 
      };
      
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.stat.upsert.mockResolvedValue(createdStat);
      
      const res = await request(app).post('/api/stats/calculate/1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Stats calculated and updated successfully.');
      expect(res.body.data).toEqual(createdStat);
      expect(prisma.book.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(prisma.chapter.aggregate).toHaveBeenCalledWith({
        _sum: { word_count: true },
        where: { book_id: 1 }
      });
      expect(prisma.book.aggregate).toHaveBeenCalledWith({
        _count: { id: true },
        where: { id: 1 }
      });
      expect(prisma.stat.upsert).toHaveBeenCalled();
    });

    it('should return 404 if book not found or not owned by user', async () => {
      prisma.book.findUnique.mockResolvedValue({ id: 1, user_id: 2 });
      
      const res = await request(app).post('/api/stats/calculate/1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Book not found or not owned by user.');
    });
  });

  describe('GET /api/stats/user/summary', () => {
    it('should return a summary of user writing statistics', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const mockBooks = { _count: { id: 5 } };
      const mockChapters = { _count: { id: 25 } };
      const mockWordCount = { _sum: { word_count: 50000 } };
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.book.aggregate.mockResolvedValue(mockBooks);
      prisma.chapter.aggregate.mockResolvedValue(mockChapters);
      prisma.chapter.aggregate.mockResolvedValueOnce(mockWordCount);
      
      const res = await request(app).get('/api/stats/user/summary');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User stats summary fetched successfully.');
      expect(res.body.data).toEqual({
        user_id: 1,
        username: 'testuser',
        total_books: 5,
        total_chapters: 25,
        total_words: 50000
      });
    });
  });

  describe('DELETE /api/stats/:id', () => {
    it('should delete stats', async () => {
      const mockStat = { id: 1, user_id: 1, book_id: 1 };
      
      prisma.stat.findUnique.mockResolvedValue(mockStat);
      prisma.stat.delete.mockResolvedValue(mockStat);
      
      const res = await request(app).delete('/api/stats/1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Stats deleted successfully.');
      expect(prisma.stat.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 404 if stats not found or not owned by user', async () => {
      const mockStat = { id: 1, user_id: 2, book_id: 1 };
      
      prisma.stat.findUnique.mockResolvedValue(mockStat);
      
      const res = await request(app).delete('/api/stats/1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Stats not found or not owned by user.');
    });
  });
});
