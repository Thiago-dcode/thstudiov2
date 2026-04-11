import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { OnEvent } from '@nestjs/event-emitter';
import { UserContactsRepository } from './user-contacts.repository';
import { CreateUserContactEvent } from './events/create-user-contact.event';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { CreateUserContactInput } from '@repo/common-lib/types/user-contact';
import {
  CREATE_USER_CONTACT,
  USER_CONTACTS_QUEUE,
  JOB_CREATE_USER_CONTACT,
} from '@repo/common-lib/constants/constants';
import { UserService } from '../users/users.service';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { NewContactMail } from './mails/new-contact.mail';

@Processor(USER_CONTACTS_QUEUE)
export class UserContactProcessor extends WorkerHost {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'user-contacts',
  });

  constructor(
    private readonly userContactsRepository: UserContactsRepository,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly newContactMail: NewContactMail,
    @InjectQueue(USER_CONTACTS_QUEUE) private readonly contactQueue: Queue,
    private readonly appLogService: LogService,
  ) {
    super();
  }

  // ==================== EVENT LISTENERS ====================

  /** Listen for user contact events and enqueue them */
  @OnEvent(CREATE_USER_CONTACT)
  async handleCreateUserContactEvent(event: CreateUserContactEvent) {
    await this.contactQueue.add(
      JOB_CREATE_USER_CONTACT,
      event.contactRequest,
      {
        jobId: `contact-${event.contactRequest.user_id}-${Date.now()}`,
        priority: 10,
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
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
      // 1. Create contact in DB
      const contact = await this.userContactsRepository.create(data);

      // TODO:
      // await this.userNotificationsRepository.create({
      //   notification_type: 'NEW_CONTACT',
      //   user_id: data.user_id,
      //   payload: contact,
      // });

      // 3. Fetch artist user data
      const artist = await this.userService.findOneCompacted(data.user_id);
      if (artist) {
        // 4. Send email
        await this.mailService.sendAsync(
          this.newContactMail.setData(artist, data)
        );
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
