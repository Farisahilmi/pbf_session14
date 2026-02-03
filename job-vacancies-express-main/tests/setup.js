// Load environment variables for tests
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/database.sqlite';

// Increase timeout for database operations
jest.setTimeout(10000);
