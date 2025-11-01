import { Injectable } from '@nestjs/common';
import { UserExtraDataSchema } from '@repo/common-lib/schemas/user';
import { CreateUserExtraDataInput } from '@repo/common-lib/types/user';
import { BaseRepository } from '@repo/database/repositories';


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
