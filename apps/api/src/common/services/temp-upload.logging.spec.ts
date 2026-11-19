const mockUploadLog = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const privateStorage = { getUploadUrl: jest.fn() };

jest.mock('@repo/backend-lib/config/logging', () => {
  // Patch the real factories so backend-lib's internal loggers see the mock too.
  const actual = jest.requireActual('@repo/backend-lib/config/logging');
  const create = () => mockUploadLog;
  const factory = (service: string | null) => (overrides: Record<string, unknown> = {}) =>
    (create as (buffer: unknown, cfg: any) => unknown)(undefined, { service, ...overrides });
  // backend-lib's own import cycle (config/logging -> critical-alert-mail -> job-trace) re-enters
  // this factory before the module has finished loading; patch once `logService` exists.
  if (actual.logService) {
    Object.assign(actual.logService, {
      api: factory('api'), worker: factory('worker'), dbcli: factory('dbcli'), web: factory('web'), lib: factory(null),
    });
  }
  return actual;
});
jest.mock('@repo/backend-lib/config/storage', () => ({
  s3PrivateStorageConfig: () => ({ driver: 's3', bucket: 'private-bucket' }),
}));
jest.mock('@repo/backend-lib/services/storage-service', () => {
  // Patch the real class so backend-lib's internal imports see the mock too.
  const actual = jest.requireActual('@repo/backend-lib/services/storage-service');
  Object.assign(actual.FactoryStorageService, { create: () => privateStorage });
  return actual;
});
jest.mock('@repo/common-lib/utils/generate-uuid', () => ({
  generateUUID: async () => '11111111-1111-4111-8111-111111111111',
}));

import { TempUploadService } from './temp-upload.service';

const USER = '22222222-2222-4222-8222-222222222222';
const SIGNED = 'https://private-bucket.s3.amazonaws.com/uploads/x?X-Amz-Signature=SECRETSIGNATURE';

describe('TempUploadService logging', () => {
  beforeEach(() => {
    Object.values(mockUploadLog).forEach((fn) => fn.mockReset());
    privateStorage.getUploadUrl.mockReset().mockResolvedValue(SIGNED);
  });

  it('AC-33: "Upload URL issued" carries upload_id and size_bytes, never the URL or the user key', async () => {
    await new TempUploadService().createUploadUrl(USER, 4096);
    expect(mockUploadLog.info).toHaveBeenCalledTimes(1);
    const [message, extra] = mockUploadLog.info.mock.calls[0];
    expect(message).toBe('Upload URL issued');
    expect(extra).toEqual({ upload_id: '11111111-1111-4111-8111-111111111111', size_bytes: 4096 });
    const dumped = JSON.stringify(mockUploadLog.info.mock.calls);
    expect(dumped).not.toMatch(/SECRETSIGNATURE|amazonaws|private-bucket/);
    expect(dumped).not.toContain(USER);
  });
});
