import { mailingNoreplyEmail, mailingSupportEmail } from '@repo/backend-lib/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { CreateUserContactInput } from '@repo/common-lib/types/user-contact';
import { CompactUser } from '@repo/common-lib/types/user';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

@Injectable()
export class NewContactMail extends ApiMailService {
  private artist: CompactUser;
  private contact: CreateUserContactInput;
  /** True when this contact form submission was addressed to the support inbox (e.g. `/support` page) rather than an artist profile. */
  private isSupportContact = false;

  constructor(
    viewService: ViewService,
    emailPreferencesService: EmailPreferencesService,
    i18nService: I18nService,
  ) {
    super(viewService, emailPreferencesService, {
      viewPath: 'emails/user-contacts/new-contact',
      data: {},
      emailType: 'TRANSACTIONAL',
    }, i18nService);
  }

  setData(artist: CompactUser, contact: CreateUserContactInput, lang?: string) {
    const mail = new NewContactMail(this.viewService, this.emailPreferencesService!, this.i18nService!);
    mail.artist = artist;
    mail.contact = contact;
    if (lang) mail.lang = lang;

    mail.isSupportContact =
      !!mailingSupportEmail && artist.email.trim().toLowerCase() === mailingSupportEmail.trim().toLowerCase();

    mail.viewParams = {
      viewPath: 'emails/user-contacts/new-contact',
      data: {
        artist: mail.artist,
        contact: mail.contact,
        translatePath: 'new-contact-email',
        isSupportContact: mail.isSupportContact,
      },
      emailType: 'TRANSACTIONAL',
    };
    return mail;
  }

  protected async buildEnvelope() {
    return {
      from: `${mailingNoreplyEmail}`,
      to: this.artist.email,
      subject: this.t(this.isSupportContact ? 'new-contact-email.SUPPORT_SUBJECT' : 'new-contact-email.SUBJECT'),
      replyTo: this.contact.contact_email,
    };
  }
}
