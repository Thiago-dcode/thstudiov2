import {
  BadRequestException,
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  Scope,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mailingContactEmail, mailingSupportEmail } from '@repo/backend-lib/config/mailling';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/language';
import { buildRedirectToUrl } from '@repo/common-lib/constants/redirect-to';
import { BaseUser, CompactUser, User } from '@repo/common-lib/types/user';
import { I18nService } from 'nestjs-i18n';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { ProdGuard } from 'src/common/guards/prod.guard';
import { viewPath } from 'src/common/utils';
import { PasswordRecoveryMail } from 'src/v1/modules/auth/mails/password-recovery-mail';
import { TwoFAMail } from 'src/v1/modules/auth/mails/twofa-mail';
import { NotifyNewUserMail, WELCOME_FEATURE_COUNT } from 'src/v1/modules/users/mails/notify-new-user.mail';
import { UserAccountBannedMail } from 'src/v1/modules/users/mails/user-account-banned.mail';
import { NewContactMail } from 'src/v1/modules/user-contacts/mails/new-contact.mail';
import { UserRepository } from 'src/v1/modules/users/users.repository';
import { WaitListWelcomeMail } from 'src/v1/modules/wait-list/mails/wait-list-welcome.mail';
import { WaitListInviteMail } from 'src/v1/modules/wait-list/mails/wait-list-invite.mail';
import { WaitListReminderMail } from 'src/v1/modules/wait-list/mails/wait-list-reminder.mail';
import { SubscriptionChangedMail } from 'src/v1/modules/plan-subscriptions/mails/subscription-changed.mail';
import { UserAiCreditsEndedMail } from 'src/v1/modules/user-extra-data/mails/user-metrics-ended';
import {
  createMockNewContactInput,
  createMockPasswordRecoveryAttempt,
  createMockSubscriptionChangedData,
  createMockTwofaCode,
  createMockWaitListInviteData,
  createMockWaitListReminderData,
  createMockWaitListWelcomeData,
} from './mocks/email-preview.mock-data';
import { SkipResponseTransform } from 'src/common/decorators/skip-response-transform.decorator';
import { ENUMS, EnumType } from '@repo/common-lib/constants/enums';

const PREVIEW_LANGUAGES = ENUMS.LANGUAGE_CODE;
type PreviewLanguage = EnumType<'LANGUAGE_CODE'>;

/**
 * Supported email preview types (web user flows):
 * - new-contact, notify-new-user, password-recovery, twofa
 * - wait-list-welcome, wait-list-invite, wait-list-reminder
 * - subscription-changed, user-ai-credits-ended, user-account-banned
 *
 * Request-scoped: `previewUser`/`lang` are resolved once per request in
 * `previewEmail()` and read by every handler, instead of being threaded
 * through as parameters.
 */
// ProdGuard alone only blocks NODE_ENV=production, which left every route here open
// on dev.a11studio.com. AdminGuard additionally requires an authenticated ADMIN, so
// the email preview can no longer be used anonymously to read arbitrary users' data
// or to send mail to them via `?send=1`.
@Controller({ path: 'test', scope: Scope.REQUEST })
@UseGuards(ProdGuard, AdminGuard)
export class TestController {
  private previewUser!: User;
  private lang!: PreviewLanguage;

  constructor(
    private readonly mailService: MailService,
    private readonly notifyNewUserMail: NotifyNewUserMail,
    private readonly newContactMail: NewContactMail,
    private readonly passwordRecoveryMail: PasswordRecoveryMail,
    private readonly twoFAMail: TwoFAMail,
    private readonly waitListWelcomeMail: WaitListWelcomeMail,
    private readonly waitListInviteMail: WaitListInviteMail,
    private readonly waitListReminderMail: WaitListReminderMail,
    private readonly subscriptionChangedMail: SubscriptionChangedMail,
    private readonly userAiCreditsEndedMail: UserAiCreditsEndedMail,
    private readonly userAccountBannedMail: UserAccountBannedMail,
    private readonly userRepository: UserRepository,
    private readonly viewService: ViewService,
    private readonly i18nService: I18nService,
    private readonly configService: ConfigService,
  ) {}

  @Get('i18n')
  async testI18n() {
    return this.i18nService.translate('test.HELLO');
  }

  /**
   * Preview an email in the browser.
   * Optional query: lang=EN|ES (default: the previewed user's own language), send=1 to send + render (default: preview only).
   * Variant query params: final=1 (wait-list-reminder), upgrade=1 (subscription-changed).
   *
   * GET /test/view/email/:type/:userId?lang=es
   * GET /test/view/email/:type/:userId?lang=EN&send=1
   */
  @SkipResponseTransform()
  @Get('email/:type/:userId')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async previewEmail(
    @Param('type') type: string,
    @Param('userId', ParseIntPipe) userId: number,
    @Query('lang') lang?: string,
    @Query('send') send?: string,
    @Query('final') final?: string,
    @Query('upgrade') upgrade?: string,
  ) {
    const shouldSend = this.parseSendFlag(send);
    this.previewUser = await this.userRepository.findById(userId);
    this.lang = this.resolvePreviewLang(lang, this.previewUser.language);

    switch (type) {
      case 'new-contact':
        return this.handleNewContact(shouldSend);
      case 'notify-new-user':
        return this.handleNotifyNewUser(shouldSend);
      case 'password-recovery':
        return this.handlePasswordRecovery(shouldSend);
      case 'twofa':
        return this.handleTwoFa(shouldSend);
      case 'wait-list-welcome':
        return this.handleWaitListWelcome(shouldSend);
      case 'wait-list-invite':
        return this.handleWaitListInvite(shouldSend);
      case 'wait-list-reminder':
        return this.handleWaitListReminder(shouldSend, this.parseBooleanFlag(final, 'final'));
      case 'subscription-changed':
        return this.handleSubscriptionChanged(shouldSend, this.parseBooleanFlag(upgrade, 'upgrade'));
      case 'user-ai-credits-ended':
        return this.handleUserAiCreditsEnded(shouldSend);
      case 'user-account-banned':
        return this.handleUserAccountBanned(shouldSend);
      default:
        throw new NotFoundException(`Unknown email type: ${type}`);
    }
  }

  private resolvePreviewLang(lang?: string, fallback?: string): PreviewLanguage {
    const normalized = (lang ?? fallback ?? DEFAULT_LANGUAGE).trim().toUpperCase();
    if (PREVIEW_LANGUAGES.includes(normalized as PreviewLanguage)) {
      return normalized as PreviewLanguage;
    }
    throw new BadRequestException(`lang must be one of: ${PREVIEW_LANGUAGES.join(', ')}`);
  }

  private createTranslator() {
    return (key: string, options?: Record<string, unknown>) =>
      this.i18nService.translate(key, { lang: this.lang, ...options });
  }

  private renderEmailPreview(view: string, data: Record<string, unknown>) {
    const t = this.createTranslator();
    return this.viewService.render(view, {
      ...data,
      // Same contract as ApiMailService: top-level lang-bound `t`.
      // ViewService mirrors it onto globals.t for includes.
      t,
      globals: {
        emailsPath: viewPath('emails'),
        appName: this.configService.get('app.name'),
        beautyUrl: 'www.a11studio.com',
        appUrl: this.configService.get('app.url'),
        env: this.configService.get('app.env'),
      },
    });
  }

  private parseSendFlag(send?: string): boolean {
    if (send === undefined) {
      return false;
    }
    if (send === '1') {
      return true;
    }
    throw new BadRequestException('send must be 1 to send the email');
  }

  private parseBooleanFlag(value: string | undefined, name: string): boolean {
    if (value === undefined) {
      return false;
    }
    if (value === '1') {
      return true;
    }
    throw new BadRequestException(`${name} must be 1 when provided`);
  }

  private appUrl(): string {
    return this.configService.get('app.url');
  }

  private toCompactUser(user: User): CompactUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      surname: user.surname,
      benefit_id: user.benefit?.id ?? null,
      language: user.language,
    };
  }

  private async handleNewContact(shouldSend: boolean) {
    const artist = this.toCompactUser(this.previewUser);
    const contact = createMockNewContactInput(this.previewUser.id);
    const t = this.createTranslator();
    const isSupportContact =
      !!mailingSupportEmail && artist.email.trim().toLowerCase() === mailingSupportEmail.trim().toLowerCase();

    if (shouldSend) {
      await this.mailService.send(this.newContactMail.setData(artist, contact, this.lang));
    }

    return this.renderEmailPreview('emails/user-contacts/new-contact', {
      artist,
      contact,
      translatePath: 'new-contact-email',
      isSupportContact,
      t,
      unsuscribeUrl: '',
    });
  }

  private async handleNotifyNewUser(shouldSend: boolean) {
    const user = this.previewUser;
    const t = this.createTranslator();
    const features = Array.from({ length: WELCOME_FEATURE_COUNT }, (_, index) =>
      t(`notify-new-user-email.FEATURES.${index}`),
    );

    if (shouldSend) {
      await this.mailService.send(this.notifyNewUserMail.setUser(user, this.lang));
    }

    return this.renderEmailPreview('emails/users/notify-new-user', {
      user,
      features,
      translatePath: 'notify-new-user-email',
      t,
      unsuscribeUrl: '',
      redirectHref: buildRedirectToUrl(`${this.appUrl()}/auth/login`, 'get-started'),
    });
  }

  private async handlePasswordRecovery(shouldSend: boolean) {
    const user = this.previewUser;
    const fallbackUrl = `${this.appUrl()}/auth/password-recovery/recover`;
    const passwordRecoveryAttempt = createMockPasswordRecoveryAttempt(user.id, fallbackUrl);
    const t = this.createTranslator();

    if (shouldSend) {
      await this.mailService.send(
        this.passwordRecoveryMail.setData(
          { email: user.email, username: user.username },
          passwordRecoveryAttempt,
          this.lang,
        ),
      );
    }

    return this.renderEmailPreview('emails/auth/password-recovery-mail', {
      user: { email: user.email, username: user.username },
      passwordRecoveryAttempt,
      translatePath: 'password-recovery-mail',
      t,
      unsuscribeUrl: '',
    });
  }

  private async handleTwoFa(shouldSend: boolean) {
    const twofaUser = {
      ...this.previewUser,
      twofa_code: createMockTwofaCode(),
    } as unknown as BaseUser & { twofa_code: string };
    const t = this.createTranslator();

    if (shouldSend) {
      await this.mailService.send(this.twoFAMail.setUser(twofaUser, this.lang));
    }

    return this.renderEmailPreview('emails/auth/twofa-mail', {
      user: twofaUser,
      translatePath: 'twofa-email',
      t,
      unsuscribeUrl: '',
    });
  }

  private async handleWaitListWelcome(shouldSend: boolean) {
    const waitList = createMockWaitListWelcomeData(this.previewUser.email, this.appUrl());

    if (shouldSend) {
      await this.mailService.send(this.waitListWelcomeMail.setData(waitList, this.lang));
    }

    return this.renderEmailPreview('emails/wait-list/welcome', {
      waitList,
      translatePath: 'wait-list-welcome-email',
      unsuscribeUrl: '',
    });
  }

  private async handleWaitListInvite(shouldSend: boolean) {
    const invite = createMockWaitListInviteData(this.previewUser.email, this.appUrl());

    if (shouldSend) {
      await this.mailService.send(this.waitListInviteMail.setData(invite, this.lang));
    }

    return this.renderEmailPreview('emails/wait-list/invite', {
      invite,
      translatePath: 'wait-list-invite-email',
      unsuscribeUrl: '',
    });
  }

  private async handleWaitListReminder(shouldSend: boolean, isFinal: boolean) {
    const reminder = createMockWaitListReminderData(this.previewUser.email, this.appUrl(), isFinal);

    if (shouldSend) {
      await this.mailService.send(this.waitListReminderMail.setData(reminder, this.lang));
    }

    return this.renderEmailPreview('emails/wait-list/reminder', {
      reminder,
      translatePath: 'wait-list-reminder-email',
      unsuscribeUrl: '',
    });
  }

  private async handleSubscriptionChanged(shouldSend: boolean, isUpgrade: boolean) {
    const user = this.previewUser;
    const subscriptionData = createMockSubscriptionChangedData(isUpgrade);
    const t = this.createTranslator();

    if (shouldSend) {
      await this.mailService.send(
        this.subscriptionChangedMail.setData(
          { email: user.email, username: user.username },
          subscriptionData,
          this.lang,
        ),
      );
    }

    return this.renderEmailPreview('emails/plan-subscriptions/subscription-changed', {
      user: { email: user.email, username: user.username },
      translatePath: 'subscription-changed',
      t,
      isUpgrade: subscriptionData.isUpgrade,
      newPlanName: subscriptionData.newPlanName,
      prevPlanName: subscriptionData.prevPlanName,
      redirectHref: buildRedirectToUrl(`${this.appUrl()}/auth/login`, 'atelier'),
      unsuscribeUrl: '',
    });
  }

  private async handleUserAiCreditsEnded(shouldSend: boolean) {
    const user = this.previewUser;
    const t = this.createTranslator();

    if (shouldSend) {
      await this.mailService.send(
        this.userAiCreditsEndedMail.setUser({ email: user.email, username: user.username }, this.lang),
      );
    }

    return this.renderEmailPreview('emails/user-extra-data/user-ai-credits-ended', {
      user: { email: user.email, username: user.username },
      translatePath: 'ai-credits-ended',
      t,
      redirectHref: buildRedirectToUrl(`${this.appUrl()}/auth/login`, 'subscriptions'),
      unsuscribeUrl: '',
    });
  }

  private async handleUserAccountBanned(shouldSend: boolean) {
    const user = this.previewUser;
    const t = this.createTranslator();

    if (shouldSend) {
      await this.mailService.send(
        this.userAccountBannedMail.setUser({ email: user.email, username: user.username }, this.lang),
      );
    }

    return this.renderEmailPreview('emails/users/user-account-banned', {
      user: { email: user.email, username: user.username },
      translatePath: 'account-banned',
      t,
      supportEmail: mailingContactEmail,
      unsuscribeUrl: '',
    });
  }
}
