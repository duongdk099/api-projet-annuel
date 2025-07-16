// Global setup file for tests
// This runs before all tests

// Mock the authentication middleware
jest.mock('../middleware/authMiddleware', () => 
  require('./mocks/authMiddleware')
);

// Mock the Prisma client
jest.mock('../config/db', () => {
  return {
    book: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    chapter: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
});
