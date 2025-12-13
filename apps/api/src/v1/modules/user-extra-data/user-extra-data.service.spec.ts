import { Test, TestingModule } from '@nestjs/testing';
import { UserExtraDataService } from './user-extra-data.service';

describe('UserExtraDataService', () => {
  let service: UserExtraDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserExtraDataService],
    }).compile();

    service = module.get<UserExtraDataService>(UserExtraDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
