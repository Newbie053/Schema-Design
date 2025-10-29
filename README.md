# 🚗 Parking Marshal — Database Documentation

## 📖 Overview

**Parking Marshal** is a PostgreSQL-powered parking management database designed for smart garages.  
It tracks:
- Admin users 👨‍💼  
- Vehicles 🚘  
- Entry/Exit events 🕒  
- Real-time parking status through an `is_in_garage` flag ✅  

Bangla license plates are fully supported using **UTF-8 encoding**.  
This database can later integrate with backend services (e.g., Node.js/Express) for billing or analytics.

---

## 🧱 1️⃣ Prerequisites

### 🧩 Install PostgreSQL
```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
🧾 Verify installation
bash
Copy code
psql --version
🏗️ 2️⃣ Database Setup
Step 1 — Connect to PostgreSQL
bash
Copy code
sudo -u postgres psql
Step 2 — Create Database
sql
Copy code
CREATE DATABASE parking_marshal
  WITH ENCODING='UTF8' TEMPLATE=template0
  LC_COLLATE='en_US.utf8' LC_CTYPE='en_US.utf8';
Step 3 — Confirm Encoding
sql
Copy code
\c parking_marshal;
SHOW server_encoding;   -- should show UTF8
SHOW client_encoding;   -- should show UTF8
SET client_encoding TO 'UTF8';
✅ Why:
Bangla plates require UTF-8 for correct storage and display.

🧩 3️⃣ Schema Design
Create a file named schema.sql and apply it with:

bash
Copy code
psql -U postgres -d parking_marshal -f schema.sql
Contents of schema.sql
sql
Copy code
-- ======================================================
--  Parking Marshal Database Schema
-- ======================================================

-- Drop old data if rebuilding
DROP TABLE IF EXISTS events.event CASCADE;
DROP TABLE IF EXISTS vehicles.vehicle CASCADE;
DROP TABLE IF EXISTS users.admins CASCADE;

-- Create Schemas
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS vehicles;
CREATE SCHEMA IF NOT EXISTS events;

-- ======================
--  USERS.ADMIN TABLE
-- ======================
CREATE TABLE IF NOT EXISTS users.admins (
    username VARCHAR(50) PRIMARY KEY,
    gmail VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================
--  VEHICLES.TABLE
-- ======================
CREATE TABLE IF NOT EXISTS vehicles.vehicle (
    vehicle_id SERIAL PRIMARY KEY,
    plate_no VARCHAR(100) UNIQUE NOT NULL,
    is_in_garage BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================
--  EVENTS.TABLE
-- ======================
CREATE TABLE IF NOT EXISTS events.event (
    event_id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES vehicles.vehicle(vehicle_id) ON DELETE CASCADE,
    event_type VARCHAR(10) CHECK (event_type IN ('entry', 'exit')),
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================
--  INDEXES
-- ======================
CREATE INDEX IF NOT EXISTS idx_vehicle_plate_no ON vehicles.vehicle(plate_no);
CREATE INDEX IF NOT EXISTS idx_events_vehicle_ts ON events.event(vehicle_id, event_timestamp);
CREATE INDEX IF NOT EXISTS idx_vehicle_is_in_garage ON vehicles.vehicle(is_in_garage);
🌱 4️⃣ Insert Dummy Data
Create seed.sql:

sql
Copy code
-- ======================================================
--  Seed Data for Parking Marshal
-- ======================================================

-- Admins
INSERT INTO users.admins (username, gmail, password)
VALUES 
('dipto_admin', 'dipto@example.com', 'hashed_password_1'),
('rayhan_admin', 'rayhan@example.com', 'hashed_password_2');

-- Vehicles
INSERT INTO vehicles.vehicle (plate_no, is_in_garage)
VALUES 
('ঢাকা-১২৩৪', FALSE),
('চট্টগ্রাম-৫৬৭৮', TRUE),
('খুলনা-৮৯০১', TRUE),
('রাজশাহী-৪৫৬৭', FALSE),
('সিলেট-৯৮৭৬', TRUE);

-- Events
INSERT INTO events.event (vehicle_id, event_type, event_timestamp)
VALUES
(1, 'entry', '2025-10-27 09:15:00+06'),
(1, 'exit',  '2025-10-27 10:45:00+06'),
(2, 'entry', '2025-10-27 11:00:00+06'),
(3, 'entry', '2025-10-27 12:30:00+06'),
(4, 'entry', '2025-10-27 13:15:00+06'),
(4, 'exit',  '2025-10-27 14:00:00+06'),
(5, 'entry', '2025-10-27 15:10:00+06');
Load data:

bash
Copy code
psql -U postgres -d parking_marshal -f seed.sql
🔄 5️⃣ Optional: Trigger for Auto is_in_garage Sync
Why
In production, this flag should automatically update when an event is inserted.

Create trigger.sql:

sql
Copy code
CREATE OR REPLACE FUNCTION sync_vehicle_garage_status()
RETURNS TRIGGER AS $$
DECLARE
    current_status BOOLEAN;
BEGIN
    SELECT is_in_garage INTO current_status FROM vehicles.vehicle WHERE vehicle_id = NEW.vehicle_id;

    IF NEW.event_type = 'entry' THEN
        IF current_status IS TRUE THEN
            RAISE EXCEPTION 'Vehicle % already inside the garage', NEW.vehicle_id;
        END IF;
        UPDATE vehicles.vehicle SET is_in_garage = TRUE WHERE vehicle_id = NEW.vehicle_id;

    ELSIF NEW.event_type = 'exit' THEN
        IF current_status IS FALSE THEN
            RAISE EXCEPTION 'Vehicle % cannot exit without being inside', NEW.vehicle_id;
        END IF;
        UPDATE vehicles.vehicle SET is_in_garage = FALSE WHERE vehicle_id = NEW.vehicle_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_vehicle_status ON events.event;
CREATE TRIGGER trg_sync_vehicle_status
AFTER INSERT ON events.event
FOR EACH ROW
EXECUTE FUNCTION sync_vehicle_garage_status();
Apply trigger:

bash
Copy code
psql -U postgres -d parking_marshal -f trigger.sql
✅ Auto-updates is_in_garage after every event.

🧠 6️⃣ Query Examples
🔹 List all admins
sql
Copy code
SELECT * FROM users.admins;
🔹 All vehicles with current status
sql
Copy code
SELECT vehicle_id, plate_no, is_in_garage FROM vehicles.vehicle;
🔹 Full event history
sql
Copy code
SELECT e.event_id, v.plate_no, e.event_type, e.event_timestamp
FROM events.event e
JOIN vehicles.vehicle v ON e.vehicle_id = v.vehicle_id
ORDER BY e.event_timestamp;
🔹 Current cars inside garage
sql
Copy code
SELECT plate_no FROM vehicles.vehicle WHERE is_in_garage = TRUE;
🔹 Manual bill calculation (SQL)
sql
Copy code
SELECT v.plate_no,
       e1.event_timestamp AS entry_time,
       e2.event_timestamp AS exit_time,
       ROUND(EXTRACT(EPOCH FROM (e2.event_timestamp - e1.event_timestamp))/3600,2) AS duration_hr,
       ROUND(EXTRACT(EPOCH FROM (e2.event_timestamp - e1.event_timestamp))/3600,2) * 50 AS bill
FROM events.event e1
JOIN events.event e2 ON e1.vehicle_id = e2.vehicle_id
JOIN vehicles.vehicle v ON v.vehicle_id = e1.vehicle_id
WHERE e1.event_type='entry' AND e2.event_type='exit'
  AND e2.event_timestamp > e1.event_timestamp;
