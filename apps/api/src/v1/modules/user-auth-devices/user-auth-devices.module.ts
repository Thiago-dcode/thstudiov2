import { Module } from '@nestjs/common';
import { UserAuthDevicesRepository } from './user-auth-devices.repository';
import { UserAuthDevicesService } from './user-auth-devices.service';
import { RequestService } from 'src/common/services/request.service';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';

@Module({
  controllers: [],
  providers: [
    UserAuthDevicesRepository,
    UserAuthDevicesService,
    RequestService,
    {
      provide: LogService,
      useFactory: (requestService: RequestService) => {
        return FactoryLogService.createLogService('file', {
          channel: 'user-auth-devices',
          id: () => requestService.requestId,
        });
      },
      inject: [RequestService],
    },
  ],
  exports: [UserAuthDevicesService],
})
export class UserAuthDevicesModule {}
