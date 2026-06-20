/* ═══════════════════════════════════════════════════════
   nav.js — Shared navigation logic
   Runs on EVERY page. Load after auth.js.

   Responsibilities:
   1. Render correct nav state (logged-in vs logged-out)
   2. Profile dropdown toggle
   3. Favorites count badge (reads localStorage)
   4. Mobile menu with backdrop overlay
   5. Page transition on nav link clicks
   6. Active link highlighting based on current page

   HOW IT WORKS WITH EXISTING CODE:
   - auth.js exposes window.Auth (getUser, isLoggedIn, logout)
   - favorites.js exposes window.FavoritesManager
   - This file reads both and wires up the nav

   WHEN BACKEND IS READY:
   - Replace Auth.getUser() with an API call to /api/me
   - Replace FavoritesManager.getIds() with GET /api/favorites/count
   ═══════════════════════════════════════════════════════ */

(function NavModule() {
  'use strict';

  /* ─── SVG icon helpers ─────────────────────────────── */
  const icons = {
    heart: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    user:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    settings: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    logout: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    chevron: `<svg class="profile-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>`,
  };

  /* ─── Determine current page ────────────────────────── */
  function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('favorites')) return 'favorites';
    if (path.includes('login'))     return 'login';
    if (path.includes('signup'))    return 'signup';
    return 'home';
  }

  /* ─── Get favorites count from localStorage ─────────── */
  function getFavCount() {
    try {
      const ids = JSON.parse(localStorage.getItem('nexhub_favorites')) || [];
      return ids.length;
    } catch { return 0; }
  }

  /* ─── Build logged-out nav group HTML ───────────────── */
  function buildLoggedOutNav() {
    const div = document.createElement('div');
    div.className = 'nav-auth-out visible';
    div.id = 'nav-auth-out';
    div.innerHTML = `
      <a href="login.html"  class="btn btn--ghost  btn--sm">Sign In</a>
      <a href="signup.html" class="btn btn--primary btn--sm">Join Free</a>
    `;
    return div;
  }

  /* ─── Build logged-in nav group HTML ────────────────── */
  function buildLoggedInNav(user) {
    const count     = getFavCount();
    const initial   = (user.username || user.email || 'U')[0].toUpperCase();
    const hasItems  = count > 0;

    const div = document.createElement('div');
    div.className = 'nav-auth-in visible';
    div.id = 'nav-auth-in';
    div.innerHTML = `
      <!-- Favorites link with live count badge -->
      

      <!-- Profile dropdown -->
      <div class="nav-profile" id="nav-profile">
        <button
          class="profile-trigger"
          id="profile-trigger"
          aria-haspopup="true"
          aria-expanded="false"
          aria-controls="profile-menu"
          aria-label="Profile menu for ${user.username || 'user'}"
        >
          <div class="profile-avatar" aria-hidden="true">${initial}</div>
          <span class="profile-username">${user.username || user.email.split('@')[0]}</span>
          ${icons.chevron}
        </button>

        <div class="profile-menu" id="profile-menu" role="menu" aria-labelledby="profile-trigger">
          <!-- User info header -->
          <div class="profile-menu__header">
            <div class="profile-menu__name">${user.username || 'User'}</div>
            <div class="profile-menu__email">${user.email || ''}</div>
          </div>

          <!-- Menu items -->
          <div class="profile-menu__items">
            <a href="#" class="profile-menu__item" role="menuitem">
              ${icons.user}
              My Profile
              <span style="margin-left:auto;font-size:0.68rem;color:var(--txt-dim);">Soon</span>
            </a>

            <a href="favorites.html" class="profile-menu__item" role="menuitem" id="menu-fav-link">
              ${icons.heart}
              My Favorites
              <span class="profile-menu__badge" id="menu-fav-badge" ${!hasItems ? 'style="display:none"' : ''}>${count}</span>
            </a>

            <a href="#" class="profile-menu__item" role="menuitem">
              ${icons.settings}
              Settings
              <span style="margin-left:auto;font-size:0.68rem;color:var(--txt-dim);">Soon</span>
            </a>

            <div class="profile-menu__divider" role="separator"></div>

            <button class="profile-menu__item profile-menu__item--danger" role="menuitem" id="menu-logout-btn">
              ${icons.logout}
              Log Out
            </button>
          </div>
        </div>
      </div>
    `;
    return div;
  }

  /* ─── Profile dropdown toggle ───────────────────────── */
  function initProfileDropdown() {
    const trigger = document.getElementById('profile-trigger');
    const menu    = document.getElementById('profile-menu');
    if (!trigger || !menu) return;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.toggle('open');
      trigger.setAttribute('aria-expanded', String(isOpen));
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!document.getElementById('nav-profile')?.contains(e.target)) {
        menu.classList.remove('open');
        trigger?.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
      }
    });

    // Logout
    document.getElementById('menu-logout-btn')?.addEventListener('click', () => {
      // Page exit animation
      document.body.classList.add('page-exiting');
      setTimeout(() => {
        window.Auth?.logout();
        window.location.href = 'index.html';
      }, 200);
    });
  }

  /* ─── Update favorites badge count ─────────────────── */
  // Called externally when a card is favorited/unfavorited
  function updateFavBadge(newCount, animate = true) {
    const pill      = document.getElementById('nav-fav-pill');
    const menuBadge = document.getElementById('menu-fav-badge');

    if (pill) {
      const hadItems = pill.classList.contains('has-items');
      pill.textContent = newCount > 0 ? newCount : '';
      pill.classList.toggle('has-items', newCount > 0);

      // Pop animation only when count increases
      if (animate && newCount > 0 && !hadItems) {
        pill.classList.remove('pop');
        void pill.offsetWidth; // force reflow
        pill.classList.add('pop');
        setTimeout(() => pill.classList.remove('pop'), 400);
      }
    }

    if (menuBadge) {
      menuBadge.textContent = newCount;
      menuBadge.style.display = newCount > 0 ? '' : 'none';
    }

    // Update aria-label
    document.getElementById('nav-fav-link')
      ?.setAttribute('aria-label', `My favorites, ${newCount} saved`);
  }

  // Expose so favorites.js can call it after toggle
  window.NavModule = { updateFavBadge };

  /* ─── Mobile menu with backdrop ─────────────────────── */
  function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks  = document.getElementById('nav-links');
    if (!hamburger || !navLinks) return;

    // Create backdrop element
    const backdrop = document.createElement('div');
    backdrop.className = 'mobile-backdrop';
    backdrop.id = 'mobile-backdrop';
    document.body.appendChild(backdrop);

    function openMenu() {
      navLinks.classList.add('open');
      hamburger.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      backdrop.classList.add('visible');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      backdrop.classList.remove('visible');
      document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.contains('open') ? closeMenu() : openMenu();
    });

    backdrop.addEventListener('click', closeMenu);

    // Close on nav link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ─── Active link highlighting ───────────────────────── */
  function highlightActiveLinks() {
    const currentPage = getCurrentPage();
    const linkMap = {
      home:      ['/', 'index.html'],
      favorites: ['favorites.html'],
      login:     ['login.html'],
      signup:    ['signup.html'],
    };

    document.querySelectorAll('.nav__link').forEach(link => {
      const href = link.getAttribute('href') || '';
      const isActive = (linkMap[currentPage] || []).some(p => href.includes(p)) ||
                       (currentPage === 'home' && (href === 'index.html' || href === '#home' || href === '/'));
      link.classList.toggle('nav__link--active', isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
    });
  }

  /* ─── Page exit transition ────────────────────────────── */
  function initPageTransitions() {
    // Intercept all internal navigation links
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      // Only internal HTML pages (not anchors, not external)
      if (!href || href.startsWith('#') || href.startsWith('http') ||
          href.startsWith('//') || href.startsWith('mailto')) return;
      if (!href.endsWith('.html') && !href.match(/^\w/)) return;

      link.addEventListener('click', (e) => {
        // Don't intercept if modifier key held (open in new tab etc.)
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;

        e.preventDefault();
        document.body.classList.add('page-exiting');
        const destination = link.getAttribute('href');
        setTimeout(() => {
          window.location.href = destination;
        }, 180);
      });
    });
  }

  /* ─── Render nav auth state ──────────────────────────── */
  function renderNavAuthState() {
    // Find the theme button (it's the reference point in .nav__actions)
    const themeBtn    = document.getElementById('theme-btn');
    const navActions  = themeBtn?.parentElement;
    if (!navActions) return;

    // Remove any previously injected auth groups
    document.getElementById('nav-auth-out')?.remove();
    document.getElementById('nav-auth-in')?.remove();

    const user = window.Auth?.getUser();

    if (user) {
      // Logged in: inject profile dropdown + favorites badge
      const inGroup = buildLoggedInNav(user);
      navActions.insertBefore(inGroup, themeBtn);
      initProfileDropdown();
    } else {
      // Logged out: inject Sign In + Join Free
      const outGroup = buildLoggedOutNav();
      navActions.insertBefore(outGroup, themeBtn);
    }
  }

  /* ─── Main init ─────────────────────────────────────── */
  function init() {
    renderNavAuthState();
    highlightActiveLinks();
    initMobileMenu();
    initPageTransitions();
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
