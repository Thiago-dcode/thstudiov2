import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { EmailPreferencesService } from './email-preferences.service';
import { CreateOrUpdateEmailPreferenceRequest } from './requests/create-or-update-email-preference.request';

@Controller('email-preferences')
export class EmailPreferencesController {
  constructor(private readonly emailPreferencesService: EmailPreferencesService) {}

  @Public()
  @Post()
  public async createOrUpdate(
    @Body() request: CreateOrUpdateEmailPreferenceRequest,
  ) {
    return await this.emailPreferencesService.createOrUpdateByEmail(request);
  }
  
  @Public()
  @Get(':token/token')
  public async getByToken(@Param('token') token: string) {
    return await this.emailPreferencesService.getByToken(token);
  }
}
