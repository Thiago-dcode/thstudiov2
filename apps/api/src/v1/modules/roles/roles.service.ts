import { Injectable } from '@nestjs/common';
import { EnumType } from '@repo/common-lib/constants/enums';
import {
  CACHE_KEY_ROLES_ALL,
  CACHE_KEY_ROLE_BY_NAME,
} from '@repo/common-lib/constants/constants';
import { Role } from '@repo/common-lib/types/role';
import { Helpers } from 'src/common/services/helpers.service';
import { RoleRepository } from './roles.repository';

const ROLES_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly helpers: Helpers,
  ) {}

  async getAll(): Promise<Role[]> {
    return await this.helpers.cacheRemember(
      CACHE_KEY_ROLES_ALL,
      this.roleRepository.findAll(),
      { append_language: false, ttl: ROLES_CACHE_TTL_MS },
    );
  }

  async getByName(name: EnumType<'USER_ROLE'>): Promise<Role> {
    return await this.helpers.cacheRemember(
      CACHE_KEY_ROLE_BY_NAME(name),
      this.roleRepository.findByName(name),
      { append_language: false, ttl: ROLES_CACHE_TTL_MS },
    );
  }
}
