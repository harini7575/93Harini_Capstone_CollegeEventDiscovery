const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = 3000;
const JWT_SECRET = "super_secret_campus_key_2026";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Ensure files storage directory exists
const uploadDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// Serve files directory statically
app.use("/uploads", express.static(uploadDir));

// Initialize SQLite Database File connection
const db = new sqlite3.Database(path.join(__dirname, "events.db"), (err) => {
  if (err) console.error("Database connection failure:", err.message);
  else console.log("Connected to SQLite database successfully.");
});

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
      seats INTEGER DEFAULT 100,
      image_url TEXT DEFAULT ''
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

  // Upgrade schema if image_url column is missing dynamically
  db.all("PRAGMA table_info(events)", (err, columns) => {
    if (err) return;
    const names = columns.map((c) => c.name);
    if (!names.includes("image_url")) {
      db.run("ALTER TABLE events ADD COLUMN image_url TEXT DEFAULT ''");
    }
  });

  db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
    if (err || row.count > 0) return;
    const defaultAdminPasswordHash = bcrypt.hashSync("adminpassword123", 10);
    db.run(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      ["Admin Coordinator", "admin@college.edu", defaultAdminPasswordHash, "admin"]
    );
  });
});

/* ==========================
   MULTER FILE STORAGE SETUP
========================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

/* ==========================
   AUTHENTICATION MIDDLEWARE
========================== */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied. Auth token bearer missing." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Session expired or invalid authorization token." });
    req.user = user;
    next();
  });
};

/* ==========================
   AUTHENTICATION ROUTES
========================== */
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password, role = "student" } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "All inputs are required parameters." });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name.trim(), email.trim().toLowerCase(), hashedPassword, role],
      function (err) {
        if (err) return res.status(400).json({ error: "Email address already exists." });
        res.status(201).json({ message: "User account created successfully.", userId: this.lastID });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Secure process encryption failure." });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE lower(email) = lower(?)", [email.trim()], async (err, user) => {
    if (err || !user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email account parameters or password layout." });
    }
    const accessToken = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "2h" });
    res.json({ token: accessToken, user: { name: user.name, email: user.email, role: user.role } });
  });
});

/* ==========================
   FILE UPLOAD ENDPOINT
========================== */
app.post("/api/upload", upload.single("event_banner"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file asset was transferred." });
  }
  const relativeAssetUrl = `/uploads/${req.file.filename}`;
  res.json({ message: "Image asset uploaded successfully.", imageUrl: relativeAssetUrl });
});

/* ==========================
   CORE DATA API PATHS
========================== */
app.get("/api/events", (req, res) => {
  db.all("SELECT * FROM events ORDER BY date ASC, time ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/events", authenticateToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin access authorization required." });
  const { title, description = "", category, date, venue = "", organizer = "", time = "10:00", seats = 100, image_url = "" } = req.body;
  
  db.run(
    `INSERT INTO events (title, description, category, date, venue, organizer, time, seats, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, category, date, venue, organizer, time, seats, image_url],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "Event created successfully", id: this.lastID });
    }
  );
});

app.post("/api/register", (req, res) => {
  const { event_id, student_name, student_email } = req.body;
  db.run(
    `INSERT INTO registrations (event_id, student_name, student_email) VALUES (?, ?, ?)`,
    [event_id, student_name, student_email],
    function (err) {
      if (err) return res.status(400).json({ error: "Registration failure parameters." });
      res.status(201).json({ message: "Registration successful", registrationId: this.lastID });
    }
  );
});

app.delete("/api/events/:id", authenticateToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin access authorization required." });
  db.run("DELETE FROM events WHERE id = ?", [req.params.id], function (err) {
    res.json({ message: "Event context purged." });
  });
});

app.listen(PORT, () => console.log(`Server executing live on port: ${PORT}`));
