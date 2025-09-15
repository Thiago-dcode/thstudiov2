#!/usr/bin/env ts-node

import { Command } from 'commander';
import { migrate } from '../lib/scripts/migrate';
import { createMigration } from '../lib/scripts/create-migration';
import { rollback } from '../lib/scripts/rollback';
import { seed } from '../lib/scripts/seed';
import Logger from '@repo/backend-lib/utils/console';

const program = new Command();

program.name('mydb').description('Database management CLI').version('1.0.0');

program
  .command('create:migration')
  .argument('<migrationName>', 'Migration name')
  .description('Create a new migration')
  .action((migrationName) => {
    createMigration(migrationName);
  });

program
  .command('migrate')
  .description('Migrate the database')
  .action(() => {
    // Use positional argument or option, with positional taking precedence
    migrate();
  });

program
  .command('rollback')
  .description('Rollback database migrations')
  .option('-s, --steps <number>', 'Number of migrations to rollback')
  .action((options) => {
    const _steps = options.steps ? parseInt(options.steps) : null;
    if (_steps !== null && isNaN(_steps)) {
      Logger.error('❌ Steps must be a number: --steps=<number>');
      process.exit(1);
    }
    rollback(_steps);
  });

program
  .command('db:seed')
  .option('-n, --name <string>', 'Name to seed')
  .action((options) => {
    seed(options.name);
  });
program.parse(process.argv);
