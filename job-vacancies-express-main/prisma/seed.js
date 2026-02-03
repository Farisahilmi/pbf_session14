const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create super admin user
  const adminEmail = 'admin@jobportal.com';
  const adminPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    console.log('✅ Super admin already exists, updating password...');
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    console.log(`✅ Super admin updated:
      Email: ${adminEmail}
      Password: ${adminPassword}
      Role: ADMIN`);
  } else {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Super Admin',
        role: 'ADMIN'
      }
    });
    console.log(`✅ Super admin created:
      Email: ${adminEmail}
      Password: ${adminPassword}
      Role: ADMIN`);
  }

  // Create test member user
  const memberEmail = 'member@jobportal.com';
  const memberPassword = 'member123';
  const hashedMemberPassword = await bcrypt.hash(memberPassword, 10);

  const existingMember = await prisma.user.findUnique({
    where: { email: memberEmail }
  });

  if (existingMember) {
    console.log('✅ Test member already exists, updating password...');
    await prisma.user.update({
      where: { email: memberEmail },
      data: {
        password: hashedMemberPassword,
        role: 'MEMBER'
      }
    });
    console.log(`✅ Test member updated:
      Email: ${memberEmail}
      Password: ${memberPassword}
      Role: MEMBER`);
  } else {
    const member = await prisma.user.create({
      data: {
        email: memberEmail,
        password: hashedMemberPassword,
        name: 'Test Member',
        role: 'MEMBER'
      }
    });
    console.log(`✅ Test member created:
      Email: ${memberEmail}
      Password: ${memberPassword}
      Role: MEMBER`);
  }

  // Create sample job vacancies
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (adminUser) {
    const sampleJobs = [
      {
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        description: 'We are looking for an experienced software engineer to join our team. You will work on cutting-edge projects and collaborate with talented developers.',
        requirements: '5+ years of experience, Bachelor\'s degree in Computer Science, Strong problem-solving skills',
        salary: '$120,000 - $150,000',
        status: 'ACTIVE',
        createdBy: adminUser.id
      },
      {
        title: 'Frontend Developer',
        company: 'Web Solutions Inc',
        location: 'Remote',
        description: 'Join our remote team as a Frontend Developer. Work with React, Vue, and modern JavaScript frameworks.',
        requirements: '3+ years of frontend experience, React/Vue knowledge, CSS expertise',
        salary: '$80,000 - $100,000',
        status: 'ACTIVE',
        createdBy: adminUser.id
      },
      {
        title: 'Backend Developer',
        company: 'API Masters',
        location: 'New York, NY',
        description: 'We need a backend developer to build scalable APIs and microservices.',
        requirements: 'Node.js/Python experience, Database design, RESTful API design',
        salary: '$100,000 - $130,000',
        status: 'ACTIVE',
        createdBy: adminUser.id
      }
    ];

    for (const job of sampleJobs) {
      const existingJob = await prisma.jobVacancy.findFirst({
        where: {
          title: job.title,
          company: job.company
        }
      });

      if (!existingJob) {
        await prisma.jobVacancy.create({
          data: job
        });
        console.log(`✅ Created job: ${job.title} at ${job.company}`);
      }
    }
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
