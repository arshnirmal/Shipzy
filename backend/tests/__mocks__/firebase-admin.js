// Mock for firebase-admin
const mockVerifyIdToken = jest.fn();

console.log('Firebase mock loaded!');

// Make it globally available for tests
global.mockVerifyIdToken = mockVerifyIdToken;

const firebaseAdmin = {
  auth: jest.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
  credential: {
    cert: jest.fn(),
  },
  apps: [],
  initializeApp: jest.fn(),
};

export default firebaseAdmin;
