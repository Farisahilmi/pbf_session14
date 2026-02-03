const express = require('express');
const router = express.Router();
const { authenticateView, requireAdminView } = require('../../middleware/viewAuth');

// Apply authentication and admin check to all admin routes
router.use(authenticateView);
router.use(requireAdminView);

// Admin dashboard
router.get('/dashboard', (req, res) => {
  res.render('admin/dashboard', { title: 'Admin Dashboard' });
});

// User management pages
router.get('/users', (req, res) => {
  res.render('admin/users', { title: 'Manage Users' });
});

router.get('/users/new', (req, res) => {
  res.render('admin/user-form', { title: 'Create User', user: null });
});

router.get('/users/:id/edit', (req, res) => {
  res.render('admin/user-form', { title: 'Edit User', userId: req.params.id });
});

// Job vacancy management pages
router.get('/vacancies', (req, res) => {
  res.render('admin/vacancies', { title: 'Manage Job Vacancies' });
});

router.get('/vacancies/new', (req, res) => {
  res.render('admin/vacancy-form', { title: 'Create Job Vacancy', vacancy: null, vacancyId: null });
});

router.get('/vacancies/:id/edit', (req, res) => {
  res.render('admin/vacancy-form', { title: 'Edit Job Vacancy', vacancyId: req.params.id });
});

router.get('/vacancies/:id/applications', (req, res) => {
  res.render('admin/applications', { title: 'Job Applications', vacancyId: req.params.id });
});

module.exports = router;
