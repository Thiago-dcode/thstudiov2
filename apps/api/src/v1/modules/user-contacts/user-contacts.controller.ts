import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe, Query } from '@nestjs/common';
import { UserContactsService } from './user-contacts.service';
import { CreateUserContactRequest } from './requests/create-user-contact.request';
import { UpdateUserContactRequest } from './requests/update-user-contact.request';
import { IndexUserContactRequest } from './requests/index-user-contact.request';
import { Public } from 'src/common/decorators/public.decorator';
import { ModelExistPipe } from 'src/pipes/model-exist.pipe';
import { IsUserAuthPipe } from 'src/pipes/is-user-auth.pipe';

@Controller('users/:user_id/contacts')
export class UserContactsController {
  constructor(private readonly userContactsService: UserContactsService) { }

  @Public()
  @Post()
  create(
    @Param('user_id', ParseIntPipe, new ModelExistPipe('users')) user_id: number,
    @Body() createRequest: CreateUserContactRequest
  ) {
    createRequest.user_id = user_id;
    return this.userContactsService.create(createRequest);
  }

  @Get()
  findAll(
    @Param('user_id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe) user_id: number,
    @Query() filters: IndexUserContactRequest
  ) {
    return this.userContactsService.findAll(user_id, filters);
  }

  @Get(':id')
  findOne(
    @Param('user_id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe) user_id: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.userContactsService.findOne(id, user_id);
  }

  @Patch(':id')
  update(
    @Param('user_id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe) user_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRequest: UpdateUserContactRequest
  ) {
    return this.userContactsService.update(id, user_id, updateRequest);
  }
}
