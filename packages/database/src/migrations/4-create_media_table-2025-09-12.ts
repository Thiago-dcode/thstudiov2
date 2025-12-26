import { createTimeStampsTrigger } from '../lib/scripts/utils';
import { Column, Schema } from '../lib/facades';

const up = async () => {
  await Schema.table('media').createIfNotExists([
    Column.id(),
    Column.string('title', 255, {
      nullable: true,
    }),
    Column.text('description', {
      nullable: true,
    }),

    Column.integer('bytes'),
    Column.string('url',255, {
      unique: true,
    }),
    //Generated automatically
    Column.string('thumbnail', 255, {
      nullable: true,
    }),
    //Block media if user exceed account max size
    Column.boolean('blocked',{
      default:false
    }),
    Column.enum('shape', 'MEDIA_SHAPE', {
      nullable: true,
    }),
    Column.enum('extension', 'MEDIA_EXTENSION'),
    Column.boolean('is_active', {
      default: true,
    }),
    //For SEO
    Column.text('tags', {
      nullable: true,
    }),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    }),
    Column.timestamps(),
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
    Column.uniques('UC_media_translation',['language_code','media_id'])
  ]);

  await createTimeStampsTrigger('media');
};

const down = async () => {
  await Schema.table('media_translations').dropIfExists();
  await Schema.table('media').dropIfExists();
};

export { up, down };
