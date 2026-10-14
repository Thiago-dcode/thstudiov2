import { Injectable } from '@nestjs/common';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import type {
  ContentReportSchema,
  ContentReportSchemaColumns,
} from '@repo/common-lib/schemas/content-report';
import type { ContentReport } from '@repo/common-lib/types/content-report';
import { DbException } from '@repo/database/exceptions';
import { BaseRepository } from '@repo/database/repositories';

type NewContentReport = Pick<
  ContentReportSchema,
  'reported_url' | 'reason' | 'explanation' | 'reporter_name' | 'reporter_email'
>;

@Injectable()
export class ContentReportRepository extends BaseRepository {
  private readonly COLUMNS: (ContentReportSchemaColumns | 'content_reports.created_at')[] = [
    'content_reports.id',
    'content_reports.reported_url',
    'content_reports.reason',
    'content_reports.explanation',
    'content_reports.reporter_name',
    'content_reports.reporter_email',
    'content_reports.status',
    'content_reports.created_at',
  ];

  constructor() {
    super(TABLES_ENUM.CONTENT_REPORTS);
  }

  async create(data: NewContentReport): Promise<ContentReport> {
    const result = await this.query().insertAndGet<ContentReportSchema>(
      Object.keys(data),
      Object.values(data),
      this.COLUMNS,
    );
    if (!result) throw new DbException('Could not create content report');
    return {
      id: result.id,
      reported_url: result.reported_url,
      reason: result.reason,
      explanation: result.explanation,
      reporter_name: result.reporter_name,
      reporter_email: result.reporter_email,
      status: result.status,
      created_at: result.created_at,
    };
  }
}
