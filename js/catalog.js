// js/catalog.js
// Полный рабочий файл каталога товаров.
// Зависимость: предпочтительно подключить js/api.js с функцией apiGet(path, params).
// Если apiGet не определён — создаём fallback, направляющий запросы на http://localhost:8080.

(function () {
  // --- Fallback apiGet (если не определён) ---
  if (typeof window.apiGet !== 'function') {
    window.apiGet = async function (path, params = {}) {
      const base = "http://localhost:8080";
      const url = new URL(base + path);
      Object.keys(params).forEach(k => {
        if (params[k] !== undefined && params[k] !== null && params[k] !== "") {
          url.searchParams.append(k, params[k]);
        }
      });
      const res = await fetch(url.toString(), { credentials: "same-origin" });
      if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
      return await res.json();
    };
    console.log("apiGet fallback enabled -> http://localhost:8080");
  }

  // --- Utilities ---
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

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]);
    });
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }

  // --- Image normalization ---
  // Возвращает URL к изображению, пригодный для вставки в src.
  function normalizeImageSrc(p) 
  {
    const defaultImg = './images/catalog_types/cpu.svg';
    if (!p || !p.image_path) return defaultImg;

    const ip = String(p.image_path).trim();
    const origin = getBaseOrigin();

    // already full http(s) URL
    if (/^https?:\/\//i.test(ip)) 
      {
      return ip;
    }

    // server-absolute path like "/images/..."
    if (ip.startsWith('/')) 
      {
      return origin ? origin + ip : ip;
    }

    // already looks like a frontend-relative path: "images/..." -> prepend origin
    if (/^images\//i.test(ip)) 
      {
      return origin ? origin + '/' + ip.replace(/^\//, '') : ip;
    }

    // file://C:/... or file:///D:/...
    if (/^file:\/\//i.test(ip)) 
      {
      const after = ip.replace(/^file:\/\//i, '');
      const base = basename(after);
      return origin ? `${origin}/images/products/${encodeURIComponent(base)}` : `images/products/${encodeURIComponent(base)}`;
    }

    // Windows absolute path C:\... or contains backslashes
    if (/^[a-zA-Z]:[\\/]/.test(ip) || ip.indexOf('\\') !== -1) 
      {
      const base = basename(ip);
      return origin ? `${origin}/images/products/${encodeURIComponent(base)}` : `images/products/${encodeURIComponent(base)}`;
    }

    if (ip.toLowerCase().startsWith('file://')) {
  const after = ip.replace(/^file:\/\//i, '');
  const base = basename(after);
  return `images/products/${encodeURIComponent(base)}`; // относительный путь
}

    // Other relative values: treat as filename or products/filename
    const base = basename(ip);
    return origin ? `${origin}/images/products/${encodeURIComponent(base)}` : `images/products/${encodeURIComponent(base)}`;
  }

  // --- Filters and state ---
  let currentFilters = { category_id: "", brand: "", priceMin: "", priceMax: "", q: "", limit: 50, offset: 0 };

  function buildQueryParams() {
    const params = {};
    if (currentFilters.category_id) params.category_id = currentFilters.category_id;
    if (currentFilters.brand) params.brand = currentFilters.brand;
    if (currentFilters.priceMin) params.min_price = currentFilters.priceMin;
    if (currentFilters.priceMax) params.max_price = currentFilters.priceMax;
    if (currentFilters.q) params.q = currentFilters.q;
    if (currentFilters.limit) params.limit = currentFilters.limit;
    if (currentFilters.offset) params.offset = currentFilters.offset;
    return params;
  }

  // --- DOM rendering ---
  function renderProductsGrid(products) {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;
    grid.innerHTML = "";
    if (!products || products.length === 0) {
      grid.innerHTML = '<p class="no_products_message">Товары по заданным фильтрам не найдены.</p>';
      return;
    }
    products.forEach(p => {
      const imgSrc = normalizeImageSrc(p);
      const card = document.createElement("div");
      card.className = "product_card";
      card.innerHTML = `
        <div class="product_image">
          <img src="${imgSrc}" alt="${escapeHtml(p.name || '')}" loading="lazy">
        </div>
        <div class="product_info">
          <h3 class="product_name">${escapeHtml(p.name || '')}</h3>
          <p class="product_meta">${escapeHtml(p.category_name || '')} • ${escapeHtml(p.manufacturer_name || '')}</p>
          <p class="product_price">${p.price} ₽</p>
          <button class="add_to_cart_btn" data-id="${p.id}" data-name="${escapeAttr(p.name || '')}" data-price="${p.price}">Добавить в корзину</button>
        </div>
      `;
      grid.appendChild(card);
    });
    // attach add-to-cart handlers (stub)
    document.querySelectorAll(".add_to_cart_btn").forEach(btn => btn.removeEventListener('click', addToCart));
    document.querySelectorAll(".add_to_cart_btn").forEach(btn => btn.addEventListener("click", addToCart));
  }

  // --- Loaders ---
  async function loadCategoriesToSelect() {
    try {
      const cats = await apiGet("/api/categories");
      const sel = document.getElementById("categoryFilter");
      if (!sel) return;
      sel.innerHTML = '<option value="">Все категории</option>' + cats.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
      // Если category_id в URL — устанавливаем
      const urlParams = new URLSearchParams(window.location.search);
      const cid = urlParams.get("category_id");
      if (cid) {
        currentFilters.category_id = cid;
        sel.value = cid;
      }
    } catch (err) {
      console.error("Failed load categories:", err);
      // не ломаем страницу — оставляем селект как есть
    }
  }

  async function loadAndRenderProducts() {
    try {
      const params = buildQueryParams();
      const products = await apiGet("/api/products", params);
      console.log("Loaded products:", Array.isArray(products) ? products.length : products);
      renderProductsGrid(products);
      // populate brandFilter based on returned products
      const brandFilter = document.getElementById("brandFilter");
      if (brandFilter) {
        const brands = Array.from(new Set(products.map(p => p.manufacturer_name).filter(Boolean)));
        brandFilter.innerHTML = '<option value="">Все производители</option>' + brands.map(b => `<option value="${escapeAttr(b)}">${escapeHtml(b)}</option>`).join("");
        if (currentFilters.brand) brandFilter.value = currentFilters.brand;
      }
    } catch (err) {
      console.error("Load products error:", err);
      const grid = document.getElementById("productsGrid");
      if (grid) grid.innerHTML = "<p>Ошибка загрузки товаров</p>";
    }
  }

  // --- Event handlers and init ---
  document.addEventListener("DOMContentLoaded", async () => {
    // init filters from URL (if any)
    const urlParams = new URLSearchParams(window.location.search);
    const cid = urlParams.get("category_id");
    if (cid) currentFilters.category_id = cid;

    await loadCategoriesToSelect();
    await loadAndRenderProducts();

    const categoryFilter = document.getElementById("categoryFilter");
    const brandFilter = document.getElementById("brandFilter");
    const priceMin = document.getElementById("priceMin");
    const priceMax = document.getElementById("priceMax");
    const clearBtn = document.getElementById("clearAllFiltersBtn");

    if (categoryFilter) categoryFilter.addEventListener("change", () => { currentFilters.category_id = categoryFilter.value; loadAndRenderProducts(); });
    if (brandFilter) brandFilter.addEventListener("change", () => { currentFilters.brand = brandFilter.value; loadAndRenderProducts(); });
    if (priceMin) priceMin.addEventListener("input", () => { currentFilters.priceMin = priceMin.value; loadAndRenderProducts(); });
    if (priceMax) priceMax.addEventListener("input", () => { currentFilters.priceMax = priceMax.value; loadAndRenderProducts(); });
    if (clearBtn) clearBtn.addEventListener("click", () => {
      currentFilters = { category_id: "", brand: "", priceMin: "", priceMax: "", q: "", limit: 50, offset: 0 };
      if (categoryFilter) categoryFilter.value = "";
      if (brandFilter) brandFilter.value = "";
      if (priceMin) priceMin.value = "";
      if (priceMax) priceMax.value = "";
      loadAndRenderProducts();
    });
  });

  // --- Stub / utility: addToCart ---
  function addToCart(e) {
    const btn = e.currentTarget;
    const id = btn.dataset.id;
    console.log("Add to cart:", id);
    // Реализуй логику добавления в корзину здесь
  }

  // Экспорт (если нужно)
  window.catalogUtils = {
    normalizeImageSrc,
    loadAndRenderProducts
  };
})();
