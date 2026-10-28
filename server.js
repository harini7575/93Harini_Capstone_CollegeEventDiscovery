const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Initialize SQLite Database File
const db = new sqlite3.Database(
  path.join(__dirname, "events.db"),
  (err) => {
    if (err) {
      console.error("Database initialization error:", err.message);
    } else {
      console.log("Connected to SQLite database file successfully.");
    }
  }
);

// Initialize DB Tables and Structure
db.serialize(() => {
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
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);

  // Handle checking/adding runtime schema column safety modifications
  db.all("PRAGMA table_info(events)", (err, columns) => {
    if (err) return console.error(err.message);
    const names = columns.map((column) => column.name);
    if (!names.includes("time")) {
      db.run("ALTER TABLE events ADD COLUMN time TEXT DEFAULT '10:00'");
    }
    if (!names.includes("seats")) {
      db.run("ALTER TABLE events ADD COLUMN seats INTEGER DEFAULT 100");
    }
  });

  // Seed sample events if the table is completely empty
  db.get("SELECT COUNT(*) AS count FROM events", (err, row) => {
    if (err) return console.error(err.message);
    if (row.count > 0) return;

    const events = [
      ["AI Innovation Workshop", "Learn AI and machine learning fundamentals.", "Workshop", "2026-11-05", "Seminar Hall", "Tech Club", "10:00", 60],
      ["CodeSprint Hackathon", "Build a technology prototype with your team.", "Hackathon", "2026-11-10", "Computer Lab", "Coding Club", "09:30", 100],
      ["Inter-College Quiz Competition", "Test your general knowledge and technical skills.", "Competition", "2026-11-15", "Auditorium", "Literary Club", "11:00", 80],
      ["Cultural Fest 2026", "Celebrate music, dance, drama and creativity.", "Cultural", "2026-11-20", "College Ground", "Cultural Club", "16:00", 250],
      ["UI/UX Design Sprint", "Create wireframes and prototypes for a campus app.", "Workshop", "2026-11-24", "Design Studio", "Design Club", "10:00", 50],
      ["Data Science Bootcamp", "Learn Python, Pandas and data visualisation.", "Workshop", "2026-11-28", "AI Lab", "Data Science Club", "09:30", 70],
      ["Startup Pitch Day", "Pitch your startup idea and receive mentor feedback.", "Entrepreneurship", "2026-12-02", "Innovation Hub", "E-Cell", "13:00", 120],
      ["Robotics Challenge", "Build and demonstrate a robot.", "Competition", "2026-12-06", "Engineering Block", "Robotics Club", "10:00", 80],
      ["Cybersecurity Awareness Talk", "Learn about phishing, passwords and online safety.", "Seminar", "2026-12-09", "Seminar Hall", "Cybersecurity Club", "11:00", 100],
      ["Photography Walk", "Practice photography and visual storytelling.", "Arts", "2026-12-12", "Main Gate", "Photography Club", "08:00", 40],
      ["Open Mic Evening", "Perform poetry, music, comedy and spoken word.", "Cultural", "2026-12-15", "Open-Air Theatre", "Literary Club", "17:00", 90],
      ["Cloud Computing Seminar", "Explore cloud computing and deployment.", "Seminar", "2026-12-18", "Auditorium", "Cloud Club", "10:30", 100],
      ["Sports Day", "Participate in sports and team games.", "Sports", "2026-12-21", "College Ground", "Sports Club", "08:30", 300],
      ["Resume and Interview Workshop", "Improve your resume and interview skills.", "Career", "2027-01-06", "Placement Cell", "Career Development Cell", "10:00", 80],
      ["Web Development Workshop", "Build a responsive website and connect an API.", "Workshop", "2027-01-10", "Computer Lab", "Web Development Club", "09:30", 60],
      ["Green Campus Drive", "Participate in planting and sustainability activities.", "Community", "2027-01-14", "Central Courtyard", "Eco Club", "08:00", 150],
      ["AI Project Showcase", "Showcase student AI projects and prototypes.", "Exhibition", "2027-01-18", "Innovation Hub", "AI Club", "11:00", 100],
      ["Inter-Department Debate", "Discuss technology and society in a debate.", "Competition", "2027-01-22", "Auditorium", "Debate Society", "14:00", 60],
      ["Game Development Jam", "Create a small playable game with a team.", "Hackathon", "2027-01-26", "Media Lab", "Gaming Club", "09:00", 70],
      ["Music and Dance Night", "Enjoy student music and dance performances.", "Cultural", "2027-01-30", "College Ground", "Cultural Club", "17:30", 250]
    ];

    const statement = db.prepare(`
      INSERT INTO events
      (title, description, category, date, venue, organizer, time, seats)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    events.forEach((event) => statement.run(event));
    statement.finalize((err) => {
      if (err) console.error(err.message);
      else console.log("20 sample diagnostic events populated inside events.db!");
    });
  });
});

// GET: Retrieve all events ordered chronologically
app.get("/api/events", (req, res) => {
  db.all("SELECT * FROM events ORDER BY date ASC, time ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET: Fetch event registration records filtered by student email parameter
app.get("/api/registrations", (req, res) => {
  const studentEmail = req.query.email;

  if (!studentEmail) {
    return res.status(400).json({ error: "Query parameter 'email' is required to fetch registrations." });
  }

  const sanitizedEmail = String(studentEmail).trim().toLowerCase();
  
  const sqlQuery = `
    SELECT r.id AS registration_id, r.student_name, r.student_email, r.created_at,
           e.id AS event_id, e.title AS event_title, e.date AS event_date, e.venue AS event_venue, e.time AS event_time
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    WHERE lower(r.student_email) = ?
    ORDER BY e.date ASC
  `;

  db.all(sqlQuery, [sanitizedEmail], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST: Add a new campus event listing context
app.post("/api/events", (req, res) => {
  const { title, description = "", category, date, venue = "", organizer = "", time = "10:00", seats = 100 } = req.body;

  if (!title || !category || !date) {
    return res.status(400).json({ error: "Title, category and date fields are required." });
  }

  db.run(
    `INSERT INTO events (title, description, category, date, venue, organizer, time, seats) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, category, date, venue, organizer, time, seats],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "Event added successfully.", id: this.lastID });
    }
  );
});

// PUT: Update an existing event listing parameters (Milestone Goal!)
app.put("/api/events/:id", (req, res) => {
  const { title, description = "", category, date, venue = "", organizer = "", time = "10:00", seats = 100 } = req.body;

  if (!title || !category || !date) {
    return res.status(400).json({ error: "Title, category and date fields are required." });
  }

  db.run(
    `UPDATE events 
     SET title = ?, description = ?, category = ?, date = ?, venue = ?, organizer = ?, time = ?, seats = ? 
     WHERE id = ?`,
    [title, description, category, date, venue, organizer, time, seats, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (!this.changes) return res.status(404).json({ error: "Target event context not found." });
      res.json({ message: "Event updated completely inside backend database storage." });
    }
  );
});

// POST: Register a student with database parameter validation checks
app.post("/api/register", (req, res) => {
  const eventId = Number(req.body.event_id ?? req.body.eventId);
  const name = String(req.body.student_name ?? req.body.name ?? "").trim();
  const email = String(req.body.student_email ?? req.body.email ?? "").trim().toLowerCase();

  if (!eventId || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Valid event ID, student name and email structures are required." });
  }

  db.get("SELECT id FROM events WHERE id = ?", [eventId], (err, event) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!event) return res.status(404).json({ error: "Target event context not found." });

    db.get(
      `SELECT id FROM registrations WHERE event_id = ? AND lower(student_email) = lower(?)`,
      [eventId, email],
      (duplicateError, existing) => {
        if (duplicateError) return res.status(500).json({ error: duplicateError.message });
        if (existing) return res.status(400).json({ error: "Student email is already registered for this event." });

        db.run(
          `INSERT INTO registrations (event_id, student_name, student_email) VALUES (?, ?, ?)`,
          [eventId, name, email],
          function (insertError) {
            if (insertError) return res.status(500).json({ error: insertError.message });
            res.status(201).json({ message: "Registration written to DB successfully.", id: this.lastID });
          }
        );
      }
    );
  });
});

// Health check endpoint loop
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", database: "connected" });
});
app.listen(PORT, () => {
console.log(`Server executing live on port: ${PORT}`);
});