import { Module } from '@nestjs/common';
import { UserAuthDevicesRepository } from './user-auth-devices.repository';
import { UserAuthDevicesService } from './user-auth-devices.service';
import { RequestService } from 'src/common/services/request.service';
import { LogService } from '@repo/backend-lib/services/log-service';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  controllers: [],
  providers: [
    UserAuthDevicesRepository,
    UserAuthDevicesService,
    RequestService,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'user-auth-devices',
        });
      },
    },
  ],
  exports: [UserAuthDevicesService],
})
export class UserAuthDevicesModule {}
