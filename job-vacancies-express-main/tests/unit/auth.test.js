const jwt = require('jsonwebtoken');
const { generateToken } = require('../../middleware/auth');
const bcrypt = require('bcryptjs');

describe('Authentication Utilities', () => {
  const testUserId = 1;
  const testSecret = process.env.JWT_SECRET || 'test-secret-key';

  describe('generateToken', () => {
    test('should generate a valid JWT token', () => {
      const token = generateToken(testUserId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify token can be decoded
      const decoded = jwt.verify(token, testSecret);
      expect(decoded.userId).toBe(testUserId);
    });

    test('should include expiration in token', () => {
      const token = generateToken(testUserId);
      const decoded = jwt.decode(token);
      
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe('Password Hashing', () => {
    test('should hash password correctly', async () => {
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      
      // Verify password can be compared
      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });
  });
});
