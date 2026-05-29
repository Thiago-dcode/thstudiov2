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
import { PublicCreateWaitListInput } from '@repo/common-lib/types/wait-list';
import { Job, Queue } from 'bullmq';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { BenefitRepository } from '../benefits/benefit.repository';
import { InvitationLinkService } from '../invitation-links/invitation-link.service';
import { CreateWaitListEvent } from './events/create-wait-list.event';
import { InviteWaitListBatchEvent } from './events/invite-wait-list-batch.event';
import { WaitListInviteMail } from './mails/wait-list-invite.mail';
import { WaitListWelcomeMail } from './mails/wait-list-welcome.mail';
import { WaitListRepository } from './wait-list.repository';

@Processor(WAIT_LIST_QUEUE)
export class WaitListProcessor extends GlobalProcessor {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: WAIT_LIST_QUEUE,
  });

  constructor(
    private readonly waitListRepository: WaitListRepository,
    private readonly invitationLinkService: InvitationLinkService,
    private readonly benefitRepository: BenefitRepository,
    private readonly mailService: MailService,
    private readonly waitListWelcomeMail: WaitListWelcomeMail,
    private readonly waitListInviteMail: WaitListInviteMail,
    @InjectQueue(WAIT_LIST_QUEUE) private readonly waitListQueue: Queue,
    private readonly appLogService: LogService,
  ) {
    super();
  }

  @OnEvent(CREATE_WAIT_LIST_ENTRY)
  async handleCreateWaitListEvent(event: CreateWaitListEvent) {
    await this.waitListQueue.add(
      JOB_CREATE_WAIT_LIST_ENTRY,
      event.data,
      {
        jobId: `wait-list-create-${event.data.email}-${Date.now()}`,
        priority: 10,
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }

  @OnEvent(INVITE_WAIT_LIST_BATCH)
  async handleInviteWaitListBatchEvent(event: InviteWaitListBatchEvent) {
    await this.waitListQueue.add(
      JOB_INVITE_WAIT_LIST_BATCH,
      { count: event.count },
      {
        jobId: `wait-list-invite-batch-${Date.now()}`,
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

    try {
      const position = (await this.waitListRepository.getMaxPosition()) + 1;
      const benefitType = this.getBenefitTypeForPosition(position);
      const benefit = await this.benefitRepository.findByType(benefitType);

      if (!benefit) {
        throw new Error(`Benefit ${benefitType} not found`);
      }

      const invitationLink = await this.invitationLinkService.create({
        benefit_id: benefit.id,
      });

      const waitList = await this.waitListRepository.create({
        email: data.email,
        position,
        status: 'WAITING',
        redeemed_at: null,
        invitation_link_id: invitationLink.id,
      });

      await this.mailService.sendAsync(
        this.waitListWelcomeMail.setData({
          email: waitList.email,
          position,
          benefitType,
          trialDays: benefit.trial_days,
          benefitMonths: this.getBenefitMonths(benefit.trial_days),
          profileUrl: `${getConfigValue('app').url}/artists/thsworld`,
        }),
        {
          jobId: `wait-list-welcome-${waitList.id}-${Date.now()}`,
        },
      );

      log.info(`Wait list entry created: ${data.email}`, {
        email: data.email,
        position,
        benefit_type: benefitType,
      });

      return waitList;
    } catch (error) {
      log.error(
        `Failed to create wait list entry: ${data.email} - ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      const entries = await this.waitListRepository.getWaitingBatch(count);

      if (!entries.length) {
        log.info('No waiting wait list entries found for batch invite.');
        return { invited: 0 };
      }

      const appUrl = getConfigValue('app').url;
      const mailables = entries.map((entry) =>
        this.waitListInviteMail.setData({
          email: entry.email,
          position: entry.position ?? 0,
          benefitType: entry.benefit_type,
          trialDays: entry.trial_days,
          benefitMonths: this.getBenefitMonths(entry.trial_days),
          registrationUrl: `${appUrl}/auth/register?ref=${entry.invitation_code}`,
        }),
      );

      await this.mailService.sendBatchAsync(mailables, {
        jobId: `wait-list-invite-mail-${Date.now()}`,
      });

      await Promise.all(
        entries.map((entry) =>
          this.waitListRepository.updateById(entry.id, { status: 'INVITED' }),
        ),
      );

      log.info(`Wait list batch invitations queued: ${entries.length}`);

      return { invited: entries.length };
    } catch (error) {
      log.error(
        `Failed to invite wait list batch: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  private getBenefitTypeForPosition(position: number): EnumType<'BENEFIT_TYPE'> {
    return position <= 50 ? 'VIP' : 'EARLY_USER';
  }

  private getBenefitMonths(trialDays: number): number {
    return Math.round(trialDays / 30);
  }
}
