import {
  MiddlewareConsumer,
  Module,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD, APP_PIPE, RouterModule } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { config, envFilePath } from '@repo/backend-lib/config';
import { AuthModule } from './v1/modules/auth/auth.module';
import { UserModule } from './v1/modules/users/users.module';
import { ValidatorProviders } from './common/validators/validator.providers';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { PlansModule } from './v1/modules/plans/plans.module';
import { UserPlanTransactionsModule } from './v1/modules/user-plan-transactions/user-plan-transactions.module';
import { TestModule } from './route-test/test.module';
import { I18nModule } from 'nestjs-i18n';
import { join } from 'path';
import { ServicesModule } from './common/services/services.module';
import { DEFAULT_LANGUAGE } from '@repo/database/constants';
import { VIEW_ENGINE } from './common/utils/constants';
import { LanguageMiddleware } from './common/middlewares/language.middleware';
import { LanguageResolver } from './i18n/resolvers/language.resolver';
import { InterceptorProviders } from './common/intecerceptors/interceptor.providers';
import { filterProviders } from './common/filters/filter.providers';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './common/guards/prod-guard/auth.guard';
const APP_MODULES = [
  AuthModule,
  UserModule,
  PlansModule,
  UserPlanTransactionsModule,
];
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      envFilePath,
    }),
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
        path: '/v1',
        module,
      })),
    ),
    I18nModule.forRootAsync({
      useFactory: () => ({
        fallbackLanguage: DEFAULT_LANGUAGE,
        loaderOptions: {
          path: join(__dirname, 'i18n'),
          watch: true,
        },
        viewEngine: VIEW_ENGINE,
        disableMiddleware: true,
      }),
      resolvers: [LanguageResolver],
      inject: [],
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ...APP_MODULES,
    ServicesModule,
    TestModule,
  ],
  controllers: [],
  providers: [
    ...ValidatorProviders,
    ...InterceptorProviders,
    ...filterProviders,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_PIPE,
      useFactory: () => {
        return new ValidationPipe({
          whitelist: true,
          transform: true,
          validateCustomDecorators: true,
          exceptionFactory: (errors) => {
            const result = errors.map((error) => ({
              property: error.property,
              message: error.constraints[Object.keys(error.constraints)[0]],
            }));
            return new UnprocessableEntityException(result);
          },
        });
      },
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LanguageMiddleware).forRoutes('*');
  }
}
