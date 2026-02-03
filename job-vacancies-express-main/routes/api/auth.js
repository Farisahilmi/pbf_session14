const express = require('express');
const router = express.Router();
const AuthController = require('../../controllers/AuthController');

// Register new user
router.post('/register', (req, res) => AuthController.register(req, res));

// Login user
router.post('/login', (req, res) => AuthController.login(req, res));

// Logout
router.post('/logout', (req, res) => AuthController.logout(req, res));

module.exports = router;
