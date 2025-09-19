import { createTimeStampsTrigger } from '../lib/scripts/utils';
import { Column, Schema } from '../lib/facades';


const up = async () => {
  await Schema.table('collections').createIfNotExists([
    Column.id(),
    Column.string('title', 255, {}),
    Column.text('description'),
    Column.timestamps(true),
  ]);
  await Schema.table('collection_media').create([
    Column.id(),
    Column.foreignKey('collection_id', 'collections', 'id', {
      onDelete: 'CASCADE',
      nullable: false,
    }),
    Column.foreignKey('media_id', 'media', 'id', {
      onDelete: 'CASCADE',
      nullable: false,
    }),
    Column.integer('sort_order'),
  ]);
  await Schema.table('collection_translations').createIfNotExists([
    Column.id(),
    Column.string('name'),
    Column.text('description'),
    Column.enum('language_code', 'LANGUAGE_CODE'),
    Column.foreignKey('collection_id', 'collections', 'id', {
      onDelete: 'CASCADE',
      nullable: false,
    }),
    Column.integer('sort_order'),
  ]);

  await createTimeStampsTrigger('collections');
};  

const down = async () => {
  await Schema.table('collection_translations').dropIfExists();
  await Schema.table('collection_media').dropIfExists();
  await Schema.table('collections').dropIfExists();
};

export { up, down };
