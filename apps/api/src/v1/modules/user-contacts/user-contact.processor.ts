import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { UserContactsRepository } from './user-contacts.repository';
import {
  FactoryLogService,
  LogService,
} from '@repo/backend-lib/services/log-service';
import { QueueHelper } from '@repo/backend-lib/utils';
import { CreateUserContactInput } from '@repo/common-lib/types/user-contact';
import {
  JOB_CREATE_USER_CONTACT,
  USER_CONTACTS_QUEUE,
} from '@repo/common-lib/constants/queues';
import { UserService } from '../users/users.service';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { NewContactMail } from './mails/new-contact.mail';
import { GlobalProcessor } from 'src/common/processors/global.processor';

@Processor(USER_CONTACTS_QUEUE)
export class UserContactProcessor extends GlobalProcessor {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'user-contacts',
  });

  constructor(
    private readonly userContactsRepository: UserContactsRepository,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly newContactMail: NewContactMail,
    private readonly appLogService: LogService,
  ) {
    super();
  }

  // ==================== JOB PROCESSOR ====================

  async process(job: Job): Promise<any> {
    try {
      switch (job.name) {
        case JOB_CREATE_USER_CONTACT:
          return await this.createUserContact(job.data);

        default:
          throw new Error(`Job name "${job.name}" not recognized`);
      }
    } finally {
      await this.appLogService.flushAsync();
    }
  }

  // ==================== JOB HANDLERS ====================

  private async createUserContact(data: CreateUserContactInput) {
    const log = this.logger.name('create-user-contact');
    try {

      log.info(`Creating user contact: ${data.contact_email} -> ${data.user_id}`,);
      // 1. Create contact in DB
      const contact = await this.userContactsRepository.create(data);

      log.info(`User contact created`,contact);


      const artist = await this.userService.findOneCompacted(data.user_id);
      if (artist) {
        await this.mailService.sendAsync(
          this.newContactMail.setData(artist, data, artist.language),
        );

        log.info(`Enqueing user notification`);

        await QueueHelper.createOrUpdateUserNotificationJob({
          type: 'NEW_CONTACT',
          user_id: contact.user_id,
          entity_id: contact.id,
          read_at: null,
        });
      } else {
        log.warn(`Artist with ID ${data.user_id} not found, skipping email.`);
      }

      log.info(
        `User contact created: ${data.contact_email} -> ${data.user_id}`,
        {
          user_id: data.user_id,
          contact_email: data.contact_email,
        },
      );

      return contact;
    } catch (error) {
      log.error(
        `Failed to create user contact: ${data.contact_email} - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }
}
