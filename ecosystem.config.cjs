/**
 * PM2: pm2 start ecosystem.config.cjs --env production
 *
 * DB_URL va JWT_SECRET ni serverda o'rnating (gitga kirmaydi):
 *   pm2 set icrich-server:DB_URL "mongodb://127.0.0.1:27017/icrich"
 *   pm2 set icrich-server:JWT_SECRET "uzun-xavfsiz-kalit"
 * yoki ecosystem ichidagi env_production ga qo'ying.
 */
module.exports = {
  apps: [
    {
      name: "icrich-server",
      script: "server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "development",
        PORT: 5001,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5001,
        // DB_URL va JWT_SECRET — serverda to'ldiring
      },
    },
  ],
};
