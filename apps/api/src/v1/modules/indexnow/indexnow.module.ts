import { Module } from '@nestjs/common';
import { IndexNowRepository } from './indexnow.repository';
import { IndexNowService } from './indexnow.service';
import { IndexNowTask } from './indexnow.task';

/**
 * IndexNow submissions (hourly cron, no HTTP surface). The repository reads the public-visibility
 * predicates as static members of the feature repositories, so no feature module is imported.
 */
@Module({
  providers: [IndexNowRepository, IndexNowService, IndexNowTask],
})
export class IndexNowModule {}
