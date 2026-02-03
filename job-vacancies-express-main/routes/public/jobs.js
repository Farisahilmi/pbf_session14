const express = require('express');
const router = express.Router();

// Public job listings page
router.get('/', async (req, res) => {
  res.render('jobs/list', { title: 'Job Vacancies' });
});

// Public job detail page (will check auth on frontend)
router.get('/:id', async (req, res) => {
  res.render('jobs/detail', { 
    title: 'Job Details',
    jobId: req.params.id 
  });
});

module.exports = router;
