#!/usr/bin/env ts-node

import { Command } from 'commander';
import { migrate } from '../lib/migration/migrate';
import { createMigration } from '../lib/migration/create-migration';
import { rollback } from '../lib/migration/rollback';

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
    rollback(options.steps);
  });

program.parse(process.argv);
