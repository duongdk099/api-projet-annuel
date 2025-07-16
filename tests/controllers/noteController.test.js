const request = require('supertest');
const app = require('../../server');
const prisma = require('../../config/db');

// Mock prisma client
jest.mock('../../config/db', () => {
  return {
    note: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    book: {
      findUnique: jest.fn(),
    },
    chapter: {
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

describe('Note Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/notes', () => {
    it('should return all notes for the authenticated user', async () => {
      const mockNotes = [
        { id: 1, user_id: 1, book_id: 1, chapter_id: 1, title: 'Test Note 1', content: 'Content 1' },
        { id: 2, user_id: 1, book_id: 1, chapter_id: null, title: 'Test Note 2', content: 'Content 2' },
      ];
      
      prisma.note.findMany.mockResolvedValue(mockNotes);
      
      const res = await request(app).get('/api/notes');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Notes fetched successfully.');
      expect(res.body.data).toEqual(mockNotes);
      expect(prisma.note.findMany).toHaveBeenCalledWith({
        where: { user_id: 1 },
        orderBy: { created_at: 'desc' }
      });
    });

    it('should return filtered notes when book_id is provided', async () => {
      const mockBook = { id: 1, user_id: 1, title: 'Test Book' };
      const mockNotes = [
        { id: 1, user_id: 1, book_id: 1, chapter_id: 1, title: 'Test Note 1', content: 'Content 1' },
        { id: 2, user_id: 1, book_id: 1, chapter_id: null, title: 'Test Note 2', content: 'Content 2' },
      ];
      
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.note.findMany.mockResolvedValue(mockNotes);
      
      const res = await request(app).get('/api/notes?book_id=1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Notes fetched successfully.');
      expect(res.body.data).toEqual(mockNotes);
      expect(prisma.book.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(prisma.note.findMany).toHaveBeenCalledWith({
        where: { 
          user_id: 1,
          book_id: 1
        },
        orderBy: { created_at: 'desc' }
      });
    });

    it('should return 404 if book_id is provided but book not found or not owned', async () => {
      prisma.book.findUnique.mockResolvedValue({ id: 1, user_id: 2 });
      
      const res = await request(app).get('/api/notes?book_id=1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Book not found or not owned by user.');
      expect(prisma.note.findMany).not.toHaveBeenCalled();
    });

    it('should return filtered notes when chapter_id is provided', async () => {
      const mockChapter = { id: 1, book_id: 1 };
      const mockBook = { id: 1, user_id: 1, title: 'Test Book' };
      const mockNotes = [
        { id: 1, user_id: 1, book_id: 1, chapter_id: 1, title: 'Test Note 1', content: 'Content 1' }
      ];
      
      prisma.chapter.findUnique.mockResolvedValue(mockChapter);
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.note.findMany.mockResolvedValue(mockNotes);
      
      const res = await request(app).get('/api/notes?chapter_id=1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Notes fetched successfully.');
      expect(res.body.data).toEqual(mockNotes);
      expect(prisma.chapter.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(prisma.book.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(prisma.note.findMany).toHaveBeenCalledWith({
        where: { 
          user_id: 1,
          chapter_id: 1
        },
        orderBy: { created_at: 'desc' }
      });
    });

    it('should return 404 if chapter_id is provided but chapter not found', async () => {
      prisma.chapter.findUnique.mockResolvedValue(null);
      
      const res = await request(app).get('/api/notes?chapter_id=999');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Chapter not found.');
      expect(prisma.note.findMany).not.toHaveBeenCalled();
    });

    it('should return 404 if chapter_id is provided but chapter\'s book not owned', async () => {
      const mockChapter = { id: 1, book_id: 1 };
      const mockBook = { id: 1, user_id: 2 };
      
      prisma.chapter.findUnique.mockResolvedValue(mockChapter);
      prisma.book.findUnique.mockResolvedValue(mockBook);
      
      const res = await request(app).get('/api/notes?chapter_id=1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Chapter not found or not owned by user.');
      expect(prisma.note.findMany).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/notes/:id', () => {
    it('should return a note by ID when it belongs to the user', async () => {
      const mockNote = { id: 1, user_id: 1, book_id: 1, chapter_id: 1, title: 'Test Note', content: 'Test Content' };
      
      prisma.note.findUnique.mockResolvedValue(mockNote);
      
      const res = await request(app).get('/api/notes/1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Note fetched successfully.');
      expect(res.body.data).toEqual(mockNote);
      expect(prisma.note.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 400 for invalid note ID', async () => {
      const res = await request(app).get('/api/notes/invalid');
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid note ID.');
    });

    it('should return 404 if note not found', async () => {
      prisma.note.findUnique.mockResolvedValue(null);
      
      const res = await request(app).get('/api/notes/1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Note not found.');
    });

    it('should return 404 if note does not belong to user', async () => {
      const mockNote = { id: 1, user_id: 2, title: 'Test Note' };
      
      prisma.note.findUnique.mockResolvedValue(mockNote);
      
      const res = await request(app).get('/api/notes/1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Note not found.');
    });
  });

  describe('POST /api/notes', () => {
    it('should create a new note', async () => {
      const noteData = {
        title: 'New Note',
        content: 'Note content',
        book_id: 1,
        chapter_id: null
      };
      
      const createdNote = {
        id: 1,
        user_id: 1,
        book_id: 1,
        chapter_id: null,
        title: 'New Note',
        content: 'Note content',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockBook = { id: 1, user_id: 1 };
      
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.note.create.mockResolvedValue(createdNote);
      
      const res = await request(app)
        .post('/api/notes')
        .send(noteData);
      
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Note created successfully.');
      expect(res.body.data).toEqual(createdNote);
      expect(prisma.note.create).toHaveBeenCalledWith({
        data: {
          ...noteData,
          user_id: 1
        }
      });
    });

    it('should create a new note with chapter reference', async () => {
      const noteData = {
        title: 'New Note',
        content: 'Note content',
        book_id: 1,
        chapter_id: 1
      };
      
      const createdNote = {
        id: 1,
        user_id: 1,
        book_id: 1,
        chapter_id: 1,
        title: 'New Note',
        content: 'Note content',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockBook = { id: 1, user_id: 1 };
      const mockChapter = { id: 1, book_id: 1 };
      
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.chapter.findUnique.mockResolvedValue(mockChapter);
      prisma.note.create.mockResolvedValue(createdNote);
      
      const res = await request(app)
        .post('/api/notes')
        .send(noteData);
      
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Note created successfully.');
      expect(res.body.data).toEqual(createdNote);
    });

    it('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/api/notes')
        .send({
          content: 'Note content',
          book_id: 1
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Title is required.');
    });

    it('should return 400 if book_id is missing', async () => {
      const res = await request(app)
        .post('/api/notes')
        .send({
          title: 'New Note',
          content: 'Note content'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Book ID is required.');
    });

    it('should return 404 if book not found or not owned by user', async () => {
      const noteData = {
        title: 'New Note',
        content: 'Note content',
        book_id: 1
      };

      prisma.book.findUnique.mockResolvedValue(null);
      
      const res = await request(app)
        .post('/api/notes')
        .send(noteData);
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Book not found or not owned by user.');
    });

    it('should return 404 if chapter not found', async () => {
      const noteData = {
        title: 'New Note',
        content: 'Note content',
        book_id: 1,
        chapter_id: 1
      };

      const mockBook = { id: 1, user_id: 1 };
      
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.chapter.findUnique.mockResolvedValue(null);
      
      const res = await request(app)
        .post('/api/notes')
        .send(noteData);
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Chapter not found.');
    });

    it('should return 400 if chapter does not belong to specified book', async () => {
      const noteData = {
        title: 'New Note',
        content: 'Note content',
        book_id: 1,
        chapter_id: 1
      };

      const mockBook = { id: 1, user_id: 1 };
      const mockChapter = { id: 1, book_id: 2 };
      
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.chapter.findUnique.mockResolvedValue(mockChapter);
      
      const res = await request(app)
        .post('/api/notes')
        .send(noteData);
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Chapter does not belong to the specified book.');
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('should update a note', async () => {
      const mockNote = {
        id: 1,
        user_id: 1,
        book_id: 1,
        chapter_id: 1,
        title: 'Old Title',
        content: 'Old Content'
      };
      
      const updateData = {
        title: 'Updated Title',
        content: 'Updated Content'
      };
      
      const updatedNote = {
        ...mockNote,
        title: 'Updated Title',
        content: 'Updated Content'
      };
      
      prisma.note.findUnique.mockResolvedValue(mockNote);
      prisma.note.update.mockResolvedValue(updatedNote);
      
      const res = await request(app)
        .put('/api/notes/1')
        .send(updateData);
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Note updated successfully.');
      expect(res.body.data).toEqual(updatedNote);
      expect(prisma.note.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData
      });
    });

    it('should return 404 if note not found or not owned by user', async () => {
      const mockNote = { id: 1, user_id: 2, title: 'Test Note' };
      
      prisma.note.findUnique.mockResolvedValue(mockNote);
      
      const res = await request(app)
        .put('/api/notes/1')
        .send({ title: 'Updated Title' });
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Note not found or not owned by user.');
    });

    it('should return 400 if title is empty', async () => {
      const mockNote = { id: 1, user_id: 1, title: 'Test Note' };
      
      prisma.note.findUnique.mockResolvedValue(mockNote);
      
      const res = await request(app)
        .put('/api/notes/1')
        .send({ title: '' });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Title must be a non-empty string.');
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should delete a note', async () => {
      const mockNote = { id: 1, user_id: 1, title: 'Test Note' };
      
      prisma.note.findUnique.mockResolvedValue(mockNote);
      prisma.note.delete.mockResolvedValue(mockNote);
      
      const res = await request(app).delete('/api/notes/1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Note deleted successfully.');
      expect(prisma.note.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 404 if note not found or not owned by user', async () => {
      const mockNote = { id: 1, user_id: 2, title: 'Test Note' };
      
      prisma.note.findUnique.mockResolvedValue(mockNote);
      
      const res = await request(app).delete('/api/notes/1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Note not found or not owned by user.');
    });
  });
});
