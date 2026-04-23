import { Module } from '@nestjs/common';
import { RoleRepository } from './roles.repository';
import { RoleService } from './roles.service';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';

@Module({
  providers: [
    RoleRepository,
    RoleService,
    {
      provide: LogService,
      useFactory: (requestService: RequestService) => {
        return FactoryLogService.createLogService('file', {
          channel: 'roles',
          id: () => requestService.requestId,
        });
      },
      inject: [RequestService],
    },
  ],
  exports: [RoleService, RoleRepository],
})
export class RolesModule {}
