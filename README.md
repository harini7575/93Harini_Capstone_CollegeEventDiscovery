# Campus Events — College Event Discovery Platform

## Capstone Project Concept & Description
The Campus Events Discovery Platform is a centralized hub designed to bridge the gap between college event organizers and students. The application solves the problem of scattered campus communication by allowing student bodies, clubs, and administrators to post, update, and manage dynamic event listings. Students can seamlessly discover upcoming hackathons, cultural festivals, or academic seminars, register for them using their email credentials, and track their registrations. The platform utilizes a lightweight Node.js backend paired with an SQLite database to ensure quick setups and persistent local storage.

## Requirements
- Node.js 18 or later
- Internet connection for the optional QR-code library and Google Fonts

## Run the project
1. Extract the ZIP file.
2. Open the extracted `campus_events_project` folder in VS Code.
3. Open the terminal in that folder.
4. Run `npm install`
5. Run `npm start`
6. Open `http://localhost:3000` in your browser.

The SQLite database `events.db` is created automatically when the server starts. Sample events are inserted only when the events table is empty.

## Main API routes
- `GET /api/events` — list events
- `POST /api/events` — create an event
- `PUT /api/events/:id` — update an event
- `DELETE /api/events/:id` — delete an event
- `POST /api/register` — register a student
- `GET /api/registrations?email=student@example.com` — list registrations for an email
- `DELETE /api/registrations/:id` — cancel a registration
- `GET /api/health` — server health check

## Notes
- Favorites, selected interests and reminder preferences are stored in the current browser.
- Registration data and event data are stored in SQLite when the frontend is connected to the API.
- The admin screen is a demo interface, not protected by login. Add real authentication and authorization before deploying it publicly.
- Browser reminders can only be checked while the website is open; reliable scheduled notifications require a backend scheduler or push-notification service.

## Capstone Journey Day-by-Day Plan
* **Day 1:** Set up Git repository architecture, configure the root directory structure, and implement assignment milestone documentation in the README file.
* **Day 2:** Configure the Express backend server application framework and design the relational database schema tables inside SQLite.
* **Day 3:** Build structural RESTful API backend endpoint routes to securely process user registrations, event creation updates, and search listings.
* **Day 4:** Develop frontend template interfaces using semantic HTML elements, clean responsive CSS variables, and layout structures.
* **Day 5:** Connect interactive user dashboard forms with backend controller routes using JavaScript asynchronous network fetch calls.
* **Day 6:** Implement client-side notification tracking parameters and perform robust, comprehensive end-to-end local project validation testing.
