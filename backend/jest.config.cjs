// jest.config.cjs
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.{js,ts}", "**/tests/**/*.spec.{js,ts}"],
  collectCoverageFrom: [
    "src/**/*.{js,ts}",
    "!src/server.ts",
    "!src/config/**",
    "!src/database/**",
    "!**/node_modules/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html", "json-summary"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true,
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.(ts|js)$": ["ts-jest", {
      useESM: true,
      tsconfig: "tsconfig.json"
    }]
  },
  transformIgnorePatterns: ["node_modules/(?!(.*\\.mjs$))"],
  testPathIgnorePatterns: ["/node_modules/", "/coverage/"],
};
