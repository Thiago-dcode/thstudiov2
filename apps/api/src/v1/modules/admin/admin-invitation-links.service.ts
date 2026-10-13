import { BadRequestException, Injectable } from '@nestjs/common';
import { PublicCreateInvitationLinkInput } from '@repo/common-lib/types/invitation-link';
import { InvitationLinkService } from '../invitation-links/invitation-link.service';
import { WaitListService } from '../wait-list/wait-list.service';

/**
 * Admin-created invitation links. Kept apart from InvitationLinkService.create, which the wait-list
 * processor also uses to invite its own validated entries — that path must not hit these checks.
 */
@Injectable()
export class AdminInvitationLinksService {
  constructor(
    private readonly invitationLinkService: InvitationLinkService,
    private readonly waitListService: WaitListService,
  ) { }

  async create(input: PublicCreateInvitationLinkInput) {
    // "Already a registered user" is enforced by the request DTO (ModelNotExist on users.email).
    if (input.email) await this.assertNotOnWaitList(input.email);
    return this.invitationLinkService.create(input);
  }

  /**
   * A validated, unexpired wait-list entry already has its place (and its invite comes from the
   * wait list); a manual link would let it skip the line or end up with two invitations. Same rule
   * register uses to reserve those emails.
   */
  private async assertNotOnWaitList(email: string) {
    const entry = await this.waitListService.findByEmail(email);
    if (!entry?.validated_at) return;
    const expired = entry.expires_at ? new Date(entry.expires_at).getTime() <= Date.now() : false;
    if (expired) return;
    throw new BadRequestException(
      'This email is on the wait list (confirmed). Invite it from the wait list instead.',
    );
  }
}
