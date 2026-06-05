require('dotenv').config();
const mariadb = require('mariadb');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('@prisma/client');

const urlString = process.env.DATABASE_URL.trim();
const parsed = new URL(urlString);
const poolConfig = {
  host: parsed.hostname,
  port: Number(parsed.port) || 3306,
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: parsed.pathname.substring(1),
  ssl: parsed.searchParams.get('sslaccept') === 'strict' ? { rejectUnauthorized: false } : undefined,
  connectionLimit: 5
};

console.log("poolConfig is:", poolConfig);

const pool = mariadb.createPool(poolConfig);
const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter, log: ['query'] });

async function test() {
  try {
    const u = await prisma.user.findMany();
    console.log('success', u);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
