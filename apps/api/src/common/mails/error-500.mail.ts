import { Mailable } from '@repo/backend-lib/services/mail-service/base';
import { mailingAdmins, mailingFrom } from 'src/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { Injectable } from '@nestjs/common';
import type { LogOptions } from '@repo/backend-lib/services/log-service/types';

@Injectable()
export class Error500Mail extends Mailable {
  constructor(
    private readonly viewService: ViewService,
    private readonly message: string,
    private readonly options: LogOptions,
  ) {
    super();
  }

  async envelope() {
    return {
      from: mailingFrom,
      to: mailingAdmins,
      subject: 'ERROR 500',
    };
  }
  async content() {
    const options =
      this.options && typeof this.options === 'object'
        ? Object.keys(this.options).map((key) => {
            return `${key}: ${typeof this.options[key] === 'object' ? JSON.stringify(this.options[key]) : this.options[key]}`;
          })
        : [];
    const html = await this.viewService.render('emails/api/error-500', {
      message: this.message,
      options: options.length > 0 ? options : 'No additional details available',
    });
    return {
      html,
    };
  }
}
