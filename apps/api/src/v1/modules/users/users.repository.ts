import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { CreateUserRequest } from './requests/create-user.request';
import { BaseUser } from './users.types';

@Injectable()
export class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }
  async applyFilters(filters: any) {
    console.log(filters);
  }
  async create(user: CreateUserRequest) {
    const columns = Object.keys(user);
    const values = Object.values(user);
    return await this.queryBuilder.insertAndGet<BaseUser>(columns, values, [
      'id',
      ...columns,
    ]);
  }

  // update(id: number, updatePlanDto: UpdatePlanDto) {
  //   return `This action updates a #${id} plan`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
