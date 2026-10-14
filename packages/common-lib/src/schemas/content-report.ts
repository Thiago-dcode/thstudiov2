import { EnumType, TABLES_ENUM } from '../constants/enums';
import { TableColumn } from '../types/database';

export type ContentReportSchema = {
  id: number;
  reported_url: string;
  reason: EnumType<'CONTENT_REPORT_REASON'>;
  explanation: string;
  reporter_name: string | null;
  reporter_email: string | null;
  status: EnumType<'CONTENT_REPORT_STATUS'>;
  created_at: Date;
  updated_at: Date;
};

export type ContentReportSchemaWithoutTimestamps = Omit<ContentReportSchema, 'created_at' | 'updated_at'>;

const tablesContentReport = [TABLES_ENUM.CONTENT_REPORTS] as const;
export type ContentReportSchemaColumns = TableColumn<
  typeof tablesContentReport,
  ContentReportSchemaWithoutTimestamps
>;
