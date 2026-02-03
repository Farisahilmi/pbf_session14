const bcrypt = require('bcryptjs');
const AdminController = require('../../controllers/AdminController');

// Mock prisma client
jest.mock('../../prisma/client', () => ({
    user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
    },
    jobVacancy: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
    },
    application: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn()
    }
}));

const prisma = require('../../prisma/client');

describe('AdminController Unit Tests', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {
            query: {},
            params: {},
            body: {},
            user: { id: 1, role: 'ADMIN' }
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    // ========== USER MANAGEMENT TESTS ==========
    describe('User Management', () => {
        describe('getUsers', () => {
            test('should return users with pagination', async () => {
                const mockUsers = [
                    { id: 1, email: 'user1@test.com', name: 'User 1', role: 'MEMBER' },
                    { id: 2, email: 'user2@test.com', name: 'User 2', role: 'ADMIN' }
                ];
                prisma.user.findMany.mockResolvedValue(mockUsers);
                prisma.user.count.mockResolvedValue(2);

                await AdminController.getUsers(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    users: mockUsers,
                    pagination: {
                        total: 2,
                        page: 1,
                        limit: 10,
                        totalPages: 1
                    }
                });
            });

            test('should filter users by role', async () => {
                mockReq.query = { role: 'admin' };
                prisma.user.findMany.mockResolvedValue([]);
                prisma.user.count.mockResolvedValue(0);

                await AdminController.getUsers(mockReq, mockRes);

                expect(prisma.user.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: { role: 'ADMIN' }
                    })
                );
            });
        });

        describe('getUserById', () => {
            test('should return user when found', async () => {
                const mockUser = { id: 1, email: 'user@test.com', name: 'Test User' };
                mockReq.params = { id: '1' };
                prisma.user.findUnique.mockResolvedValue(mockUser);

                await AdminController.getUserById(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith(mockUser);
            });

            test('should return 404 when user not found', async () => {
                mockReq.params = { id: '999' };
                prisma.user.findUnique.mockResolvedValue(null);

                await AdminController.getUserById(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(404);
                expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
            });
        });

        describe('createUser', () => {
            test('should return 400 if required fields missing', async () => {
                mockReq.body = { email: 'test@test.com' };

                await AdminController.createUser(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Name, email, and password are required'
                });
            });

            test('should return 400 if email already exists', async () => {
                mockReq.body = {
                    name: 'Test',
                    email: 'existing@test.com',
                    password: 'pass123'
                };
                prisma.user.findUnique.mockResolvedValue({ id: 1 });

                await AdminController.createUser(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'User with this email already exists'
                });
            });

            test('should create user successfully', async () => {
                const mockUser = {
                    id: 1,
                    email: 'new@test.com',
                    name: 'New User',
                    role: 'MEMBER',
                    createdAt: new Date()
                };
                mockReq.body = {
                    name: 'New User',
                    email: 'new@test.com',
                    password: 'pass123',
                    role: 'MEMBER'
                };
                prisma.user.findUnique.mockResolvedValue(null);
                prisma.user.create.mockResolvedValue(mockUser);

                await AdminController.createUser(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(201);
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'User created successfully',
                    user: mockUser
                });
            });
        });

        describe('updateUser', () => {
            test('should return 404 if user not found', async () => {
                mockReq.params = { id: '999' };
                mockReq.body = { name: 'Updated' };
                prisma.user.findUnique.mockResolvedValue(null);

                await AdminController.updateUser(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(404);
            });

            test('should prevent admin from changing own role', async () => {
                mockReq.params = { id: '1' };
                mockReq.body = { role: 'MEMBER' };
                mockReq.user = { id: 1, role: 'ADMIN' };
                prisma.user.findUnique.mockResolvedValue({ id: 1, role: 'ADMIN' });

                await AdminController.updateUser(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Cannot change your own role'
                });
            });

            test('should update user successfully', async () => {
                mockReq.params = { id: '2' };
                mockReq.body = { name: 'Updated Name' };
                prisma.user.findUnique.mockResolvedValue({ id: 2, name: 'Old Name' });
                prisma.user.update.mockResolvedValue({
                    id: 2,
                    name: 'Updated Name',
                    email: 'test@test.com',
                    role: 'MEMBER'
                });

                await AdminController.updateUser(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'User updated successfully',
                    user: expect.objectContaining({ name: 'Updated Name' })
                });
            });
        });

        describe('deleteUser', () => {
            test('should return 404 if user not found', async () => {
                mockReq.params = { id: '999' };
                prisma.user.findUnique.mockResolvedValue(null);

                await AdminController.deleteUser(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(404);
            });

            test('should prevent admin from deleting themselves', async () => {
                mockReq.params = { id: '1' };
                mockReq.user = { id: 1 };
                prisma.user.findUnique.mockResolvedValue({ id: 1 });

                await AdminController.deleteUser(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Cannot delete your own account'
                });
            });

            test('should delete user successfully', async () => {
                mockReq.params = { id: '2' };
                mockReq.user = { id: 1 };
                prisma.user.findUnique.mockResolvedValue({ id: 2 });
                prisma.user.delete.mockResolvedValue({ id: 2 });

                await AdminController.deleteUser(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'User deleted successfully'
                });
            });
        });
    });

    // ========== VACANCY MANAGEMENT TESTS ==========
    describe('Vacancy Management', () => {
        describe('getVacancies', () => {
            test('should return vacancies with pagination', async () => {
                const mockVacancies = [
                    { id: 1, title: 'Job 1' },
                    { id: 2, title: 'Job 2' }
                ];
                prisma.jobVacancy.findMany.mockResolvedValue(mockVacancies);
                prisma.jobVacancy.count.mockResolvedValue(2);

                await AdminController.getVacancies(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    vacancies: mockVacancies,
                    pagination: expect.objectContaining({
                        total: 2
                    })
                });
            });

            test('should filter by status', async () => {
                mockReq.query = { status: 'closed' };
                prisma.jobVacancy.findMany.mockResolvedValue([]);
                prisma.jobVacancy.count.mockResolvedValue(0);

                await AdminController.getVacancies(mockReq, mockRes);

                expect(prisma.jobVacancy.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: { status: 'CLOSED' }
                    })
                );
            });
        });

        describe('createVacancy', () => {
            test('should return 400 if required fields missing', async () => {
                mockReq.body = { title: 'Test Job' };

                await AdminController.createVacancy(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
            });

            test('should create vacancy successfully', async () => {
                const mockVacancy = {
                    id: 1,
                    title: 'New Job',
                    company: 'Company',
                    location: 'Remote',
                    description: 'Desc',
                    requirements: 'Reqs',
                    status: 'ACTIVE',
                    createdBy: 1
                };
                mockReq.body = {
                    title: 'New Job',
                    company: 'Company',
                    location: 'Remote',
                    description: 'Desc',
                    requirements: 'Reqs'
                };
                prisma.jobVacancy.create.mockResolvedValue(mockVacancy);

                await AdminController.createVacancy(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(201);
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Job vacancy created successfully',
                    vacancy: mockVacancy
                });
            });
        });

        describe('updateVacancy', () => {
            test('should return 404 if vacancy not found', async () => {
                mockReq.params = { id: '999' };
                mockReq.body = { title: 'Updated' };
                prisma.jobVacancy.findUnique.mockResolvedValue(null);

                await AdminController.updateVacancy(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(404);
            });

            test('should update vacancy successfully', async () => {
                mockReq.params = { id: '1' };
                mockReq.body = { title: 'Updated Title', status: 'CLOSED' };
                prisma.jobVacancy.findUnique.mockResolvedValue({ id: 1 });
                prisma.jobVacancy.update.mockResolvedValue({
                    id: 1,
                    title: 'Updated Title',
                    status: 'CLOSED'
                });

                await AdminController.updateVacancy(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Job vacancy updated successfully',
                    vacancy: expect.objectContaining({
                        title: 'Updated Title',
                        status: 'CLOSED'
                    })
                });
            });
        });

        describe('deleteVacancy', () => {
            test('should return 404 if vacancy not found', async () => {
                mockReq.params = { id: '999' };
                prisma.jobVacancy.findUnique.mockResolvedValue(null);

                await AdminController.deleteVacancy(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(404);
            });

            test('should delete vacancy successfully', async () => {
                mockReq.params = { id: '1' };
                prisma.jobVacancy.findUnique.mockResolvedValue({ id: 1 });
                prisma.jobVacancy.delete.mockResolvedValue({ id: 1 });

                await AdminController.deleteVacancy(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Job vacancy deleted successfully'
                });
            });
        });
    });

    // ========== APPLICATION MANAGEMENT TESTS ==========
    describe('Application Management', () => {
        describe('getApplications', () => {
            test('should return applications with pagination', async () => {
                const mockApplications = [
                    { id: 1, status: 'PENDING', user: { name: 'User 1' } }
                ];
                prisma.application.findMany.mockResolvedValue(mockApplications);
                prisma.application.count.mockResolvedValue(1);

                await AdminController.getApplications(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    applications: mockApplications,
                    pagination: expect.objectContaining({ total: 1 })
                });
            });

            test('should filter by status', async () => {
                mockReq.query = { status: 'pending' };
                prisma.application.findMany.mockResolvedValue([]);
                prisma.application.count.mockResolvedValue(0);

                await AdminController.getApplications(mockReq, mockRes);

                expect(prisma.application.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: { status: 'PENDING' }
                    })
                );
            });
        });

        describe('updateApplication', () => {
            test('should return 404 if application not found', async () => {
                mockReq.params = { id: '999' };
                mockReq.body = { status: 'ACCEPTED' };
                prisma.application.findUnique.mockResolvedValue(null);

                await AdminController.updateApplication(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(404);
            });

            test('should return 400 for invalid status', async () => {
                mockReq.params = { id: '1' };
                mockReq.body = { status: 'INVALID_STATUS' };
                prisma.application.findUnique.mockResolvedValue({ id: 1 });

                await AdminController.updateApplication(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Valid status is required'
                });
            });

            test('should update application status successfully', async () => {
                mockReq.params = { id: '1' };
                mockReq.body = { status: 'ACCEPTED' };
                prisma.application.findUnique.mockResolvedValue({ id: 1 });
                prisma.application.update.mockResolvedValue({
                    id: 1,
                    status: 'ACCEPTED'
                });

                await AdminController.updateApplication(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Application status updated successfully',
                    application: expect.objectContaining({ status: 'ACCEPTED' })
                });
            });
        });
    });
});
