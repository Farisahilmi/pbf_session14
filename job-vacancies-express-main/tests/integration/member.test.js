const request = require('supertest');
const app = require('../../app');
const prisma = require('../../prisma/client');
const { generateToken } = require('../../middleware/auth');
const bcrypt = require('bcryptjs');

describe('Member API Integration Tests', () => {
    let memberToken;
    let adminToken;
    let memberUser;
    let adminUser;
    let testVacancy;
    let testApplication;

    beforeAll(async () => {
        // Clean up existing test data (order matters due to foreign keys)
        await prisma.application.deleteMany({});
        await prisma.jobVacancy.deleteMany({});
        // Delete test users specifically
        await prisma.user.deleteMany({
            where: {
                OR: [
                    { email: 'member-test@test.com' },
                    { email: 'admin-test@test.com' }
                ]
            }
        });

        // Create test admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        adminUser = await prisma.user.create({
            data: {
                email: 'admin-test@test.com',
                password: adminPassword,
                name: 'Admin Test User',
                role: 'ADMIN'
            }
        });
        adminToken = generateToken(adminUser.id);

        // Create test member user
        const memberPassword = await bcrypt.hash('member123', 10);
        memberUser = await prisma.user.create({
            data: {
                email: 'member-test@test.com',
                password: memberPassword,
                name: 'Member Test User',
                role: 'MEMBER'
            }
        });
        memberToken = generateToken(memberUser.id);

        // Create test vacancy
        testVacancy = await prisma.jobVacancy.create({
            data: {
                title: 'Member Test Job',
                company: 'Test Company',
                location: 'Remote',
                description: 'Test Description',
                requirements: 'Test Requirements',
                salary: '$50,000 - $70,000',
                status: 'ACTIVE',
                createdBy: adminUser.id
            }
        });

        // Create test application
        testApplication = await prisma.application.create({
            data: {
                userId: memberUser.id,
                jobVacancyId: testVacancy.id,
                coverLetter: 'I am very interested in this position.',
                status: 'PENDING'
            }
        });
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.application.deleteMany({});
        await prisma.jobVacancy.deleteMany({});
        await prisma.user.deleteMany({
            where: {
                OR: [
                    { email: 'member-test@test.com' },
                    { email: 'admin-test@test.com' }
                ]
            }
        });
        await prisma.$disconnect();
    });

    describe('GET /api/member/applications', () => {
        test('should require authentication', async () => {
            const response = await request(app)
                .get('/api/member/applications')
                .expect(401);

            expect(response.body.error).toContain('token');
        });

        test('should require member role', async () => {
            const response = await request(app)
                .get('/api/member/applications')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(403);

            expect(response.body.error).toContain('Member');
        });

        test('should return member applications', async () => {
            const response = await request(app)
                .get('/api/member/applications')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('applications');
            expect(Array.isArray(response.body.applications)).toBe(true);
            expect(response.body.applications.length).toBeGreaterThan(0);

            // Check application structure
            const application = response.body.applications[0];
            expect(application).toHaveProperty('id');
            expect(application).toHaveProperty('status');
            expect(application).toHaveProperty('jobVacancy');
            expect(application.jobVacancy).toHaveProperty('title');
            expect(application.jobVacancy).toHaveProperty('company');
        });

        test('should only return applications owned by the member', async () => {
            const response = await request(app)
                .get('/api/member/applications')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            // All applications should belong to the member
            response.body.applications.forEach(app => {
                expect(app.userId).toBe(memberUser.id);
            });
        });
    });

    describe('GET /api/member/applications/:id', () => {
        test('should require authentication', async () => {
            const response = await request(app)
                .get(`/api/member/applications/${testApplication.id}`)
                .expect(401);

            expect(response.body.error).toContain('token');
        });

        test('should require member role', async () => {
            const response = await request(app)
                .get(`/api/member/applications/${testApplication.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(403);

            expect(response.body.error).toContain('Member');
        });

        test('should return application details', async () => {
            const response = await request(app)
                .get(`/api/member/applications/${testApplication.id}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(response.body.id).toBe(testApplication.id);
            expect(response.body.coverLetter).toBe(testApplication.coverLetter);
            expect(response.body.status).toBe(testApplication.status);
            expect(response.body).toHaveProperty('jobVacancy');
            expect(response.body.jobVacancy.title).toBe(testVacancy.title);
        });

        test('should return 404 for non-existent application', async () => {
            const response = await request(app)
                .get('/api/member/applications/99999')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(404);

            expect(response.body.error).toContain('not found');
        });

        test('should not allow accessing other user applications', async () => {
            // Create another member user
            const otherMemberPassword = await bcrypt.hash('other123', 10);
            const otherMember = await prisma.user.create({
                data: {
                    email: 'other-member@test.com',
                    password: otherMemberPassword,
                    name: 'Other Member',
                    role: 'MEMBER'
                }
            });
            const otherMemberToken = generateToken(otherMember.id);

            // Try to access the test application (which belongs to memberUser)
            const response = await request(app)
                .get(`/api/member/applications/${testApplication.id}`)
                .set('Authorization', `Bearer ${otherMemberToken}`)
                .expect(404);

            expect(response.body.error).toContain('not found');

            // Clean up
            await prisma.user.delete({ where: { id: otherMember.id } });
        });
    });
});
