const request = require('supertest');
const app = require('../../server');
const prisma = require('../../config/db');

// Mock prisma client
jest.mock('../../config/db', () => {
  return {
    character: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

describe('Character Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/characters', () => {
    it('should return all characters for the authenticated user', async () => {
      const mockCharacters = [
        { id: 1, book_id: 1, user_id: 1, name: 'Character 1', description: 'Description 1' },
        { id: 2, book_id: 2, user_id: 1, name: 'Character 2', description: 'Description 2' }
      ];
      
      prisma.character.findMany.mockResolvedValue(mockCharacters);
      
      const res = await request(app).get('/api/characters');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Characters fetched successfully.');
      expect(res.body.data).toEqual(mockCharacters);
      expect(prisma.character.findMany).toHaveBeenCalledWith({
        where: { user_id: 1 },
        orderBy: { created_at: 'desc' }
      });
    });

    it('should return filtered characters when book_id is provided', async () => {
      const mockBook = { id: 1, user_id: 1, title: 'Test Book' };
      const mockCharacters = [
        { id: 1, book_id: 1, user_id: 1, name: 'Character 1', description: 'Description 1' },
        { id: 2, book_id: 1, user_id: 1, name: 'Character 2', description: 'Description 2' }
      ];
      
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.character.findMany.mockResolvedValue(mockCharacters);
      
      const res = await request(app).get('/api/characters?book_id=1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Characters fetched successfully.');
      expect(res.body.data).toEqual(mockCharacters);
      expect(prisma.book.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(prisma.character.findMany).toHaveBeenCalledWith({
        where: { 
          user_id: 1,
          book_id: 1
        },
        orderBy: { created_at: 'desc' }
      });
    });

    it('should return 404 if book_id is provided but book not found or not owned', async () => {
      prisma.book.findUnique.mockResolvedValue({ id: 1, user_id: 2 });
      
      const res = await request(app).get('/api/characters?book_id=1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Book not found or not owned by user.');
      expect(prisma.character.findMany).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/characters/:id', () => {
    it('should return a character by ID when it belongs to the user', async () => {
      const mockCharacter = { id: 1, user_id: 1, book_id: 1, name: 'Test Character', description: 'Test Description' };
      
      prisma.character.findUnique.mockResolvedValue(mockCharacter);
      
      const res = await request(app).get('/api/characters/1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Character fetched successfully.');
      expect(res.body.data).toEqual(mockCharacter);
      expect(prisma.character.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 400 for invalid character ID', async () => {
      const res = await request(app).get('/api/characters/invalid');
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid character ID.');
    });

    it('should return 404 if character not found', async () => {
      prisma.character.findUnique.mockResolvedValue(null);
      
      const res = await request(app).get('/api/characters/1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Character not found.');
    });

    it('should return 404 if character does not belong to user', async () => {
      const mockCharacter = { id: 1, user_id: 2, name: 'Test Character' };
      
      prisma.character.findUnique.mockResolvedValue(mockCharacter);
      
      const res = await request(app).get('/api/characters/1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Character not found or not owned by user.');
    });
  });

  describe('POST /api/characters', () => {
    it('should create a new character', async () => {
      const characterData = {
        name: 'New Character',
        description: 'Character description',
        book_id: 1
      };
      
      const createdCharacter = {
        id: 1,
        user_id: 1,
        book_id: 1,
        name: 'New Character',
        description: 'Character description',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockBook = { id: 1, user_id: 1 };
      
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.character.create.mockResolvedValue(createdCharacter);
      
      const res = await request(app)
        .post('/api/characters')
        .send(characterData);
      
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Character created successfully.');
      expect(res.body.data).toEqual(createdCharacter);
      expect(prisma.character.create).toHaveBeenCalledWith({
        data: {
          ...characterData,
          user_id: 1
        }
      });
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app)
        .post('/api/characters')
        .send({
          description: 'Character description',
          book_id: 1
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Name is required.');
    });

    it('should return 400 if book_id is missing', async () => {
      const res = await request(app)
        .post('/api/characters')
        .send({
          name: 'New Character',
          description: 'Character description'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('book_id is required and must be an integer.');
    });

    it('should return 404 if book not found or not owned by user', async () => {
      const characterData = {
        name: 'New Character',
        description: 'Character description',
        book_id: 1
      };

      prisma.book.findUnique.mockResolvedValue(null);
      
      const res = await request(app)
        .post('/api/characters')
        .send(characterData);
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Book not found or not owned by user.');
    });
  });

  describe('PUT /api/characters/:id', () => {
    it('should update a character', async () => {
      const mockCharacter = {
        id: 1,
        user_id: 1,
        book_id: 1,
        name: 'Old Name',
        description: 'Old Description'
      };
      
      const updateData = {
        name: 'Updated Name',
        description: 'Updated Description'
      };
      
      const updatedCharacter = {
        ...mockCharacter,
        name: 'Updated Name',
        description: 'Updated Description'
      };
      
      prisma.character.findUnique.mockResolvedValue(mockCharacter);
      prisma.character.update.mockResolvedValue(updatedCharacter);
      
      const res = await request(app)
        .put('/api/characters/1')
        .send(updateData);
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Character updated successfully.');
      expect(res.body.data).toEqual(updatedCharacter);
      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData
      });
    });

    it('should return 404 if character not found or not owned by user', async () => {
      const mockCharacter = { id: 1, user_id: 2, name: 'Test Character' };
      
      prisma.character.findUnique.mockResolvedValue(mockCharacter);
      
      const res = await request(app)
        .put('/api/characters/1')
        .send({ name: 'Updated Name' });
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Character not found or not owned by user.');
    });

    it('should return 400 if name is empty', async () => {
      const mockCharacter = { id: 1, user_id: 1, name: 'Test Character' };
      
      prisma.character.findUnique.mockResolvedValue(mockCharacter);
      
      const res = await request(app)
        .put('/api/characters/1')
        .send({ name: '' });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Name must be a non-empty string.');
    });
  });

  describe('DELETE /api/characters/:id', () => {
    it('should delete a character', async () => {
      const mockCharacter = { id: 1, user_id: 1, name: 'Test Character' };
      
      prisma.character.findUnique.mockResolvedValue(mockCharacter);
      prisma.character.delete.mockResolvedValue(mockCharacter);
      
      const res = await request(app).delete('/api/characters/1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Character deleted successfully.');
      expect(prisma.character.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 404 if character not found or not owned by user', async () => {
      const mockCharacter = { id: 1, user_id: 2, name: 'Test Character' };
      
      prisma.character.findUnique.mockResolvedValue(mockCharacter);
      
      const res = await request(app).delete('/api/characters/1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Character not found or not owned by user.');
    });
  });
});
