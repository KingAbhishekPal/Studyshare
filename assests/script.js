const subjectConfig = {
  math: { label: 'Mathematics', icon: 'MATH', badgeClass: 'badge-math', color: '#f5a623' },
  science: { label: 'Science', icon: 'SCI', badgeClass: 'badge-science', color: '#3a7bd5' },
  english: { label: 'English', icon: 'ENG', badgeClass: 'badge-english', color: '#e84393' },
  history: { label: 'History', icon: 'HIS', badgeClass: 'badge-history', color: '#9b72cf' },
  coding: { label: 'Coding', icon: 'CODE', badgeClass: 'badge-coding', color: '#1a6b3c' },
  geo: { label: 'Geography', icon: 'GEO', badgeClass: 'badge-geo', color: '#1565c0' }
};

let materials = [];
let activeFilter = 'all';
let bookmarks = JSON.parse(localStorage.getItem('studyshare-bookmarks') || '[]');
let usingFallbackData = false;

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.error || 'Request failed');
  }

  return data;
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getEmbeddedMaterials() {
  const fallbackNode = document.getElementById('fallbackStoreData');

  if (!fallbackNode) {
    return [];
  }

  try {
    const data = JSON.parse(fallbackNode.textContent);
    return Array.isArray(data.materials) ? data.materials : [];
  } catch (error) {
    console.error('Failed to parse embedded materials:', error);
    return [];
  }
}

function filterFallbackMaterials() {
  const search = getSearchValue();
  const searchPattern = search ? new RegExp(escapeRegExp(search), 'i') : null;
  const fallbackMaterials = getEmbeddedMaterials();

  return fallbackMaterials.filter((material) => {
    if (activeFilter !== 'all' && material.subject !== activeFilter) {
      return false;
    }

    if (!searchPattern) {
      return true;
    }

    return [
      material.title,
      material.desc,
      material.grade,
      material.author,
      material.subject
    ].some((field) => searchPattern.test(String(field || '')));
  });
}

function saveBookmarks() {
  localStorage.setItem('studyshare-bookmarks', JSON.stringify(bookmarks));
}

function getSearchValue() {
  return document.getElementById('heroSearch').value.trim();
}

async function loadMaterials() {
  const params = new URLSearchParams();
  const search = getSearchValue();

  if (activeFilter !== 'all') {
    params.set('subject', activeFilter);
  }

  if (search) {
    params.set('search', search);
  }

  try {
    const query = params.toString();
    const data = await apiFetch(`/api/materials${query ? `?${query}` : ''}`);

    usingFallbackData = false;
    materials = data.items;
    document.getElementById('resultInfo').textContent =
      data.filtered === data.total
        ? `Showing all ${data.total} materials`
        : `Showing ${data.filtered} of ${data.total} materials`;
    document.getElementById('totalCount').textContent = data.total;
    renderCards();
  } catch (error) {
    const fallbackMaterials = filterFallbackMaterials();
    const totalFallbackMaterials = getEmbeddedMaterials().length;

    usingFallbackData = true;
    materials = fallbackMaterials;
    document.getElementById('resultInfo').textContent =
      fallbackMaterials.length === totalFallbackMaterials
        ? `Showing all ${totalFallbackMaterials} materials`
        : `Showing ${fallbackMaterials.length} of ${totalFallbackMaterials} materials`;
    document.getElementById('totalCount').textContent = totalFallbackMaterials;
    renderCards();
  }
}

function renderCards() {
  const grid = document.getElementById('cardsGrid');
  grid.innerHTML = '';

  if (materials.length === 0) {
    const search = getSearchValue();
    grid.innerHTML = `<div class="empty-state"><div>SEARCH</div><p>No materials found${search ? ` for "<strong>${search}</strong>"` : ''}. Try a different search.</p></div>`;
    return;
  }

  materials.forEach((material, index) => {
    const subject = subjectConfig[material.subject] || {
      label: material.subject,
      icon: 'FILE',
      badgeClass: 'badge-default',
      color: '#1a6b3c'
    };
    const isSaved = bookmarks.some((item) => item.id === material.id);
    const card = document.createElement('div');

    card.className = 'material-card';
    card.style.setProperty('--card-color', subject.color);
    card.style.animationDelay = `${index * 0.06}s`;
    card.innerHTML = `
      <div class="card-subject-badge ${subject.badgeClass}">${subject.icon} ${subject.label}</div>
      <h3>${material.title}</h3>
      <p>${material.desc}</p>
      <div class="card-meta">
        <span class="card-grade">Level: ${material.grade}</span>
        <span class="card-downloads">Downloads: ${material.downloads}</span>
      </div>
      <div class="card-meta">
        <span class="card-grade">Author: ${material.author}</span>
      </div>
      <div class="card-actions">
        <button class="btn-download" onclick="downloadMaterial(${material.id}, this)">Download</button>
        <button class="btn-bookmark ${isSaved ? 'saved' : ''}" onclick="toggleBookmark(${material.id}, this)" title="Save for later">${isSaved ? 'Saved' : 'Save'}</button>
      </div>
    `;

    grid.appendChild(card);
  });
}

async function setFilter(filter, button) {
  activeFilter = filter;
  document.querySelectorAll('.filter-btn').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  await loadMaterials();
}

async function filterMaterials() {
  await loadMaterials();
}

async function clearSearch() {
  document.getElementById('heroSearch').value = '';
  await loadMaterials();
}

async function downloadMaterial(id, button) {
  if (usingFallbackData) {
    showToast('Start the server to enable downloads and save changes');
    return;
  }

  try {
    const material = await apiFetch(`/api/materials/${id}/download`, { method: 'POST' });
    button.textContent = 'Saved';
    button.style.background = '#2d8a52';

    setTimeout(() => {
      button.textContent = 'Download';
      button.style.background = '';
    }, 1800);

    showToast(`Saved "${material.title.substring(0, 30)}..."`);
    await loadMaterials();
  } catch (error) {
    showToast(error.message);
  }
}

function toggleBookmark(id, button) {
  const material = materials.find((item) => item.id === id);
  const bookmarkIndex = bookmarks.findIndex((item) => item.id === id);

  if (!material) {
    return;
  }

  if (bookmarkIndex === -1) {
    bookmarks.push(material);
    button.classList.add('saved');
    button.textContent = 'Saved';
    showToast('Added to saved materials');
  } else {
    bookmarks.splice(bookmarkIndex, 1);
    button.classList.remove('saved');
    button.textContent = 'Save';
    showToast('Removed from saved materials');
  }

  saveBookmarks();
  document.getElementById('bookmarkCount').textContent = bookmarks.length;
  renderBookmarkPanel();
}

function renderBookmarkPanel() {
  const body = document.getElementById('panelBody');

  if (bookmarks.length === 0) {
    body.innerHTML = '<div class="no-bookmarks">No saved materials yet.<br>Click Save on any card to bookmark it.</div>';
    return;
  }

  body.innerHTML = bookmarks
    .map((material) => {
      const subject = subjectConfig[material.subject] || {};
      return `<div class="bookmark-item">
        <h4>${subject.icon || 'FILE'} ${material.title}</h4>
        <p>${material.grade} · ${subject.label || material.subject}</p>
      </div>`;
    })
    .join('');
}

function openBookmarks(event) {
  event.preventDefault();
  document.getElementById('panelOverlay').classList.add('open');
  document.getElementById('sidePanel').classList.add('open');
}

function closeBookmarks() {
  document.getElementById('panelOverlay').classList.remove('open');
  document.getElementById('sidePanel').classList.remove('open');
}

function openModal(event) {
  if (event) {
    event.preventDefault();
  }

  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function handleOverlayClick(event) {
  if (event.target === document.getElementById('modalOverlay')) {
    closeModal();
  }
}

async function submitMaterial() {
  const title = document.getElementById('mTitle').value.trim();
  const subject = document.getElementById('mSubject').value;
  const grade = document.getElementById('mGrade').value;
  const desc = document.getElementById('mDesc').value.trim();
  const author = document.getElementById('mAuthor').value.trim() || 'Anonymous';

  if (!title || !subject || !grade || !desc) {
    showToast('Please fill in all required fields');
    return;
  }

  if (usingFallbackData) {
    showToast('Start the server to share new materials');
    return;
  }

  try {
    await apiFetch('/api/materials', {
      method: 'POST',
      body: JSON.stringify({ title, subject, grade, desc, author })
    });

    closeModal();
    ['mTitle', 'mDesc', 'mAuthor'].forEach((id) => {
      document.getElementById(id).value = '';
    });
    document.getElementById('mSubject').value = '';
    document.getElementById('mGrade').value = '';
    activeFilter = 'all';
    document.querySelectorAll('.filter-btn').forEach((button, index) => {
      button.classList.toggle('active', index === 0);
    });

    await loadMaterials();
    showToast('Your material has been shared with everyone');
  } catch (error) {
    showToast(error.message);
  }
}

async function sendContact() {
  const name = document.getElementById('cName').value.trim();
  const email = document.getElementById('cEmail').value.trim();
  const msg = document.getElementById('cMsg').value.trim();

  if (!name || !email || !msg) {
    showToast('Please fill in all contact fields');
    return;
  }

  if (usingFallbackData) {
    showToast('Start the server to send messages');
    return;
  }

  try {
    await apiFetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name, email, msg })
    });

    ['cName', 'cEmail', 'cMsg'].forEach((id) => {
      document.getElementById(id).value = '';
    });

    showToast("Message sent! We'll get back to you soon.");
  } catch (error) {
    showToast(error.message);
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

async function init() {
  document.getElementById('bookmarkCount').textContent = bookmarks.length;
  renderBookmarkPanel();

  try {
    await loadMaterials();
    if (usingFallbackData) {
      showToast('Showing saved materials from local page data');
    }
  } catch (error) {
    showToast('Failed to load materials from the server');
    console.error(error);
  }
}

init();
