#!/usr/bin/env ts-node

import { Command } from 'commander';
import { migrate } from '../lib/scripts/migrate';
import { createMigration } from '../lib/scripts/create-migration';
import { seed } from '../lib/scripts/seed';
import Logger from '@repo/backend-lib/utils/console';
import { testDb } from 'src/lib/scripts/testDb';
import { createSeeder } from '../lib/scripts/create-seed';
import * as readline from 'readline';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { rollback } from 'src/lib/scripts/rollback';
import { cleanStripe } from '../lib/scripts/clean-stripe';
import { createStripeCustomers } from '../lib/scripts/create-stripe-customers';

const program = new Command();

// Helper function to ask for user confirmation
async function confirmAction(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

program.name('dbcli').description('Database management CLI').version('1.0.0');
program
  .command('test')
  .description('Test the database')
  .action(() => {
    // Use positional argument or option, with positional taking precedence
    testDb();
  });

program
  .command('make:migration')
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
  .option('-a, --all', 'Rollback all migrations')
  .action(async (options) => {
    const _steps = options.steps ? parseInt(options.steps) : null;
    const _all = options.all;
    const env = getConfigValue('app').env.toLowerCase();
    if (env === 'production' || env === 'prod') {
      Logger.error('❌ You cannot rollback migrations in production');
      process.exit(1);
    }
    // Check if both options are provided or neither
    if ((!_all && !_steps) || (_all && _steps)) {
      Logger.error('❌ You must specify either --steps=<number> or --all');
      process.exit(1);
    }
    if (_steps !== null && isNaN(_steps)) {
      Logger.error('❌ Steps must be a number: --steps=<number>');
      process.exit(1);
    }
    // Ask for confirmation when rolling back all migrations
    if (_all) {
      Logger.warn('⚠️  You are about to rollback ALL migrations!');
      const confirmed = await confirmAction('Are you sure you want to continue?');
      if (!confirmed) {
        Logger.info('Rollback cancelled.');
        process.exit(0);
      }
    }
    rollback(_steps);
  });

program
  .command('make:seeder')
  .argument('<seedName>', 'Seed name')
  .description('Create a new seeder')
  .action((seedName) => {
    createSeeder(seedName);
  });
program
  .command('db:seed')
  .option('-n, --name <string>', 'Name to seed')
  .action((options) => {
    seed(options.name);
  });
program
  .command('clean:stripe')
  .description('Delete all Stripe customers and subscriptions (local only)')
  .action(async () => {
    Logger.warn('⚠️  This will delete ALL Stripe customers and subscriptions!');
    const confirmed = await confirmAction('Are you sure you want to continue?');
    if (!confirmed) {
      Logger.info('Stripe cleanup cancelled.');
      process.exit(0);
    }
    cleanStripe();
  });

program
  .command('create:stripe-customers')
  .description('Create Stripe customers for active users who do not have one')
  .action(async () => {
    createStripeCustomers();
  });

program.parse(process.argv);
