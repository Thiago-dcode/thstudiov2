import { s3StorageConfig } from '../../config/storage';
import { StorageService } from '../storage-service/storage.service';
import { FactoryStorageService } from '../storage-service/factory-storage.service';
import Logger from '../../utils/console';
import { config } from '@repo/common-lib/config';
import { INDEXNOW_CANONICAL_HOST } from '@repo/common-lib/utils/indexnow';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const LOG = '[backup]';
/**
 * Local scratch space for pg_dump/pg_restore; a dump only lives here until it is uploaded. The OS temp dir,
 * not `storage/`: the containers run as the non-root `node` user and cannot create folders under /workspace.
 */
const TEMP_DIRECTORY = path.join(os.tmpdir(), 'a11studio-backups');
/** Bucket prefix for database dumps. Not a public asset prefix: keep it off any CDN behaviour. */
const BACKUP_PREFIX = 'internal/backups';

export type BackupResult =
    | { status: 'skipped'; reason: string }
    | { status: 'done'; key: string; size: number };

export type BackupDeleteResult =
    | { status: 'skipped'; reason: string }
    | { status: 'deleted'; keys: string[] };

/**
 * Every environment runs with `NODE_ENV=production`, so only the canonical host tells prod from dev.
 * Fail closed: anything unrecognised is treated as dev and never backed up.
 */
const envCan = (): boolean => {
    const { env, url } = config().app;
    if (!['production', 'local','development'].includes(env) || !url) return false;
    try {
        return new URL(url).host === INDEXNOW_CANONICAL_HOST;
    } catch {
        return false;
    }
};

const pad = (value: number) => String(value).padStart(2, '0');

const formatDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const RETENTION_DAYS = 7;
/** Hard stop for the cleanup walk, so a bug or an unexpectedly long run of dumps can't loop for long. */
const MAX_CLEANUP_DAYS = 365;

const backupKeyFor = (date: Date) => `${BACKUP_PREFIX}/pg-backup-${formatDate(date)}.dump`;

export const backup = async (
    storageService: StorageService = FactoryStorageService.create(s3StorageConfig),
): Promise<BackupResult> => {
    if (!envCan()) {
        Logger.info(`${LOG} skipped: not the production environment`);
        return { status: 'skipped', reason: 'not the production environment' };
    }

    const { database, host, port, username, password } = config().database;

    const key = backupKeyFor(new Date());
    const startedAt = Date.now();
    Logger.info(`${LOG} starting pg_dump of "${database}" -> ${key}`);
    const tempFile = path.join(TEMP_DIRECTORY, path.basename(key));

    try {
        await fs.mkdir(TEMP_DIRECTORY, { recursive: true });

        // execFile (no shell) keeps config values out of a command line; the password goes via env, not argv.
        await execFileAsync(
            'pg_dump',
            ['-U', username, '-h', host, '-p', String(port), '-d', database, '-F', 'c', '-f', tempFile],
            { env: { ...process.env, PGPASSWORD: password } },
        );

        const dump = await fs.readFile(tempFile);
        Logger.info(`${LOG} dump created (${dump.length} bytes), uploading`);
        if (!(await storageService.write(dump, key))) {
            throw new Error(`Backup upload to ${key} failed`);
        }

        // Confirm the object landed with the expected size before reporting success.
        const stored = await storageService.head(key);
        if (!stored || stored.size !== dump.length) {
            throw new Error(`Backup ${key} is missing or truncated in storage`);
        }

        Logger.success(`${LOG} uploaded ${key} (${stored.size} bytes) in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
        return { status: 'done', key, size: stored.size };
    } catch (error) {
        Logger.error(`${LOG} failed for ${key}:`, error);
        throw error;
    } finally {
        await fs.rm(tempFile, { force: true });
    }
};

/**
 * Deletes backups older than `RETENTION_DAYS`. Keys embed the date, so keys are computed rather than listed
 * (`S3StorageService.list()` is not implemented): starting `RETENTION_DAYS` ago it deletes that day's dump, then
 * the day before, and stops at the first day with none. Run once a day after `backup()`. A gap of one missed
 * day in the history leaves everything older than the gap behind.
 */
export const deleteExpiredBackup = async (
    storageService: StorageService = FactoryStorageService.create(s3StorageConfig),
): Promise<BackupDeleteResult> => {
    if (!envCan()) {
        Logger.info(`${LOG} cleanup skipped: not the production environment`);
        return { status: 'skipped', reason: 'not the production environment' };
    }

    const day = new Date();
    day.setDate(day.getDate() - RETENTION_DAYS);

    // Walk back one day at a time, deleting until a day has no dump: everything older was already cleaned.
    const keys: string[] = [];
    while (keys.length < MAX_CLEANUP_DAYS) {
        const key = backupKeyFor(day);
        if (!(await storageService.exists(key))) break;
        if (!(await storageService.delete(key))) {
            throw new Error(`Could not delete expired backup ${key}`);
        }
        keys.push(key);
        Logger.info(`${LOG} deleted expired backup ${key}`);
        day.setDate(day.getDate() - 1);
    }

    Logger.info(`${LOG} cleanup finished: ${keys.length} expired backup(s) deleted`);
    return { status: 'deleted', keys };
};

export type RestoreOptions = {
    /** Backup day to restore: a `Date` or a `YYYY-MM-DD` string. */
    date: Date | string;
    /** Restoring replaces live data; production refuses unless this is set explicitly. */
    allowProduction?: boolean;
    storageService?: StorageService;
};

const parseBackupDate = (date: Date | string): Date => {
    if (date instanceof Date) return date;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!match) throw new Error(`Invalid backup date "${date}", expected YYYY-MM-DD`);
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

/**
 * Restores the backup taken on `date` into the configured database with `pg_restore`.
 *
 * Backups only come from production, so the usual use is pulling one into dev; restoring onto production
 * (disaster recovery) needs `allowProduction`. Objects are dropped and recreated (`--clean --if-exists`)
 * inside one transaction, so a failed restore rolls back instead of leaving a half-restored database.
 */
export const restore = async ({
    date,
    allowProduction = false,
    storageService = FactoryStorageService.create(s3StorageConfig),
}: RestoreOptions): Promise<{ key: string }> => {
    if (envCan() && !allowProduction) {
        throw new Error('Refusing to restore onto production without allowProduction');
    }

    const { database, host, port, username, password } = config().database;

    const key = backupKeyFor(parseBackupDate(date));
    if (!(await storageService.exists(key))) {
        throw new Error(`No backup found at ${key}`);
    }

    const tempFile = path.join(TEMP_DIRECTORY, path.basename(key));
    const startedAt = Date.now();
    try {
        await fs.mkdir(TEMP_DIRECTORY, { recursive: true });
        Logger.warn(`${LOG} restoring ${key} into "${database}" on ${host}`);
        const dump = await storageService.getBuffer(key);
        Logger.info(`${LOG} downloaded ${key} (${dump.length} bytes), running pg_restore`);
        await fs.writeFile(tempFile, dump);

        await execFileAsync(
            'pg_restore',
            [
                '-U', username, '-h', host, '-p', String(port), '-d', database,
                '--clean', '--if-exists', '--no-owner', '--single-transaction',
                tempFile,
            ],
            { env: { ...process.env, PGPASSWORD: password } },
        );

        Logger.success(`${LOG} restored ${key} in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
        return { key };
    } catch (error) {
        Logger.error(`${LOG} restore of ${key} failed:`, error);
        throw error;
    } finally {
        await fs.rm(tempFile, { force: true });
    }
};

