const API_EVENTS = "/api/events";
const API_REGISTER = "/api/register";

const STORAGE = {
  events: "campusEvents_customEvents_v1",
  favorites: "campusEvents_favorites_v1",
  registrations: "campusEvents_registrations_v1",
  interests: "campusEvents_interests_v1",
  reminders: "campusEvents_reminders_v1"
};

const starterEvents = [
  {id:"demo-1",title:"AI Innovation Workshop",description:"Learn AI fundamentals, prompt engineering and practical machine-learning use cases.",category:"Workshop",date:"2026-11-05",time:"10:00",venue:"Seminar Hall",organizer:"Tech Club",seats:60,emoji:"🤖"},
  {id:"demo-2",title:"CodeSprint Hackathon",description:"Build a working technology prototype with a team and present it to judges.",category:"Hackathon",date:"2026-11-10",time:"09:30",venue:"Computer Lab",organizer:"Coding Club",seats:100,emoji:"💻"},
  {id:"demo-3",title:"Inter-College Quiz Competition",description:"A team quiz covering science, technology, current affairs and general knowledge.",category:"Competition",date:"2026-11-15",time:"11:00",venue:"Auditorium",organizer:"Literary Club",seats:80,emoji:"🏆"},
  {id:"demo-4",title:"Cultural Fest 2026",description:"Celebrate music, dance, drama, art and student creativity.",category:"Cultural",date:"2026-11-20",time:"16:00",venue:"College Ground",organizer:"Cultural Club",seats:250,emoji:"🎭"},
  {id:"demo-5",title:"UI/UX Design Sprint",description:"Create user flows, wireframes and a clickable prototype for a campus app.",category:"Workshop",date:"2026-11-24",time:"10:00",venue:"Design Studio",organizer:"Design Club",seats:50,emoji:"🎨"},
  {id:"demo-6",title:"Data Science Bootcamp",description:"Explore Python, Pandas, data cleaning and visualisation through hands-on exercises.",category:"Workshop",date:"2026-11-28",time:"09:30",venue:"AI Lab",organizer:"Data Science Club",seats:70,emoji:"📊"},
  {id:"demo-7",title:"Startup Pitch Day",description:"Pitch a student startup idea and get feedback from mentors.",category:"Entrepreneurship",date:"2026-12-02",time:"13:00",venue:"Innovation Hub",organizer:"E-Cell",seats:120,emoji:"🚀"},
  {id:"demo-8",title:"Robotics Challenge",description:"Build, test and demonstrate a robot for a series of fun engineering tasks.",category:"Competition",date:"2026-12-06",time:"10:00",venue:"Engineering Block",organizer:"Robotics Club",seats:80,emoji:"🦾"},
  {id:"demo-9",title:"Cybersecurity Awareness Talk",description:"Learn about phishing, password safety, privacy and responsible online security.",category:"Seminar",date:"2026-12-09",time:"11:00",venue:"Seminar Hall",organizer:"Cybersecurity Club",seats:100,emoji:"🔐"},
  {id:"demo-10",title:"Photography Walk",description:"Practice composition, lighting and visual storytelling around campus.",category:"Arts",date:"2026-12-12",time:"08:00",venue:"Main Gate",organizer:"Photography Club",seats:40,emoji:"📷"},
  {id:"demo-11",title:"Open Mic Evening",description:"Share poetry, music, comedy and spoken-word performances in a friendly setting.",category:"Cultural",date:"2026-12-15",time:"17:00",venue:"Open-Air Theatre",organizer:"Literary Club",seats:90,emoji:"🎤"},
  {id:"demo-12",title:"Cloud Computing Seminar",description:"Understand cloud basics, deployment, containers and cloud career paths.",category:"Seminar",date:"2026-12-18",time:"10:30",venue:"Auditorium",organizer:"Cloud Club",seats:100,emoji:"☁️"},
  {id:"demo-13",title:"Sports Day",description:"Join track events, team games and friendly inter-department competitions.",category:"Sports",date:"2026-12-21",time:"08:30",venue:"College Ground",organizer:"Sports Club",seats:300,emoji:"🏅"},
  {id:"demo-14",title:"Resume and Interview Workshop",description:"Improve your resume, practice interview answers and learn job-search basics.",category:"Career",date:"2027-01-06",time:"10:00",venue:"Placement Cell",organizer:"Career Development Cell",seats:80,emoji:"💼"},
  {id:"demo-15",title:"Web Development Workshop",description:"Build a responsive web page and connect it to a simple REST API.",category:"Workshop",date:"2027-01-10",time:"09:30",venue:"Computer Lab",organizer:"Web Development Club",seats:60,emoji:"🌐"},
  {id:"demo-16",title:"Green Campus Drive",description:"Take part in campus clean-up, planting and sustainability activities.",category:"Community",date:"2027-01-14",time:"08:00",venue:"Central Courtyard",organizer:"Eco Club",seats:150,emoji:"🌱"},
  {id:"demo-17",title:"AI Project Showcase",description:"Demonstrate student AI projects, prototypes and practical experiments.",category:"Exhibition",date:"2027-01-18",time:"11:00",venue:"Innovation Hub",organizer:"AI Club",seats:100,emoji:"🧠"},
  {id:"demo-18",title:"Inter-Department Debate",description:"Discuss technology, society and campus topics in a structured debate.",category:"Competition",date:"2027-01-22",time:"14:00",venue:"Auditorium",organizer:"Debate Society",seats:60,emoji:"🗣️"},
  {id:"demo-19",title:"Game Development Jam",description:"Design a small playable game during a collaborative creative sprint.",category:"Hackathon",date:"2027-01-26",time:"09:00",venue:"Media Lab",organizer:"Gaming Club",seats:70,emoji:"🎮"},
  {id:"demo-20",title:"Music and Dance Night",description:"An evening of student performances, live music and dance showcases.",category:"Cultural",date:"2027-01-30",time:"17:30",venue:"College Ground",organizer:"Cultural Club",seats:250,emoji:"🎶"}
];

let allEvents = [];
let activeCategory = "All";
let activeView = "all";
let toastTimer;

function futureDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function readStore(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function makeId(prefix = "ev") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatDate(dateString, options = {
  day: "numeric",
  month: "short",
  year: "numeric"
}) {
  const date = new Date(`${dateString}T12:00:00`);

  return Number.isNaN(date.getTime())
    ? dateString
    : date.toLocaleDateString("en-IN", options);
}

function categoryEmoji(category) {
  return ({
    Workshop: "🧠",
    Hackathon: "💻",
    Cultural: "🎭",
    Competition: "🏆",
    Seminar: "📊",
    Sports: "⚡"
  })[category] || "✨";
}

function getFavorites() {
  return readStore(STORAGE.favorites, []);
}

function getRegistrations() {
  return readStore(STORAGE.registrations, []);
}

function saveEvents() {
  writeStore(STORAGE.events, allEvents);
}

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

// Load events from the SQLite backend
async function loadEvents() {
  try {
    const response = await fetch(API_EVENTS);

    if (!response.ok) {
      throw new Error("Could not load events");
    }

    const data = await response.json();
    const serverEvents = Array.isArray(data) ? data : (data.events || []);

    allEvents = serverEvents.map(normalizeEvent);

    if (!allEvents.length) {
      allEvents = [...starterEvents];
    }
  } catch (error) {
    const localEvents = readStore(STORAGE.events, null);

    allEvents = Array.isArray(localEvents) && localEvents.length
      ? [
          ...starterEvents,
          ...localEvents.filter(
            event => !starterEvents.some(
              starter => starter.id === event.id
            )
          )
        ]
      : [...starterEvents];

    console.info("Using local demo events because the events API is unavailable.");
  }

  renderAll();
}

function normalizeEvent(event) {
  return {
    id: String(event.id ?? event._id ?? makeId()),
    title: event.title ?? event.name ?? "Untitled event",
    category: event.category ?? "Workshop",
    date: event.date ? String(event.date).slice(0, 10) : futureDate(7),
    time: event.time ?? "10:00",
    venue: event.venue ?? event.location ?? "Venue to be announced",
    seats: Number(event.seats ?? event.availableSeats ?? 100),
    description: event.description ?? "Join us for this campus event.",
    emoji: event.emoji ?? categoryEmoji(event.category)
  };
}

function renderAll() {
  renderEvents();
  updateCounts();
  renderAdminList();
}

function updateCounts() {
  document.getElementById("heroEventCount").textContent = allEvents.length;

  document.getElementById("heroCategoryCount").textContent =
    new Set(allEvents.map(event => event.category)).size;

  document.getElementById("favoriteNavCount").textContent =
    getFavorites().length;

  document.getElementById("year").textContent =
    new Date().getFullYear();
}

function getFilteredEvents() {
  const term = document.getElementById("searchInput").value.trim().toLowerCase();
  const sort = document.getElementById("sortFilter").value;
  const favorites = getFavorites();
  const interests = readStore(STORAGE.interests, []);

  let filtered = allEvents.filter(event => {
    const matchesTerm = [
      event.title,
      event.category,
      event.venue,
      event.description
    ].some(value => String(value).toLowerCase().includes(term));

    const matchesCategory =
      activeCategory === "All" || event.category === activeCategory;

    const matchesView =
      activeView !== "favorites" ||
      favorites.includes(String(event.id));

    const matchesInterest =
      activeView !== "recommended" ||
      interests.length === 0 ||
      interests.includes(event.category);

    return matchesTerm &&
      matchesCategory &&
      matchesView &&
      matchesInterest;
  });

  filtered.sort((a, b) => {
    return sort === "title"
      ? a.title.localeCompare(b.title)
      : `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);
  });

  return filtered;
}

function renderEvents() {
  const grid = document.getElementById("eventGrid");
  const events = getFilteredEvents();

  grid.innerHTML = events.map(event => {
    const date = new Date(`${event.date}T12:00:00`);

    const favorite = getFavorites().includes(String(event.id));

    const registrations = getRegistrations();

    const alreadyRegistered = registrations.some(
      registration => String(registration.eventId) === String(event.id)
    );

    return `
      <article class="event-card">
        <div class="event-art art-${escapeHTML(event.category.toLowerCase())}">
          <span class="art-emoji">${escapeHTML(event.emoji || categoryEmoji(event.category))}</span>

          <div class="event-date-badge">
            <b>${Number.isNaN(date.getTime()) ? "—" : date.getDate()}</b>
            <span>${Number.isNaN(date.getTime()) ? "Date" : date.toLocaleDateString("en-IN", { month: "short" })}</span>
          </div>

          <button
            class="favorite-btn ${favorite ? "saved" : ""}"
            data-favorite="${escapeHTML(event.id)}"
            aria-label="${favorite ? "Remove favorite" : "Save favorite"}"
          >${favorite ? "♥" : "♡"}</button>
        </div>

        <div class="event-card-body">
          <div class="event-meta">
            <span class="category-label">${escapeHTML(event.category)}</span>
            <span class="seats-label">${Math.max(0, Number(event.seats) || 0)} seats</span>
          </div>

          <h3>${escapeHTML(event.title)}</h3>

          <p class="event-description">${escapeHTML(event.description)}</p>

          <div class="event-details">
            <span>◷ ${escapeHTML(formatDate(event.date))} · ${escapeHTML(event.time)}</span>
            <span>⌖ ${escapeHTML(event.venue)}</span>
          </div>

          <div class="event-actions">
            <button class="btn btn-soft" data-remind="${escapeHTML(event.id)}">◷ Remind me</button>
            <button class="btn btn-primary" data-register="${escapeHTML(event.id)}">
              ${alreadyRegistered ? "Registered ✓" : "Register ↗"}
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  document.getElementById("resultCount").textContent =
    `${events.length} event${events.length === 1 ? "" : "s"}`;

  document.getElementById("emptyState").classList.toggle(
    "hidden",
    events.length !== 0
  );

  grid.classList.toggle("hidden", events.length === 0);

  const title = document.querySelector("#events .section-heading h2");

  if (title) {
    const heading = activeView === "favorites"
      ? "Favorite events"
      : activeView === "recommended"
        ? "Recommended events"
        : "Explore events";

    title.innerHTML = `${escapeHTML(heading)}<span class="accent">.</span>`;
  }
}

function setView(view) {
  activeView = view;

  if (view === "registrations") {
    openDashboard();
    return;
  }

  if (view === "admin") {
    openAdmin();
    return;
  }

  if (view === "favorites" || view === "all") {
    activeCategory = "All";
  }

  document.querySelectorAll(".chip").forEach(chip => {
    chip.classList.toggle(
      "active",
      chip.dataset.category === activeCategory
    );
  });

  document.getElementById("searchInput").value = "";

  renderEvents();

  document.getElementById("events").scrollIntoView({
    behavior: "smooth"
  });

  document.getElementById("navLinks").classList.remove("show");
}

function toggleFavorite(id) {
  const favorites = getFavorites();
  const key = String(id);

  const next = favorites.includes(key)
    ? favorites.filter(favorite => favorite !== key)
    : [...favorites, key];

  writeStore(STORAGE.favorites, next);

  renderAll();

  showToast(
    next.includes(key)
      ? "Event saved to favorites"
      : "Removed from favorites"
  );
}

// Open the registration modal
function openRegistration(id) {
  const event = allEvents.find(
    item => String(item.id) === String(id)
  );

  if (!event) return;

  const existing = getRegistrations().find(
    registration => String(registration.eventId) === String(id)
  );

  if (existing) {
    openDashboard();
    return;
  }

  document.getElementById("registrationEventId").value = event.id;

  document.getElementById("modalTitle").textContent =
    `Register for ${event.title}`;

  document.getElementById("modalEventInfo").textContent =
    `${formatDate(event.date)} · ${event.time} · ${event.venue}`;

  document.getElementById("registrationMessage").textContent = "";
  document.getElementById("reminderOptIn").checked = false;

  document.getElementById("registrationModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("registrationModal").classList.add("hidden");
}

// Register a student for an event
async function registerEvent(event) {
  event.preventDefault();

  const eventId = document.getElementById("registrationEventId").value;

  const campusEvent = allEvents.find(
    item => String(item.id) === String(eventId)
  );

  const name = document.getElementById("studentName").value.trim();
  const email = document.getElementById("studentEmail").value.trim();

  if (!campusEvent || !name || !email) return;

  if (getRegistrations().some(
    registration => String(registration.eventId) === String(eventId)
  )) {
    document.getElementById("registrationMessage").textContent =
      "You have already registered for this event.";
    return;
  }

  const registration = {
    id: makeId("reg"),
    eventId: String(eventId),
    eventTitle: campusEvent.title,
    name,
    email,
    registeredAt: new Date().toISOString(),
    date: campusEvent.date,
    time: campusEvent.time,
    venue: campusEvent.venue
  };

  try {
    const response = await fetch(API_REGISTER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        event_id: eventId,
        student_name: name,
        student_email: email
      })
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));

      document.getElementById("registrationMessage").textContent =
        result.error || "Registration failed. Please try again.";

      return;
    }
  } catch (error) {
    console.info("Registration API unavailable; saving registration locally.");
  }

  const registrations = getRegistrations();

  registrations.push(registration);

  writeStore(STORAGE.registrations, registrations);

  if (document.getElementById("reminderOptIn").checked) {
    scheduleReminder(campusEvent.id);
  }

  closeModal();

  document.getElementById("registrationForm").reset();

  renderAll();

  showToast("Registration saved! See it in My Registrations.");
}

// Set an event reminder
async function scheduleReminder(id) {
  const event = allEvents.find(
    item => String(item.id) === String(id)
  );

  if (!event) return;

  const reminders = readStore(STORAGE.reminders, []);

  if (!reminders.includes(String(id))) {
    reminders.push(String(id));
  }

  writeStore(STORAGE.reminders, reminders);

  if ("Notification" in window) {
    if (Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {}
    }

    if (Notification.permission === "granted") {
      showToast("Reminder enabled. Keep this site open for browser notifications.");
    } else {
      showToast("Reminder saved. Browser notifications are blocked.");
    }
  } else {
    showToast("Reminder preference saved in this browser.");
  }
}

// Display the registration dashboard
function openDashboard() {
  activeView = "all";

  const modal = document.getElementById("dashboardModal");
  const content = document.getElementById("dashboardContent");
  const registrations = getRegistrations();

  document.getElementById("dashboardTitle").textContent =
    "My registrations";

  if (!registrations.length) {
    content.innerHTML = `
      <div class="empty-dashboard">
        <h3>No registrations yet</h3>
        <p>Explore events and register to see your plans here.</p>
        <button class="btn btn-primary" data-dashboard-explore>
          Explore events
        </button>
      </div>
    `;
  } else {
    content.innerHTML = `
      <p class="muted">
        Your registrations are stored in this browser.
        Keep the QR code available at event check-in.
      </p>

      <div class="registration-list">
        ${registrations.map(registration => {
          const event = allEvents.find(
            item => String(item.id) === String(registration.eventId)
          );

          const title = event?.title || registration.eventTitle || "Campus event";
          const date = event?.date || registration.date;
          const time = event?.time || registration.time;
          const venue = event?.venue || registration.venue;

          return `
            <article class="registration-item">
              <div>
                <h3>${escapeHTML(title)}</h3>

                <p>
                  Registered by ${escapeHTML(registration.name)}<br>
                  ${escapeHTML(formatDate(date))} · ${escapeHTML(time)}<br>
                  ⌖ ${escapeHTML(venue)}
                </p>

                <div class="registration-actions">
                  <button class="mini-btn" data-remind="${escapeHTML(registration.eventId)}">
                    Enable reminder
                  </button>

                  <button
                    class="mini-btn danger"
                    data-cancel-registration="${escapeHTML(registration.id)}"
                  >
                    Cancel registration
                  </button>
                </div>

                <div class="qr-area">
                  <div class="qr-code" id="qr-${escapeHTML(registration.id)}"></div>
                  <p class="small-note">
                    Registration QR<br>
                    ${escapeHTML(registration.id)}
                  </p>
                </div>
              </div>

              <span class="category-label">REGISTERED</span>
            </article>
          `;
        }).join("")}
      </div>
    `;

    setTimeout(() => {
      registrations.forEach(registration => {
        const qrElement = document.getElementById(`qr-${registration.id}`);

        if (qrElement && window.QRCode) {
          new QRCode(qrElement, {
            text: JSON.stringify({
              registrationId: registration.id,
              eventId: registration.eventId
            }),
            width: 82,
            height: 82
          });
        } else if (qrElement) {
          qrElement.textContent = "QR library unavailable";
        }
      });
    }, 50);
  }

  modal.classList.remove("hidden");
}

function closeDashboard() {
  document.getElementById("dashboardModal").classList.add("hidden");
}

function cancelRegistration(id) {
  writeStore(
    STORAGE.registrations,
    getRegistrations().filter(registration => registration.id !== id)
  );

  openDashboard();
  renderAll();

  showToast("Registration cancelled");
}

// Admin event management
function openAdmin() {
  document.getElementById("adminModal").classList.remove("hidden");
  renderAdminList();
}

function closeAdmin() {
  document.getElementById("adminModal").classList.add("hidden");
  clearAdminForm();
}

function clearAdminForm() {
  document.getElementById("eventForm").reset();
  document.getElementById("adminEventId").value = "";
  document.getElementById("adminTime").value = "10:00";
  document.getElementById("adminSaveButton").textContent = "Add event";
}

async function saveAdminEvent(event) {
  event.preventDefault();

  const id = document.getElementById("adminEventId").value;

  const eventData = {
    title: document.getElementById("adminTitleInput").value.trim(),
    category: document.getElementById("adminCategory").value,
    date: document.getElementById("adminDate").value,
    time: document.getElementById("adminTime").value,
    venue: document.getElementById("adminVenue").value.trim(),
    seats: Number(document.getElementById("adminSeats").value),
    description: document.getElementById("adminDescription").value.trim(),
    organizer: "Campus Events",
    emoji: categoryEmoji(
      document.getElementById("adminCategory").value
    )
  };

  if (!eventData.title || !eventData.date || !eventData.venue) {
    return;
  }

  try {
    const response = await fetch(
      id
        ? `${API_EVENTS}/${encodeURIComponent(id)}`
        : API_EVENTS,
      {
        method: id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(eventData)
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "Could not save event");
    }

    await loadEvents();

    clearAdminForm();
    renderAdminList();

    showToast(id ? "Event updated" : "Event added");
  } catch (error) {
    const fallback = {
      ...eventData,
      id: id || makeId()
    };

    if (id) {
      allEvents = allEvents.map(item =>
        String(item.id) === String(id) ? fallback : item
      );
    } else {
      allEvents.push(fallback);
    }

    const custom = readStore(STORAGE.events, []);

    const next = custom.filter(
      item => String(item.id) !== String(id || fallback.id)
    );

    next.push(fallback);

    writeStore(STORAGE.events, next);

    renderAll();
    clearAdminForm();
    renderAdminList();

    showToast(`Saved locally only: ${error.message}`);
  }
}

function renderAdminList() {
  const list = document.getElementById("adminEventList");

  if (!list) return;

  if (!allEvents.length) {
    list.innerHTML = `<p class="muted">No events to manage.</p>`;
    return;
  }

  list.innerHTML = allEvents.map(event => `
    <div class="admin-row">
      <div>
        <strong>${escapeHTML(event.title)}</strong>
        <small>
          ${escapeHTML(event.category)} ·
          ${escapeHTML(formatDate(event.date))} ·
          ${escapeHTML(event.venue)}
        </small>
      </div>

      <div class="admin-row-actions">
        <button
          class="mini-btn"
          data-edit-event="${escapeHTML(event.id)}"
        >Edit</button>

        <button
          class="mini-btn danger"
          data-delete-event="${escapeHTML(event.id)}"
        >Delete</button>
      </div>
    </div>
  `).join("");
}

function editAdminEvent(id) {
  const event = allEvents.find(
    item => String(item.id) === String(id)
  );

  if (!event) return;

  document.getElementById("adminEventId").value = event.id;
  document.getElementById("adminTitleInput").value = event.title;
  document.getElementById("adminCategory").value = event.category;
  document.getElementById("adminDate").value = event.date;
  document.getElementById("adminTime").value = event.time;
  document.getElementById("adminVenue").value = event.venue;
  document.getElementById("adminSeats").value = event.seats;
  document.getElementById("adminDescription").value = event.description;

  document.getElementById("adminSaveButton").textContent = "Save changes";
  document.getElementById("adminTitleInput").focus();
}

async function deleteAdminEvent(id) {
  if (!confirm("Delete this event?")) return;

  try {
    const response = await fetch(
      `${API_EVENTS}/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "Could not delete event");
    }

    allEvents = allEvents.filter(
      event => String(event.id) !== String(id)
    );

    writeStore(
      STORAGE.favorites,
      getFavorites().filter(favorite => String(favorite) !== String(id))
    );

    renderAll();

    showToast("Event deleted");
  } catch (error) {
    allEvents = allEvents.filter(
      event => String(event.id) !== String(id)
    );

    writeStore(
      STORAGE.events,
      allEvents.filter(
        event => !starterEvents.some(starter => starter.id === event.id)
      )
    );

    writeStore(
      STORAGE.favorites,
      getFavorites().filter(favorite => String(favorite) !== String(id))
    );

    renderAll();

    showToast(`Deleted locally only: ${error.message}`);
  }
}

// Personalized recommendations
function saveInterests() {
  const interests = [
    ...document.querySelectorAll("#interestOptions input:checked")
  ].map(input => input.value);

  writeStore(STORAGE.interests, interests);

  activeView = "recommended";
  activeCategory = "All";

  renderEvents();

  document.getElementById("recommendationNote").textContent =
    interests.length
      ? `Showing events matching: ${interests.join(", ")}.`
      : "Select interests to personalize your events.";

  document.getElementById("events").scrollIntoView({
    behavior: "smooth"
  });

  showToast(
    interests.length
      ? "Recommendations updated"
      : "Choose an interest to get recommendations"
  );
}

// Browser reminders
function checkDueReminders() {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const reminders = readStore(STORAGE.reminders, []);
  const today = futureDate(0);

  allEvents
    .filter(event =>
      reminders.includes(String(event.id)) &&
      event.date === today
    )
    .forEach(event => {
      const key = `campusEvents_notified_${event.id}_${today}`;

      if (!localStorage.getItem(key)) {
        new Notification(`Today: ${event.title}`, {
          body: `${event.time} · ${event.venue}`
        });

        localStorage.setItem(key, "1");
      }
    });
}

// Click handlers
document.addEventListener("click", event => {
  const favorite = event.target.closest("[data-favorite]");

  if (favorite) {
    return toggleFavorite(favorite.dataset.favorite);
  }

  const register = event.target.closest("[data-register]");

  if (register) {
    return openRegistration(register.dataset.register);
  }

  const remind = event.target.closest("[data-remind]");

  if (remind) {
    return scheduleReminder(remind.dataset.remind);
  }

  const view = event.target.closest("[data-view]");

  if (view) {
    return setView(view.dataset.view);
  }

  const close = event.target.closest("[data-close-modal]");

  if (close) {
    return closeModal();
  }

  if (event.target.id === "registrationModal") {
    closeModal();
  }

  if (event.target.closest("[data-close-dashboard]")) {
    return closeDashboard();
  }

  if (event.target.id === "dashboardModal") {
    closeDashboard();
  }

  if (event.target.closest("[data-close-admin]")) {
    return closeAdmin();
  }

  if (event.target.id === "adminModal") {
    closeAdmin();
  }

  const cancel = event.target.closest("[data-cancel-registration]");

  if (cancel) {
    return cancelRegistration(cancel.dataset.cancelRegistration);
  }

  const edit = event.target.closest("[data-edit-event]");

  if (edit) {
    return editAdminEvent(edit.dataset.editEvent);
  }

  const deleteButton = event.target.closest("[data-delete-event]");

  if (deleteButton) {
    return deleteAdminEvent(deleteButton.dataset.deleteEvent);
  }

  const chip = event.target.closest("[data-category]");

  if (chip) {
    activeCategory = chip.dataset.category;
    activeView = "all";

    document.querySelectorAll(".chip").forEach(item => {
      item.classList.toggle("active", item === chip);
    });

    renderEvents();
  }

  if (event.target.closest("[data-dashboard-explore]")) {
    closeDashboard();
    setView("all");
  }
});

document.getElementById("searchInput").addEventListener("input", () => {
  activeView = activeView === "favorites" ? "favorites" : "all";
  renderEvents();
});

document.getElementById("categoryFilter").addEventListener("change", event => {
  activeCategory = event.target.value;
  activeView = "all";

  document.querySelectorAll(".chip").forEach(chip => {
    chip.classList.toggle(
      "active",
      chip.dataset.category === activeCategory
    );
  });

  renderEvents();
});

document.getElementById("sortFilter").addEventListener(
  "change",
  renderEvents
);

document.getElementById("clearFilters").addEventListener("click", () => {
  document.getElementById("searchInput").value = "";
  document.getElementById("categoryFilter").value = "All";
  document.getElementById("sortFilter").value = "soon";

  activeCategory = "All";
  activeView = "all";

  document.querySelectorAll(".chip").forEach(chip => {
    chip.classList.toggle("active", chip.dataset.category === "All");
  });

  renderEvents();
});

document.getElementById("resetSearch").addEventListener("click", () => {
  document.getElementById("clearFilters").click();
});

document.getElementById("registrationForm").addEventListener(
  "submit",
  registerEvent
);

document.getElementById("eventForm").addEventListener(
  "submit",
  saveAdminEvent
);

document.getElementById("cancelEdit").addEventListener(
  "click",
  clearAdminForm
);

document.getElementById("saveInterests").addEventListener(
  "click",
  saveInterests
);

document.getElementById("menuToggle").addEventListener("click", () => {
  const nav = document.getElementById("navLinks");
  const isOpen = nav.classList.toggle("show");

  document.getElementById("menuToggle").setAttribute(
    "aria-expanded",
    String(isOpen)
  );
});

document.querySelectorAll("#interestOptions input").forEach(input => {
  input.checked = readStore(STORAGE.interests, []).includes(input.value);
});

loadEvents().then(checkDueReminders);
