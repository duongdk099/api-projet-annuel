const request = require('supertest');
const app = require('../testApp');
const prisma = require('../../config/db');

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Book Controller', () => {
  // GET all books
  describe('GET /api/books', () => {
    it('should return all books for authenticated user', async () => {
      // Mock data
      const mockBooks = [
        { id: 1, user_id: 1, title: 'Test Book 1', description: 'Description 1', genre: 'Fantasy', status: 'In Progress' },
        { id: 2, user_id: 1, title: 'Test Book 2', description: 'Description 2', genre: 'Sci-Fi', status: 'Completed' }
      ];
      
      // Setup mock
      prisma.book.findMany.mockResolvedValue(mockBooks);
      
      // Make request
      const response = await request(app).get('/api/books');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Books fetched successfully.');
      expect(response.body.data).toEqual(mockBooks);
      expect(prisma.book.findMany).toHaveBeenCalledWith({
        where: { user_id: 1 },
        orderBy: { created_at: 'desc' },
      });
    });
    
    it('should return 500 when database query fails', async () => {
      // Setup mock to throw error
      prisma.book.findMany.mockRejectedValue(new Error('Database error'));
      
      // Make request
      const response = await request(app).get('/api/books');
      
      // Assertions
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal server error.');
    });
  });
  
  // GET book by ID
  describe('GET /api/books/:id', () => {
    it('should return a book by ID when it belongs to the user', async () => {
      // Mock data
      const mockBook = { id: 1, user_id: 1, title: 'Test Book', description: 'Test Description', genre: 'Fantasy', status: 'In Progress' };
      
      // Setup mock
      prisma.book.findUnique.mockResolvedValue(mockBook);
      
      // Make request
      const response = await request(app).get('/api/books/1');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Book fetched successfully.');
      expect(response.body.data).toEqual(mockBook);
      expect(prisma.book.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });
    
    it('should return 404 when book does not belong to user', async () => {
      // Mock data - user_id is different than authenticated user
      const mockBook = { id: 1, user_id: 2, title: 'Test Book', description: 'Test Description' };
      
      // Setup mock
      prisma.book.findUnique.mockResolvedValue(mockBook);
      
      // Make request
      const response = await request(app).get('/api/books/1');
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Book not found.');
    });
    
    it('should return 404 when book does not exist', async () => {
      // Setup mock
      prisma.book.findUnique.mockResolvedValue(null);
      
      // Make request
      const response = await request(app).get('/api/books/999');
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Book not found.');
    });
    
    it('should return 400 when book ID is invalid', async () => {
      // Make request with invalid ID
      const response = await request(app).get('/api/books/invalid');
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid book ID.');
    });
  });
  
  // POST create new book
  describe('POST /api/books', () => {
    it('should create a new book when provided valid data', async () => {
      // Mock request data
      const bookData = {
        title: 'New Book',
        description: 'New Description',
        genre: 'Mystery',
        status: 'Planning'
      };
      
      // Mock response data
      const createdBook = {
        id: 3,
        user_id: 1,
        title: 'New Book',
        description: 'New Description',
        genre: 'Mystery',
        status: 'Planning',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };
      
      // Setup mock
      prisma.book.create.mockResolvedValue(createdBook);
      
      // Make request
      const response = await request(app)
        .post('/api/books')
        .send(bookData);
      
      // Assertions
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Book created successfully.');
      expect(response.body.data).toEqual(createdBook);
      expect(prisma.book.create).toHaveBeenCalledWith({
        data: {
          user_id: 1,
          title: 'New Book',
          description: 'New Description',
          genre: 'Mystery',
          status: 'Planning'
        }
      });
    });
    
    it('should return 400 when title is missing', async () => {
      // Make request with missing title
      const response = await request(app)
        .post('/api/books')
        .send({ description: 'New Description' });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Title is required.');
      expect(prisma.book.create).not.toHaveBeenCalled();
    });
    
    it('should return 400 when title is empty', async () => {
      // Make request with empty title
      const response = await request(app)
        .post('/api/books')
        .send({ title: '' });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Title is required.');
      expect(prisma.book.create).not.toHaveBeenCalled();
    });
  });
  
  // PUT update book
  describe('PUT /api/books/:id', () => {
    it('should update a book when it belongs to the user', async () => {
      // Mock existing book
      const existingBook = { 
        id: 1, 
        user_id: 1, 
        title: 'Old Title', 
        description: 'Old Description',
        genre: 'Fantasy',
        status: 'Planning'
      };
      
      // Mock request data
      const updateData = {
        title: 'Updated Title',
        status: 'In Progress'
      };
      
      // Mock updated book
      const updatedBook = { 
        ...existingBook, 
        title: 'Updated Title',
        status: 'In Progress'
      };
      
      // Setup mocks
      prisma.book.findUnique.mockResolvedValue(existingBook);
      prisma.book.update.mockResolvedValue(updatedBook);
      
      // Make request
      const response = await request(app)
        .put('/api/books/1')
        .send(updateData);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Book updated successfully.');
      expect(response.body.data).toEqual(updatedBook);
      expect(prisma.book.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          title: 'Updated Title',
          description: existingBook.description,
          genre: existingBook.genre,
          status: 'In Progress'
        }
      });
    });
    
    it('should return 404 when book does not belong to user', async () => {
      // Mock book that belongs to another user
      const existingBook = { id: 1, user_id: 2, title: 'Test Book' };
      
      // Setup mock
      prisma.book.findUnique.mockResolvedValue(existingBook);
      
      // Make request
      const response = await request(app)
        .put('/api/books/1')
        .send({ title: 'Updated Title' });
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Book not found.');
      expect(prisma.book.update).not.toHaveBeenCalled();
    });
    
    it('should return 400 when title is empty', async () => {
      // Make request with empty title
      const response = await request(app)
        .put('/api/books/1')
        .send({ title: '' });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Title must be a non-empty string.');
      expect(prisma.book.update).not.toHaveBeenCalled();
    });
  });
  
  // DELETE book
  describe('DELETE /api/books/:id', () => {
    it('should delete a book when it belongs to the user', async () => {
      // Mock existing book
      const existingBook = { id: 1, user_id: 1, title: 'Test Book' };
      
      // Setup mocks
      prisma.book.findUnique.mockResolvedValue(existingBook);
      prisma.book.delete.mockResolvedValue(existingBook);
      
      // Make request
      const response = await request(app).delete('/api/books/1');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Book deleted successfully.');
      expect(prisma.book.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
    
    it('should return 404 when book does not belong to user', async () => {
      // Mock book that belongs to another user
      const existingBook = { id: 1, user_id: 2, title: 'Test Book' };
      
      // Setup mock
      prisma.book.findUnique.mockResolvedValue(existingBook);
      
      // Make request
      const response = await request(app).delete('/api/books/1');
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Book not found.');
      expect(prisma.book.delete).not.toHaveBeenCalled();
    });
    
    it('should return 404 when book does not exist', async () => {
      // Setup mock
      prisma.book.findUnique.mockResolvedValue(null);
      
      // Make request
      const response = await request(app).delete('/api/books/999');
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Book not found.');
      expect(prisma.book.delete).not.toHaveBeenCalled();
    });
  });
});
