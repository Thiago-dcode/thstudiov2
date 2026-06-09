import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { InvitationLinkService } from './invitation-link.service';

@Controller('invitation-links')
export class InvitationLinkController {
  constructor(
    private readonly invitationLinkService: InvitationLinkService,
  ) { }

  // GET /api/v1/invitation-links/{code}/code
  @Public()
  @Get(':code/code')
  async findByCode(@Param('code') code: string) {
    if (!code) throw new BadRequestException('Invalid code');
    return this.invitationLinkService.findByCode(code);
  }

  // GET /api/v1/invitation-links/{code}/code/valid
  @Public()
  @Get(':code/code/valid')
  async validateCode(@Param('code') code: string) {
    if (!code) return null;
    return this.invitationLinkService.validateCode(code);
  }
}

