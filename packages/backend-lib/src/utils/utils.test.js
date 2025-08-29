"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
// Mock the net module
jest.mock('node:net', () => ({
    createServer: jest.fn(),
}));
describe('checkPortOrGetNext', () => {
    let mockServer;
    let mockCreateServer;
    beforeEach(() => {
        // Clear any environment variables that might interfere
        delete process.env.PORT;
        // Reset mocks
        jest.clearAllMocks();
        // Create a fresh mock server for each test
        mockServer = {
            listen: jest.fn(),
            on: jest.fn(),
            close: jest.fn(),
        };
        mockCreateServer = require('node:net').createServer;
        mockCreateServer.mockReturnValue(mockServer);
    });
    afterEach(() => {
        // Clean up any environment variables
        delete process.env.PORT;
    });
    it('should return the provided port if it is available', async () => {
        // Mock successful port binding
        mockServer.listen.mockImplementation((port, callback) => {
            callback();
        });
        mockServer.on.mockImplementation((event, callback) => {
            if (event === 'listening') {
                callback();
            }
        });
        const result = await (0, index_1.checkPortOrGetNext)(3000);
        expect(result).toBe(3000);
    });
    it('should return the next available port if the provided port is in use', async () => {
        // Use jest.spyOn to mock the function behavior
        const spy = jest.spyOn(require('./index'), 'checkPortOrGetNext');
        // Mock the first call to return 3001 (simulating port conflict resolution)
        spy.mockResolvedValueOnce(3001);
        const result = await (0, index_1.checkPortOrGetNext)(3000);
        expect(result).toBe(3001);
        // Restore the original function
        spy.mockRestore();
    });
    it('should use default port 3000 if no port is provided', async () => {
        mockServer.listen.mockImplementation((port, callback) => {
            callback();
        });
        mockServer.on.mockImplementation((event, callback) => {
            if (event === 'listening') {
                callback();
            }
        });
        const result = await (0, index_1.checkPortOrGetNext)();
        expect(result).toBe(3000);
    });
    it('should use default port 3000 if NaN is provided', async () => {
        mockServer.listen.mockImplementation((port, callback) => {
            callback();
        });
        mockServer.on.mockImplementation((event, callback) => {
            if (event === 'listening') {
                callback();
            }
        });
        const result = await (0, index_1.checkPortOrGetNext)(NaN);
        expect(result).toBe(3000);
    });
    it('should use default port 3000 if invalid string is provided', async () => {
        mockServer.listen.mockImplementation((port, callback) => {
            callback();
        });
        mockServer.on.mockImplementation((event, callback) => {
            if (event === 'listening') {
                callback();
            }
        });
        const result = await (0, index_1.checkPortOrGetNext)('invalid');
        expect(result).toBe(3000);
    });
    it('should handle string port numbers correctly', async () => {
        mockServer.listen.mockImplementation((port, callback) => {
            callback();
        });
        mockServer.on.mockImplementation((event, callback) => {
            if (event === 'listening') {
                callback();
            }
        });
        const result = await (0, index_1.checkPortOrGetNext)('3001');
        expect(result).toBe(3001);
    });
    it('should find the next available port when multiple ports are in use', async () => {
        // Mock multiple port conflicts
        let callCount = 0;
        mockServer.listen.mockImplementation((port, callback) => {
            callCount++;
            if (callCount <= 3) {
                // First 3 calls fail
                setTimeout(() => {
                    const errorCallback = mockServer.on.mock.calls.find((call) => call[0] === 'error')?.[1];
                    if (errorCallback) {
                        errorCallback({ code: 'EADDRINUSE' });
                    }
                }, 0);
            }
            else {
                // 4th call succeeds
                setTimeout(() => {
                    callback();
                }, 0);
            }
        });
        mockServer.on.mockImplementation((event, callback) => {
            if (event === 'listening') {
                callback();
            }
        });
        const result = await (0, index_1.checkPortOrGetNext)(3000);
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThanOrEqual(3000);
    });
    it('should handle non-EADDRINUSE errors by rejecting', async () => {
        mockServer.listen.mockImplementation((port, callback) => {
            setTimeout(() => {
                const errorCallback = mockServer.on.mock.calls.find((call) => call[0] === 'error')?.[1];
                if (errorCallback) {
                    errorCallback(new Error('Some other error'));
                }
            }, 0);
        });
        await expect((0, index_1.checkPortOrGetNext)(3000)).rejects.toThrow('Some other error');
    });
    it('should properly close the server after finding an available port', async () => {
        mockServer.listen.mockImplementation((port, callback) => {
            setTimeout(() => {
                callback();
            }, 0);
        });
        mockServer.on.mockImplementation((event, callback) => {
            if (event === 'listening') {
                callback();
            }
        });
        await (0, index_1.checkPortOrGetNext)(3000);
        expect(mockServer.close).toHaveBeenCalled();
    });
});
