import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { checkPortOrGetNext } from '@repo/backend-lib/utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  let port = configService.get('mediaService.port');
  port = await checkPortOrGetNext(port);
  await app.listen(port, () => {
      console.log(`🚀 Media Service is running on http://localhost:${port}`);
  });
}

bootstrap();
