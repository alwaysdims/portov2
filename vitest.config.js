import { discoverTests } from './tools/test.mjs';

// node:test suites run separately via npm test; never load them into Vitest.
export default {
  test: {
    include: discoverTests().vitest,
    environment: 'node',
  },
};
