import { InjectQueue, Processor } from '@nestjs/bullmq';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import {
  CREATE_WAIT_LIST_ENTRY,
  INVITE_WAIT_LIST_BATCH,
  JOB_CREATE_WAIT_LIST_ENTRY,
  JOB_INVITE_WAIT_LIST_BATCH,
  WAIT_LIST_QUEUE,
} from '@repo/common-lib/constants/constants';
import { EnumType } from '@repo/common-lib/constants/enums';
import type { InvitationLink } from '@repo/common-lib/types/invitation-link';
import { PublicCreateWaitListInput } from '@repo/common-lib/types/wait-list';
import { generateUUID } from '@repo/common-lib/utils/generate-uuid';
import { Job, Queue } from 'bullmq';
import { addDays } from 'date-fns';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { BenefitRepository } from '../benefits/benefit.repository';
import { InvitationLinkService } from '../invitation-links/invitation-link.service';
import { CreateWaitListEvent } from './events/create-wait-list.event';
import { InviteWaitListBatchEvent } from './events/invite-wait-list-batch.event';
import { WaitListInviteMail } from './mails/wait-list-invite.mail';
import { WaitListWelcomeMail } from './mails/wait-list-welcome.mail';
import { WaitListRepository } from './wait-list.repository';
import type { WaitList } from '@repo/common-lib/types/wait-list';

type PreparedWaitListInvite = {
  entry: WaitList;
  invitationLink: InvitationLink;
  mailable: WaitListWelcomeMail;
};

@Processor(WAIT_LIST_QUEUE)
export class WaitListProcessor extends GlobalProcessor {
  private static readonly INVITATION_EXPIRES_IN_DAYS = 7;

  private readonly logger = FactoryLogService.createLogService('file', {
    channel: WAIT_LIST_QUEUE,
  });

  constructor(
    private readonly waitListRepository: WaitListRepository,
    private readonly invitationLinkService: InvitationLinkService,
    private readonly benefitRepository: BenefitRepository,
    private readonly mailService: MailService,
    private readonly waitListInviteMail: WaitListInviteMail,
    private readonly waitListWelcomeMail: WaitListWelcomeMail,
    @InjectQueue(WAIT_LIST_QUEUE) private readonly waitListQueue: Queue,
    private readonly appLogService: LogService,
  ) {
    super();
  }

  @OnEvent(CREATE_WAIT_LIST_ENTRY)
  async handleCreateWaitListEvent(event: CreateWaitListEvent) {
    try {
      await this.waitListQueue.add(
        JOB_CREATE_WAIT_LIST_ENTRY,
        event.data,
        {
          jobId: `wait-list-create-${encodeURIComponent(this.normalizeEmail(event.data.email))}`,
          priority: 10,
          removeOnComplete: true,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        },
      );
    } catch (error) {
      // BullMQ throws when the same `jobId` is already present.
      // We treat that as a no-op because the processor logic is idempotent
      // (unique wait-list email + throttling by `invitation_email_sent_at`).
      const message = error instanceof Error ? error.message : String(error);
      const lower = message.toLowerCase();
      if (lower.includes('job') && (lower.includes('already') || lower.includes('exists') || lower.includes('exist'))) {
        return;
      }
      throw error;
    }
  }

  @OnEvent(INVITE_WAIT_LIST_BATCH)
  async handleInviteWaitListBatchEvent(event: InviteWaitListBatchEvent) {
    await this.waitListQueue.add(
      JOB_INVITE_WAIT_LIST_BATCH,
      { count: event.count },
      {
        priority: 10,
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }

  async process(job: Job): Promise<unknown> {
    try {
      switch (job.name) {
        case JOB_CREATE_WAIT_LIST_ENTRY:
          return await this.createWaitListEntry(job.data);

        case JOB_INVITE_WAIT_LIST_BATCH:
          return await this.inviteWaitListBatch(job.data);

        default:
          throw new Error(`Job name "${job.name}" not recognized`);
      }
    } finally {
      await this.appLogService.flushAsync();
    }
  }

  private async createWaitListEntry(data: PublicCreateWaitListInput) {
    const log = this.logger.name(JOB_CREATE_WAIT_LIST_ENTRY);
    const normalizedEmail = this.normalizeEmail(data.email);
    const emailLog = this.redactEmail(normalizedEmail);

    try {
      let waitList = await this.waitListRepository.findByEmail(normalizedEmail);

      if (!waitList) {
        try {
          waitList = await this.waitListRepository.create({
            email: normalizedEmail,
            token: await generateUUID(),
            position: null,
            status: 'WAITING',
            redeemed_at: null,
            expires_at: null,
            validated_at: null,
            invitation_link_id: null,
            invitation_email_sent_at: null,
            welcome_email_sent_at: null,
            last_reminder_email_sent_at: null,
            reminder_count: 0,
          });
        } catch (error) {
          if (!this.isUniqueEmailError(error)) {
            throw error;
          }

          waitList = await this.waitListRepository.findByEmail(normalizedEmail);
          if (!waitList) {
            throw error;
          }
        }
      }

      if (waitList.validated_at) {
        return waitList;
      }

      const ONE_HOUR_MS = 60 * 60 * 1000;
      if (
        waitList.invitation_email_sent_at
        && Date.now() - new Date(waitList.invitation_email_sent_at).getTime() < ONE_HOUR_MS
      ) {
        log.info(`Skipping wait-list validation email (sent recently): ${emailLog}`, { email: emailLog });
        return waitList;
      }

      await this.mailService.sendAsync(
        this.waitListInviteMail.setData({
          email: waitList.email,
          validationUrl: `${getConfigValue('app').url}/wait-list/${waitList.token}`,
        }),
        {
          jobId: `wait-list-validate-${waitList.id}`,
        },
      );

      await this.waitListRepository.updateById(waitList.id, {
        invitation_email_sent_at: new Date(),
      });

      log.info(`Wait list entry created: ${emailLog}`, { email: emailLog });

      return waitList;
    } catch (error) {
      log.error(
        `Failed to create wait list entry: ${emailLog} - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  private async inviteWaitListBatch(data: { count: number }) {
    const log = this.logger.name(JOB_INVITE_WAIT_LIST_BATCH);
    const count = Math.floor(Number(data.count));

    if (!Number.isFinite(count) || count <= 0) {
      log.warn(`Invalid wait list invite batch count: ${data.count}`);
      return { invited: 0 };
    }

    try {
      const entries = await this.waitListRepository.claimWaitingBatch(count);

      if (!entries.length) {
        log.info('No waiting wait list entries found for batch invite.');
        return { invited: 0 };
      }

      const expiresAt = addDays(new Date(), WaitListProcessor.INVITATION_EXPIRES_IN_DAYS);
      const appUrl = getConfigValue('app').url;

      // Memoize benefit lookups per batch: each benefit type is fetched at most once.
      const benefitTypes = new Set<EnumType<'BENEFIT_TYPE'>>();
      for (const entry of entries) {
        if (entry.position !== null) {
          benefitTypes.add(this.getBenefitTypeForPosition(entry.position));
        }
      }

      const uniqueBenefitTypes = Array.from(benefitTypes);
      const benefitList = await Promise.all(
        uniqueBenefitTypes.map((type) => this.benefitRepository.findByType(type)),
      );
      const benefitByType = new Map<EnumType<'BENEFIT_TYPE'>, Awaited<ReturnType<BenefitRepository['findByType']>>>(
        uniqueBenefitTypes.map((type, i) => [type, benefitList[i]]),
      );

      const preparedResults = await Promise.allSettled(
        entries.map(async (entry) => this.prepareInviteWaitListEntry(entry, appUrl, benefitByType)),
      );

      const preparedInvites = preparedResults.flatMap((result) =>
        result.status === 'fulfilled' && result.value ? [result.value] : [],
      );

      if (!preparedInvites.length) {
        log.info('No wait list entries could be prepared for batch invite.');
        return { invited: 0 };
      }

      try {
        await this.mailService.sendBatchAsync(
          preparedInvites.map((invite) => invite.mailable),
        );
      } catch (error) {
        await Promise.allSettled(
          preparedInvites.map((invite) =>
            this.waitListRepository.updateById(invite.entry.id, {
              status: 'WAITING',
              expires_at: null,
              invitation_link_id: null,
              welcome_email_sent_at: null,
              reminder_count: 0,
              last_reminder_email_sent_at: null,
            }),
          ),
        );

        throw error;
      }

      await Promise.allSettled(
        preparedInvites.map((invite) =>
          this.waitListRepository.updateById(invite.entry.id, {
            status: 'INVITED',
            expires_at: expiresAt,
            invitation_link_id: invite.invitationLink.id,
            welcome_email_sent_at: new Date(),
          }),
        ),
      );

      const invited = preparedInvites.length;

      log.info(`Wait list batch invitations queued: ${invited}/${entries.length}`);

      return { invited };
    } catch (error) {
      log.error(
        `Failed to invite wait list batch: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  private async prepareInviteWaitListEntry(
    entry: WaitList,
    appUrl: string,
    benefitByType: Map<EnumType<'BENEFIT_TYPE'>, Awaited<ReturnType<BenefitRepository['findByType']>>>,
  ): Promise<PreparedWaitListInvite | null> {
    const log = this.logger.name(JOB_INVITE_WAIT_LIST_BATCH);
    const emailLog = this.redactEmail(entry.email);

    try {
      if (entry.position === null) {
        throw new Error(`Wait list entry ${entry.id} has no validated position`);
      }

      const benefitType = this.getBenefitTypeForPosition(entry.position);
      const benefit = benefitByType.get(benefitType);

      if (!benefit) {
        throw new Error(`Benefit ${benefitType} not found`);
      }

      const invitationLink = await this.invitationLinkService.create({
        benefit_id: benefit.id,
      });

      return {
        entry,
        invitationLink,
        mailable: this.waitListWelcomeMail.setData({
          email: entry.email,
          position: entry.position,
          benefitType,
          trialDays: benefit.trial_days,
          benefitMonths: this.getBenefitMonths(benefit.trial_days),
          registrationUrl: `${appUrl}/auth/register?ref=${invitationLink.code}`,
          expiresInDays: WaitListProcessor.INVITATION_EXPIRES_IN_DAYS,
        }),
      };
    } catch (error) {
      await this.waitListRepository.updateById(entry.id, {
        status: 'WAITING',
        expires_at: null,
        invitation_link_id: null,
        welcome_email_sent_at: null,
        reminder_count: 0,
        last_reminder_email_sent_at: null,
      });

      log.error(
        `Failed to invite wait list entry: ${emailLog} - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      return null;
    }
  }

  private getBenefitTypeForPosition(position: number): EnumType<'BENEFIT_TYPE'> {
    return position <= 50 ? 'VIP' : 'EARLY_USER';
  }

  private getBenefitMonths(trialDays: number): number {
    return Math.round(trialDays / 30);
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private redactEmail(email: string) {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) {
      return '[redacted]';
    }

    return `${localPart.slice(0, 2)}***@${domain}`;
  }

  private isUniqueEmailError(error: unknown) {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const code = 'code' in error ? (error as { code?: string | number }).code : undefined;
    return code === '23505' || code === 23505 || code === '1062' || code === 1062;
  }
}
