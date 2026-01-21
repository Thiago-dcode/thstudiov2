import { Column, Schema } from '../lib/facades';

const up = async () => {
  await Schema.table('media').withTimestamps().createIfNotExists([
    Column.id(),
    Column.uuid('public_id'),
    Column.string('title', 255, {
      nullable:true,
    }),
    Column.text('description', {
      nullable: true,
    }),
    Column.integer('bytes'),
    Column.integer('thumbnail_bytes',{
      default:0
    }),
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
    Column.enum('compression_level', 'COMPRESSION_LEVEL', {
      nullable: true,
    }),
    Column.string('extension', 5),
    Column.boolean('is_active', {
      default: true,
    }),
    Column.string('seo_alt',255, {
      nullable: true,
    }),
    Column.string('seo_title',255, {
      nullable: true,
    }),
    Column.string('seo_description',255, {
      nullable: true,
    }),
    Column.string('seo_filename',255),
    Column.foreignKey('user_id', 'users', 'id', {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    }),
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
};

const down = async () => {
  await Schema.table('media_translations').dropIfExists();
  await Schema.table('media').dropIfExists();
};

export { up, down };
