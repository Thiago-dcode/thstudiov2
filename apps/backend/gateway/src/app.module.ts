import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AppService } from './app.service';
import { routes } from './v1/v1.routes';
import config, { envFilePath } from '@repo/backend-lib/config';
import { ConfigModule } from '@nestjs/config';
import { ProjectsModule } from './v1/modules/projects/projects.module';
import { MediaModule } from './v1/modules/media/media.module';

@Module({
  imports: [
    MediaModule,
    ProjectsModule,
    RouterModule.register(routes),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      envFilePath,
    }),
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
