import { DEFAULT_DATABASE_SETTINGS } from "../constants/constants";
import { DatabaseConfig, FullDatabaseConfig, DatabaseClient } from "../constants/types/database";

const Client = (config: FullDatabaseConfig) => {
  return {
    _config: config,
    connect: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue([]),
    set config(config: FullDatabaseConfig) {
      this._config = config;
    },
    get config() {
      return this._config;
    },
  };
};


// Factory function for Jest mock that can be used directly in jest.mock()
export const createClientMock = () => {
  const Client = (config: FullDatabaseConfig) => {
    return {
      _config: config,
      connect: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([]),
      set config(config: FullDatabaseConfig) {
        this._config = config;
      },
      get config() {
        return this._config;
      },
    };
  };
  
  let mockClient: any = null;
  let currentClientType: DatabaseClient | null = null;

  return {
    __esModule: true,
    initClient: jest.fn(async (config: DatabaseConfig) => {
      config.settings = {
        ...DEFAULT_DATABASE_SETTINGS,
        ...config?.settings,
      };
      const fullConfig: FullDatabaseConfig = {
        ...config,
        settings: {
          ...DEFAULT_DATABASE_SETTINGS,
          ...config?.settings,
        },
      };
      if (mockClient && mockClient.config.client === config.client) {
        mockClient.config = fullConfig;
        return mockClient;
      }
      switch (config.client) {
        case 'postgres':
          mockClient = Client(fullConfig);
          currentClientType = 'postgres';
          break;
        case 'mysql':
          mockClient = Client(fullConfig);
          currentClientType = 'mysql';
          break;
      }
      return mockClient;
    }),
    getClient: jest.fn(() => {
      return mockClient;
    }),
    getClientConfig: jest.fn(() => {
      return currentClientType;
    }),
    connect: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue([]),
    killClient: jest.fn(async () => {
      mockClient = null;
      currentClientType = null;
    }),
  };
};

// Default export for easier importing
export default createClientMock;