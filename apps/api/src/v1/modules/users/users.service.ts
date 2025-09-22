import { Injectable } from '@nestjs/common';
import { UpdateUserRequest } from './requests/update-user.request';
import { NewUserEvent } from './events/new-user.event';
import { NEW_USER_EVENT } from './users.constants';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CreateUserRequest } from './requests/create-user.request';
import { UserRepository } from './users.repository';
import { PlansRepository } from '../plans/plans.repository';
import { UserPlanTransactionsRepository } from '../user-plan-transactions/user-plan-transactions.repository';
import { generateUUID } from '@repo/backend-lib/utils';
import { UserExtraDataRepository } from '../user-extra-data/user-extra-data.repository';
import { LogService } from '@repo/backend-lib/services/log-service';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { NotifyNewUserMail } from './mails/notify-new-user.mail';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly plansRepository: PlansRepository,
    private readonly userPlanTransactionsRepository: UserPlanTransactionsRepository,
    private readonly userExtraDataRepository: UserExtraDataRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly logService: LogService,
    private readonly mailService: MailService,
  ) {}
  async create(createUserRequest: CreateUserRequest) {
    const user = await this.userRepository.create(createUserRequest);
    this.eventEmitter.emit(NEW_USER_EVENT, new NewUserEvent(user));
    return user;
  }

  findAll() {
    this.logService.name('findAll');
    this.logService.info('Finding all users', { user: 'all' });
    this.logService.error('Error finding all users', { user: 'all' });
    this.logService.warn('Warning finding all users', { user: 'all' });
    this.logService.debug('Debug finding all users', { user: 'all' });
    this.logService.success('Success finding all users', { user: 'all' });
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

  //Every time a user is created, a free plan is assigned to him.
  //A UserPlanTransaction is created for the free plan.
  //So a user must have an extra data record 1:1 with a last plan transaction, even if the plan is free.
  @OnEvent(NEW_USER_EVENT)
  async handleNewUserEvent(event: NewUserEvent) {
    //Plans with plan prices must always exist. If not, BIG PROBLEM.
    const freePlan = await this.plansRepository.findFreePlan();
    const lifetimePrice = freePlan.prices.find(
      (price) => price.billing_type === 'LIFETIME',
    );
    if (!lifetimePrice) {
      throw new Error('Lifetime price not found');
    }
    const transaction = await this.userPlanTransactionsRepository.create({
      amount: lifetimePrice.price,
      user_id: event.user.id,
      plan_price_id: lifetimePrice.id,
      status: 'SUCCESS',
      payment_status: 'SUCCESS',
      transaction_id: await generateUUID(),
      payment_method: null,
      plan_offer_id: null,
    });
    await this.userExtraDataRepository.create({
      user_id: event.user.id,
      plan_id: freePlan.id,
      last_plan_transaction_id: transaction.id,
      plan_start_date: new Date(),
      plan_end_date: null,
      plan_autorenewal: true,
    });
    await this.mailService.send(new NotifyNewUserMail(event.user));
  }
}
