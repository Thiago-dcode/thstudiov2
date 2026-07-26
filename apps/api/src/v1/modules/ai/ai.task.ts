import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { GENERATE_ENTITY_METADATA_EVENT } from '@repo/common-lib/constants/constants';
import { UserExtraDataRepository } from '../user-extra-data/user-extra-data.repository';
import { GenerateEntityMetadataEvent } from './events/generate-entity-metadata.event';

@Injectable()
export class AiTask {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'ai',
  });

  constructor(
    private readonly userExtraDataRepository: UserExtraDataRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'ai-credits-reset',
    timeZone: 'UTC',
  })
  async handleAiCreditsReset() {
    const log = this.logger.name('ai-credits-reset');
    const today = new Date();

    try {
      const dueRows = await this.userExtraDataRepository.findDueForAiCreditsReset(today);

      if (!dueRows.length) {
        log.info('No users due for AI credits reset today');
        return;
      }

      log.info(`Found ${dueRows.length} user(s) due for AI credits reset`);

      let successCount = 0;
      for (const row of dueRows) {
        try {
          const nextReset = new Date(row.next_ai_credits_reset);
          nextReset.setMonth(nextReset.getMonth() + 1);

          await this.userExtraDataRepository.updateById(row.id, {
            last_ai_credits_reset: row.next_ai_credits_reset,
            next_ai_credits_reset: nextReset,
            ai_credits_consumed: 0,
          });
          successCount++;
        } catch (error) {
          log.error(
            `Failed to reset AI credits for user_extra_data [${row.id}] (user ${row.user_id}) - ${error instanceof Error ? error.message : 'Unknown error'}`,
            error,
          );
        }
      }

      log.info(`AI credits reset complete: ${successCount}/${dueRows.length} succeeded`);
    } catch (error) {
      log.error(
        `AI credits reset cron failed - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    } finally {
      await LogService.flush();
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'portfolio-task',
    timeZone: 'UTC',
  })
  async handlePortfolioTask() {
    this.eventEmitter.emit(
      GENERATE_ENTITY_METADATA_EVENT,
      new GenerateEntityMetadataEvent({ entity: 'portfolio' }),
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'collection-task',
    timeZone: 'UTC',
  })
  async handleCollectionTask() {
    this.eventEmitter.emit(
      GENERATE_ENTITY_METADATA_EVENT,
      new GenerateEntityMetadataEvent({ entity: 'collection' }),
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'service-task',
    timeZone: 'UTC',
  })
  async handleServiceTask() {
    this.eventEmitter.emit(
      GENERATE_ENTITY_METADATA_EVENT,
      new GenerateEntityMetadataEvent({ entity: 'service' }),
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'user-task',
    timeZone: 'UTC',
  })
  async handleUserTask() {
    this.eventEmitter.emit(
      GENERATE_ENTITY_METADATA_EVENT,
      new GenerateEntityMetadataEvent({ entity: 'user' }),
    );
  }
}
