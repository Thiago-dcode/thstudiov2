import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Column, Schema } from '../lib/facades';

const CONTENT_REPORTS = TABLES_ENUM.CONTENT_REPORTS;

/**
 * Notices about content on the platform that someone believes is illegal (EU Digital Services Act,
 * art. 16 "notice and action"). Anyone can file one, signed in or not, so the reporter's name and
 * email are optional; the email is only kept to confirm receipt and tell them the outcome.
 *
 * Not tied to a user or media row on purpose: a notice must survive the reported content being
 * deleted, and must not disappear when the reported artist deletes their account.
 */
const up = async () => {
  await Schema.createEnumIfNotExists('CONTENT_REPORT_REASON');
  await Schema.createEnumIfNotExists('CONTENT_REPORT_STATUS');

  await Schema.table(CONTENT_REPORTS).withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.string('reported_url', 2048, { nullable: false }),
    Column.enum('reason', 'CONTENT_REPORT_REASON', { nullable: false }),
    Column.text('explanation', { nullable: false }),
    Column.string('reporter_name', 255, { nullable: true }),
    Column.string('reporter_email', 255, { nullable: true }),
    Column.enum('status', 'CONTENT_REPORT_STATUS', { default: 'RECEIVED', nullable: false }),
  ]);

  // The admin review queue reads open notices oldest first.
  await Schema.table(CONTENT_REPORTS).createIndexIfNotExists(['status', 'created_at']);
};

const down = async () => {
  await Schema.table(CONTENT_REPORTS).dropIfExists();
  await Schema.dropEnumIfExists('CONTENT_REPORT_STATUS');
  await Schema.dropEnumIfExists('CONTENT_REPORT_REASON');
};

export { up, down };
