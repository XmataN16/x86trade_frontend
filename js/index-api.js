// js/index-api.js
// Загружает категории и выводит иконки (использует apiGet from js/api.js)

(function () {
  // helper: basename
  function basename(path) {
    if (!path) return '';
    return path.replace(/^.*[\\/]/, '');
  }

  function getBaseOrigin() {
    if (window.location && window.location.protocol && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
      return window.location.origin;
    }
    return '';
  }

  // Нормализатор аналогичный catalog.js — возвращает HTTP-friendly URL или относительный путь
  function normalizeCategoryImageSrc(imgPath) {
    const defaultImg = './images/catalog_types/cpu.svg';
    if (!imgPath) return defaultImg;
    const ip = String(imgPath).trim();
    const origin = getBaseOrigin();

    if (/^https?:\/\//i.test(ip)) return ip;
    if (ip.startsWith('/')) return origin ? origin + ip : ip;
    if (/^images\//i.test(ip)) return origin ? origin + '/' + ip.replace(/^\//, '') : ip;
    if (/^file:\/\//i.test(ip)) {
      const after = ip.replace(/^file:\/\//i, '');
      const base = basename(after);
      return origin ? `${origin}/images/categories/${encodeURIComponent(base)}` : `images/categories/${encodeURIComponent(base)}`;
    }
    if (/^[a-zA-Z]:[\\/]/.test(ip) || ip.indexOf('\\') !== -1) {
      const base = basename(ip);
      return origin ? `${origin}/images/categories/${encodeURIComponent(base)}` : `images/categories/${encodeURIComponent(base)}`;
    }
    // otherwise treat as filename
    const base = basename(ip);
    return origin ? `${origin}/images/categories/${encodeURIComponent(base)}` : `images/categories/${encodeURIComponent(base)}`;
  }

  async function initCategories() {
    const container = document.getElementById("categoriesContainer");
    if (!container) return;
    try {
      const categories = await apiGet("/api/categories");
      container.innerHTML = "";
      categories.forEach(cat => {
        const iconSrc = normalizeCategoryImageSrc(cat.image_path);
        const card = document.createElement("div");
        card.className = "catalog_types_card";
        card.innerHTML = `
          <div class="catalog_types_card_top">
            <a href="catalog.html?category_id=${cat.id}" class="catalog_types_card_img">
              <img src="${iconSrc}" alt="${escapeHtml(cat.name)}" onerror="this.src='./images/catalog_types/cpu.svg'">
            </a>
          </div>
          <div class="catalog_types_card_bottom">
            <a href="catalog.html?category_id=${cat.id}" class="catalog_types_card_title">${escapeHtml(cat.name)}</a>
          </div>
        `;
        container.appendChild(card);
      });
    } catch (err) {
      console.error("Failed to load categories:", err);
      container.innerHTML = "<p>Не удалось загрузить категории</p>";
    }
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  document.addEventListener("DOMContentLoaded", initCategories);
})();
