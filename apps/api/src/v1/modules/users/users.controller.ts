import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './users.service';
import { UpdateUserRequest } from './requests/update-user.request';
import { ModelExistPipe } from 'src/pipes/model-exist.pipe';
import { IsNumberPipe } from 'src/pipes/is-number.pipe';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Public()
  @Get()
  async findAll() {
    return this.userService.findAll();
  }
  @Public()
  @Get(':id')
  @UsePipes(new IsNumberPipe(true), new ModelExistPipe('users'))
  async findOne(@Param('id') id: number) {
    return await this.userService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('avatar'))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserRequest,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    if (avatar) {
      updateUserDto.avatar = avatar;
    }
    return await this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.userService.remove(+id);
  }
}
