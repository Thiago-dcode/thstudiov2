import { Test, TestingModule } from '@nestjs/testing';
import { PlansService } from './plans.service';
import { PlansRepository } from './plans.repository';
import { Helpers } from 'src/common/services/helpers.service';

describe('PlansService', () => {
  let service: PlansService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlansService,
        { provide: PlansRepository, useValue: {} },
        { provide: Helpers, useValue: {} },
      ],
    }).compile();

    service = module.get<PlansService>(PlansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
