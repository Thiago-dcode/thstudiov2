/**
 * Side-effect module: must be the first import of `main.ts`, so every logger (including ones
 * built at import time) writes to `api/<date>.log` and critical lines mail the admins.
 */
import { configureLogProcess } from '@repo/backend-lib/services/log-service';
import { criticalAlertMail } from '@repo/backend-lib/utils';

configureLogProcess({ service: 'api', onCritical: criticalAlertMail });
