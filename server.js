const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const SQLiteStoreFactory = require('connect-sqlite3');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

const DATA_DIR = path.join(__dirname, 'db');
const DB_FILE = path.join(DATA_DIR, 'database.sqlite');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change_this';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/', express.static(path.join(__dirname, 'public')));

// Configure CORS to allow credentials if needed (useful for remote frontends)
app.use(cors({ origin: true, credentials: true }));

// Sessions (stored in SQLite)
const SQLiteStore = SQLiteStoreFactory(session);
app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.sqlite', dir: DATA_DIR }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' }
  })
);

// File uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage });

// DB setup
const db = new sqlite3.Database(DB_FILE);
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

async function initDb() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  // Create tables
  await dbRun(`CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    price TEXT,
    src TEXT,
    created_at TEXT
  )`);

  await dbRun(`CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password_hash TEXT,
    created_at TEXT
  )`);

  // Ensure admin user exists
  const user = await dbGet('SELECT * FROM users WHERE username = ?', [ADMIN_USER]);
  if (!user) {
    const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    await dbRun('INSERT INTO users(username, password_hash, created_at) VALUES(?,?,?)', [ADMIN_USER, hash, new Date().toISOString()]);
    console.log(`Created default admin user: ${ADMIN_USER}`);
  }
}

// Auth helpers
function requireAuth(req, res, next) {
  if (req.session && req.session.user === ADMIN_USER) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

// Public API
app.get('/api/photos', async (req, res) => {
  const photos = await dbAll('SELECT * FROM photos ORDER BY created_at DESC');
  res.json(photos);
});

// Admin auth endpoints
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
  if (!user) return res.status(401).json({ error: 'invalid credentials' });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  req.session.user = username;
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// Add a photo (requires auth)
app.post('/api/photos', requireAuth, upload.single('image'), async (req, res) => {
  const { title, description, price, imageUrl } = req.body;
  let src = imageUrl || null;
  if (req.file) src = `/uploads/${req.file.filename}`;
  if (!src) return res.status(400).json({ error: 'no image provided' });

  const id = uuidv4();
  const created_at = new Date().toISOString();
  await dbRun('INSERT INTO photos(id, title, description, price, src, created_at) VALUES(?,?,?,?,?,?)', [id, title || '', description || '', price || '', src, created_at]);
  const photo = await dbGet('SELECT * FROM photos WHERE id = ?', [id]);
  res.json(photo);
});

// Delete a photo (requires auth)
app.delete('/api/photos/:id', requireAuth, async (req, res) => {
  const id = req.params.id;
  const photo = await dbGet('SELECT * FROM photos WHERE id = ?', [id]);
  if (!photo) return res.status(404).json({ error: 'not found' });

  if (photo.src && photo.src.startsWith('/uploads/')) {
    const fp = path.join(__dirname, photo.src);
    fs.unlink(fp).catch(() => {});
  }

  await dbRun('DELETE FROM photos WHERE id = ?', [id]);
  res.json({ ok: true });
});

app.get('/api/ping', (req, res) => res.json({ ok: true }));

// Start
const PORT = process.env.PORT || 3000;
initDb().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}).catch(err => {
  console.error('Failed to initialize database', err);
  process.exit(1);
});
