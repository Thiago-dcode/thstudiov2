import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UpdateUserRequest } from './requests/update-user.request';
import { NewUserEvent } from './events/new-user.event';
import { NEW_USER_EVENT } from './users.constants';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CreateUserRequest } from './requests/create-user.request';
import { UserRepository } from './users.repository';
import { PlansRepository } from '../plans/plans.repository';
import { UserPlanTransactionsRepository } from '../user-plan-transactions/user-plan-transactions.repository';
import { generateUUID } from '@repo/common-lib/utils/generate-uuid';
import { UserExtraDataRepository } from '../user-extra-data/user-extra-data.repository';
import { LogService } from '@repo/backend-lib/services/log-service';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { NotifyNewUserMail } from './mails/notify-new-user.mail';
import * as bcrypt from 'bcrypt';
import { UserAuthDevicesService } from '../user-auth-devices/user-auth-devices.service';
import { RequestService } from 'src/common/services/request.service';

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
    private readonly notifyNewUserMail: NotifyNewUserMail,
    private readonly userAuthDevicesService: UserAuthDevicesService,
    private readonly requestService: RequestService,
  ) {}
  async create(createUserRequest: CreateUserRequest) {
    const user = await this.userRepository.create({
      ...createUserRequest,
      password: await bcrypt.hash(createUserRequest.password, 10),
    });
    if (
      this.requestService &&
      this.requestService.user_agent &&
      this.requestService.ip_address
    ) {
      const userDevice = await this.userAuthDevicesService.getOneOrCreate({
        user_id: user.id,
        user_agent: this.requestService?.user_agent || '-',
        ip_address: this.requestService?.ip_address || '-',
        disabled: false,
        blocked: false,
      });
      this.logService.info(`${NEW_USER_EVENT} user [${user.id}] user device`, {
        userDevice,
      });
    }
    this.eventEmitter.emit(NEW_USER_EVENT, new NewUserEvent(user));
    return user;
  }

  async findAll() {
    return `This action returns all user`;
  }

  async findOne(id: number) {
    return await this.userRepository.findById(id);
  }

  update(id: number, updateUserDto: UpdateUserRequest) {
    console.log(id, updateUserDto);
  }

  async remove(id: number) {
    return `This action removes a #${id} user`;
  }

  //Every time a user is created, a free plan is assigned to him.
  //A UserPlanTransaction is created for the free plan.
  //So a user must have an extra data record 1:1 with a last plan transaction, even if the plan is free.
  @OnEvent(NEW_USER_EVENT)
  async handleNewUserEvent(event: NewUserEvent) {
    try {
      this.logService.info(`${NEW_USER_EVENT} user [${event.user.id}]`);

      //Plans with plan and plan prices must always exist. If not, BIG PROBLEM.
      const freePlan = await this.plansRepository.findFreePlan();
      const lifetimePrice = freePlan.prices.find(
        (price) => price.billing_type === 'LIFETIME',
      );
      if (!lifetimePrice) {
        this.logService
          .name('new-user')
          .error('Lifetime FREE price not found for user: ' + event.user.id);
        throw new HttpException(
          'Lifetime price not found',
          HttpStatus.BAD_REQUEST,
        );
      }
      this.logService
        .name('new-user')
        .info(
          `${NEW_USER_EVENT} user [${event.user.id}] lifetime price`,
          lifetimePrice,
        );
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
      this.logService
        .name('new-user')
        .info(`${NEW_USER_EVENT} user [${event.user.id}] plan transaction`, {
          transaction,
        });
      const extraData = await this.userExtraDataRepository.create({
        user_id: event.user.id,
        plan_id: freePlan.id,
        last_plan_transaction_id: transaction.id,
        plan_start_date: new Date(),
        plan_end_date: null,
        plan_autorenewal: true,
      });
      this.logService
        .name('new-user')
        .info(`${NEW_USER_EVENT} user [${event.user.id}] extra data`, {
          extraData,
        });
      await this.mailService.send(this.notifyNewUserMail.setUser(event.user));
    } catch (error) {
      this.logService
        .name('new-user')
        .error(
          `${NEW_USER_EVENT} user [${event.user.id}] - ${error instanceof Error ? error.message : 'Unknown error'}`,
          error,
        );
      throw error;
    }
  }
}
