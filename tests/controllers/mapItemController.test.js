const request = require('supertest');
const app = require('../../server');
const prisma = require('../../config/db');

// Mock prisma client
jest.mock('../../config/db', () => {
  return {
    mapItem: {
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

describe('MapItem Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/map-items', () => {
    it('should return all map items for the authenticated user', async () => {
      const mockMapItems = [
        { id: 1, book_id: 1, user_id: 1, name: 'Map Item 1', description: 'Description 1', x_position: 10, y_position: 20 },
        { id: 2, book_id: 2, user_id: 1, name: 'Map Item 2', description: 'Description 2', x_position: 30, y_position: 40 }
      ];
      
      prisma.mapItem.findMany.mockResolvedValue(mockMapItems);
      
      const res = await request(app).get('/api/map-items');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Map items fetched successfully.');
      expect(res.body.data).toEqual(mockMapItems);
      expect(prisma.mapItem.findMany).toHaveBeenCalledWith({
        where: { user_id: 1 },
        orderBy: { created_at: 'desc' }
      });
    });

    it('should return filtered map items when book_id is provided', async () => {
      const mockBook = { id: 1, user_id: 1, title: 'Test Book' };
      const mockMapItems = [
        { id: 1, book_id: 1, user_id: 1, name: 'Map Item 1', description: 'Description 1', x_position: 10, y_position: 20 },
        { id: 2, book_id: 1, user_id: 1, name: 'Map Item 2', description: 'Description 2', x_position: 30, y_position: 40 }
      ];
      
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.mapItem.findMany.mockResolvedValue(mockMapItems);
      
      const res = await request(app).get('/api/map-items?book_id=1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Map items fetched successfully.');
      expect(res.body.data).toEqual(mockMapItems);
      expect(prisma.book.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(prisma.mapItem.findMany).toHaveBeenCalledWith({
        where: { 
          user_id: 1,
          book_id: 1
        },
        orderBy: { created_at: 'desc' }
      });
    });

    it('should return 404 if book_id is provided but book not found or not owned', async () => {
      prisma.book.findUnique.mockResolvedValue({ id: 1, user_id: 2 });
      
      const res = await request(app).get('/api/map-items?book_id=1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Book not found or not owned by user.');
      expect(prisma.mapItem.findMany).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/map-items/:id', () => {
    it('should return a map item by ID when it belongs to the user', async () => {
      const mockMapItem = { 
        id: 1, 
        user_id: 1, 
        book_id: 1, 
        name: 'Test Map Item', 
        description: 'Test Description',
        x_position: 10,
        y_position: 20
      };
      
      prisma.mapItem.findUnique.mockResolvedValue(mockMapItem);
      
      const res = await request(app).get('/api/map-items/1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Map item fetched successfully.');
      expect(res.body.data).toEqual(mockMapItem);
      expect(prisma.mapItem.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 400 for invalid map item ID', async () => {
      const res = await request(app).get('/api/map-items/invalid');
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid map item ID.');
    });

    it('should return 404 if map item not found', async () => {
      prisma.mapItem.findUnique.mockResolvedValue(null);
      
      const res = await request(app).get('/api/map-items/1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Map item not found.');
    });

    it('should return 404 if map item does not belong to user', async () => {
      const mockMapItem = { id: 1, user_id: 2, name: 'Test Map Item' };
      
      prisma.mapItem.findUnique.mockResolvedValue(mockMapItem);
      
      const res = await request(app).get('/api/map-items/1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Map item not found or not owned by user.');
    });
  });

  describe('POST /api/map-items', () => {
    it('should create a new map item', async () => {
      const mapItemData = {
        name: 'New Map Item',
        description: 'Map item description',
        book_id: 1,
        x_position: 15,
        y_position: 25
      };
      
      const createdMapItem = {
        id: 1,
        user_id: 1,
        book_id: 1,
        name: 'New Map Item',
        description: 'Map item description',
        x_position: 15,
        y_position: 25,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockBook = { id: 1, user_id: 1 };
      
      prisma.book.findUnique.mockResolvedValue(mockBook);
      prisma.mapItem.create.mockResolvedValue(createdMapItem);
      
      const res = await request(app)
        .post('/api/map-items')
        .send(mapItemData);
      
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Map item created successfully.');
      expect(res.body.data).toEqual(createdMapItem);
      expect(prisma.mapItem.create).toHaveBeenCalledWith({
        data: {
          ...mapItemData,
          user_id: 1
        }
      });
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app)
        .post('/api/map-items')
        .send({
          description: 'Map item description',
          book_id: 1,
          x_position: 15,
          y_position: 25
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Name is required.');
    });

    it('should return 400 if book_id is missing', async () => {
      const res = await request(app)
        .post('/api/map-items')
        .send({
          name: 'New Map Item',
          description: 'Map item description',
          x_position: 15,
          y_position: 25
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('book_id is required and must be an integer.');
    });

    it('should return 400 if x_position is missing', async () => {
      const res = await request(app)
        .post('/api/map-items')
        .send({
          name: 'New Map Item',
          description: 'Map item description',
          book_id: 1,
          y_position: 25
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('x_position is required and must be a number.');
    });

    it('should return 400 if y_position is missing', async () => {
      const res = await request(app)
        .post('/api/map-items')
        .send({
          name: 'New Map Item',
          description: 'Map item description',
          book_id: 1,
          x_position: 15
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('y_position is required and must be a number.');
    });

    it('should return 404 if book not found or not owned by user', async () => {
      const mapItemData = {
        name: 'New Map Item',
        description: 'Map item description',
        book_id: 1,
        x_position: 15,
        y_position: 25
      };

      prisma.book.findUnique.mockResolvedValue(null);
      
      const res = await request(app)
        .post('/api/map-items')
        .send(mapItemData);
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Book not found or not owned by user.');
    });
  });

  describe('PUT /api/map-items/:id', () => {
    it('should update a map item', async () => {
      const mockMapItem = {
        id: 1,
        user_id: 1,
        book_id: 1,
        name: 'Old Name',
        description: 'Old Description',
        x_position: 10,
        y_position: 20
      };
      
      const updateData = {
        name: 'Updated Name',
        description: 'Updated Description',
        x_position: 15,
        y_position: 25
      };
      
      const updatedMapItem = {
        ...mockMapItem,
        name: 'Updated Name',
        description: 'Updated Description',
        x_position: 15,
        y_position: 25
      };
      
      prisma.mapItem.findUnique.mockResolvedValue(mockMapItem);
      prisma.mapItem.update.mockResolvedValue(updatedMapItem);
      
      const res = await request(app)
        .put('/api/map-items/1')
        .send(updateData);
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Map item updated successfully.');
      expect(res.body.data).toEqual(updatedMapItem);
      expect(prisma.mapItem.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData
      });
    });

    it('should return 404 if map item not found or not owned by user', async () => {
      const mockMapItem = { id: 1, user_id: 2, name: 'Test Map Item' };
      
      prisma.mapItem.findUnique.mockResolvedValue(mockMapItem);
      
      const res = await request(app)
        .put('/api/map-items/1')
        .send({ name: 'Updated Name' });
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Map item not found or not owned by user.');
    });

    it('should return 400 if name is empty', async () => {
      const mockMapItem = { id: 1, user_id: 1, name: 'Test Map Item' };
      
      prisma.mapItem.findUnique.mockResolvedValue(mockMapItem);
      
      const res = await request(app)
        .put('/api/map-items/1')
        .send({ name: '' });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Name must be a non-empty string.');
    });
  });

  describe('DELETE /api/map-items/:id', () => {
    it('should delete a map item', async () => {
      const mockMapItem = { id: 1, user_id: 1, name: 'Test Map Item' };
      
      prisma.mapItem.findUnique.mockResolvedValue(mockMapItem);
      prisma.mapItem.delete.mockResolvedValue(mockMapItem);
      
      const res = await request(app).delete('/api/map-items/1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Map item deleted successfully.');
      expect(prisma.mapItem.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 404 if map item not found or not owned by user', async () => {
      const mockMapItem = { id: 1, user_id: 2, name: 'Test Map Item' };
      
      prisma.mapItem.findUnique.mockResolvedValue(mockMapItem);
      
      const res = await request(app).delete('/api/map-items/1');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Map item not found or not owned by user.');
    });
  });
});
