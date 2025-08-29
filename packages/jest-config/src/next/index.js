"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextConfig = void 0;
const base_1 = require("../base");
exports.nextConfig = {
    ...base_1.baseConfig,
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@repo/(.*)$': '<rootDir>/../../../packages/$1/src',
    },
    transform: {
        '^.+\\.(t|j)s$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.json',
                useESM: false,
            },
        ],
    },
    collectCoverageFrom: [
        'src/**/*.(t|j)s',
        '!src/**/*.d.ts',
        '!src/**/*.spec.ts',
        '!src/**/*.test.ts',
        '!src/main.ts',
        '!src/**/index.ts',
    ],
    coverageDirectory: '<rootDir>/coverage',
    setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'],
    moduleFileExtensions: ['js', 'json', 'ts'],
    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/tsconfig.json',
        },
    },
};
