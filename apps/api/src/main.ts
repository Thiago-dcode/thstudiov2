import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { checkPortOrGetNext } from '@repo/backend-lib/utils';
import { init } from '@repo/database';
import { useContainer } from 'class-validator';
import { spawn } from 'child_process';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService);
  const port = await checkPortOrGetNext(configService.get('api.port') || 8080);
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
    
  // Inside app.listen callback:
if (!configService.get('app.isProduction')) {
  const stripeProcess = spawn('stripe', ['listen', '--forward-to', `${configService.get('api.v1Url')}/webhooks/stripe`], {
    shell: true,
  });

  stripeProcess.stdout.on('data', (data) => {
    console.log(`[Stripe] ${data}`);
  });

  stripeProcess.stderr.on('data', (data) => {
    console.log(`[Stripe] ${data}`);
  });

  stripeProcess.on('error', (err) => {
    console.error('Failed to start Stripe listener:', err);
  });
}
  });
}

void bootstrap();
