import { mailingAdmins, mailingNoreplyEmail } from 'src/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { Injectable } from '@nestjs/common';
import type { LogOptions } from '@repo/backend-lib/services/log-service/types';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

@Injectable()
export class Error500Mail extends ApiMailService {
  constructor(
    viewService: ViewService,
    message: string,
    options: LogOptions,
    // Manually constructed in a static helper; email preferences are optional.
    emailPreferencesService?: EmailPreferencesService,
  ) {
    const optionsFormatted =
      options && typeof options === 'object'
        ? Object.keys(options).map((key) => {
            return `${key}: ${typeof (options as any)[key] === 'object' ? JSON.stringify((options as any)[key]) : (options as any)[key]}`;
          })
        : [];

    super(viewService, emailPreferencesService, {
      viewPath: 'emails/api/error-500',
      data: {
        message,
        options: optionsFormatted.length > 0 ? optionsFormatted : 'No additional details available',
      },
      emailType: 'TRANSACTIONAL',
    });
  }

  protected async buildEnvelope() {
    return {
      from: mailingNoreplyEmail,
      to: mailingAdmins,
      subject: 'ERROR 500',
    };
  }
}
