const mockLog = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
jest.mock('../../../config/logging', () => {
  const actual = jest.requireActual('../../../config/logging');
  // Every factory hands its service and overrides to one mock, as the real ones build one config.
  const create = () => mockLog;
  const factory = (service: string | null) => (overrides: Record<string, unknown> = {}) =>
    (create as (buffer: unknown, cfg: any) => unknown)(undefined, { service, ...overrides });
  return {
    ...actual,
    logService: { api: factory('api'), worker: factory('worker'), dbcli: factory('dbcli'), web: factory('web'), lib: factory(null) },
  };
});

import { S3StorageService } from '../s3-storage.service';

const build = () => {
  const storage = new S3StorageService({
    driver: 's3',
    bucket: 'media-bucket',
    region: 'us-east-1',
    accessKeyId: 'AKIASECRETACCESS',
    secretAccessKey: 'SECRETKEYVALUE',
    signedUrlExpiration: 3600,
  });
  const send = jest.fn().mockResolvedValue({});
  (storage as unknown as { s3Client: { send: jest.Mock } }).s3Client = { send };
  return { storage, send };
};

const awsError = (name = 'AccessDenied', status = 403) =>
  Object.assign(new Error('Access Denied'), {
    name,
    $metadata: { httpStatusCode: status, requestId: 'AWSREQ1' },
  });

describe('S3StorageService logging', () => {
  beforeEach(() => {
    Object.values(mockLog).forEach((fn) => fn.mockReset());
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-31: a rejecting delete returns false and logs "Storage delete failed" with bucket, key and error_name', async () => {
    const { storage, send } = build();
    send.mockRejectedValue(awsError());
    await expect(storage.delete('users/u/a.webp')).resolves.toBe(false);
    expect(mockLog.error).toHaveBeenCalledTimes(1);
    const [message, extra, fields] = mockLog.error.mock.calls[0];
    expect(message).toBe('Storage delete failed');
    expect(extra).toMatchObject({ bucket: 'media-bucket', key: 'users/u/a.webp', error_name: 'AccessDenied' });
    expect(typeof extra.duration_ms).toBe('number');
    expect(fields).toEqual({ operation: 'delete' });
  });

  it('AC-31: AWS status and request id are captured when present', async () => {
    const { storage, send } = build();
    send.mockRejectedValue(awsError('NoSuchBucket', 404));
    await storage.delete('k');
    expect(mockLog.error.mock.calls[0][1]).toMatchObject({ http_status: 404, aws_request_id: 'AWSREQ1' });
  });

  it('AC-31: a successful delete writes no line', async () => {
    const { storage } = build();
    await expect(storage.delete('k')).resolves.toBe(true);
    for (const fn of Object.values(mockLog)) expect(fn).not.toHaveBeenCalled();
  });

  it('AC-31: deleteDirectory over 2 pages logs one "Storage directory deleted" {objects_deleted, batches:2}', async () => {
    const { storage, send } = build();
    send
      .mockResolvedValueOnce({ Contents: [{ Key: 'p/1' }, { Key: 'p/2' }], IsTruncated: true, NextContinuationToken: 't' })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ Contents: [{ Key: 'p/3' }], IsTruncated: false })
      .mockResolvedValueOnce({});
    await expect(storage.deleteDirectory('p/')).resolves.toBe(true);
    expect(mockLog.info).toHaveBeenCalledTimes(1);
    const [message, extra, fields] = mockLog.info.mock.calls[0];
    expect(message).toBe('Storage directory deleted');
    expect(extra).toMatchObject({ bucket: 'media-bucket', prefix: 'p/', objects_deleted: 3, batches: 2 });
    expect(fields).toEqual({ operation: 'delete-directory' });
  });

  it('AC-31: deleteDirectory failing returns false with an error line and the partial counts', async () => {
    const { storage, send } = build();
    send.mockRejectedValue(awsError());
    await expect(storage.deleteDirectory('p/')).resolves.toBe(false);
    expect(mockLog.error).toHaveBeenCalledTimes(1);
    expect(mockLog.error.mock.calls[0][0]).toBe('Storage directory delete failed');
    expect(mockLog.error.mock.calls[0][1]).toMatchObject({ prefix: 'p/', objects_deleted: 0, batches: 0, error_name: 'AccessDenied' });
    expect(mockLog.info).not.toHaveBeenCalled();
  });

  it('AC-31: a rejecting write logs "Storage write failed" and rethrows', async () => {
    const { storage, send } = build();
    const failure = awsError('InternalError', 500);
    send.mockRejectedValue(failure);
    await expect(storage.write(Buffer.from('x'), 'users/u/b.webp')).rejects.toBe(failure);
    expect(mockLog.error).toHaveBeenCalledTimes(1);
    expect(mockLog.error.mock.calls[0][0]).toBe('Storage write failed');
    expect(mockLog.error.mock.calls[0][1]).toMatchObject({ key: 'users/u/b.webp', http_status: 500 });
  });

  it('AC-31: messages are constants and no line carries credentials or the object body', async () => {
    const { storage, send } = build();
    send.mockRejectedValue(awsError());
    await storage.delete('k1');
    await storage.deleteDirectory('p/');
    await storage.write(Buffer.from('SECRETBODY'), 'k2').catch(() => undefined);
    const dumped = JSON.stringify(mockLog.error.mock.calls);
    expect(dumped).not.toMatch(/AKIASECRETACCESS|SECRETKEYVALUE|SECRETBODY/);
    for (const call of mockLog.error.mock.calls) expect(call[0]).not.toMatch(/users\/|k1|k2|p\//);
  });
});
