module.exports = {
  apps: [
    {
      name: 'clinicos-backend',
      script: './server.js',
      instances: 1, // Fork mode (1 instance) is safer for local SQLite to prevent file locks. Scale up if PostgreSQL is configured.
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    }
  ]
};
