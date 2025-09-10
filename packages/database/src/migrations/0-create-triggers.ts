import { Schema } from '../lib/utils/facades';
import { TRIGGER_UPDATE_UPDATED_AT_FUNCTION_NAME } from '../lib/utils/constants';

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
};
const down = async () => {
  // Drop the function
  await Schema.raw(
    `DROP FUNCTION IF EXISTS ${TRIGGER_UPDATE_UPDATED_AT_FUNCTION_NAME}();`,
  );
};

export { up, down };
