const VacancyController = require('../../controllers/VacancyController');

// Mock prisma client
jest.mock('../../prisma/client', () => ({
    jobVacancy: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn()
    },
    application: {
        findFirst: jest.fn(),
        create: jest.fn()
    }
}));

const prisma = require('../../prisma/client');

describe('VacancyController Unit Tests', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {
            query: {},
            params: {},
            body: {},
            user: { id: 1, role: 'MEMBER' }
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    describe('getPublicListings', () => {
        test('should return vacancies with default pagination', async () => {
            const mockVacancies = [
                { id: 1, title: 'Job 1', company: 'Company 1' },
                { id: 2, title: 'Job 2', company: 'Company 2' }
            ];
            prisma.jobVacancy.findMany.mockResolvedValue(mockVacancies);
            prisma.jobVacancy.count.mockResolvedValue(2);

            await VacancyController.getPublicListings(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                vacancies: mockVacancies,
                pagination: {
                    total: 2,
                    page: 1,
                    limit: 10,
                    totalPages: 1
                }
            });
        });

        test('should filter by status when provided', async () => {
            mockReq.query = { status: 'active' };
            prisma.jobVacancy.findMany.mockResolvedValue([]);
            prisma.jobVacancy.count.mockResolvedValue(0);

            await VacancyController.getPublicListings(mockReq, mockRes);

            expect(prisma.jobVacancy.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: 'ACTIVE' }
                })
            );
        });

        test('should support custom pagination', async () => {
            mockReq.query = { page: '2', limit: '5' };
            prisma.jobVacancy.findMany.mockResolvedValue([]);
            prisma.jobVacancy.count.mockResolvedValue(15);

            await VacancyController.getPublicListings(mockReq, mockRes);

            expect(prisma.jobVacancy.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 5,
                    take: 5
                })
            );
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    pagination: {
                        total: 15,
                        page: 2,
                        limit: 5,
                        totalPages: 3
                    }
                })
            );
        });

        test('should handle database errors', async () => {
            prisma.jobVacancy.findMany.mockRejectedValue(new Error('Database error'));

            await VacancyController.getPublicListings(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Failed to fetch vacancies',
                details: 'Database error'
            });
        });
    });

    describe('getDetails', () => {
        test('should return vacancy details when found', async () => {
            const mockVacancy = {
                id: 1,
                title: 'Test Job',
                company: 'Test Company',
                creator: { id: 1, name: 'Admin', email: 'admin@test.com' }
            };
            mockReq.params = { id: '1' };
            prisma.jobVacancy.findUnique.mockResolvedValue(mockVacancy);

            await VacancyController.getDetails(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(mockVacancy);
        });

        test('should return 404 when vacancy not found', async () => {
            mockReq.params = { id: '999' };
            prisma.jobVacancy.findUnique.mockResolvedValue(null);

            await VacancyController.getDetails(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Job vacancy not found'
            });
        });

        test('should handle invalid ID parameter', async () => {
            mockReq.params = { id: 'invalid' };
            prisma.jobVacancy.findUnique.mockRejectedValue(new Error('Invalid ID'));

            await VacancyController.getDetails(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('apply', () => {
        test('should return 404 if vacancy not found', async () => {
            mockReq.params = { id: '999' };
            mockReq.body = { coverLetter: 'Test cover letter' };
            prisma.jobVacancy.findUnique.mockResolvedValue(null);

            await VacancyController.apply(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Job vacancy not found'
            });
        });

        test('should return 400 if vacancy is CLOSED', async () => {
            mockReq.params = { id: '1' };
            mockReq.body = { coverLetter: 'Test cover letter' };
            prisma.jobVacancy.findUnique.mockResolvedValue({
                id: 1,
                status: 'CLOSED'
            });

            await VacancyController.apply(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'This job vacancy is not accepting applications'
            });
        });

        test('should return 400 if user already applied', async () => {
            mockReq.params = { id: '1' };
            mockReq.body = { coverLetter: 'Test cover letter' };
            prisma.jobVacancy.findUnique.mockResolvedValue({
                id: 1,
                status: 'ACTIVE'
            });
            prisma.application.findFirst.mockResolvedValue({
                id: 1,
                userId: 1,
                jobVacancyId: 1
            });

            await VacancyController.apply(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'You have already applied to this job'
            });
        });

        test('should create application successfully', async () => {
            const mockApplication = {
                id: 1,
                userId: 1,
                jobVacancyId: 1,
                coverLetter: 'Test cover letter',
                status: 'PENDING'
            };
            mockReq.params = { id: '1' };
            mockReq.body = { coverLetter: 'Test cover letter' };
            prisma.jobVacancy.findUnique.mockResolvedValue({
                id: 1,
                status: 'ACTIVE'
            });
            prisma.application.findFirst.mockResolvedValue(null);
            prisma.application.create.mockResolvedValue(mockApplication);

            await VacancyController.apply(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Application submitted successfully',
                application: mockApplication
            });
        });

        test('should allow application without cover letter', async () => {
            mockReq.params = { id: '1' };
            mockReq.body = {};
            prisma.jobVacancy.findUnique.mockResolvedValue({
                id: 1,
                status: 'ACTIVE'
            });
            prisma.application.findFirst.mockResolvedValue(null);
            prisma.application.create.mockResolvedValue({
                id: 1,
                coverLetter: null,
                status: 'PENDING'
            });

            await VacancyController.apply(mockReq, mockRes);

            expect(prisma.application.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    coverLetter: null
                })
            });
        });
    });
});
