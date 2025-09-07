import SchemaBuilder from '../../builder/SchemaBuilder';
import { handleMigration } from '../utils';
import Logger from '@repo/backend-lib/utils/console';
import { initClient } from '../../client';
import config from '@repo/backend-lib/config';

(async () => {
  try {
    // Initialize the database client first
    const dbConfig = config().database;
    await initClient({
      client: 'postgres',
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
    });
    const exists = await SchemaBuilder.table('migrations').exists();
    if (!exists) {
      SchemaBuilder.table('migrations').create([
        'id SERIAL PRIMARY KEY',
        'name VARCHAR(255) NOT NULL',
        'timestamp TIMESTAMP NOT NULL',
      ]);
    }

    // Now we can safely use SchemaBuilder
    handleMigration((migration) => {
      migration.up();
    });
  } catch (error) {
    Logger.error('Migration failed:', error);
    process.exit(1);
  }
})();
