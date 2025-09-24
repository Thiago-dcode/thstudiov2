import { Module } from '@nestjs/common';
import { ViewsTestController } from './views-test.controller';

@Module({
  controllers: [ViewsTestController],
  providers: [],
})
export class ViewsTestModule {}
