# 🧪 Unit Test and Integration Test Documentation

## Job Vacancies Portal - Testing Guide

---

## 📖 Daftar Isi

1. [Overview](#overview)
2. [Test Statistics](#test-statistics)
3. [Cara Menjalankan Tests](#cara-menjalankan-tests)
4. [Struktur File Tests](#struktur-file-tests)
5. [Unit Tests](#unit-tests)
6. [Integration Tests](#integration-tests)
7. [Test Configuration](#test-configuration)
8. [Menulis Test Baru](#menulis-test-baru)
9. [Coverage Report](#coverage-report)
10. [Troubleshooting](#troubleshooting)

---

## Overview

Proyek **Job Vacancies Portal** menggunakan framework testing modern untuk memastikan kualitas kode:

| Tool | Fungsi |
|------|--------|
| **Jest** | JavaScript Testing Framework |
| **Supertest** | HTTP Integration Testing |
| **Mocking** | Isolasi dependencies untuk unit tests |

### Jenis Testing

```
┌─────────────────────────────────────────────────────────────┐
│                      TESTING PYRAMID                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ┌─────────────┐                          │
│                    │   E2E Tests │  ← (Browser Tests)       │
│                    └─────────────┘                          │
│               ┌─────────────────────┐                       │
│               │  Integration Tests  │  ← API Endpoints      │
│               └─────────────────────┘                       │
│          ┌───────────────────────────────┐                  │
│          │         Unit Tests            │  ← Functions     │
│          └───────────────────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**1. Unit Tests**
- Menguji fungsi dan modul secara **terisolasi**
- Menggunakan **mock** untuk dependencies (database, external services)
- Cepat dan reliable
- Fokus pada **logic** internal

**2. Integration Tests**
- Menguji **API endpoints** secara end-to-end
- Menggunakan **database nyata** (SQLite test database)
- Memastikan semua komponen bekerja bersama
- Fokus pada **behavior** sistem

---

## Test Statistics

### Ringkasan Hasil Test

| Kategori | Jumlah Tests | Jumlah Test Suites | Status |
|----------|--------------|-------------------|--------|
| Unit Tests | 77 tests | 6 suites | ✅ Passed |
| Integration Tests | 35 tests | 4 suites | ✅ Passed |
| **Total** | **112 tests** | **10 suites** | ✅ **All Passed** |

### Detail Per File

#### Unit Tests (77 tests)
| File | Tests | Deskripsi |
|------|-------|-----------|
| `auth.test.js` | 4 | JWT & password utilities |
| `middleware.test.js` | 14 | Auth middleware |
| `authController.test.js` | 12 | AuthController |
| `vacancyController.test.js` | 15 | VacancyController |
| `adminController.test.js` | 24 | AdminController |
| `memberController.test.js` | 8 | MemberController |

#### Integration Tests (35 tests)
| File | Tests | Deskripsi |
|------|-------|-----------|
| `auth.test.js` | 7 | Authentication API |
| `vacancies.test.js` | 11 | Vacancies API |
| `admin.test.js` | 9 | Admin API |
| `member.test.js` | 8 | Member API |

---

## Cara Menjalankan Tests

### 🚀 Quick Start

```bash
# Navigasi ke folder proyek
cd d:\pbf_session14\job-vacancies-express-main

# Install dependencies (jika belum)
npm install

# Jalankan SEMUA tests dengan coverage
npm test
```

### Perintah Testing Lengkap

| Perintah | Deskripsi |
|----------|-----------|
| `npm test` | Jalankan semua tests + coverage report |
| `npm run test:unit` | Jalankan unit tests saja |
| `npm run test:integration` | Jalankan integration tests saja |
| `npm run test:watch` | Watch mode (auto re-run saat file berubah) |

### Menjalankan Test Spesifik

```bash
# Jalankan satu file test
npx jest tests/unit/auth.test.js
npx jest tests/integration/vacancies.test.js

# Jalankan tests dengan nama pattern
npx jest --testPathPattern="auth"
npx jest --testPathPattern="admin"
npx jest --testPathPattern="member"

# Jalankan test dengan nama describe/test tertentu
npx jest -t "should register"
npx jest -t "should login"
```

### Opsi Tambahan

```bash
# Verbose output (detail setiap test)
npx jest --verbose

# Tanpa coverage (lebih cepat)
npx jest --no-coverage

# Update snapshots (jika ada)
npx jest --updateSnapshot

# Bail (berhenti saat pertama kali gagal)
npx jest --bail
```

---

## Struktur File Tests

```
d:\pbf_session14\job-vacancies-express-main\tests\
│
├── setup.js                          # 🔧 Test configuration & environment setup
│
├── unit/                             # 📦 UNIT TESTS
│   ├── auth.test.js                  # JWT token & password hashing
│   ├── middleware.test.js            # authenticateToken, requireAdmin, requireMember
│   ├── authController.test.js        # Register, Login, Logout
│   ├── vacancyController.test.js     # Public listings, Details, Apply
│   ├── adminController.test.js       # User/Vacancy/Application CRUD
│   └── memberController.test.js      # Member applications
│
└── integration/                      # 🔗 INTEGRATION TESTS
    ├── auth.test.js                  # POST /api/auth/register, login
    ├── vacancies.test.js             # GET/POST /api/vacancies
    ├── admin.test.js                 # CRUD /api/admin/*
    └── member.test.js                # GET /api/member/applications
```

---

## Unit Tests

### Apa itu Unit Test?

Unit test menguji **satu unit kode** (fungsi/method) secara terisolasi. Dependencies seperti database di-**mock** (dipalsukan) sehingga test berjalan cepat dan konsisten.

### Struktur Unit Test

```javascript
// 1. Import module yang akan ditest
const AuthController = require('../../controllers/AuthController');

// 2. Mock dependencies
jest.mock('../../prisma/client', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn()
  }
}));

// 3. Describe block untuk grouping
describe('AuthController', () => {
  
  // 4. Setup sebelum setiap test
  let mockReq, mockRes;
  
  beforeEach(() => {
    mockReq = { body: {}, params: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  // 5. Test cases
  describe('register', () => {
    test('should return 400 if email is missing', async () => {
      mockReq.body = { password: 'pass123', name: 'Test' };
      
      await AuthController.register(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});
```

---

### Detail Unit Tests

#### 1️⃣ Auth Utilities (`tests/unit/auth.test.js`)

Menguji fungsi-fungsi dasar autentikasi:

| Test | Deskripsi |
|------|-----------|
| `should generate a valid JWT token` | Memastikan token JWT valid |
| `should include expiration in token` | Token memiliki waktu kadaluarsa |
| `should hash password correctly` | Password di-hash dengan bcrypt |
| `should reject incorrect password` | Password salah ditolak |

```javascript
describe('generateToken', () => {
  test('should generate a valid JWT token', () => {
    const token = generateToken(testUserId);
    
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    
    const decoded = jwt.verify(token, testSecret);
    expect(decoded.userId).toBe(testUserId);
  });
});
```

---

#### 2️⃣ Auth Middleware (`tests/unit/middleware.test.js`)

Menguji middleware autentikasi:

| Test | Deskripsi |
|------|-----------|
| `should return 401 if no token provided` | Tidak ada token = ditolak |
| `should return 401 for invalid token` | Token tidak valid = ditolak |
| `should return 401 for expired token` | Token kadaluarsa = ditolak |
| `should call next() for valid token` | Token valid = lanjut |
| `requireAdmin should check ADMIN role` | Cek role admin |
| `requireMember should check MEMBER role` | Cek role member |

```javascript
describe('authenticateToken', () => {
  test('should return 401 if no token provided', async () => {
    await authenticateToken(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
```

---

#### 3️⃣ AuthController (`tests/unit/authController.test.js`)

Menguji controller autentikasi:

**Register Tests:**
| Test | Expected |
|------|----------|
| Missing email | 400 error |
| Missing password | 400 error |
| Missing name | 400 error |
| Email already exists | 400 error |
| Valid registration | 201 + token |

**Login Tests:**
| Test | Expected |
|------|----------|
| Missing email | 400 error |
| Missing password | 400 error |
| User not found | 401 error |
| Wrong password | 401 error |
| Valid credentials | 200 + token |

**Logout Tests:**
| Test | Expected |
|------|----------|
| Logout | Clear cookie + success message |

---

#### 4️⃣ VacancyController (`tests/unit/vacancyController.test.js`)

Menguji controller lowongan kerja:

| Method | Tests |
|--------|-------|
| `getPublicListings` | Pagination, filtering, error handling |
| `getDetails` | Found, not found, invalid ID |
| `apply` | Not found, closed vacancy, already applied, success |

```javascript
describe('apply', () => {
  test('should return 400 if vacancy is CLOSED', async () => {
    mockReq.params = { id: '1' };
    prisma.jobVacancy.findUnique.mockResolvedValue({
      id: 1,
      status: 'CLOSED'
    });

    await VacancyController.apply(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'This job vacancy is not accepting applications'
    });
  });
});
```

---

#### 5️⃣ AdminController (`tests/unit/adminController.test.js`)

Menguji controller admin (24 tests):

**User Management:**
- `getUsers` - List users with pagination
- `getUserById` - Get single user
- `createUser` - Create new user
- `updateUser` - Update user (+ prevent self role change)
- `deleteUser` - Delete user (+ prevent self delete)

**Vacancy Management:**
- `getVacancies` - List vacancies
- `getVacancyById` - Get single vacancy
- `createVacancy` - Create vacancy
- `updateVacancy` - Update vacancy
- `deleteVacancy` - Delete vacancy

**Application Management:**
- `getApplications` - List applications
- `updateApplication` - Update application status

---

#### 6️⃣ MemberController (`tests/unit/memberController.test.js`)

Menguji controller member:

| Method | Tests |
|--------|-------|
| `getApplications` | Return user's applications, empty array, errors |
| `getApplicationById` | Found, not found, other user's data, errors |

---

## Integration Tests

### Apa itu Integration Test?

Integration test menguji **API endpoints** secara end-to-end menggunakan HTTP requests. Tests ini menggunakan database nyata dan memverifikasi bahwa semua komponen bekerja bersama.

### Struktur Integration Test

```javascript
const request = require('supertest');
const app = require('../../app');
const prisma = require('../../prisma/client');

describe('Authentication API', () => {
  // Setup test data sebelum semua tests
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'test@example.com' } });
  });

  // Cleanup setelah semua tests
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'test@example.com' } });
    await prisma.$disconnect();
  });

  // Test cases
  test('POST /api/auth/register', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
      .expect(201);

    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe('test@example.com');
  });
});
```

---

### Detail Integration Tests

#### 1️⃣ Authentication API (`tests/integration/auth.test.js`)

| Endpoint | Method | Test Case | Expected |
|----------|--------|-----------|----------|
| `/api/auth/register` | POST | Valid data | 201 + token |
| `/api/auth/register` | POST | Missing fields | 400 |
| `/api/auth/register` | POST | Duplicate email | 400 |
| `/api/auth/login` | POST | Valid credentials | 200 + token |
| `/api/auth/login` | POST | Invalid email | 401 |
| `/api/auth/login` | POST | Invalid password | 401 |
| `/api/auth/login` | POST | Missing credentials | 400 |

---

#### 2️⃣ Vacancies API (`tests/integration/vacancies.test.js`)

| Endpoint | Method | Auth | Test Case | Expected |
|----------|--------|------|-----------|----------|
| `/api/vacancies/public` | GET | ❌ | Get listings | 200 + vacancies |
| `/api/vacancies/public` | GET | ❌ | Pagination | paginated results |
| `/api/vacancies` | GET | ✅ | No token | 401 |
| `/api/vacancies` | GET | ✅ | Valid token | 200 |
| `/api/vacancies/:id` | GET | ✅ | Valid ID | 200 + details |
| `/api/vacancies/:id` | GET | ✅ | Invalid ID | 404 |
| `/api/vacancies/:id/apply` | POST | ✅ Member | Valid application | 201 |
| `/api/vacancies/:id/apply` | POST | ✅ Admin | Wrong role | 403 |
| `/api/vacancies/:id/apply` | POST | ✅ Member | Duplicate | 400 |

---

#### 3️⃣ Admin API (`tests/integration/admin.test.js`)

| Endpoint | Method | Test Case | Expected |
|----------|--------|-----------|----------|
| `/api/admin/users` | GET | As member | 403 |
| `/api/admin/users` | GET | As admin | 200 + users |
| `/api/admin/users` | POST | Create user | 201 |
| `/api/admin/users/:id` | PUT | Update user | 200 |
| `/api/admin/users/:id` | DELETE | Delete user | 200 |
| `/api/admin/vacancies` | POST | Create vacancy | 201 |
| `/api/admin/vacancies/:id` | PUT | Update vacancy | 200 |
| `/api/admin/vacancies/:id` | DELETE | Delete vacancy | 200 |

---

#### 4️⃣ Member API (`tests/integration/member.test.js`)

| Endpoint | Method | Test Case | Expected |
|----------|--------|-----------|----------|
| `/api/member/applications` | GET | No auth | 401 |
| `/api/member/applications` | GET | As admin | 403 |
| `/api/member/applications` | GET | As member | 200 + applications |
| `/api/member/applications/:id` | GET | Own application | 200 |
| `/api/member/applications/:id` | GET | Other's application | 404 |
| `/api/member/applications/:id` | GET | Non-existent | 404 |

---

## Test Configuration

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  // Node.js environment
  testEnvironment: 'node',
  
  // Ignore these from coverage
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/prisma/'
  ],
  
  // Pattern untuk file test
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  
  // Setup file (dijalankan sebelum tests)
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // File yang dihitung coverage-nya
  collectCoverageFrom: [
    'controllers/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**'
  ],
  
  // Output verbose
  verbose: true,
  
  // Timeout per test (15 detik)
  testTimeout: 15000,
  
  // Run tests serially (avoid database conflicts)
  maxWorkers: 1
};
```

### Test Setup (`tests/setup.js`)

```javascript
// Load environment variables for tests
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/database.sqlite';

// Increase timeout for database operations
jest.setTimeout(10000);
```

---

## Menulis Test Baru

### Template Unit Test

```javascript
// tests/unit/myController.test.js

const MyController = require('../../controllers/MyController');

// Mock semua dependencies
jest.mock('../../prisma/client', () => ({
  myModel: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

const prisma = require('../../prisma/client');

describe('MyController Unit Tests', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Reset mocks sebelum setiap test
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: 1, role: 'ADMIN' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('myMethod', () => {
    test('should return success for valid input', async () => {
      // Arrange - Setup data dan mocks
      mockReq.body = { name: 'Test' };
      prisma.myModel.create.mockResolvedValue({ id: 1, name: 'Test' });

      // Act - Jalankan method
      await MyController.myMethod(mockReq, mockRes);

      // Assert - Verifikasi hasil
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Success',
        data: { id: 1, name: 'Test' }
      });
    });

    test('should return 400 for invalid input', async () => {
      mockReq.body = {}; // Empty body

      await MyController.myMethod(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle database errors', async () => {
      mockReq.body = { name: 'Test' };
      prisma.myModel.create.mockRejectedValue(new Error('Database error'));

      await MyController.myMethod(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
```

### Template Integration Test

```javascript
// tests/integration/myApi.test.js

const request = require('supertest');
const app = require('../../app');
const prisma = require('../../prisma/client');
const { generateToken } = require('../../middleware/auth');
const bcrypt = require('bcryptjs');

describe('My API Integration Tests', () => {
  let adminToken;
  let memberToken;
  let testData;

  beforeAll(async () => {
    // Cleanup existing test data
    await prisma.myModel.deleteMany({
      where: { email: { contains: '@test.com' } }
    });

    // Create test users
    const password = await bcrypt.hash('password123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password,
        name: 'Admin',
        role: 'ADMIN'
      }
    });
    adminToken = generateToken(admin.id);

    const member = await prisma.user.create({
      data: {
        email: 'member@test.com',
        password,
        name: 'Member',
        role: 'MEMBER'
      }
    });
    memberToken = generateToken(member.id);

    // Create test data
    testData = await prisma.myModel.create({
      data: { /* ... */ }
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.myModel.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { contains: '@test.com' } }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/my-endpoint', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/my-endpoint')
        .expect(401);

      expect(response.body.error).toContain('token');
    });

    test('should return data for authenticated user', async () => {
      const response = await request(app)
        .get('/api/my-endpoint')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('POST /api/my-endpoint', () => {
    test('should create new item', async () => {
      const response = await request(app)
        .post('/api/my-endpoint')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Item' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });
});
```

---

## Coverage Report

### Melihat Coverage

```bash
# Jalankan test dengan coverage
npm test

# Output coverage ke folder
npx jest --coverage --coverageDirectory=coverage
```

### Membuka Visual Report

Coverage report tersimpan di folder `coverage/`. Buka di browser:

```
coverage/lcov-report/index.html
```

### Membaca Coverage Report

| Metric | Deskripsi |
|--------|-----------|
| **Statements** | Persentase statement yang dieksekusi |
| **Branches** | Persentase branch (if/else) yang dieksekusi |
| **Functions** | Persentase fungsi yang dipanggil |
| **Lines** | Persentase baris yang dieksekusi |

Target coverage yang baik:
- ✅ > 80% - Excellent
- ⚠️ 60-80% - Good
- ❌ < 60% - Needs improvement

---

## Troubleshooting

### Error: Cannot find module

```bash
# Solusi: Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate
```

### Error: Database connection failed

```bash
# Solusi: Pastikan database sudah di-migrate
npm run prisma:migrate
```

### Error: JWT_SECRET not defined

```bash
# Solusi: Buat file .env
copy .env.example .env
```

### Tests timeout

```javascript
// Di jest.config.js, tambahkan:
testTimeout: 30000  // 30 detik
```

### Database conflicts between tests

```javascript
// Di jest.config.js, tambahkan:
maxWorkers: 1  // Run serially
```

### Mock tidak bekerja

```javascript
// Pastikan mock di-definisikan SEBELUM import module
jest.mock('../../prisma/client', () => ({ /* ... */ }));
const prisma = require('../../prisma/client');  // Import SETELAH mock
```

---

## 📝 Catatan Penting

1. **Cleanup Test Data** - Selalu cleanup data setelah integration tests
2. **Isolasi Tests** - Setiap test harus independen
3. **Mock External Services** - Database, API calls, dll di unit tests
4. **Real Database untuk Integration** - Gunakan database test untuk integration
5. **Descriptive Names** - Nama test harus jelas menjelaskan apa yang ditest

---

## 🔗 Referensi

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Dibuat untuk: Job Vacancies Portal**  
**Framework: Express.js + Jest + Supertest**  
**Total Tests: 112 (77 unit + 35 integration)**
