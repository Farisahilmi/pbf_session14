const request = require('supertest');
const app = require('../../app');
const prisma = require('../../prisma/client');
const { generateToken } = require('../../middleware/auth');
const bcrypt = require('bcryptjs');

describe('Admin API Integration Tests', () => {
  let adminToken;
  let memberToken;
  let adminUser;
  let memberUser;

  beforeAll(async () => {
    // Clean up existing test data (order matters due to foreign keys)
    await prisma.application.deleteMany({});
    await prisma.jobVacancy.deleteMany({});
    // Delete test users specifically, or all if needed
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'admin@test.com' },
          { email: 'member@test.com' },
          { email: 'newuser@test.com' },
          { email: 'update@test.com' },
          { email: 'delete@test.com' }
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
  });

  afterAll(async () => {
    // Clean up test data only, keep seeded users
    await prisma.application.deleteMany({});
    await prisma.jobVacancy.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'admin@test.com' },
          { email: 'member@test.com' },
          { email: 'newuser@test.com' },
          { email: 'update@test.com' },
          { email: 'delete@test.com' }
        ]
      }
    });
    await prisma.$disconnect();
  });

  describe('User Management', () => {
    test('should require admin role to access user endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.error).toContain('Admin');
    });

    test('should allow admin to list users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    test('should allow admin to create user', async () => {
      const newUser = {
        name: 'New User',
        email: 'newuser@test.com',
        password: 'password123',
        role: 'MEMBER'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect(201);

      expect(response.body.user.email).toBe(newUser.email);
      expect(response.body.user.name).toBe(newUser.name);
      expect(response.body.user.role).toBe('MEMBER');
    });

    test('should allow admin to update user', async () => {
      const newUser = await prisma.user.create({
        data: {
          email: 'update@test.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Original Name',
          role: 'MEMBER'
        }
      });

      const response = await request(app)
        .put(`/api/admin/users/${newUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.user.name).toBe('Updated Name');
    });

    test('should allow admin to delete user', async () => {
      const newUser = await prisma.user.create({
        data: {
          email: 'delete@test.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Delete User',
          role: 'MEMBER'
        }
      });

      await request(app)
        .delete(`/api/admin/users/${newUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify user is deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: newUser.id }
      });
      expect(deletedUser).toBeNull();
    });
  });

  describe('Job Vacancy Management', () => {
    test('should allow admin to create job vacancy', async () => {
      // Refresh adminUser to ensure it exists
      const currentAdmin = await prisma.user.findUnique({
        where: { email: 'admin@test.com' }
      });
      const currentAdminToken = generateToken(currentAdmin.id);

      const vacancy = {
        title: 'Admin Created Job',
        company: 'Admin Company',
        location: 'Admin Location',
        description: 'Admin Description',
        requirements: 'Admin Requirements',
        salary: '$60,000'
      };

      const response = await request(app)
        .post('/api/admin/vacancies')
        .set('Authorization', `Bearer ${currentAdminToken}`)
        .send(vacancy)
        .expect(201);

      expect(response.body.vacancy.title).toBe(vacancy.title);
      expect(response.body.vacancy.company).toBe(vacancy.company);
      expect(response.body.vacancy.status).toBe('ACTIVE');
    });

    test('should allow admin to update job vacancy', async () => {
      // Refresh adminUser to ensure it exists
      const currentAdmin = await prisma.user.findUnique({
        where: { email: 'admin@test.com' }
      });
      
      const vacancy = await prisma.jobVacancy.create({
        data: {
          title: 'Original Title',
          company: 'Test Company',
          location: 'Test Location',
          description: 'Test Description',
          requirements: 'Test Requirements',
          status: 'ACTIVE',
          createdBy: currentAdmin.id
        }
      });

      const response = await request(app)
        .put(`/api/admin/vacancies/${vacancy.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Title', status: 'CLOSED' })
        .expect(200);

      expect(response.body.vacancy.title).toBe('Updated Title');
      expect(response.body.vacancy.status).toBe('CLOSED');
    });

    test('should allow admin to delete job vacancy', async () => {
      // Refresh adminUser to ensure it exists
      const currentAdmin = await prisma.user.findUnique({
        where: { email: 'admin@test.com' }
      });
      
      const vacancy = await prisma.jobVacancy.create({
        data: {
          title: 'Delete Me',
          company: 'Test Company',
          location: 'Test Location',
          description: 'Test Description',
          requirements: 'Test Requirements',
          status: 'ACTIVE',
          createdBy: currentAdmin.id
        }
      });

      await request(app)
        .delete(`/api/admin/vacancies/${vacancy.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify vacancy is deleted
      const deletedVacancy = await prisma.jobVacancy.findUnique({
        where: { id: vacancy.id }
      });
      expect(deletedVacancy).toBeNull();
    });
  });
});
