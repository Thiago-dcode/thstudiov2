import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { I18nService } from 'nestjs-i18n';
import { ProdGuard } from 'src/common/guards/prod.guard';
import { NotifyNewUserMail } from 'src/v1/modules/users/mails/notify-new-user.mail';
import { UserRepository } from 'src/v1/modules/users/users.repository';
@Controller('test')
@UseGuards(ProdGuard)
export class TestController {
  constructor(
    private readonly mailService: MailService,
    private readonly notifyNewUserMail: NotifyNewUserMail,
    private readonly userRepository: UserRepository,
    private readonly viewService: ViewService,
    private readonly i18nService: I18nService,
  ) {}

  @Get('i18n')
  async testI18n() {
    return this.i18nService.translate('test.HELLO');
  }

  @Get('view/:id')
  async testView(@Param('id') id: number) {
    const user = await this.userRepository.findById(id);
    const t = this.i18nService.translate.bind(this.i18nService);
    if (user) {
      const features = [
        t('notify-new-user-email.FEATURES.0'),
        t('notify-new-user-email.FEATURES.1'),
        t('notify-new-user-email.FEATURES.2'),
        t('notify-new-user-email.FEATURES.3'),
        t('notify-new-user-email.FEATURES.4'),
      ];
      return await this.viewService.render('emails/users/notify-new-user', {
        user,
        features,
      });
    }
    return {
      message: 'User not found',
    };
  }
  @Get('email/:id')
  async testEmail(@Param('id') id: number) {
    const user = await this.userRepository.findById(id);

    if (user) {
      this.notifyNewUserMail.setUser(user);
      await this.mailService.send(this.notifyNewUserMail);
      return {
        message: 'Email sent',
      };
    }
    return {
      message: 'User not found',
    };
  }
}
