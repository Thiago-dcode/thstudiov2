import { getClient } from '../../client';
import {
  TRIGGER_UPDATE_CREATED_AT_FUNCTION_NAME,
  TRIGGER_UPDATE_UPDATED_AT_FUNCTION_NAME,
} from '@repo/common-lib/constants/database';
import { TableName } from '@repo/common-lib/types/database';
import Logger from '@repo/backend-lib/utils/console';

const createUpdatedAtTrigger = async (tableName: TableName) => {
  try {
    await getClient().query(`
    CREATE TRIGGER update_${tableName}_updated_at 
    BEFORE UPDATE ON ${tableName}
    FOR EACH ROW 
    EXECUTE FUNCTION ${TRIGGER_UPDATE_UPDATED_AT_FUNCTION_NAME}();
  `);
  } catch (error) {
    Logger.error('❌ Trigger creation failed:', error);
  }
};

const createCreatedAtTrigger = async (tableName: TableName) => {
  try {
    await getClient().query(`
    CREATE TRIGGER update_${tableName}_created_at 
    BEFORE INSERT ON ${tableName}
    FOR EACH ROW 
    EXECUTE FUNCTION ${TRIGGER_UPDATE_CREATED_AT_FUNCTION_NAME}();
  `);
  } catch (error) {
    Logger.error('❌ Trigger creation failed:', error);
  }
};

const createTimeStampsTrigger = async (tableName: TableName) => {
  await createUpdatedAtTrigger(tableName);
  await createCreatedAtTrigger(tableName);
};

export {
  createUpdatedAtTrigger,
  createCreatedAtTrigger,
  createTimeStampsTrigger,
};

