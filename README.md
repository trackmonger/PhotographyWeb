# PhotographyWeb

This repository now includes:
- SQLite-backed storage for photos and admin users
- Stronger admin authentication using username/password + server-side sessions
- Dockerfile and docker-compose for deployment

Quick start (local)

1. Install dependencies

   npm install

2. Start the server with an admin password (and optional admin username and session secret):

   ADMIN_USER=admin ADMIN_PASSWORD=yourpassword SESSION_SECRET=some-secret npm start

3. Open http://localhost:3000
   - Gallery: /
   - Booking: /booking.html
   - Admin: /admin.html (use the admin password you set)

Docker (recommended for deployment)

Build and run with Docker Compose:

  docker compose up --build -d

Environment variables (docker-compose.yml sets defaults; override as needed):
- ADMIN_USER - admin username (default: admin)
- ADMIN_PASSWORD - admin password (default: changeme)
- SESSION_SECRET - session secret (default: change_this)

Data persistence

- SQLite DB and uploads are persisted to the `db/` and `uploads/` directories (mounted as volumes in docker-compose).

Security notes

- Admin authentication is now username/password with bcrypt-hashed password and server-session cookies.
- For production, provide strong secrets and run behind HTTPS.

License: GPL-3.0
