jest.mock('@repo/common-lib/utils/generate-uuid', () => ({ generateUUID: jest.fn(async () => 'uuid') }));

import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AdminInvitationLinksService } from './admin-invitation-links.service';
import { InvitationLinkService } from '../invitation-links/invitation-link.service';
import { WaitListService } from '../wait-list/wait-list.service';

describe('AdminInvitationLinksService', () => {
  let service: AdminInvitationLinksService;
  const invitationLinkService = { create: jest.fn() };
  const waitListService = { findByEmail: jest.fn() };
  const input = { benefit_type: 'EARLY_USER', email: 'ana@example.com' } as never;
  const day = 24 * 60 * 60 * 1000;

  beforeEach(async () => {
    jest.resetAllMocks();
    invitationLinkService.create.mockResolvedValue({ id: 1 });
    const module = await Test.createTestingModule({
      providers: [
        AdminInvitationLinksService,
        { provide: InvitationLinkService, useValue: invitationLinkService },
        { provide: WaitListService, useValue: waitListService },
      ],
    }).compile();
    service = module.get(AdminInvitationLinksService);
  });

  it('refuses an email with a confirmed, unexpired wait-list entry', async () => {
    waitListService.findByEmail.mockResolvedValue({ validated_at: new Date(), expires_at: null });
    await expect(service.create(input)).rejects.toBeInstanceOf(BadRequestException);
    expect(invitationLinkService.create).not.toHaveBeenCalled();
  });

  it.each([
    ['not on the wait list', null],
    ['on the wait list but never confirmed', { validated_at: null, expires_at: null }],
    ['confirmed but its wait-list invite expired', { validated_at: new Date(), expires_at: new Date(Date.now() - day) }],
  ])('creates the link when the email is %s', async (_label, entry) => {
    waitListService.findByEmail.mockResolvedValue(entry);
    await expect(service.create(input)).resolves.toEqual({ id: 1 });
    expect(invitationLinkService.create).toHaveBeenCalledWith(input);
  });

  it('skips the wait-list lookup for a link without an email', async () => {
    await service.create({ benefit_type: 'EARLY_USER' } as never);
    expect(waitListService.findByEmail).not.toHaveBeenCalled();
    expect(invitationLinkService.create).toHaveBeenCalled();
  });
});
