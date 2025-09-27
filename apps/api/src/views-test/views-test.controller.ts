import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { ProdGuard } from 'src/common/guards/prod-guard/prod.guard';
import { NotifyNewUserMail } from 'src/v1/modules/users/mails/notify-new-user.mail';
import { UserRepository } from 'src/v1/modules/users/users.repository';

@Controller('test')
@UseGuards(ProdGuard)
export class ViewsTestController {
  constructor(
    private readonly mailService: MailService,
    private readonly notifyNewUserMail: NotifyNewUserMail,
    private readonly userRepository: UserRepository,
    private readonly viewService: ViewService,
  ) {}

  @Get('view/:id')
  async testView(@Param('id') id: number) {
    const user = await this.userRepository.findById(id);
    if (user) {
      const features = [
        'Manage and organize all your artwork',
        'Create outstanding portfolio(s) to reach more clients',
        'Add info about your clients',
        'Show your available services',
        'Connect with other artists',
        'And much more!',
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
