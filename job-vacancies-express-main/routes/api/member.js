const express = require('express');
const router = express.Router();
const MemberController = require('../../controllers/MemberController');
const { authenticateToken, requireMember } = require('../../middleware/auth');

// Apply member middleware to all routes
router.use(authenticateToken);
router.use(requireMember);

// Get member's applications
router.get('/applications', (req, res) => MemberController.getApplications(req, res));

// Get specific application details
router.get('/applications/:id', (req, res) => MemberController.getApplicationById(req, res));

module.exports = router;
