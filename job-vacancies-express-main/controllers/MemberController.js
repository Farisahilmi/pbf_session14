const prisma = require('../prisma/client');

class MemberController {
  /**
   * Get member's applications
   */
  async getApplications(req, res) {
    try {
      const applications = await prisma.application.findMany({
        where: { userId: req.user.id },
        include: {
          jobVacancy: {
            select: {
              id: true,
              title: true,
              company: true,
              location: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        applications
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ error: 'Failed to fetch applications', details: error.message });
    }
  }

  /**
   * Get specific application details
   */
  async getApplicationById(req, res) {
    try {
      const application = await prisma.application.findFirst({
        where: {
          id: parseInt(req.params.id),
          userId: req.user.id // Ensure user can only access their own applications
        },
        include: {
          jobVacancy: true
        }
      });

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      res.json(application);
    } catch (error) {
      console.error('Error fetching application:', error);
      res.status(500).json({ error: 'Failed to fetch application', details: error.message });
    }
  }
}

module.exports = new MemberController();
