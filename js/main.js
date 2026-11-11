const MAX_GALLERY = 24;
const GALLERY_BATCH = 6;

let lightbox = null;

function probeImage(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(path);
    img.onerror = () => resolve(null);
    img.src = path;
  });
}

async function findByBase(base) {
  const jpg = await probeImage(`${base}.jpg`);
  if (jpg) return jpg;
  return probeImage(`${base}.png`);
}

async function loadLetter(folder) {
  return findByBase(`${folder}/thu`);
}

async function loadGallery(folder) {
  const images = [];
  for (let start = 1; start <= MAX_GALLERY; start += GALLERY_BATCH) {
    const indexes = [];
    for (let i = start; i < start + GALLERY_BATCH && i <= MAX_GALLERY; i += 1) {
      indexes.push(i);
    }
    const found = await Promise.all(indexes.map((i) => probeImage(`${folder}/${i}.jpg`)));
    for (let n = 0; n < found.length; n += 1) {
      if (found[n]) {
        images.push(found[n]);
        continue;
      }
      const png = await probeImage(`${folder}/${indexes[n]}.png`);
      if (!png) return images;
      images.push(png);
    }
  }
  return images;
}

function renderLetter(container, src, alt, folderName, priority) {
  container.replaceChildren();
  if (!src) {
    const hint = document.createElement('p');
    hint.className = 'empty-hint';
    hint.textContent = `Thêm ảnh bức thư vào ${folderName}, đặt tên thu.jpg hoặc thu.png.`;
    container.appendChild(hint);
    return;
  }
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.decoding = 'async';
  if (priority) img.fetchPriority = 'high';
  else img.loading = 'lazy';
  container.appendChild(img);
}

function renderGallery(container, images, folderName, lazy) {
  container.replaceChildren();
  if (!images.length) {
    const hint = document.createElement('p');
    hint.className = 'empty-hint';
    hint.textContent = `Thêm ảnh vào ${folderName}, đặt tên 1.jpg, 2.jpg, 3.jpg, ...`;
    container.appendChild(hint);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'photo-grid';
  images.forEach((src, index) => {
    const link = document.createElement('a');
    link.href = src;
    link.className = 'glightbox';
    link.dataset.gallery = folderName;
    const img = document.createElement('img');
    img.src = src;
    img.alt = `Ảnh ${index + 1}`;
    img.decoding = 'async';
    if (lazy) img.loading = 'lazy';
    link.appendChild(img);
    grid.appendChild(link);
  });
  container.appendChild(grid);
}

function setupLightbox() {
  if (lightbox) lightbox.destroy();
  lightbox = GLightbox({
    selector: '.glightbox',
    touchNavigation: true,
    loop: true,
    zoomable: true,
    draggable: true,
    openEffect: 'zoom',
    closeEffect: 'fade',
    slideEffect: 'slide',
  });
}

async function loadMedia() {
  const lettersReady = Promise.all([
    loadLetter('image1').then((src) => {
      renderLetter(document.getElementById('letter-1'), src, 'Bức thư phần 1', 'image1', true);
    }),
    loadLetter('image2').then((src) => {
      renderLetter(document.getElementById('letter-2'), src, 'Bức thư phần 2', 'image2', false);
    }),
  ]);
  const galleriesReady = Promise.all([
    loadGallery('image1').then((images) => {
      renderGallery(document.getElementById('gallery-1'), images, 'image1', false);
    }),
    loadGallery('image2').then((images) => {
      renderGallery(document.getElementById('gallery-2'), images, 'image2', true);
    }),
  ]);

  await lettersReady;
  await galleriesReady;
  setupLightbox();
}

function openEnvelope() {
  const overlay = document.getElementById('envelope-overlay');
  const content = document.getElementById('main-content');
  overlay.classList.add('open');
  setTimeout(() => {
    overlay.classList.add('fade-out');
    content.classList.add('show');
  }, 400);
}

document.getElementById('envelope-overlay').addEventListener('click', openEnvelope);

loadMedia();
