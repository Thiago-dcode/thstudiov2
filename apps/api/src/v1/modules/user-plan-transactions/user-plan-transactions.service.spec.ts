import { Test, TestingModule } from '@nestjs/testing';
import { UserPlanTransactionsService } from './user-plan-transactions.service';

describe('UserPlanTransactionsService', () => {
  let service: UserPlanTransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserPlanTransactionsService],
    }).compile();

    service = module.get<UserPlanTransactionsService>(UserPlanTransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
