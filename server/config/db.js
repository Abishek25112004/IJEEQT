const mariadb = require('mariadb');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('@prisma/client');

let poolConfig = undefined;
if (process.env.DATABASE_URL) {
  const urlString = process.env.DATABASE_URL.trim();
  try {
    const parsed = new URL(urlString);
    poolConfig = {
      host: parsed.hostname,
      port: Number(parsed.port) || 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.substring(1),
      ssl: parsed.searchParams.get('sslaccept') === 'strict' ? { rejectUnauthorized: true } : undefined
    };
  } catch (err) {
    // Fallback if URL parsing fails
    poolConfig = urlString.replace(/^mysql:/, 'mariadb:');
  }
}

const pool = mariadb.createPool(poolConfig);
const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
