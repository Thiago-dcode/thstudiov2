import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { EnumType, TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Role } from '@repo/common-lib/types/role';

@Injectable()
export class RoleRepository extends BaseRepository {

  constructor() {
    super(TABLES_ENUM.ROLES);
  }

  async findAll(): Promise<Role[]> {
    const rows = await this.query()
      .select(['id', 'name'])
      .orderBy('id', 'ASC')
      .get<Role[]>();
    return rows ?? [];
  }

  async findByName(name: EnumType<'USER_ROLE'>): Promise<Role> {
    const result = await this.query()
      .select(['id', 'name'])
      .where('name', '=', name)
      .first<Role>();
    if (!result) {
      throw new HttpException(
        `Role not found with name ${name}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return result;
  }
}
