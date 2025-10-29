// dbtest.js
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
});

async function testConnection() {
  try {
    await client.connect();
    console.log("✅ Connected to PostgreSQL successfully!");

    // Check schemas
    const schemas = await client.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name IN ('users', 'vehicles', 'events');
    `);
    console.log("📦 Schemas found:");
    console.table(schemas.rows);

    // Check tables
    const tables = await client.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema IN ('users', 'vehicles', 'events');
    `);
    console.log("🧱 Tables found:");
    console.table(tables.rows);

    // Show current data
    const admins = await client.query('SELECT * FROM users.admins;');
    console.log("👤 Admins Table:");
    console.table(admins.rows);

    const vehicles = await client.query('SELECT * FROM vehicles.vehicle;');
    console.log("🚘 Vehicles Table:");
    console.table(vehicles.rows);

    const events = await client.query('SELECT * FROM events.event;');
    console.log("📅 Events Table:");
    console.table(events.rows);

  } catch (err) {
    console.error("❌ Database test error:", err);
  } finally {
    await client.end();
    console.log("🔌 Disconnected from database.");
  }
}

testConnection();
