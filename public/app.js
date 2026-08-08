async function loadGallery(){
  const res = await fetch('/api/photos');
  const photos = await res.json();
  const main = document.getElementById('gallery');
  main.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'gallery container';
  photos.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    const img = document.createElement('img');
    img.src = p.src;
    img.alt = p.title || '';
    const h3 = document.createElement('h3');
    h3.textContent = p.title || '';
    const pdesc = document.createElement('p');
    pdesc.textContent = p.description || '';
    const price = document.createElement('p');
    price.textContent = p.price ? `Price: ${p.price}` : '';
    card.appendChild(img);
    card.appendChild(h3);
    card.appendChild(pdesc);
    card.appendChild(price);
    container.appendChild(card);
  });
  main.appendChild(container);
}

window.addEventListener('DOMContentLoaded', loadGallery);
