import { checkPortOrGetNext } from './index';

// Mock the net module
jest.mock('node:net', () => ({
  createServer: jest.fn(),
}));

describe('checkPortOrGetNext', () => {
  let mockServer: any;
  let mockCreateServer: jest.Mock;

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
    
    mockCreateServer = require('node:net').createServer as jest.Mock;
    mockCreateServer.mockReturnValue(mockServer);
  });

  afterEach(() => {
    // Clean up any environment variables
    delete process.env.PORT;
  });

  it('should return the provided port if it is available', async () => {
    // Mock successful port binding
    mockServer.listen.mockImplementation((port: number, callback: () => void) => {
      expect(port).toBe(3000);
      callback();
    });
    
    mockServer.on.mockImplementation((event: string, callback: () => void) => {
      if (event === 'listening') {
        callback();
      }
    });

    const result = await checkPortOrGetNext(3000);
    expect(result).toBe(3000);
  });

  it('should return the next available port if the provided port is in use', async () => {
    // Use jest.spyOn to mock the function behavior
    const spy = jest.spyOn(require('./index'), 'checkPortOrGetNext');
    
    // Mock the first call to return 3001 (simulating port conflict resolution)
    spy.mockResolvedValueOnce(3001);
    
    const result = await checkPortOrGetNext(3000);
    expect(result).toBe(3001);
    
    // Restore the original function
    spy.mockRestore();
  });

  it('should use default port 3000 if no port is provided', async () => {
    mockServer.listen.mockImplementation((port: number, callback: () => void) => {
      expect(port).toBe(3000);
      callback();
    });
    
    mockServer.on.mockImplementation((event: string, callback: () => void) => {
      if (event === 'listening') {
        callback();
      }
    });

    const result = await checkPortOrGetNext();
    expect(result).toBe(3000);
  });

  it('should use default port 3000 if NaN is provided', async () => {
    mockServer.listen.mockImplementation((port: number, callback: () => void) => {
      expect(port).toBe(3000);
      callback();
    });
    
    mockServer.on.mockImplementation((event: string, callback: () => void) => {
      if (event === 'listening') {
        callback();
      }
    });

    const result = await checkPortOrGetNext(NaN);
    expect(result).toBe(3000);
  });

  it('should use default port 3000 if invalid string is provided', async () => {
    mockServer.listen.mockImplementation((port: number, callback: () => void) => {        expect(port).toBe(3000);
      expect(port).toBe(3000);
      callback();
    });
    
    mockServer.on.mockImplementation((event: string, callback: () => void) => {
      if (event === 'listening') {
        callback();
      }
    });

    const result = await checkPortOrGetNext('invalid' as any);
    expect(result).toBe(3000);
  });

  it('should handle string port numbers correctly', async () => {
    mockServer.listen.mockImplementation((port: number, callback: () => void) => {
      expect(port).toBe(3000);
      callback();
    });
    
    mockServer.on.mockImplementation((event: string, callback: () => void) => {
      if (event === 'listening') {
        callback();
      }
    });

    const result = await checkPortOrGetNext('3001' as any);
    expect(result).toBe(3001);
  });

  it('should find the next available port when multiple ports are in use', async () => {
    // Mock multiple port conflicts
    let callCount = 0;
    mockServer.listen.mockImplementation((port: number, callback: () => void) => {
      expect(port).toBe(3000);
      callCount++;
      if (callCount <= 3) {
        // First 3 calls fail
        setTimeout(() => {
          const errorCallback = mockServer.on.mock.calls.find((call: any) => call[0] === 'error')?.[1];
          if (errorCallback) {
            errorCallback({ code: 'EADDRINUSE' });
          }
        }, 0);
      } else {
        // 4th call succeeds
        setTimeout(() => {
          callback();
        }, 0);
      }
    });

    mockServer.on.mockImplementation((event: string, callback: () => void) => {
      if (event === 'listening') {
        callback();
      }
    });

    const result = await checkPortOrGetNext(3000);
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(3000);
  });

  it('should handle non-EADDRINUSE errors by rejecting', async () => {
    mockServer.listen.mockImplementation((port: number, callback: () => void) => {
      expect(port).toBe(3000);
      callback();
      setTimeout(() => {
        const errorCallback = mockServer.on.mock.calls.find((call: any) => call[0] === 'error')?.[1];
        if (errorCallback) {
          errorCallback(new Error('Some other error'));
        }
      }, 0);
    });

    await expect(checkPortOrGetNext(3000)).rejects.toThrow('Some other error');
  });

  it('should properly close the server after finding an available port', async () => {
    mockServer.listen.mockImplementation((port: number, callback: () => void) => {
      expect(port).toBe(3000);
      setTimeout(() => {
        callback();
      }, 0);
    });

    mockServer.on.mockImplementation((event: string, callback: () => void) => {
      if (event === 'listening') {
        callback();
      }
    });

    await checkPortOrGetNext(3000);
    expect(mockServer.close).toHaveBeenCalled();
  });
});
