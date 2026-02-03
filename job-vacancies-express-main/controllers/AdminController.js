const bcrypt = require('bcryptjs');
const prisma = require('../prisma/client');

class AdminController {
  // ========== USER MANAGEMENT ==========

  /**
   * Get all users
   */
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 10, role } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {};
      if (role) {
        where.role = role.toUpperCase();
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            applications: {
              select: {
                id: true,
                status: true,
                createdAt: true
              }
            }
          }
        }),
        prisma.user.count({ where })
      ]);

      res.json({
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users', details: error.message });
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(req.params.id) },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          applications: {
            include: {
              jobVacancy: {
                select: {
                  id: true,
                  title: true,
                  company: true
                }
              }
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user', details: error.message });
    }
  }

  /**
   * Create new user
   */
  async createUser(req, res) {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role && ['ADMIN', 'MEMBER'].includes(role.toUpperCase()) 
            ? role.toUpperCase() 
            : 'MEMBER'
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        }
      });

      res.status(201).json({
        message: 'User created successfully',
        user
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user', details: error.message });
    }
  }

  /**
   * Update user
   */
  async updateUser(req, res) {
    try {
      const { name, email, role, password } = req.body;
      const userId = parseInt(req.params.id);
      
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent admin from changing their own role
      if (user.id === req.user.id && role && role !== user.role) {
        return res.status(400).json({ error: 'Cannot change your own role' });
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role && ['ADMIN', 'MEMBER'].includes(role.toUpperCase())) {
        updateData.role = role.toUpperCase();
      }
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });

      res.json({
        message: 'User updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user', details: error.message });
    }
  }

  /**
   * Delete user
   */
  async deleteUser(req, res) {
    try {
      const userId = parseInt(req.params.id);
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent admin from deleting themselves
      if (user.id === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      await prisma.user.delete({
        where: { id: userId }
      });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user', details: error.message });
    }
  }

  // ========== JOB VACANCY MANAGEMENT ==========

  /**
   * Get all job vacancies
   */
  async getVacancies(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {};
      if (status) {
        where.status = status.toUpperCase();
      }

      const [vacancies, total] = await Promise.all([
        prisma.jobVacancy.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' }
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
   * Get single job vacancy
   */
  async getVacancyById(req, res) {
    try {
      const vacancy = await prisma.jobVacancy.findUnique({
        where: { id: parseInt(req.params.id) }
      });

      if (!vacancy) {
        return res.status(404).json({ error: 'Job vacancy not found' });
      }

      res.json(vacancy);
    } catch (error) {
      console.error('Error fetching vacancy:', error);
      res.status(500).json({ error: 'Failed to fetch vacancy', details: error.message });
    }
  }

  /**
   * Create new job vacancy
   */
  async createVacancy(req, res) {
    try {
      const { title, company, location, description, requirements, salary } = req.body;

      if (!title || !company || !location || !description || !requirements) {
        return res.status(400).json({ error: 'Title, company, location, description, and requirements are required' });
      }

      const vacancy = await prisma.jobVacancy.create({
        data: {
          title,
          company,
          location,
          description,
          requirements,
          salary: salary || null,
          status: 'ACTIVE',
          createdBy: req.user.id
        }
      });

      res.status(201).json({
        message: 'Job vacancy created successfully',
        vacancy
      });
    } catch (error) {
      console.error('Error creating vacancy:', error);
      res.status(500).json({ error: 'Failed to create vacancy', details: error.message });
    }
  }

  /**
   * Update job vacancy
   */
  async updateVacancy(req, res) {
    try {
      const { title, company, location, description, requirements, salary, status } = req.body;
      const vacancyId = parseInt(req.params.id);
      
      const vacancy = await prisma.jobVacancy.findUnique({
        where: { id: vacancyId }
      });

      if (!vacancy) {
        return res.status(404).json({ error: 'Job vacancy not found' });
      }

      const updateData = {};
      if (title) updateData.title = title;
      if (company) updateData.company = company;
      if (location) updateData.location = location;
      if (description) updateData.description = description;
      if (requirements) updateData.requirements = requirements;
      if (salary !== undefined) updateData.salary = salary;
      if (status && ['ACTIVE', 'CLOSED'].includes(status.toUpperCase())) {
        updateData.status = status.toUpperCase();
      }

      const updatedVacancy = await prisma.jobVacancy.update({
        where: { id: vacancyId },
        data: updateData
      });

      res.json({
        message: 'Job vacancy updated successfully',
        vacancy: updatedVacancy
      });
    } catch (error) {
      console.error('Error updating vacancy:', error);
      res.status(500).json({ error: 'Failed to update vacancy', details: error.message });
    }
  }

  /**
   * Delete job vacancy
   */
  async deleteVacancy(req, res) {
    try {
      const vacancyId = parseInt(req.params.id);
      const vacancy = await prisma.jobVacancy.findUnique({
        where: { id: vacancyId }
      });

      if (!vacancy) {
        return res.status(404).json({ error: 'Job vacancy not found' });
      }

      await prisma.jobVacancy.delete({
        where: { id: vacancyId }
      });

      res.json({ message: 'Job vacancy deleted successfully' });
    } catch (error) {
      console.error('Error deleting vacancy:', error);
      res.status(500).json({ error: 'Failed to delete vacancy', details: error.message });
    }
  }

  // ========== APPLICATION MANAGEMENT ==========

  /**
   * Get all applications for a vacancy
   */
  async getVacancyApplications(req, res) {
    try {
      const vacancyId = parseInt(req.params.id);
      const vacancy = await prisma.jobVacancy.findUnique({
        where: { id: vacancyId },
        include: {
          applications: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!vacancy) {
        return res.status(404).json({ error: 'Job vacancy not found' });
      }

      res.json({
        vacancy: {
          id: vacancy.id,
          title: vacancy.title,
          company: vacancy.company
        },
        applications: vacancy.applications
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ error: 'Failed to fetch applications', details: error.message });
    }
  }

  /**
   * Get all applications
   */
  async getApplications(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {};
      if (status) {
        where.status = status.toUpperCase();
      }

      const [applications, total] = await Promise.all([
        prisma.application.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            jobVacancy: {
              select: {
                id: true,
                title: true,
                company: true
              }
            }
          }
        }),
        prisma.application.count({ where })
      ]);

      res.json({
        applications,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ error: 'Failed to fetch applications', details: error.message });
    }
  }

  /**
   * Get single application
   */
  async getApplicationById(req, res) {
    try {
      const application = await prisma.application.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          jobVacancy: {
            select: {
              id: true,
              title: true,
              company: true
            }
          }
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

  /**
   * Update application status
   */
  async updateApplication(req, res) {
    try {
      const { status } = req.body;
      const applicationId = parseInt(req.params.id);
      
      const application = await prisma.application.findUnique({
        where: { id: applicationId }
      });

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      if (!status || !['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED'].includes(status.toUpperCase())) {
        return res.status(400).json({ error: 'Valid status is required' });
      }

      const updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: { status: status.toUpperCase() }
      });

      res.json({
        message: 'Application status updated successfully',
        application: updatedApplication
      });
    } catch (error) {
      console.error('Error updating application:', error);
      res.status(500).json({ error: 'Failed to update application', details: error.message });
    }
  }
}

module.exports = new AdminController();
