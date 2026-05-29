import { Column, Schema } from '../lib/facades';

const up = async () => {
  //Your migration code here
  await Schema.table('projects').withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.string('title', 255),
    Column.text('description'),
    Column.enum('status', 'PROJECT_STATUS', {
      default: 'NOT_STARTED',
    }),
    Column.float('budget', {
      nullable: true,
    }),
    Column.boolean('is_featured', {
      default: false
    }),
    Column.boolean('is_highlight', {
      default: false
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
    Column.boolean('is_active', {
      default: true,
    }),
    Column.timestamp('blocked_at', {
      nullable: true,
    }),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.foreignKey('client_id', 'clients', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.foreignKey('service_id', 'services', 'id', {
      onDelete: 'CASCADE',
    }),
  ]);

  await Schema.table('project_translations').createIfNotExists([
    Column.id(),
    Column.string('title'),
    Column.text('description'),
    Column.foreignKey('project_id', 'projects', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.enum('language_code', 'LANGUAGE_CODE'),
    Column.uniques('UC_project_translation',['language_code','project_id'])
  ]);
  await Schema.table('project_media').createIfNotExists([
    Column.id(),
    Column.foreignKey('project_id', 'projects', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.foreignKey('media_id', 'media', 'id', {
      onDelete: 'CASCADE',
    }),
    Column.smallInteger('position'),
    Column.uniques('UC_project_media',['project_id','media_id'])
  ]);
};

const down = async () => {
  //Your migration rollback code here
  await Schema.table('project_translations').dropIfExists();
  await Schema.table('project_media').dropIfExists();
  await Schema.table('projects').dropIfExists();
};

export { up, down };
