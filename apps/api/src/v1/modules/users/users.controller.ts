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
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './users.service';
import { UpdateUserRequest } from './requests/update-user.request';
import { ModelExistPipe } from 'src/pipes/model-exist.pipe';
import { IsNumberPipe } from 'src/pipes/is-number.pipe';
import { Public } from 'src/common/decorators/public.decorator';
import { UserExtraDataService } from '../user-extra-data/user-extra-data.service';
import { IsUserAuthPipe } from 'src/pipes/is-user-auth.pipe';
import { PlansService } from '../plans/plans.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userExtraDataService: UserExtraDataService,
    private readonly planService: PlansService,
  ) {}
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
  @Get(':id/extra-data')
  async findExtraData(
    @Param('id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe)
    id: number,
  ) {
    return await this.userExtraDataService.findOneByUserId(+id);
  }

  @Get(':id/plan')
  async finUserActivePlan(
    @Param('id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe)
    id: number,
  ) {
    return await this.planService.findUserActivePlan(+id);
  }

  @Get(':id/metrics')
  async getMetrics(
    @Param('id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe)
    id: number,
  ) {
    const [extra_data, active_plan] = await Promise.all([
      this.userExtraDataService.findOneByUserId(id),
      this.planService.findUserActivePlan(id),
    ]);
    return {
      extra_data,
      active_plan,
    };
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
