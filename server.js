const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const DATA_PATH = path.join(__dirname, 'data', 'photos.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/', express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage });

async function readPhotos() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

async function writePhotos(list) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(list, null, 2), 'utf8');
}

function checkAuth(req, res) {
  const pass = req.headers['x-admin-password'];
  if (!pass || pass !== ADMIN_PASSWORD) {
    res.status(401).json({ error: 'unauthorized' });
    return false;
  }
  return true;
}

app.get('/api/photos', async (req, res) => {
  const photos = await readPhotos();
  res.json(photos);
});

// Add a photo either via upload (multipart) or by providing imageUrl in body
app.post('/api/photos', upload.single('image'), async (req, res) => {
  if (!checkAuth(req, res)) return;

  const { title, description, price, imageUrl } = req.body;
  let src = imageUrl || null;
  if (req.file) {
    src = `/uploads/${req.file.filename}`;
  }
  if (!src) return res.status(400).json({ error: 'no image provided' });

  const photos = await readPhotos();
  const photo = {
    id: uuidv4(),
    title: title || '',
    description: description || '',
    price: price || '',
    src,
    created_at: new Date().toISOString()
  };
  photos.unshift(photo);
  await writePhotos(photos);
  res.json(photo);
});

app.delete('/api/photos/:id', async (req, res) => {
  if (!checkAuth(req, res)) return;
  const id = req.params.id;
  const photos = await readPhotos();
  const idx = photos.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const [removed] = photos.splice(idx, 1);
  // delete file if uploaded
  if (removed.src && removed.src.startsWith('/uploads/')) {
    const fp = path.join(__dirname, removed.src);
    fs.unlink(fp).catch(() => {});
  }
  await writePhotos(photos);
  res.json({ ok: true });
});

// Basic health
app.get('/api/ping', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  // ensure data file exists
  await writePhotos(await readPhotos());
  console.log(`Server running on http://localhost:${PORT}`);
});
