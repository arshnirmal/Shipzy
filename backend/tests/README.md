# 🧪 Shipzy Backend API Tests

Comprehensive test suite for the Shipzy backend API covering all endpoints, authentication, authorization, and database operations.

## 📋 Test Structure

```
tests/
├── setup.js              # Test configuration and utilities
├── database.js           # Database setup and test data management
├── test-runner.js        # Comprehensive test runner
├── auth.test.js         # Authentication and authorization tests
├── users.test.js        # User management API tests
├── drivers.test.js      # Driver management API tests
├── orders.test.js       # Order management API tests
├── static.test.js       # Static data API tests
├── system.test.js       # Health check and system tests
└── README.md           # This documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 24.10+
- PostgreSQL 14+
- Running backend server (for integration tests)

### Setup Test Environment

```bash
# Install dependencies
npm install

# Setup test database
npm run test:db:setup

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 🧪 Available Test Commands

### Run All Tests

```bash
npm test                    # Run all tests with coverage
npm run test:all           # Run comprehensive test suite
npm run test:coverage      # Generate detailed coverage report
```

### Run Specific Test Suites

```bash
npm run test:auth         # Authentication tests only
npm run test:users        # User management tests only
npm run test:drivers      # Driver management tests only
npm run test:orders       # Order management tests only
npm run test:static       # Static data tests only
npm run test:system       # System endpoints tests only
```

### Development and Debugging

```bash
npm run test:watch        # Watch mode for development
npm run test:db:setup     # Setup test database
npm run test:db:cleanup   # Cleanup test database
npm run lint:test         # Lint test files
npm run format:test       # Format test files
```

## 📊 Test Coverage

The test suite covers:

### ✅ Authentication & Authorization

- **Multi-Authentication Support:**
  - Firebase Phone OTP verification
  - Google OAuth token verification
  - Email/Password registration and login
- JWT token management (access/refresh)
- User logout and token revocation
- Role-based access control (client, courier, admin)
- Device information tracking
- Rate limiting for auth endpoints

### ✅ User Management

- User profile retrieval and updates
- Address management (CRUD operations)
- Profile validation and constraints
- Address filtering and search
- Concurrent update handling

### ✅ Driver Management

- Driver profile management
- Availability status toggles
- Real-time location updates
- Assignment tracking
- Earnings calculation and reporting
- Vehicle information integration

### ✅ Order Management

- Order creation with validation
- Fare calculation
- Order status management
- Client order listing and filtering
- Courier order acceptance
- Order cancellation
- Status transition validation
- Concurrent order operations

### ✅ Static Data

- Delivery types and capabilities
- Weight tiers and pricing
- Vehicle categories
- Package types and handling
- Payment methods
- Order statuses
- Data consistency validation

### ✅ System & Health

- Health check endpoints
- API information
- Error handling
- Security headers
- Performance monitoring
- Database connectivity

## 🔧 Test Configuration

### Environment Variables

Create a `.env` file in the project root with test-specific values:

```env
NODE_ENV=test
DB_HOST=localhost
DB_NAME=shipzy_test
DB_USER=shipzy_user
DB_PASSWORD=password123
JWT_SECRET=test_jwt_secret_key_for_testing
BACKEND_PORT=3001
LOG_LEVEL=error
LOG_QUERIES=false
```

### Database Setup

The test suite automatically:

1. Creates a test database (`shipzy_test`)
2. Runs schema migrations
3. Loads test data and functions
4. Cleans up after each test run

### Test Data

The test suite includes:

- Sample users (client, courier, admin)
- Test addresses and locations
- Sample orders in various states
- Test vehicles and capabilities
- Realistic test scenarios

## 🏗️ Test Architecture

### Test Types

#### Unit Tests

- Individual function testing
- Database query validation
- Schema validation
- Utility function testing

#### Integration Tests

- API endpoint testing with Supertest
- Database integration testing
- Authentication flow testing
- Authorization testing

#### End-to-End Tests

- Complete user workflows
- Cross-module interactions
- Error scenario testing
- Performance testing

### Test Utilities

#### Setup and Teardown

```javascript
// Automatic database setup before tests
beforeAll(async () => {
  await testDb.setup();
});

// Automatic cleanup after tests
afterAll(async () => {
  await testDb.teardown();
});
```

#### Test Data Management

```javascript
// Create test user
const testUser = await testDb.createTestUser(testUsers.client);

// Create test order
const testOrder = await testDb.createTestOrder(orderData, clientId);

// Clean up test data
await testDb.cleanupTestData();
```

#### Authentication Helpers

```javascript
// Create authenticated requests
const authHeaders = createTestAuthHeaders(token);
const deviceHeaders = createTestDeviceHeaders(deviceId);
```

## 📝 Writing Tests

### Test File Structure

```javascript
describe("Module Name", () => {
  beforeAll(async () => {
    // Setup
  });

  afterAll(async () => {
    // Cleanup
  });

  describe("Feature Group", () => {
    it("should do something", async () => {
      // Test implementation
    });

    it("should handle edge case", async () => {
      // Edge case test
    });

    it("should return error for invalid input", async () => {
      // Error case test
    });
  });
});
```

### Testing Best Practices

#### Authentication Testing

```javascript
// Test authenticated endpoints
const response = await request(app.server)
  .get("/api/v1/users/me")
  .set(createTestAuthHeaders(token))
  .expect(200);

// Test unauthorized access
const errorResponse = await request(app.server)
  .get("/api/v1/users/me")
  .expect(401);
```

#### Database Testing

```javascript
// Verify database state
const userQuery = "SELECT * FROM users.profiles WHERE user_id = $1";
const updatedUser = await testDb.query(userQuery, [userId]);

expect(updatedUser.rows[0]).toMatchObject({
  full_name: expectedName,
  email: expectedEmail,
});
```

#### Error Testing

```javascript
// Test error scenarios
const errorResponse = await request(app.server)
  .post("/api/v1/orders")
  .send(invalidData)
  .expect(400);

expect(errorResponse.body).toMatchObject({
  success: false,
  message: expect.any(String),
});
```

## 🔍 Test Scenarios Covered

### Authentication Scenarios

- ✅ Valid Firebase token verification
- ✅ Invalid/expired token handling
- ✅ Token refresh functionality
- ✅ User logout and revocation
- ✅ Device tracking
- ✅ Rate limiting

### User Management Scenarios

- ✅ Profile creation and updates
- ✅ Address management (CRUD)
- ✅ Validation constraints
- ✅ Concurrent updates
- ✅ Role-based access

### Order Management Scenarios

- ✅ Order creation workflow
- ✅ Fare calculation
- ✅ Status transitions
- ✅ Client and courier interactions
- ✅ Order filtering and search
- ✅ Cancellation policies

### Error Handling Scenarios

- ✅ Invalid input validation
- ✅ Missing required fields
- ✅ Authentication failures
- ✅ Authorization failures
- ✅ Database constraint violations

## 📈 Coverage Goals

Target coverage metrics:

- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 95%+
- **Lines**: 90%+

## 🐛 Debugging Tests

### Running Individual Tests

```bash
# Run specific test file
npm run test:auth

# Run with verbose output
NODE_ENV=test jest tests/auth.test.js --verbose

# Run with debugging
NODE_ENV=test node --inspect-brk node_modules/.bin/jest tests/auth.test.js
```

### Database Debugging

```bash
# Connect to test database
psql -h localhost -U shipzy_user -d shipzy_test

# View test data
SELECT * FROM users.profiles WHERE user_id > 4;
```

### Common Issues

#### Database Connection

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify database connection
psql -U shipzy_user -d shipzy_test -c "SELECT 1;"
```

#### Test Dependencies

```bash
# Reinstall dependencies
npm install

# Check for missing peer dependencies
npm ls
```

## 🤝 Contributing

### Adding New Tests

1. Create test file in `tests/` directory
2. Follow existing naming conventions (`*.test.js`)
3. Include comprehensive test cases
4. Add setup and teardown as needed
5. Update this README

### Test Guidelines

- ✅ Test both success and failure scenarios
- ✅ Include edge cases and boundary conditions
- ✅ Test authentication and authorization
- ✅ Verify database state changes
- ✅ Test error handling
- ✅ Use descriptive test names
- ✅ Keep tests independent and isolated

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Fastify Testing Guide](https://www.fastify.io/docs/latest/Guides/Testing/)
- [PostgreSQL Testing](https://www.postgresql.org/docs/current/regress.html)

## 📞 Support

For test-related issues:

1. Check the test output for error details
2. Verify database connectivity
3. Review test configuration
4. Check for missing dependencies

Report issues with clear reproduction steps and expected vs actual behavior.
