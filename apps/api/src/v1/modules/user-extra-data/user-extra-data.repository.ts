import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import {
  CreateUserExtraDataInput,
  UserExtraDataSchema,
} from '@repo/database/schemas/users';

@Injectable()
export class UserExtraDataRepository extends BaseRepository {
  constructor() {
    super('user_extra_data');
  }
  async applyFilters(filters: any) {
    console.log(filters);
  }
  async create(extraData: CreateUserExtraDataInput) {
    const columns = Object.keys(extraData);
    const values = Object.values(extraData);
    return await this.queryBuilder.insertAndGet<UserExtraDataSchema>(
      columns,
      values,
    );
  }

  // update(id: number, updatePlanDto: UpdatePlanDto) {
  //   return `This action updates a #${id} plan`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
