module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 30000,
  // Each suite spins up its own in-memory MongoDB, so the default worker count
  // (one per core) starves them on smaller machines — suites then fail with
  // timeouts or get OOM-killed, which reads as a flaky test rather than
  // resource exhaustion. `npm test` additionally passes --runInBand.
  maxWorkers: 2,
  verbose: true,
};
