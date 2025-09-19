import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { routes } from './v1/v1.routes';
import { ConfigModule } from '@nestjs/config';
import { config ,envFilePath} from '@repo/backend-lib/config';

@Module({
  imports: [
    RouterModule.register(routes),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      envFilePath,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
