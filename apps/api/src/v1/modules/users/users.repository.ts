import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { BaseUser, BaseUserWithPassword, User } from './users.types';
import {
  CreateUserInput,
  UserSchemaWithAddress,
} from '@repo/database/schemas/users';

@Injectable()
export class UserRepository extends BaseRepository {
  private readonly fullColumns: string[] = [
    'users.*',
    'addresses.id as address_id',
    'addresses.*',
  ];
  constructor() {
    super('users');
  }
  async findById(id: number): Promise<User> {
    const result = await this.queryBuilder
      .select(this.fullColumns)
      .where('id', '=', id)
      .join('address_id', 'addresses', 'id', 'LEFT')
      .first<UserSchemaWithAddress>();
    if (!result) {
      throw new HttpException(
        'User not found with id ' + id,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.formatFullUser(result);
  }
  async findOneBy(
    column: string,
    value: any,
    full: boolean = false,
  ): Promise<BaseUser | User> {
    let query = this.queryBuilder.where(column, '=', value);
    if (full) {
      query = query
        .join('address_id', 'addresses', 'id', 'LEFT')
        .select(this.fullColumns);
    } else {
      query = query.select(['id', 'email', 'username', 'email_validated']);
    }
    const result = await query.first<UserSchemaWithAddress>();
    if (!result) {
      throw new HttpException(
        'User not found with ' + column + ' ' + value,
        HttpStatus.NOT_FOUND,
      );
    }
    return full ? this.formatFullUser(result) : this.formatUser(result);
  }
  async findOneByWithPassword(
    column: string,
    value: any,
  ): Promise<BaseUserWithPassword> {
    const result = await this.queryBuilder
      .where(column, '=', value)
      .select(['id', 'email', 'username', 'email_validated', 'password'])
      .first<UserSchemaWithAddress>();
    if (!result) {
      throw new HttpException(
        'User not found with ' + column + ' ' + value,
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      id: result?.id,
      email: result?.email,
      username: result?.username,
      email_validated: result?.email_validated,
      password: result?.password,
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
  private formatUser(result: UserSchemaWithAddress): BaseUser {
    return {
      id: result?.id,
      email: result?.email,
      username: result?.username,
      email_validated: result?.email_validated,
    };
  }
  private formatFullUser(result: UserSchemaWithAddress): User {
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
  // update(id: number, updatePlanDto: UpdatePlanDto) {
  //   return `This action updates a #${id} plan`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
