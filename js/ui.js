/* ═══════════════════════════════════════════
   ui.js — All UI rendering functions
   Cards, Modal, Skeletons, Toasts
   ═══════════════════════════════════════════ */

const UI = (() => {

  /* ── Card HTML builder ── */
  function buildCard(item) {
    const stars = buildStars(item.rating);
    const genreTags = (item.genres || []).slice(0, 3)
      .map(g => `<span class="genre-tag">${g}</span>`).join('');
    const badgeClass = item.category === 'anime' ? 'badge--anime' : 'badge--gaming';
    const badgeText = item.category === 'anime' ? '🎌 Anime' : '🎮 Gaming';
    const statusBadge = item.status ? `<span class="card__status">${item.status}</span>` : '';

    return `
      <article class="card reveal" data-id="${item.id}" data-category="${item.category}" data-title="${item.title.toLowerCase()}" data-rating="${item.rating}">
        <div class="card__cover">
          <img
            src="${item.image}"
            alt="${item.title}"
            loading="lazy"
            onerror="this.src='${item.fallbackImage || ''}'; this.onerror=null; this.closest('.card__cover').classList.add('no-img')"
          />
          <div class="card__overlay">
            <button class="card__view-btn" data-id="${item.id}" aria-label="View details for ${item.title}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              View Details
            </button>
          </div>
          <span class="card__badge ${badgeClass}">${badgeText}</span>
          ${statusBadge}
        </div>
        <div class="card__body">
          <h3 class="card__title">${item.title}</h3>
          <div class="card__rating-row">
            <div class="card__stars">${stars}</div>
            <span class="card__rating-num">${item.rating}</span>
          </div>
          <p class="card__desc">${item.description.slice(0, 100)}…</p>
          <div class="card__footer">
            <div class="card__genres">${genreTags}</div>
            <span class="card__year">${item.year}</span>
          </div>
        </div>
      </article>
    `;
  }

  /* ── Skeleton loading cards ── */
  function buildSkeletons(count = 6) {
    return Array(count).fill(`
      <div class="card skeleton">
        <div class="card__cover skeleton-block"></div>
        <div class="card__body">
          <div class="skeleton-line skeleton-line--title"></div>
          <div class="skeleton-line skeleton-line--short"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-line--short"></div>
        </div>
      </div>
    `).join('');
  }

  /* ── Modal HTML builder ── */
  function buildModal(item) {
    const isFavoritesPage =
      window.location.pathname.includes("favorites");
    const stars = buildStars(item.rating);
    const genreTags = (item.genres || [])
      .map(g => `<span class="genre-tag genre-tag--lg">${g}</span>`).join('');


    const metaItems = item.category === 'gaming'
      ? `
          <div class="modal__meta-item">
            <span class="modal__meta-label">Studio</span>
            <span class="modal__meta-val">${item.studio || '—'}</span>
          </div>
          <div class="modal__meta-item">
            <span class="modal__meta-label">Metacritic</span>
            <span class="modal__meta-val">${item.metacritic || '—'}</span>
          </div>
          <div class="modal__meta-item">
            <span class="modal__meta-label">Platforms</span>
            <span class="modal__meta-val">${(item.platforms || []).join(' · ')}</span>
          </div>
        `
      : `
          <div class="modal__meta-item">
            <span class="modal__meta-label">Studio</span>
            <span class="modal__meta-val">${item.studio || '—'}</span>
          </div>
          <div class="modal__meta-item">
            <span class="modal__meta-label">Episodes</span>
            <span class="modal__meta-val">${item.episodes || '—'}</span>
          </div>
          <div class="modal__meta-item">
            <span class="modal__meta-label">Status</span>
            <span class="modal__meta-val">${item.status || '—'}</span>
          </div>
        `;

    return `
      <div class="modal__backdrop" id="modal-backdrop"></div>
      <div class="modal__card" role="dialog" aria-modal="true" aria-label="${item.title} details">
        <button class="modal__close" id="modal-close" aria-label="Close modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="modal__image-wrap">
          <img src="${item.image}" alt="${item.title}" onerror="this.closest('.modal__image-wrap').classList.add('no-img')">
          <div class="modal__image-overlay"></div>
        </div>
        <div class="modal__content">
          <div class="modal__header">
            <div>
              <h2 class="modal__title">${item.title}</h2>
              <div class="modal__rating-row">
                <div class="modal__stars">${stars}</div>
                <span class="modal__rating-num">${item.rating} / 10</span>
                <span class="modal__year">${item.year}</span>
              </div>
            </div>
          </div>
          <div class="modal__genres">${genreTags}</div>
          <p class="modal__description">${item.description}</p>
          <div class="modal__meta">${metaItems}</div>
          <div class="modal__actions">
             ${!isFavoritesPage ? `
            <button class="card__fav-btn" data-id="${item.id}">
            ❤️ Add to Favorites 
            </button>
            ` : ''}
            <a href="${item.trailer}" target="_blank" rel="noopener" class="btn btn--primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              Watch Trailer
            </a>
            ${item.category === 'gaming'
        ? `<a href="https://store.steampowered.com/search/?term=${encodeURIComponent(item.title)}" target="_blank" rel="noopener" class="btn btn--ghost">View on Steam ↗</a>`
        : `<a href="https://myanimelist.net/search/all?q=${encodeURIComponent(item.title)}" target="_blank" rel="noopener" class="btn btn--ghost">View on MAL ↗</a>`
      }
          </div>
        </div>
      </div>
    `;
  }

  /* ── Toast notification ── */
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
    setTimeout(() => {
      toast.classList.remove('toast--visible');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  /* ── Star rating builder ── */
  function buildStars(rating) {
    if (!rating || rating === 'N/A') return '<span class="star-na">No rating</span>';
    const num = parseFloat(rating);
    const filled = Math.round(num / 2);
    const empty = 5 - filled;
    return '★'.repeat(filled) + '<span class="star-empty">' + '★'.repeat(empty) + '</span>';
  }

  /* ── Scroll reveal setup ── */
  function initReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  /* ── Animated counters ── */
  function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.done) {
          entry.target.dataset.done = 'true';
          const target = parseInt(entry.target.dataset.count);
          const duration = 1800;
          const start = performance.now();
          const update = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            entry.target.textContent = Math.floor(eased * target).toLocaleString() + (entry.target.dataset.suffix || '');
            if (progress < 1) requestAnimationFrame(update);
          };
          requestAnimationFrame(update);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => observer.observe(el));
  }

  return { buildCard, buildSkeletons, buildModal, showToast, initReveal, animateCounters };
})();
