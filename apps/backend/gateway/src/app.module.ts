import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { routes } from './v1/v1.routes';
import { ImagesModule } from './v1/modules/Images/images.module';
import config , { envFilePath } from '@repo/backend-lib/config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ImagesModule, RouterModule.register(routes), ConfigModule.forRoot({
    isGlobal: true,
    load: [config],
     envFilePath,
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
