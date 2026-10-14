import { ContentReportSchema } from '../schemas/content-report';

export type ContentReport = Omit<ContentReportSchema, 'updated_at'>;

/** Public notice-and-action form (DSA art. 16). `good_faith` is the mandatory statement. */
export type CreateContentReportInput = Pick<
  ContentReportSchema,
  'reported_url' | 'reason' | 'explanation' | 'reporter_name' | 'reporter_email'
> & {
  good_faith: boolean;
};
