const request = require('supertest');
const app = require('../../server');
const prisma = require('../../config/db');

// Mock prisma client
jest.mock('../../config/db', () => {
  return {
    comment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    chapter: {
      findUnique: jest.fn(),
    },
    book: {
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

describe('Comment Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/comments', () => {
    it('should return all comments for the authenticated user', async () => {
      const mockComments = [
        { id: 1, user_id: 1, chapter_id: 1, content: 'Comment 1', parent_id: null },
        { id: 2, user_id: 1, chapter_id: 2, content: 'Comment 2', parent_id: null }
      ];
      
      prisma.comment.findMany.mockResolvedValue(mockComments);
      
      const res = await request(app).get('/api/comments');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Comments fetched successfully.');
      expect(res.body.data).toEqual(mockComments);
      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: { user_id: 1 },
        orderBy: { created_at: 'desc' }
      });
    });

    it('should return filtered comments when chapter_id is provided', async () => {
      const mockChapter = { id: 1, book_id: 1 };
      const mockBook = { id: 1, user_id: 1, title: 'Test Book' };
      const mockComments = [
        { id: 1, user_id: 1, chapter_id: 1, content: 'Comment 1', parent_id: null },
        { id: 2, user_id: 2, chapter_id: 1, content: 'Comment 2', parent_id: null }
      ];
      
      prisma.chapter.findUnique.mockResolvedValue(mockChapter);
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.comment.findMany.mockResolvedValue(mockComments);
      
      const res = await request(app).get('/api/comments?chapter_id=1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Comments fetched successfully.');
      expect(res.body.data).toEqual(mockComments);
      expect(prisma.chapter.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(prisma.book.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: { chapter_id: 1 },
        orderBy: { created_at: 'desc' }
      });
    });

    it('should return 404 if chapter_id is provided but chapter not found', async () => {
      prisma.chapter.findUnique.mockResolvedValue(null);
      
      const res = await request(app).get('/api/comments?chapter_id=999');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Chapter not found.');
      expect(prisma.comment.findMany).not.toHaveBeenCalled();
    });

    it('should return 404 if chapter_id is provided but chapter\'s book not owned by user', async () => {
      const mockChapter = { id: 1, book_id: 1 };
      const mockBook = { id: 1, user_id: 2 };
      
      prisma.chapter.findUnique.mockResolvedValue(mockChapter);
      prisma.book.findUnique.mockResolvedValue(mockBook);
      
      const res = await request(app).get('/api/comments?chapter_id=1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Chapter not found or not owned by user.');
      expect(prisma.comment.findMany).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/comments/:id', () => {
    it('should return a comment by ID when it belongs to the user', async () => {
      const mockComment = { id: 1, user_id: 1, chapter_id: 1, content: 'Test Comment', parent_id: null };
      
      prisma.comment.findUnique.mockResolvedValue(mockComment);
      
      const res = await request(app).get('/api/comments/1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Comment fetched successfully.');
      expect(res.body.data).toEqual(mockComment);
      expect(prisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 400 for invalid comment ID', async () => {
      const res = await request(app).get('/api/comments/invalid');
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid comment ID.');
    });

    it('should return 404 if comment not found', async () => {
      prisma.comment.findUnique.mockResolvedValue(null);
      
      const res = await request(app).get('/api/comments/1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Comment not found.');
    });

    it('should return 404 if comment does not belong to user', async () => {
      const mockComment = { id: 1, user_id: 2, content: 'Test Comment' };
      
      prisma.comment.findUnique.mockResolvedValue(mockComment);
      
      const res = await request(app).get('/api/comments/1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Comment not found or not owned by user.');
    });
  });

  describe('POST /api/comments', () => {
    it('should create a new comment', async () => {
      const commentData = {
        content: 'New Comment',
        chapter_id: 1,
        parent_id: null
      };
      
      const createdComment = {
        id: 1,
        user_id: 1,
        chapter_id: 1,
        content: 'New Comment',
        parent_id: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockChapter = { id: 1, book_id: 1 };
      const mockBook = { id: 1, user_id: 1 };
      
      prisma.chapter.findUnique.mockResolvedValue(mockChapter);
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.comment.create.mockResolvedValue(createdComment);
      
      const res = await request(app)
        .post('/api/comments')
        .send(commentData);
      
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Comment created successfully.');
      expect(res.body.data).toEqual(createdComment);
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          ...commentData,
          user_id: 1
        }
      });
    });

    it('should create a reply to an existing comment', async () => {
      const commentData = {
        content: 'Reply Comment',
        chapter_id: 1,
        parent_id: 1
      };
      
      const parentComment = {
        id: 1,
        user_id: 2,
        chapter_id: 1,
        content: 'Parent Comment',
        parent_id: null
      };
      
      const createdComment = {
        id: 2,
        user_id: 1,
        chapter_id: 1,
        content: 'Reply Comment',
        parent_id: 1,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockChapter = { id: 1, book_id: 1 };
      const mockBook = { id: 1, user_id: 1 };
      
      prisma.chapter.findUnique.mockResolvedValue(mockChapter);
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.comment.findUnique.mockResolvedValue(parentComment);
      prisma.comment.create.mockResolvedValue(createdComment);
      
      const res = await request(app)
        .post('/api/comments')
        .send(commentData);
      
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Comment created successfully.');
      expect(res.body.data).toEqual(createdComment);
    });

    it('should return 400 if content is missing', async () => {
      const res = await request(app)
        .post('/api/comments')
        .send({
          chapter_id: 1
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Content is required and must be a non-empty string.');
    });

    it('should return 400 if chapter_id is missing', async () => {
      const res = await request(app)
        .post('/api/comments')
        .send({
          content: 'New Comment'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('chapter_id is required and must be an integer.');
    });

    it('should return 404 if chapter not found', async () => {
      const commentData = {
        content: 'New Comment',
        chapter_id: 999
      };

      prisma.chapter.findUnique.mockResolvedValue(null);
      
      const res = await request(app)
        .post('/api/comments')
        .send(commentData);
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Chapter not found.');
    });

    it('should return 404 if chapter\'s book not owned by user', async () => {
      const commentData = {
        content: 'New Comment',
        chapter_id: 1
      };

      const mockChapter = { id: 1, book_id: 1 };
      const mockBook = { id: 1, user_id: 2 };
      
      prisma.chapter.findUnique.mockResolvedValue(mockChapter);
      prisma.book.findUnique.mockResolvedValue(mockBook);
      
      const res = await request(app)
        .post('/api/comments')
        .send(commentData);
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Chapter not found or not owned by user.');
    });

    it('should return 404 if parent_id is provided but parent comment not found', async () => {
      const commentData = {
        content: 'Reply Comment',
        chapter_id: 1,
        parent_id: 999
      };

      const mockChapter = { id: 1, book_id: 1 };
      const mockBook = { id: 1, user_id: 1 };
      
      prisma.chapter.findUnique.mockResolvedValue(mockChapter);
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.comment.findUnique.mockResolvedValue(null);
      
      const res = await request(app)
        .post('/api/comments')
        .send(commentData);
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Parent comment not found.');
    });

    it('should return 400 if parent comment is for a different chapter', async () => {
      const commentData = {
        content: 'Reply Comment',
        chapter_id: 1,
        parent_id: 1
      };

      const parentComment = {
        id: 1,
        user_id: 2,
        chapter_id: 2,
        content: 'Parent Comment'
      };

      const mockChapter = { id: 1, book_id: 1 };
      const mockBook = { id: 1, user_id: 1 };
      
      prisma.chapter.findUnique.mockResolvedValue(mockChapter);
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.comment.findUnique.mockResolvedValue(parentComment);
      
      const res = await request(app)
        .post('/api/comments')
        .send(commentData);
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Parent comment does not belong to the specified chapter.');
    });
  });

  describe('PUT /api/comments/:id', () => {
    it('should update a comment', async () => {
      const mockComment = {
        id: 1,
        user_id: 1,
        chapter_id: 1,
        content: 'Old Content',
        parent_id: null
      };
      
      const updateData = {
        content: 'Updated Content'
      };
      
      const updatedComment = {
        ...mockComment,
        content: 'Updated Content'
      };
      
      prisma.comment.findUnique.mockResolvedValue(mockComment);
      prisma.comment.update.mockResolvedValue(updatedComment);
      
      const res = await request(app)
        .put('/api/comments/1')
        .send(updateData);
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Comment updated successfully.');
      expect(res.body.data).toEqual(updatedComment);
      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData
      });
    });

    it('should return 404 if comment not found or not owned by user', async () => {
      const mockComment = { id: 1, user_id: 2, content: 'Test Comment' };
      
      prisma.comment.findUnique.mockResolvedValue(mockComment);
      
      const res = await request(app)
        .put('/api/comments/1')
        .send({ content: 'Updated Content' });
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Comment not found or not owned by user.');
    });

    it('should return 400 if content is empty', async () => {
      const mockComment = { id: 1, user_id: 1, content: 'Test Comment' };
      
      prisma.comment.findUnique.mockResolvedValue(mockComment);
      
      const res = await request(app)
        .put('/api/comments/1')
        .send({ content: '' });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Content is required and must be a non-empty string.');
    });
  });

  describe('DELETE /api/comments/:id', () => {
    it('should delete a comment', async () => {
      const mockComment = { id: 1, user_id: 1, content: 'Test Comment' };
      
      prisma.comment.findUnique.mockResolvedValue(mockComment);
      prisma.comment.delete.mockResolvedValue(mockComment);
      
      const res = await request(app).delete('/api/comments/1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Comment deleted successfully.');
      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 404 if comment not found or not owned by user', async () => {
      const mockComment = { id: 1, user_id: 2, content: 'Test Comment' };
      
      prisma.comment.findUnique.mockResolvedValue(mockComment);
      
      const res = await request(app).delete('/api/comments/1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Comment not found or not owned by user.');
    });
  });
});
