import { Module } from '@nestjs/common';
import { RoleRepository } from './roles.repository';
import { RoleService } from './roles.service';
import { LogService } from '@repo/backend-lib/services/log-service';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  providers: [
    RoleRepository,
    RoleService,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'roles',
        });
      },
    },
  ],
  exports: [RoleService, RoleRepository],
})
export class RolesModule {}
