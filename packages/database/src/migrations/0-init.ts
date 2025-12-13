import { Column, Schema } from '../lib/facades';
import {
  TRIGGER_UPDATE_CREATED_AT_FUNCTION_NAME,
  TRIGGER_UPDATE_UPDATED_AT_FUNCTION_NAME,
} from '@repo/common-lib/constants/database';
import { AvailableEnums, ENUMS } from '@repo/common-lib/constants/enums';
import { createTimeStampsTrigger } from '../lib/scripts/utils';

const up = async () => {
  // Create trigger to automatically update updated_at timestamp on row updates
  await Schema.raw(`
    CREATE OR REPLACE FUNCTION ${TRIGGER_UPDATE_UPDATED_AT_FUNCTION_NAME}()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.updated_at IS NULL THEN
            NEW.updated_at = CURRENT_TIMESTAMP;
        END IF;
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);
  await Schema.raw(`
    CREATE OR REPLACE FUNCTION ${TRIGGER_UPDATE_CREATED_AT_FUNCTION_NAME}()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.created_at IS NULL THEN
            NEW.created_at = CURRENT_TIMESTAMP;
        END IF;
        IF NEW.updated_at IS NULL THEN
            NEW.updated_at = CURRENT_TIMESTAMP;
        END IF;
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  //Enums
  for (const enumName of Object.keys(ENUMS)) {
    await Schema.createEnumIfNotExists(enumName as  AvailableEnums);
  }

  //Address
  await Schema.table('addresses').createIfNotExists([
    Column.id(),
    Column.string('street', 255, {
      nullable: true,
    }),
    Column.string('city', 255, {
      nullable: true,
    }),
    Column.string('state', 255, {
      nullable: true,
    }),
    Column.string('zip', 255, {
      nullable: true,
    }),
    Column.string('country', 255, {
      nullable: true,
    }),
    Column.string('latitude', 255, {
      nullable: true,
    }),
    Column.string('longitude', 255, {
      nullable: true,
    }),
    Column.timestamps(true),
  ]);
  await createTimeStampsTrigger('addresses');
};

const down = async () => {
  // Drop the function
  await Schema.table('addresses').dropIfExists();
  for (const enumName of Object.keys(ENUMS)) {
    await Schema.dropEnumIfExists(enumName as AvailableEnums);
  }
};

export { up, down };
