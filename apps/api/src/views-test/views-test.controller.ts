import { Controller, Get, UseGuards } from '@nestjs/common';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { ProdGuard } from 'src/common/guards/prod-guard/prod.guard';

@Controller('views-test')
@UseGuards(ProdGuard)
export class ViewsTestController {
  constructor(private readonly viewService: ViewService) {}

  @Get('email')
  async getViewsTest() {
    return await this.viewService.render('emails/users/notify-new-user', {
      user: {
        username: 'JohnDoe',
        email: 'john.doe@example.com',
      },
    });
  }
}
