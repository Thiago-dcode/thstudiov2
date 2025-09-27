import {
  MiddlewareConsumer,
  Module,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_PIPE, RouterModule } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
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
const modules = [
  AuthModule,
  UserModule,
  PlansModule,
  UserPlanTransactionsModule,
];
@Module({
  imports: [
    RouterModule.register(
      modules.map((module) => ({
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
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      envFilePath,
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ...modules,
    ServicesModule,
    TestModule,
  ],
  controllers: [],
  providers: [
    ...ValidatorProviders,
    {
      provide: APP_PIPE,
      useFactory: () => {
        return new ValidationPipe({
          whitelist: true,
          transform: true,
          validateCustomDecorators: true,
          exceptionFactory: (errors) => {
            console.log(errors);
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
