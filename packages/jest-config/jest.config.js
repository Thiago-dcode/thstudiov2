"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    verbose: true,
    clearMocks: true,
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: [
        '**/*.(t|j)s',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/dist/**',
        '!**/coverage/**',
        '!**/*.config.*',
        '!**/jest.config.*',
        '!**/test/**',
    ],
    coverageDirectory: 'coverage',
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/coverage/',
        '/.turbo/',
        '/test/',
    ],
    modulePathIgnorePatterns: [
        '<rootDir>/dist/',
        '<rootDir>/coverage/',
        '<rootDir>/.turbo/',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@repo/(.*)$': '<rootDir>/../$1/src',
    },
    setupFilesAfterEnv: [],
    testTimeout: 30000,
    maxWorkers: '50%',
};
exports.default = config;
