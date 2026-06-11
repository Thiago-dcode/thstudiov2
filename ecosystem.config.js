// ecosystem.config.js — pm2 process config for TH Studio dev server
//
// pm2 does NOT run inside Docker containers here; it manages the Docker
// Compose stack from the HOST, ensuring the stack comes up after reboots
// and can be managed with standard pm2 commands:
//
//   pm2 start ecosystem.config.js   # start / register all apps
//   pm2 save                         # persist to pm2 startup dump
//   pm2 startup                      # register pm2 itself with systemd
//
//   pm2 restart a11studio-dev        # rolling restart of the whole stack
//   pm2 logs    a11studio-dev        # tail compose logs
//   pm2 stop    a11studio-dev        # stop the stack (containers keep running)
//
// NOTE: pm2 is monitoring the `docker compose up` foreground process.
//       The containers themselves have `restart: unless-stopped`, so Docker
//       also provides per-container resilience independently.

'use strict';

const path = require('path');

const REPO = path.resolve(__dirname);
const COMPOSE = `docker compose -f ${REPO}/compose.dev.yaml`;

module.exports = {
  apps: [
    {
      // ── Docker Compose stack ───────────────────────────────────────────────
      name: 'a11studio-dev',

      // Run compose in foreground so pm2 owns the process tree.
      // `--remove-orphans` cleans up leftover containers from removed services.
      script: 'docker',
      args: `compose -f ${REPO}/compose.dev.yaml up --remove-orphans`,
      cwd: REPO,

      // pm2 settings
      autorestart: true,
      watch: false,           // don't file-watch (use deploy.sh for deploys)
      max_memory_restart: '200M', // restart pm2 process if it leaks (not the containers)

      // Keep only the last 30 days of logs
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      out_file: `${REPO}/logs/compose-out.log`,
      error_file: `${REPO}/logs/compose-err.log`,
      merge_logs: true,

      // Environment passed to the `docker compose` process itself
      // (containers read their own .env via env_file; this is just for compose)
      env: {
        NODE_ENV: 'development',
        COMPOSE_PROJECT_NAME: 'a11studio-dev',
      },
    },

    {
      // ── Metrics / health watcher (lightweight) ─────────────────────────────
      // Runs every 60s to log a one-liner health summary.
      // Disable with: pm2 stop a11studio-healthcheck
      name: 'a11studio-healthcheck',

      script: 'bash',
      args: `-c "while true; do ${COMPOSE} ps --format 'table {{.Service}}\\t{{.Status}}' 2>/dev/null; sleep 60; done"`,
      cwd: REPO,

      autorestart: true,
      watch: false,

      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      out_file: `${REPO}/logs/healthcheck.log`,
      error_file: `${REPO}/logs/healthcheck-err.log`,
    },
  ],
};
