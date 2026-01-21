import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { checkPortOrGetNext } from '@repo/backend-lib/utils';
import { init } from '@repo/database';
import { useContainer } from 'class-validator';
import { spawn } from 'child_process';
import { FactoryLogService } from '@repo/backend-lib/services/log-service';
import { Helpers } from './common/services/helpers.service';

const logger = FactoryLogService.createLogService('file',{
  channel:'api/500',
  callback:{
    channel:'api/500',
    callback: Helpers.callback500ErrorMail,
  }

})

process.on('uncaughtException', (error: Error) => {
  logger.error('💥 Uncaught Exception:', error);
  console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('💥 Uncaught Exception:', reason);
  console.error('💥 Unhandled Rejection:', reason);
});
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService);
  const port = await checkPortOrGetNext(configService.get('api.port') || 8080);
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
  });

  // Express-style route
const expressApp = app.getHttpAdapter().getInstance();
expressApp.get('/', (_, res) => {
  res.json({ status: 'ok' });
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


  stripeProcess.on('error', (err) => {
    console.error('Failed to start Stripe listener:', err);
  });
}
  });
}

void bootstrap();
