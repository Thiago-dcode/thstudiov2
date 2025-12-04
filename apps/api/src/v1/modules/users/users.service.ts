import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { UpdateUserRequest } from './requests/update-user.request';
import { NewUserEvent } from './events/new-user.event';
import { NEW_USER_EVENT } from './users.constants';
import { OnEvent } from '@nestjs/event-emitter';
import { UserRepository } from './users.repository';
import { PlansRepository } from '../plans/plans.repository';
import { UserPlanTransactionsRepository } from '../user-plan-transactions/user-plan-transactions.repository';
import { cleanObj } from '@repo/common-lib/utils/cleanObj';
import { generateUUID } from '@repo/common-lib/utils/generate-uuid';
import { UserExtraDataRepository } from '../user-extra-data/user-extra-data.repository';
import { LogService } from '@repo/backend-lib/services/log-service';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { NotifyNewUserMail } from './mails/notify-new-user.mail';
import { StorageService } from '@repo/backend-lib/services/storage-service/base';
import { CompressService } from '@repo/backend-lib/services/compress-service/base';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { s3StorageConfig } from 'src/config/storage';
import { PlanSubscriptionsRepository } from '../plan-subscriptions/plan-subscriptions.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly plansRepository: PlansRepository,
    private readonly userPlanTransactionsRepository: UserPlanTransactionsRepository,
    private readonly planSubscriptionRepository: PlanSubscriptionsRepository,
    private readonly userExtraDataRepository: UserExtraDataRepository,
    private readonly logService: LogService,
    private readonly mailService: MailService,
    private readonly storageService: StorageService,
    private readonly compressService: CompressService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly notifyNewUserMail: NotifyNewUserMail,
  ) {}

  async findAll() {
    return `This action returns all user`;
  }

  async findOne(id: number) {
    const result = await this.userRepository.findById(id);
    if (result?.avatar) {
      let avatar = (await this.cacheManager.get(result.avatar)) as string;
      if (!avatar) {
        avatar = await this.storageService.getUrl(result.avatar);
        await this.cacheManager.set(
          result.avatar,
          avatar,
          s3StorageConfig.signedUrlExpiration * 900, //Substract 10% to avoid possible s3 404
        );
      }
      result.avatar = avatar;
    }
    return result;
  }

  async update(id: number, { avatar, categories, ...rest }: UpdateUserRequest) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new HttpException('User not found', 422);
    }
    const userUpdateData: Omit<UpdateUserRequest, 'avatar'> & {
      avatar?: string;
    } = rest;

    // Remove undefined values
    cleanObj(userUpdateData);

    if (avatar && avatar.size > 0) {
      const path = `users/${user.id}/avatar`;
      //Compress
      const targetSize = 1024;
      avatar.buffer = await this.compressService.optimizeImageToWebp(
        avatar,
        90,
        avatar.size > targetSize ? targetSize : avatar.size,
      );
      const [result] = await Promise.all([
        this.storageService.write(avatar, path),
        this.cacheManager.del(path),
      ]);
      if (!result) {
        throw new HttpException(
          `An error ocurred during storing user <<${user.id}>> avatar`,
          500,
        );
      }

      userUpdateData.avatar = path;
    }
    if (userUpdateData.email) {
      const userExist = await this.userRepository.findOneBy(
        'email',
        userUpdateData.email,
      );
      if (userExist && userExist.id !== user.id) {
        throw new HttpException(`Email not available`, 422);
      }
    }
    const [userUpdated] = await Promise.all([
      this.userRepository.updateById(user.id, userUpdateData),
      categories
        ? this.userRepository.attach('user_categories', {
            modelCol: 'user_id',
            modelValue: user.id,
            attachCol: 'category_id',
            valuesToAttach: categories,
          })
        : Promise.resolve(true),
    ]);
    return userUpdated;
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
      if (!freePlan) {
        this.logService
          .name('new-user')
          .error('Free plan not found for user: ' + event.user.id);
        throw new HttpException('Free plan not found', 500);
      }
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
      // Create plan subscription
      const PlanSubscription = await this.planSubscriptionRepository.create({
        is_active: true,
        plan_id: freePlan.id,
        plan_price_id: lifetimePrice.id,
        plan_transaction_id: transaction.id,
      });
      this.logService
        .name('new-user')
        .info(`${NEW_USER_EVENT} user [${event.user.id}] plan subscription`, {
          transaction,
        });
      const extraData = await this.userExtraDataRepository.create({
        user_id: event.user.id,
        plan_subscription_id: PlanSubscription.id,
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
