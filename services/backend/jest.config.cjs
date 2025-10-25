// jest.config.js
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js", "**/tests/**/*.spec.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/config/**",
    "!src/database/**",
    "!**/node_modules/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html", "json-summary"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true,
  transformIgnorePatterns: ["node_modules/(?!(.*\\.mjs$))"],
  testPathIgnorePatterns: ["/node_modules/", "/coverage/"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {},
};
