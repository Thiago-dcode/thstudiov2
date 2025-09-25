import { Mailable } from '@repo/backend-lib/services/mail-service/base';
import { BaseUser } from '../users.types';
import { mailingFrom } from 'src/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { Injectable } from '@nestjs/common';

@Injectable()
export class NotifyNewUserMail extends Mailable {
  private user: BaseUser;
  constructor(private readonly viewService: ViewService) {
    super();
  }
  setUser(user: BaseUser) {
    this.user = user;
    return this;
  }
  async envelope() {
    return {
      from: mailingFrom,
      to: this.user.email,
      subject: 'Welcome to Visualsofdsa',
    };
  }
  async content() {
    const features = [
      'Manage and organize all your artwork',
      'Create outstanding portfolio(s) to reach more clients',
      'Add info about your clients',
      'Show your available services',
      'Connect with other artists',
      'And much more!',
    ];
    const html = await this.viewService.render('emails/users/notify-new-user', {
      user: this.user,
      features,
    });
    return {
      html,
    };
  }
}
