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
import { I18nService } from 'nestjs-i18n';
import { ProdGuard } from 'src/common/guards/prod.guard';
import { viewPath } from 'src/common/utils';
import { NotifyNewUserMail, WELCOME_FEATURE_COUNT } from 'src/v1/modules/users/mails/notify-new-user.mail';
import { NewContactMail } from 'src/v1/modules/user-contacts/mails/new-contact.mail';
import { UserRepository } from 'src/v1/modules/users/users.repository';
import { createMockNewContactInput } from './mocks/email-preview.mock-data';
import { Public } from 'src/common/decorators/public.decorator';
import { SkipResponseTransform } from 'src/common/decorators/skip-response-transform.decorator';

const PREVIEW_LANGUAGES = ['EN', 'ES'] as const;
type PreviewLanguage = (typeof PREVIEW_LANGUAGES)[number];

@Controller('test')
@UseGuards(ProdGuard)
export class TestController {
  constructor(
    private readonly mailService: MailService,
    private readonly notifyNewUserMail: NotifyNewUserMail,
    private readonly newContactMail: NewContactMail,
    private readonly userRepository: UserRepository,
    private readonly viewService: ViewService,
    private readonly i18nService: I18nService,
    private readonly configService: ConfigService,
  ) { }

  @Get('i18n')
  async testI18n() {
    return this.i18nService.translate('test.HELLO');
  }

  /**
   * Preview an email in the browser.
   * Optional query: lang=EN|ES (default EN), send=1 to send + render (default: preview only).
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
  ) {
    const shouldSend = this.parseSendFlag(send);
    const previewLang = this.resolvePreviewLang(lang);

    switch (type) {
      case 'new-contact':
        return this.handleNewContact(userId, shouldSend, previewLang);
      case 'notify-new-user':
        return this.handleNotifyNewUser(userId, shouldSend, previewLang);
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

    const _data = {
      ...data,
      globals: {
        emailsPath: viewPath('emails'),
        appName: this.configService.get('app.name'),
        beautyUrl: 'www.a11studio.com',
        appUrl: this.configService.get('app.url'),
        env: this.configService.get('app.env'),
        t: this.createTranslator(lang),
      },
    }
    console.log("DATA",_data)
    return this.viewService.render(view, _data);
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
      redirectHref: buildRedirectToUrl(`${this.configService.get('app.url')}/auth/login`, 'get-started'),
    });
  }
}
