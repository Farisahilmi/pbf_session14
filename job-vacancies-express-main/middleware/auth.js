const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

// Ensure dotenv is loaded (in case middleware is loaded before app.js)
if (!process.env.JWT_SECRET) {
  require('dotenv').config();
}

// Helper function to get JWT secret dynamically (to handle test environment changes)
const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'your-secret-key-change-in-production';
};

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({ error: 'Admin access required' });
  }
};

// Middleware to check if user is member
const requireMember = (req, res, next) => {
  if (req.user && req.user.role === 'MEMBER') {
    next();
  } else {
    return res.status(403).json({ error: 'Member access required' });
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireMember,
  generateToken
};