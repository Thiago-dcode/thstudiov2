import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { InvitationLinkService } from '../invitation-links/invitation-link.service';
import { CreateInvitationLinkRequest } from '../invitation-links/requests/create-invitation-link.request';
import { IndexInvitationLinkRequest } from '../invitation-links/requests/index-invitation-link.request';
import { getConfigValue } from '@repo/common-lib/config/utils';

@Controller('invitation-links')
@UseGuards(AdminGuard)
export class AdminInvitationLinksController {
  constructor(
    private readonly invitationLinkService: InvitationLinkService,
  ) { }

  @Get()
  async findAll(@Query() query: IndexInvitationLinkRequest) {
    return (await this.invitationLinkService.findAll(query)).map(il => {

      return {
        ...il,
        url: getConfigValue('app').url + `/auth/register?ref=${il.code}`
      }
    });
  }

  @Post()
  async create(@Body() body: CreateInvitationLinkRequest) {
    return this.invitationLinkService.create(body);
  }
}
