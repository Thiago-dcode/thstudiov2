import {
  Module,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_PIPE, RouterModule } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { config, envFilePath } from '@repo/backend-lib/config';
import { AuthModule } from './v1/modules/auth/auth.module';
import { UserModule } from './v1/modules/user/user.module';
import { ValidatorProviders } from './common/validators/validator.providers';
const modules = [AuthModule, UserModule];
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
