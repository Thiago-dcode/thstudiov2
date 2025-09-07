import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { checkPortOrGetNext } from '@repo/backend-lib/utils';
import { init } from '@repo/database';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  let port = await checkPortOrGetNext(configService.get('apiGateway.port'));
  app.setGlobalPrefix('api');
  await init({
    client: configService.get('database.client'),
    host: configService.get('database.host'),
    port: configService.get('database.port'),
    username: configService.get('database.username'),
    password: configService.get('database.password'),
    database: configService.get('database.database'),
  });
  await app.listen(port, () => {
    console.log(`🚀 API GATEWAY is running on port http://localhost:${port}`);
  });
}

void bootstrap();
  