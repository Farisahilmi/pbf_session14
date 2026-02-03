const prisma = require('../prisma/client');

class VacancyController {
  /**
   * Get public job listings (no auth required)
   */
  async getPublicListings(req, res) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {};
      if (status) {
        where.status = status.toUpperCase();
      } else {
        where.status = 'ACTIVE'; // Default to active vacancies
      }

      const [vacancies, total] = await Promise.all([
        prisma.jobVacancy.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            salary: true,
            status: true,
            createdAt: true
          }
        }),
        prisma.jobVacancy.count({ where })
      ]);

      res.json({
        vacancies,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching vacancies:', error);
      res.status(500).json({ error: 'Failed to fetch vacancies', details: error.message });
    }
  }

  /**
   * Get authenticated job listings
   */
  async getListings(req, res) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {};
      if (status) {
        where.status = status.toUpperCase();
      } else {
        where.status = 'ACTIVE'; // Default to active vacancies
      }

      const [vacancies, total] = await Promise.all([
        prisma.jobVacancy.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            salary: true,
            status: true,
            createdAt: true
          }
        }),
        prisma.jobVacancy.count({ where })
      ]);

      res.json({
        vacancies,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching vacancies:', error);
      res.status(500).json({ error: 'Failed to fetch vacancies', details: error.message });
    }
  }

  /**
   * Get job vacancy details
   */
  async getDetails(req, res) {
    try {
      const vacancy = await prisma.jobVacancy.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!vacancy) {
        return res.status(404).json({ error: 'Job vacancy not found' });
      }

      res.json(vacancy);
    } catch (error) {
      console.error('Error fetching vacancy details:', error);
      res.status(500).json({ error: 'Failed to fetch vacancy details', details: error.message });
    }
  }

  /**
   * Apply to a job (member only)
   */
  async apply(req, res) {
    try {
      const { coverLetter } = req.body;
      const jobVacancyId = parseInt(req.params.id);
      const userId = req.user.id;

      // Check if vacancy exists
      const vacancy = await prisma.jobVacancy.findUnique({
        where: { id: jobVacancyId }
      });

      if (!vacancy) {
        return res.status(404).json({ error: 'Job vacancy not found' });
      }

      if (vacancy.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'This job vacancy is not accepting applications' });
      }

      // Check if user already applied
      const existingApplication = await prisma.application.findFirst({
        where: {
          userId,
          jobVacancyId
        }
      });

      if (existingApplication) {
        return res.status(400).json({ error: 'You have already applied to this job' });
      }

      // Create application
      const application = await prisma.application.create({
        data: {
          userId,
          jobVacancyId,
          coverLetter: coverLetter || null,
          status: 'PENDING'
        }
      });

      res.status(201).json({
        message: 'Application submitted successfully',
        application
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      res.status(500).json({ error: 'Failed to submit application', details: error.message });
    }
  }
}

module.exports = new VacancyController();
