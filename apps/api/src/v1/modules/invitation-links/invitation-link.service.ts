import { Injectable, BadRequestException } from '@nestjs/common';
import { InvitationLinkRepository } from './invitation-link.repository';
import { InvitationLink, PublicCreateInvitationLinkInput, UpdateInvitationLinkInput } from '@repo/common-lib/types/invitation-link';
import { IndexInvitationLinkRequest } from './requests/index-invitation-link.request';
import { generateUUID } from '@repo/common-lib/utils/generate-uuid';

@Injectable()
export class InvitationLinkService {
  constructor(
    private readonly invitationLinkRepository: InvitationLinkRepository,
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

  async create({ benefit_id, active, expire_at, max_uses }: PublicCreateInvitationLinkInput) {
    return this.invitationLinkRepository.create({

      active: active || true,
      benefit_id,
      expires_at: expire_at || null,
      code: await generateUUID(),
      max_uses: max_uses || 1
    });
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
