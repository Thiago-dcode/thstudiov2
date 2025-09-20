import { Injectable } from '@nestjs/common';
import { UpdateUserRequest } from './requests/update-user.request';
import { NewUserEvent } from './events/new-user.event';
import { NEW_USER_EVENT } from './users.constants';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CreateUserRequest } from './requests/create-user.request';
import { UserRepository } from './users.repository';
import { PlansRepository } from '../plans/plans.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly plansRepository: PlansRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  async create(createUserRequest: CreateUserRequest) {
    const user = await this.userRepository.create(createUserRequest);
    //Handled by the UserService
    this.eventEmitter.emit(NEW_USER_EVENT, new NewUserEvent(user));
    return user;
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserRequest) {
    console.log(id, updateUserDto);
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  @OnEvent(NEW_USER_EVENT)
  async handleNewUserEvent(event: NewUserEvent) {
    console.log(event);
    //TODO: Get the free plan
    const freePlan = await this.plansRepository.findFreePlan();
    console.log(freePlan);
    //TODO: Create a new plan_transactions
    //TODO: Create a new extra_data for the user
    //TODO: send email to the user
  }
}
