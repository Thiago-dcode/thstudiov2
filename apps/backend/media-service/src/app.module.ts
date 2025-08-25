import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import config , { envFilePath } from '@repo/backend-lib/config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    load: [config ],
    envFilePath: envFilePath,
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
