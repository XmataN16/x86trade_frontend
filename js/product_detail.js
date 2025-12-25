document.addEventListener("DOMContentLoaded", async function() {
  const productDetailContainer = document.getElementById("productDetailContainer");
  if (!productDetailContainer) return;

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");
  
  if (!productId) {
    productDetailContainer.innerHTML = `
      <div class="error_message">
        <p>ID товара не указан</p>
        <a href="catalog.html" class="btn secondary">Вернуться в каталог</a>
      </div>
    `;
    return;
  }

  try {
    const resp = await api.apiGet(`/api/products/${productId}/details`);
    // Передаем productId в функцию renderProductDetails
    renderProductDetails(productDetailContainer, resp, productId);
  } catch (err) {
    console.error("Error loading product details:", err);
    productDetailContainer.innerHTML = `
      <div class="error_message">
        <p>Ошибка при загрузке деталей товара: ${err.message || err}</p>
        <a href="catalog.html" class="btn secondary">Вернуться в каталог</a>
      </div>
    `;
  }
});

// Добавляем параметр productId в функцию renderProductDetails
function renderProductDetails(container, data, productId) {
  // Определяем правильную структуру данных
  let product, characteristics, reviews, averageRating;
  
  // Проверяем структуру ответа API в правильном регистре
  if (data.product) {
    product = data.product;
    characteristics = data.characteristics || [];
    reviews = data.reviews || [];
    averageRating = data.average_rating || 0;
  } 
  // Обрабатываем вариант с заглавной буквы (для обратной совместимости)
  else if (data.Product) {
    product = data.Product;
    characteristics = data.Characteristics || [];
    reviews = data.Reviews || [];
    averageRating = data.AverageRating || 0;
  } 
  else {
    // Если API возвращает данные в другом формате
    product = data;
    characteristics = data.characteristics || data.specs || [];
    reviews = data.reviews || [];
    averageRating = data.average_rating || data.rating || 0;
  }
  
  console.log("Rendered characteristics:", characteristics);
  console.log("Characteristics length:", characteristics.length);

  // Нормализуем путь к изображению с проверкой на наличие
  const imagePath = product.image_path || product.imagePath || product.image || './images/catalog_types/cpu.svg';
  const categoryName = product.category_name || product.category || 'Без категории';
  const description = product.description || product.desc || "Описание отсутствует";

  // Используем переданный productId как fallback для product.id
  const actualProductId = product.id || productId;

  let html = `
    <div class="product_detail">
      <div class="product_detail_main">
        <img src="${normalizeImageSrc(imagePath)}" class="product_detail_image" alt="${escapeHtml(product.name || 'Товар')}">
        <div class="product_detail_info">
          <h1 class="product_detail_title">${escapeHtml(product.name || 'Без названия')}</h1>
          <div class="product_detail_price">${formatPrice(product.price)}</div>
          <div class="product_detail_rating">
            <div class="rating_stars">${renderStars(averageRating)}</div>
            <span class="rating_count">(${reviews.length} отзывов)</span>
          </div>
          <div class="product_detail_category">
            Категория: ${escapeHtml(categoryName)}
          </div>
          <div class="product_detail_description">
            ${escapeHtml(description)}
          </div>
          <div class="product_detail_actions">
            <button class="btn primary add_to_cart_btn" 
                    data-id="${actualProductId}" 
                    data-name="${escapeHtml(product.name || 'Товар')}" 
                    data-price="${product.price || 0}">
              Добавить в корзину
            </button>
          </div>
        </div>
      </div>
      
      <div class="product_detail_tabs">
        <div class="product_detail_tab_header">
          <button class="tab_btn active" data-tab="characteristics">Характеристики</button>
          <button class="tab_btn" data-tab="reviews">Отзывы (${reviews.length})</button>
        </div>
        
        <div id="characteristics_tab" class="product_detail_tab_content active">
          ${renderCharacteristics(characteristics)}
        </div>
        
        <div id="reviews_tab" class="product_detail_tab_content">
          ${renderReviews(reviews, actualProductId)}
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Инициализация табов
  initTabs();

  // Обработчик добавления в корзину
  const addToCartBtn = container.querySelector('.add_to_cart_btn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', function() {
      const productId = parseInt(this.dataset.id);
      const name = this.dataset.name;
      const price = parseFloat(this.dataset.price);
      
      addToCart(productId, name, price);
    });
  }
}

function renderCharacteristics(characteristics) {
  console.log("Characteristics in render function:", characteristics);
  
  // Проверка на null и пустой массив
  if (!characteristics || characteristics === null || (Array.isArray(characteristics) && characteristics.length === 0)) {
    console.log("No characteristics found");
    return `<div class="empty_message">Характеристики отсутствуют</div>`;
  }
  
  // Если характеристики есть, но не являются массивом
  if (!Array.isArray(characteristics)) {
    console.warn("Characteristics is not an array:", characteristics);
    return `<div class="empty_message">Характеристики отсутствуют</div>`;
  }
  
  console.log("Rendering", characteristics.length, "characteristics");
  
  let html = `<table class="characteristics_table">`;
  characteristics.forEach((char, index) => {
    console.log(`Characteristic ${index}:`, char);
    
    // Поддерживаем разные форматы данных характеристик
    const name = char.characteristic_name || char.name || char.title || 'Характеристика';
    const value = char.value || char.characteristic_value || '';
    const unit = char.characteristic_unit || char.unit || '';
    
    html += `
      <tr>
        <td class="characteristic_name">${escapeHtml(name)}</td>
        <td class="characteristic_value">
          ${escapeHtml(value)} ${unit ? unit : ''}
        </td>
      </tr>
    `;
  });
  html += `</table>`;
  
  return html;
}

function renderReviews(reviews, productId) {
  let html = '';
  
  if (api.isAuthenticated()) {
    html += `
      <div class="review_form_container">
        <h3 class="section_subtitle">Оставить отзыв</h3>
        <form id="reviewForm" class="review_form">
          <input type="hidden" name="product_id" value="${productId}">
          <div class="form_group">
            <label class="form_label">Ваша оценка</label>
            <div class="rating_input">
              ${[5,4,3,2,1].map(num => `
                <input type="radio" id="star${num}" name="rating" value="${num}" required>
                <label for="star${num}" class="star_label">★</label>
              `).join('')}
            </div>
          </div>
          <div class="form_group">
            <label for="reviewComment" class="form_label">Ваш комментарий</label>
            <textarea id="reviewComment" name="comment" class="form_textarea" rows="4" 
                      placeholder="Напишите ваш отзыв о товаре..." required></textarea>
          </div>
          <button type="submit" class="btn primary">Отправить отзыв</button>
        </form>
      </div>
    `;
  } else {
    html += `
      <div class="login_prompt">
        <p>Чтобы оставить отзыв, необходимо <a href="#" onclick="showAuthModal('login'); return false;">авторизоваться</a></p>
      </div>
    `;
  }
  
  if (reviews.length === 0) {
    html += `<div class="empty_message">Отзывов пока нет. Будьте первым!</div>`;
  } else {
    html += `<div class="reviews_list">`;
    reviews.forEach(review => {
      // Поддерживаем разные форматы данных отзывов
      const userName = review.user_name || review.userName || review.user || 'Аноним';
      const rating = review.rating || 0;
      const comment = review.comment || 'Комментарий отсутствует';
      const createdAt = review.created_at || review.createdAt || new Date().toISOString();
      
      html += `
        <div class="review_card">
          <div class="review_header">
            <div class="review_author">${escapeHtml(userName)}</div>
            <div class="review_date">${formatDate(createdAt)}</div>
          </div>
          <div class="review_rating">
            ${renderStars(rating)}
          </div>
          <div class="review_text">${escapeHtml(comment)}</div>
        </div>
      `;
    });
    html += `</div>`;
  }
  
  return html;
}

function renderStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  let html = '';
  // Полные звезды
  for (let i = 0; i < fullStars; i++) {
    html += '★';
  }
  // Половинная звезда (можно заменить на CSS для визуального отображения)
  if (hasHalfStar) {
    html += '★'; // В реальном проекте используйте CSS для отображения половинки
  }
  // Пустые звезды
  for (let i = 0; i < emptyStars; i++) {
    html += '☆';
  }
  
  return html;
}

function initTabs() {
  const tabButtons = document.querySelectorAll('.tab_btn');
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Убираем active со всех кнопок
      tabButtons.forEach(btn => btn.classList.remove('active'));
      
      // Добавляем active к текущей кнопке
      this.classList.add('active');
      
      // Скрываем все табы
      document.querySelectorAll('.product_detail_tab_content').forEach(tab => {
        tab.classList.remove('active');
      });
      
      // Показываем нужный таб
      const tabId = this.dataset.tab + '_tab';
      const tabElement = document.getElementById(tabId);
      if (tabElement) {
        tabElement.classList.add('active');
      }
    });
  });
}

document.addEventListener('submit', function(e) {
  if (e.target && e.target.id === 'reviewForm') {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const reviewData = {
      product_id: parseInt(formData.get('product_id')),
      rating: parseInt(formData.get('rating')),
      comment: formData.get('comment').trim()
    };
    
    // Проверка данных перед отправкой
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      toast.error("Оценка должна быть от 1 до 5 звезд");
      return;
    }
    
    if (reviewData.comment.length < 10) {
      toast.error("Комментарий должен содержать минимум 10 символов");
      return;
    }
    
    submitReview(reviewData, form);
  }
});

async function submitReview(reviewData, form) {
  try {
    await api.apiPost("/api/reviews", reviewData);
    
    toast.success("Ваш отзыв успешно отправлен!");
    form.reset();
    
    // Перезагружаем детали товара
    const productId = reviewData.product_id;
    const resp = await api.apiGet(`/api/products/${productId}/details`);
    const reviewsTab = document.getElementById("reviews_tab");
    if (reviewsTab) {
      // Определяем правильную структуру данных
      const reviews = resp.reviews || (resp.product ? resp.product.reviews : []);
      reviewsTab.innerHTML = renderReviews(reviews, productId);
    }
  } catch (err) {
    console.error("Error submitting review:", err);
    toast.error("Ошибка при отправке отзыва: " + (err.message || err));
  }
}

// Функция добавления в корзину
function addToCart(productId, name, price) {
  const btn = {
    dataset: { id: productId, name: name, price: price },
    disabled: false,
    textContent: "Добавить в корзину"
  };
  
  // Используем уже существующую функцию из catalog.js
  if (typeof window.addToCart === 'function') {
    window.addToCart({ currentTarget: btn });
  } else {
    // Если функция не определена, делаем простой запрос к API
    api.apiPost("/api/cart", { product_id: productId, quantity: 1 })
      .then(() => {
        toast.success(`Товар "${name}" добавлен в корзину`);
        if (window.updateCartCount) window.updateCartCount();
      })
      .catch(err => {
        console.error("Add to cart error", err);
        toast.error("Ошибка добавления в корзину: " + (err.message || err));
      });
  }
}

// Вспомогательные функции
function normalizeImageSrc(imagePath) {
  if (!imagePath) return './images/catalog_types/cpu.svg';
  if (typeof imagePath !== 'string') return './images/catalog_types/cpu.svg';
  
  // Универсальная нормализация путей
  const defaultImg = './images/catalog_types/cpu.svg';
  const ip = String(imagePath).trim().replace(/\\/g, '/');
  const baseOrigin = window.location.origin;
  
  // Проверяем, если это уже полный URL
  if (/^https?:\/\//i.test(ip)) {
    return ip;
  }
  
  // Если путь начинается со слеша - абсолютный путь
  if (ip.startsWith('/')) {
    return baseOrigin + ip;
  }
  
  // Если путь начинается с images/ - относительный путь
  if (/^images\//i.test(ip)) {
    return baseOrigin + '/' + ip;
  }
  
  // Если это файловая система (Windows или file://)
  if (/^[a-zA-Z]:[\\/]/.test(ip) || /^file:\/\//i.test(ip) || ip.includes('\\')) {
    const base = ip.replace(/^.*[\\/]/, '');
    return `${baseOrigin}/images/products/${encodeURIComponent(base)}`;
  }
  
  // По умолчанию считаем, что это имя файла в папке images/products
  const base = ip.replace(/^.*[\\/]/, '');
  return `${baseOrigin}/images/products/${encodeURIComponent(base)}`;
}

function formatPrice(price) {
  if (price === undefined || price === null || isNaN(price)) return 'Цена не указана';
  return Number(price).toFixed(2) + " ₽";
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
}

// Функция добавления в корзину
async function addToCart(productId, name, price) {
  const addToCartBtn = document.querySelector('.add_to_cart_btn');
  if (!addToCartBtn) return;
  
  // Блокируем кнопку во время запроса
  addToCartBtn.disabled = true;
  addToCartBtn.textContent = "Добавление...";
  
  try {
    if (api.isAuthenticated()) {
      // Для авторизованных пользователей - добавляем в корзину на сервере
      await api.apiPost("/api/cart", { product_id: productId, quantity: 1 });
      toast.success(`Товар "${name}" добавлен в корзину`);
    } else {
      // Для гостей - добавляем в localStorage
      let cart = JSON.parse(localStorage.getItem("cart")) || [];
      const existing = cart.find(it => it.id === productId);
      
      if (existing) {
        existing.quantity += 1;
      } else {
        // Ищем изображение товара в деталях
        const imagePath = document.querySelector('.product_detail_image')?.src || './images/catalog_types/cpu.svg';
        cart.push({ 
          id: productId, 
          name, 
          price, 
          quantity: 1, 
          image: imagePath 
        });
      }
      
      localStorage.setItem("cart", JSON.stringify(cart));
      toast.success(`Товар "${name}" добавлен в корзину`);
    }
    
    // Обновляем счетчик товаров в корзине
    if (typeof window.updateCartCount === 'function') {
      window.updateCartCount();
    } else {
      // Если updateCartCount не определен, обновляем вручную
      updateCartCount();
    }
  } catch (err) {
    console.error("Add to cart error", err);
    toast.error("Ошибка добавления в корзину: " + (err.message || err));
  } finally {
    // Восстанавливаем кнопку
    addToCartBtn.disabled = false;
    addToCartBtn.textContent = "Добавить в корзину";
  }
}

// Функция обновления количества товаров в корзине (если нет в common.js)
async function updateCartCount() {
  try {
    if (api.isAuthenticated()) {
      const items = await api.apiGet("/api/cart");
      const totalItems = (items || []).reduce((s, it) => s + (it.quantity || 0), 0);
      renderCartBadge(totalItems);
    } else {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const totalItems = cart.reduce((s, it) => s + (it.quantity || 0), 0);
      renderCartBadge(totalItems);
    }
  } catch (e) {
    console.warn("Failed to load cart count", e);
  }
}

// Функция отображения количества товаров в корзине
function renderCartBadge(totalItems) {
  const cartContainer = document.querySelector('.cart-container');
  if (!cartContainer) return;
  
  // Удаляем старый badge если он есть
  const oldBadge = cartContainer.querySelector('.cart-badge');
  if (oldBadge) oldBadge.remove();
  
  if (totalItems > 0) {
    const badge = document.createElement('span');
    badge.className = 'cart-badge';
    badge.textContent = totalItems;
    cartContainer.appendChild(badge);
  }
}

