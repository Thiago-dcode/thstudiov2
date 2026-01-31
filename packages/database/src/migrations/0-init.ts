import { Column, Schema } from '../lib/facades';
import {
  TRIGGER_UPDATE_CREATED_AT_FUNCTION_NAME,
  TRIGGER_UPDATE_UPDATED_AT_FUNCTION_NAME,
} from '@repo/common-lib/constants/database';
import { AvailableEnums, ENUMS } from '@repo/common-lib/constants/enums';

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


  
  await Schema.table('payment_methods').withTimestamps(true).createIfNotExists([
    Column.id(),
    Column.enum('payment_method','PAYMENT_METHOD',{
      unique:true
    }),
    Column.boolean('enabled',{
      default:true
    }),
  ]);
};

const down = async () => {
  // Drop the function
  await Schema.table('payment_methods').dropIfExists();
  for (const enumName of Object.keys(ENUMS)) {
    await Schema.dropEnumIfExists(enumName as AvailableEnums);
  }
};

export { up, down };
