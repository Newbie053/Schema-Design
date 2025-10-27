-- schema.sql
-- Drop (safe reset)
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_delete BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VEHICLES
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    plate_number VARCHAR(100) NOT NULL UNIQUE,
    vehicle_type VARCHAR(50) NOT NULL,
    is_delete BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EVENTS
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    event_type VARCHAR(10) NOT NULL CHECK (event_type IN ('entry','exit')),
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_vehicle_ts ON events(vehicle_id, event_timestamp);
CREATE INDEX IF NOT EXISTS idx_events_paid ON events(paid);


-- seed.sql

-- USERS (insert first)
INSERT INTO users (name, email, password_hash, role)
VALUES
('রফিকুল ইসলাম', 'rafiq@example.com', 'hash1', 'user'),
('সুমনা আক্তার', 'sumona@example.com', 'hash2', 'user'),
('জাহিদ হাসান', 'jahid@example.com', 'hash3', 'admin'),
('আরিফ হোসেন', 'arif@example.com', 'hash4', 'user'),
('মৌসুমি খাতুন', 'mausumi@example.com', 'hash5', 'user');

-- VEHICLES (insert next) IDs will be 1..10
INSERT INTO vehicles (user_id, plate_number, vehicle_type)
VALUES
(1, 'ঢাকা ১২-৫৬৩৪', 'car'),
(1, 'চট্টগ্রাম ৭৮-১২৯০', 'motorbike'),
(2, 'সিলেট ৫৬-৯০৭৮', 'car'),
(2, 'রাজশাহী ৯৯-১২৩৪', 'truck'),
(3, 'বরিশাল ৪৫-৬৭৮৯', 'car'),
(3, 'খুলনা ৩৪-৫৬৭৮', 'bus'),
(4, 'ফরিদপুর ১২-৩৪৫৬', 'van'),
(4, 'রংপুর ২৩-৮৯৭৬', 'car'),
(5, 'কুমিল্লা ৮৮-৯৯১১', 'bike'),
(5, 'নরসিংদী ১১-৫০০০', 'car');

-- EVENTS (insert last) — randomized, consistent entry/exit pairs and open sessions
INSERT INTO events (vehicle_id, event_type, event_timestamp, paid) VALUES
(3, 'entry', '2025-10-27 08:10:00+06', TRUE),
(1, 'entry', '2025-10-27 08:15:00+06', FALSE),
(6, 'entry', '2025-10-27 08:20:00+06', TRUE),
(3, 'exit',  '2025-10-27 09:05:00+06', TRUE),
(5, 'entry', '2025-10-27 09:10:00+06', FALSE),
(2, 'entry', '2025-10-27 09:15:00+06', TRUE),
(6, 'exit',  '2025-10-27 09:25:00+06', TRUE),
(1, 'exit',  '2025-10-27 09:40:00+06', FALSE),

(7, 'entry', '2025-10-27 09:45:00+06', TRUE),
(5, 'exit',  '2025-10-27 10:00:00+06', FALSE),
(4, 'entry', '2025-10-27 10:05:00+06', FALSE),
(8, 'entry', '2025-10-27 10:10:00+06', FALSE),
(10, 'entry', '2025-10-27 10:20:00+06', TRUE),
(7, 'exit',  '2025-10-27 10:25:00+06', TRUE),

(9, 'entry', '2025-10-26 23:40:00+06', FALSE),
(9, 'exit',  '2025-10-27 07:20:00+06', FALSE),

(3, 'entry', '2025-10-27 10:30:00+06', TRUE),
(2, 'exit',  '2025-10-27 10:35:00+06', TRUE),
(3, 'exit',  '2025-10-27 12:00:00+06', TRUE),

(6, 'entry', '2025-10-27 11:15:00+06', FALSE),
(6, 'exit',  '2025-10-27 13:30:00+06', FALSE),
(5, 'entry', '2025-10-27 11:45:00+06', FALSE),

(10, 'exit',  '2025-10-27 12:05:00+06', TRUE),
(4, 'exit',  '2025-10-27 12:20:00+06', FALSE),
(8, 'exit',  '2025-10-27 12:30:00+06', FALSE),

(1, 'entry', '2025-10-27 12:40:00+06', TRUE),
(1, 'exit',  '2025-10-27 13:50:00+06', TRUE),
(7, 'entry', '2025-10-27 14:05:00+06', FALSE),

(3, 'entry', '2025-10-27 14:15:00+06', FALSE),
(3, 'exit',  '2025-10-27 15:25:00+06', FALSE),

(2, 'entry', '2025-10-27 15:35:00+06', FALSE),
(9, 'entry', '2025-10-27 15:50:00+06', FALSE),

(10, 'entry', '2025-10-27 16:00:00+06', FALSE),
(10, 'exit',  '2025-10-27 16:40:00+06', FALSE),

(8, 'entry', '2025-10-27 17:00:00+06', FALSE),
(5, 'exit',  '2025-10-27 17:20:00+06', FALSE),

(4, 'entry', '2025-10-27 17:30:00+06', TRUE),
(4, 'exit',  '2025-10-27 19:00:00+06', TRUE),

(6, 'entry', '2025-10-27 19:15:00+06', FALSE),
(6, 'exit',  '2025-10-27 20:30:00+06', FALSE),

(9, 'exit',  '2025-10-27 21:00:00+06', FALSE),
(8, 'exit',  '2025-10-27 21:10:00+06', FALSE);
