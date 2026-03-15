import { Module } from '@nestjs/common';
import { UserServiceService } from './user-service.service';
import { UserRepository } from '../users/users.repository';
import { ServiceRepository } from '../services/service.repository';
import { UserServiceController } from './user-service.controller';

@Module({
  controllers: [UserServiceController],
  providers: [UserServiceService, UserRepository, ServiceRepository],
})
export class UserServiceModule {}
