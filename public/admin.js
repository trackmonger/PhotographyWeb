// Admin UI updated to use session login instead of header-based password
let adminLoggedIn = false;
const loginBtn = document.getElementById('loginBtn');
const passwordInput = document.getElementById('password');
const adminArea = document.getElementById('adminArea');
const loginArea = document.getElementById('login');
const addForm = document.getElementById('addForm');
const photosDiv = document.getElementById('photos');

loginBtn.addEventListener('click', async () => {
  const password = passwordInput.value.trim();
  if (!password) return alert('Enter password');
  // Default username is 'admin' (can be changed on server via ADMIN_USER env)
  const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ username: 'admin', password }) });
  if (!res.ok) return alert('Login failed');
  adminLoggedIn = true;
  loginArea.style.display = 'none';
  adminArea.style.display = 'block';
  loadPhotos();
});

async function loadPhotos(){
  const res = await fetch('/api/photos');
  const photos = await res.json();
  photosDiv.innerHTML = '';
  photos.forEach(p => {
    const el = document.createElement('div');
    el.className = 'card';
    el.style.marginBottom = '8px';
    const img = document.createElement('img');
    img.src = p.src;
    img.style.height = '120px';
    img.alt = p.title || '';
    const title = document.createElement('div');
    title.textContent = p.title || '';
    const btn = document.createElement('button');
    btn.textContent = 'Delete';
    btn.addEventListener('click', () => removePhoto(p.id));
    el.appendChild(img);
    el.appendChild(title);
    el.appendChild(btn);
    photosDiv.appendChild(el);
  });
}

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!adminLoggedIn) return alert('Not logged in');
  const formData = new FormData(addForm);
  const res = await fetch('/api/photos', { method: 'POST', credentials: 'same-origin', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return alert('Failed to add photo: ' + (err.error || res.statusText));
  }
  addForm.reset();
  loadPhotos();
});

async function removePhoto(id){
  if (!confirm('Delete this photo?')) return;
  const res = await fetch('/api/photos/' + id, { method: 'DELETE', credentials: 'same-origin' });
  if (!res.ok) return alert('Failed to delete');
  loadPhotos();
}
