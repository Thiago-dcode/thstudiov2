import { Injectable, BadRequestException } from '@nestjs/common';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { InvitationLink, PublicCreateInvitationLinkInput, UpdateInvitationLinkInput } from '@repo/common-lib/types/invitation-link';
import { generateUUID } from '@repo/common-lib/utils/generate-uuid';
import { addDays } from 'date-fns';
import { BenefitRepository } from '../benefits/benefit.repository';
import { InvitationLinkMail } from './mails/invitation-link.mail';
import { InvitationLinkRepository } from './invitation-link.repository';
import { IndexInvitationLinkRequest } from './requests/index-invitation-link.request';

@Injectable()
export class InvitationLinkService {
  constructor(
    private readonly invitationLinkRepository: InvitationLinkRepository,
    private readonly benefitRepository: BenefitRepository,
    private readonly mailService: MailService,
    private readonly invitationLinkMail: InvitationLinkMail,
  ) { }

  async findAll(filters: IndexInvitationLinkRequest) {
    return this.invitationLinkRepository.getAll(filters);
  }

  async findByCode(code: string) {
    const link = await this.invitationLinkRepository.findByCode(code);
    if (!link) {
      throw new BadRequestException('Invitation link not found');
    }
    return link;
  }

  async updateById(id: number, data: UpdateInvitationLinkInput) {
    return this.invitationLinkRepository.updateById(id, data);
  }

  async setExpiresAt(id: number, expiresAt: Date): Promise<InvitationLink> {
    return this.invitationLinkRepository.updateById(id, { expires_at: expiresAt });
  }

  async create({ benefit_type, active, days_to_expire, max_uses, email, language }: PublicCreateInvitationLinkInput, skipSendEmail = false) {
    const benefit = await this.benefitRepository.findByType(benefit_type);
    if (!benefit) {
      throw new BadRequestException(`Benefit type ${benefit_type} is not configured`);
    }

    const expiresAt = days_to_expire != null ? addDays(new Date(), days_to_expire) : null;

    const invitationLink = await this.invitationLinkRepository.create({
      active: active ?? true,
      benefit_id: benefit.id,
      email: email ?? null,
      language: language ?? null,
      expires_at: expiresAt,
      code: await generateUUID(),
      max_uses: max_uses ?? 1,
    });

    if (email && !skipSendEmail) {
      try {
        const result = await this.mailService.send(
          this.invitationLinkMail.setData(
            {
              email,
              benefitType: benefit.type,
              trialDays: benefit.trial_days,
              benefitMonths: Math.round(benefit.trial_days / 30),
              registrationUrl: `${getConfigValue('app').url}/auth/register?ref=${invitationLink.code}`,
              expiresInDays: days_to_expire,
            },
            language,
          ),
        );

        if (result == null) {
          throw new Error('Invitation email was not delivered');
        }
      } catch (error) {
        await this.invitationLinkRepository.deleteById(invitationLink.id);
        throw new BadRequestException(
          error instanceof Error ? error.message : 'Failed to send invitation email',
        );
      }
    }

    return invitationLink;
  }

  async validateCode(code: string): Promise<InvitationLink | null> {
    const link = await this.invitationLinkRepository.findByCode(code);
    if (!link) return null;
    if (!link.active) return null;
    if (link.max_uses !== null && link.current_uses >= link.max_uses) return null;
    if (link.expires_at && new Date(link.expires_at) < new Date()) return null;
    return link;
  }
}
