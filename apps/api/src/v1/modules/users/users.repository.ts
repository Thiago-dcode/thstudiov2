import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { BaseUser, User } from './users.types';
import {
  CreateUserInput,
  UserSchemaWithAddress,
} from '@repo/database/schemas/users';

@Injectable()
export class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }
  async findById(id: number): Promise<User> {
    const result = await this.queryBuilder
      .select(['users.*', 'addresses.id as address_id', 'addresses.*'])
      .where('id', '=', id)
      .join('address_id', 'addresses', 'id', 'LEFT')
      .first<UserSchemaWithAddress>();
    if (!result) {
      throw new HttpException(
        'User not found with id ' + id,
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      id: result?.id,
      email: result?.email,
      username: result?.username,
      email_validated: result?.email_validated,
      number_email_validations_sent: result?.number_email_validations_sent,
      biography: result?.biography,
      name: result?.name,
      surname: result?.surname,
      address: result?.address_id
        ? {
            id: result?.address_id,
            city: result?.city,
            state: result?.state,
            zip: result?.zip,
            country: result?.country,
            latitude: result?.latitude,
            longitude: result?.longitude,
            created_at: result?.created_at,
            updated_at: result?.updated_at,
          }
        : null,
    };
  }
  async applyFilters(filters: any) {
    console.log(filters);
  }
  async create(user: CreateUserInput) {
    const columns = Object.keys(user);
    const values = Object.values(user);
    return await this.queryBuilder.insertAndGet<BaseUser>(columns, values, [
      'id',
      'email',
      'username',
      'email_validated',
    ]);
  }

  // update(id: number, updatePlanDto: UpdatePlanDto) {
  //   return `This action updates a #${id} plan`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
