import {
  BadRequestException,
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/constants';
import { buildRedirectToUrl } from '@repo/common-lib/constants/redirect-to';
import { BaseUser } from '@repo/common-lib/types/user';
import { I18nService } from 'nestjs-i18n';
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
import { Public } from 'src/common/decorators/public.decorator';
import { SkipResponseTransform } from 'src/common/decorators/skip-response-transform.decorator';

const PREVIEW_LANGUAGES = ['EN', 'ES'] as const;
type PreviewLanguage = (typeof PREVIEW_LANGUAGES)[number];

/**
 * Supported email preview types (web user flows):
 * - new-contact, notify-new-user, password-recovery, twofa
 * - wait-list-welcome, wait-list-invite, wait-list-reminder
 * - subscription-changed, user-ai-credits-ended, user-account-banned
 */
@Controller('test')
@UseGuards(ProdGuard)
export class TestController {
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
   * Optional query: lang=EN|ES (default EN), send=1 to send + render (default: preview only).
   * Variant query params: final=1 (wait-list-reminder), upgrade=1 (subscription-changed).
   *
   * GET /test/view/email/:type/:userId?lang=es
   * GET /test/view/email/:type/:userId?lang=EN&send=1
   */
  @Public()
  @SkipResponseTransform()
  @Get('view/email/:type/:userId')
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
    const previewLang = this.resolvePreviewLang(lang);

    switch (type) {
      case 'new-contact':
        return this.handleNewContact(userId, shouldSend, previewLang);
      case 'notify-new-user':
        return this.handleNotifyNewUser(userId, shouldSend, previewLang);
      case 'password-recovery':
        return this.handlePasswordRecovery(userId, shouldSend, previewLang);
      case 'twofa':
        return this.handleTwoFa(userId, shouldSend, previewLang);
      case 'wait-list-welcome':
        return this.handleWaitListWelcome(userId, shouldSend, previewLang);
      case 'wait-list-invite':
        return this.handleWaitListInvite(userId, shouldSend, previewLang);
      case 'wait-list-reminder':
        return this.handleWaitListReminder(userId, shouldSend, previewLang, this.parseBooleanFlag(final, 'final'));
      case 'subscription-changed':
        return this.handleSubscriptionChanged(
          userId,
          shouldSend,
          previewLang,
          this.parseBooleanFlag(upgrade, 'upgrade'),
        );
      case 'user-ai-credits-ended':
        return this.handleUserAiCreditsEnded(userId, shouldSend, previewLang);
      case 'user-account-banned':
        return this.handleUserAccountBanned(userId, shouldSend, previewLang);
      default:
        throw new NotFoundException(`Unknown email type: ${type}`);
    }
  }

  private resolvePreviewLang(lang?: string): PreviewLanguage {
    const normalized = (lang ?? DEFAULT_LANGUAGE).trim().toUpperCase();
    if (PREVIEW_LANGUAGES.includes(normalized as PreviewLanguage)) {
      return normalized as PreviewLanguage;
    }
    throw new BadRequestException(`lang must be one of: ${PREVIEW_LANGUAGES.join(', ')}`);
  }

  private createTranslator(lang: PreviewLanguage) {
    return (key: string, options?: Record<string, unknown>) =>
      this.i18nService.translate(key, { lang, ...options });
  }

  private renderEmailPreview(view: string, lang: PreviewLanguage, data: Record<string, unknown>) {
    return this.viewService.render(view, {
      ...data,
      globals: {
        emailsPath: viewPath('emails'),
        appName: this.configService.get('app.name'),
        beautyUrl: 'www.a11studio.com',
        appUrl: this.configService.get('app.url'),
        env: this.configService.get('app.env'),
        t: this.createTranslator(lang),
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

  private async handleNewContact(userId: number, shouldSend: boolean, lang: PreviewLanguage) {
    const artist = await this.userRepository.findByIdCompact(userId);
    const contact = createMockNewContactInput(userId);

    if (shouldSend) {
      await this.mailService.send(this.newContactMail.setData(artist, contact));
    }

    return this.renderEmailPreview('emails/user-contacts/new-contact', lang, {
      artist,
      contact,
      translatePath: 'new-contact-email',
      unsuscribeUrl: '',
    });
  }

  private async handleNotifyNewUser(userId: number, shouldSend: boolean, lang: PreviewLanguage) {
    const user = await this.userRepository.findById(userId);
    const t = this.createTranslator(lang);
    const features = Array.from({ length: WELCOME_FEATURE_COUNT }, (_, index) =>
      t(`notify-new-user-email.FEATURES.${index}`),
    );

    if (shouldSend) {
      this.notifyNewUserMail.setUser(user);
      await this.mailService.send(this.notifyNewUserMail);
    }

    return this.renderEmailPreview('emails/users/notify-new-user', lang, {
      user,
      features,
      translatePath: 'notify-new-user-email',
      unsuscribeUrl: '',
      redirectHref: buildRedirectToUrl(`${this.appUrl()}/auth/login`, 'get-started'),
    });
  }

  private async handlePasswordRecovery(userId: number, shouldSend: boolean, lang: PreviewLanguage) {
    const user = await this.userRepository.findById(userId);
    const fallbackUrl = `${this.appUrl()}/auth/password-recovery/recover`;
    const passwordRecoveryAttempt = createMockPasswordRecoveryAttempt(userId, fallbackUrl);

    if (shouldSend) {
      await this.mailService.send(
        this.passwordRecoveryMail.setData(
          { email: user.email, username: user.username },
          passwordRecoveryAttempt,
        ),
      );
    }

    return this.renderEmailPreview('emails/auth/password-recovery-mail', lang, {
      user: { email: user.email, username: user.username },
      passwordRecoveryAttempt,
      translatePath: 'password-recovery-mail',
      unsuscribeUrl: '',
    });
  }

  private async handleTwoFa(userId: number, shouldSend: boolean, lang: PreviewLanguage) {
    const user = await this.userRepository.findById(userId);
    const twofaUser = {
      ...user,
      twofa_code: createMockTwofaCode(),
    } as unknown as BaseUser & { twofa_code: string };

    if (shouldSend) {
      await this.mailService.send(this.twoFAMail.setUser(twofaUser));
    }

    return this.renderEmailPreview('emails/auth/twofa-mail', lang, {
      user: twofaUser,
      translatePath: 'twofa-email',
      unsuscribeUrl: '',
    });
  }

  private async handleWaitListWelcome(userId: number, shouldSend: boolean, lang: PreviewLanguage) {
    const user = await this.userRepository.findById(userId);
    const waitList = createMockWaitListWelcomeData(user.email, this.appUrl());

    if (shouldSend) {
      await this.mailService.send(this.waitListWelcomeMail.setData(waitList));
    }

    return this.renderEmailPreview('emails/wait-list/welcome', lang, {
      waitList,
      translatePath: 'wait-list-welcome-email',
      unsuscribeUrl: '',
    });
  }

  private async handleWaitListInvite(userId: number, shouldSend: boolean, lang: PreviewLanguage) {
    const user = await this.userRepository.findById(userId);
    const invite = createMockWaitListInviteData(user.email, this.appUrl());

    if (shouldSend) {
      await this.mailService.send(this.waitListInviteMail.setData(invite));
    }

    return this.renderEmailPreview('emails/wait-list/invite', lang, {
      invite,
      translatePath: 'wait-list-invite-email',
      unsuscribeUrl: '',
    });
  }

  private async handleWaitListReminder(
    userId: number,
    shouldSend: boolean,
    lang: PreviewLanguage,
    isFinal: boolean,
  ) {
    const user = await this.userRepository.findById(userId);
    const reminder = createMockWaitListReminderData(user.email, this.appUrl(), isFinal);

    if (shouldSend) {
      await this.mailService.send(this.waitListReminderMail.setData(reminder));
    }

    return this.renderEmailPreview('emails/wait-list/reminder', lang, {
      reminder,
      translatePath: 'wait-list-reminder-email',
      unsuscribeUrl: '',
    });
  }

  private async handleSubscriptionChanged(
    userId: number,
    shouldSend: boolean,
    lang: PreviewLanguage,
    isUpgrade: boolean,
  ) {
    const user = await this.userRepository.findById(userId);
    const subscriptionData = createMockSubscriptionChangedData(isUpgrade);
    const t = this.createTranslator(lang);

    if (shouldSend) {
      await this.mailService.send(
        this.subscriptionChangedMail.setData(
          { email: user.email, username: user.username },
          subscriptionData,
          lang,
        ),
      );
    }

    return this.renderEmailPreview('emails/plan-subscriptions/subscription-changed', lang, {
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

  private async handleUserAiCreditsEnded(userId: number, shouldSend: boolean, lang: PreviewLanguage) {
    const user = await this.userRepository.findById(userId);
    const t = this.createTranslator(lang);

    if (shouldSend) {
      await this.mailService.send(
        this.userAiCreditsEndedMail.setUser({ email: user.email, username: user.username }, lang),
      );
    }

    return this.renderEmailPreview('emails/user-extra-data/user-ai-credits-ended', lang, {
      user: { email: user.email, username: user.username },
      translatePath: 'ai-credits-ended',
      t,
      redirectHref: buildRedirectToUrl(`${this.appUrl()}/auth/login`, 'subscriptions'),
      unsuscribeUrl: '',
    });
  }

  private async handleUserAccountBanned(userId: number, shouldSend: boolean, lang: PreviewLanguage) {
    const user = await this.userRepository.findById(userId);
    const t = this.createTranslator(lang);

    if (shouldSend) {
      await this.mailService.send(
        this.userAccountBannedMail.setUser({ email: user.email, username: user.username }, lang),
      );
    }

    return this.renderEmailPreview('emails/users/user-account-banned', lang, {
      user: { email: user.email, username: user.username },
      translatePath: 'account-banned',
      t,
      unsuscribeUrl: '',
    });
  }
}
