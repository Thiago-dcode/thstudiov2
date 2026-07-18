import { Body, Controller, Get, Param, Post, UnauthorizedException } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { EmailPreferencesService } from './email-preferences.service';
import { CreateOrUpdateEmailPreferenceRequest } from './requests/create-or-update-email-preference.request';

@Controller('email-preferences')
export class EmailPreferencesController {
  constructor(private readonly emailPreferencesService: EmailPreferencesService) {}

  @Public()
  @Post()
  public async createOrUpdate(
    @Body() { token, ...request }: CreateOrUpdateEmailPreferenceRequest,
  ) {
    const existing = await this.emailPreferencesService.getOneByEmail(request.email);
    if (!existing || existing.token !== token) {
      throw new UnauthorizedException();
    }
    return await this.emailPreferencesService.createOrUpdateByEmail(request);
  }
  
  @Public()
  @Get(':token/token')
  public async getByToken(@Param('token') token: string) {
    return await this.emailPreferencesService.getByToken(token);
  }
}
