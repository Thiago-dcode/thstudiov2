import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { MediaService } from '../media/media.service';
import { ModelExistPipe } from 'src/pipes/model-exist.pipe';
import { IsUserAuthPipe } from 'src/pipes/is-user-auth.pipe';
import { IndexMediaRequest } from './requests/index-media.request';

@Controller('users')
export class UserMediaController {
  constructor(private readonly mediaService: MediaService) { }

  @Get(':id/media')
  async findAll(
    @Param('id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe)
    id: number,
    @Query() query: IndexMediaRequest,
  ) {
    return await this.mediaService.findAll({
      ...query,
      user_id: id,
    });
  }
}
