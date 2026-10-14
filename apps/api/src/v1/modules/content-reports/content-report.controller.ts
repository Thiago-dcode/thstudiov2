import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from 'src/common/decorators/public.decorator';
import { ContentReportService } from './content-report.service';
import { CreateContentReportRequest } from './requests/create-content-report.request';

@Controller('content-reports')
export class ContentReportController {
  constructor(private readonly contentReportService: ContentReportService) { }

  /**
   * Public on purpose (DSA art. 16: "any individual or entity" may file a notice). Tight throttle:
   * each notice mails the admins, so this must not become a mail cannon.
   */
  @Public()
  @Throttle({ medium: { limit: 5, ttl: 60000 } })
  @Post()
  async create(@Body() body: CreateContentReportRequest) {
    return await this.contentReportService.create(body);
  }
}
