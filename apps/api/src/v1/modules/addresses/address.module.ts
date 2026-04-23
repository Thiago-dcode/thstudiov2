import { Module } from "@nestjs/common";
import { AddressController } from "./address.controller";
import { AddressRepository } from "./address.repository";
import { AddressService } from "./address.service";
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';

@Module({
  controllers: [AddressController],
  providers: [
    AddressRepository,
    AddressService,
    {
      provide: LogService,
      useFactory: (requestService: RequestService) => {
        return FactoryLogService.createLogService('file', {
          channel: 'addresses',
          id: () => requestService.requestId,
        });
      },
      inject: [RequestService],
    },
  ],
  exports: [AddressService],
})
export class AddressModule {}