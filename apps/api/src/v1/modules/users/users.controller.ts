import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { PUBLIC_READ_THROTTLE } from 'src/common/utils/constants';
import { UserService } from './users.service';
import { UpdateUserRequest } from './requests/update-user.request';
import { ModelExistPipe } from 'src/pipes/model-exist.pipe';
import { ToLowerCasePipe } from 'src/pipes/to-lowercase.pipe';
import { Public } from 'src/common/decorators/public.decorator';
import { UserExtraDataService } from '../user-extra-data/user-extra-data.service';
import { IsUserAuthPipe } from 'src/pipes/is-user-auth.pipe';
import { PlansService } from '../plans/plans.service';

import { FindUserRequest } from './requests/find-user.request';
import { CategoriesService } from '../categories/categories.service';
import { AddressService } from '../addresses/address.service';
import { UpdateUserPasswordRequest } from './requests/update-user-password.request';
import { IndexArtistsRequest } from './requests/index-artists.request';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userExtraDataService: UserExtraDataService,
    private readonly planService: PlansService,
    private readonly categoriesService: CategoriesService,
    private readonly addressService: AddressService,
  ) { }
  // Per-route rather than on the class: the account endpoints below keep the
  // stricter global defaults.
  @Throttle(PUBLIC_READ_THROTTLE)
  @Public()
  @Get()
  async findAll(@Query() query: IndexArtistsRequest) {
    return this.userService.findAll(query);
  }

  @Public()
  @Get('profile/:username')
  async getProfile(
    @Param('username', ToLowerCasePipe, new ModelExistPipe('users', 'username'))
    username: string,
  ) {
    return await this.userService.getProfileByUsername(username);
  }

  @Public()
  @Get('compact/:username')
  async getCompacted(
    @Param('username', ToLowerCasePipe, new ModelExistPipe('users', 'username'))
    username: string,
  ) {
    return await this.userService.getCompactedByUsername(username);
  }

  @Public()
  @Get('exists/:username')
  async usernameExists(@Param('username', ToLowerCasePipe) username: string) {
    return await this.userService.usernameExists(username);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe, new ModelExistPipe('users')) id: number,
    @Query() queryParams: FindUserRequest,
  ) {
    return await this.userService.findOne(id, queryParams);
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
  @Public()
  @Get(':id/categories')
  findAllCategories(
    @Param('id', ParseIntPipe, new ModelExistPipe('users')) id: number,
  ) {
    return this.categoriesService.findAllUserCategories(id);
  }

  @Public()
  @Get(':id/address')
  async findAddress(
    @Param('id', ParseIntPipe, new ModelExistPipe('users'))
    id: number,
  ) {
    return await this.addressService.findOneByUser(id);
  }

  @Get(':id/metrics')
  async getMetrics(
    @Param('id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe)
    id: number,
  ) {
    const [extra_data, userActivePlan] = await Promise.all([
      this.userExtraDataService.findOneByUserId(id),
      this.planService.findUserActivePlan(id),
    ]);

    const active_plan = userActivePlan ?? (await this.planService.findFreePlan());

    return {
      extra_data,
      active_plan,
    };
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserRequest,
    @UploadedFiles()
    files: { avatar?: Express.Multer.File[]; banner?: Express.Multer.File[] },
  ) {
    if (files?.avatar?.[0]) {
      updateUserDto.avatar = files.avatar[0];
    }
    if (files?.banner?.[0]) {
      updateUserDto.banner = files.banner[0];
    }
    return await this.userService.update(+id, updateUserDto);
  }

  @Post(':id/password')
  async updatePassword(
    @Param('id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe) id: number,
    @Body() body: UpdateUserPasswordRequest,
  ) {
    return await this.userService.updatePassword(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.userService.remove(+id);
  }
}
