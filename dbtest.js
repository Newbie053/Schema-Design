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

async function insertEvent(carId, eventType, eventTimestamp) {
  if (eventType === 'entry') {
    // Prevent consecutive entries
    const unmatchedEntry = await client.query(
      `SELECT 1 FROM events
       WHERE car_id=$1 AND event_type='entry'
         AND NOT EXISTS (
           SELECT 1 FROM events e2
           WHERE e2.car_id=$1 AND e2.event_type='exit'
             AND e2.event_timestamp > events.event_timestamp
         )
       LIMIT 1`,
      [carId]
    );

    if (unmatchedEntry.rows.length) {
      console.log(`⚠️ Skipping entry for car ${carId} at ${eventTimestamp} — already an unmatched entry`);
      return;
    }
  }

  if (eventType === 'exit') {
    // Can only exit if there’s an unmatched entry
    const lastEntryRes = await client.query(
      `SELECT 1 FROM events
       WHERE car_id=$1 AND event_type='entry'
         AND NOT EXISTS (
           SELECT 1 FROM events e2
           WHERE e2.car_id=$1 AND e2.event_type='exit'
             AND e2.event_timestamp > events.event_timestamp
         )
       LIMIT 1`,
      [carId]
    );

    if (!lastEntryRes.rows.length) {
      console.log(`⚠️ Skipping exit for car ${carId} at ${eventTimestamp} — no unmatched entry`);
      return;
    }
  }

  await client.query(
    'INSERT INTO events (car_id, event_type, event_timestamp) VALUES ($1, $2, $3)',
    [carId, eventType, eventTimestamp]
  );
  console.log(`✅ Inserted ${eventType} event for car ${carId} at ${eventTimestamp}`);
}

async function testConnection() {
  try {
    await client.connect();
    console.log("✅ Connected to PostgreSQL successfully!");

    // Optional: clear events if needed
    // await client.query('TRUNCATE events RESTART IDENTITY;');
    // console.log("🗑 Cleared all events");

    // Query cars
    const carsRes = await client.query('SELECT * FROM cars;');
    console.log("📊 Cars Table Data:");
    console.table(carsRes.rows);

    // Sample event simulation
const eventsData = [
  { car_id: 3, type: 'entry', timestamp: '2025-10-27 08:30:00' },
  { car_id: 3, type: 'exit',  timestamp: '2025-10-27 09:30:00' },
  
  { car_id: 4, type: 'entry', timestamp: '2025-10-27 08:45:00' }, // unmatched
  { car_id: 5, type: 'entry', timestamp: '2025-10-27 09:00:00' },
  { car_id: 5, type: 'exit',  timestamp: '2025-10-27 10:15:00' },
  
  { car_id: 6, type: 'entry', timestamp: '2025-10-27 09:30:00' },
  { car_id: 6, type: 'exit',  timestamp: '2025-10-27 12:00:00' },
  
  { car_id: 5, type: 'entry', timestamp: '2025-10-27 12:05:00' }, // unmatched
  { car_id: 4, type: 'exit',  timestamp: '2025-10-27 12:30:00' }, // now matched
  
  { car_id: 7, type: 'entry', timestamp: '2025-10-27 12:45:00' },
  { car_id: 7, type: 'exit',  timestamp: '2025-10-27 13:15:00' },
  
  { car_id: 8, type: 'entry', timestamp: '2025-10-27 13:30:00' }, // unmatched
  { car_id: 9, type: 'entry', timestamp: '2025-10-27 14:00:00' },
  { car_id: 9, type: 'exit',  timestamp: '2025-10-27 15:00:00' },
  
  { car_id: 5, type: 'exit',  timestamp: '2025-10-27 15:30:00' }, // finally matched
  { car_id: 8, type: 'exit',  timestamp: '2025-10-27 16:00:00' }, // matched
  { car_id: 10, type: 'entry', timestamp: '2025-10-27 16:15:00' }, // unmatched
  { car_id: 10, type: 'exit',  timestamp: '2025-10-27 17:00:00' },
];


    for (const e of eventsData) {
      await insertEvent(e.car_id, e.type, e.timestamp);
    }

    // Show all events
    const eventsRes = await client.query('SELECT * FROM events ORDER BY event_timestamp ASC;');
    console.log("📅 Events Table:");
    console.table(eventsRes.rows);

  } catch (err) {
    console.error("❌ Database error:", err);
  } finally {
    await client.end();
    console.log("🔌 Disconnected from database.");
  }
}

testConnection();
