/**
 * Side-effect module: the first import of `cli.ts`, so seeds and `restore` write to
 * `dbcli/<date>.log`. No critical handler: this is an interactive CLI, its operator sees failures.
 */
import { configureLogProcess } from '@repo/backend-lib/services/log-service';

configureLogProcess({ service: 'dbcli' });
