import type { Config } from 'jest';
import { baseConfig } from '@repo/jest-config/base';

const config: Config = {
  ...baseConfig,
  rootDir: '.',
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@lib/(.*)$": "<rootDir>/src/lib/$1",
    "^lib/(.*)$": "<rootDir>/src/lib/$1",
    "database": "<rootDir>/src/lib/database"
  },
  testEnvironment: "node",
  testRegex: "(/tests/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!@foo)"
  ]
};

export default config;
