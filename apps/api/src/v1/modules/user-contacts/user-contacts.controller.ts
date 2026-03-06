import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { UserContactsService } from './user-contacts.service';
import { CreateUserContactRequest } from './requests/create-user-contact.request';
import { UpdateUserContactRequest } from './requests/update-user-contact.request';

@Controller('user-contacts')
export class UserContactsController {
  constructor(private readonly userContactsService: UserContactsService) {}

  @Post()
  create(@Body() createRequest: CreateUserContactRequest) {
    return this.userContactsService.create(createRequest);
  }

  @Get()
  findAll() {
    return this.userContactsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userContactsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateRequest: UpdateUserContactRequest) {
    return this.userContactsService.update(id, updateRequest);
  }
}
