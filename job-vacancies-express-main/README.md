# Job Vacancies Portal

A full-stack job portal application built with Express.js, Prisma ORM, SQLite, and JWT authentication. The application supports role-based access control with Admin and Member roles, allowing admins to manage users and job vacancies, while members can browse and apply for jobs.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Authentication & Authorization](#authentication--authorization)
- [API Routes](#api-routes)
- [Frontend Structure](#frontend-structure)
- [Setup & Installation](#setup--installation)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)

## Features

### Public Features
- Browse job vacancies (no authentication required)
- View job listings with pagination
- Responsive design with Tailwind CSS

### Member Features (Authenticated)
- View detailed job descriptions
- Apply for job positions with cover letter
- View own applications
- Profile management

### Admin Features
- **User Management**
  - Create, read, update, and delete users
  - Filter users by role
  - Assign roles (Admin/Member)
  - Password management

- **Job Vacancy Management**
  - Create, read, update, and delete job vacancies
  - Filter vacancies by status (Active/Closed)
  - Manage job details (title, company, location, description, requirements, salary)

- **Application Management**
  - View all applications for each job
  - Update application status (Pending, Reviewed, Accepted, Rejected)
  - View applicant details and cover letters

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma** - ORM for database management
- **SQLite** - Database
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-ejs-layouts** - View layout engine

### Frontend
- **EJS** - Template engine
- **Tailwind CSS (CDN)** - Utility-first CSS framework
- **Vanilla JavaScript** - Client-side scripting

## Architecture Overview

The application follows a **MVC (Model-View-Controller)** architecture pattern with clear separation of concerns:

1. **Controllers** (`/controllers/`) - Business logic and request handling
2. **Routes** (`/routes/api/` and `/routes/public/`) - Route definitions (thin layer)
3. **Middleware** (`/middleware/`) - Authentication and authorization logic
4. **Models** (`/prisma/`) - Database schema and Prisma client
5. **Views** (`/views/`) - EJS templates
6. **Static Assets** (`/public/`) - CSS, JavaScript, and other static files

### Request Flow

```
Client Request
    ↓
Express App (app.js)
    ↓
Route Handler (routes/public/ or routes/api/)
    ↓
Middleware (Authentication/Authorization)
    ↓
Controller (Business Logic)
    ↓
Prisma Client (Database Operations)
    ↓
Response (JSON or Rendered View)
```

### Architecture Benefits

- **Separation of Concerns**: Routes are thin, controllers handle business logic
- **Reusability**: Controllers can be reused across different routes
- **Testability**: Controllers can be unit tested independently
- **Maintainability**: Business logic is centralized and easier to modify
- **Scalability**: Easy to add new features without cluttering routes

## Project Structure

```
job-vacancies/
├── bin/
│   └── www                 # Server entry point
├── controllers/           # Business logic controllers
│   ├── AuthController.js  # Authentication logic
│   ├── VacancyController.js # Job vacancy logic
│   ├── AdminController.js # Admin management logic
│   └── MemberController.js # Member operations logic
├── middleware/
│   ├── auth.js            # JWT authentication middleware (API)
│   └── viewAuth.js        # Authentication middleware (Views)
├── prisma/
│   ├── schema.prisma      # Database schema definition
│   ├── client.js          # Prisma client initialization
│   ├── migrations/        # Database migrations
│   └── database.sqlite    # SQLite database file
├── public/
│   ├── javascripts/
│   │   ├── auth.js        # Frontend authentication utilities
│   │   └── api.js         # API request utilities
│   └── stylesheets/
│       └── style.css      # Custom CSS (supplements Tailwind)
├── routes/
│   ├── api/               # API Routes (REST endpoints)
│   │   ├── auth.js        # Authentication API
│   │   ├── vacancies.js   # Job vacancies API
│   │   ├── admin.js       # Admin API endpoints
│   │   └── member.js      # Member API endpoints
│   └── public/            # Public Routes (Views)
│       ├── jobs.js        # Job listing pages
│       ├── auth.js        # Login/Register pages
│       └── admin.js       # Admin dashboard pages
├── views/
│   ├── layout.ejs         # Main layout template
│   ├── jobs/              # Job-related views
│   │   ├── list.ejs      # Job listings page
│   │   └── detail.ejs    # Job detail page
│   ├── auth/              # Authentication views
│   │   ├── login.ejs     # Login page
│   │   └── register.ejs  # Registration page
│   └── admin/             # Admin views
│       ├── dashboard.ejs  # Admin dashboard
│       ├── users.ejs      # User management
│       ├── user-form.ejs  # User create/edit form
│       ├── vacancies.ejs   # Vacancy management
│       ├── vacancy-form.ejs # Vacancy create/edit form
│       └── applications.ejs # Application management
├── app.js                 # Express application setup
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## Database Schema

The application uses Prisma ORM with SQLite. The schema includes three main models:

### User Model
```prisma
model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  password  String
  name      String
  role      String    @default("MEMBER") // ADMIN or MEMBER
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  createdVacancies JobVacancy[]
  applications     Application[]
}
```

### JobVacancy Model
```prisma
model JobVacancy {
  id           Int       @id @default(autoincrement())
  title        String
  company      String
  location     String
  description  String
  requirements String
  salary       String?
  status       String    @default("ACTIVE") // ACTIVE or CLOSED
  createdBy    Int
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  creator      User         @relation(fields: [createdBy], references: [id])
  applications Application[]
}
```

### Application Model
```prisma
model Application {
  id           Int       @id @default(autoincrement())
  userId       Int
  jobVacancyId Int
  coverLetter  String?
  status       String    @default("PENDING") // PENDING, REVIEWED, ACCEPTED, REJECTED
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  user         User      @relation(fields: [userId], references: [id])
  jobVacancy   JobVacancy @relation(fields: [jobVacancyId], references: [id])
  
  @@unique([userId, jobVacancyId])
}
```

## Authentication & Authorization

### JWT Authentication Flow

1. **Registration/Login**: User provides credentials
2. **Server Validation**: Credentials are validated against database
3. **Token Generation**: JWT token is generated with user ID
4. **Token Storage**: Token stored in `localStorage` (frontend) and optionally in cookies
5. **Request Authentication**: Token sent in `Authorization` header for API requests
6. **Token Verification**: Middleware verifies token and attaches user to request

### Role-Based Access Control

- **Public**: No authentication required
  - Browse job listings
  
- **Member**: Requires authentication, role = "MEMBER"
  - View job details
  - Apply for jobs
  - View own applications

- **Admin**: Requires authentication, role = "ADMIN"
  - All member permissions
  - Manage users
  - Manage job vacancies
  - Manage applications

### Middleware

#### API Middleware (`middleware/auth.js`)
- `authenticateToken` - Verifies JWT token from Authorization header
- `requireAdmin` - Ensures user has ADMIN role
- `requireMember` - Ensures user has MEMBER role

#### View Middleware (`middleware/viewAuth.js`)
- `authenticateView` - Verifies JWT token for view routes (reads from cookie or header)
- `requireAdminView` - Ensures user has ADMIN role for views

## API Routes

### Authentication API (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Vacancies API (`/api/vacancies`)
- `GET /api/vacancies/public` - Get public job listings (no auth)
- `GET /api/vacancies` - Get job listings (auth required)
- `GET /api/vacancies/:id` - Get job details (auth required)
- `POST /api/vacancies/:id/apply` - Apply for job (member only)

### Admin API (`/api/admin`)
**User Management:**
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - Get user details
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

**Job Vacancy Management:**
- `GET /api/admin/vacancies` - List all vacancies
- `GET /api/admin/vacancies/:id` - Get vacancy details
- `POST /api/admin/vacancies` - Create vacancy
- `PUT /api/admin/vacancies/:id` - Update vacancy
- `DELETE /api/admin/vacancies/:id` - Delete vacancy

**Application Management:**
- `GET /api/admin/vacancies/:id/applications` - Get applications for a vacancy
- `GET /api/admin/applications` - List all applications
- `GET /api/admin/applications/:id` - Get application details
- `PUT /api/admin/applications/:id` - Update application status

### Member API (`/api/member`)
- `GET /api/member/applications` - Get member's applications
- `GET /api/member/applications/:id` - Get application details

## Frontend Structure

### Views (EJS Templates)

**Layout System:**
- Uses `express-ejs-layouts` for consistent layout
- Main layout (`layout.ejs`) includes navigation and footer
- Tailwind CSS CDN for styling

**Page Structure:**
- **Public Pages**: Job listings (no auth required)
- **Authenticated Pages**: Job details, application forms
- **Admin Pages**: Dashboard, user management, vacancy management

### JavaScript Modules

**`public/javascripts/auth.js`:**
- `updateAuthUI()` - Updates navigation based on auth state
- `logout()` - Handles user logout

**`public/javascripts/api.js`:**
- `apiRequest()` - Utility for making authenticated API requests
- Handles token injection and 401 redirects

### State Management

- **localStorage**: Stores JWT token and user data
- **Token**: Sent in `Authorization: Bearer <token>` header
- **User Data**: Includes id, email, name, role

## Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd job-vacancies
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy the example environment file and configure it:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file and update the following variables:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # JWT Secret Key (REQUIRED - Change this!)
   # Generate a secure secret: openssl rand -base64 32
   JWT_SECRET=your-secret-key-change-in-production
   
   # JWT Token Expiration (optional, default is 24h)
   JWT_EXPIRES_IN=24h
   
   # Database Configuration
   DATABASE_URL="file:./prisma/database.sqlite"
   ```
   
   **Important**: 
   - Change `JWT_SECRET` to a strong random string in production
   - Never commit `.env` file to version control (already in .gitignore)
   - Use `.env.example` as a template for other developers

4. **Initialize database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Seed database with test users**
   ```bash
   npm run prisma:seed
   ```
   
   This creates:
   - **Super Admin**: `admin@jobportal.com` / `admin123`
   - **Test Member**: `member@jobportal.com` / `member123`
   - Sample job vacancies

5. **Start the server**
   ```bash
   npm start
   # or with nodemon (auto-reload)
   npm start
   ```

6. **Access the application**
   - Open browser: `http://localhost:3000`
   - Job listings: `http://localhost:3000/jobs`
   - Admin dashboard: `http://localhost:3000/admin/dashboard` (requires admin login)

### Database Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with test data
npm run prisma:seed

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

### Test Users (Created by Seeder)

After running `npm run prisma:seed`, you can login with:

**Super Admin:**
- Email: `admin@jobportal.com`
- Password: `admin123`
- Role: ADMIN

**Test Member:**
- Email: `member@jobportal.com`
- Password: `member123`
- Role: MEMBER

## Usage Guide

### Creating an Admin User

1. Register a new user via `/auth/register`
2. Update the user role in the database:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
   ```
   Or use Prisma Studio to edit the user role.

### Workflow Examples

**Member Workflow:**
1. Register/Login
2. Browse jobs at `/jobs`
3. Click on a job to view details
4. Fill out application form and submit
5. View applications in member dashboard

**Admin Workflow:**
1. Login as admin
2. Access admin dashboard at `/admin/dashboard`
3. Manage users: Create, edit, delete users
4. Manage vacancies: Create, edit, delete job postings
5. Review applications: View and update application statuses

## API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "role": "MEMBER"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "role": "MEMBER"
  }
}
```

### Job Vacancies

#### Get Public Job Listings
```http
GET /api/vacancies/public?page=1&limit=10&status=ACTIVE
```

#### Get Job Details (Authenticated)
```http
GET /api/vacancies/:id
Authorization: Bearer <token>
```

#### Apply for Job (Member Only)
```http
POST /api/vacancies/:id/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "coverLetter": "I am interested in this position..."
}
```

### Admin Endpoints

All admin endpoints require:
- Authentication token in `Authorization` header
- User role must be `ADMIN`

#### Create User
```http
POST /api/admin/users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "MEMBER"
}
```

#### Create Job Vacancy
```http
POST /api/admin/vacancies
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "Software Engineer",
  "company": "Tech Corp",
  "location": "Remote",
  "description": "Job description here...",
  "requirements": "Requirements here...",
  "salary": "$80,000 - $100,000"
}
```

## Environment Variables

The application uses environment variables for configuration. All sensitive data is stored in `.env` file (not committed to git).

### Required Variables

- `JWT_SECRET` - Secret key for signing JWT tokens (REQUIRED)
- `DATABASE_URL` - Database connection string (defaults to SQLite)

### Optional Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)
- `JWT_EXPIRES_IN` - JWT token expiration time (default: 24h)

### Generating Secure Secrets

To generate a secure JWT secret:
```bash
openssl rand -base64 32
```

### Database URLs

**SQLite (default):**
```env
DATABASE_URL="file:./prisma/database.sqlite"
```

**PostgreSQL:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/job_vacancies?schema=public"
```

**MySQL:**
```env
DATABASE_URL="mysql://user:password@localhost:3306/job_vacancies"
```

## Security Features

1. **Password Hashing**: Passwords are hashed using bcryptjs (10 rounds)
2. **JWT Tokens**: Secure token-based authentication with configurable expiration
3. **Environment Variables**: Sensitive data stored in `.env` (not in code)
4. **Role-Based Access**: Middleware enforces role-based permissions
5. **Input Validation**: Server-side validation for all inputs
6. **SQL Injection Protection**: Prisma ORM prevents SQL injection
7. **XSS Protection**: EJS escapes HTML by default
8. **Gitignore**: `.env` file is excluded from version control

## Development

### Project Scripts

```bash
# Start server
npm start

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Open Prisma Studio
npm run prisma:studio

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

### Code Style

- Use ES6+ JavaScript features
- Follow Express.js conventions
- Use async/await for asynchronous operations
- Keep routes organized by feature
- Use middleware for cross-cutting concerns

## Testing

The project includes comprehensive unit and integration tests using Jest.

### Running Tests

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Test Structure

```
tests/
├── setup.js              # Test configuration and setup
├── unit/                 # Unit tests
│   └── auth.test.js     # Authentication utilities tests
└── integration/         # Integration tests
    ├── auth.test.js     # Authentication API tests
    ├── vacancies.test.js # Job vacancies API tests
    └── admin.test.js    # Admin API tests
```

### Test Coverage

Tests cover:
- Authentication utilities (JWT token generation, password hashing)
- Authentication API endpoints (register, login)
- Job vacancies API endpoints
- Admin API endpoints (user management, vacancy management)
- Role-based access control
- Error handling

### Test Database

Tests use the same database as development (`prisma/database.sqlite`) but clean up data before and after each test suite.

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Ensure SQLite file exists: `prisma/database.sqlite`
   - Run migrations: `npx prisma migrate dev`

2. **Authentication errors**
   - Check JWT_SECRET is set in `.env`
   - Verify token is being sent in Authorization header
   - Check token expiration (default: 24 hours)

3. **Prisma Client errors**
   - Run `npx prisma generate` after schema changes
   - Restart the server after generating Prisma Client

4. **Seeder errors**
   - Ensure database is migrated: `npx prisma migrate dev`
   - Check that Prisma Client is generated: `npx prisma generate`
   - Run seeder: `npm run prisma:seed`

5. **Test errors**
   - Ensure test database is set up
   - Check `.env.test` file exists
   - Run `npx prisma generate` before running tests

## License

This project is for educational purposes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please open an issue on the repository.
