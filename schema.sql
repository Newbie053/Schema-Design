-- 🚗 Parking Marshal Database Setup Script
-- Date: 2025-10-28
-- Purpose: Core schemas (users, vehicles, events) + seed data

-- =====================================================
-- 1️⃣ Create Database
-- =====================================================
CREATE DATABASE parking_marshal;

-- Connect to the new database manually after running this line:
-- \c parking_marshal;

-- =====================================================
-- 2️⃣ Encoding Setup (ensure Bangla text compatibility)
-- =====================================================
SET client_encoding TO 'UTF8';

-- =====================================================
-- 3️⃣ Schema: users
-- =====================================================
CREATE SCHEMA IF NOT EXISTS users;

CREATE TABLE IF NOT EXISTS users.admins (
    username VARCHAR(50) PRIMARY KEY,
    gmail VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 👥 Example Admin Data
INSERT INTO users.admins (username, gmail, password)
VALUES 
('dipto_admin', 'dipto@example.com', 'hashed_password_1'),
('rayhan_admin', 'rayhan@example.com', 'hashed_password_2');

-- =====================================================
-- 4️⃣ Schema: vehicles
-- =====================================================
CREATE SCHEMA IF NOT EXISTS vehicles;

CREATE TABLE IF NOT EXISTS vehicles.vehicle (
    vehicle_id SERIAL PRIMARY KEY,
    plate_no VARCHAR(50) UNIQUE NOT NULL,  -- UTF-8 safe for Bangla
    is_in_garage BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🚘 Example Vehicle Data
INSERT INTO vehicles.vehicle (plate_no, is_in_garage)
VALUES 
('ঢাকা-১২৩৪', FALSE),        -- exited
('চট্টগ্রাম-৫৬৭৮', TRUE),     -- inside
('খুলনা-৮৯০১', TRUE),        -- inside
('রাজশাহী-৪৫৬৭', FALSE),     -- exited
('সিলেট-৯৮৭৬', TRUE);        -- inside

-- =====================================================
-- 5️⃣ Schema: events
-- =====================================================
CREATE SCHEMA IF NOT EXISTS events;

CREATE TABLE IF NOT EXISTS events.event (
    event_id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES vehicles.vehicle(vehicle_id) ON DELETE CASCADE,
    event_type VARCHAR(10) CHECK (event_type IN ('entry', 'exit')),
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 📅 Example Event Data
INSERT INTO events.event (vehicle_id, event_type, event_timestamp)
VALUES
(1, 'entry', '2025-10-27 09:15:00'),
(1, 'exit', '2025-10-27 10:45:00'),
(2, 'entry', '2025-10-27 11:00:00'),
(3, 'entry', '2025-10-27 12:30:00'),
(4, 'entry', '2025-10-27 13:15:00'),
(4, 'exit', '2025-10-27 14:00:00'),
(5, 'entry', '2025-10-27 15:10:00');

-- =====================================================
-- 6️⃣ Validation Queries (Optional)
-- =====================================================
-- Show all admins
SELECT * FROM users.admins;

-- Show all vehicles with current status
SELECT vehicle_id, plate_no, is_in_garage FROM vehicles.vehicle;

-- Show full event history with plate numbers
SELECT e.event_id, v.plate_no, e.event_type, e.event_timestamp
FROM events.event e
JOIN vehicles.vehicle v ON e.vehicle_id = v.vehicle_id
ORDER BY e.event_timestamp;

-- =====================================================
-- ✅ Notes:
-- - UTF-8 encoding ensures Bangla plate numbers are stored properly.
-- - "is_in_garage" currently managed manually.
-- - In production, we’ll automate flag updates via triggers or backend logic:
--     🔹 On 'entry' insert → set vehicle.is_in_garage = TRUE
--     🔹 On 'exit' insert  → set vehicle.is_in_garage = FALSE
--     🔹 Enforce rule: no 'exit' allowed unless last event was 'entry'
-- =====================================================
