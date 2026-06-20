/* ═══════════════════════════════════════════
   api.js — Jikan (MyAnimeList) API Module
   Fetches live anime data. Falls back to
   ANIME_FALLBACK from data.js on any error.
   ═══════════════════════════════════════════ */

const JikanAPI = (() => {

  // Normalize raw Jikan response into our app's shape
  function normalizeAnime(item) {
    return {
      id: `mal-${item.mal_id}`,
      category: 'anime',
      title: item.title_english || item.title,
      image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
      rating: item.score ? parseFloat(item.score.toFixed(1)) : 'N/A',
      year: item.year || item.aired?.prop?.from?.year || 'N/A',
      studio: item.studios?.[0]?.name || 'Unknown Studio',
      episodes: item.episodes || '?',
      status: item.status || '',
      genres: item.genres?.map(g => g.name).slice(0, 3) || [],
      description: item.synopsis?.replace('[Written by MAL Rewrite]', '').trim() || 'No description available.',
      trailer: item.trailer?.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(item.title)}+trailer`,
      source: 'MAL',
      mal_id: item.mal_id,
    };
  }

  async function fetchTopAnime(limit = 12) {
    try {
      const res = await fetch(`${CONFIG.JIKAN_API}/top/anime?limit=${limit}&filter=bypopularity`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data.map(normalizeAnime);
    } catch (err) {
      console.warn('Jikan API unavailable, using fallback data.', err.message);
      return ANIME_FALLBACK;
    }
  }

  async function fetchCurrentlytAiring(limit = 12) {
    try {
      const res = await fetch(`${CONFIG.JIKAN_API}/top/anime?limit=${limit}&filter=airing`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data.map(normalizeAnime);
    } catch (err) {
      console.warn('Jikan API unavailable, using fallback data.', err.message);
      return ANIME_FALLBACK;
    }
  }
  async function addFavorite(item) {
    console.log(item);
    const user = Auth.getUser();
    try {
      const response = await fetch("https://arcadia-backend-moou.onrender.com/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: user._id,
          itemId: item.id,
          title: item.title,
          category: item.category
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error);
      }

      return data;

    } catch (error) {
      console.error("Error adding favorite:", error);
      throw error;
    }
  }
  async function removeFavorite(id) {

    try {

      const response = await fetch(`https://arcadia-backend-moou.onrender.com/favorites/${id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      return data;

    } catch (error) {

      console.error("Error removing favorite:", error);

      throw error;
    }
  }

  async function getFavorites() {

    try {

      const user = Auth.getUser();

      const response = await fetch(
        `https://arcadia-backend-moou.onrender.com/favorites/${user._id}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      return data;

    } catch (error) {

      console.error("Error fetching favorites:", error);

      throw error;

    }

  }

  return { fetchTopAnime, fetchCurrentlytAiring, addFavorite, removeFavorite, getFavorites };
})();
window.API = JikanAPI;
