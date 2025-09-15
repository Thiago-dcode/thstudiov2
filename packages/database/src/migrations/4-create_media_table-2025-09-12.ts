import { createTimeStampsTrigger } from '../lib/scripts/utils';
import { Column, Schema } from '../lib/facades';
import Logger from '@repo/backend-lib/utils/console';

const up = async () => {
  await Schema.table('media').createIfNotExists([
    Column.id(),
    Column.string('title', 255, {
      nullable: true,
    }),
    Column.text('description', {
      nullable: true,
    }),

    Column.integer('size'),
    Column.string('url', 255, {
      unique: true,
    }),
    Column.string('thumbnail', 255, {
      nullable: true,
    }),
    Column.enum('shape', 'MEDIA_SHAPE', {
      nullable: true,
    }),
    Column.enum('extension', 'MEDIA_EXTENSION'),
    Column.enum('type', 'MEDIA_TYPE'),
    Column.boolean('is_active', {
      default: true,
    }),
    Column.text('tags', {
      nullable: true,
    }),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    }),
    Column.timestamps(true),
  ]);

  await Schema.table('media_translations').createIfNotExists([
    Column.id(),
    Column.string('name'),
    Column.string('description'),
    Column.enum('language_code', 'LANGUAGE_CODE'),
    Column.foreignKey('media_id', 'media', 'id', {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      nullable: false,
    }),
  ]);

  await createTimeStampsTrigger('media');
};

const down = async () => {
  await Schema.table('media_translations').dropIfExists();
  await Schema.table('media').dropIfExists();
};

export { up, down };
