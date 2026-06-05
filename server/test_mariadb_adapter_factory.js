require('dotenv').config();
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('@prisma/client');

let urlString = process.env.DATABASE_URL.trim();
// Fix ssl for mariadb driver
if (urlString.includes("sslaccept=strict")) {
  urlString = urlString.replace("sslaccept=strict", "sslmode=require");
}

const adapter = new PrismaMariaDb(urlString);
const prisma = new PrismaClient({ adapter, log: ['query', 'info', 'warn', 'error'] });

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
