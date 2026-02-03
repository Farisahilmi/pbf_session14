const MemberController = require('../../controllers/MemberController');

// Mock prisma client
jest.mock('../../prisma/client', () => ({
    application: {
        findMany: jest.fn(),
        findFirst: jest.fn()
    }
}));

const prisma = require('../../prisma/client');

describe('MemberController Unit Tests', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {
            params: {},
            user: { id: 1, role: 'MEMBER', name: 'Test Member' }
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    describe('getApplications', () => {
        test('should return user applications', async () => {
            const mockApplications = [
                {
                    id: 1,
                    userId: 1,
                    jobVacancyId: 1,
                    status: 'PENDING',
                    jobVacancy: {
                        id: 1,
                        title: 'Software Engineer',
                        company: 'Tech Corp',
                        location: 'Remote'
                    }
                },
                {
                    id: 2,
                    userId: 1,
                    jobVacancyId: 2,
                    status: 'REVIEWED',
                    jobVacancy: {
                        id: 2,
                        title: 'Frontend Developer',
                        company: 'Web Inc',
                        location: 'NYC'
                    }
                }
            ];
            prisma.application.findMany.mockResolvedValue(mockApplications);

            await MemberController.getApplications(mockReq, mockRes);

            expect(prisma.application.findMany).toHaveBeenCalledWith({
                where: { userId: 1 },
                include: {
                    jobVacancy: {
                        select: {
                            id: true,
                            title: true,
                            company: true,
                            location: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            expect(mockRes.json).toHaveBeenCalledWith({
                applications: mockApplications
            });
        });

        test('should return empty array if no applications', async () => {
            prisma.application.findMany.mockResolvedValue([]);

            await MemberController.getApplications(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                applications: []
            });
        });

        test('should handle database errors', async () => {
            prisma.application.findMany.mockRejectedValue(new Error('Database connection failed'));

            await MemberController.getApplications(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Failed to fetch applications',
                details: 'Database connection failed'
            });
        });
    });

    describe('getApplicationById', () => {
        test('should return application details when found and owned by user', async () => {
            const mockApplication = {
                id: 1,
                userId: 1,
                jobVacancyId: 1,
                coverLetter: 'I am excited to apply...',
                status: 'PENDING',
                jobVacancy: {
                    id: 1,
                    title: 'Software Engineer',
                    company: 'Tech Corp',
                    location: 'Remote',
                    description: 'Great job',
                    requirements: '3+ years experience'
                }
            };
            mockReq.params = { id: '1' };
            prisma.application.findFirst.mockResolvedValue(mockApplication);

            await MemberController.getApplicationById(mockReq, mockRes);

            expect(prisma.application.findFirst).toHaveBeenCalledWith({
                where: {
                    id: 1,
                    userId: 1
                },
                include: {
                    jobVacancy: true
                }
            });
            expect(mockRes.json).toHaveBeenCalledWith(mockApplication);
        });

        test('should return 404 if application not found', async () => {
            mockReq.params = { id: '999' };
            prisma.application.findFirst.mockResolvedValue(null);

            await MemberController.getApplicationById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Application not found'
            });
        });

        test('should return 404 if application belongs to another user', async () => {
            // This test simulates the case where the application exists
            // but doesn't belong to the current user (findFirst returns null)
            mockReq.params = { id: '2' };
            mockReq.user = { id: 1 }; // Current user is id: 1
            prisma.application.findFirst.mockResolvedValue(null); // Returns null because userId doesn't match

            await MemberController.getApplicationById(mockReq, mockRes);

            expect(prisma.application.findFirst).toHaveBeenCalledWith({
                where: {
                    id: 2,
                    userId: 1 // Ensures only own applications
                },
                include: {
                    jobVacancy: true
                }
            });
            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        test('should handle invalid ID parameter', async () => {
            mockReq.params = { id: 'invalid' };
            prisma.application.findFirst.mockRejectedValue(new Error('Invalid input'));

            await MemberController.getApplicationById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Failed to fetch application',
                details: 'Invalid input'
            });
        });

        test('should handle database errors', async () => {
            mockReq.params = { id: '1' };
            prisma.application.findFirst.mockRejectedValue(new Error('Database error'));

            await MemberController.getApplicationById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Failed to fetch application',
                details: 'Database error'
            });
        });
    });
});
