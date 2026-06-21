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

function logStripeCliOutput(msg: string, stream: 'stdout' | 'stderr') {
  if (!msg) return;

  const isRoutineStderr =
    stream === 'stderr' &&
    (/^Getting ready/i.test(msg) ||
      /^Ready!/i.test(msg) ||
      /^-->/.test(msg) ||
      /^<--/.test(msg));

  if (stream === 'stdout' || isRoutineStderr) {
    logger.info(`Stripe CLI ${stream}`, { msg });
    return;
  }

  logger.warn(`Stripe CLI ${stream}`, { msg });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService);
  const port = await checkPortOrGetNext(configService.get('api.port') || 8080);
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // Startup config for debugging (no secrets).
  logger.info('Starting API bootstrap', {
    env: configService.get('app.env'),
    port,
    apiV1Url: configService.get('api.v1Url'),
    allowedOrigins: configService.get('app.allowedOrigins'),
  });

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
  const ENVIRONMENT = configService.get('app.env')

  // Bracket array params (e.g. categories[]=1&categories[]=2 from queryParamBuilder) require
  // the extended parser; the default "simple" parser leaves the key as literal "categories[]".
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('query parser', 'extended');

  expressApp.get('/', (_, res) => {
    res.json({ status: 'ok' });
  });

  await app.listen(port, () => {
    console.log(`🚀 ENVIRONMENT: ${ENVIRONMENT} API is running on port http://localhost:${port}`);

    // Only forward Stripe webhooks via the Stripe CLI when running locally.
    // On deployed dev/staging/prod servers the `stripe` CLI is not installed.
    if (configService.get('app.env') === 'local') {
      const forwardToUrl = `${configService.get('api.v1Url')}/webhooks/stripe`;
      logger.info('Stripe CLI listener: starting', { forwardToUrl });

      const stripeArgs = ['listen', '--forward-to', forwardToUrl];
      logger.info('Stripe CLI listener: spawn args', { stripeArgs });

      const stripeProcess = spawn('stripe', stripeArgs, {
        shell: true,
        env: process.env,
      });

      stripeProcess.stdout.on('data', (data: Buffer) => {
        logStripeCliOutput(data.toString().trim(), 'stdout');
      });

      stripeProcess.stderr.on('data', (data: Buffer) => {
        logStripeCliOutput(data.toString().trim(), 'stderr');
      });

      stripeProcess.on('error', (err) => {
        logger.error('Stripe CLI listener: failed to start', { err: String(err) });
        console.error('Failed to start Stripe listener:', err);
      });

      stripeProcess.on('close', (code, signal) => {
        if (code !== 0 && code !== null) {
          logger.error('Stripe CLI listener: exited with error', { code, signal });
        } else {
          logger.info('Stripe CLI listener: exited', { code, signal });
        }
        console.log(`Stripe CLI listener exited (code=${code}, signal=${signal})`);
      });

      logger.info('Stripe CLI listener: spawned', { pid: stripeProcess.pid });
    } else {
      logger.info('Stripe CLI listener: skipped (non-local env)', {
        env: configService.get('app.env'),
      });
      console.log('SKIP STRIPE SPIN UP');
    }
  });
}

void bootstrap();
