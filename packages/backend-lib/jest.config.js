"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("@repo/jest-config/base");
const config = {
    ...base_1.baseConfig,
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
exports.default = config;
