import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import {checkPortOrGetNext } from '@repo/backend-lib/utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
let port = await checkPortOrGetNext(configService.get('apiGateway.port'));
  app.setGlobalPrefix('api');
  await app.listen(port, () => {
    console.log(`🚀 API GATEWAY is running on port http://localhost:${port}`);
  });
}

void bootstrap();
