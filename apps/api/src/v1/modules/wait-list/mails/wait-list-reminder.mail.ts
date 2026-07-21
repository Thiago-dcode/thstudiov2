import { Injectable } from '@nestjs/common';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { EnumType } from '@repo/common-lib/constants/enums';
import { I18nService } from 'nestjs-i18n';
import { mailingNoreplyEmail } from 'src/config/mailling';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

export type WaitListReminderMailData = {
  email: string;
  position: number;
  benefitType: EnumType<'BENEFIT_TYPE'>;
  benefitMonths: number;
  registrationUrl: string;
  hoursLeft: number;
  isFinal: boolean;
};

@Injectable()
export class WaitListReminderMail extends ApiMailService {
  private data?: WaitListReminderMailData;

  constructor(
    viewService: ViewService,
    emailPreferencesService: EmailPreferencesService,
    i18nService: I18nService,
  ) {
    super(viewService, emailPreferencesService, {
      viewPath: 'emails/wait-list/reminder',
      data: {},
      emailType: 'WAITLIST_UPDATE',
    }, i18nService);
  }

  setData(data: WaitListReminderMailData) {
    const mail = new WaitListReminderMail(
      this.viewService,
      this.emailPreferencesService!,
      this.i18nService!,
    );

    mail.data = data;
    mail.viewParams = {
      viewPath: 'emails/wait-list/reminder',
      data: { reminder: data, translatePath: 'wait-list-reminder-email' },
      emailType: 'WAITLIST_UPDATE',
    };

    return mail;
  }

  protected async buildEnvelope() {
    const data = this.getData();
    const subjectKey = data.isFinal ? 'SUBJECT_FINAL' : 'SUBJECT';
    const benefitTypeLabel = this.t(`benefit-type.${data.benefitType}`);

    return {
      from: `${mailingNoreplyEmail}`,
      to: data.email,
      subject: this.t(`wait-list-reminder-email.${subjectKey}`)
        .replace('{benefitType}', benefitTypeLabel),
    };
  }

  private getData() {
    if (!this.data) {
      throw new Error('WaitListReminderMail requires data before rendering.');
    }

    return this.data;
  }
}

