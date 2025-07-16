const request = require('supertest');
const app = require('../../server');
const prisma = require('../../config/db');

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Chapter Controller', () => {
  // GET all chapters
  describe('GET /api/chapters', () => {
    it('should return all chapters for books owned by the user', async () => {
      // Mock data
      const mockUserBooks = [
        { id: 1 },
        { id: 2 }
      ];
      
      const mockChapters = [
        { id: 1, book_id: 1, title: 'Chapter 1', content: 'Content 1', order_index: 0 },
        { id: 2, book_id: 1, title: 'Chapter 2', content: 'Content 2', order_index: 1 },
        { id: 3, book_id: 2, title: 'Chapter 1', content: 'Content 3', order_index: 0 }
      ];
      
      // Setup mocks
      prisma.book.findMany.mockResolvedValue(mockUserBooks);
      prisma.chapter.findMany.mockResolvedValue(mockChapters);
      
      // Make request
      const response = await request(app).get('/api/chapters');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Chapters fetched successfully.');
      expect(response.body.data).toEqual(mockChapters);
      expect(prisma.book.findMany).toHaveBeenCalledWith({
        where: { user_id: 1 },
        select: { id: true }
      });
      expect(prisma.chapter.findMany).toHaveBeenCalledWith({
        where: { book_id: { in: [1, 2] } },
        orderBy: [{ book_id: 'asc' }, { order_index: 'asc' }]
      });
    });
    
    it('should filter chapters by book_id when provided', async () => {
      // Mock data
      const mockBook = { id: 1, user_id: 1, title: 'Test Book' };
      const mockChapters = [
        { id: 1, book_id: 1, title: 'Chapter 1', content: 'Content 1', order_index: 0 },
        { id: 2, book_id: 1, title: 'Chapter 2', content: 'Content 2', order_index: 1 }
      ];
      
      // Setup mocks
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.chapter.findMany.mockResolvedValue(mockChapters);
      
      // Make request
      const response = await request(app).get('/api/chapters?book_id=1');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Chapters fetched successfully.');
      expect(response.body.data).toEqual(mockChapters);
      expect(prisma.book.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(prisma.chapter.findMany).toHaveBeenCalledWith({
        where: { book_id: 1 },
        orderBy: [{ book_id: 'asc' }, { order_index: 'asc' }]
      });
    });
    
    it('should return 404 when filtered book_id does not belong to user', async () => {
      // Mock book that belongs to another user
      const mockBook = { id: 1, user_id: 2, title: 'Test Book' };
      
      // Setup mock
      prisma.book.findUnique.mockResolvedValue(mockBook);
      
      // Make request
      const response = await request(app).get('/api/chapters?book_id=1');
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Book not found or not owned by user.');
      expect(prisma.chapter.findMany).not.toHaveBeenCalled();
    });
  });
  
  // GET chapter by ID
  describe('GET /api/chapters/:id', () => {
    it('should return a chapter by ID when its book belongs to the user', async () => {
      // Mock data
      const mockChapter = { id: 1, book_id: 1, title: 'Test Chapter', content: 'Test Content', order_index: 0 };
      const mockBook = { id: 1, user_id: 1, title: 'Test Book' };
      
      // Setup mocks
      prisma.chapter.findUnique.mockResolvedValue(mockChapter);
      prisma.book.findUnique.mockResolvedValue(mockBook);
      
      // Make request
      const response = await request(app).get('/api/chapters/1');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Chapter fetched successfully.');
      expect(response.body.data).toEqual(mockChapter);
      expect(prisma.chapter.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(prisma.book.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });
    
    it('should return 404 when chapter book does not belong to user', async () => {
      // Mock data
      const mockChapter = { id: 1, book_id: 1, title: 'Test Chapter' };
      const mockBook = { id: 1, user_id: 2, title: 'Test Book' };
      
      // Setup mocks
      prisma.chapter.findUnique.mockResolvedValue(mockChapter);
      prisma.book.findUnique.mockResolvedValue(mockBook);
      
      // Make request
      const response = await request(app).get('/api/chapters/1');
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Chapter not found or not owned by user.');
    });
    
    it('should return 404 when chapter does not exist', async () => {
      // Setup mock
      prisma.chapter.findUnique.mockResolvedValue(null);
      
      // Make request
      const response = await request(app).get('/api/chapters/999');
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Chapter not found.');
    });
    
    it('should return 400 when chapter ID is invalid', async () => {
      // Make request with invalid ID
      const response = await request(app).get('/api/chapters/invalid');
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid chapter ID.');
    });
  });
  
  // GET chapters by book ID
  describe('GET /api/books/:bookId/chapters', () => {
    it('should return all chapters for a specific book owned by the user', async () => {
      // Mock data
      const mockBook = { id: 1, user_id: 1, title: 'Test Book' };
      const mockChapters = [
        { id: 1, book_id: 1, title: 'Chapter 1', content: 'Content 1', order_index: 0 },
        { id: 2, book_id: 1, title: 'Chapter 2', content: 'Content 2', order_index: 1 }
      ];
      
      // Setup mocks
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.chapter.findMany.mockResolvedValue(mockChapters);
      
      // Make request
      const response = await request(app).get('/api/books/1/chapters');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Chapters fetched successfully.');
      expect(response.body.data).toEqual(mockChapters);
      expect(prisma.book.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(prisma.chapter.findMany).toHaveBeenCalledWith({
        where: { book_id: 1 },
        orderBy: { order_index: 'asc' }
      });
    });
    
    it('should return 404 when book does not belong to user', async () => {
      // Mock book that belongs to another user
      const mockBook = { id: 1, user_id: 2, title: 'Test Book' };
      
      // Setup mock
      prisma.book.findUnique.mockResolvedValue(mockBook);
      
      // Make request
      const response = await request(app).get('/api/books/1/chapters');
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Book not found or not owned by user.');
      expect(prisma.chapter.findMany).not.toHaveBeenCalled();
    });
  });
  
  // POST create chapter
  describe('POST /api/chapters', () => {
    it('should create a new chapter when provided valid data', async () => {
      // Mock request data
      const chapterData = {
        book_id: 1,
        title: 'New Chapter',
        content: 'New Content',
        order_index: 2
      };
      
      // Mock response data
      const createdChapter = {
        id: 3,
        book_id: 1,
        title: 'New Chapter',
        content: 'New Content',
        order_index: 2,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };
      
      // Mock book
      const mockBook = { id: 1, user_id: 1, title: 'Test Book' };
      
      // Setup mocks
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.chapter.create.mockResolvedValue(createdChapter);
      
      // Make request
      const response = await request(app)
        .post('/api/chapters')
        .send(chapterData);
      
      // Assertions
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Chapter created successfully.');
      expect(response.body.data).toEqual(createdChapter);
      expect(prisma.book.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(prisma.chapter.create).toHaveBeenCalledWith({
        data: {
          book_id: 1,
          title: 'New Chapter',
          content: 'New Content',
          order_index: 2
        }
      });
    });
    
    it('should return 400 when book_id is missing', async () => {
      // Make request with missing book_id
      const response = await request(app)
        .post('/api/chapters')
        .send({ title: 'New Chapter' });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('book_id is required and must be an integer.');
      expect(prisma.chapter.create).not.toHaveBeenCalled();
    });
    
    it('should return 400 when title is missing', async () => {
      // Make request with missing title
      const response = await request(app)
        .post('/api/chapters')
        .send({ book_id: 1 });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Title is required.');
      expect(prisma.chapter.create).not.toHaveBeenCalled();
    });
    
    it('should return 404 when book does not belong to user', async () => {
      // Mock book that belongs to another user
      const mockBook = { id: 1, user_id: 2, title: 'Test Book' };
      
      // Setup mock
      prisma.book.findUnique.mockResolvedValue(mockBook);
      
      // Make request
      const response = await request(app)
        .post('/api/chapters')
        .send({ book_id: 1, title: 'New Chapter' });
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Book not found or not owned by user.');
      expect(prisma.chapter.create).not.toHaveBeenCalled();
    });
  });
  
  // PUT update chapter
  describe('PUT /api/chapters/:id', () => {
    it('should update a chapter when its book belongs to the user', async () => {
      // Mock existing chapter
      const existingChapter = { 
        id: 1, 
        book_id: 1, 
        title: 'Old Title', 
        content: 'Old Content',
        order_index: 0
      };
      
      // Mock book
      const mockBook = { id: 1, user_id: 1, title: 'Test Book' };
      
      // Mock request data
      const updateData = {
        title: 'Updated Title',
        content: 'Updated Content'
      };
      
      // Mock updated chapter
      const updatedChapter = { 
        ...existingChapter, 
        title: 'Updated Title',
        content: 'Updated Content'
      };
      
      // Setup mocks
      prisma.chapter.findUnique.mockResolvedValue(existingChapter);
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.chapter.update.mockResolvedValue(updatedChapter);
      
      // Make request
      const response = await request(app)
        .put('/api/chapters/1')
        .send(updateData);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Chapter updated successfully.');
      expect(response.body.data).toEqual(updatedChapter);
      expect(prisma.chapter.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          title: 'Updated Title',
          content: 'Updated Content',
          order_index: 0
        }
      });
    });
    
    it('should return 404 when chapter book does not belong to user', async () => {
      // Mock existing chapter
      const existingChapter = { id: 1, book_id: 1, title: 'Test Chapter' };
      // Mock book that belongs to another user
      const mockBook = { id: 1, user_id: 2, title: 'Test Book' };
      
      // Setup mocks
      prisma.chapter.findUnique.mockResolvedValue(existingChapter);
      prisma.book.findUnique.mockResolvedValue(mockBook);
      
      // Make request
      const response = await request(app)
        .put('/api/chapters/1')
        .send({ title: 'Updated Title' });
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Chapter not found or not owned by user.');
      expect(prisma.chapter.update).not.toHaveBeenCalled();
    });
    
    it('should return 400 when title is empty', async () => {
      // Make request with empty title
      const response = await request(app)
        .put('/api/chapters/1')
        .send({ title: '' });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Title must be a non-empty string.');
      expect(prisma.chapter.update).not.toHaveBeenCalled();
    });
  });
  
  // DELETE chapter
  describe('DELETE /api/chapters/:id', () => {
    it('should delete a chapter when its book belongs to the user', async () => {
      // Mock existing chapter
      const existingChapter = { id: 1, book_id: 1, title: 'Test Chapter' };
      // Mock book
      const mockBook = { id: 1, user_id: 1, title: 'Test Book' };
      
      // Setup mocks
      prisma.chapter.findUnique.mockResolvedValue(existingChapter);
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.chapter.delete.mockResolvedValue(existingChapter);
      
      // Make request
      const response = await request(app).delete('/api/chapters/1');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Chapter deleted successfully.');
      expect(prisma.chapter.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
    
    it('should return 404 when chapter book does not belong to user', async () => {
      // Mock existing chapter
      const existingChapter = { id: 1, book_id: 1, title: 'Test Chapter' };
      // Mock book that belongs to another user
      const mockBook = { id: 1, user_id: 2, title: 'Test Book' };
      
      // Setup mocks
      prisma.chapter.findUnique.mockResolvedValue(existingChapter);
      prisma.book.findUnique.mockResolvedValue(mockBook);
      
      // Make request
      const response = await request(app).delete('/api/chapters/1');
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Chapter not found or not owned by user.');
      expect(prisma.chapter.delete).not.toHaveBeenCalled();
    });
    
    it('should return 404 when chapter does not exist', async () => {
      // Setup mock
      prisma.chapter.findUnique.mockResolvedValue(null);
      
      // Make request
      const response = await request(app).delete('/api/chapters/999');
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Chapter not found.');
      expect(prisma.chapter.delete).not.toHaveBeenCalled();
    });
  });
});
