require('dotenv').config();
const mariadb = require('mariadb');

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

async function test() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log("Connected successfully to:", poolConfig.host);
    const res = await conn.query("SELECT 1 as val");
    console.log("Query Result:", res);
  } catch(e) {
    console.error("Error:", e);
  } finally {
    if(conn) conn.release();
    await pool.end();
  }
}
test();
