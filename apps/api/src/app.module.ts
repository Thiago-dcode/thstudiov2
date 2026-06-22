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
import { I18nModule, I18nJsonLoader } from 'nestjs-i18n';
import { join } from 'path';
import { ServicesModule } from './common/services/services.module';
import { VIEW_ENGINE } from './common/utils/constants';
import { RequestMiddleware } from './common/middlewares/request.middleware';
import { LanguageResolver } from './i18n/resolvers/language.resolver';
import { InterceptorProviders } from './common/intecerceptors/interceptor.providers';
import { filterProviders } from './common/filters/filter.providers';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './common/guards/auth.guard';
import { UserStrikesGuard } from './common/guards/user-strikes.guard';
import { UserSessionsModule } from './v1/modules/user-sessions/user-sessions.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MediaModule } from './v1/modules/media/media.module';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/constants';
import { CategoriesModule } from './v1/modules/categories/categories.module';
import { AdminModule } from './v1/modules/admin/admin.module';
import { PlanSubscriptionsModule } from './v1/modules/plan-subscriptions/plan-subscriptions.module';
import { WebhooksModule } from './v1/modules/webhooks/webhooks.module';
import { UtilsModule } from './v1/modules/utils/app-utils.module';
import { AboutPageModule } from './v1/modules/about-page/about-page.module';
import { UserStorageRequestModule } from './v1/modules/user-storage-requests/user-storage-request.module';
import { UserAboutPageModule } from './v1/modules/user-about-page/user-about-page.module';
import { UserMediaModule } from './v1/modules/user-media/user-media.module';
import { AiMediaModule } from './v1/modules/ai-media/ai-media.module';
import { AddressModule } from './v1/modules/addresses/address.module';
import { PortfolioModule } from './v1/modules/portfolios/portfolio.module';
import { UserPortfolioModule } from './v1/modules/user-portfolios/user-portfolio.module';
import { CollectionModule } from './v1/modules/collections/collection.module';
import { UserCollectionModule } from './v1/modules/user-collections/user-collection.module';
import { BullModule } from '@nestjs/bullmq';
import { UserExtraDataModule } from './v1/modules/user-extra-data/user-extra-data.module';
import { AiProcessorModule } from './v1/modules/ai/ai-processor.module';
import { UserContactsModule } from './v1/modules/user-contacts/user-contacts.module';
import { ServiceModule } from './v1/modules/services/service.module';
import { UserServiceModule } from './v1/modules/user-services/user-service.module';
import { LocationModule } from './v1/modules/locations/location.module';
import { RolesModule } from './v1/modules/roles/roles.module';
import { InvitationLinkModule } from './v1/modules/invitation-links/invitation-link.module';
import { UserBenefitModule } from './v1/modules/user-benefit/user-benefit.module';
import { UserSubscriptionModule } from './v1/modules/user-subscription/user-subscription.module';
import { PlanSubscriptionsProcessorModule } from './v1/modules/plan-subscriptions/plan-subscriptions-processor.module';
import { WaitListModule } from './v1/modules/wait-list/wait-list.module';
import { EmailPreferencesModule } from './v1/modules/email-preferences/email-preferences.module';
import { UserEmailPreferencesModule } from './v1/modules/user-email-preferences/user-email-preferences.module';
/** Feature modules mounted at `api/v1/*` (not under `admin/`). */
const API_V1_MODULES = [
  AuthModule,
  UserModule,
  RolesModule,
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
  AiMediaModule,
  AddressModule,
  PortfolioModule,
  UserPortfolioModule,
  CollectionModule,
  UserCollectionModule,
  UserContactsModule,
  ServiceModule,
  UserServiceModule,
  LocationModule,
  InvitationLinkModule,
  WaitListModule,
  UserBenefitModule,
  UserSubscriptionModule,
  EmailPreferencesModule,
  UserEmailPreferencesModule,
];
const ADMIN_V1_MODULES = [
  AdminModule
]
const ALL_APP_MODULES = [
  ...API_V1_MODULES,
  ...ADMIN_V1_MODULES,
  /** Bull AI worker + scheduled tasks (`AiTask`: AI credits reset cron). */
  AiProcessorModule,
  PlanSubscriptionsProcessorModule,
  ServicesModule,
  UserExtraDataModule,
  TestModule,
];
@Module({
  imports: [
    RouterModule.register([
      ...API_V1_MODULES.map((module) => ({
        path: 'api/v1',
        module,
      })),
      ...ADMIN_V1_MODULES.map(module => {
        return { path: 'api/v1/admin', module }
      })
      ,
    ]),
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
    BullModule.forRootAsync({
      // This allows the use of process.env or ConfigService
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get('redis.url')
        },
        // Global job settings (optional but recommended)
        defaultJobOptions: {
          removeOnComplete: 1000, // Keep last 1000 jobs in history
          removeOnFail: 5000,     // Keep failed jobs longer for debugging
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }),
    }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.get('jwt.secret'),
        signOptions: { expiresIn: configService.get('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
    I18nModule.forRootAsync({
      loader: I18nJsonLoader,
      useFactory: () => ({
        fallbackLanguage: DEFAULT_LANGUAGE,
        loaderOptions: {
          path: join(__dirname, 'i18n'),
        },
        viewEngine: VIEW_ENGINE,
        disableMiddleware: true,
      }),
      resolvers: [LanguageResolver],
    }),
    EventEmitterModule.forRoot(),
    /** Registers `@Cron` / `@Interval` jobs from any imported module’s providers (e.g. `AiTask` in `AiProcessorModule`). */
    ScheduleModule.forRoot(),
    ...ALL_APP_MODULES,
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
      provide: APP_GUARD,
      useClass: UserStrikesGuard,
    },

    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
      }),
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestMiddleware).forRoutes('*');
  }
}
