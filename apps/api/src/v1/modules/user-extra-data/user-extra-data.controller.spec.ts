import { Test, TestingModule } from '@nestjs/testing';
import { UserExtraDataController } from './user-extra-data.controller';
import { UserExtraDataService } from './user-extra-data.service';

describe('UserExtraDataController', () => {
  let controller: UserExtraDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserExtraDataController],
      providers: [UserExtraDataService],
    }).compile();

    controller = module.get<UserExtraDataController>(UserExtraDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
