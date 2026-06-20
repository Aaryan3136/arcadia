/* ═══════════════════════════════════════════
   main.js — App entry point
   Initializes everything, wires up all events
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {

  /* ─────────── DOM REFERENCES ─────────── */
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  const themeBtn = document.getElementById('theme-btn');
  const iconMoon = document.getElementById('icon-moon');
  const iconSun = document.getElementById('icon-sun');
  const searchInput = document.getElementById('search-input');
  const navSearchInput = document.getElementById('nav-search-input');
  const navSearchBtn = document.getElementById('nav-search-btn');
  const navSearchWrap = document.getElementById('nav-search-wrap');
  const filterTabs = document.querySelectorAll('.filter-tab');
  const sortSelect = document.getElementById('sort-select');
  const trendingGrid = document.getElementById('trending-grid');
  const animeGrid = document.getElementById('anime-grid');
  const gamesGrid = document.getElementById('games-grid');
  const loadMoreTrending = document.getElementById('load-more-trending');
  const modalContainer = document.getElementById('modal-container');
  const subscribeBtn = document.getElementById('subscribe-btn');
  const emailInput = document.getElementById('email-input');
  const successMsg = document.getElementById('subscribe-success');
  const headerEl = document.getElementById('header');
  const htmlEl = document.documentElement;

  /* ─────────── STATE ─────────── */
  let allItems = [];    // Combined games + anime
  let filteredItems = [];
  let activeFilter = 'all';
  let searchQuery = '';
  let sortBy = 'rating';
  let currentPage = 1;
  const PAGE_SIZE = 6;

  /* ═══════════════════════════════════════
     INIT — Load all data and render
  ═══════════════════════════════════════ */
  async function init() {
    // Show skeletons while loading
    trendingGrid.innerHTML = UI.buildSkeletons(6);
    animeGrid.innerHTML = UI.buildSkeletons(6);
    gamesGrid.innerHTML = UI.buildSkeletons(6);

    // Load anime from API + games from static data in parallel
    const [animeData] = await Promise.all([
      JikanAPI.fetchTopAnime(12),
    ]);

    // Combine all items
    allItems = [...animeData, ...GAMES];
    filteredItems = [...allItems];

    // Render each section
    renderTrending();
    renderAnimeSection(animeData);
    renderGamesSection(GAMES);

    // Post-render setup
    UI.initReveal();
    UI.animateCounters();
    applyTheme(localStorage.getItem('nexhub-theme') || 'dark');
    highlightActiveNavLink();
  }

  /* ─────────── RENDER FUNCTIONS ─────────── */

  function renderTrending() {
    const start = 0;
    const end = currentPage * PAGE_SIZE;
    const items = filteredItems.slice(start, end);

    trendingGrid.innerHTML = items.length
      ? items.map(UI.buildCard).join('')
      : `<p class="no-results">No results found. Try a different search! 🔍</p>`;

    loadMoreTrending.style.display = end < filteredItems.length ? 'flex' : 'none';

    // Rewire reveal after new cards are injected
    requestAnimationFrame(() => UI.initReveal());
    attachCardListeners(trendingGrid);
  }

  function renderAnimeSection(items) {
    animeGrid.innerHTML = items.map(UI.buildCard).join('');
    attachCardListeners(animeGrid);
    requestAnimationFrame(() => UI.initReveal());
  }

  function renderGamesSection(items) {
    gamesGrid.innerHTML = items.map(UI.buildCard).join('');
    attachCardListeners(gamesGrid);
    requestAnimationFrame(() => UI.initReveal());
  }

  /* ─────────── CARD CLICK → MODAL ─────────── */

  function attachCardListeners(container) {
    container.querySelectorAll('.card__view-btn, .card').forEach(el => {
      el.addEventListener('click', (e) => {
        // Prevent bubbling from button click triggering card click too
        const id = el.dataset.id || el.closest('.card')?.dataset.id;
        if (id) openModal(id);
      });
    });
    container.querySelectorAll(".card__fav-btn").forEach(btn => {

      btn.addEventListener("click", async (e) => {

        e.stopPropagation();

        const id = btn.dataset.id;

        const item = allItems.find(i => i.id == id);

        if (!item) return;


        try {
          await JikanAPI.addFavorite(item);

          UI.showToast("Favorite added ❤️", "success");

        } catch (error) {

          if (typeof UI !== "undefined") {
            UI.showToast(error.message, "info");
          }

        }

      });

    });
  }

  function openModal(id) {
    const item = allItems.find(i => i.id === id);
    if (!item) return;

    modalContainer.innerHTML = UI.buildModal(item);
    const favBtn = modalContainer.querySelector(".card__fav-btn");

    if (favBtn) {

      favBtn.addEventListener("click", async () => {

        try {

          await JikanAPI.addFavorite(item);

          UI.showToast("Favorite added ❤️", "success");

        } catch (error) {

          UI.showToast(error.message, "info");

        }

      });

    }
    modalContainer.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Close handlers
    document.getElementById('modal-close').addEventListener('click', closeModal);
    const deleteBtn = document.getElementById("delete-favorite-btn");

    if (deleteBtn) {

      deleteBtn.addEventListener("click", async () => {

        try {

          await JikanAPI.removeFavorite(id);

          UI.showToast("Favorite removed 🗑", "success");

          closeModal();

        } catch (error) {

          if (typeof UI !== "undefined") {
            UI.showToast(error.message, "info");
          }

        }

      });

    }
    document.getElementById('modal-backdrop').addEventListener('click', closeModal);
    document.addEventListener('keydown', handleModalKey);
  }

  function closeModal() {
    modalContainer.classList.remove('active');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleModalKey);
  }

  function handleModalKey(e) {
    if (e.key === 'Escape') closeModal();
  }

  /* ─────────── SEARCH ─────────── */
  let debounceTimer;

  function handleSearch(query) {
    searchQuery = query.toLowerCase().trim();
    currentPage = 1;
    applyFilters();
  }

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => handleSearch(searchInput.value), CONFIG.DEBOUNCE_MS);
  });

  /* ─────────── NAV SEARCH ─────────── */
  navSearchBtn.addEventListener('click', () => {
    navSearchWrap.classList.toggle('search-open');
    if (navSearchWrap.classList.contains('search-open')) {
      navSearchInput.focus();
    }
  });

  navSearchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      handleSearch(navSearchInput.value);
      // Sync main search input
      if (searchInput) searchInput.value = navSearchInput.value;
      // Smooth scroll to trending
      document.getElementById('trending')?.scrollIntoView({ behavior: 'smooth' });
    }, CONFIG.DEBOUNCE_MS);
  });

  /* ─────────── FILTER TABS ─────────── */
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      activeFilter = tab.dataset.filter;
      currentPage = 1;
      applyFilters();
    });
  });

  /* ─────────── SORT ─────────── */
  sortSelect?.addEventListener('change', () => {
    sortBy = sortSelect.value;
    applyFilters();
  });

  /* ─────────── FILTER LOGIC ─────────── */
  function applyFilters() {
    let result = allItems.filter(item => {
      const matchCat = activeFilter === 'all' || item.category === activeFilter;
      const matchSearch = item.title.toLowerCase().includes(searchQuery) ||
        (item.genres || []).some(g => g.toLowerCase().includes(searchQuery)) ||
        (item.studio || '').toLowerCase().includes(searchQuery);
      return matchCat && matchSearch;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'rating') return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
      if (sortBy === 'year') return (b.year || 0) - (a.year || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

    filteredItems = result;
    renderTrending();
  }

  /* ─────────── LOAD MORE ─────────── */
  loadMoreTrending?.addEventListener('click', () => {
    currentPage++;
    renderTrending();
    UI.showToast('Loaded more content!', 'success');
  });

  /* ─────────── HAMBURGER MENU ─────────── */
  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', e => {
    if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
    });
  });

  /* ─────────── THEME TOGGLE ─────────── */
  themeBtn.addEventListener('click', () => {
    const next = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('nexhub-theme', next);
    UI.showToast(`${next === 'dark' ? '🌙 Dark' : '☀️ Light'} mode activated`, 'info');
  });

  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    iconMoon.style.display = theme === 'dark' ? 'block' : 'none';
    iconSun.style.display = theme === 'dark' ? 'none' : 'block';
  }

  /* ─────────── SCROLL EFFECTS ─────────── */
  window.addEventListener('scroll', () => {
    // Header shadow
    headerEl.classList.toggle('header--scrolled', window.scrollY > 20);

    // Active nav link highlighting
    highlightActiveNavLink();
  }, { passive: true });

  function highlightActiveNavLink() {
    const sections = ['home', 'trending', 'anime', 'games', 'community', 'newsletter'];
    let current = '';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 100) current = id;
    });
    document.querySelectorAll('.nav__link').forEach(link => {
      link.classList.toggle('nav__link--active', link.getAttribute('href') === `#${current}`);
    });
  }

  /* ─────────── NEWSLETTER ─────────── */
  subscribeBtn?.addEventListener('click', handleSubscribe);
  emailInput?.addEventListener('keydown', e => { if (e.key === 'Enter') handleSubscribe(); });
  emailInput?.addEventListener('input', () => emailInput.classList.remove('error'));

  function handleSubscribe() {
    const email = emailInput.value.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
      emailInput.classList.add('error');
      emailInput.focus();
      UI.showToast('Please enter a valid email address', 'error');
      return;
    }
    emailInput.value = '';
    successMsg.hidden = false;
    UI.showToast('🎉 Subscribed! Welcome to Arcadia.', 'success');
    setTimeout(() => { successMsg.hidden = true; }, 5000);
  }

  /* ─────────── SMOOTH SCROLL ─────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ─────────── START ─────────── */
  await init();
});
