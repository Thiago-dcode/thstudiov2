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
import { cleanS3 } from '../lib/scripts/clean-s3';
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

/** Same allowlist as clean:stripe — Stripe API cleanup only runs in these envs. */
const DB_FRESH_ENVS = ['development', 'local', 'test'];

async function migrateRefreshCore(): Promise<void> {
  await rollback(null, { exitProcess: false });
  await migrate({ exitProcess: false });
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
    await rollback(_steps);
  });

program
  .command('migrate:refresh')
  .description(
    'Rollback all migrations, migrate, then clean:s3 in dev/local/test (local/staging: destructive DB; S3 only in allowed envs)',
  )
  .action(async () => {
    const env = getConfigValue('app').env.toLowerCase();
    if (env === 'production' || env === 'prod') {
      Logger.error('❌ migrate:refresh cannot be used in production');
      process.exit(1);
    }
    const willCleanS3 = DB_FRESH_ENVS.includes(env);
    Logger.warn(
      willCleanS3
        ? '⚠️  This will rollback ALL migrations (down), run migrate (up), then empty the S3 bucket (clean:s3). DB and object storage data may be lost.'
        : '⚠️  This will rollback ALL migrations (down), then run migrate (up). All data in migrated tables may be lost. clean:s3 is skipped outside development/local/test.',
    );
    const confirmed = await confirmAction('Are you sure you want to continue?');
    if (!confirmed) {
      Logger.info('migrate:refresh cancelled.');
      process.exit(0);
    }
    try {
      await migrateRefreshCore();
      if (willCleanS3) {
        await cleanS3({ exitProcess: false });
      } else {
        Logger.info(
          'ℹ️  Skipping clean:s3 (only runs when app env is development, local, or test).',
        );
      }
      process.exit(0);
    } catch {
      process.exit(1);
    }
  });

program
  .command('db:fresh')
  .description(
    'migrate:refresh, clean:stripe, then db:seed (main). Local/test only; destructive.',
  )
  .action(async () => {
    const env = getConfigValue('app').env.toLowerCase();
    if (env === 'production' || env === 'prod') {
      Logger.error('❌ db:fresh cannot be used in production');
      process.exit(1);
    }
    if (!DB_FRESH_ENVS.includes(env)) {
      Logger.error(
        `❌ db:fresh requires a local/test app env (${DB_FRESH_ENVS.join(', ')}). Current: "${env}"`,
      );
      process.exit(1);
    }
    Logger.warn(
      '⚠️  This will rollback ALL migrations, migrate, empty the S3 bucket, delete Stripe customers/subscriptions (test mode), then run the main seed.',
    );
    const confirmed = await confirmAction('Are you sure you want to continue?');
    if (!confirmed) {
      Logger.info('db:fresh cancelled.');
      process.exit(0);
    }
    try {
      await migrateRefreshCore();
      await cleanS3({ exitProcess: false });
      await cleanStripe({ exitProcess: false });
      await seed('main', { exitProcess: false });
      process.exit(0);
    } catch {
      process.exit(1);
    }
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
  .action(async (options) => {
    await seed(options.name);
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
    await cleanStripe();
  });

program
  .command('clean:s3')
  .description('Empty the S3 bucket (local only)')
  .action(async () => {
    Logger.warn('⚠️  This will delete ALL objects in the S3 bucket!');
    const confirmed = await confirmAction('Are you sure you want to continue?');
    if (!confirmed) {
      Logger.info('S3 cleanup cancelled.');
      process.exit(0);
    }
    await cleanS3();
  });

program
  .command('create:stripe-customers')
  .description('Create Stripe customers for active users who do not have one')
  .action(async () => {
    createStripeCustomers();
  });

program.parse(process.argv);
