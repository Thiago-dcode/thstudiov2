import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { FactoryViewService } from '@repo/backend-lib/services/view-service/factory';
import { viewPath } from 'src/common/utils';

@Global()
@Module({
  providers: [
    {
      provide: ViewService,
      useFactory: (configService: ConfigService) => {
        return FactoryViewService.createViewService('pug', {
          basePath: viewPath(''),
          globals: {
            appName: configService.get('app.name'),
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [ViewService],
})
export class ViewModule {}
