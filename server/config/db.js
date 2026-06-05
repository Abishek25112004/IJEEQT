const mariadb = require('mariadb');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('@prisma/client');

// Prisma requires the protocol to be mariadb: for the adapter
const connectionString = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/^mysql:/, 'mariadb:') : undefined;
const pool = mariadb.createPool(connectionString);
const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
