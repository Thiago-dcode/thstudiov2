import { Mailable } from '@repo/backend-lib/services/mail-service/base';
import { mailingFrom } from 'src/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { CreateUserContactInput } from '@repo/common-lib/types/user-contact';
import { BaseUser } from '@repo/common-lib/types/user';

@Injectable()
export class NewContactMail extends Mailable {
  private artist: BaseUser;
  private contact: CreateUserContactInput;

  constructor(
    private readonly viewService: ViewService,
    private readonly i18nService: I18nService,
  ) {
    super();
  }

  setData(artist: BaseUser, contact: CreateUserContactInput) {
    this.artist = artist;
    this.contact = contact;
    return this;
  }

  async envelope() {
    return {
      from: mailingFrom,
      to: this.artist.email,
      subject: this.i18nService.translate('new-contact-email.SUBJECT'),
      replyTo: this.contact.contact_email,
    };
  }

  async content() {
    const html = await this.viewService.render('emails/user-contacts/new-contact', {
      artist: this.artist,
      contact: this.contact,
      translatePath: 'new-contact-email',
    });
    return {
      html,
    };
  }
}
