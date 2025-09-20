import { Test, TestingModule } from '@nestjs/testing';
import { UserPlanTransactionsController } from './user-plan-transactions.controller';
import { UserPlanTransactionsService } from './user-plan-transactions.service';

describe('UserPlanTransactionsController', () => {
  let controller: UserPlanTransactionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserPlanTransactionsController],
      providers: [UserPlanTransactionsService],
    }).compile();

    controller = module.get<UserPlanTransactionsController>(UserPlanTransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
