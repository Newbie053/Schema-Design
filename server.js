// server.js
require('dotenv').config();
const express = require('express');
const { Client } = require('pg');

const app = express();
app.use(express.json());

const client = new Client({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
});

client.connect().then(() => console.log('✅ Connected to PostgreSQL'));

const RATE_PER_HOUR = 50;

// ----------------- Calculate Bill -----------------
app.post('/api/calculate-bill', async (req, res) => {
  const { vehicle_id, exit_timestamp } = req.body;
  const currentTime = exit_timestamp ? new Date(exit_timestamp) : new Date();

  try {
    const eventsRes = await client.query(
      `SELECT * FROM events
       WHERE vehicle_id=$1
       ORDER BY event_timestamp ASC`,
      [vehicle_id]
    );

    if (!eventsRes.rows.length) {
      return res.status(400).json({ message: 'No events found for this vehicle' });
    }

    const events = eventsRes.rows;
    let totalBill = 0;
    let sessions = [];
    let lastEntry = null;

    for (const e of events) {
      if (e.event_type === 'entry') {
        if (!lastEntry) lastEntry = new Date(e.event_timestamp);
      } else if (e.event_type === 'exit' && lastEntry) {
        const exitTime = new Date(e.event_timestamp);
        const durationMs = exitTime - lastEntry;
        const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
        const bill = durationHours * RATE_PER_HOUR;
        totalBill += bill;
        sessions.push({
          entry_time: lastEntry,
          exit_time: exitTime,
          duration_hours: durationHours,
          bill,
        });
        lastEntry = null;
      }
    }

    // Handle open session
    if (lastEntry) {
      const durationMs = currentTime - lastEntry;
      const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
      const bill = durationHours * RATE_PER_HOUR;
      totalBill += bill;
      sessions.push({
        entry_time: lastEntry,
        exit_time: null,
        duration_hours: durationHours,
        bill,
      });
    }

    res.json({
      vehicle_id,
      total_bill: totalBill,
      sessions,
    });
  } catch (err) {
    console.error('❌ Error calculating bill:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
