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
  UseGuards,
} from '@nestjs/common';
import { PublicArtistGuard } from 'src/common/guards/public-artist.guard';
import { AllowWhileStrikeBanned } from 'src/common/decorators/allow-while-strike-banned.decorator';
import { RequestAccountDeletionRequest } from './requests/request-account-deletion.request';
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
import { ProfileStatusService } from '../profile-status/profile-status.service';
import { IMAGE_UPLOAD_OPTIONS } from 'src/common/utils/upload-limits';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userExtraDataService: UserExtraDataService,
    private readonly planService: PlansService,
    private readonly categoriesService: CategoriesService,
    private readonly addressService: AddressService,
    private readonly profileStatusService: ProfileStatusService,
  ) { }
  // Per-route rather than on the class: the public artist reads below all share
  // the wider budget, and the account endpoints after them keep the stricter
  // global defaults. Every artist sub-page renders `profile` (in
  // `generateMetadata`) plus `exists`, so a visitor clicking two tabs spent the
  // global 10/s on reads that are Redis-cached and cost us nothing.
  @Throttle(PUBLIC_READ_THROTTLE)
  @Public()
  @Get()
  async findAll(@Query() query: IndexArtistsRequest) {
    return this.userService.findAll(query);
  }

  @Throttle(PUBLIC_READ_THROTTLE)
  @Public()
  @UseGuards(PublicArtistGuard)
  @Get('profile/:username')
  async getProfile(
    @Param('username', ToLowerCasePipe, new ModelExistPipe('users', 'username'))
    username: string,
  ) {
    return await this.userService.getProfileByUsername(username);
  }

  @Throttle(PUBLIC_READ_THROTTLE)
  @Public()
  @UseGuards(PublicArtistGuard)
  @Get('compact/:username')
  async getCompacted(
    @Param('username', ToLowerCasePipe, new ModelExistPipe('users', 'username'))
    username: string,
  ) {
    return await this.userService.getCompactedByUsername(username);
  }

  // No `ModelExistPipe`: the lookup itself 404s an unknown username, so the pipe would only add a
  // second query to a read every artist page makes.
  @Throttle(PUBLIC_READ_THROTTLE)
  @Public()
  @UseGuards(PublicArtistGuard)
  @Get('branding/:username')
  async getBranding(@Param('username', ToLowerCasePipe) username: string) {
    return await this.userService.getBrandingByUsername(username);
  }

  @Throttle(PUBLIC_READ_THROTTLE)
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
  @UseGuards(PublicArtistGuard)
  @Get(':id/categories')
  findAllCategories(
    @Param('id', ParseIntPipe, new ModelExistPipe('users')) id: number,
  ) {
    return this.categoriesService.findAllUserCategories(id);
  }

  @Public()
  @UseGuards(PublicArtistGuard)
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
    // `account` rides along (in parallel, a primary-key read) so the atelier learns about a pending
    // deletion / deactivation from the request it already makes, instead of a server fetch in its
    // layout that would hold up every atelier page.
    const [extra_data, userActivePlan, profile_status, account] = await Promise.all([
      this.userExtraDataService.findOneByUserId(id),
      this.planService.findUserActivePlan(id),
      this.profileStatusService.findOneByUserId(id),
      this.userService.getAccountStatus(id),
    ]);

    const active_plan = userActivePlan ?? (await this.planService.findFreePlan());

    return {
      extra_data,
      active_plan,
      profile_status,
      account,
    };
  }

  @Post(':id/profile-status/close')
  async closeProfileStatus(
    @Param('id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe)
    id: number,
  ) {
    return await this.profileStatusService.close(id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ], IMAGE_UPLOAD_OPTIONS),
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

  /**
   * Flags the account for deletion (hidden now, hard-deleted after the grace period). 409 if already
   * flagged. Tight throttle: the body carries the password, so this must not become a guessing
   * oracle for a stolen session. Allowed during a strike ban: erasure is a right, not a privilege.
   */
  @Throttle({ medium: { limit: 5, ttl: 60000 } })
  @AllowWhileStrikeBanned()
  @Post(':id/deletion')
  async requestDeletion(
    @Param('id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe) id: number,
    @Body() body: RequestAccountDeletionRequest,
  ) {
    return await this.userService.requestDeletion(id, body);
  }

  /** Reopens a flagged account. 409 if it is not flagged, or once the deletion date has passed. */
  @AllowWhileStrikeBanned()
  @Delete(':id/deletion')
  async cancelDeletion(
    @Param('id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe) id: number,
  ) {
    return await this.userService.cancelDeletion(id);
  }

  /** Hides the account from the public without deleting anything. 409 if already inactive. */
  @Post(':id/deactivate')
  async deactivate(
    @Param('id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe) id: number,
  ) {
    return await this.userService.deactivate(id);
  }

  /** Makes a deactivated account public again. 409 if already active. */
  @Post(':id/reactivate')
  async reactivate(
    @Param('id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe) id: number,
  ) {
    return await this.userService.reactivate(id);
  }
}
