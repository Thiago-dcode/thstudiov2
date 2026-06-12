import { nestConfig } from '@repo/jest-config/nest';
import type { Config } from 'jest';

const config: Config = {
  ...nestConfig,
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
