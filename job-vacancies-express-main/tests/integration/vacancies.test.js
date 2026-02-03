const request = require('supertest');
const app = require('../../app');
const prisma = require('../../prisma/client');
const { generateToken } = require('../../middleware/auth');
const bcrypt = require('bcryptjs');

describe('Vacancies API Integration Tests', () => {
  let adminToken;
  let memberToken;
  let adminUser;
  let memberUser;
  let testVacancy;

  beforeAll(async () => {
    // Clean up existing test data (order matters due to foreign keys)
    await prisma.application.deleteMany({});
    await prisma.jobVacancy.deleteMany({});
    // Delete test users specifically
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'admin@test.com' },
          { email: 'member@test.com' }
        ]
      }
    });

    // Create test users
    const adminPassword = await bcrypt.hash('admin123', 10);
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN'
      }
    });

    const memberPassword = await bcrypt.hash('member123', 10);
    memberUser = await prisma.user.create({
      data: {
        email: 'member@test.com',
        password: memberPassword,
        name: 'Member User',
        role: 'MEMBER'
      }
    });

    adminToken = generateToken(adminUser.id);
    memberToken = generateToken(memberUser.id);

    // Create test vacancy
    testVacancy = await prisma.jobVacancy.create({
      data: {
        title: 'Test Job',
        company: 'Test Company',
        location: 'Test Location',
        description: 'Test Description',
        requirements: 'Test Requirements',
        salary: '$50,000',
        status: 'ACTIVE',
        createdBy: adminUser.id
      }
    });
  });

  afterAll(async () => {
    // Clean up test data only, keep seeded users
    await prisma.application.deleteMany({});
    await prisma.jobVacancy.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'admin@test.com' },
          { email: 'member@test.com' }
        ]
      }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/vacancies/public', () => {
    test('should get public job listings without authentication', async () => {
      const response = await request(app)
        .get('/api/vacancies/public')
        .expect(200);

      expect(response.body).toHaveProperty('vacancies');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.vacancies)).toBe(true);
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/vacancies/public?page=1&limit=5')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/vacancies', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/vacancies')
        .expect(401);

      expect(response.body.error).toContain('token');
    });

    test('should get job listings with valid token', async () => {
      const response = await request(app)
        .get('/api/vacancies')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('vacancies');
      expect(Array.isArray(response.body.vacancies)).toBe(true);
    });
  });

  describe('GET /api/vacancies/:id', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/vacancies/${testVacancy.id}`)
        .expect(401);

      expect(response.body.error).toContain('token');
    });

    test('should get job details with valid token', async () => {
      const response = await request(app)
        .get(`/api/vacancies/${testVacancy.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.id).toBe(testVacancy.id);
      expect(response.body.title).toBe(testVacancy.title);
      expect(response.body).toHaveProperty('creator');
    });

    test('should return 404 for non-existent job', async () => {
      const response = await request(app)
        .get('/api/vacancies/99999')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('POST /api/vacancies/:id/apply', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/vacancies/${testVacancy.id}/apply`)
        .send({ coverLetter: 'Test cover letter' })
        .expect(401);

      expect(response.body.error).toContain('token');
    });

    test('should require member role', async () => {
      const response = await request(app)
        .post(`/api/vacancies/${testVacancy.id}/apply`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ coverLetter: 'Test cover letter' })
        .expect(403);

      expect(response.body.error).toContain('Member');
    });

    test('should allow member to apply for job', async () => {
      const response = await request(app)
        .post(`/api/vacancies/${testVacancy.id}/apply`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ coverLetter: 'I am interested in this position' })
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('application');
      expect(response.body.application.status).toBe('PENDING');
    });

    test('should prevent duplicate applications', async () => {
      const response = await request(app)
        .post(`/api/vacancies/${testVacancy.id}/apply`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ coverLetter: 'Another application' })
        .expect(400);

      expect(response.body.error).toContain('already applied');
    });
  });
});
