const jwt = require('jsonwebtoken');
const { authenticateToken, requireAdmin, requireMember, generateToken } = require('../../middleware/auth');

// Mock prisma client
jest.mock('../../prisma/client', () => ({
  user: {
    findUnique: jest.fn()
  }
}));

const prisma = require('../../prisma/client');

describe('Auth Middleware Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
      user: null
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    test('should return 401 if no token provided', async () => {
      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 for invalid token format', async () => {
      mockReq.headers['authorization'] = 'InvalidToken';

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
    });

    test('should return 401 for malformed JWT token', async () => {
      mockReq.headers['authorization'] = 'Bearer malformed.token.here';

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    test('should return 401 if user not found in database', async () => {
      const validToken = generateToken(999);
      mockReq.headers['authorization'] = `Bearer ${validToken}`;
      prisma.user.findUnique.mockResolvedValue(null);

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    test('should call next() and set req.user for valid token', async () => {
      const mockUser = { id: 1, email: 'test@test.com', role: 'MEMBER' };
      const validToken = generateToken(mockUser.id);
      mockReq.headers['authorization'] = `Bearer ${validToken}`;
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should return 401 for expired token', async () => {
      // Create an expired token manually
      const expiredToken = jwt.sign(
        { userId: 1 },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '-1h' }
      );
      mockReq.headers['authorization'] = `Bearer ${expiredToken}`;

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Token expired' });
    });
  });

  describe('requireAdmin', () => {
    test('should call next() if user is admin', () => {
      mockReq.user = { id: 1, role: 'ADMIN' };

      requireAdmin(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should return 403 if user is not admin', () => {
      mockReq.user = { id: 1, role: 'MEMBER' };

      requireAdmin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Admin access required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 403 if no user attached', () => {
      mockReq.user = null;

      requireAdmin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireMember', () => {
    test('should call next() if user is member', () => {
      mockReq.user = { id: 1, role: 'MEMBER' };

      requireMember(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should return 403 if user is admin (not member)', () => {
      mockReq.user = { id: 1, role: 'ADMIN' };

      requireMember(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Member access required' });
    });

    test('should return 403 if no user attached', () => {
      mockReq.user = null;

      requireMember(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('generateToken', () => {
    test('should generate valid JWT token with userId', () => {
      const userId = 123;
      const token = generateToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key');
      expect(decoded.userId).toBe(userId);
    });

    test('should include expiration claim in token', () => {
      const token = generateToken(1);
      const decoded = jwt.decode(token);

      expect(decoded).toHaveProperty('exp');
      expect(decoded).toHaveProperty('iat');
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    test('should generate different tokens for different users', () => {
      const token1 = generateToken(1);
      const token2 = generateToken(2);

      expect(token1).not.toBe(token2);
    });
  });
});
