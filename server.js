const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

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

  // Explicit FOREIGN KEY relationship constraint established mapping data parameters
  db.run(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      student_name TEXT NOT NULL,
      student_email TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, student_email),
      FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE
    )
  `);

  db.get("SELECT COUNT(*) AS count FROM events", (err, row) => {
    if (err) {
      console.error(err.message);
      return;
    }

    if (row.count > 0) return;

    const events = [
      [
        "AI Innovation Workshop",
        "Learn AI and machine learning fundamentals.",
        "Workshop",
        "2026-11-05",
        "Seminar Hall",
        "Tech Club",
        "10:00",
        60,
      ],
      [
        "CodeSprint Hackathon",
        "Build a technology prototype with your team.",
        "Hackathon",
        "2026-11-10",
        "Computer Lab",
        "Coding Club",
        "09:30",
        100,
      ],
      [
        "Inter-College Quiz Competition",
        "Test your general knowledge and technical skills.",
        "Competition",
        "2026-11-15",
        "Auditorium",
        "Literary Club",
        "11:00",
        80,
      ],
      [
        "Cultural Fest 2026",
        "Celebrate music, dance, drama and creativity.",
        "Cultural",
        "2026-11-20",
        "College Ground",
        "Cultural Club",
        "16:00",
        250,
      ],
      [
        "Data Science Bootcamp",
        "Learn Python, Pandas and data visualization.",
        "Workshop",
        "2026-11-28",
        "AI Lab",
        "Data Science Club",
        "09:30",
        70,
      ]
    ];

    const stmt = db.prepare(`
      INSERT INTO events
      (title, description, category, date, venue, organizer, time, seats)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    events.forEach((event) => stmt.run(event));

    stmt.finalize(() => {
      console.log("Sample events inserted.");
    });
  });
});

/* ==========================
   GET ALL EVENTS
========================== */

app.get("/api/events", (req, res) => {
  db.all(
    "SELECT * FROM events ORDER BY date ASC, time ASC",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

/* ==========================
   GET STUDENT REGISTRATIONS (RELATIONAL JOIN)
========================== */

app.get("/api/registrations", (req, res) => {
  const email = String(req.query.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    return res.status(400).json({
      error: "Email query parameter required",
    });
  }

  const query = `
    SELECT
      r.id AS registration_id,
      r.student_name,
      r.student_email,
      r.created_at,
      e.id AS event_id,
      e.title AS event_title,
      e.date AS event_date,
      e.venue AS event_venue,
      e.time AS event_time
    FROM registrations r
    INNER JOIN events e
      ON r.event_id = e.id
    WHERE LOWER(r.student_email) = ?
    ORDER BY e.date ASC
  `;

  db.all(query, [email], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

/* ==========================
   CREATE EVENT
========================== */

app.post("/api/events", (req, res) => {
  const {
    title,
    description = "",
    category,
    date,
    venue = "",
    organizer = "",
    time = "10:00",
    seats = 100,
  } = req.body;

  if (!title || !category || !date) {
    return res.status(400).json({
      error: "Title, category and date are required",
    });
  }

  db.run(
    `
      INSERT INTO events
      (title, description, category, date, venue, organizer, time, seats)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      title,
      description,
      category,
      date,
      venue,
      organizer,
      time,
      seats,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        message: "Event created successfully",
        id: this.lastID,
      });
    }
  );
});

/* ==========================
   UPDATE EVENT
========================== */

app.put("/api/events/:id", (req, res) => {
  const {
    title,
    description = "",
    category,
    date,
    venue = "",
    organizer = "",
    time = "10:00",
    seats = 100,
  } = req.body;

  db.run(
    `
      UPDATE events
      SET
        title = ?,
        description = ?,
        category = ?,
        date = ?,
        venue = ?,
        organizer = ?,
        time = ?,
        seats = ?
      WHERE id = ?
    `,
    [
      title,
      description,
      category,
      date,
      venue,
      organizer,
      time,
      seats,
      req.params.id,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!this.changes) {
        return res.status(404).json({
          error: "Event not found",
        });
      }

      res.json({
        message: "Event updated successfully",
      });
    }
  );
});

/* ==========================
   REGISTER STUDENT
========================== */

app.post("/api/register", (req, res) => {
  const eventId = Number(req.body.event_id);
  const name = String(req.body.student_name || "").trim();
  const email = String(req.body.student_email || "")
    .trim()
    .toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!eventId || !name || !emailRegex.test(email)) {
    return res.status(400).json({
      error: "Valid event ID, name and email required",
    });
  }

  db.get(
    "SELECT id FROM events WHERE id = ?",
    [eventId],
    (err, event) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!event) {
        return res.status(404).json({
          error: "Event not found",
        });
      }

      db.run(
        `
          INSERT INTO registrations
          (event_id, student_name, student_email)
          VALUES (?, ?, ?)
        `,
        [eventId, name, email],
        function (err) {
          if (err) {
            if (err.message.includes("UNIQUE")) {
              return res.status(400).json({
                error:
                  "Student already registered for this event",
              });
            }

            return res.status(500).json({
              error: err.message,
            });
          }

          res.status(201).json({
            message: "Registration successful",
            registrationId: this.lastID,
          });
        }
      );
    }
  );
});

/* ==========================
   DELETE REGISTRATION
========================== */

app.delete("/api/registrations/:id", (req, res) => {
  db.run(
    "DELETE FROM registrations WHERE id = ?",
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: err.message,
        });
      }

      if (!this.changes) {
        return res.status(404).json({
          error: "Registration not found",
        });
      }

      res.json({
        message: "Registration deleted successfully.",
      });
    }
  );
});

/* ==========================
   DELETE EVENT (TRIGGERS CASCADE)
========================== */

app.delete("/api/events/:id", (req, res) => {
  db.run("DELETE FROM events WHERE id = ?", [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!this.changes) {
      return res.status(404).json({ error: "Event context not found." });
    }
    res.json({ message: "Event context and dependent relationships purged." });
  });
});

app.listen(PORT, () => {
  console.log(`Server executing live on port: ${PORT}`);
});
