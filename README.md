# PhotographyWeb

This is a lightweight photography showcase web application with a simple admin interface to add/remove photos and a booking information page.

Features
- Public gallery page showing photos, titles, descriptions, and price
- Booking page with contact information
- Admin interface (protected by X-Admin-Password header) to add photos (upload or by URL) and remove photos

Quick start

1. Install dependencies

   npm install

2. Start the server

   ADMIN_PASSWORD=yourpassword npm start

3. Open http://localhost:3000 in your browser.

Admin usage

- Visit /admin.html to open the admin UI. Enter the admin password (same as ADMIN_PASSWORD env) to add or remove photos.
- The server expects the admin password to be sent as an `X-Admin-Password` header on API requests.

Deployment notes

- Uploaded images are stored in the `uploads/` directory.
- Photos metadata is stored in `data/photos.json`.

Security

- This project uses a very simple password mechanism for demo purposes. For production, use HTTPS, stronger authentication, and store secrets securely.

License

GPL-3.0
