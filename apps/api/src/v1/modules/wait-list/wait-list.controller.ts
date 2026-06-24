import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { LogService } from '@repo/backend-lib/services/log-service';
import { Public } from 'src/common/decorators/public.decorator';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { CreateWaitListRequest } from './requests/create-wait-list.request';
import { InviteWaitListBatchRequest } from './requests/invite-wait-list-batch.request';
import { ValidateWaitListRequest } from './requests/validate-wait-list.request';
import { WaitListService } from './wait-list.service';

@Controller('wait-list')
export class WaitListController {
  constructor(
    private readonly waitListService: WaitListService,
    private readonly logger: LogService,
  ) { }

  @Public()
  @Post()
  async create(@Body() body: CreateWaitListRequest) {
    const emailLog = this.redactEmail(body.email);

    try {
      this.logger.info(`Creating wait list entry: ${emailLog}`);
      const result = await this.waitListService.create(body);
      this.logger.info(
        result.already_exists
          ? `Wait list entry already exists: ${emailLog}`
          : `Wait list entry queued: ${emailLog}`,
        { already_exists: result.already_exists },
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to create wait list entry: ${emailLog} - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  @Public()
  @Get('invitation/:code')
  async getEmailByInvitationCode(@Param('code') code: string) {
    if (!code) {
      this.logger.warn('Invitation code missing in request');
      return null;
    }

    try {
      const result = await this.waitListService.getEmailByInvitationCode(code);
      this.logger.info(
        result
          ? `Resolved email for invitation code: ${code.slice(0, 4)}***`
          : `No wait list entry found for invitation code: ${code.slice(0, 4)}***`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to resolve email for invitation code - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  @Public()
  @Post('validate')
  async validate(@Body() body: ValidateWaitListRequest) {
    try {
      this.logger.info('Validating wait list token');
      const result = await this.waitListService.validate(body.token);
      this.logger.info(`Wait list token validated: entry ${result.id}, position ${result.position ?? 'pending'}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to validate wait list token - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  @UseGuards(AdminGuard)
  @Post('invite-batch')
  async inviteBatch(@Body() body: InviteWaitListBatchRequest) {
    try {
      this.logger.info(`Queueing wait list batch invite: count=${body.count}`);
      const result = await this.waitListService.inviteBatch(body.count);
      this.logger.info(`Wait list batch invite queued: count=${result.count}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to queue wait list batch invite - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  private redactEmail(email: string) {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) {
      return '[redacted]';
    }

    return `${localPart.slice(0, 2)}***@${domain}`;
  }
}
