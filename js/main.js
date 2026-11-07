const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const AUDIO_EXTS = ['mp3', 'm4a', 'wav', 'ogg', 'aac'];
const MAX_GALLERY = 40;
const cacheVersion = Date.now();

let lightbox = null;

function withVersion(path) {
  return `${path}?v=${cacheVersion}`;
}

function probeImage(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(withVersion(path));
    img.onerror = () => resolve(null);
    img.src = withVersion(path);
  });
}

function probeAudio(path) {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => resolve(withVersion(path));
    audio.onerror = () => resolve(null);
    audio.src = withVersion(path);
  });
}

async function findByBase(base, extensions, probe) {
  const found = await Promise.all(extensions.map((ext) => probe(`${base}.${ext}`)));
  return found.find(Boolean) || null;
}

async function loadLetter(folder) {
  return findByBase(`${folder}/thu`, IMAGE_EXTS, probeImage);
}

async function loadGallery(folder) {
  const images = [];
  for (let i = 1; i <= MAX_GALLERY; i += 1) {
    const found = await findByBase(`${folder}/${i}`, IMAGE_EXTS, probeImage);
    if (!found) break;
    images.push(found);
  }
  return images;
}

function renderLetter(container, src, alt, folderName) {
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
  container.appendChild(img);
}

function renderGallery(container, images, folderName) {
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
    link.appendChild(img);
    grid.appendChild(link);
  });
  container.appendChild(grid);
}

async function loadAudio() {
  const player = document.getElementById('player');
  const hint = document.getElementById('audio-hint');
  const src = await findByBase('audio/audio', AUDIO_EXTS, probeAudio);
  if (!src) {
    player.hidden = true;
    hint.hidden = false;
    return;
  }
  player.src = src;
  hint.hidden = true;
}

async function loadMedia() {
  const [letter1, photos1, letter2, photos2] = await Promise.all([
    loadLetter('image1'),
    loadGallery('image1'),
    loadLetter('image2'),
    loadGallery('image2'),
  ]);

  renderLetter(
    document.getElementById('letter-1'),
    letter1,
    'Bức thư phần 1',
    'image1'
  );
  renderGallery(document.getElementById('gallery-1'), photos1, 'image1');
  renderLetter(
    document.getElementById('letter-2'),
    letter2,
    'Bức thư phần 2',
    'image2'
  );
  renderGallery(document.getElementById('gallery-2'), photos2, 'image2');
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
  await loadAudio();
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
