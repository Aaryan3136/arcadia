/* ═══════════════════════════════════════════════════════
   favorites.js — Favorites page logic
   Used by: favorites.html only

   Data flow:
   1. index.html cards have a heart button (added to ui.js)
   2. Clicking heart saves/removes item ID in localStorage
   3. This file reads those IDs, finds the full item data,
      and renders the cards using the existing UI.buildCard()
   4. When backend is ready: replace localStorage reads with
      GET /api/favorites (authenticated endpoint)
   ═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {

  /* ── Auth guard ── */
  // If user is not logged in, redirect to login
  // Comment this out during development if needed
  // if (!window.Auth || !Auth.isLoggedIn()) {
  //   window.location.href = 'login.html';
  //   return;
  // }

  /* ── DOM references ── */
  const grid = document.getElementById('fav-grid');
  const controls = document.getElementById('fav-controls');
  const countBadge = document.getElementById('fav-count-badge');
  const countNum = document.getElementById('fav-count-num');
  const clearBtn = document.getElementById('clear-all-btn');
  const searchInput = document.getElementById('fav-search');
  const sortSelect = document.getElementById('fav-sort');
  const filterTabs = document.querySelectorAll('.filter-tab');
  const navBadge = document.getElementById('nav-fav-count');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  const themeBtn = document.getElementById('theme-btn');
  const iconMoon = document.getElementById('icon-moon');
  const iconSun = document.getElementById('icon-sun');

  /* ── State ── */
  let allFavorites = [];   // Full item objects
  let filtered = [];
  let activeFilter = 'all';
  let searchQuery = '';
  let sortBy = 'saved';
  let debounceTimer = null;

  /* ── Theme (shared with main.js via localStorage) ── */
  const htmlEl = document.documentElement;
  const applyTheme = (t) => {
    htmlEl.setAttribute('data-theme', t);
    if (iconMoon) iconMoon.style.display = t === 'dark' ? 'block' : 'none';
    if (iconSun) iconSun.style.display = t === 'dark' ? 'none' : 'block';
  };
  applyTheme(localStorage.getItem('nexhub-theme') || 'dark');
  themeBtn?.addEventListener('click', () => {
    const next = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('nexhub-theme', next);
  });

  /* ── Hamburger ── */
  hamburger?.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  /* ────────────────────────────────────────────────────
     FAVORITES DATA ACCESS
     readFavorites() — gets saved IDs from localStorage.
     When backend is ready, replace this with:
       fetch('/api/favorites', { headers: { Authorization: `Bearer ${token}` } })
     ──────────────────────────────────────────────────── */
  function readFavoriteIds() {
    try {
      return JSON.parse(localStorage.getItem('nexhub_favorites')) || [];
    } catch { return []; }
  }

  function writeFavoriteIds(ids) {
    localStorage.setItem('nexhub_favorites', JSON.stringify(ids));
  }

  async function removeFromFavorites(favoriteId) {

    try {

      await API.removeFavorite(favoriteId);

      allFavorites = allFavorites.filter(
        item => item.favoriteId !== favoriteId
      );

      applyFilters();
      updateCountDisplay();

      if (typeof UI !== 'undefined') {
        UI.showToast(
          'Removed from favorites',
          'info'
        );
      }

    } catch (error) {

      if (typeof UI !== 'undefined') {
        UI.showToast(
          error.message,
          'error'
        );
      }

    }

  }

  /* ────────────────────────────────────────────────────
     LOAD & RENDER
     Matches saved IDs against GAMES + ANIME_FALLBACK.
     When backend is ready: the API will return full objects.
     ──────────────────────────────────────────────────── */
  async function loadFavorites() {
    const favorites = await API.getFavorites();

    if (!favorites.length) {
      renderEmpty();
      return;
    }

    const savedIds = favorites.map(f => f.itemId);
    console.log("MongoDB favorites:", favorites);
    console.log("Saved IDs:", savedIds);

    // Fetch anime data (to match against saved IDs)
    let animeData = [];
    try {
      const res = await fetch(`${CONFIG.JIKAN_API}/top/anime?limit=24&filter=bypopularity`);
      const json = await res.json();
      animeData = json.data.map(item => ({
        id: `mal-${item.mal_id}`,
        category: 'anime',
        title: item.title_english || item.title,
        image: item.images?.jpg?.large_image_url || '',
        rating: item.score ? parseFloat(item.score.toFixed(1)) : 'N/A',
        year: item.year || 'N/A',
        studio: item.studios?.[0]?.name || 'Unknown',
        episodes: item.episodes || '?',
        status: item.status || '',
        genres: item.genres?.map(g => g.name).slice(0, 3) || [],
        description: item.synopsis?.replace('[Written by MAL Rewrite]', '').trim() || '',
        trailer: item.trailer?.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(item.title)}`,
      }));
    } catch {
      animeData = typeof ANIME_FALLBACK !== 'undefined' ? ANIME_FALLBACK : [];
    }

    const allItems = [
      ...(typeof GAMES !== 'undefined' ? GAMES : []),
      ...animeData,
    ];

    // Timestamps for "recently saved" sort
    let savedTimestamps = {};
    try {
      savedTimestamps = JSON.parse(localStorage.getItem('nexhub_fav_timestamps')) || {};
    } catch { }

    allFavorites = savedIds
      .map(id => {

        const item = allItems.find(i => i.id === id);
        if (!item) return null;

        const dbFavorite =
          favorites.find(f => f.itemId === id);

        return {
          ...item,
          favoriteId: dbFavorite._id,
          savedAt: savedTimestamps[id] || 0
        };

      })
      .filter(Boolean);
    console.log("allFavorites:", allFavorites);

    if (allFavorites.length === 0) {
      renderEmpty();
      return;
    }

    // Show controls
    controls.hidden = false;
    clearBtn.style.display = 'inline-flex';
    updateCountDisplay();
    applyFilters();
  }

  /* ────────────────────────────────────────────────────
     FILTER + SORT + SEARCH
     ──────────────────────────────────────────────────── */
  function applyFilters() {
    let result = allFavorites.filter(item => {
      const matchCat = activeFilter === 'all' || item.category === activeFilter;
      const matchSearch = item.title.toLowerCase().includes(searchQuery) ||
        (item.genres || []).some(g => g.toLowerCase().includes(searchQuery));
      return matchCat && matchSearch;
    });

    result.sort((a, b) => {
      if (sortBy === 'saved') return (b.savedAt || 0) - (a.savedAt || 0);
      if (sortBy === 'rating') return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

    filtered = result;
    renderGrid();
  }

  /* ────────────────────────────────────────────────────
     RENDER FUNCTIONS
     ──────────────────────────────────────────────────── */
  function renderGrid() {
    if (!filtered.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🔍</div>
          <h3 class="empty-state__title">No matches</h3>
          <p class="empty-state__sub">No saved items match your current filter. Try changing the category or search term.</p>
        </div>
      `;
      return;
    }

    // Use existing UI.buildCard but add a remove button
    grid.innerHTML = filtered.map(item => {
      const cardHtml = UI.buildCard(item);
      // Inject remove button before closing .card__cover div
      return cardHtml.replace(
        '</div>\n        <div class="card__body">',
        `  <button class="card__remove-btn" data-remove="${item.favoriteId}" aria-label="Remove ${item.title} from favorites">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Remove
          </button>
        </div>\n        <div class="card__body">`
      );
    }).join('');

    // Attach remove listeners
    grid.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Don't trigger card click / modal
        removeFromFavorites(btn.dataset.remove);
      });
    });

    // Attach modal listeners (reuse existing pattern)
    grid.querySelectorAll('.card__view-btn, .card').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-remove]')) return; // Don't open modal on remove click
        const id = el.dataset.id || el.closest('.card')?.dataset.id;
        if (id) openModal(id);
      });
    });

    requestAnimationFrame(() => {
      if (typeof UI !== 'undefined') UI.initReveal();
    });
  }

  function renderEmpty() {
    controls.hidden = true;
    clearBtn.style.display = 'none';
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">💔</div>
        <h3 class="empty-state__title">No favorites yet</h3>
        <p class="empty-state__sub">
          Browse trending anime and games, then click the ❤️ button on any card to save it here.
        </p>
        <a href="index.html#trending" class="btn btn--primary" style="margin-top:0.5rem;">
          Explore Trending →
        </a>
      </div>
    `;
    updateCountDisplay(0);
  }

  function updateCountDisplay(count = allFavorites.length) {
    if (countNum) countNum.textContent = count;
    if (navBadge) navBadge.textContent = count > 0 ? count : '';
    navBadge.style.display = count > 0 ? 'inline-flex' : 'none';
  }

  /* ── Modal ── */
  function openModal(id) {
    const item = allFavorites.find(i => i.id === id);
    if (!item || typeof UI === 'undefined') return;
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = UI.buildModal(item);
    modalContainer.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.getElementById('modal-close')?.addEventListener('click', closeModal);
    document.getElementById('modal-backdrop')?.addEventListener('click', closeModal);
    document.addEventListener('keydown', handleKey);
  }
  function closeModal() {
    document.getElementById('modal-container')?.classList.remove('active');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleKey);
  }
  function handleKey(e) { if (e.key === 'Escape') closeModal(); }

  /* ── Event listeners ── */
  searchInput?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = searchInput.value.toLowerCase().trim();
      applyFilters();
    }, 250);
  });

  sortSelect?.addEventListener('change', () => {
    sortBy = sortSelect.value;
    applyFilters();
  });

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      activeFilter = tab.dataset.filter;
      applyFilters();
    });
  });

  clearBtn?.addEventListener('click', () => {
    if (!confirm('Remove all favorites? This cannot be undone.')) return;
    writeFavoriteIds([]);
    allFavorites = [];
    renderEmpty();
    if (typeof UI !== 'undefined') UI.showToast('All favorites cleared', 'info');
  });

  /* ── Start ── */
  await loadFavorites();
});


/* ────────────────────────────────────────────────────────
   FAVORITES TOGGLE — called from index.html cards
   This function is globally accessible so ui.js can call it.
   ──────────────────────────────────────────────────────── */
window.FavoritesManager = {
  getIds() {
    try { return JSON.parse(localStorage.getItem('nexhub_favorites')) || []; }
    catch { return []; }
  },

  isSaved(id) {
    return this.getIds().includes(id);
  },

  toggle(id, title = '') {
    const ids = this.getIds();
    const idx = ids.indexOf(id);
    let timestamps = {};
    try { timestamps = JSON.parse(localStorage.getItem('nexhub_fav_timestamps')) || {}; } catch { }

    if (idx === -1) {
      ids.push(id);
      timestamps[id] = Date.now();
      localStorage.setItem('nexhub_favorites', JSON.stringify(ids));
      localStorage.setItem('nexhub_fav_timestamps', JSON.stringify(timestamps));
      return true; // added
    } else {
      ids.splice(idx, 1);
      delete timestamps[id];
      localStorage.setItem('nexhub_favorites', JSON.stringify(ids));
      localStorage.setItem('nexhub_fav_timestamps', JSON.stringify(timestamps));
      return false; // removed
    }
  },

  // Update all heart buttons on the page to reflect saved state
  syncButtons() {
    document.querySelectorAll('.card__fav-btn').forEach(btn => {
      const id = btn.dataset.favId;
      if (id) btn.classList.toggle('saved', this.isSaved(id));
    });
  },
};
