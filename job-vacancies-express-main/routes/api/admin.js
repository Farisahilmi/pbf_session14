const express = require('express');
const router = express.Router();
const AdminController = require('../../controllers/AdminController');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');

// Apply admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// ========== USER MANAGEMENT ==========

// Get all users
router.get('/users', (req, res) => AdminController.getUsers(req, res));

// Create new user
router.post('/users', (req, res) => AdminController.createUser(req, res));

// Get user by ID
router.get('/users/:id', (req, res) => AdminController.getUserById(req, res));

// Update user
router.put('/users/:id', (req, res) => AdminController.updateUser(req, res));

// Delete user
router.delete('/users/:id', (req, res) => AdminController.deleteUser(req, res));

// ========== JOB VACANCY MANAGEMENT ==========

// Get all job vacancies
router.get('/vacancies', (req, res) => AdminController.getVacancies(req, res));

// Get single job vacancy
router.get('/vacancies/:id', (req, res) => AdminController.getVacancyById(req, res));

// Create new job vacancy
router.post('/vacancies', (req, res) => AdminController.createVacancy(req, res));

// Update job vacancy
router.put('/vacancies/:id', (req, res) => AdminController.updateVacancy(req, res));

// Delete job vacancy
router.delete('/vacancies/:id', (req, res) => AdminController.deleteVacancy(req, res));

// Get all applications for a vacancy
router.get('/vacancies/:id/applications', (req, res) => AdminController.getVacancyApplications(req, res));

// ========== APPLICATION MANAGEMENT ==========

// Get all applications
router.get('/applications', (req, res) => AdminController.getApplications(req, res));

// Get single application
router.get('/applications/:id', (req, res) => AdminController.getApplicationById(req, res));

// Update application status
router.put('/applications/:id', (req, res) => AdminController.updateApplication(req, res));

module.exports = router;
