import { HttpException, Inject, Injectable } from '@nestjs/common';
import { UpdateUserRequest } from './requests/update-user.request';
import { NewUserEvent } from './events/new-user.event';
import { NEW_USER_EVENT } from './users.constants';
import { OnEvent } from '@nestjs/event-emitter';
import { UserRepository } from './users.repository';
import { cleanObj } from '@repo/common-lib/utils/cleanObj';
import { UserExtraDataRepository } from '../user-extra-data/user-extra-data.repository';
import { LogService } from '@repo/backend-lib/services/log-service';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { NotifyNewUserMail } from './mails/notify-new-user.mail';
import { StorageService } from '@repo/backend-lib/services/storage-service/base';
import { CompressService } from '@repo/backend-lib/services/compress-service/base';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { s3StorageConfig } from 'src/config/storage';
import { PlanSubscriptionsService } from '../plan-subscriptions/plan-subscriptions.service';
import { stripe } from '@repo/backend-lib/services/payment-service/stripe';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly planSubscriptionService: PlanSubscriptionsService,
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
  async findOneByStripeId(id: string) {
    return await this.userRepository.findOneByColumn('stripe_customer_Id', id);
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

  async getStripePaymentMethods(customerId: string){
    if (!customerId) {
      return [];
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods.data;
  }

  @OnEvent(NEW_USER_EVENT)
  async handleNewUserEvent(event: NewUserEvent) {
    try {
      //Create stripe customer
      const stripeCustomer = await stripe.customers.create({
        email: event.user.email,
        business_name: event.user.username,
      });
      this.logService
        .name('new-user')
        .info(
          `${NEW_USER_EVENT} user [${event.user.id}] Stripe customer created`,
          stripeCustomer,
        );
      //UPDATE USER
      await this.userRepository.updateById(event.user.id, {
        stripe_customer_id: stripeCustomer.id,
      });

      //Handle set free plan
      const result = await this.planSubscriptionService.setFreePlan(event.user);
      this.logService
        .name('new-user')
        .info(`${NEW_USER_EVENT} user [${event.user.id}] set free plan`, {
          result,
        });

      //Create a user extra data
      const extraData = await this.userExtraDataRepository.create({
        user_id: event.user.id,
      });
      this.logService
        .name('new-user')
        .info(`${NEW_USER_EVENT} user [${event.user.id}] extra data`, {
          extraData,
        });
      //Notify user
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
