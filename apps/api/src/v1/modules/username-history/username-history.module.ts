import { Module } from '@nestjs/common';
import { UsernameHistoryRepository } from './username-history.repository';

@Module({
  providers: [UsernameHistoryRepository],
  exports: [UsernameHistoryRepository],
})
export class UsernameHistoryModule {}
