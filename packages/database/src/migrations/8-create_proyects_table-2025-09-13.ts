import { Column, Schema } from 'lib/facades';
import { createUpdatedAtTrigger } from 'lib/migration/utils';

const TABLE_NAME = 'users';

const up = async () => {
  //Your migration code here
  Schema.table('projects').createIfNotExists([
    Column.id(),
    Column.string('title', 255),
    Column.text('description'),
    Column.enum('status', 'PROJECT_STATUS', {
      default: 'NOT_STARTED',
    }),
    Column.float('budget', {
      nullable: true,
    }),
    Column.timestamp('start_date', {
      nullable: true,
    }),
    Column.timestamp('end_date', {
      nullable: true,
    }),
    Column.timestamp('payment_date', {
      nullable: true,
    }),
    Column.timestamp('pause_date', {
      nullable: true,
    }),
    Column.timestamp('cancel_date', {
      nullable: true,
    }),
    Column.timestamp('complete_date', {
      nullable: true,
    }),
    Column.boolean('show_client', {
      default: true,
    }),
    Column.boolean('show_service', {
      default: true,
    }),
    Column.boolean('visible',{
      default: true,
    }),
    Column.foreignKey('client_id', 'clients', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.foreignKey('service_id', 'services', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.timestamps(true),
  ]);
  await createUpdatedAtTrigger('projects');
  await Schema.table('project_media').createIfNotExists([
    Column.id(),
    Column.foreignKey('project_id', 'projects', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.foreignKey('media_id', 'media', 'id', {
      onDelete: 'CASCADE',
    }),
  ]);
};

const down = async () => {
  //Your migration rollback code here
};

export { up, down };
