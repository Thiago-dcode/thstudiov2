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
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UserService } from './users.service';
import { UpdateUserRequest } from './requests/update-user.request';
import { ModelExistPipe } from 'src/pipes/model-exist.pipe';
import { Public } from 'src/common/decorators/public.decorator';
import { UserExtraDataService } from '../user-extra-data/user-extra-data.service';
import { IsUserAuthPipe } from 'src/pipes/is-user-auth.pipe';
import { PlansService } from '../plans/plans.service';
import { PlanSubscriptionsService } from '../plan-subscriptions/plan-subscriptions.service';
import { FindUserRequest } from './requests/find-user.request';
import { CategoriesService } from '../categories/categories.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userExtraDataService: UserExtraDataService,
    private readonly planService: PlansService,
    private readonly planSubscriptionsService: PlanSubscriptionsService,
    private readonly categoriesService: CategoriesService,
  ) {}
  @Public()
  @Get()
  async findAll() {
    return this.userService.findAll();
  }
  @Public()
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
  @Get(':id/subscription')
  async findActive(
    @Param('id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe)
    id: number,
  ) {
    return await this.planSubscriptionsService.findActiveSubscription(id);
  }

  @Public()
  @Get(':id/categories')
  findAllCategories(
    @Param('id', ParseIntPipe, new ModelExistPipe('users')) id: number,
  ) {
    return this.categoriesService.findAllUserCategories(id);
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

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.userService.remove(+id);
  }
}
