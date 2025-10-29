// server.js
require('dotenv').config();
const express = require('express');
const { Client } = require('pg');

const app = express();
app.use(express.json({ limit: '1mb' }));

const client = new Client({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
});

client.connect().then(() => console.log('✅ Connected to PostgreSQL (UTF-8 OK)'));

const RATE_PER_HOUR = 50;

// ---------------- HEALTH CHECK ----------------
app.get('/api/health', (_, res) => {
  res.json({ success: true, message: 'Parking Marshal API running 🚗' });
});

// ---------------- CALCULATE BILL (Bangla plate) ----------------
app.post('/api/calculate-bill', async (req, res) => {
  const { plate_no, exit_timestamp } = req.body;
  const currentTime = exit_timestamp ? new Date(exit_timestamp) : new Date();

  try {
    // 1️⃣ Find vehicle_id from Bangla plate number
    const vehicleRes = await client.query(
      'SELECT vehicle_id FROM vehicles.vehicle WHERE plate_no = $1',
      [plate_no]
    );

    if (!vehicleRes.rows.length) {
      return res.status(404).json({ message: `🚫 Vehicle "${plate_no}" not found` });
    }

    const vehicle_id = vehicleRes.rows[0].vehicle_id;

    // 2️⃣ Get all events for that vehicle
    const eventsRes = await client.query(
      `SELECT * FROM events.event
       WHERE vehicle_id = $1
       ORDER BY event_timestamp ASC`,
      [vehicle_id]
    );

    if (!eventsRes.rows.length) {
      return res.status(400).json({ message: `⚠️ No events found for "${plate_no}"` });
    }

    const events = eventsRes.rows;
    let totalBill = 0;
    let sessions = [];
    let lastEntry = null;

    // 3️⃣ Calculate duration-based bills
    for (const e of events) {
      if (e.event_type === 'entry') {
        if (!lastEntry) lastEntry = new Date(e.event_timestamp);
      } else if (e.event_type === 'exit' && lastEntry) {
        const exitTime = new Date(e.event_timestamp);
        const durationHours = Math.ceil((exitTime - lastEntry) / (1000 * 60 * 60));
        const bill = durationHours * RATE_PER_HOUR;
        totalBill += bill;
        sessions.push({ entry_time: lastEntry, exit_time: exitTime, duration_hours: durationHours, bill });
        lastEntry = null;
      }
    }

    // 4️⃣ Handle unmatched entry (still inside)
    if (lastEntry) {
      const durationHours = Math.ceil((currentTime - lastEntry) / (1000 * 60 * 60));
      const bill = durationHours * RATE_PER_HOUR;
      totalBill += bill;
      sessions.push({ entry_time: lastEntry, exit_time: null, duration_hours: durationHours, bill });
    }

    res.json({ plate_no, total_bill: totalBill, sessions });
  } catch (err) {
    console.error('❌ Billing error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server live at http://localhost:${PORT}`));
