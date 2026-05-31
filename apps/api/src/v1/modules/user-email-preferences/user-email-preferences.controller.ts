import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ModelExistPipe } from 'src/pipes/model-exist.pipe';
import { IsUserAuthPipe } from 'src/pipes/is-user-auth.pipe';
import { EmailPreferencesService } from '../email-preferences/email-preferences.service';



@Controller('users')
export class UserEmailPreferenceController {
  constructor(
    private readonly emailPreferencesService: EmailPreferencesService,
  ) { }

  @Get(':id/email-preference')
  public async getByUserId(
    @Param('id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe)
    id: number,
  ) {
    return await this.emailPreferencesService.getByUserId(id);
  }
}
