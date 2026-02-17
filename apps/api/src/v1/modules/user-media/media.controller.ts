import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { MediaService } from '../media/media.service';
import { ModelExistPipe } from 'src/pipes/model-exist.pipe';
import { IsUserAuthPipe } from 'src/pipes/is-user-auth.pipe';

@Controller('users')
export class UserMediaController {
  constructor(private readonly mediaService: MediaService) { }

  @Get(':id/media')
  async findAll(
    @Param('id', ParseIntPipe, new ModelExistPipe('users'), IsUserAuthPipe)
    id: number,
  ) {
    return await this.mediaService.findAll({
      user_id: id,
    });
  }
}
