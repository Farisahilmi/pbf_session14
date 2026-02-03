const bcrypt = require('bcryptjs');
const AuthController = require('../../controllers/AuthController');

// Mock prisma client
jest.mock('../../prisma/client', () => ({
    user: {
        findUnique: jest.fn(),
        create: jest.fn()
    }
}));

// Mock generateToken
jest.mock('../../middleware/auth', () => ({
    generateToken: jest.fn().mockReturnValue('mock-jwt-token')
}));

const prisma = require('../../prisma/client');
const { generateToken } = require('../../middleware/auth');

describe('AuthController Unit Tests', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {
            body: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    describe('register', () => {
        test('should return 400 if email is missing', async () => {
            mockReq.body = { password: 'pass123', name: 'Test' };

            await AuthController.register(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Email, password, and name are required'
            });
        });

        test('should return 400 if password is missing', async () => {
            mockReq.body = { email: 'test@test.com', name: 'Test' };

            await AuthController.register(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should return 400 if name is missing', async () => {
            mockReq.body = { email: 'test@test.com', password: 'pass123' };

            await AuthController.register(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should return 400 if email already exists', async () => {
            mockReq.body = {
                email: 'existing@test.com',
                password: 'pass123',
                name: 'Test'
            };
            prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'existing@test.com' });

            await AuthController.register(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'User with this email already exists'
            });
        });

        test('should register user successfully with default MEMBER role', async () => {
            const mockUser = {
                id: 1,
                email: 'new@test.com',
                name: 'New User',
                role: 'MEMBER'
            };
            mockReq.body = {
                email: 'new@test.com',
                password: 'pass123',
                name: 'New User'
            };
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue(mockUser);

            await AuthController.register(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'User registered successfully',
                token: 'mock-jwt-token',
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    name: mockUser.name,
                    role: mockUser.role
                }
            });
            expect(mockRes.cookie).toHaveBeenCalled();
        });

        test('should set role to ADMIN if role is admin', async () => {
            mockReq.body = {
                email: 'admin@test.com',
                password: 'pass123',
                name: 'Admin User',
                role: 'admin'
            };
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue({
                id: 1,
                email: 'admin@test.com',
                name: 'Admin User',
                role: 'ADMIN'
            });

            await AuthController.register(mockReq, mockRes);

            expect(prisma.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    role: 'ADMIN'
                })
            });
        });
    });

    describe('login', () => {
        test('should return 400 if email is missing', async () => {
            mockReq.body = { password: 'pass123' };

            await AuthController.login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Email and password are required'
            });
        });

        test('should return 400 if password is missing', async () => {
            mockReq.body = { email: 'test@test.com' };

            await AuthController.login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        test('should return 401 if user not found', async () => {
            mockReq.body = { email: 'notfound@test.com', password: 'pass123' };
            prisma.user.findUnique.mockResolvedValue(null);

            await AuthController.login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid email or password'
            });
        });

        test('should return 401 if password is incorrect', async () => {
            const hashedPassword = await bcrypt.hash('correctpassword', 10);
            mockReq.body = { email: 'test@test.com', password: 'wrongpassword' };
            prisma.user.findUnique.mockResolvedValue({
                id: 1,
                email: 'test@test.com',
                password: hashedPassword
            });

            await AuthController.login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid email or password'
            });
        });

        test('should login successfully with correct credentials', async () => {
            const hashedPassword = await bcrypt.hash('correctpassword', 10);
            const mockUser = {
                id: 1,
                email: 'test@test.com',
                password: hashedPassword,
                name: 'Test User',
                role: 'MEMBER'
            };
            mockReq.body = { email: 'test@test.com', password: 'correctpassword' };
            prisma.user.findUnique.mockResolvedValue(mockUser);

            await AuthController.login(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Login successful',
                token: 'mock-jwt-token',
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    name: mockUser.name,
                    role: mockUser.role
                }
            });
            expect(mockRes.cookie).toHaveBeenCalled();
        });
    });

    describe('logout', () => {
        test('should clear cookie and return success message', () => {
            AuthController.logout(mockReq, mockRes);

            expect(mockRes.clearCookie).toHaveBeenCalledWith('token');
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Logged out successfully'
            });
        });
    });
});
