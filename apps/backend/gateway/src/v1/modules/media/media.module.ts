import { Module } from '@nestjs/common';
import { ImagesModule } from './Images/images.module';
@Module({
  imports: [ImagesModule],
  exports: [ImagesModule],
})
export class MediaModule {}
