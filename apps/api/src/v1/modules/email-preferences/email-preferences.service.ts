import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EmailPreferencesRepository } from './email-preferences.repository';
import { EmailPreference } from '@repo/common-lib/types/email-preferences';
import { CreateOrUpdateEmailPreferencePayload } from './events/create-or-update-email-preference.event';
import { cleanObj } from '@repo/common-lib/utils/object';
import { RequestService } from 'src/common/services/request.service';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { EnumType } from '@repo/common-lib/constants/enums';

type NonTransactionalEmailType = Exclude<EnumType<'EMAIL_TYPE'>, 'TRANSACTIONAL'>;

type EmailPreferenceDeliveryStatus = {
  canSend: boolean;
  unsuscribeUrl: string;
};

const APP_CONFIG = getConfigValue('app');

const EMAIL_TYPE_TO_PREFERENCE: Record<
  NonTransactionalEmailType,
  keyof Pick<EmailPreference, 'marketing' | 'notifications' | 'waitlist_updates'>
> = {
  MARKETING: 'marketing',
  NOTIFICATION: 'notifications',
  WAITLIST_UPDATE: 'waitlist_updates',
};

@Injectable()
export class EmailPreferencesService {
  constructor(
    private readonly emailPreferencesRepository: EmailPreferencesRepository,
    private readonly requestService: RequestService,
  ) { }

  async createOrUpdateByEmail(payload: CreateOrUpdateEmailPreferencePayload): Promise<EmailPreference> {
    const row = await this.emailPreferencesRepository.upsertByEmail(cleanObj(payload));
    return {
      id: row.id,
      email: row.email,
      token: row.token,
      user_id: row.user_id,
      transactional: row.transactional,
      marketing: row.marketing,
      notifications: row.notifications,
      waitlist_updates: row.waitlist_updates,
    };
  }

  

  async getOneByEmail(email: string): Promise<EmailPreference | null> {
    const row = await this.emailPreferencesRepository.findByColumn('email', email);
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      token: row.token,
      user_id: row.user_id,
      transactional: row.transactional,
      marketing: row.marketing,
      notifications: row.notifications,
      waitlist_updates: row.waitlist_updates,
    };
  }

  async getByToken(token: string): Promise<EmailPreference | null> {
    const row = await this.emailPreferencesRepository.findByColumn('token', token);
    if (!row) return null;

    // Only allow users to access their own email preference rows.
    if (!this.requestService.user) {
      throw new UnauthorizedException();
    }
    if (!row.user_id || row.user_id !== this.requestService.user.id) {
      throw new UnauthorizedException();
    }

    return {
      id: row.id,
      email: row.email,
      token: row.token,
      user_id: row.user_id,
      transactional: row.transactional,
      marketing: row.marketing,
      notifications: row.notifications,
      waitlist_updates: row.waitlist_updates,
    };
  }

  async getByUserId(userId: number): Promise<EmailPreference | null> {
    const row = await this.emailPreferencesRepository.findByColumn('user_id', userId);
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      token: row.token,
      user_id: row.user_id,
      transactional: row.transactional,
      marketing: row.marketing,
      notifications: row.notifications,
      waitlist_updates: row.waitlist_updates,
    };
  }

  async getDeliveryStatus(email: string, emailType: EnumType<'EMAIL_TYPE'>): Promise<EmailPreferenceDeliveryStatus> {
    if (emailType === 'TRANSACTIONAL') {
      return {
        canSend: true,
        unsuscribeUrl: '',
      };
    }

    const emailPreference = await this.getOneByEmail(email);

    if (!emailPreference) {
      return {
        canSend: true,
        unsuscribeUrl: '',
      };
    }
    const preferenceField = EMAIL_TYPE_TO_PREFERENCE[emailType];

    return {
      canSend: emailPreference[preferenceField],
      unsuscribeUrl: this.getUnsubscribeUrl(emailPreference),
    };
  }

  private getUnsubscribeUrl(emailPreference: EmailPreference): string {
    if (!emailPreference.token || !APP_CONFIG.url) {
      return '';
    }

    return `${APP_CONFIG.url}/email-preferences?token=${encodeURIComponent(emailPreference.token)}`;
  }
}
