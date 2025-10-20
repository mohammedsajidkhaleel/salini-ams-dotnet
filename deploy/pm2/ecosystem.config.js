module.exports = {
  apps: [
    {
      name: 'salini-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/salini-ams/client',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'https://your-domain.com/api',
        NEXT_PUBLIC_APP_ENV: 'production'
      },
      error_file: '/var/log/pm2/salini-frontend-error.log',
      out_file: '/var/log/pm2/salini-frontend-out.log',
      log_file: '/var/log/pm2/salini-frontend-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
