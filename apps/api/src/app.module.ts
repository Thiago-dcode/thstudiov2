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
import { ViewModule } from './common/modules/view.module';
import { EmailModule } from './common/modules/email.module';
import { ViewsTestModule } from './views-test/views-test.module';
const modules = [
  AuthModule,
  UserModule,
  PlansModule,
  UserPlanTransactionsModule,
];
@Module({
  imports: [
    ...modules,
    ViewModule,
    EmailModule,
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
    ViewsTestModule,
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
export class AppModule {}
