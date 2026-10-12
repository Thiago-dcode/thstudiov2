import { Injectable, NotFoundException } from '@nestjs/common';
import { LogService, maskEmail } from '@repo/backend-lib/services/log-service';
import { QueueHelper } from '@repo/backend-lib/utils';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/language';
import type {
  PublicCreateWaitListInput,
  WaitListCreateResponse,
  WaitListValidateResponse,
  UpdateWaitListInput,
} from '@repo/common-lib/types/wait-list';
import { getWaitListBenefitType } from '@repo/common-lib/utils/wait-list';
import { RequestService } from 'src/common/services/request.service';
import { BenefitRepository } from '../benefits/benefit.repository';
import { UserAuthDevicesService } from '../user-auth-devices/user-auth-devices.service';
import { IndexWaitListRequest } from './requests/index-wait-list.request';
import { WaitListRepository } from './wait-list.repository';

@Injectable()
export class WaitListService {
  constructor(
    private readonly waitListRepository: WaitListRepository,
    private readonly benefitRepository: BenefitRepository,
    private readonly logger: LogService,
    private readonly requestService: RequestService,
    private readonly userAuthDevicesService: UserAuthDevicesService,
  ) { }

  async findAll(filters: IndexWaitListRequest) {
    return this.waitListRepository.getAll(filters);
  }

  async findByInvitationLinkId(invitationLinkId: number) {
    return this.waitListRepository.findByInvitationLinkId(invitationLinkId);
  }

  async findByEmail(email: string) {
    return this.waitListRepository.findByEmail(email);
  }

  async getEmailByInvitationCode(code: string): Promise<{ email: string } | null> {
    try {
      const email = await this.waitListRepository.findEmailByInvitationCode(code);
      if (!email) {
        this.logger.info(`No email found for invitation code: ${code.slice(0, 4)}***`);
        return null;
      }

      this.logger.info(`Email resolved for invitation code: ${code.slice(0, 4)}***`, {
        email: maskEmail(email),
      });
      return { email };
    } catch (error) {
      this.logger.error(
        `Failed to resolve email by invitation code - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  async updateById(id: number, data: UpdateWaitListInput) {
    return this.waitListRepository.updateById(id, data);
  }

  async validate(token: string): Promise<WaitListValidateResponse> {
    try {
      const waitList = await this.waitListRepository.findByToken(token);

      if (!waitList) {
        this.logger.warn('Invalid or expired wait list token');
        throw new NotFoundException('Invalid or expired token');
      }

      if (waitList.validated_at) {
        this.logger.info(`Wait list token already validated: entry ${waitList.id}`);
        return { ...waitList, benefit: await this.resolveBenefit(waitList.position) };
      }

      const validatedCount = await this.waitListRepository.getValidatedCount();
      const position = waitList.position ?? validatedCount + 1;

      const updated = await this.waitListRepository.markValidatedByToken(token, position);

      if (!updated) {
        // A concurrent request validated it between our read and write; it owns the side effects.
        const current = await this.waitListRepository.findByToken(token);
        if (!current) {
          throw new NotFoundException('Invalid or expired token');
        }
        this.logger.info(`Wait list token validated concurrently: entry ${current.id}`);
        return { ...current, benefit: await this.resolveBenefit(current.position) };
      }

      this.logger.info(`Wait list entry validated: entry ${updated.id}, position ${position}`, {
        entry_id: updated.id,
        position,
      });

      await Promise.all([
        this.trustValidationDevice(updated.id, updated.email),
        this.enqueueValidatedEmail(updated.id),
      ]);

      return { ...updated, benefit: await this.resolveBenefit(updated.position) };
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        this.logger.error(
          `Failed to validate wait list token - ${error instanceof Error ? error.message : 'Unknown error'}`,
          error,
        );
      }
      throw error;
    }
  }

  async create({ email }: PublicCreateWaitListInput): Promise<WaitListCreateResponse> {
    const normalizedEmail = this.normalizeEmail(email);
    const emailLog = maskEmail(normalizedEmail);
    const language = this.requestService.language ?? DEFAULT_LANGUAGE;

    try {
      const existing = await this.waitListRepository.findByEmail(normalizedEmail);
      if (existing && existing.validated_at) {
        this.logger.info(`Wait list entry already validated: ${emailLog}`, { entry_id: existing.id });
        return {
          email: existing.email,
          message: 'You are already on the wait list',
          already_exists: true,
        };
      }

      this.logger.info(`Enqueuing wait list create jobs: ${emailLog}`, { language });

      await QueueHelper.createOrUpdateEmailPreferenceJob({
        email: normalizedEmail,
      });

      try {
        await QueueHelper.createWaitListEntryJob({
          email: normalizedEmail,
          language,
        });
        this.logger.info(`Wait list create job enqueued: ${emailLog}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const lower = message.toLowerCase();
        if (lower.includes('job') && (lower.includes('already') || lower.includes('exists') || lower.includes('exist'))) {
          this.logger.info(`Wait list create job already queued (skipped): ${emailLog}`);
        } else {
          throw error;
        }
      }

      return {
        email: normalizedEmail,
        message: 'You have been added to the wait list',
      } satisfies WaitListCreateResponse;
    } catch (error) {
      this.logger.error(
        `Failed to create wait list entry: ${emailLog} - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  /**
   * `validatedBefore` restricts the batch to entries that validated at or before that moment —
   * how the scheduled task expresses "invite people 2 days after they validated". The admin
   * endpoint omits it and keeps inviting the head of the queue regardless of age.
   */
  async inviteBatch(count: number, validatedBefore?: Date) {
    try {
      if (!Number.isFinite(count) || count <= 0) {
        this.logger.warn(`Invalid wait list batch invite count: ${count}`);
      }

      this.logger.info(`Enqueuing wait list batch invite job: count=${count}`, {
        validated_before: validatedBefore?.toISOString() ?? null,
      });

      await QueueHelper.createInviteWaitListBatchJob({
        count,
        validated_before: validatedBefore?.toISOString(),
      });

      return {
        count,
        message: 'Wait list batch invitations have been queued',
      };
    } catch (error) {
      this.logger.error(
        `Failed to queue wait list batch invite - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Never fails the validation: the entry is already validated and the page must say so. A lost
   * confirmation email is the lesser problem, and the day-1 follow-up and the invite still go out.
   */
  private async enqueueValidatedEmail(waitListId: number) {
    try {
      await QueueHelper.createWaitListValidatedEmailJob({ wait_list_id: waitListId });
      this.logger.info(`Wait list validated email job enqueued: entry ${waitListId}`);
    } catch (error) {
      this.logger.error(
        `Failed to enqueue wait list validated email: entry ${waitListId} - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  /**
   * Clicking the emailed link proves the address from this browser, the same proof the 2FA code
   * gives, so the browser is trusted for that email: registering from it later skips the code.
   * Only the winning validation does this — a repeat or concurrent visit (or a different device)
   * gets nothing. Never fails the validation; at worst the user types the 2FA code at register.
   */
  private async trustValidationDevice(waitListId: number, email: string) {
    try {
      const device = await this.userAuthDevicesService.createPreValidated({
        email,
        user_agent: this.requestService.user_agent ?? '',
        ip_address: this.requestService.ip_address ?? '',
      });
      this.logger.info(
        device
          ? `Wait list validation device trusted: entry ${waitListId}`
          : `Wait list validation device not trusted (unknown identity or already set): entry ${waitListId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to trust wait list validation device: entry ${waitListId} - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  private async resolveBenefit(position: number | null) {
    if (position === null) return null;

    const benefit = await this.benefitRepository.findByType(getWaitListBenefitType(position));
    if (!benefit) return null;

    return { type: benefit.type, name: benefit.name, trial_days: benefit.trial_days };
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }
}
