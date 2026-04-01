---
paths:
  - "services/backend/tests/**"
  - "apps/user/test/**"
  - "apps/driver/test/**"
---

# Testing Conventions

## Backend (Jest + Supertest)

### Test File Structure

- Location: `services/backend/tests/<module>/<module>.test.js`
- Naming: `describe('<Module>')` → `describe('<endpoint method> <path>')` → `it('should <expected behavior>')`
- Example: `describe('Orders') → describe('POST /orders') → it('should return 201 and order object for valid client')`

### Test Database

Always use the isolated test database — NEVER the dev database:
```bash
npm run test:db:setup    # Run before first test in a session
npm run test:db:cleanup  # Run after tests to reset state
```

### Firebase Mocking

- NEVER hit real Firebase in tests — mock the Firebase Admin SDK
- Mock strategy: intercept `firebase-admin.auth().verifyIdToken()` to return a controlled user object
- Use `jest.mock()` at the top of test files that exercise auth endpoints

### Coverage Requirements

Every new endpoint must have tests for:
- ✅ Happy path (valid input, correct role, expected response shape)
- ✅ Unauthorized (missing token, expired token, wrong role)
- ✅ Validation failure (missing required fields, wrong types)
- ✅ Not found (resource doesn't exist)
- ✅ Business rule violation (e.g., cancelling an already-delivered order)

### Test Data

- Use `npm run test:db:seed` to populate known test fixtures
- Never depend on test order — each test must set up its own required state
- Clean up created resources in `afterEach` or `afterAll`

## Flutter (flutter_test)

- Unit test BLoC logic: emit events → verify expected state sequence
- Widget tests: mock all repositories — NEVER call real API from widget tests
- Test all 4 BLoC states: `Initial`, `Loading`, `Loaded`, `Error`
- Run `flutter analyze` before running tests — fix all lint issues first
