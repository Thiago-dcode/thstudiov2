import { Column, Schema } from '../lib/facades';
import {
  ENUMS,
  TRIGGER_UPDATE_UPDATED_AT_FUNCTION_NAME,
} from '../lib/constants/constants';
import { AvailableEnums } from '../lib/constants/types';
import { createUpdatedAtTrigger } from '../lib/migration/utils';

const up = async () => {
  // Create trigger to automatically update updated_at timestamp on row updates
  await Schema.raw(`
    CREATE OR REPLACE FUNCTION ${TRIGGER_UPDATE_UPDATED_AT_FUNCTION_NAME}()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  //Enums
  for (const enumName of Object.keys(ENUMS)) {
    await Schema.createEnumIfNotExists(enumName as keyof AvailableEnums);
  }

  //Languages
  await Schema.table('languages').createIfNotExists([
    Column.id(),
    Column.string('name'),
    Column.enum('code', 'LANGUAGE_CODE', {
      unique: true,
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
    Column.foreignKey('language_code', 'languages', 'id', {
      onDelete: 'CASCADE',
      nullable: false,
    }),
  ]);
  await createUpdatedAtTrigger('language_translations');


};

const down = async () => {
  // Drop the function
  await Schema.table('language_translations').dropIfExists();
  await Schema.table('languages').dropIfExists();
};

export { up, down };
