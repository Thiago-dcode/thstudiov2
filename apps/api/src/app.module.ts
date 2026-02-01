import { MiddlewareConsumer, Module, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_PIPE, RouterModule } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { config, envFilePath } from '@repo/common-lib/config';
import { AuthModule } from './v1/modules/auth/auth.module';
import { UserModule } from './v1/modules/users/users.module';
import { ValidatorProviders } from './common/validators/validator.providers';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { PlansModule } from './v1/modules/plans/plans.module';
import { TestModule } from './route-test/test.module';
import { I18nModule } from 'nestjs-i18n';
import { join } from 'path';
import { ServicesModule } from './common/services/services.module';
import { VIEW_ENGINE } from './common/utils/constants';
import { LanguageMiddleware } from './common/middlewares/language.middleware';
import { LanguageResolver } from './i18n/resolvers/language.resolver';
import { InterceptorProviders } from './common/intecerceptors/interceptor.providers';
import { filterProviders } from './common/filters/filter.providers';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './common/guards/auth.guard';
import { UserAuthDeviceMiddleware } from './common/middlewares/user-auth-device.middleware';
import { UserSessionsModule } from './v1/modules/user-sessions/user-sessions.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MediaModule } from './v1/modules/media/media.module';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/constants';
import { CategoriesModule } from './v1/modules/categories/categories.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PlanSubscriptionsModule } from './v1/modules/plan-subscriptions/plan-subscriptions.module';
import { WebhooksModule } from './v1/modules/webhooks/webhooks.module';
import { UtilsModule } from './v1/modules/utils/app-utils.module';
import { AboutPageModule } from './v1/modules/about-page/about-page.module';
import { UserStorageRequestModule } from './v1/modules/user-storage-requests/user-storage-request.module';
import { UserAboutPageModule } from './v1/modules/user-about-page/user-about-page.module';
import { UserMediaModule } from './v1/modules/user-media/user-media.module';
import { AiModule } from './v1/modules/ai/ai.module';
import { AddressModule } from './v1/modules/addresses/address.module';
const APP_MODULES = [
  AuthModule,
  UserModule,
  PlansModule,
  PlanSubscriptionsModule,
  UserSessionsModule,
  MediaModule,
  WebhooksModule,
  CategoriesModule,
  UtilsModule,
  AboutPageModule,
  UserStorageRequestModule,
  UserAboutPageModule,
  UserMediaModule,
  AiModule,
  AddressModule 
];
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'client'),
      serveRoot: '/',
      exclude: ['/api*'],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      envFilePath,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 75,
      },
    ]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.get('jwt.secret'),
        signOptions: { expiresIn: configService.get('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
    RouterModule.register(
      APP_MODULES.map((module) => ({
        path: 'api/v1',
        module,
      })),
    ),
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: DEFAULT_LANGUAGE,
        loaderOptions: {
          path: join(__dirname, 'i18n'),
          watch: configService.get('app.isProduction') ?? false,
        },
        viewEngine: VIEW_ENGINE,
        disableMiddleware: true,
      }),
      resolvers: [LanguageResolver],
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ServicesModule,
    ...APP_MODULES,
    TestModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    ...ValidatorProviders,
    ...InterceptorProviders,
    ...filterProviders,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },

    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LanguageMiddleware).forRoutes('*');
    consumer.apply(UserAuthDeviceMiddleware).forRoutes('*');
  }
}
