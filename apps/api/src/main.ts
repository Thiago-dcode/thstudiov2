import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { checkPortOrGetNext } from '@repo/backend-lib/utils';
import { init } from '@repo/database';
import { useContainer } from 'class-validator';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = await checkPortOrGetNext(configService.get('api.port') || 3000);
  app.setGlobalPrefix('api');
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  await init({
    client: configService.get('database.client'),
    host: configService.get('database.host'),
    port: configService.get('database.port'),
    username: configService.get('database.username'),
    password: configService.get('database.password'),
    database: configService.get('database.database'),
  });
  //CORS
  app.enableCors({
    origin: configService.get('app.allowedOrigins'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  await app.listen(port, () => {
    console.log(`🚀 API is running on port http://localhost:${port}`);
  });
}

void bootstrap();
