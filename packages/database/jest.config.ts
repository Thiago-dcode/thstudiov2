import type { Config } from 'jest';
import { baseConfig } from '@repo/jest-config/base';

const config: Config = {
  ...baseConfig,
  rootDir: '.',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.d.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
};

export default config;
