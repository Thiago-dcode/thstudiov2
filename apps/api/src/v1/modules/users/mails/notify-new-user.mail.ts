import { Mailable } from '@repo/backend-lib/services/mail-service/base';
import { BaseUser } from '../users.types';
import { mailingFrom } from 'src/config/mailling';

export class NotifyNewUserMail extends Mailable {
  constructor(private readonly user: BaseUser) {
    super();
  }
  envelope() {
    return {
      from: mailingFrom,
      to: this.user.email,
      subject: 'Welcome to Visualsofdsa',
    };
  }
  content() {
    return {
      text: 'Welcome to Visualsofdsa TEXT ' + this.user.username,
      html: '<h1>Welcome to Visualsofdsa HTML ' + this.user.username + '</h1>',
    };
  }
}
