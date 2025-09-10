import { createUpdatedAtTrigger } from '../lib/migration/utils';
import { Column, Schema } from '../lib/utils/facades';

const up = async () => {
  //Your migration code here
  await Schema.createEnumIfNotExists('LANGUAGE_CODE');
  await Schema.table('languages').createIfNotExists([
    Column.id(),
    Column.string('name'),
    Column.enum('code', 'LANGUAGE_CODE', {
      unique: true,
      default: 'EN',
    }),
    Column.boolean('is_default', {
      default: false,
    }),
    Column.timestamps(true),
  ]);
  await createUpdatedAtTrigger('languages');

  await Schema.table('language_translations').createIfNotExists([
    Column.id(),
    Column.string('name'),
    Column.string('description'),
    Column.timestamps(true),
    Column.foreignKey('language_id', 'languages', 'id', {
      onDelete: 'CASCADE',
      nullable: false,
    }),
  ]);
  await createUpdatedAtTrigger('language_translations');
};

const down = async () => {
  //Your migration rollback code here
  await Schema.table('language_translations').drop();
  await Schema.table('languages').drop();
  await Schema.dropEnum('LANGUAGE_CODE');
  
  
};

export { up, down };
