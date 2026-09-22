module.exports = {
  apps: [
    {
      name: 'pkgcat',
      script: './build/bin/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: '1G',
      env: {
        ENV_PATH: __dirname,
        HOST: '127.0.0.1',
      },
    },
    {
      name: 'pkgcat-worker',
      script: 'node',
      args: 'ace queue:work',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
}
