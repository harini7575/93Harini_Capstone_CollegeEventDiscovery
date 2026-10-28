const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;
const JWT_SECRET = "super_secret_campus_key_2026"; // In production, move to process.env.JWT_SECRET

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Initialize SQLite Database File connection
const db = new sqlite3.Database(
  path.join(__dirname, "events.db"),
  (err) => {
    if (err) {
      console.error("Database connection failure:", err.message);
    } else {
      console.log("Connected to SQLite database successfully.");
    }
  }
);

// CRUCIAL FOR RELATIONSHIPS: Enable Foreign Key enforcement in SQLite
db.run("PRAGMA foreign_keys = ON;");

// Initialize Database Schemas including the security Users Table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      venue TEXT DEFAULT '',
      organizer TEXT DEFAULT '',
      time TEXT DEFAULT '10:00',
      seats INTEGER DEFAULT 100
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      student_name TEXT NOT NULL,
      student_email TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, student_email),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
  `);

  // Seed default administrator if the user base is empty
  db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
    if (err) return console.error(err.message);
    if (row.count > 0) return;

    // Password: adminpassword123 -> Hashed using 10 salt rounds
    const defaultAdminPasswordHash = bcrypt.hashSync("adminpassword123", 10);
    db.run(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      ["Admin Coordinator", "admin@college.edu", defaultAdminPasswordHash, "admin"],
      () => console.log("Default system administrator account seeded! [admin@college.edu]")
    );
  });
});

/* ==========================
   AUTHENTICATION MIDDLEWARE (JWT EVALUATION)
========================== */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access denied. Auth token bearer missing." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Session expired or invalid authorization verification sign." });
    }
    req.user = user;
    next();
  });
};

/* ==========================
   AUTHENTICATION ROUTES
========================== */

// Auth Point: Register/Signup
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password, role = "student" } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password inputs are required parameters." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name.trim(), email.trim().toLowerCase(), hashedPassword, role],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE")) {
            return res.status(400).json({ error: "An account with this email address already exists." });
          }
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: "User account created successfully.", userId: this.lastID });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to securely process encryption layers." });
  }
});

// Auth Point: Login / Session Sign-in (JWT Issuance)
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password properties are mandatory fields." });
  }

  db.get(
    "SELECT * FROM users WHERE lower(email) = lower(?)",
    [email.trim()],
    async (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(401).json({ error: "Invalid email account parameters or password layout." });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ error: "Invalid email account parameters or password layout." });

      // Generate access session token containing role privileges
      const accessToken = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "2h" }
      );

      res.json({
        message: "Sign-in authorization successful.",
        token: accessToken,
        user: { name: user.name, email: user.email, role: user.role }
      });
    }
  );
});

/* ==========================
   CORE DATA API PATHS
========================== */

// GET ALL EVENTS
app.get("/api/events", (req, res) => {
  db.all("SELECT * FROM events ORDER BY date ASC, time ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET STUDENT REGISTRATIONS (RELATIONAL JOIN)
app.get("/api/registrations", (req, res) => {
  const email = String(req.query.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Email query parameter required" });

  const query = `
    SELECT r.id AS registration_id, r.student_name, r.student_email, r.created_at,
           e.id AS event_id, e.title AS event_title, e.date AS event_date, e.venue AS event_venue, e.time AS event_time
    FROM registrations r
    INNER JOIN events e ON r.event_id = e.id
    WHERE LOWER(r.student_email) = ?
    ORDER BY e.date ASC
  `;
  db.all(query, [email], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// SECURED ROUTE: Create Event
app.post("/api/events", authenticateToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied. Admin access authorization required." });
  
  const { title, description = "", category, date, venue = "", organizer = "", time = "10:00", seats = 100 } = req.body;
  if (!title || !category || !date) return res.status(400).json({ error: "Title, category and date are required" });

  db.run(
    `INSERT INTO events (title, description, category, date, venue, organizer, time, seats) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, category, date, venue, organizer, time, seats],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "Event created successfully", id: this.lastID });
    }
  );
});

// SECURED ROUTE: Update Event
app.put("/api/events/:id", authenticateToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied. Admin access authorization required." });

  const { title, description = "", category, date, venue = "", organizer = "", time = "10:00", seats = 100 } = req.body;
  db.run(
    `UPDATE events SET title = ?, description = ?, category = ?, date = ?, venue = ?, organizer = ?, time = ?, seats = ? WHERE id = ?`,
    [title, description, category, date, venue, organizer, time, seats, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (!this.changes) return res.status(404).json({ error: "Event not found" });
      res.json({ message: "Event updated successfully" });
    }
  );
});

// REGISTER STUDENT
app.post("/api/register", (req, res) => {
  const eventId = Number(req.body.event_id);
  const name = String(req.body.student_name || "").trim();
  const email = String(req.body.student_email || "").trim().toLowerCase();
  if (!eventId || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Valid event ID, name and email required" });
  }

  db.get("SELECT id FROM events WHERE id = ?", [eventId], (err, event) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!event) return res.status(404).json({ error: "Event not found" });

    db.run(
      `INSERT INTO registrations (event_id, student_name, student_email) VALUES (?, ?, ?)`,
      [eventId, name, email],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE")) return res.status(400).json({ error: "Student already registered for this event" });
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: "Registration successful", registrationId: this.lastID });
      }
    );
  });
});

// DELETE REGISTRATION
app.delete("/api/registrations/:id", (req, res) => {
  db.run("DELETE FROM registrations WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (!this.changes) return res.status(404).json({ error: "Registration not found" });
    res.json({ message: "Registration deleted successfully." });
  });
});

// SECURED ROUTE: Delete Event (Triggers Cascade)
app.delete("/api/events/:id", authenticateToken, (req, res) => {
if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied. Admin access authorization required." });
db.run("DELETE FROM events WHERE id = ?", [req.params.id], function (err) {
if (err) return res.status(500).json({ error: err.message });
if (!this.changes) return res.status(404).json({ error: "Event context not found." });
res.json({ message: "Event context and dependent relationships purged." });
});
});
// Health check endpoint
app.get("/api/health", (req, res) => {
res.json({ status: "healthy", database: "connected" });
});
app.listen(PORT, () => console.log(`Server executing live on port: ${PORT}`));