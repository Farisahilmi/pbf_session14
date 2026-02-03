const express = require('express');
const router = express.Router();

// Login page
router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login' });
});

// Register page
router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Register' });
});

module.exports = router;
