import { Module } from "@nestjs/common";
import { AddressController } from "./address.controller";
import { AddressRepository } from "./address.repository";
import { AddressService } from "./address.service";
import { LogService } from '@repo/backend-lib/services/log-service';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  controllers: [AddressController],
  providers: [
    AddressRepository,
    AddressService,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'addresses',
        });
      },
    },
  ],
  exports: [AddressService],
})
export class AddressModule {}
