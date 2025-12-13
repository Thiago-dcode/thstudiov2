import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserExtraDataService } from './user-extra-data.service';
import { CreateUserExtraDatumDto } from './requests/create-user-extra-datum.dto';
import { UpdateUserExtraDatumDto } from './requests/update-user-extra-datum.dto';

@Controller('user-extra-data')
export class UserExtraDataController {
  constructor(private readonly userExtraDataService: UserExtraDataService) {}

  @Post()
  create(@Body() createUserExtraDatumDto: CreateUserExtraDatumDto) {
    return this.userExtraDataService.create(createUserExtraDatumDto);
  }

  @Get()
  findAll() {
    return this.userExtraDataService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userExtraDataService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserExtraDatumDto: UpdateUserExtraDatumDto) {
    return this.userExtraDataService.update(+id, updateUserExtraDatumDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userExtraDataService.remove(+id);
  }
}
