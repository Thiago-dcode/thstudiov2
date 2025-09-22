import {
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
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { FactoryViewService } from '@repo/backend-lib/services/view-service/factory';
import { viewPath } from './common/utils';
const modules = [
  AuthModule,
  UserModule,
  PlansModule,
  UserPlanTransactionsModule,
];
@Module({
  imports: [
    ...modules,
    RouterModule.register(
      modules.map((module) => ({
        path: '/v1',
        module,
      })),
    ),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      envFilePath,
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
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
    {
      provide: ViewService,
      useFactory: () => {
        return FactoryViewService.createViewService('pug', {
          basePath: viewPath(''),
        });
      },
    },
  ],
})
export class AppModule {}
