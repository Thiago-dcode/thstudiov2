import { Controller, Get, UseGuards } from '@nestjs/common';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { ProdGuard } from 'src/common/guards/prod-guard/prod.guard';

@Controller('views-test')
@UseGuards(ProdGuard)
export class ViewsTestController {
  constructor(private readonly viewService: ViewService) {}

  @Get('email')
  async getViewsTest() {
    const features = [
      'Manage and organize all your artwork',
      'Create outstanding portfolio(s) to reach more clients',
      'Add info about your clients',
      'Show your available services',
      'Connect with other artists',
      'And much more!',
    ];
    return await this.viewService.render('emails/users/notify-new-user', {
      user: {
        id: 1,
        username: 'JohnDoe',
        email: 'john.doe@example.com',
        email_validated: false,
      },
      features,
    });
  }
}
