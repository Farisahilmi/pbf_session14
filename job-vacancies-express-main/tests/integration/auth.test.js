const request = require('supertest');
const app = require('../../app');
const prisma = require('../../prisma/client');
const bcrypt = require('bcryptjs');

describe('Authentication API Integration Tests', () => {
  let testUser;

  beforeAll(async () => {
    // Clean up test data (order matters due to foreign keys)
    await prisma.application.deleteMany({});
    await prisma.jobVacancy.deleteMany({});
    // Delete test users specifically
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test@example.com' },
          { email: 'test2@example.com' }
        ]
      }
    });
  });

  afterAll(async () => {
    // Clean up after tests (order matters due to foreign keys)
    await prisma.application.deleteMany({});
    await prisma.jobVacancy.deleteMany({});
    // Only delete test users, keep seeded users
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test@example.com' },
          { email: 'test2@example.com' }
        ]
      }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.role).toBe('MEMBER');
      expect(response.body.user).not.toHaveProperty('password');

      testUser = response.body.user;
    });

    test('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test2@example.com'
          // Missing name and password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject duplicate email registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'test@example.com', // Same email as before
          password: 'password123'
        })
        .expect(400);

      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
    });

    test('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.error).toContain('Invalid');
    });

    test('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toContain('Invalid');
    });

    test('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // Missing password
        })
        .expect(400);

      expect(response.body.error).toContain('required');
    });
  });
});
