const express = require('express');
const router = express.Router();
const VacancyController = require('../../controllers/VacancyController');
const { authenticateToken, requireMember } = require('../../middleware/auth');

// Public route: Get list of job vacancies (no auth required for public view)
router.get('/public', (req, res) => VacancyController.getPublicListings(req, res));

// Protected route: Get list of job vacancies (auth required for REST API)
router.get('/', authenticateToken, (req, res) => VacancyController.getListings(req, res));

// Protected route: Get job vacancy details (auth required)
router.get('/:id', authenticateToken, (req, res) => VacancyController.getDetails(req, res));

// Protected route: Apply to a job (member only)
router.post('/:id/apply', authenticateToken, requireMember, (req, res) => VacancyController.apply(req, res));

module.exports = router;
