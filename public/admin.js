let adminPassword = '';
const loginBtn = document.getElementById('loginBtn');
const passwordInput = document.getElementById('password');
const adminArea = document.getElementById('adminArea');
const loginArea = document.getElementById('login');
const addForm = document.getElementById('addForm');
const photosDiv = document.getElementById('photos');

loginBtn.addEventListener('click', () => {
  adminPassword = passwordInput.value.trim();
  if (!adminPassword) return alert('Enter password');
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
  const formData = new FormData(addForm);
  const headers = { 'X-Admin-Password': adminPassword };
  const res = await fetch('/api/photos', { method: 'POST', headers, body: formData });
  if (!res.ok) return alert('Failed to add photo');
  addForm.reset();
  loadPhotos();
});

async function removePhoto(id){
  if (!confirm('Delete this photo?')) return;
  const res = await fetch('/api/photos/' + id, { method: 'DELETE', headers: { 'X-Admin-Password': adminPassword } });
  if (!res.ok) return alert('Failed to delete');
  loadPhotos();
}
