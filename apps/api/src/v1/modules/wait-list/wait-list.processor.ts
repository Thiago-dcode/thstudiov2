import { InjectQueue, Processor } from '@nestjs/bullmq';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { LogService } from '@repo/backend-lib/services/log-service';
import {
  CREATE_WAIT_LIST_ENTRY,
  INVITE_WAIT_LIST_BATCH,
  JOB_CREATE_WAIT_LIST_ENTRY,
  JOB_INVITE_WAIT_LIST_BATCH,
  WAIT_LIST_QUEUE,
} from '@repo/common-lib/constants/constants';
import { EnumType } from '@repo/common-lib/constants/enums';
import type { InvitationLink } from '@repo/common-lib/types/invitation-link';
import { CreateWaitListJobInput } from '@repo/common-lib/types/wait-list';
import { generateUUID } from '@repo/common-lib/utils/generate-uuid';
import { getBenefitMonths, getWaitListBenefitType } from '@repo/common-lib/utils/wait-list';
import { Job, Queue } from 'bullmq';
import { addDays } from 'date-fns';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { BenefitRepository } from '../benefits/benefit.repository';
import { InvitationLinkService } from '../invitation-links/invitation-link.service';
import { PlansService } from '../plans/plans.service';
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

  constructor(
    private readonly waitListRepository: WaitListRepository,
    private readonly invitationLinkService: InvitationLinkService,
    private readonly benefitRepository: BenefitRepository,
    private readonly plansService: PlansService,
    private readonly mailService: MailService,
    private readonly waitListInviteMail: WaitListInviteMail,
    private readonly waitListWelcomeMail: WaitListWelcomeMail,
    @InjectQueue(WAIT_LIST_QUEUE) private readonly waitListQueue: Queue,
    private readonly logger: LogService,
  ) {
    super();
  }

  @OnEvent(CREATE_WAIT_LIST_ENTRY)
  async handleCreateWaitListEvent(event: CreateWaitListEvent) {
    const emailLog = this.redactEmail(event.data.email);

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
      this.logger.info(`Wait list create job enqueued: ${emailLog}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const lower = message.toLowerCase();
      if (lower.includes('job') && (lower.includes('already') || lower.includes('exists') || lower.includes('exist'))) {
        this.logger.info(`Wait list create job already queued (skipped): ${emailLog}`);
        return;
      }

      this.logger.error(
        `Failed to enqueue wait list create job: ${emailLog} - ${message}`,
        error,
      );
      throw error;
    }
  }

  @OnEvent(INVITE_WAIT_LIST_BATCH)
  async handleInviteWaitListBatchEvent(event: InviteWaitListBatchEvent) {
    try {
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
      this.logger.info(`Wait list batch invite job enqueued: count=${event.count}`);
    } catch (error) {
      this.logger.error(
        `Failed to enqueue wait list batch invite job - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  async process(job: Job): Promise<unknown> {
    try {
      this.logger.info(`Processing wait list job: ${job.name}`, { job_id: job.id });

      switch (job.name) {
        case JOB_CREATE_WAIT_LIST_ENTRY:
          return await this.createWaitListEntry(job.data);

        case JOB_INVITE_WAIT_LIST_BATCH:
          return await this.inviteWaitListBatch(job.data);

        default:
          this.logger.error(`Unrecognized wait list job name: ${job.name}`);
          throw new Error(`Job name "${job.name}" not recognized`);
      }
    } catch (error) {
      this.logger.error(
        `Wait list job failed: ${job.name} - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    } finally {
      await this.logger.flushAsync();
    }
  }

  private async createWaitListEntry(data: CreateWaitListJobInput) {
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
            language: data.language,
          });
          this.logger.info(`Wait list DB entry created: ${emailLog}`, { entry_id: waitList.id });
        } catch (error) {
          if (!this.isUniqueEmailError(error)) {
            throw error;
          }

          waitList = await this.waitListRepository.findByEmail(normalizedEmail);
          if (!waitList) {
            throw error;
          }
          this.logger.info(`Wait list DB entry already exists (race): ${emailLog}`, { entry_id: waitList.id });
        }
      }

      if (waitList.validated_at) {
        this.logger.info(`Wait list entry already validated, skipping invite email: ${emailLog}`, { entry_id: waitList.id });
        return waitList;
      }

      const ONE_HOUR_MS = 60 * 60 * 1000;
      if (
        waitList.invitation_email_sent_at
        && Date.now() - new Date(waitList.invitation_email_sent_at).getTime() < ONE_HOUR_MS
      ) {
        this.logger.info(`Skipping wait-list validation email (sent recently): ${emailLog}`, { email: emailLog, entry_id: waitList.id });
        return waitList;
      }

      await this.mailService.sendAsync(
        this.waitListInviteMail.setData(
          {
            email: waitList.email,
            validationUrl: `${getConfigValue('app').url}/wait-list/${waitList.token}`,
          },
          waitList.language,
        ),
        {
          jobId: `wait-list-validate-${waitList.id}`,
        },
      );

      await this.waitListRepository.updateById(waitList.id, {
        invitation_email_sent_at: new Date(),
      });

      this.logger.info(`Wait list validation email queued: ${emailLog}`, { entry_id: waitList.id });

      return waitList;
    } catch (error) {
      this.logger.error(
        `Failed to create wait list entry: ${emailLog} - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  private async inviteWaitListBatch(data: { count: number }) {
    const count = Math.floor(Number(data.count));

    if (!Number.isFinite(count) || count <= 0) {
      this.logger.warn(`Invalid wait list invite batch count: ${data.count}`);
      return { invited: 0 };
    }

    this.logger.info(`Starting wait list batch invite: requested_count=${count}`);

    try {
      const entries = await this.waitListRepository.claimWaitingBatch(count);

      if (!entries.length) {
        this.logger.info('No waiting wait list entries found for batch invite.');
        return { invited: 0 };
      }

      this.logger.info(`Claimed ${entries.length} wait list entries for batch invite.`, {
        entry_ids: entries.map((entry) => entry.id),
        emails: entries.map((entry) => this.redactEmail(entry.email)),
        positions: entries.map((entry) => entry.position),
      });

      const expiresAt = addDays(new Date(), WaitListProcessor.INVITATION_EXPIRES_IN_DAYS);
      const appUrl = getConfigValue('app').url;
      this.logger.info(`Batch invite app url and expiry resolved`, {
        app_url: appUrl,
        expires_at: expiresAt.toISOString(),
      });

      const benefitTypes = new Set<EnumType<'BENEFIT_TYPE'>>();
      for (const entry of entries) {
        if (entry.position !== null) {
          benefitTypes.add(getWaitListBenefitType(entry.position));
        }
      }

      const uniqueBenefitTypes = Array.from(benefitTypes);
      const benefitList = await Promise.all(
        uniqueBenefitTypes.map((type) => this.benefitRepository.findByType(type)),
      );
      const benefitByType = new Map<EnumType<'BENEFIT_TYPE'>, Awaited<ReturnType<BenefitRepository['findByType']>>>(
        uniqueBenefitTypes.map((type, i) => [type, benefitList[i]]),
      );

      this.logger.info(`Batch invite benefits resolved`, {
        benefit_types: uniqueBenefitTypes,
        found_benefit_ids: uniqueBenefitTypes.map((type) => benefitByType.get(type)?.id ?? null),
      });

      const plans = await this.plansService.findActivePlans();
      const topTierPlan = plans.find((plan) => plan.top_tier) ?? null;
      const planName = topTierPlan?.name ?? '';
      this.logger.info(`Batch invite plan resolved`, {
        plan_name: planName || null,
        top_tier_plan_id: topTierPlan?.id ?? null,
        active_plans: plans.length,
      });

      const preparedResults = await Promise.allSettled(
        entries.map(async (entry) => this.prepareInviteWaitListEntry(entry, appUrl, benefitByType, planName)),
      );

      const preparedInvites = preparedResults.flatMap((result) =>
        result.status === 'fulfilled' && result.value ? [result.value] : [],
      );

      const failedCount = entries.length - preparedInvites.length;
      if (failedCount > 0) {
        this.logger.warn(`${failedCount}/${entries.length} wait list entries failed preparation for batch invite.`, {
          failed_entry_ids: entries
            .filter((entry) => !preparedInvites.some((invite) => invite.entry.id === entry.id))
            .map((entry) => entry.id),
        });
      }

      if (!preparedInvites.length) {
        this.logger.info('No wait list entries could be prepared for batch invite.');
        return { invited: 0 };
      }

      this.logger.info(`Queuing welcome emails for ${preparedInvites.length} wait list entries`, {
        entry_ids: preparedInvites.map((invite) => invite.entry.id),
        emails: preparedInvites.map((invite) => this.redactEmail(invite.entry.email)),
        invitation_link_ids: preparedInvites.map((invite) => invite.invitationLink.id),
        invitation_codes: preparedInvites.map((invite) => invite.invitationLink.code),
      });

      try {
        const mailJob = await this.mailService.sendBatchAsync(
          preparedInvites.map((invite) => invite.mailable),
        );

        if (!mailJob) {
          this.logger.error(
            `Wait list batch mail was not queued (empty content / preferences blocked). Reverting ${preparedInvites.length} entries to WAITING`,
            {
              entry_ids: preparedInvites.map((invite) => invite.entry.id),
              emails: preparedInvites.map((invite) => this.redactEmail(invite.entry.email)),
            },
          );

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

          return { invited: 0 };
        }

        this.logger.info(`Wait list welcome mail batch queued to MAIL_QUEUE`, {
          mail_job_id: mailJob.id,
          mail_job_name: mailJob.name,
          recipients: preparedInvites.length,
        });
      } catch (error) {
        this.logger.error(
          `Wait list batch mail send failed, reverting ${preparedInvites.length} entries to WAITING`,
          error,
        );

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

      this.logger.info(`Wait list batch invitations marked INVITED (mail queued, not yet confirmed delivered): ${invited}/${entries.length}`, {
        entry_ids: preparedInvites.map((invite) => invite.entry.id),
        emails: preparedInvites.map((invite) => this.redactEmail(invite.entry.email)),
      });

      return { invited };
    } catch (error) {
      this.logger.error(
        `Failed to invite wait list batch - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  private async prepareInviteWaitListEntry(
    entry: WaitList,
    appUrl: string,
    benefitByType: Map<EnumType<'BENEFIT_TYPE'>, Awaited<ReturnType<BenefitRepository['findByType']>>>,
    planName: string,
  ): Promise<PreparedWaitListInvite | null> {
    const emailLog = this.redactEmail(entry.email);

    try {
      this.logger.info(`Preparing wait list invite: ${emailLog}`, {
        entry_id: entry.id,
        position: entry.position,
      });

      if (entry.position === null) {
        throw new Error(`Wait list entry ${entry.id} has no validated position`);
      }

      const benefitType = getWaitListBenefitType(entry.position);
      const benefit = benefitByType.get(benefitType);

      if (!benefit) {
        throw new Error(`Benefit ${benefitType} not found`);
      }

      const invitationLink = await this.invitationLinkService.create({
        email:entry.email,
        benefit_type: benefitType,
      },true);

      const registrationUrl = `${appUrl}/auth/register?ref=${invitationLink.code}`;

      this.logger.info(`Wait list invite prepared: ${emailLog}`, {
        entry_id: entry.id,
        benefit_type: benefitType,
        benefit_id: benefit.id,
        invitation_link_id: invitationLink.id,
        invitation_code: invitationLink.code,
        registration_url: registrationUrl,
        plan_name: planName || null,
        trial_days: benefit.trial_days,
      });

      return {
        entry,
        invitationLink,
        mailable: this.waitListWelcomeMail.setData(
          {
            email: entry.email,
            position: entry.position,
            benefitType,
            planName,
            trialDays: benefit.trial_days,
            benefitMonths: getBenefitMonths(benefit.trial_days),
            registrationUrl,
            expiresInDays: WaitListProcessor.INVITATION_EXPIRES_IN_DAYS,
          },
          entry.language,
        ),
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

      this.logger.error(
        `Failed to invite wait list entry: ${emailLog} - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      return null;
    }
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
