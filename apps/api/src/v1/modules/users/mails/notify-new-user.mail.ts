import { Mailable } from '@repo/backend-lib/services/mail-service/base';
import { BaseUser } from '../users.types';
import { mailingFrom } from 'src/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';

export class NotifyNewUserMail extends Mailable {
  constructor(
    private readonly user: BaseUser,
    private readonly viewService: ViewService,
  ) {
    super();
  }
  envelope() {
    return {
      from: mailingFrom,
      to: this.user.email,
      subject: 'Welcome to Visualsofdsa',
    };
  }
  async content() {
    return {
      html: await this.viewService.render('notify-new-user', {
        user: this.user,
      }),
    };
  }
}
