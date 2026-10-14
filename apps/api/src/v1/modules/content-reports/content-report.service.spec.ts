jest.mock('@repo/common-lib/config/utils', () => ({
  getConfigValue: (key: string) => (key === 'app' ? { url: 'https://a11studio.com' } : {}),
}));

import { BadRequestException } from '@nestjs/common';
import { ContentReportService } from './content-report.service';

describe('ContentReportService', () => {
  const repository = { create: jest.fn() };
  const mailService = { sendAsync: jest.fn() };
  const adminMail = { setReport: jest.fn((report) => ({ admin: report.id })) };
  const receivedMail = { setReport: jest.fn((report, lang) => ({ received: report.id, lang })) };
  const requestService = { language: 'ES' };
  const logger = { info: jest.fn() };

  const service = new ContentReportService(
    repository as never,
    mailService as never,
    adminMail as never,
    receivedMail as never,
    requestService as never,
    logger as never,
  );

  const request = {
    reported_url: 'https://www.a11studio.com/artists/someone',
    reason: 'INTELLECTUAL_PROPERTY' as const,
    explanation: 'This is my photograph, published without my permission.',
    reporter_name: null,
    reporter_email: 'owner@example.com',
    good_faith: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.create.mockImplementation(async (data) => ({
      id: 42,
      status: 'RECEIVED',
      created_at: new Date('2026-10-14T10:00:00Z'),
      ...data,
    }));
  });

  it('stores the notice, alerts the admins and confirms receipt in the visitor language', async () => {
    const result = await service.create(request);

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ reported_url: request.reported_url, reporter_email: 'owner@example.com' }),
    );
    expect(mailService.sendAsync).toHaveBeenCalledTimes(2);
    expect(receivedMail.setReport).toHaveBeenCalledWith(expect.objectContaining({ id: 42 }), 'ES');
    // The response is public: never echo the stored notice.
    expect(result).toEqual({ id: 42, created_at: new Date('2026-10-14T10:00:00Z') });
  });

  it('only alerts the admins for an anonymous notice', async () => {
    await service.create({ ...request, reporter_email: null });

    expect(mailService.sendAsync).toHaveBeenCalledTimes(1);
    expect(receivedMail.setReport).not.toHaveBeenCalled();
  });

  it('rejects a URL that is not on this site, before storing anything', async () => {
    await expect(
      service.create({ ...request, reported_url: 'https://evil.example/artists/x' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    // A look-alike host must not pass either.
    await expect(
      service.create({ ...request, reported_url: 'https://a11studio.com.evil.example/x' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
