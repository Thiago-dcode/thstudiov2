#!/usr/bin/env ts-node

import path from 'node:path';
import fs from 'node:fs';
import { Command } from 'commander';
import { migrate } from '../lib/scripts/migrate';
import { createMigration } from '../lib/scripts/create-migration';
import { seed } from '../lib/scripts/seed';
import Logger from '@repo/backend-lib/utils/console';
import { testDb } from '../lib/scripts/testDb';
import { createSeeder } from '../lib/scripts/create-seed';
import * as readline from 'readline';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { rollback } from '../lib/scripts/rollback';
import { cleanStripe } from '../lib/scripts/clean-stripe';
import { cleanS3 } from '../lib/scripts/clean-s3';
import { createStripeCustomers } from '../lib/scripts/create-stripe-customers';
import {
  DESTRUCTIVE_PASSWORD_HASH_ENV,
  verifyDestructivePassword,
} from '../lib/scripts/utils/destructive-password';
import {
  databaseCliConfig,
  setDatabaseCliConfig,
} from '../lib/scripts/utils/config';

// When running the compiled CLI (`node dist/src/bin/cli.js`), load migrations from
// dist so Docker/production images do not need tsx or TypeScript sources.
const distMigrationsDir = path.join(process.cwd(), 'dist', 'src', 'migrations');
if (fs.existsSync(distMigrationsDir)) {
  const distSeedsDir = path.join(process.cwd(), 'dist', 'src', 'seeds');
  setDatabaseCliConfig({
    ...databaseCliConfig,
    migrationsDirectory: distMigrationsDir,
    seedDirectory: fs.existsSync(distSeedsDir)
      ? distSeedsDir
      : databaseCliConfig.seedDirectory,
  });
}

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

/** Prompt for a password without echoing characters to the terminal. */
async function askPassword(message: string): Promise<string> {
  if (!process.stdin.isTTY) {
    Logger.error(
      '❌ No interactive TTY — cannot prompt for password. Re-run via dbcli-dev.sh / dbcli-prod.sh from a real terminal (those scripts allocate -it).',
    );
    process.exit(1);
  }

  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    stdout.write(`${message}: `);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';
    let inBracketedPaste = false;

    const finish = () => {
      stdin.setRawMode(false);
      stdin.removeListener('data', onData);
      stdin.pause();
      stdout.write('\n');
      resolve(password);
    };

    const onData = (chunk: string) => {
      // Pastes often arrive as one multi-char chunk (sometimes wrapped in
      // bracketed-paste markers). Walk byte-by-byte so typing and paste both work.
      for (let i = 0; i < chunk.length; i++) {
        if (chunk.startsWith('\u001b[200~', i)) {
          inBracketedPaste = true;
          i += 5; // loop +1 → skip full "\x1b[200~"
          continue;
        }
        if (chunk.startsWith('\u001b[201~', i)) {
          inBracketedPaste = false;
          i += 5;
          continue;
        }

        const char = chunk[i]!;
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004':
            finish();
            return;
          case '\u0003':
            stdin.setRawMode(false);
            stdin.removeListener('data', onData);
            stdout.write('\n');
            process.exit(1);
            break;
          case '\u007f':
          case '\b':
            if (password.length > 0) {
              password = password.slice(0, -1);
              stdout.write('\b \b');
            }
            break;
          default:
            // Drop other escape sequences (arrows, etc.) outside of a paste.
            if (!inBracketedPaste && char === '\u001b') {
              while (i + 1 < chunk.length) {
                i += 1;
                const next = chunk[i]!;
                if ((next >= 'A' && next <= 'Z') || (next >= 'a' && next <= 'z') || next === '~') {
                  break;
                }
              }
              break;
            }
            if (char < ' ' && char !== '\t') {
              break;
            }
            password += char;
            stdout.write('*');
            break;
        }
      }
    };
    stdin.on('data', onData);
  });
}

/**
 * Prompts for the destructive-action password and validates it, returning the
 * plaintext so it can be forwarded to sub-scripts (clean:s3, clean:stripe), which
 * re-validate it themselves rather than trusting the CLI's check.
 */
async function promptDestructivePassword(): Promise<string> {
  if (!process.env[DESTRUCTIVE_PASSWORD_HASH_ENV]) {
    Logger.error(
      `❌ ${DESTRUCTIVE_PASSWORD_HASH_ENV} is not set. Refusing destructive CLI command.`,
    );
    process.exit(1);
  }

  const password = await askPassword('Enter migrate:refresh password');
  if (!password) {
    Logger.error('❌ No password entered');
    process.exit(1);
  }
  const isValid = await verifyDestructivePassword(password);
  if (!isValid) {
    Logger.error('❌ Invalid password');
    process.exit(1);
  }
  return password;
}

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
    'Rollback all migrations, then migrate (password required; destructive)',
  )
  .action(async () => {
    await promptDestructivePassword();
    Logger.warn(
      '⚠️  This will rollback ALL migrations (down), then run migrate (up). All data in migrated tables may be lost.',
    );
    const confirmed = await confirmAction('Are you sure you want to continue?');
    if (!confirmed) {
      Logger.info('migrate:refresh cancelled.');
      process.exit(0);
    }
    try {
      await migrateRefreshCore();
      process.exit(0);
    } catch {
      process.exit(1);
    }
  });

program
  .command('db:fresh')
  .description(
    'migrate:refresh, clean:s3, clean:stripe, then db:seed (main). Password required; destructive.',
  )
  .action(async () => {
    const password = await promptDestructivePassword();
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
      await cleanS3({ exitProcess: false, password });
      await cleanStripe({ exitProcess: false, password });
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
  .description('Delete all Stripe customers and subscriptions (password required; destructive)')
  .action(async () => {
    const password = await promptDestructivePassword();
    Logger.warn('⚠️  This will delete ALL Stripe customers and subscriptions!');
    const confirmed = await confirmAction('Are you sure you want to continue?');
    if (!confirmed) {
      Logger.info('Stripe cleanup cancelled.');
      process.exit(0);
    }
    await cleanStripe({ password });
  });

program
  .command('clean:s3')
  .description('Empty the S3 bucket (password required; destructive)')
  .action(async () => {
    const password = await promptDestructivePassword();
    Logger.warn('⚠️  This will delete ALL objects in the S3 bucket!');
    const confirmed = await confirmAction('Are you sure you want to continue?');
    if (!confirmed) {
      Logger.info('S3 cleanup cancelled.');
      process.exit(0);
    }
    await cleanS3({ password });
  });

program
  .command('create:stripe-customers')
  .description('Create Stripe customers for active users who do not have one')
  .action(async () => {
    createStripeCustomers();
  });

program.parse(process.argv);
