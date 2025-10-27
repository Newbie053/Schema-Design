# 🚗 Parking Management System (Node.js + PostgreSQL)

A full-stack backend project for tracking vehicle entry/exit events, calculating parking bills, and managing user/car data.  
Built using **Express.js**, **PostgreSQL**, and **dotenv**.

---

## 🧩 Project Overview

This system manages:
- Users (with `isDelete` soft-delete flag)
- Cars (linked to users, with `isDelete` flag)
- Events (vehicle entry/exit logs with `paid/unpaid` status)
- Billing calculation via `/api/calculate-bill`

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL |
| **ORM / Driver** | `pg` |
| **Env Management** | `dotenv` |
| **API Testing** | cURL / Postman |

---

## 🏗️ 1. Database Setup

### 1.1 Create Database

```sql
CREATE DATABASE parking_db;
1.2 Connect to Database
bash
Copy code
psql -U postgres -d parking_db
1.3 Create Tables
sql
Copy code
DROP TABLE IF EXISTS events, cars, users CASCADE;

CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  isDelete BOOLEAN DEFAULT FALSE
);

CREATE TABLE cars (
  car_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  license_plate VARCHAR(20) UNIQUE NOT NULL,
  model VARCHAR(100),
  color VARCHAR(50),
  isDelete BOOLEAN DEFAULT FALSE
);

CREATE TABLE events (
  event_id SERIAL PRIMARY KEY,
  car_id INT REFERENCES cars(car_id) ON DELETE CASCADE,
  event_type VARCHAR(10) CHECK (event_type IN ('entry', 'exit')) NOT NULL,
  event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_status VARCHAR(10) CHECK (paid_status IN ('paid', 'unpaid')) DEFAULT 'unpaid'
);
📊 2. Sample Dummy Data
sql
Copy code
-- Insert users
INSERT INTO users (username, email, isDelete) VALUES
('Alice', 'alice@example.com', FALSE),
('Bob', 'bob@example.com', FALSE),
('Charlie', 'charlie@example.com', TRUE),
('Dipto', 'dipto@example.com', FALSE);

-- Insert cars
INSERT INTO cars (user_id, license_plate, model, color, isDelete) VALUES
(1, 'ABC-1234', 'Toyota Corolla', 'Blue', FALSE),
(2, 'XYZ-5678', 'Honda Civic', 'Black', TRUE),
(3, 'LMN-2468', 'Tesla Model 3', 'White', FALSE),
(4, 'DEF-9999', 'Suzuki Alto', 'Silver', FALSE);

-- Insert events
INSERT INTO events (car_id, event_type, event_timestamp, paid_status) VALUES
(1, 'entry', '2025-10-27 08:30:00', 'unpaid'),
(1, 'exit',  '2025-10-27 10:30:00', 'paid'),
(2, 'entry', '2025-10-27 09:15:00', 'unpaid'),
(3, 'entry', '2025-10-27 11:00:00', 'unpaid'),
(3, 'exit',  '2025-10-27 13:30:00', 'paid'),
(4, 'entry', '2025-10-27 14:00:00', 'unpaid');
🧠 3. ASCII Schema Diagram
scss
Copy code
        ┌──────────────┐
        │   users      │
        │--------------│
        │ user_id (PK) │
        │ username     │
        │ email        │
        │ isDelete     │
        └──────┬───────┘
               │ 1─∞
               ▼
        ┌──────────────┐
        │   cars       │
        │--------------│
        │ car_id (PK)  │
        │ user_id (FK) │
        │ license_plate│
        │ model        │
        │ color        │
        │ isDelete     │
        └──────┬───────┘
               │ 1─∞
               ▼
        ┌──────────────┐
        │   events     │
        │--------------│
        │ event_id (PK)│
        │ car_id (FK)  │
        │ event_type   │
        │ timestamp    │
        │ paid_status  │
        └──────────────┘
🚀 4. Backend Setup (Node.js)
4.1 Install dependencies
bash
Copy code
npm init -y
npm install express pg dotenv
4.2 Create .env File
bash
Copy code
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=yourpassword
PGDATABASE=parking_db
PGPORT=5432
4.3 Create server.js
(Your full working version with billing logic — already done)

🔍 5. Test Database Connection
Run:

bash
Copy code
node dbtest.js
Output should show cars and events inserted successfully.

💰 6. Calculate Bill API
Endpoint
bash
Copy code
POST http://localhost:3000/api/calculate-bill
Example cURL:
bash
Copy code
curl -X POST http://localhost:3000/api/calculate-bill \
  -H "Content-Type: application/json" \
  -d '{"car_id": 3, "exit_timestamp": "2025-10-27T17:00:00Z"}'
Response Example
json
Copy code
{
  "car_id": 3,
  "total_bill": 150,
  "sessions": [
    {
      "entry_time": "2025-10-27T11:00:00.000Z",
      "exit_time": "2025-10-27T13:30:00.000Z",
      "duration_hours": 3,
      "bill": 150
    }
  ]
}
📊 7. View All Data
sql
Copy code
SELECT * FROM users;
SELECT * FROM cars;
SELECT * FROM events;
🧩 8. Project Structure
pgsql
Copy code
parking-system/
├── server.js
├── dbtest.js
├── .env
├── package.json
└── README.md
🧠 9. Future Improvements
Add authentication (JWT)

Admin dashboard

Payment confirmation API

Frontend (React or Next.js)

🧑‍💻 Author
Dipto Saha — Computer Science & Engineering
Quick learner, problem solver, and builder.

⚡ License
MIT License

yaml
Copy code

---

## 📦 How to Add README to GitHub

1. **Create the README file**
   ```bash
   nano README.md
(Paste the above content and save with CTRL+O, then CTRL+X)

Stage and commit the file

```bash
git add README.md
git commit -m "Added project documentation"
Push to GitHub

bash
Copy code
git push origin main
(If your branch is named master, replace main with master.)

Verify on GitHub
Go to your repository homepage — the README will automatically render at the bottom.
dipto-
