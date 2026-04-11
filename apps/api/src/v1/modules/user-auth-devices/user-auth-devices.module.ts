import { Module } from '@nestjs/common';
import { UserAuthDevicesRepository } from './user-auth-devices.repository';
import { UserAuthDevicesService } from './user-auth-devices.service';
import { RequestService } from 'src/common/services/request.service';

@Module({
  controllers: [],
  providers: [
    UserAuthDevicesRepository,
    UserAuthDevicesService,
    RequestService,
  ],
  exports: [UserAuthDevicesService],
})
export class UserAuthDevicesModule {}
