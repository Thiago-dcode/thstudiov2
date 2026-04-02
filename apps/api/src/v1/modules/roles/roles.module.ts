import { Module } from '@nestjs/common';
import { RoleRepository } from './roles.repository';
import { RoleService } from './roles.service';

@Module({
  providers: [RoleRepository, RoleService],
  exports: [RoleService, RoleRepository],
})
export class RolesModule {}
