const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

// Ensure dotenv is loaded (in case middleware is loaded before app.js)
if (!process.env.JWT_SECRET) {
  require('dotenv').config();
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token for views (reads from cookie or Authorization header)
const authenticateView = async (req, res, next) => {
  try {
    // Try to get token from Authorization header first
    let token = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      token = authHeader.split(' ')[1]; // Bearer TOKEN
    }
    
    // If no token in header, try to get from cookie
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
    }

    req.user = user;
    next();
  } catch (error) {
    // Token invalid or expired - redirect to login
    return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
  }
};

// Middleware to check if user is admin for views
const requireAdminView = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    // User is authenticated but not admin - redirect to jobs page
    return res.redirect('/jobs');
  }
};

module.exports = {
  authenticateView,
  requireAdminView
};
